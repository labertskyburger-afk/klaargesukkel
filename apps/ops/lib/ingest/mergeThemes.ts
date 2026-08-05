import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

const MERGE_TOOL: Anthropic.Tool = {
  name: "propose_theme_merges",
  description:
    "Identify groups of 2 or more existing themes that represent the same underlying demand/need and should be merged into one. Only group themes that are clearly duplicates or trivial rewordings of the same thing — do not merge themes that are merely related or in the same broad category but describe genuinely different needs.",
  input_schema: {
    type: "object",
    properties: {
      merge_groups: {
        type: "array",
        items: {
          type: "object",
          properties: {
            theme_ids: {
              type: "array",
              items: { type: "string" },
              minItems: 2,
              description: "The exact ids of 2+ themes that are the same underlying need.",
            },
            canonical_label: { type: "string", description: "A short (3-8 word) label for the merged theme." },
            canonical_description: {
              type: "string",
              description: "One sentence describing the underlying need, for the merged theme.",
            },
            canonical_category: { type: "string", description: "A short category tag for the merged theme." },
            reasoning: {
              type: "string",
              description: "One sentence: why these themes are the same underlying need.",
            },
          },
          required: [
            "theme_ids",
            "canonical_label",
            "canonical_description",
            "canonical_category",
            "reasoning",
          ],
        },
      },
    },
    required: ["merge_groups"],
  },
};

const NORMALIZE_TOOL: Anthropic.Tool = {
  name: "normalize_categories",
  description:
    "Cluster a list of theme category labels into canonical categories — group labels that describe the same real-world category despite different wording (e.g. 'consumer protection' and 'consumer protection and electronics services' belong together). Every input label must appear exactly once, mapped to a canonical category string — reuse the identical canonical string for every label in the same group.",
  input_schema: {
    type: "object",
    properties: {
      mappings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string", description: "One of the exact input category labels, verbatim." },
            canonical: { type: "string", description: "The canonical category label this belongs to." },
          },
          required: ["original", "canonical"],
        },
      },
    },
    required: ["mappings"],
  },
};

// Category is free text the classifier invents per new theme, not a fixed
// taxonomy — it drifts ("consumer protection" / "consumer protection and
// electronics services" / "consumer protection and home services" are
// almost certainly one real category worded three ways). proposeThemeMerges
// only compares themes within the same category bucket, so uncorrected
// drift silently hides real duplicates from ever being compared to each
// other — found 2026-08-05 when three near-identical "social clubs for
// newcomers" themes each landed in a different category and a merge scan
// came back clean. This clusters the distinct category strings down to
// canonical ones before bucketing — one cheap call, not chunked, since even
// a few hundred themes rarely produce more than ~100 distinct category
// strings. Falls back to an identity mapping (no normalization) on failure
// rather than aborting the whole scan.
async function normalizeCategories(categories: string[]): Promise<Map<string, string>> {
  if (categories.length < 2) return new Map(categories.map((c) => [c, c]));

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      tools: [NORMALIZE_TOOL],
      tool_choice: { type: "tool", name: "normalize_categories" },
      messages: [
        {
          role: "user",
          content: `Here are ${categories.length} distinct category labels currently in use:\n\n${categories
            .map((c) => `- ${c}`)
            .join("\n")}\n\nCluster them into canonical categories per the tool's instructions. Every label above must appear exactly once in your output.`,
        },
      ],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) throw new Error("model did not return a tool call");

    const input = toolUse.input as { mappings: { original: string; canonical: string }[] };
    const map = new Map<string, string>();
    for (const { original, canonical } of input.mappings ?? []) {
      if (categories.includes(original)) map.set(original, canonical);
    }
    // Any label the model dropped from its output falls back to itself, so
    // it still gets scanned — just not merged with a differently-worded
    // sibling this run.
    for (const c of categories) {
      if (!map.has(c)) map.set(c, c);
    }
    return map;
  } catch (err) {
    console.error("normalizeCategories failed, falling back to raw categories:", err);
    return new Map(categories.map((c) => [c, c]));
  }
}

export type MergeGroupProposal = {
  themeIds: string[];
  themeLabels: string[];
  signalCounts: number[];
  canonicalLabel: string;
  canonicalDescription: string;
  canonicalCategory: string;
  reasoning: string;
};

type ThemeRow = { id: string; label: string; description: string | null; category: string | null };

async function proposeMergesWithin(
  themes: ThemeRow[],
  countByThemeId: Map<string, number>
): Promise<MergeGroupProposal[]> {
  if (themes.length < 2) return [];

  const themeList = themes
    .map(
      (t) =>
        `- id: ${t.id}\n  label: ${t.label}\n  category: ${t.category ?? "uncategorized"}\n  description: ${t.description ?? "(none)"}\n  signals: ${countByThemeId.get(t.id) ?? 0}`
    )
    .join("\n");

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8192,
    tools: [MERGE_TOOL],
    tool_choice: { type: "tool", name: "propose_theme_merges" },
    messages: [
      {
        role: "user",
        content: `Here are ${themes.length} existing themes for this region (already narrowed to one category, or "uncategorized"):\n\n${themeList}\n\nIdentify groups of themes that are clearly duplicates or trivial rewordings of the same underlying need, per the tool's instructions. Be conservative — only merge when you're confident they're the same thing, not just related.`,
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("model did not return a tool call");

  const input = toolUse.input as {
    merge_groups: {
      theme_ids: string[];
      canonical_label: string;
      canonical_description: string;
      canonical_category: string;
      reasoning: string;
    }[];
  };
  const themeById = new Map(themes.map((t) => [t.id, t]));

  return (input.merge_groups ?? [])
    .filter((g) => g.theme_ids.length >= 2 && g.theme_ids.every((id) => themeById.has(id)))
    .map((g) => ({
      themeIds: g.theme_ids,
      themeLabels: g.theme_ids.map((id) => themeById.get(id)!.label),
      signalCounts: g.theme_ids.map((id) => countByThemeId.get(id) ?? 0),
      canonicalLabel: g.canonical_label,
      canonicalDescription: g.canonical_description,
      canonicalCategory: g.canonical_category,
      reasoning: g.reasoning,
    }));
}

// One-time cleanup tool, not part of the regular ingest pipeline — built
// 2026-08-03 after fixing the theme-fragmentation bug in classify.ts
// (a 100-theme recency cap made older themes invisible during
// classification, so duplicates kept getting created instead of attached).
// That fix stops new duplicates; this proposes merges for the hundreds
// already created. Review-then-apply, not automatic — see
// applyThemeMerges below.
//
// Chunked by category (parallel calls) rather than one call across every
// theme — with hundreds of themes, a single call risked Vercel's 60s
// function timeout and a large-enough merge_groups response to strain
// max_tokens. Duplicates almost always share a category already (the
// classifier assigns one alongside label/description), so this misses
// only cross-category duplicates, which are rare in practice.
export async function proposeThemeMerges(
  regionId: string
): Promise<{ groups: MergeGroupProposal[]; errors: string[] }> {
  const themes = await prisma.theme.findMany({
    where: { regionId, status: "active" },
    select: { id: true, label: true, description: true, category: true },
  });

  if (themes.length < 2) return { groups: [], errors: [] };

  const signalCounts = await prisma.signal.groupBy({
    by: ["themeId"],
    where: { themeId: { in: themes.map((t) => t.id) } },
    _count: true,
  });
  const countByThemeId = new Map(signalCounts.map((s) => [s.themeId as string, s._count]));

  const distinctCategories = Array.from(
    new Set(themes.map((t) => t.category).filter((c): c is string => !!c))
  );
  const categoryMap = await normalizeCategories(distinctCategories);

  const byCategory = new Map<string, ThemeRow[]>();
  for (const t of themes) {
    const key = t.category ? categoryMap.get(t.category) ?? t.category : "(uncategorized)";
    const bucket = byCategory.get(key) ?? [];
    bucket.push(t);
    byCategory.set(key, bucket);
  }

  const results = await Promise.all(
    Array.from(byCategory.entries()).map(async ([category, bucket]) => {
      try {
        return { groups: await proposeMergesWithin(bucket, countByThemeId), error: null };
      } catch (err) {
        return {
          groups: [] as MergeGroupProposal[],
          error: `Category "${category}" (${bucket.length} themes): ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    })
  );

  return {
    groups: results.flatMap((r) => r.groups),
    errors: results.map((r) => r.error).filter((e): e is string => e !== null),
  };
}

export type ConfirmedMergeGroup = {
  themeIds: string[];
  canonicalLabel: string;
  canonicalDescription: string;
  canonicalCategory: string;
};

// Applies confirmed merge groups: the theme with the most signals in each
// group survives (relabeled to the canonical text), every other theme's
// signals get reassigned to it, and the redundant theme rows are deleted.
export async function applyThemeMerges(
  groups: ConfirmedMergeGroup[]
): Promise<{ merged: number; signalsReassigned: number; errors: string[] }> {
  let merged = 0;
  let signalsReassigned = 0;
  const errors: string[] = [];

  for (const group of groups) {
    if (group.themeIds.length < 2) continue;

    try {
      const counts = await Promise.all(
        group.themeIds.map(async (id) => ({
          id,
          count: await prisma.signal.count({ where: { themeId: id } }),
        }))
      );
      counts.sort((a, b) => b.count - a.count);
      const survivorId = counts[0].id;
      const otherIds = counts.slice(1).map((c) => c.id);

      const reassigned = await prisma.signal.updateMany({
        where: { themeId: { in: otherIds } },
        data: { themeId: survivorId },
      });
      signalsReassigned += reassigned.count;

      await prisma.theme.update({
        where: { id: survivorId },
        data: {
          label: group.canonicalLabel,
          description: group.canonicalDescription,
          category: group.canonicalCategory,
          lastSeenAt: new Date(),
        },
      });

      await prisma.theme.deleteMany({ where: { id: { in: otherIds } } });
      merged++;
    } catch (err) {
      // Don't let one malformed/stale group (e.g. a theme already merged
      // by an earlier group in this same batch) abort the rest.
      errors.push(
        `Group "${group.canonicalLabel}": ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { merged, signalsReassigned, errors };
}
