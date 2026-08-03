import { prisma } from "@/lib/prisma";
import { computeThemeTrend, type TrendDirection } from "./trends";

export type Bucket = "clear_gap" | "rising_crowded" | "watch" | "dormant";

export type ThemeGapScore = {
  themeId: string;
  demandVolume: number; // recency-weighted
  demandTotalCount: number; // raw all-time demand count (drives confidence)
  demandPeriodCount: number;
  supplyCount: number;
  supplyRatio: number; // demand / (demand + supply), 0 if neither exists
  trendDirection: TrendDirection;
  trendMultiplier: number;
  gapScore: number; // 0 for dormant (excluded from scoring, per EYESPY.md)
  confidence: boolean;
  bucket: Bucket;
};

// EYESPY.md Processing step 5 (added 2026-08-02) — tunable, "start at 5,
// tune once real data volume is seen."
const CONFIDENCE_MIN_SIGNALS = 5;
// >= this fraction of typed signals being demand (not supply) counts as a
// real gap rather than a crowded/saturated category.
const SUPPLY_RATIO_CLEAR_THRESHOLD = 0.5;
// Recency weighting half-life for demand_volume — a signal from
// RECENCY_HALF_LIFE_DAYS ago counts half as much as one from today.
const RECENCY_HALF_LIFE_DAYS = 14;

const TREND_MULTIPLIER: Record<TrendDirection, number> = {
  rising: 1.5,
  steady: 1.0,
  falling: 0.7,
  dormant: 0,
};

// gap_score = demand_volume × trend_multiplier × supply_ratio, per
// EYESPY.md's Processing step 5 (added 2026-08-02) — replaces the earlier
// vague "volume+trend blend." A theme is a genuine opportunity when demand
// is meaningful, relatively unmet (high supply_ratio), and not fading.
export async function computeThemeGapScore(themeId: string): Promise<ThemeGapScore> {
  const trend = await computeThemeTrend(themeId); // already demand-only

  const [demandSignals, supplyCount] = await Promise.all([
    prisma.signal.findMany({
      where: { themeId, signalType: "demand" },
      select: { timestamp: true },
    }),
    prisma.signal.count({ where: { themeId, signalType: "supply" } }),
  ]);

  const now = Date.now();
  const demandVolume = demandSignals.reduce((sum, s) => {
    const daysAgo = Math.max(0, (now - s.timestamp.getTime()) / 86400000);
    const weight = Math.pow(0.5, daysAgo / RECENCY_HALF_LIFE_DAYS);
    return sum + weight;
  }, 0);

  const demandTotalCount = demandSignals.length;
  const supplyRatio =
    demandTotalCount + supplyCount > 0 ? demandTotalCount / (demandTotalCount + supplyCount) : 0;

  const confidence = demandTotalCount >= CONFIDENCE_MIN_SIGNALS;
  const trendMultiplier = TREND_MULTIPLIER[trend.direction];
  const gapScore =
    trend.direction === "dormant" ? 0 : demandVolume * trendMultiplier * supplyRatio;

  let bucket: Bucket;
  if (trend.direction === "dormant") {
    bucket = "dormant";
  } else if (!confidence) {
    bucket = "watch";
  } else if (supplyRatio >= SUPPLY_RATIO_CLEAR_THRESHOLD) {
    bucket = "clear_gap";
  } else {
    bucket = "rising_crowded";
  }

  return {
    themeId,
    demandVolume,
    demandTotalCount,
    demandPeriodCount: trend.periodCount,
    supplyCount,
    supplyRatio,
    trendDirection: trend.direction,
    trendMultiplier,
    gapScore,
    confidence,
    bucket,
  };
}

export async function computeRegionGapScores(regionId: string): Promise<ThemeGapScore[]> {
  const themes = await prisma.theme.findMany({
    where: { regionId, status: "active" },
    select: { id: true },
  });
  return Promise.all(themes.map((t) => computeThemeGapScore(t.id)));
}
