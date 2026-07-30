import clients from "@/data/clients.json";

type Client = {
  name: string;
  engine: string;
  channel: string;
  status: "prospect" | "active" | "paused" | string;
  started: string;
  notes: string;
};

const statusStyle: Record<string, string> = {
  active: "bg-teal/10 text-teal",
  prospect: "bg-amber/20 text-amber",
  paused: "bg-fog/20 text-fog",
};

export default function ClientsPage() {
  const list = clients as Client[];
  const counts = list.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-3xl font-bold text-ink">Client ops</h1>
      <p className="mt-2 text-ink/60">
        {list.length} client{list.length === 1 ? "" : "s"} tracked ·{" "}
        {Object.entries(counts)
          .map(([status, n]) => `${n} ${status}`)
          .join(" · ")}
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/5 text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Engine</th>
              <th className="px-4 py-3">Domain / channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c, i) => (
              <tr key={i} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                <td className="px-4 py-3 text-ink/70">{c.engine}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/70">
                  {c.channel}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      statusStyle[c.status] ?? "bg-ink/10 text-ink/70"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/70">{c.started}</td>
                <td className="px-4 py-3 text-ink/60">{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 max-w-2xl text-xs text-ink/40">
        This list is edited by hand in <code>apps/ops/data/clients.json</code> and
        redeployed — no database yet. Once editing this file feels slower than the
        problem deserves, that's the signal to move it to a real datastore.
      </p>
    </main>
  );
}
