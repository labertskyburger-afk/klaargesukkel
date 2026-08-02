"use client";

import { useState } from "react";
import { trackA, trackB } from "@/lib/data";
import type { CustomRecipe, Leftover, TrackerState } from "@/lib/types";

function totalPortionsLeft(tracker: TrackerState): number {
  return Object.values(tracker).reduce((sum, arr) => sum + arr.filter((x) => !x).length, 0);
}

export default function TonightTab({
  tracker,
  onUsePortion,
  leftovers,
  onAddLeftover,
  onToggleLeftover,
  onRemoveLeftover,
  customRecipes,
}: {
  tracker: TrackerState;
  onUsePortion: (recipeName: string) => void;
  leftovers: Leftover[];
  onAddLeftover: (text: string) => void;
  onToggleLeftover: (index: number) => void;
  onRemoveLeftover: (index: number) => void;
  customRecipes: CustomRecipe[];
}) {
  const [leftoverInput, setLeftoverInput] = useState("");
  const [openCard, setOpenCard] = useState<string | null>(null);
  const total = totalPortionsLeft(tracker);

  function addLeftover() {
    const val = leftoverInput.trim();
    if (!val) return;
    onAddLeftover(val);
    setLeftoverInput("");
  }

  const customTrackB = customRecipes.filter((r) => r.track === "B");

  return (
    <div className="tab active" id="tab-tonight">
      <h2 className="section-title">What&apos;s for dinner tonight?</h2>
      <p className="subtle">Checks your freezer stock first. No stock &rarr; quick from-scratch options.</p>

      <div className="card">
        <p style={{ fontWeight: 700, margin: "0 0 8px", color: "var(--navy)" }}>
          Leftovers &amp; on-the-fly plans
        </p>
        <p className="subtle" style={{ margin: "0 0 10px" }}>
          Jot down anything you&apos;re mid-plan on — &quot;bolognese mince &rarr; lasagna
          Thu&quot; — so it doesn&apos;t fall through the cracks.
        </p>
        <div className="row-flex" style={{ marginBottom: 10 }}>
          <input
            type="text"
            placeholder="e.g. leftover mince → lasagna Thursday"
            style={{ flex: 1, minWidth: 220 }}
            value={leftoverInput}
            onChange={(e) => setLeftoverInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLeftover()}
          />
          <button className="action" onClick={addLeftover}>
            Add
          </button>
        </div>
        <div>
          {leftovers.length === 0 ? (
            <p className="subtle" style={{ margin: 0 }}>
              Nothing logged yet.
            </p>
          ) : (
            leftovers.map((item, i) => (
              <div key={i} className={`shop-item${item.done ? " checked" : ""}`}>
                <span
                  className={`checkbox${item.done ? " checked" : ""}`}
                  onClick={() => onToggleLeftover(i)}
                >
                  {item.done ? "✓" : ""}
                </span>
                <span className="label">{item.text}</span>
                <span className="remove" onClick={() => onRemoveLeftover(i)}>
                  &times;
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="banner green">
            Freezer stock: {total} portion{total === 1 ? "" : "s"} left — grab one of these
            instead of cooking from scratch.
          </div>
          <div className="grid">
            {trackA.map((r) => {
              const left = tracker[r.name]?.filter((x) => !x).length ?? 0;
              if (left === 0) return null;
              const open = openCard === r.name;
              return (
                <div
                  key={r.name}
                  className={`recipe-card${open ? " open" : ""}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === "BUTTON") return;
                    setOpenCard(open ? null : r.name);
                  }}
                >
                  <h3>{r.name}</h3>
                  <span className="time">
                    {r.time} &middot; {left} left
                  </span>
                  <div className="detail">
                    <p>
                      <b>Reheat:</b> {r.reheat}
                    </p>
                    <button
                      className="action"
                      style={{ marginTop: 6 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUsePortion(r.name);
                      }}
                    >
                      Mark one portion used
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="banner amber">
          Freezer is empty — pick a quick from-scratch option below, and plan the next Batch
          Day soon.
        </div>
      )}

      <h2 className="section-title" style={{ marginTop: 26 }}>
        Quick from-scratch options (Track B)
      </h2>
      <p className="subtle">Tap a card for ingredients &amp; method. 15&ndash;30 minutes each.</p>
      <div className="grid">
        {[...trackB, ...customTrackB].map((r) => {
          const key = r.name;
          const open = openCard === `b-${key}`;
          const isCustom = "custom" in r;
          return (
            <div
              key={key}
              className={`recipe-card${open ? " open" : ""}`}
              onClick={() => setOpenCard(open ? null : `b-${key}`)}
            >
              <h3>
                {r.name}
                {isCustom && <span className="badge-custom">yours</span>}
              </h3>
              <span className="time">{r.time}</span>
              <div className="detail">
                <p>
                  <b>Ingredients:</b> {r.ingredients}
                </p>
                <p>
                  <b>Method:</b> {r.method}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
