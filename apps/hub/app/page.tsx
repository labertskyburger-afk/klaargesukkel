"use client";

import Header from "./components/Header";
import RequestForm, { SERVICE_CATEGORIES } from "./components/RequestForm";
import ProviderForm from "./components/ProviderForm";
import BusinessSupportForm from "./components/BusinessSupportForm";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function selectCategory(category: string) {
  window.dispatchEvent(new CustomEvent("gis:selectCategory", { detail: category }));
  scrollTo("find-help");
}

const WHY_DIFFERENT = [
  "Customers don't pay us to find help.",
  "Providers don't buy leads.",
  "We don't take a percentage of the job.",
  "Nobody can pay for better placement.",
  "Good response, good work and good after-support earn future opportunities.",
  "We follow up to find out whether the problem was sorted.",
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Tell us what is wrong",
    body: "Give us the basics: what you need, where you are and when you need it.",
  },
  {
    step: "2",
    title: "We find the right fit",
    body: "We connect you with a suitable local provider based on capability, availability and previous service — not who paid the most.",
  },
  {
    step: "3",
    title: "We follow it through",
    body: "We check whether the work was completed and the problem was genuinely resolved.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-sand">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal">
          Local help that follows through
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-6xl">
          Something needs sorting?
        </h1>
        <p className="mt-3 text-xl font-medium text-teal sm:text-2xl">
          The right help. From the right people. Followed through.
        </p>
        <p className="mt-6 max-w-2xl text-lg text-ink/70">
          Tell us what you need — from a plumber, handyman or auto electrician to help getting your
          small business under control. We&apos;ll connect you with someone suitable and check that
          the problem gets sorted.
        </p>
        <p className="mt-4 text-sm font-semibold text-ink">
          It&apos;s free. No lead fees. No hidden commissions.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => {
              trackEvent(AnalyticsEvent.PrimaryCtaClicked, { location: "hero" });
              scrollTo("find-help");
            }}
            className="rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            Get something sorted
          </button>
          <button
            onClick={() => {
              trackEvent(AnalyticsEvent.ProviderCtaClicked, { location: "hero" });
              scrollTo("provider");
            }}
            className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            I provide a service
          </button>
        </div>

        <p className="mt-10 text-xs font-medium uppercase tracking-wide text-slate">
          Local help &middot; Verified providers &middot; Free introductions &middot; No pay-to-rank
        </p>
      </section>

      {/* Choose a pathway */}
      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">What needs sorting?</h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-teal bg-teal-panel p-7">
              <h3 className="text-xl font-semibold text-ink">Find local help</h3>
              <p className="mt-3 text-ink/70">
                A leaking pipe. A vehicle electrical problem. A repair that keeps being postponed.
                Tell us what is wrong, where you are and how urgent it is.
              </p>
              <button
                onClick={() => scrollTo("find-help")}
                className="mt-6 rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
              >
                Find the right help
              </button>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-sand p-7">
              <h3 className="text-xl font-semibold text-ink">Sort out my business</h3>
              <p className="mt-3 text-ink/70">
                Admin, cash flow, staffing, reporting, systems or simply too much depending on you.
                We help identify the real problem and put practical support around it.
              </p>
              <button
                onClick={() => scrollTo("business-support")}
                className="mt-6 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
              >
                Sort out my business
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">From stuck to sorted.</h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-sand">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/70">{s.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-lg font-medium text-teal">
            One request. The right connection. A problem sorted.
          </p>
        </div>
      </section>

      {/* Service categories */}
      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">What can we help you sort?</h2>
          <p className="mt-3 text-ink/60">
            We&apos;re starting in Cape Town&apos;s Northern Suburbs — Durbanville, Bellville,
            Brackenfell and surrounds.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => selectCategory(c)}
                className="rounded-2xl border border-ink/10 bg-sand p-5 text-left transition hover:border-teal/40"
              >
                <span className="font-semibold text-ink">{c}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Request form */}
      <section id="find-help" className="border-t border-ink/10">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Tell us what needs sorting</h2>
          <p className="mt-3 text-ink/60">
            Takes about a minute. We&apos;ll review it and connect you with someone suitable.
          </p>
          <div className="mt-8">
            <RequestForm />
          </div>
        </div>
      </section>

      {/* Why different */}
      <section className="border-t border-ink/10 bg-ink text-sand">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Not another directory. Not another list of paid leads.
          </h2>
          <p className="mt-4 max-w-2xl text-sand/70">
            Get It Sorted is built around outcomes — not clicks, listings or commissions.
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {WHY_DIFFERENT.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-2xl border border-sand/15 p-5">
                <span className="mt-0.5 text-amber">&#10003;</span>
                <span className="text-sand/90">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Provider invitation */}
      <section id="provider" className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                Do good work? Let&apos;s send the right work your way.
              </h2>
              <p className="mt-4 text-ink/70">
                We&apos;re building a trusted network of local service providers who respond,
                communicate clearly, charge fairly and stand behind their work.
              </p>
              <p className="mt-3 text-ink/70">
                You remain independent. You choose which jobs to accept. We don&apos;t employ you,
                sell you leads or take commission from your work.
              </p>
              <p className="mt-3 font-medium text-teal">
                Your track record — not your advertising budget — builds your position in the
                network.
              </p>
            </div>
            <ProviderForm />
          </div>
        </div>
      </section>

      {/* Business support */}
      <section id="business-support" className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">
                Good at the work — but tired of struggling with the business?
              </h2>
              <p className="mt-4 text-ink/70">
                Winning work is only part of running a successful business. Get It Sorted can also
                help you put the right support behind it — including custom software and systems,
                the same kind of ordering tools, booking assistants and internal dashboards we&apos;ve
                built for other businesses.
              </p>
              <div className="mt-6 rounded-2xl border border-teal/30 bg-teal-panel p-5">
                <p className="text-sm font-semibold text-ink">
                  These services are optional. Using them will never improve a provider&apos;s
                  position in the network.
                </p>
              </div>
            </div>
            <BusinessSupportForm />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">What needs sorting?</h2>
          <p className="mt-4 text-ink/70">
            Tell us what is getting in the way. We&apos;ll help you find the right next step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollTo("find-help")}
              className="rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
            >
              Get it sorted
            </button>
            <button
              onClick={() => scrollTo("provider")}
              className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
            >
              Join as a provider
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-ink text-sand">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="text-lg font-bold">Get It Sorted</p>
          <p className="mt-2 max-w-md text-sm text-sand/70">
            Born from a simple idea: mense is klaar gesukkel. We connect people and businesses in
            Cape Town&apos;s Northern Suburbs with the right local help — and follow through until
            it&apos;s sorted.
          </p>
          <p className="mt-2 text-sm text-sand/50">Service area: Cape Town&apos;s Northern Suburbs</p>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm text-sand/70">
            <a href="mailto:labertsky.burger@gmail.com" className="hover:text-sand">
              labertsky.burger@gmail.com
            </a>
            {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER && (
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent(AnalyticsEvent.WhatsappContactClicked, { location: "footer" })}
                className="hover:text-sand"
              >
                WhatsApp
              </a>
            )}
            <a href="/privacy" className="hover:text-sand">
              Privacy policy
            </a>
            <a href="/terms" className="hover:text-sand">
              Terms of use
            </a>
            <a href="/provider-terms" className="hover:text-sand">
              Provider terms
            </a>
            <a href="mailto:labertsky.burger@gmail.com?subject=Complaint or support" className="hover:text-sand">
              Complaints or support
            </a>
          </div>

          <p className="mt-10 text-xs italic text-sand/40">
            Get It Sorted — because people and businesses are klaar gesukkel.
          </p>
          <p className="mt-4 text-xs text-sand/40">
            © {new Date().getFullYear()} Klaargesukkel (Pty) Ltd, trading as Get It Sorted.
            klaargesukkel.com
          </p>
        </div>
      </footer>
    </main>
  );
}
