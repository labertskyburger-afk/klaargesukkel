"use client";

import { useState } from "react";
import { trackA, trackB } from "@/lib/data";
import type { CustomRecipe } from "@/lib/types";

type Filter = "all" | "A" | "B";

export default function LibraryTab({
  customRecipes,
  onAddRecipe,
  onDeleteRecipe,
  onToast,
}: {
  customRecipes: CustomRecipe[];
  onAddRecipe: (recipe: CustomRecipe) => void;
  onDeleteRecipe: (index: number) => void;
  onToast: (msg: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [form, setForm] = useState({
    track: "B" as "A" | "B",
    name: "",
    time: "",
    ingredients: "",
    method: "",
    reheat: "",
  });

  function saveRecipe() {
    const { name, ingredients, method } = form;
    if (!name.trim() || !ingredients.trim() || !method.trim()) {
      onToast("Name, ingredients and method are needed");
      return;
    }
    onAddRecipe({
      name: name.trim(),
      time: form.time.trim() || "time varies",
      ingredients: ingredients.trim(),
      method: method.trim(),
      reheat: form.reheat.trim(),
      track: form.track,
      custom: true,
    });
    setForm({ track: "B", name: "", time: "", ingredients: "", method: "", reheat: "" });
    setShowAdd(false);
    onToast("Recipe saved");
  }

  type Item = {
    key: string;
    name: string;
    time: string;
    track: "A" | "B";
    badge: boolean;
    detail: React.ReactNode;
  };

  const items: Item[] = [];
  if (filter === "all" || filter === "A") {
    trackA.forEach((r) =>
      items.push({
        key: r.name,
        name: r.name,
        time: r.time,
        track: "A",
        badge: false,
        detail: (
          <>
            <p>
              <b>Single batch (serves 4):</b> {r.single}
            </p>
            <p>
              <b>Quadruple (Batch Day):</b> {r.quad}
            </p>
            <p>
              <b>Method:</b> {r.method}
            </p>
            <p>
              <b>Weeknight reheat:</b> {r.reheat}
            </p>
          </>
        ),
      })
    );
  }
  if (filter === "all" || filter === "B") {
    trackB.forEach((r) =>
      items.push({
        key: r.name,
        name: r.name,
        time: r.time,
        track: "B",
        badge: false,
        detail: (
          <>
            <p>
              <b>Ingredients:</b> {r.ingredients}
            </p>
            <p>
              <b>Method:</b> {r.method}
            </p>
          </>
        ),
      })
    );
  }
  customRecipes.forEach((r, i) => {
    if (filter !== "all" && filter !== r.track) return;
    items.push({
      key: `custom-${i}`,
      name: r.name,
      time: r.time,
      track: r.track,
      badge: true,
      detail: (
        <>
          <p>
            <b>Ingredients:</b> {r.ingredients}
          </p>
          <p>
            <b>Method:</b> {r.method}
          </p>
          {r.reheat && (
            <p>
              <b>Reheat:</b> {r.reheat}
            </p>
          )}
          <button
            className="action secondary"
            style={{ marginTop: 6 }}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRecipe(i);
              onToast("Recipe deleted");
            }}
          >
            Delete
          </button>
        </>
      ),
    });
  });

  return (
    <div className="tab active" id="tab-library">
      <h2 className="section-title">Recipe Library</h2>
      <div className="pill-row">
        {(["all", "A", "B"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`pill${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "A" ? "Track A — Batch & Freeze" : "Track B — Quick"}
          </button>
        ))}
      </div>

      <button className="action secondary" style={{ marginBottom: 14 }} onClick={() => setShowAdd(!showAdd)}>
        + Add your own recipe
      </button>

      {showAdd && (
        <div className="card">
          <div className="row-flex" style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Track:
              <select
                style={{ marginLeft: 6 }}
                value={form.track}
                onChange={(e) => setForm({ ...form, track: e.target.value as "A" | "B" })}
              >
                <option value="B">B — Quick (15–30 min)</option>
                <option value="A">A — Batch &amp; Freeze</option>
              </select>
            </label>
          </div>
          <input
            type="text"
            placeholder="Recipe name"
            style={{ width: "100%", marginBottom: 8 }}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Time (e.g. 20 min)"
            style={{ width: "100%", marginBottom: 8 }}
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <textarea
            placeholder="Ingredients"
            style={{ marginBottom: 8, minHeight: 50 }}
            value={form.ingredients}
            onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
          />
          <textarea
            placeholder="Method"
            style={{ marginBottom: 8, minHeight: 50 }}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          />
          <textarea
            placeholder="Reheat instructions (optional, mainly for Track A)"
            style={{ marginBottom: 10, minHeight: 40 }}
            value={form.reheat}
            onChange={(e) => setForm({ ...form, reheat: e.target.value })}
          />
          <button className="action" onClick={saveRecipe}>
            Save recipe
          </button>{" "}
          <button className="action secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </button>
        </div>
      )}

      <div className="grid">
        {items.map((item) => {
          const open = openCard === item.key;
          return (
            <div
              key={item.key}
              className={`recipe-card${open ? " open" : ""}`}
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName === "BUTTON") return;
                setOpenCard(open ? null : item.key);
              }}
            >
              <h3>
                {item.name}
                {item.badge && <span className="badge-custom">yours</span>}{" "}
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                  Track {item.track}
                </span>
              </h3>
              <span className="time">{item.time}</span>
              <div className="detail">{item.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
