import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });

  if (!region) {
    return (
      <main className="mx-auto max-w-[1000px] px-6 py-14">
        <h1 className="text-3xl font-bold text-ink">Sources</h1>
        <p className="mt-3 text-ink/60">
          No region configured yet — this seeds itself the first time the cron job runs.
        </p>
      </main>
    );
  }

  const sources = await prisma.source.findMany({
    where: { regionId: region.id },
    orderBy: { name: "asc" },
  });

  const rows = await Promise.all(
    sources.map(async (source) => {
      const [total, unclassified, latest] = await Promise.all([
        prisma.signal.count({ where: { sourceId: source.id } }),
        prisma.signal.count({ where: { sourceId: source.id, themeId: null } }),
        prisma.signal.findFirst({
          where: { sourceId: source.id },
          orderBy: { timestamp: "desc" },
          select: { timestamp: true },
        }),
      ]);
      return { source, total, unclassified, lastSignalAt: latest?.timestamp ?? null };
    })
  );

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const selectedSource = searchParams.source
    ? sources.find((s) => s.id === searchParams.source)
    : null;

  const selectedSignals = selectedSource
    ? await prisma.signal.findMany({
        where: { sourceId: selectedSource.id },
        orderBy: { timestamp: "desc" },
        take: 100,
        include: { theme: true },
      })
    : [];

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-14">
      <Link href="/eyespy" className="text-xs font-medium text-teal hover:underline">
        ← All themes
      </Link>

      <h1 className="mt-3 text-3xl font-bold text-ink">Sources</h1>
      <p className="mt-2 text-ink/60">
        {region.name} · {grandTotal} signal{grandTotal === 1 ? "" : "s"} total across{" "}
        {sources.length} source{sources.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Signals</th>
              <th className="px-4 py-3">Share</th>
              <th className="px-4 py-3">Unclassified</th>
              <th className="px-4 py-3">Last signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ source, total, unclassified, lastSignalAt }) => (
              <tr
                key={source.id}
                className={`border-b border-ink/5 last:border-0 hover:bg-sand/50 ${
                  selectedSource?.id === source.id ? "bg-sand/70" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/eyespy/sources?source=${source.id}`}
                    className="font-medium text-ink hover:text-teal"
                  >
                    {source.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink/60">{source.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      source.active ? "bg-teal/10 text-teal" : "bg-ink/5 text-ink/40"
                    }`}
                  >
                    {source.active ? "active" : "inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/70">{total}</td>
                <td className="px-4 py-3 text-ink/50">
                  {grandTotal > 0 ? `${Math.round((total / grandTotal) * 100)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-ink/50">{unclassified > 0 ? unclassified : "—"}</td>
                <td className="px-4 py-3 text-ink/50">
                  {lastSignalAt ? lastSignalAt.toISOString().slice(0, 10) : "never"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink/40">
                  No sources configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedSource && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
              Latest signals from {selectedSource.name}
            </h2>
            <Link href="/eyespy/sources" className="text-xs text-teal hover:underline">
              Clear
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {selectedSignals.map((s) => (
              <div key={s.id} className="rounded-2xl border border-ink/10 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-ink/80">{s.rawText}</p>
                  <span className="whitespace-nowrap rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50">
                    {s.capturedVia === "manual_screenshot" ? "manual" : "automated"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-ink/40">
                  {s.timestamp.toISOString().slice(0, 10)}
                  {s.theme ? (
                    <>
                      {" · "}
                      <Link href={`/eyespy/${s.theme.id}`} className="text-teal hover:underline">
                        {s.theme.label}
                      </Link>
                    </>
                  ) : (
                    " · unclassified"
                  )}
                  {s.url && (
                    <>
                      {" · "}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal hover:underline"
                      >
                        source ↗
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))}
            {selectedSignals.length === 0 && (
              <div className="rounded-2xl border border-dashed border-ink/10 p-8 text-center text-sm text-ink/30">
                No signals from this source yet.
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
