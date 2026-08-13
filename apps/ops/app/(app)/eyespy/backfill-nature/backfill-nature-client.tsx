"use client";

import { useState } from "react";
import Link from "next/link";

export default function BackfillNatureClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBackfilled, setTotalBackfilled] = useState(0);
  const [stillMissing, setStillMissing] = useState<number | null>(null);
  const [runs, setRuns] = useState(0);

  async function runOnce() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/eyespy/backfill-nature", { method: "POST" });
      let data: { backfilled?: number; stillMissing?: number; error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok || !data) {
        throw new Error(data?.error ?? `Request failed (${res.status}) — likely a server timeout, try again.`);
      }
      setTotalBackfilled((t) => t + (data!.backfilled ?? 0));
      setStillMissing(data!.stillMissing ?? 0);
      setRuns((r) => r + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const done = stillMissing === 0;

  return (
    <div className="mt-8">
      <button
        onClick={runOnce}
        disabled={loading || done}
        className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
      >
        {loading ? "Backfilling…" : done ? "All caught up" : runs === 0 ? "Run backfill" : "Run again"}
      </button>

      {error && <p className="mt-3 text-sm text-amber">{error}</p>}

      {runs > 0 && (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-5 text-sm text-ink/70">
          <p>
            {totalBackfilled} signal{totalBackfilled === 1 ? "" : "s"} backfilled across {runs} run
            {runs === 1 ? "" : "s"}.
          </p>
          <p className="mt-1">
            {stillMissing === 0
              ? "Nothing left — every demand signal has a civic/municipal classification now."
              : `${stillMissing} still missing — click "Run again" to continue.`}
          </p>
        </div>
      )}

      {done && (
        <p className="mt-4 text-sm">
          <Link href="/eyespy" className="text-teal hover:underline">
            ← Back to themes
          </Link>{" "}
          to see the civic/municipal section update.
        </p>
      )}
    </div>
  );
}
