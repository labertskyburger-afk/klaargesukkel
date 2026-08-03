import Link from "next/link";
import MergeThemesClient from "./merge-themes-client";

export const dynamic = "force-dynamic";

export default function MergeThemesPage() {
  return (
    <main className="mx-auto max-w-[900px] px-6 py-14">
      <Link href="/eyespy" className="text-xs font-medium text-teal hover:underline">
        ← All themes
      </Link>

      <h1 className="mt-3 text-3xl font-bold text-ink">Merge duplicate themes</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/60">
        One-time cleanup for themes that got split apart before a classification bug was fixed
        (2026-08-03) — Claude scans all existing themes for clear duplicates, you review and
        confirm, then it reassigns signals to a survivor theme and removes the redundant ones.
        Nothing is merged automatically.
      </p>

      <MergeThemesClient />
    </main>
  );
}
