import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RegenerateButton from "./regenerate-button";

export const dynamic = "force-dynamic";

type TrendDirection = "rising" | "steady" | "falling" | "dormant";

type ClearGapEntry = {
  themeId: string;
  label: string;
  category: string | null;
  bucket: "clear_gap";
  gapScore: number;
  supplyRatio: number;
  trendDirection: TrendDirection;
  demandPeriodCount: number;
  demandTotalCount: number;
  confidence: boolean;
  exampleSignals: string[];
  whyGap: string | null;
  verdict: "practical_klaargesukkel_fit" | "too_big_or_regulated_or_niche" | null;
  verdictReason: string | null;
};

type RisingEntry = {
  themeId: string;
  label: string;
  category: string | null;
  bucket: "rising_crowded";
  gapScore: number;
  supplyRatio: number;
  trendDirection: TrendDirection;
  demandPeriodCount: number;
  demandTotalCount: number;
  confidence: boolean;
  exampleSignals: string[];
  note: string | null;
};

type WatchEntry = {
  themeId: string;
  label: string;
  category: string | null;
  bucket: "watch";
  gapScore: number;
  supplyRatio: number;
  trendDirection: TrendDirection;
  demandPeriodCount: number;
  demandTotalCount: number;
  confidence: boolean;
};

type RankedEntry = ClearGapEntry | RisingEntry | WatchEntry;

const trendLabel: Record<TrendDirection, string> = {
  rising: "↑ rising",
  steady: "→ steady",
  falling: "↓ falling",
  dormant: "dormant",
};

const verdictLabel = {
  practical_klaargesukkel_fit: "Practical Klaargesukkel fit",
  too_big_or_regulated_or_niche: "Too big / regulated / niche",
};

export default async function DigestPage() {
  const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });

  if (!region) {
    return (
      <main className="mx-auto max-w-[1000px] px-6 py-14">
        <h1 className="text-3xl font-bold text-ink">Digest</h1>
        <p className="mt-3 text-ink/60">
          No region configured yet — this seeds itself the first time the cron job runs.
        </p>
      </main>
    );
  }

  const digest = await prisma.digestReport.findFirst({
    where: { regionId: region.id },
    orderBy: { generatedAt: "desc" },
  });

  const rankedThemes = (digest?.rankedThemes as unknown as RankedEntry[] | undefined) ?? [];
  const clearGaps = rankedThemes.filter((e): e is ClearGapEntry => e.bucket === "clear_gap");
  const rising = rankedThemes.filter((e): e is RisingEntry => e.bucket === "rising_crowded");
  const watch = rankedThemes.filter((e): e is WatchEntry => e.bucket === "watch");

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-14">
      <Link href="/eyespy" className="text-xs font-medium text-teal hover:underline">
        ← All themes
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Digest</h1>
          {digest ? (
            <p className="mt-2 text-ink/60">
              {digest.period} · generated {digest.generatedAt.toISOString().slice(0, 10)} (
              {digest.generatedBy}) · {region.name}
            </p>
          ) : (
            <p className="mt-2 text-ink/60">No digest generated yet for {region.name}.</p>
          )}
        </div>
        <RegenerateButton />
      </div>

      {!digest && (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/10 p-8 text-center text-sm text-ink/40">
          Click "Regenerate digest now" to generate the first one — it runs against whatever
          signals are classified so far, no need to wait for Wednesday.
        </div>
      )}

      {digest && digest.rollupNote && (
        <div className="mt-8 rounded-2xl border border-amber/30 bg-amber/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber">
            Cross-theme rollup
          </p>
          <p className="mt-1.5 text-sm text-ink/80">{digest.rollupNote}</p>
        </div>
      )}

      {digest && clearGaps.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
            Clear gaps
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            Meaningful demand, relatively unmet, not fading — ranked by gap score.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {clearGaps.map((e) => (
              <div key={e.themeId} className="rounded-2xl border border-ink/10 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/eyespy/${e.themeId}`}
                    className="text-base font-semibold text-ink hover:text-teal"
                  >
                    {e.label}
                  </Link>
                  <span className="whitespace-nowrap rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
                    gap {e.gapScore.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/40">
                  {e.category ?? "uncategorized"} · {trendLabel[e.trendDirection]} ·{" "}
                  {(e.supplyRatio * 100).toFixed(0)}% demand vs supply ·{" "}
                  {e.demandTotalCount} demand signal{e.demandTotalCount === 1 ? "" : "s"}
                </p>
                {e.whyGap && <p className="mt-3 text-sm text-ink/80">{e.whyGap}</p>}
                {e.verdict && (
                  <div className="mt-3 flex items-start gap-2">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                        e.verdict === "practical_klaargesukkel_fit"
                          ? "bg-teal/10 text-teal"
                          : "bg-fog/20 text-fog"
                      }`}
                    >
                      {verdictLabel[e.verdict]}
                    </span>
                    {e.verdictReason && (
                      <p className="text-xs text-ink/50">{e.verdictReason}</p>
                    )}
                  </div>
                )}
                {e.exampleSignals.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1 border-l-2 border-ink/10 pl-3">
                    {e.exampleSignals.map((s, idx) => (
                      <li key={idx} className="text-xs text-ink/50">
                        "{s}"
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {digest && rising.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
            Rising but crowded
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            Real, growing demand — but plenty of existing competitors already. Needs a
            differentiation angle, not a straight build.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {rising.map((e) => (
              <div key={e.themeId} className="rounded-2xl border border-ink/10 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/eyespy/${e.themeId}`}
                    className="text-sm font-semibold text-ink hover:text-teal"
                  >
                    {e.label}
                  </Link>
                  <span className="whitespace-nowrap rounded-full bg-fog/20 px-2.5 py-1 text-xs font-medium text-fog">
                    {(e.supplyRatio * 100).toFixed(0)}% demand
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/40">
                  {e.category ?? "uncategorized"} · {trendLabel[e.trendDirection]}
                </p>
                {e.note && <p className="mt-2 text-sm text-ink/70">{e.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {digest && watch.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
            Watch list
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            Below the confidence threshold — worth knowing about, not yet a recommendation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {watch.map((e) => (
              <Link
                key={e.themeId}
                href={`/eyespy/${e.themeId}`}
                className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/60 hover:bg-ink/10"
              >
                {e.label} ({e.demandTotalCount})
              </Link>
            ))}
          </div>
        </section>
      )}

      {digest && digest.excludedSummary && (
        <p className="mt-8 max-w-2xl text-xs text-ink/40">{digest.excludedSummary}</p>
      )}
    </main>
  );
}
