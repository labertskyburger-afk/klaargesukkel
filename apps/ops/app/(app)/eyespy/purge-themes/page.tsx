import Link from "next/link";
import PurgeThemesClient from "./purge-themes-client";

export const dynamic = "force-dynamic";

export default function PurgeThemesPage() {
  return (
    <main className="mx-auto max-w-[900px] px-6 py-14">
      <Link href="/eyespy" className="text-xs font-medium text-teal hover:underline">
        ← All themes
      </Link>

      <h1 className="mt-3 text-3xl font-bold text-ink">Purge off-topic themes</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/60">
        One-time cleanup for themes created from general national/international news (mostly the
        broad RSS sources) rather than genuine local demand in the tracked area — a bug fixed
        2026-08-03 stops this going forward. Claude scans existing themes, you review and
        confirm, then it deletes the theme and its signals entirely. Nothing is deleted
        automatically, and this isn't reversible.
      </p>

      <PurgeThemesClient />
    </main>
  );
}
