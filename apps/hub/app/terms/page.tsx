import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of use — Get It Sorted" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Terms of use</h1>
      <p className="mt-2 text-sm text-ink/50">This page is a placeholder pending full legal review.</p>

      <div className="mt-8 space-y-4 text-ink/70">
        <p>
          Get It Sorted connects customers with independent local service providers. Introductions are
          free — we don&apos;t charge customers or take a commission from providers.
        </p>
        <p>
          Providers introduced through Get It Sorted are independent — they are not employees, agents,
          or contractors of Get It Sorted. We do our best to connect you with suitable, capable
          providers and follow up on whether work was completed, but we don&apos;t guarantee the
          quality, safety, or outcome of work performed by an independent provider.
        </p>
        <p>
          Questions about these terms: {" "}
          <a href="mailto:labertsky.burger@gmail.com" className="text-teal hover:underline">
            labertsky.burger@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
