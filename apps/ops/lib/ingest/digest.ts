import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { computeRegionGapScores, type ThemeGapScore } from "./gapScore";
import { isoWeekLabel } from "./trends";

const client = new Anthropic();

const TOP_CLEAR_GAPS = 8;
const TOP_RISING = 6;
const TOP_WATCH = 10;
const EXAMPLES_PER_THEME = 3;

type ThemeInput = {
  score: ThemeGapScore;
  label: string;
  category: string | null;
  description: string | null;
  examples: string[];
};

const DIGEST_TOOL: Anthropic.Tool = {
  name: "write_digest",
  description:
    "Write the EyeSpy demand-signal digest: for each Clear gap theme, explain why it looks like a real gap and give a build-worthiness verdict; for each Rising but crowded theme, a brief differentiation note; and a cross-theme rollup note only if several themes clearly overlap into one bigger opportunity.",
  input_schema: {
    type: "object",
    properties: {
      clear_gaps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            theme_id: { type: "string" },
            why_gap: {
              type: "string",
              description:
                "1-2 sentences: what the supply_ratio and trend say about why this looks like a real, relatively unmet need — not just a popular topic.",
            },
            verdict: {
              type: "string",
              enum: ["practical_klaargesukkel_fit", "too_big_or_regulated_or_niche"],
            },
            verdict_reason: {
              type: "string",
              description: "One sentence explaining the verdict.",
            },
          },
          required: ["theme_id", "why_gap", "verdict", "verdict_reason"],
        },
      },
      rising_crowded: {
        type: "array",
        items: {
          type: "object",
          properties: {
            theme_id: { type: "string" },
            note: {
              type: "string",
              description:
                "One sentence: real, growing demand but crowded with existing competitors — note what differentiation angle (if any) might work, or say plainly if there isn't one.",
            },
          },
          required: ["theme_id", "note"],
        },
      },
      rollup_note: {
        type: ["string", "null"],
        description:
          "A short paragraph if several Clear gap / Rising themes are really one bigger opportunity (e.g. 'plumber', 'geyser repair', and 'leak detection' might really be one 'home emergency repairs' opportunity). Null if nothing meaningfully overlaps — don't force it.",
      },
    },
    required: ["clear_gaps", "rising_crowded"],
  },
};

function formatTheme(input: ThemeInput): string {
  const { score, label, category, description, examples } = input;
  return [
    `- theme_id: ${score.themeId}`,
    `  label: ${label}`,
    `  category: ${category ?? "uncategorized"}`,
    description ? `  description: ${description}` : null,
    `  gap_score: ${score.gapScore.toFixed(2)}`,
    `  supply_ratio: ${(score.supplyRatio * 100).toFixed(0)}%`,
    `  trend: ${score.trendDirection} (${score.demandPeriodCount} this period)`,
    `  demand signals (all-time): ${score.demandTotalCount}, supply signals: ${score.supplyCount}`,
    examples.length > 0
      ? `  example demand signals:\n${examples.map((e) => `    - "${e}"`).join("\n")}`
      : "  (no example signals available)",
  ]
    .filter(Boolean)
    .join("\n");
}

async function examplesFor(themeId: string): Promise<string[]> {
  const signals = await prisma.signal.findMany({
    where: { themeId, signalType: "demand" },
    orderBy: { timestamp: "desc" },
    take: EXAMPLES_PER_THEME,
    select: { rawText: true },
  });
  return signals.map((s) => s.rawText);
}

export async function generateDigest(regionId: string, generatedBy: "scheduled" | "manual") {
  const scores = await computeRegionGapScores(regionId);
  const themes = await prisma.theme.findMany({
    where: { id: { in: scores.map((s) => s.themeId) } },
  });
  const themeById = new Map(themes.map((t) => [t.id, t]));

  const clearGapScores = scores
    .filter((s) => s.bucket === "clear_gap")
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, TOP_CLEAR_GAPS);
  const risingScores = scores
    .filter((s) => s.bucket === "rising_crowded")
    .sort((a, b) => b.demandVolume - a.demandVolume)
    .slice(0, TOP_RISING);
  const watchScores = scores
    .filter((s) => s.bucket === "watch")
    .sort((a, b) => b.demandTotalCount - a.demandTotalCount);
  const dormantCount = scores.filter((s) => s.bucket === "dormant").length;

  const clearGapInputs: ThemeInput[] = await Promise.all(
    clearGapScores.map(async (score) => {
      const theme = themeById.get(score.themeId)!;
      return {
        score,
        label: theme.label,
        category: theme.category,
        description: theme.description,
        examples: await examplesFor(score.themeId),
      };
    })
  );
  const risingInputs: ThemeInput[] = await Promise.all(
    risingScores.map(async (score) => {
      const theme = themeById.get(score.themeId)!;
      return {
        score,
        label: theme.label,
        category: theme.category,
        description: theme.description,
        examples: await examplesFor(score.themeId),
      };
    })
  );

  let clearGapWrites: {
    theme_id: string;
    why_gap: string;
    verdict: string;
    verdict_reason: string;
  }[] = [];
  let risingWrites: { theme_id: string; note: string }[] = [];
  let rollupNote: string | null = null;

  // Only call Claude if there's actually something to write about — an
  // empty digest doesn't need a model call.
  if (clearGapInputs.length > 0 || risingInputs.length > 0) {
    const prompt = [
      "Clear gap candidates (ranked by gap_score, confidence already gated):",
      clearGapInputs.length > 0 ? clearGapInputs.map(formatTheme).join("\n\n") : "(none)",
      "",
      "Rising but crowded (real demand, low supply_ratio):",
      risingInputs.length > 0 ? risingInputs.map(formatTheme).join("\n\n") : "(none)",
      "",
      "For each Clear gap theme, write why_gap and a build-worthiness verdict. For each Rising but crowded theme, write a one-sentence note. Scan across all of the above for any overlap that's really one bigger opportunity and note it in rollup_note (or null if nothing overlaps).",
    ].join("\n");

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      tools: [DIGEST_TOOL],
      tool_choice: { type: "tool", name: "write_digest" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) throw new Error("generateDigest: model did not return a tool call");

    const input = toolUse.input as {
      clear_gaps: typeof clearGapWrites;
      rising_crowded: typeof risingWrites;
      rollup_note: string | null;
    };
    clearGapWrites = input.clear_gaps ?? [];
    risingWrites = input.rising_crowded ?? [];
    rollupNote = input.rollup_note ?? null;
  }

  const writeByThemeId = new Map(clearGapWrites.map((w) => [w.theme_id, w]));
  const noteByThemeId = new Map(risingWrites.map((w) => [w.theme_id, w]));

  const rankedThemes = [
    ...clearGapInputs.map((input) => {
      const write = writeByThemeId.get(input.score.themeId);
      return {
        themeId: input.score.themeId,
        label: input.label,
        category: input.category,
        bucket: "clear_gap" as const,
        gapScore: input.score.gapScore,
        supplyRatio: input.score.supplyRatio,
        trendDirection: input.score.trendDirection,
        demandPeriodCount: input.score.demandPeriodCount,
        demandTotalCount: input.score.demandTotalCount,
        confidence: input.score.confidence,
        exampleSignals: input.examples,
        whyGap: write?.why_gap ?? null,
        verdict: write?.verdict ?? null,
        verdictReason: write?.verdict_reason ?? null,
      };
    }),
    ...risingInputs.map((input) => {
      const write = noteByThemeId.get(input.score.themeId);
      return {
        themeId: input.score.themeId,
        label: input.label,
        category: input.category,
        bucket: "rising_crowded" as const,
        gapScore: input.score.gapScore,
        supplyRatio: input.score.supplyRatio,
        trendDirection: input.score.trendDirection,
        demandPeriodCount: input.score.demandPeriodCount,
        demandTotalCount: input.score.demandTotalCount,
        confidence: input.score.confidence,
        exampleSignals: input.examples,
        note: write?.note ?? null,
      };
    }),
    ...watchScores.slice(0, TOP_WATCH).map((score) => {
      const theme = themeById.get(score.themeId)!;
      return {
        themeId: score.themeId,
        label: theme.label,
        category: theme.category,
        bucket: "watch" as const,
        gapScore: score.gapScore,
        supplyRatio: score.supplyRatio,
        trendDirection: score.trendDirection,
        demandPeriodCount: score.demandPeriodCount,
        demandTotalCount: score.demandTotalCount,
        confidence: score.confidence,
      };
    }),
  ];

  const watchExcludedCount = watchScores.length - Math.min(watchScores.length, TOP_WATCH);
  const excludedSummary = `${dormantCount} dormant theme${dormantCount === 1 ? "" : "s"} excluded from scoring, ${watchExcludedCount} additional low-confidence theme${watchExcludedCount === 1 ? "" : "s"} below the watch list shown here (see the Sources and themes dashboard for the full picture).`;

  return prisma.digestReport.create({
    data: {
      regionId,
      period: isoWeekLabel(new Date()),
      generatedBy,
      rankedThemes,
      rollupNote,
      excludedSummary,
    },
  });
}
