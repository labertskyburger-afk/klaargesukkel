import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy — Get It Sorted" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Privacy policy</h1>
      <p className="mt-2 text-sm text-ink/50">This page is a placeholder pending full legal review.</p>

      <div className="mt-8 space-y-4 text-ink/70">
        <p>
          When you submit a request, a provider application, or a business-support enquiry, we collect
          the details you provide (name, contact information, and what you told us about the job or
          business) so we can connect you with a suitable local provider or follow up directly.
        </p>
        <p>
          Customer request details are shared only with the provider we connect you to, for the purpose
          of contacting you about that request. We don&apos;t sell your information, and we don&apos;t
          share it with providers you weren&apos;t matched to.
        </p>
        <p>
          If you have questions about your data, or want it removed, contact us at{" "}
          <a href="mailto:labertsky.burger@gmail.com" className="text-teal hover:underline">
            labertsky.burger@gmail.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
