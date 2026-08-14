import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

// Found 2026-08-13: neither merge-themes (whole-theme duplicates) nor
// purge-themes (whole off-topic themes) catches problems INSIDE an
// otherwise-legitimate theme — e.g. a "Local healthcare provider
// recommendations" theme with a municipal power-outage complaint attached
// (a genuine misclassification, not a duplicate), or the same Facebook post
// captured twice with Opus wording it slightly differently each time (so
// the exact-text dedup in the capture route doesn't catch it). This checks
// per-theme, at the signal level.
const SENSE_CHECK_TOOL: Anthropic.Tool = {
  name: "sense_check_theme",
  description:
    "Review a theme's signals against the theme's own label/description. Flag any signal that clearly isn't about this theme's topic at all (misattached — e.g. a power outage complaint under a healthcare-recommendations theme), and group any signals that describe the exact same underlying post or need, just reworded (near-duplicates — most often the same screenshot captured and uploaded more than once, extracted slightly differently each time). Be conservative: only flag what's clearly wrong, not merely loosely related.",
  input_schema: {
    type: "object",
    properties: {
      misattached_signal_ids: {
        type: "array",
        items: { type: "string" },
        description: "Signal ids that are clearly not about this theme's topic at all.",
      },
      duplicate_groups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            signal_ids: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              description: "2+ signal ids describing the exact same underlying post/need, just worded differently.",
            },
            reasoning: { type: "string" },
          },
          required: ["signal_ids", "reasoning"],
        },
      },
    },
    required: ["misattached_signal_ids", "duplicate_groups"],
  },
};

type ThemeSignal = { id: string; rawText: string; timestamp: Date };
type ThemeCheckInput = { id: string; label: string; description: string | null; signals: ThemeSignal[] };

export type SenseCheckProposal = {
  themeId: string;
  themeLabel: string;
  misattached: { signalId: string; text: string }[];
  duplicateGroups: {
    keepId: string;
    keepText: string;
    removeIds: string[];
    removeTexts: string[];
    reasoning: string;
  }[];
};

async function checkTheme(theme: ThemeCheckInput): Promise<SenseCheckProposal | null> {
  if (theme.signals.length < 2) return null;

  const signalList = theme.signals.map((s) => `- id: ${s.id}\n  text: "${s.rawText}"`).join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    tools: [SENSE_CHECK_TOOL],
    tool_choice: { type: "tool", name: "sense_check_theme" },
    messages: [
      {
        role: "user",
        content: `Theme: "${theme.label}" — ${theme.description ?? "(no description)"}\n\nSignals attached to this theme:\n${signalList}\n\nReview per the tool's instructions.`,
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("model did not return a tool call");

  const input = toolUse.input as {
    misattached_signal_ids: string[];
    duplicate_groups: { signal_ids: string[]; reasoning: string }[];
  };
  const signalById = new Map(theme.signals.map((s) => [s.id, s]));

  const misattached = (input.misattached_signal_ids ?? [])
    .filter((id) => signalById.has(id))
    .map((id) => ({ signalId: id, text: signalById.get(id)!.rawText }));

  const duplicateGroups = (input.duplicate_groups ?? [])
    .filter((g) => g.signal_ids.length >= 2 && g.signal_ids.every((id) => signalById.has(id)))
    .map((g) => {
      // Keep the most recently captured one — arbitrary but consistent
      // tiebreak, same reasoning as mergeThemes.ts picking a survivor.
      const sorted = g.signal_ids
        .map((id) => signalById.get(id)!)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const [keep, ...remove] = sorted;
      return {
        keepId: keep.id,
        keepText: keep.rawText,
        removeIds: remove.map((s) => s.id),
        removeTexts: remove.map((s) => s.rawText),
        reasoning: g.reasoning,
      };
    });

  if (misattached.length === 0 && duplicateGroups.length === 0) return null;

  return { themeId: theme.id, themeLabel: theme.label, misattached, duplicateGroups };
}

// Capped and one-off/user-triggered (not run on every cron tick) — this
// tool exists partly *because* of a token-cost conversation, so it
// shouldn't itself become a silent recurring cost. Ordered by lastSeenAt so
// the most currently-active themes (most likely to have picked up a fresh
// duplicate or misattachment) get checked first; re-run to cover more.
const THEME_SCAN_CAP = 40;
const SIGNALS_PER_THEME_CAP = 60;
const CONCURRENCY = 6;

export async function proposeSenseCheck(
  regionId: string
): Promise<{ proposals: SenseCheckProposal[]; errors: string[] }> {
  const themes = await prisma.theme.findMany({
    where: { regionId, status: "active" },
    select: { id: true, label: true, description: true },
    orderBy: { lastSeenAt: "desc" },
    take: THEME_SCAN_CAP,
  });

  const proposals: SenseCheckProposal[] = [];
  const errors: string[] = [];

  for (let i = 0; i < themes.length; i += CONCURRENCY) {
    const batch = themes.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (theme) => {
        try {
          const signals = await prisma.signal.findMany({
            where: { themeId: theme.id, signalType: { in: ["demand", "supply", "unclear"] } },
            select: { id: true, rawText: true, timestamp: true },
            take: SIGNALS_PER_THEME_CAP,
          });
          return { proposal: await checkTheme({ ...theme, signals }), error: null };
        } catch (err) {
          return {
            proposal: null,
            error: `Theme "${theme.label}": ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      })
    );
    for (const r of results) {
      if (r.proposal) proposals.push(r.proposal);
      if (r.error) errors.push(r.error);
    }
  }

  return { proposals, errors };
}

// Misattached signals get unhooked (themeId/signalType/nature reset to
// null) rather than deleted — they're real de-identified captures, just
// homed wrong; resetting lets the normal classification pipeline re-attach
// them correctly (or mark them irrelevant) on the next cron run. Duplicate
// signals get deleted outright — they're genuinely redundant, and leaving
// them inflates demand counts/gap scores for no reason.
export async function applySenseCheck(
  misattachedSignalIds: string[],
  duplicateRemoveSignalIds: string[]
): Promise<{ misattachedFixed: number; duplicatesRemoved: number; errors: string[] }> {
  const errors: string[] = [];
  let misattachedFixed = 0;
  let duplicatesRemoved = 0;

  if (misattachedSignalIds.length > 0) {
    try {
      const result = await prisma.signal.updateMany({
        where: { id: { in: misattachedSignalIds } },
        data: { themeId: null, signalType: null, nature: null },
      });
      misattachedFixed = result.count;
    } catch (err) {
      errors.push(`Resetting misattached signals failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (duplicateRemoveSignalIds.length > 0) {
    try {
      const result = await prisma.signal.deleteMany({ where: { id: { in: duplicateRemoveSignalIds } } });
      duplicatesRemoved = result.count;
    } catch (err) {
      errors.push(`Removing duplicate signals failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { misattachedFixed, duplicatesRemoved, errors };
}
