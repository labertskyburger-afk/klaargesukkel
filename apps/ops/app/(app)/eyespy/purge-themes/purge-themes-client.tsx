"use client";

import { useState } from "react";
import Link from "next/link";

type IrrelevantThemeProposal = {
  themeId: string;
  label: string;
  category: string | null;
  signalCount: number;
  reasoning: string;
};

export default function PurgeThemesClient() {
  const [proposals, setProposals] = useState<IrrelevantThemeProposal[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [scanErrors, setScanErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{
    purged: number;
    signalsDeleted: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setLoading(true);
    setError(null);
    setResult(null);
    setScanErrors([]);
    try {
      const res = await fetch("/api/eyespy/purge-themes/propose", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to scan themes");
      const proposals: IrrelevantThemeProposal[] = data.proposals;
      setProposals(proposals);
      setSelected(new Set(proposals.map((_, i) => i)));
      setScanErrors(data.errors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function applyPurge() {
    if (!proposals) return;
    setApplying(true);
    setError(null);
    try {
      const themeIds = proposals.filter((_, i) => selected.has(i)).map((p) => p.themeId);
      const res = await fetch("/api/eyespy/purge-themes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to purge themes");
      setResult(data);
      setProposals(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="mt-8">
      {!proposals && (
        <button
          onClick={scan}
          disabled={loading}
          className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Scanning themes…" : "Find irrelevant themes"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-amber">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-teal/30 bg-teal/5 p-5">
          <p className="text-sm font-medium text-ink">
            Purged {result.purged} theme{result.purged === 1 ? "" : "s"}, deleted{" "}
            {result.signalsDeleted} signal{result.signalsDeleted === 1 ? "" : "s"}.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-amber">
                  {e}
                </li>
              ))}
            </ul>
          )}
          <Link href="/eyespy" className="mt-3 inline-block text-xs text-teal hover:underline">
            ← Back to themes
          </Link>
        </div>
      )}

      {proposals && scanErrors.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/10 p-4">
          <p className="text-xs font-medium text-amber">
            {scanErrors.length} batch{scanErrors.length === 1 ? "" : "es"} failed to scan —
            results below are partial, safe to apply what's shown and re-run later for the rest.
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {scanErrors.map((e, i) => (
              <li key={i} className="text-xs text-amber/80">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {proposals && (
        <div className="mt-4">
          {proposals.length === 0 ? (
            <p className="text-sm text-ink/50">
              No off-topic themes found — everything looks like genuine local demand.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink/60">
                  {proposals.length} theme{proposals.length === 1 ? "" : "s"} flagged as
                  off-topic — review before deleting, uncheck any that don't look right.
                </p>
                <button
                  onClick={applyPurge}
                  disabled={applying || selected.size === 0}
                  className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50"
                >
                  {applying
                    ? "Deleting…"
                    : `Delete ${selected.size} theme${selected.size === 1 ? "" : "s"}`}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {proposals.map((p, idx) => (
                  <label
                    key={idx}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(idx)}
                      onChange={() => toggle(idx)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {p.label}{" "}
                        <span className="font-normal text-ink/40">
                          ({p.category ?? "uncategorized"} · {p.signalCount} signal
                          {p.signalCount === 1 ? "" : "s"})
                        </span>
                      </p>
                      <p className="mt-1 text-xs italic text-ink/40">{p.reasoning}</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
