"use client";

import { useState } from "react";
import Link from "next/link";

type MergeGroupProposal = {
  themeIds: string[];
  themeLabels: string[];
  signalCounts: number[];
  canonicalLabel: string;
  canonicalDescription: string;
  canonicalCategory: string;
  reasoning: string;
};

export default function MergeThemesClient() {
  const [proposals, setProposals] = useState<MergeGroupProposal[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{
    merged: number;
    signalsReassigned: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanErrors, setScanErrors] = useState<string[]>([]);

  async function findDuplicates() {
    setLoading(true);
    setError(null);
    setResult(null);
    setScanErrors([]);
    try {
      const res = await fetch("/api/eyespy/merge-themes/propose", { method: "POST" });
      // A killed serverless function (e.g. past Vercel's maxDuration) returns
      // a plain-text/HTML error page, not JSON — surface that plainly rather
      // than letting res.json() throw a cryptic "Unexpected token" message.
      if (!res.ok && !res.headers.get("content-type")?.includes("application/json")) {
        throw new Error(
          `Request failed (${res.status}) — likely a server timeout. Try again, or narrow the scan.`
        );
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to find duplicates");
      const groups: MergeGroupProposal[] = data.groups;
      setProposals(groups);
      setSelected(new Set(groups.map((_, i) => i)));
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

  async function applyMerges() {
    if (!proposals) return;
    setApplying(true);
    setError(null);
    try {
      const groupsToApply = proposals
        .filter((_, i) => selected.has(i))
        .map((g) => ({
          themeIds: g.themeIds,
          canonicalLabel: g.canonicalLabel,
          canonicalDescription: g.canonicalDescription,
          canonicalCategory: g.canonicalCategory,
        }));
      const res = await fetch("/api/eyespy/merge-themes/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: groupsToApply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to apply merges");
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
          onClick={findDuplicates}
          disabled={loading}
          className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Scanning themes…" : "Find duplicate themes"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-amber">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-teal/30 bg-teal/5 p-5">
          <p className="text-sm font-medium text-ink">
            Merged {result.merged} group{result.merged === 1 ? "" : "s"}, reassigned{" "}
            {result.signalsReassigned} signal{result.signalsReassigned === 1 ? "" : "s"}.
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
            {scanErrors.length} categor{scanErrors.length === 1 ? "y" : "ies"} failed to scan —
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
              No clear duplicates found — themes look distinct enough to leave as-is.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink/60">
                  {proposals.length} proposed merge group{proposals.length === 1 ? "" : "s"} —
                  review before applying, uncheck any that don't look right.
                </p>
                <button
                  onClick={applyMerges}
                  disabled={applying || selected.size === 0}
                  className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50"
                >
                  {applying
                    ? "Applying…"
                    : `Apply ${selected.size} merge${selected.size === 1 ? "" : "s"}`}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {proposals.map((group, idx) => (
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
                        → {group.canonicalLabel}{" "}
                        <span className="font-normal text-ink/40">
                          ({group.canonicalCategory})
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink/50">{group.canonicalDescription}</p>
                      <p className="mt-2 text-xs text-ink/60">
                        Merging: {group.themeLabels.map((l, i) => `"${l}" (${group.signalCounts[i]})`).join(", ")}
                      </p>
                      <p className="mt-1 text-xs italic text-ink/40">{group.reasoning}</p>
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
