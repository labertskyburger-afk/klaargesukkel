"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push(params.get("from") || "/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8"
      >
        <p className="text-sm font-medium uppercase tracking-widest text-teal">
          Klaargesukkel
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Ops sign in</h1>
        <p className="mt-1 text-sm text-ink/60">
          Clients, projects, and EyeSpy — one login.
        </p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-ink/50">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
          autoFocus
        />

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink/50">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
        />

        {error && <p className="mt-3 text-xs font-medium text-amber">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-sand transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
