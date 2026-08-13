import Link from "next/link";
import BackfillNatureClient from "./backfill-nature-client";

export const dynamic = "force-dynamic";

export default function BackfillNaturePage() {
  return (
    <main className="mx-auto max-w-[700px] px-6 py-14">
      <Link href="/eyespy" className="text-xs font-medium text-teal hover:underline">
        ← All themes
      </Link>

      <h1 className="mt-3 text-3xl font-bold text-ink">Backfill civic/municipal classification</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/60">
        One-time catch-up for demand signals classified before the civic/municipal distinction
        existed (2026-08-06) — the routine cron only processes 40 at a time, shared with pulling
        and theme classification, which is too slow to work through an existing backlog. This just
        adds the missing classification to each signal — nothing is deleted or reassigned, safe to
        click repeatedly until nothing's left.
      </p>

      <BackfillNatureClient />
    </main>
  );
}
