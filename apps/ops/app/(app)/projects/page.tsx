import ideas from "@/data/ideas.json";

type Priority = "High" | "Medium" | "Low";

type NextStep = {
  step: string;
  owner: string;
  waitingOn: string;
  priority: Priority;
};

type Idea = {
  name: string;
  type: string;
  status: string;
  priority: Priority;
  description: string;
  location: string;
  docs: string;
  nextSteps: NextStep[];
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

const priorityRank: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

const priorityDot: Record<Priority, string> = {
  High: "bg-amber",
  Medium: "bg-teal",
  Low: "bg-fog",
};

const priorityText: Record<Priority, string> = {
  High: "text-amber",
  Medium: "text-teal",
  Low: "text-fog",
};

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${priorityText[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${priorityDot[priority]}`} />
      {priority}
    </span>
  );
}

export default function ProjectsPage() {
  const list = (ideas as Idea[])
    .slice()
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const counts = columns.reduce<Record<string, number>>((acc, col) => {
    acc[col] = list.filter((i) => i.status === col).length;
    return acc;
  }, {});

  const attention = list
    .flatMap((idea) =>
      idea.nextSteps.map((s) => ({ idea: idea.name, ideaPriority: idea.priority, ...s }))
    )
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-14">
      <h1 className="text-3xl font-bold text-ink">Ideas &amp; projects</h1>
      <p className="mt-2 text-ink/60">
        {list.length} tracked · every solution, product, and idea in one place so nothing
        gets missed.
      </p>

      {/* Cross-project next steps */}
      <section className="mt-10 rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/70">
          Next steps — across everything
        </h2>
        <p className="mt-1 text-xs text-ink/50">
          Every open step, sorted by priority, so nothing sits waiting without someone owning
          it.
        </p>
        <div className="mt-4 flex flex-col divide-y divide-ink/10">
          {attention.length === 0 && (
            <p className="py-3 text-sm text-ink/40">Nothing open right now.</p>
          )}
          {attention.map((a, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[140px_1fr_200px] sm:items-start sm:gap-4">
              <div className="flex items-center gap-2">
                <PriorityBadge priority={a.priority} />
              </div>
              <div>
                <p className="text-sm text-ink">
                  <span className="font-semibold">{a.idea}</span> — {a.step}
                </p>
                {a.waitingOn && (
                  <p className="mt-0.5 text-xs text-ink/50">Waiting on: {a.waitingOn}</p>
                )}
              </div>
              <p className="text-xs font-medium text-ink/60 sm:text-right">{a.owner}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kanban board */}
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
                      <PriorityBadge priority={i.priority} />
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
                        Next steps
                      </p>
                      {i.nextSteps.length === 0 ? (
                        <p className="mt-1 text-xs text-ink/40">None — nothing pending.</p>
                      ) : (
                        <ul className="mt-1.5 flex flex-col gap-2">
                          {i.nextSteps.map((s, idx) => (
                            <li key={idx} className="text-xs">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-ink/70">{s.step}</span>
                                <PriorityBadge priority={s.priority} />
                              </div>
                              <p className="mt-0.5 text-[11px] text-ink/45">
                                Owner: {s.owner}
                                {s.waitingOn ? ` · Waiting on: ${s.waitingOn}` : ""}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
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
        This list is edited by hand in <code>apps/ops/data/ideas.json</code> and
        redeployed — no database yet. Once editing this file feels slower than the problem
        deserves, that's the signal to move it to a real datastore.
      </p>
    </main>
  );
}
