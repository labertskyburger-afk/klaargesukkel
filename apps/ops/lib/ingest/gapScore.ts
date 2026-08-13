import { prisma } from "@/lib/prisma";
import { computeThemeTrend, type TrendDirection } from "./trends";

// civic_municipal: added 2026-08-06 — municipal service complaints (water
// outages, potholes, sewage — mostly sourced via ArcGIS's City of Cape Town
// Service Requests feed) were topping "Clear gap" because gapScore's
// supply_ratio formula rewards demand with no matching supply signal, and
// nobody commercially supplies municipal infrastructure. That's the formula
// working correctly but answering the wrong question for these — "no
// supply" here means "the City is failing," not "a business opportunity."
// A theme whose demand signals are majority civic_municipal-natured (see
// SignalNature in schema.prisma) gets this bucket instead, with gapScore
// forced to 0 — excluded from the commercial-opportunity ranking entirely,
// not just ranked low, since it isn't one. Still real, useful data — kept
// visible in a separate section of the dashboard, not deleted.
export type Bucket = "clear_gap" | "rising_crowded" | "watch" | "dormant" | "civic_municipal";

export type ThemeGapScore = {
  themeId: string;
  demandVolume: number; // recency-weighted
  demandTotalCount: number; // raw all-time demand count (drives confidence)
  demandPeriodCount: number;
  supplyCount: number;
  supplyRatio: number; // demand / (demand + supply), 0 if neither exists
  trendDirection: TrendDirection;
  trendMultiplier: number;
  gapScore: number; // 0 for dormant/civic_municipal (excluded from scoring)
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
      select: { timestamp: true, nature: true },
    }),
    prisma.signal.count({ where: { themeId, signalType: "supply" } }),
  ]);

  // Nature is nullable (pre-backfill signals). Found 2026-08-13: voting
  // civic vs. "everything else including unclassified" meant a large old
  // theme (e.g. 39 signals) couldn't flip until the backfill — capped and
  // shared across the whole region, not per-theme — had individually
  // reached a MAJORITY of its specific signals, which could take dozens of
  // cron runs. Unclassified signals are excluded from the vote entirely
  // instead: only signals that have actually been judged get a say, so a
  // theme flips as soon as a small, clearly-civic sample is in, not once
  // its whole history is processed. Requires at least 2 classified votes to
  // guard against one early stray/misclassified signal deciding it.
  const classifiedDemand = demandSignals.filter((s) => s.nature !== null);
  const civicCount = classifiedDemand.filter((s) => s.nature === "civic_municipal").length;
  const isCivic = classifiedDemand.length >= 2 && civicCount > classifiedDemand.length - civicCount;

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

  let bucket: Bucket;
  let gapScore: number;
  if (isCivic) {
    bucket = "civic_municipal";
    gapScore = 0;
  } else if (trend.direction === "dormant") {
    bucket = "dormant";
    gapScore = 0;
  } else if (!confidence) {
    bucket = "watch";
    gapScore = demandVolume * trendMultiplier * supplyRatio;
  } else if (supplyRatio >= SUPPLY_RATIO_CLEAR_THRESHOLD) {
    bucket = "clear_gap";
    gapScore = demandVolume * trendMultiplier * supplyRatio;
  } else {
    bucket = "rising_crowded";
    gapScore = demandVolume * trendMultiplier * supplyRatio;
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
