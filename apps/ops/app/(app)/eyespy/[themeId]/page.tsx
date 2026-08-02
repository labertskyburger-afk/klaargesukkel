import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeThemeTrend } from "@/lib/ingest/trends";

export const dynamic = "force-dynamic";

const WEEKS_SHOWN = 8;

function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default async function ThemeDetailPage({
  params,
  searchParams,
}: {
  params: { themeId: string };
  searchParams: { source?: string; manualOnly?: string; signalType?: string };
}) {
  const theme = await prisma.theme.findUnique({ where: { id: params.themeId } });
  if (!theme) notFound();

  const trend = await computeThemeTrend(theme.id);

  const allSignals = await prisma.signal.findMany({
    where: { themeId: theme.id },
    include: { source: true },
    orderBy: { timestamp: "desc" },
  });

  const sourceNames = Array.from(new Set(allSignals.map((s) => s.source.name))).sort();

  // Default to demand-only — supply (business/ad content) is kept as
  // context, not mixed into the primary view, same reasoning as
  // computeThemeTrend's demand-only counting (see EYESPY.md's 2026-08-02
  // signal_type addition).
  const signalTypeFilter = searchParams.signalType ?? "demand";
  let signals = allSignals;
  if (signalTypeFilter !== "all") {
    signals = signals.filter((s) => (s.signalType ?? "unclear") === signalTypeFilter);
  }
  if (searchParams.manualOnly === "1") {
    signals = signals.filter((s) => s.capturedVia === "manual_screenshot");
  }
  if (searchParams.source) {
    signals = signals.filter((s) => s.source.name === searchParams.source);
  }

  // Volume-over-time: last N weeks, demand-only to stay consistent with the
  // trend numbers above (which also only count demand).
  const demandSignals = allSignals.filter((s) => s.signalType === "demand");
  const now = new Date();
  const weekBuckets: { label: string; count: number }[] = [];
  for (let i = WEEKS_SHOWN - 1; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const label = isoWeekLabel(weekEnd);
    weekBuckets.push({ label, count: 0 });
  }
  const bucketIndex = new Map(weekBuckets.map((b, idx) => [b.label, idx]));
  for (const s of demandSignals) {
    const label = isoWeekLabel(s.timestamp);
    const idx = bucketIndex.get(label);
    if (idx !== undefined) weekBuckets[idx].count++;
  }
  const maxCount = Math.max(1, ...weekBuckets.map((b) => b.count));

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-14">
      <Link href="/eyespy" className="text-xs font-medium text-teal hover:underline">
        ← All themes
      </Link>

      <h1 className="mt-3 text-3xl font-bold text-ink">{theme.label}</h1>
      {theme.description && <p className="mt-2 text-ink/60">{theme.description}</p>}
      <p className="mt-2 text-xs text-ink/40">
        {theme.category ?? "uncategorized"} · first seen {theme.firstSeenAt.toISOString().slice(0, 10)} ·
        last seen {theme.lastSeenAt.toISOString().slice(0, 10)}
      </p>

      {/* Volume over time */}
      <section className="mt-8 rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
          Volume — last {WEEKS_SHOWN} weeks
        </h2>
        <div className="mt-4 flex items-end gap-2" style={{ height: "80px" }}>
          {weekBuckets.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-teal/60"
                style={{ height: `${Math.max(4, (b.count / maxCount) * 64)}px` }}
                title={`${b.label}: ${b.count}`}
              />
              <span className="text-[9px] text-ink/40">{b.label.slice(6)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink/50">
          {trend.periodCount} this week, {trend.priorCount} the week before — {trend.direction}.
        </p>
      </section>

      {/* Signal type filter — defaults to demand; supply/unclear are kept as
          context, not mixed in silently (EYESPY.md, 2026-08-02) */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["demand", "supply", "unclear", "all"] as const).map((t) => {
          const params = new URLSearchParams();
          if (t !== "demand") params.set("signalType", t);
          if (searchParams.source) params.set("source", searchParams.source);
          if (searchParams.manualOnly) params.set("manualOnly", searchParams.manualOnly);
          const qs = params.toString();
          return (
            <Link
              key={t}
              href={`/eyespy/${theme.id}${qs ? `?${qs}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                signalTypeFilter === t
                  ? "bg-ink text-sand"
                  : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              }`}
            >
              {t === "all" ? "All types" : t}
            </Link>
          );
        })}
      </div>

      {/* Source filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/eyespy/${theme.id}${signalTypeFilter !== "demand" ? `?signalType=${signalTypeFilter}` : ""}`}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !searchParams.source && !searchParams.manualOnly
              ? "bg-ink text-sand"
              : "bg-ink/5 text-ink/60 hover:bg-ink/10"
          }`}
        >
          All sources
        </Link>
        {sourceNames.map((name) => {
          const params = new URLSearchParams({ source: name });
          if (signalTypeFilter !== "demand") params.set("signalType", signalTypeFilter);
          return (
            <Link
              key={name}
              href={`/eyespy/${theme.id}?${params.toString()}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                searchParams.source === name
                  ? "bg-ink text-sand"
                  : "bg-ink/5 text-ink/60 hover:bg-ink/10"
              }`}
            >
              {name}
            </Link>
          );
        })}
        <Link
          href={`/eyespy/${theme.id}?manualOnly=1${signalTypeFilter !== "demand" ? `&signalType=${signalTypeFilter}` : ""}`}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            searchParams.manualOnly === "1"
              ? "bg-ink text-sand"
              : "bg-ink/5 text-ink/60 hover:bg-ink/10"
          }`}
        >
          Manual capture only
        </Link>
      </div>

      {/* Example signals */}
      <section className="mt-4 flex flex-col gap-3">
        {signals.map((s) => (
          <div key={s.id} className="rounded-2xl border border-ink/10 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-ink/80">{s.rawText}</p>
              <div className="flex shrink-0 gap-1">
                {s.signalType && s.signalType !== "demand" && (
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      s.signalType === "supply" ? "bg-amber/20 text-amber" : "bg-fog/20 text-fog"
                    }`}
                  >
                    {s.signalType}
                  </span>
                )}
                <span className="whitespace-nowrap rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50">
                  {s.capturedVia === "manual_screenshot" ? "manual" : "automated"}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink/40">
              {s.source.name} · {s.timestamp.toISOString().slice(0, 10)}
              {s.url && (
                <>
                  {" · "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
                    source ↗
                  </a>
                </>
              )}
            </p>
          </div>
        ))}
        {signals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/10 p-8 text-center text-sm text-ink/30">
            No signals match this filter.
          </div>
        )}
      </section>
    </main>
  );
}
