import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeThemeTrend, type TrendDirection } from "@/lib/ingest/trends";

export const dynamic = "force-dynamic";

const trendRank: Record<TrendDirection, number> = {
  rising: 0,
  steady: 1,
  falling: 2,
  dormant: 3,
};

const trendLabel: Record<TrendDirection, string> = {
  rising: "↑ rising",
  steady: "→ steady",
  falling: "↓ falling",
  dormant: "dormant",
};

const trendStyle: Record<TrendDirection, string> = {
  rising: "bg-amber/20 text-amber",
  steady: "bg-teal/10 text-teal",
  falling: "bg-fog/20 text-fog",
  dormant: "bg-ink/5 text-ink/40",
};

export default async function EyeSpyPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });

  if (!region) {
    return (
      <main className="mx-auto max-w-[1400px] px-6 py-14">
        <h1 className="text-3xl font-bold text-ink">EyeSpy</h1>
        <p className="mt-3 text-ink/60">
          No region configured yet — this seeds itself the first time the cron job runs.
          See EYESPY.md for the full spec.
        </p>
      </main>
    );
  }

  const themes = await prisma.theme.findMany({
    where: { regionId: region.id },
    orderBy: { lastSeenAt: "desc" },
  });

  const trends = await Promise.all(themes.map((t) => computeThemeTrend(t.id)));
  const trendByThemeId = new Map(trends.map((t) => [t.themeId, t]));

  const categories = Array.from(
    new Set(themes.map((t) => t.category).filter((c): c is string => !!c))
  ).sort();

  const activeCategory = searchParams.category;
  const filtered = activeCategory
    ? themes.filter((t) => t.category === activeCategory)
    : themes;

  const sorted = filtered.slice().sort((a, b) => {
    const ta = trendByThemeId.get(a.id)!;
    const tb = trendByThemeId.get(b.id)!;
    const rankDiff = trendRank[ta.direction] - trendRank[tb.direction];
    if (rankDiff !== 0) return rankDiff;
    return tb.totalCount - ta.totalCount;
  });

  const risingCount = trends.filter((t) => t.direction === "rising").length;

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">EyeSpy</h1>
          <p className="mt-2 text-ink/60">
            {region.name} · {themes.length} theme{themes.length === 1 ? "" : "s"} tracked ·{" "}
            {risingCount} rising this week
          </p>
        </div>
        <Link
          href="/eyespy/capture"
          className="whitespace-nowrap rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95"
        >
          Weekly capture
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/eyespy"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !activeCategory ? "bg-ink text-sand" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/eyespy?category=${encodeURIComponent(c)}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeCategory === c
                  ? "bg-ink text-sand"
                  : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3">Theme</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Trend</th>
              <th className="px-4 py-3">This period</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">First seen</th>
              <th className="px-4 py-3">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((theme) => {
              const trend = trendByThemeId.get(theme.id)!;
              return (
                <tr key={theme.id} className="border-b border-ink/5 last:border-0 hover:bg-sand/50">
                  <td className="px-4 py-3">
                    <Link href={`/eyespy/${theme.id}`} className="font-medium text-ink hover:text-teal">
                      {theme.label}
                    </Link>
                    {theme.description && (
                      <p className="mt-0.5 max-w-md text-xs text-ink/50">{theme.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/60">{theme.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${trendStyle[trend.direction]}`}
                    >
                      {trendLabel[trend.direction]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {trend.periodCount}
                    {trend.priorCount > 0 && (
                      <span className="text-ink/40"> (was {trend.priorCount})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{trend.totalCount}</td>
                  <td className="px-4 py-3 text-ink/50">
                    {theme.firstSeenAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-ink/50">
                    {theme.lastSeenAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink/40">
                  No themes yet — the cron job seeds sources and pulls signals daily. Check back
                  after the first run, or trigger it manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-8 max-w-2xl text-xs text-ink/40">
        Themes accumulate across every source (automated pulls and manual Facebook Group
        captures alike) — a theme persists across periods rather than resetting each digest, so
        trend direction is meaningful. See EYESPY.md for the full spec.
      </p>
    </main>
  );
}
