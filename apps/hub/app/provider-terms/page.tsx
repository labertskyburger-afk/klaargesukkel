import type { Metadata } from "next";

export const metadata: Metadata = { title: "Provider terms — Get It Sorted" };

export default function ProviderTermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Provider terms</h1>
      <p className="mt-2 text-sm text-ink/50">This page is a placeholder pending full legal review.</p>

      <div className="mt-8 space-y-4 text-ink/70">
        <p>
          Joining the Get It Sorted provider network is free. We don&apos;t charge for leads, take a
          percentage of your work, or offer paid placement — your position in the network is based on
          suitability, availability, and how your work turns out, not on payment.
        </p>
        <p>
          You remain an independent provider — Get It Sorted does not employ you, and you choose which
          jobs to accept. You&apos;re responsible for the quality, safety, and legal compliance of your
          own work, including any licensing or insurance your trade requires.
        </p>
        <p>
          We may ask for basic verification (identity, references, relevant certifications) before or
          after listing you, and we follow up with customers to check whether work was completed — this
          may affect whether we continue sending you work, but never in exchange for payment.
        </p>
        <p>
          Optional paid business-support services (bookkeeping, systems, etc.) are entirely separate
          from this network and never affect your ranking or how much work you&apos;re offered.
        </p>
        <p>
          Questions: {" "}
          <a href="mailto:labertsky.burger@gmail.com" className="text-teal hover:underline">
            labertsky.burger@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
