import Link from "next/link";
import SenseCheckClient from "./sense-check-client";

export const dynamic = "force-dynamic";

export default function SenseCheckPage() {
  return (
    <main className="mx-auto max-w-[900px] px-6 py-14">
      <Link href="/eyespy" className="text-xs font-medium text-teal hover:underline">
        ← All themes
      </Link>

      <h1 className="mt-3 text-3xl font-bold text-ink">Sense-check theme signals</h1>
      <p className="mt-2 max-w-xl text-sm text-ink/60">
        Checks inside each theme, not across themes — catches things merge-themes and purge-themes
        can't: a signal that doesn't actually match its theme's topic (e.g. a municipal complaint
        attached to a healthcare-recommendations theme), and the same underlying post captured more
        than once with slightly different extracted wording each time. Claude scans, you review and
        confirm, then it applies. Misattached signals are unhooked and re-queued for
        reclassification, not deleted. Duplicate signals are deleted — this isn&apos;t reversible.
      </p>

      <SenseCheckClient />
    </main>
  );
}
