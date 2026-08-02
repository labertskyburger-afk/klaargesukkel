"use client";

import { trackA, defaultTracker } from "@/lib/data";
import type { TrackerState } from "@/lib/types";

function totalPortionsLeft(tracker: TrackerState): number {
  return Object.values(tracker).reduce((sum, arr) => sum + arr.filter((x) => !x).length, 0);
}

function nextBatchInfo(batchDate: string | null) {
  if (!batchDate) return { text: "Set the date of your last Batch Day.", nextStr: "", daysLeft: 0, overdue: false };
  const d = new Date(batchDate + "T00:00:00");
  const next = new Date(d);
  next.setDate(next.getDate() + 39); // ~5.5 weeks
  const today = new Date();
  const daysLeft = Math.round((next.getTime() - today.getTime()) / 86400000);
  const nextStr = next.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  return { text: "", nextStr, daysLeft, overdue: daysLeft < 0 };
}

export default function TrackerTab({
  tracker,
  onToggle,
  onReset,
  batchDate,
  onChangeBatchDate,
}: {
  tracker: TrackerState;
  onToggle: (recipeName: string, idx: number) => void;
  onReset: () => void;
  batchDate: string | null;
  onChangeBatchDate: (value: string) => void;
}) {
  const total = totalPortionsLeft(tracker);
  const batch = nextBatchInfo(batchDate);

  return (
    <div className="tab active" id="tab-tracker">
      <h2 className="section-title">Freezer Inventory Tracker</h2>
      <p className="subtle">Tap a box to mark a portion used. Synced across your devices.</p>
      <div className="row-flex">
        <div>
          <div className="count-big">{total}</div>
          <div className="subtle" style={{ margin: 0 }}>
            portions left in the freezer
          </div>
        </div>
        <button className="action secondary" onClick={onReset}>
          Reset all to full (20)
        </button>
      </div>

      {total <= 3 ? (
        <div className="banner amber">
          Only {total} portion{total === 1 ? "" : "s"} left — time to plan the next Batch Day.
        </div>
      ) : (
        <div className="banner green">{total} portions in stock — you&apos;re covered.</div>
      )}

      <table className="tracker-table">
        <thead>
          <tr>
            <th>Recipe</th>
            <th>Portion 1</th>
            <th>Portion 2</th>
            <th>Portion 3</th>
            <th>Portion 4</th>
          </tr>
        </thead>
        <tbody>
          {trackA.map((r) => {
            const portions = tracker[r.name] ?? defaultTracker()[r.name];
            return (
              <tr key={r.name}>
                <td className="recipe-name">{r.name}</td>
                {portions.map((used, i) => (
                  <td key={i}>
                    <span
                      className={`box${used ? " used" : ""}`}
                      onClick={() => onToggle(r.name, i)}
                    >
                      {used ? "✓" : ""}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2 className="section-title" style={{ marginTop: 28 }}>
        Batch Day scheduling
      </h2>
      <div className="card">
        <p style={{ margin: "0 0 10px", fontSize: "13.5px" }}>Last Batch Day date:</p>
        <div className="row-flex" style={{ marginBottom: 0 }}>
          <input
            type="date"
            value={batchDate ?? ""}
            onChange={(e) => onChangeBatchDate(e.target.value)}
          />
          <div style={{ fontSize: "13.5px" }}>
            {!batchDate ? (
              batch.text
            ) : batch.overdue ? (
              <b style={{ color: "var(--amber)" }}>
                Next Batch Day was due {batch.nextStr} — overdue by {Math.abs(batch.daysLeft)} days.
              </b>
            ) : (
              <>
                Next Batch Day due around <b>{batch.nextStr}</b> ({batch.daysLeft} days away).
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
