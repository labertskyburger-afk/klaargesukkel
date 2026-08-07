"use client";

import { useRef, useState } from "react";

type Group = { id: string; label: string };

type Result = {
  stored: boolean;
  signalText?: string;
  group?: string | null;
  area?: string | null;
  reason?: string;
  error?: string;
};

export default function CaptureForm({ groups }: { groups: Group[] }) {
  const [files, setFiles] = useState<File[]>([]);
  const [groupId, setGroupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File): Promise<Result> {
    const formData = new FormData();
    formData.append("screenshot", file);
    if (groupId) formData.append("groupId", groupId);

    const res = await fetch("/api/eyespy/capture", { method: "POST", body: formData });
    const data = await res.json();
    return res.ok ? data : { stored: false, error: data.error };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true);
    setProgress({ done: 0, total: files.length });

    // Sequential, not parallel — each upload is its own vision-extraction
    // call, and running them one at a time keeps this simple and avoids
    // slamming the API with a burst of concurrent requests.
    for (const file of files) {
      const result = await uploadOne(file);
      setResults((prev) => [result, ...prev]);
      setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
    }

    setLoading(false);
    setProgress(null);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mt-8">
      <form onSubmit={onSubmit} className="rounded-2xl border border-ink/10 bg-white p-6">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50">
          Screenshots
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1 w-full text-sm text-ink/70"
        />
        {files.length > 0 && (
          <p className="mt-1 text-xs text-ink/50">
            {files.length} file{files.length === 1 ? "" : "s"} selected — uploaded one at a time,
            each processed and de-identified separately.
          </p>
        )}

        {groups.length > 0 && (
          <>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink/50">
              Fallback group (optional)
            </label>
            <p className="mt-0.5 text-xs text-ink/40">
              Each screenshot's group is read automatically from the group name visible in the
              image itself — mixed-group batches are fine. Only used if a screenshot is cropped
              too tight for that to be readable.
            </p>
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
          disabled={files.length === 0 || loading}
          className="mt-6 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading && progress
            ? `Extracting… (${progress.done}/${progress.total})`
            : `Upload & extract${files.length > 1 ? ` (${files.length})` : ""}`}
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
              {!r.error && r.stored && (
                <>
                  Captured: &ldquo;{r.signalText}&rdquo;
                  {(r.group || r.area) && (
                    <span className="text-ink/40">
                      {" — "}
                      {[r.group, r.area].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </>
              )}
              {!r.error && !r.stored && <>Skipped: {r.reason}</>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
