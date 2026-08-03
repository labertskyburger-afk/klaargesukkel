import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

const RELEVANCE_TOOL: Anthropic.Tool = {
  name: "judge_theme_relevance",
  description:
    "For each theme, judge whether it represents a genuine Durbanville-area (Cape Town, South Africa) local business/service need or gap — versus general news, national/international politics, or any topic not tied to a specific local demand someone in Durbanville actually has. Flag themes that are clearly off-topic general news content, not real local demand signal.",
  input_schema: {
    type: "object",
    properties: {
      judgments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            theme_id: { type: "string" },
            irrelevant: {
              type: "boolean",
              description:
                "True if this is general news/politics/national content, not a genuine Durbanville-area local need.",
            },
            reasoning: {
              type: "string",
              description: "Required when irrelevant is true — one sentence why.",
            },
          },
          required: ["theme_id", "irrelevant"],
        },
      },
    },
    required: ["judgments"],
  },
};

export type IrrelevantThemeProposal = {
  themeId: string;
  label: string;
  category: string | null;
  signalCount: number;
  reasoning: string;
};

type ThemeRow = { id: string; label: string; description: string | null; category: string | null };

// Independent per-theme judgment (unlike duplicate-detection, no cross-theme
// comparison needed), so a simple fixed-size batch is enough — no need for
// category chunking here.
const BATCH_SIZE = 50;

async function judgeBatch(
  themes: ThemeRow[],
  countByThemeId: Map<string, number>
): Promise<IrrelevantThemeProposal[]> {
  const themeList = themes
    .map(
      (t) =>
        `- id: ${t.id}\n  label: ${t.label}\n  category: ${t.category ?? "uncategorized"}\n  description: ${t.description ?? "(none)"}\n  signals: ${countByThemeId.get(t.id) ?? 0}`
    )
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    tools: [RELEVANCE_TOOL],
    tool_choice: { type: "tool", name: "judge_theme_relevance" },
    messages: [
      {
        role: "user",
        content: `Here are ${themes.length} existing themes for EyeSpy, a tool that finds Durbanville-area (Cape Town, South Africa) local business/service demand gaps:\n\n${themeList}\n\nJudge each one's relevance per the tool's instructions. Most themes should be genuinely local (e.g. "reliable plumber in Durbanville") — only flag ones that are clearly general news/politics/national topics with no specific local-demand angle.`,
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("model did not return a tool call");

  const input = toolUse.input as {
    judgments: { theme_id: string; irrelevant: boolean; reasoning?: string }[];
  };
  const themeById = new Map(themes.map((t) => [t.id, t]));

  return (input.judgments ?? [])
    .filter((j) => j.irrelevant && themeById.has(j.theme_id))
    .map((j) => {
      const theme = themeById.get(j.theme_id)!;
      return {
        themeId: j.theme_id,
        label: theme.label,
        category: theme.category,
        signalCount: countByThemeId.get(j.theme_id) ?? 0,
        reasoning: j.reasoning ?? "",
      };
    });
}

// One-time cleanup, built 2026-08-03 alongside the classify.ts relevance
// gate — general national/international news from the broad RSS sources
// (IOL, Daily Maverick, GroundUp News) was being themed as if it were
// local Durbanville demand. The classify.ts fix stops this going forward;
// this proposes purging the themes already created from it. Review-then-
// apply, not automatic — see applyThemePurge below.
export async function proposeIrrelevantThemes(
  regionId: string
): Promise<{ proposals: IrrelevantThemeProposal[]; errors: string[] }> {
  const themes = await prisma.theme.findMany({
    where: { regionId, status: "active" },
    select: { id: true, label: true, description: true, category: true },
  });

  if (themes.length === 0) return { proposals: [], errors: [] };

  const signalCounts = await prisma.signal.groupBy({
    by: ["themeId"],
    where: { themeId: { in: themes.map((t) => t.id) } },
    _count: true,
  });
  const countByThemeId = new Map(signalCounts.map((s) => [s.themeId as string, s._count]));

  const batches: ThemeRow[][] = [];
  for (let i = 0; i < themes.length; i += BATCH_SIZE) {
    batches.push(themes.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.all(
    batches.map(async (batch, idx) => {
      try {
        return { proposals: await judgeBatch(batch, countByThemeId), error: null };
      } catch (err) {
        return {
          proposals: [] as IrrelevantThemeProposal[],
          error: `Batch ${idx + 1} (${batch.length} themes): ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    })
  );

  return {
    proposals: results.flatMap((r) => r.proposals),
    errors: results.map((r) => r.error).filter((e): e is string => e !== null),
  };
}

// Deletes both the theme and its signals entirely — orphaning signals
// (leaving them with themeId null) would just let them sit as inert
// clutter, since signalType is already set from their original
// classification and so they'd never get picked up for reclassification.
// These are general news snippets, not personal data, so outright
// deletion carries no retention concern.
export async function applyThemePurge(
  themeIds: string[]
): Promise<{ purged: number; signalsDeleted: number; errors: string[] }> {
  let purged = 0;
  let signalsDeleted = 0;
  const errors: string[] = [];

  for (const themeId of themeIds) {
    try {
      const deleted = await prisma.signal.deleteMany({ where: { themeId } });
      signalsDeleted += deleted.count;
      await prisma.theme.delete({ where: { id: themeId } });
      purged++;
    } catch (err) {
      errors.push(`Theme ${themeId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { purged, signalsDeleted, errors };
}
