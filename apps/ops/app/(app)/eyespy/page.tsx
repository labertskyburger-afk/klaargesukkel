import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeThemeGapScore, type Bucket } from "@/lib/ingest/gapScore";
import type { TrendDirection } from "@/lib/ingest/trends";

export const dynamic = "force-dynamic";

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

const bucketLabel: Record<Bucket, string> = {
  clear_gap: "Clear gap",
  rising_crowded: "Rising, crowded",
  watch: "Watch",
  dormant: "Dormant",
};

const bucketStyle: Record<Bucket, string> = {
  clear_gap: "bg-teal/10 text-teal",
  rising_crowded: "bg-amber/20 text-amber",
  watch: "bg-fog/20 text-fog",
  dormant: "bg-ink/5 text-ink/40",
};

// Bucket priority for the default sort — confidence-gated: a low-confidence
// Watch theme can never outrank a confident Clear gap or Rising theme
// regardless of raw gap_score, per EYESPY.md's Processing step 5.
const bucketRank: Record<Bucket, number> = {
  clear_gap: 0,
  rising_crowded: 1,
  watch: 2,
  dormant: 3,
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

  const scores = await Promise.all(themes.map((t) => computeThemeGapScore(t.id)));
  const scoreByThemeId = new Map(scores.map((s) => [s.themeId, s]));

  const categories = Array.from(
    new Set(themes.map((t) => t.category).filter((c): c is string => !!c))
  ).sort();

  const activeCategory = searchParams.category;
  const filtered = activeCategory
    ? themes.filter((t) => t.category === activeCategory)
    : themes;

  const sorted = filtered.slice().sort((a, b) => {
    const sa = scoreByThemeId.get(a.id)!;
    const sb = scoreByThemeId.get(b.id)!;
    const rankDiff = bucketRank[sa.bucket] - bucketRank[sb.bucket];
    if (rankDiff !== 0) return rankDiff;
    if (sa.bucket === "clear_gap" || sa.bucket === "rising_crowded") {
      return sb.gapScore - sa.gapScore;
    }
    return sb.demandTotalCount - sa.demandTotalCount;
  });

  const clearGapCount = scores.filter((s) => s.bucket === "clear_gap").length;

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">EyeSpy</h1>
          <p className="mt-2 text-ink/60">
            {region.name} · {themes.length} theme{themes.length === 1 ? "" : "s"} tracked ·{" "}
            {clearGapCount} clear gap{clearGapCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/eyespy/digest"
            className="whitespace-nowrap rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-ink/5"
          >
            Digest
          </Link>
          <Link
            href="/eyespy/sources"
            className="whitespace-nowrap rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-ink/5"
          >
            Sources
          </Link>
          <Link
            href="/eyespy/capture"
            className="whitespace-nowrap rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            Weekly capture
          </Link>
        </div>
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
              <th className="px-4 py-3">Gap</th>
              <th className="px-4 py-3">Gap score</th>
              <th className="px-4 py-3">Supply ratio</th>
              <th className="px-4 py-3">Trend</th>
              <th className="px-4 py-3">This period</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((theme) => {
              const score = scoreByThemeId.get(theme.id)!;
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
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${bucketStyle[score.bucket]}`}
                    >
                      {bucketLabel[score.bucket]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {score.bucket === "dormant" ? "—" : score.gapScore.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {score.demandTotalCount + score.supplyCount > 0
                      ? `${(score.supplyRatio * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${trendStyle[score.trendDirection]}`}
                    >
                      {trendLabel[score.trendDirection]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{score.demandPeriodCount}</td>
                  <td className="px-4 py-3 text-ink/70">{score.demandTotalCount}</td>
                  <td className="px-4 py-3 text-ink/50">
                    {theme.lastSeenAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink/40">
                  No themes yet — the cron job seeds sources and pulls signals daily. Check back
                  after the first run, or trigger it manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-8 max-w-2xl text-xs text-ink/40">
        Default-sorted by gap score (demand volume × trend × supply ratio), confidence-gated so
        low-signal themes can't outrank solid ones — same three buckets (Clear gap / Rising,
        crowded / Watch) as the <Link href="/eyespy/digest" className="text-teal hover:underline">digest</Link>,
        so the always-live dashboard and the periodic write-up tell the same story. Counts here
        only include "demand" signals — "supply" signals (businesses/ads, including SEO copy
        phrased as a question) feed the supply ratio but not the volume/trend numbers. See
        EYESPY.md for the full spec.{" "}
        <Link href="/eyespy/merge-themes" className="text-teal hover:underline">
          Merge duplicate themes
        </Link>{" "}
        if the list above looks fragmented, or{" "}
        <Link href="/eyespy/purge-themes" className="text-teal hover:underline">
          purge off-topic themes
        </Link>{" "}
        if it's full of general news rather than local demand.
      </p>
    </main>
  );
}
