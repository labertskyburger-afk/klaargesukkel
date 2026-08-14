"use client";

import { useState } from "react";
import Link from "next/link";

type DuplicateGroup = {
  keepId: string;
  keepText: string;
  removeIds: string[];
  removeTexts: string[];
  reasoning: string;
};

type Proposal = {
  themeId: string;
  themeLabel: string;
  misattached: { signalId: string; text: string }[];
  duplicateGroups: DuplicateGroup[];
};

type ApplyResult = { misattachedFixed: number; duplicatesRemoved: number; errors: string[] };

async function postJson<T = unknown>(
  url: string,
  body?: unknown
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: (T & { error?: string }) | null = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    return { ok: false, data: null, error: data?.error ?? `Request failed (${res.status}) — likely a server timeout, try again.` };
  }
  return { ok: true, data: data as T, error: null };
}

export default function SenseCheckClient() {
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [scanErrors, setScanErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplyResult | null>(null);

  const [selectedMisattached, setSelectedMisattached] = useState<Set<string>>(new Set());
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());

  async function scan() {
    setLoading(true);
    setError(null);
    setResult(null);
    setScanErrors([]);
    const { ok, data, error: err } = await postJson<{ proposals: Proposal[]; errors: string[] }>(
      "/api/eyespy/sense-check/propose"
    );
    if (!ok || !data) {
      setError(err);
      setLoading(false);
      return;
    }
    setProposals(data.proposals);
    setScanErrors(data.errors ?? []);
    setSelectedMisattached(new Set(data.proposals.flatMap((p) => p.misattached.map((m) => m.signalId))));
    setSelectedDuplicates(
      new Set(data.proposals.flatMap((p) => p.duplicateGroups.flatMap((g) => g.removeIds)))
    );
    setLoading(false);
  }

  function toggleMisattached(id: string) {
    setSelectedMisattached((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDuplicate(id: string) {
    setSelectedDuplicates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function apply() {
    if (!proposals) return;
    setApplying(true);
    setError(null);
    const { ok, data, error: err } = await postJson<ApplyResult>("/api/eyespy/sense-check/apply", {
      misattachedSignalIds: Array.from(selectedMisattached),
      duplicateRemoveSignalIds: Array.from(selectedDuplicates),
    });
    if (!ok || !data) {
      setError(err);
      setApplying(false);
      return;
    }
    setResult(data);
    setProposals(null);
    setApplying(false);
  }

  const totalSelected = selectedMisattached.size + selectedDuplicates.size;

  return (
    <div className="mt-8">
      {!proposals && !result && (
        <button
          onClick={scan}
          disabled={loading}
          className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
        >
          {loading ? "Scanning themes…" : "Scan themes"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-amber">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-teal/30 bg-teal/5 p-5">
          <p className="text-sm font-medium text-ink">
            Reset {result.misattachedFixed} misattached signal{result.misattachedFixed === 1 ? "" : "s"} for
            reclassification, removed {result.duplicatesRemoved} duplicate signal
            {result.duplicatesRemoved === 1 ? "" : "s"}.
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
            {scanErrors.length} theme{scanErrors.length === 1 ? "" : "s"} failed to scan — results
            below are partial, safe to apply what's shown and re-run later for the rest.
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
              Nothing found in the most recently active themes checked this run — looks clean.
              Re-run later to cover more.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink/60">
                  {proposals.length} theme{proposals.length === 1 ? "" : "s"} with something flagged —
                  review before applying, uncheck anything that doesn't look right.
                </p>
                <button
                  onClick={apply}
                  disabled={applying || totalSelected === 0}
                  className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50"
                >
                  {applying ? "Applying…" : `Apply ${totalSelected} fix${totalSelected === 1 ? "" : "es"}`}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {proposals.map((p) => (
                  <div key={p.themeId} className="rounded-2xl border border-ink/10 bg-white p-4">
                    <Link
                      href={`/eyespy/${p.themeId}`}
                      className="text-sm font-semibold text-ink hover:text-teal"
                    >
                      {p.themeLabel}
                    </Link>

                    {p.misattached.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-amber">
                          Doesn&apos;t belong here
                        </p>
                        <div className="mt-2 flex flex-col gap-1.5">
                          {p.misattached.map((m) => (
                            <label key={m.signalId} className="flex items-start gap-2 text-xs text-ink/70">
                              <input
                                type="checkbox"
                                checked={selectedMisattached.has(m.signalId)}
                                onChange={() => toggleMisattached(m.signalId)}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-ink/30 text-teal focus:ring-teal"
                              />
                              &ldquo;{m.text}&rdquo;
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {p.duplicateGroups.map((g, idx) => (
                      <div key={idx} className="mt-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-teal">Duplicate</p>
                        <p className="mt-1 text-xs text-ink/50">
                          Keeping: &ldquo;{g.keepText}&rdquo;
                        </p>
                        <p className="mt-1 text-xs italic text-ink/40">{g.reasoning}</p>
                        <div className="mt-1.5 flex flex-col gap-1.5">
                          {g.removeIds.map((id, i) => (
                            <label key={id} className="flex items-start gap-2 text-xs text-ink/70">
                              <input
                                type="checkbox"
                                checked={selectedDuplicates.has(id)}
                                onChange={() => toggleDuplicate(id)}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-ink/30 text-teal focus:ring-teal"
                              />
                              &ldquo;{g.removeTexts[i]}&rdquo;
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
