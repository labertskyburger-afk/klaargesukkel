"use client";

import { weekPlanDefaults } from "@/lib/data";
import type { WeekOverride } from "@/lib/types";

export default function RhythmTab({
  weekOverride,
  onEditCell,
  onResetWeek,
}: {
  weekOverride: WeekOverride;
  onEditCell: (day: string, field: "meal" | "note", value: string) => void;
  onResetWeek: () => void;
}) {
  const todayAbbr = new Date().toLocaleDateString("en-GB", { weekday: "short" });

  return (
    <div className="tab active" id="tab-rhythm">
      <h2 className="section-title">Weekly Rhythm &amp; Rules</h2>
      <div className="card">
        <p style={{ fontWeight: 700, marginTop: 0 }}>Every Sunday, before the Sixty60 order:</p>
        <ul className="notes">
          <li>
            <b>4+ portions left</b> &rarr; covered for the week, no shopping beyond fresh sides.
          </li>
          <li>
            <b>1–3 portions left</b> &rarr; small Sixty60 top-up, mix freezer + one Track B
            night.
          </li>
          <li>
            <b>0 portions left</b> &rarr; full Track B week, and pencil in the next Batch Day
            within 1–2 weeks.
          </li>
          <li>Batch Day is due roughly every 5–6 weeks — check the Freezer Tracker tab.</li>
        </ul>
      </div>

      <h2 className="section-title" style={{ marginTop: 24 }}>
        Notes for picky eaters
      </h2>
      <div className="card">
        <ul className="notes">
          <li>
            Every recipe keeps sauce separate from starch by default — kids who don&apos;t
            like &quot;mixed&quot; food get components side-by-side.
          </li>
          <li>
            Hidden veg (grated carrot, butternut, zucchini) goes into sauces already cooked
            down, never on the plate as a visible vegetable.
          </li>
          <li>Spice stays mild throughout; heat/extras are added at the table for adults only.</li>
          <li>Cheese on the side is the universal fallback for a hard-no night — keep a block in reserve.</li>
          <li>New foods go alongside a &quot;safe&quot; side the kids already eat, never as the whole plate.</li>
        </ul>
      </div>

      <h2 className="section-title" style={{ marginTop: 24 }}>
        This week&apos;s plan
      </h2>
      <div className="card">
        <p className="subtle" style={{ margin: "0 0 10px" }}>
          Tap any Dinner or Note cell to edit it — changes sync automatically.
        </p>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Dinner</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {weekPlanDefaults.map((d) => {
              const ov = weekOverride[d.day] || {};
              const meal = ov.meal !== undefined ? ov.meal : d.meal;
              const note = ov.note !== undefined ? ov.note : d.note;
              const isToday = d.day === todayAbbr;
              return (
                <tr key={d.day} className={isToday ? "today-row" : ""}>
                  <td>
                    <b>{d.day}</b>
                    {isToday && (
                      <span style={{ color: "var(--gold)", fontWeight: 700 }}> · today</span>
                    )}
                  </td>
                  <td
                    className="editable-cell"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onEditCell(d.day, "meal", e.currentTarget.textContent?.trim() ?? "")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {meal}
                  </td>
                  <td
                    className="editable-cell"
                    style={{ color: "var(--muted)", fontSize: "12.5px" }}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onEditCell(d.day, "note", e.currentTarget.textContent?.trim() ?? "")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {note}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className="action secondary" style={{ marginTop: 10 }} onClick={onResetWeek}>
          Reset week plan to defaults
        </button>
      </div>
    </div>
  );
}
