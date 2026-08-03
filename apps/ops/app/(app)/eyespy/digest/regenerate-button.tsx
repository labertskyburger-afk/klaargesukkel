"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegenerateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/eyespy/digest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate digest");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={loading}
        className="whitespace-nowrap rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-95 disabled:opacity-50"
      >
        {loading ? "Generating…" : "Regenerate digest now"}
      </button>
      {error && <p className="text-xs text-amber">{error}</p>}
    </div>
  );
}
