import { prisma } from "@/lib/prisma";

export type TrendDirection = "rising" | "steady" | "falling" | "dormant";

export type ThemeTrend = {
  themeId: string;
  totalCount: number;
  periodCount: number;
  priorCount: number;
  direction: TrendDirection;
};

const PERIOD_DAYS = 7; // matches EYESPY.md's weekly (Wednesday) digest cadence

// Period-over-period signal count for a theme, from plain group-by queries —
// no rollup/materialized-view table, per EYESPY.md's "don't build one until
// querying live is actually slow" guidance.
export async function computeThemeTrend(themeId: string): Promise<ThemeTrend> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const priorStart = new Date(now.getTime() - 2 * PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const [totalCount, periodCount, priorCount] = await Promise.all([
    prisma.signal.count({ where: { themeId } }),
    prisma.signal.count({ where: { themeId, timestamp: { gte: periodStart, lte: now } } }),
    prisma.signal.count({
      where: { themeId, timestamp: { gte: priorStart, lt: periodStart } },
    }),
  ]);

  let direction: TrendDirection;
  if (periodCount === 0 && priorCount === 0) {
    direction = "dormant";
  } else if (periodCount > priorCount) {
    direction = "rising";
  } else if (periodCount < priorCount) {
    direction = "falling";
  } else {
    direction = "steady";
  }

  return { themeId, totalCount, periodCount, priorCount, direction };
}

export async function computeRegionTrends(regionId: string): Promise<ThemeTrend[]> {
  const themes = await prisma.theme.findMany({
    where: { regionId, status: "active" },
    select: { id: true },
  });
  return Promise.all(themes.map((t) => computeThemeTrend(t.id)));
}
