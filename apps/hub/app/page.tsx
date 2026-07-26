type Product = {
  name: string;
  subdomain: string;
  blurb: string;
  status: string;
  href?: string;
};

const products: Product[] = [
  {
    name: "Dinner System",
    subdomain: "dinner.klaargesukkel.com",
    blurb:
      "A weeknight dinner planner: freezer inventory tracker, batch-cook scheduling, a recipe library, and shopping lists — built for a real family, works for any.",
    status: "Live",
    href: "https://dinner.klaargesukkel.com",
  },
  {
    name: "Order Desk",
    subdomain: "orders.klaargesukkel.com",
    blurb:
      "A no-fuss ordering system for small shops and food businesses — take orders, track them, done.",
    status: "In development",
  },
  {
    name: "Sukkel Bot",
    subdomain: "chat.klaargesukkel.com",
    blurb:
      "A WhatsApp assistant that handles bookings, FAQs, and orders so you don't have to babysit your phone.",
    status: "In development",
  },
  {
    name: "Pace",
    subdomain: "pace.klaargesukkel.com",
    blurb:
      "A marathon and race training program that adapts to how your training is actually going.",
    status: "In development",
  },
  {
    name: "Cockpit",
    subdomain: "cockpit-omega-blush.vercel.app ↗",
    blurb:
      "A 90-day executive onboarding platform — Claude generates a personalised operating plan for a new leader, then tracks projects, decisions, meetings, and KPIs against it. Built for a client, hosted on its own domain.",
    status: "Live · client project",
    href: "https://cockpit-omega-blush.vercel.app/",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <p className="text-sm font-medium uppercase tracking-widest text-teal">
          Klaargesukkel
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-ink sm:text-6xl">
          Klaar met sukkel.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink/70 sm:text-xl">
          We build small, sharp digital solutions for the everyday hassles people,
          organizations, and businesses run into — ordering systems, WhatsApp bots,
          training programs, and whatever the next problem turns out to be.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="#products"
            className="rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            See what's in the works
          </a>
          <a
            href="mailto:labertsky.burger@gmail.com"
            className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            Got a hassle? Tell us
          </a>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            What we're building
          </h2>
          <p className="mt-3 max-w-2xl text-ink/60">
            Each product ships on its own — its own subdomain, its own focus, its
            own reason to exist. Nothing here is a feature; it's a fix.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const Card = (
                <div
                  className={`h-full rounded-2xl border border-ink/10 bg-sand p-6 transition hover:border-teal/40 ${
                    p.href ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-ink">{p.name}</h3>
                    <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink/70">{p.blurb}</p>
                  <p className="mt-4 text-xs font-mono text-fog">{p.subdomain}</p>
                </div>
              );
              return p.href ? (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {Card}
                </a>
              ) : (
                <div key={p.name}>{Card}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-ink/10">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Why Klaargesukkel
          </h2>
          <p className="mt-4 max-w-3xl text-ink/70">
            Most everyday problems don't need a big platform or a funding round —
            they need someone to actually build the fix. That's what this is: a
            growing shelf of focused tools, each one built fast, hosted properly,
            and aimed at one real hassle for one real person or business.
          </p>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer className="border-t border-ink/10 bg-ink text-sand">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="text-xl font-semibold">Have a problem worth solving?</h2>
          <p className="mt-2 max-w-xl text-sand/70">
            If something in your day-to-day is a constant sukkel, tell us about it.
          </p>
          <a
            href="mailto:labertsky.burger@gmail.com"
            className="mt-6 inline-block rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            labertsky.burger@gmail.com
          </a>
          <p className="mt-10 text-xs text-sand/40">
            © {new Date().getFullYear()} Klaargesukkel. klaargesukkel.com ·
            klaargesukkel.co.za
          </p>
        </div>
      </footer>
    </main>
  );
}
