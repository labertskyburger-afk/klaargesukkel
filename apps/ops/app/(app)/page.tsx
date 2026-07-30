import Link from "next/link";

const tools = [
  {
    name: "Projects",
    href: "/projects",
    description:
      "Every idea, product, and project — status, priority, and what's next.",
  },
  {
    name: "Clients",
    href: "/clients",
    description:
      "Who's live, who's a prospect, and what engine/domain they're on.",
  },
  {
    name: "EyeSpy",
    href: "/eyespy",
    description: "Demand-signal research tool for regional pain points.",
  },
];

export default function OpsHome() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-14">
      <h1 className="text-3xl font-bold text-ink">Ops</h1>
      <p className="mt-2 text-ink/60">Pick a tool.</p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tools.map((t) => (
          <Link
            key={t.name}
            href={t.href}
            className="rounded-2xl border border-ink/10 bg-white p-6 transition hover:border-teal/40"
          >
            <h2 className="text-lg font-semibold text-ink">{t.name}</h2>
            <p className="mt-2 text-sm text-ink/60">{t.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
