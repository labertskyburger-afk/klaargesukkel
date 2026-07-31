"use client";

import { useRef, useState } from "react";

type Group = { id: string; label: string };

type Result = {
  stored: boolean;
  signalText?: string;
  reason?: string;
  error?: string;
};

export default function CaptureForm({ groups }: { groups: Group[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("screenshot", file);
    if (groupId) formData.append("groupId", groupId);

    const res = await fetch("/api/eyespy/capture", { method: "POST", body: formData });
    const data = await res.json();
    setResults((prev) => [res.ok ? data : { stored: false, error: data.error }, ...prev]);
    setLoading(false);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mt-8">
      <form onSubmit={onSubmit} className="rounded-2xl border border-ink/10 bg-white p-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50">
          Screenshot
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm text-ink/70"
        />

        {groups.length > 0 && (
          <>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink/50">
              Which group is this from?
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink"
            >
              <option value="">Not specified</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="mt-6 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Extracting…" : "Upload & extract"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {results.map((r, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3 text-sm ${
                r.error
                  ? "border-amber/40 bg-amber/10 text-ink/70"
                  : r.stored
                    ? "border-teal/30 bg-teal/5 text-ink/80"
                    : "border-ink/10 bg-ink/5 text-ink/50"
              }`}
            >
              {r.error && <>Error: {r.error}</>}
              {!r.error && r.stored && <>Captured: &ldquo;{r.signalText}&rdquo;</>}
              {!r.error && !r.stored && <>Skipped: {r.reason}</>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
