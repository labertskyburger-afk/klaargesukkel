import ideas from "@/data/ideas.json";

type Idea = {
  name: string;
  type: string;
  status: string;
  description: string;
  location: string;
  docs: string;
  nextAction: string;
  added: string;
};

const columns = [
  "Idea",
  "Spec written",
  "In development",
  "Built — not deployed",
  "Live",
];

const typeStyle: Record<string, string> = {
  "Owned product": "bg-teal/10 text-teal",
  "Client-delivered engine": "bg-amber/20 text-amber",
  "Internal tool": "bg-fog/20 text-fog",
};

export default function DashboardHome() {
  const list = ideas as Idea[];
  const counts = columns.reduce<Record<string, number>>((acc, col) => {
    acc[col] = list.filter((i) => i.status === col).length;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-14">
      <p className="text-sm font-medium uppercase tracking-widest text-teal">
        Klaargesukkel
      </p>
      <h1 className="mt-2 text-3xl font-bold text-ink">Ideas &amp; projects</h1>
      <p className="mt-2 text-ink/60">
        {list.length} tracked · every solution, product, and idea in one place so nothing
        gets missed.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {columns.map((col) => (
          <div key={col} className="flex flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                {col}
              </h2>
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink/50">
                {counts[col] ?? 0}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              {list
                .filter((i) => i.status === col)
                .map((i) => (
                  <div
                    key={i.name}
                    className="rounded-2xl border border-ink/10 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-ink">{i.name}</h3>
                    </div>
                    <span
                      className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        typeStyle[i.type] ?? "bg-ink/10 text-ink/70"
                      }`}
                    >
                      {i.type}
                    </span>
                    <p className="mt-2.5 text-xs leading-relaxed text-ink/70">
                      {i.description}
                    </p>
                    <p className="mt-2.5 text-[11px] font-mono text-fog">{i.location}</p>
                    <div className="mt-2.5 border-t border-ink/10 pt-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">
                        Next
                      </p>
                      <p className="mt-1 text-xs text-ink/70">{i.nextAction}</p>
                    </div>
                    <p className="mt-2.5 text-[11px] text-ink/40">
                      {i.docs} · added {i.added}
                    </p>
                  </div>
                ))}
              {counts[col] === 0 && (
                <div className="rounded-2xl border border-dashed border-ink/10 p-4 text-center text-xs text-ink/30">
                  nothing here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-2xl text-xs text-ink/40">
        This list is edited by hand in <code>apps/dashboard/data/ideas.json</code> and
        redeployed — no database yet, same pattern as apps/admin. Once editing this file feels
        slower than the problem deserves, that's the signal to move it to a real datastore.
      </p>
    </main>
  );
}
