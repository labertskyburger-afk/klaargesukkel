"use client";

import { useState } from "react";
import { shopWeek, shopBatch } from "@/lib/data";
import type { ShopChecks } from "@/lib/types";

export default function ShoppingTab({
  shopChecks,
  onToggleCheck,
  onClearChecks,
  onToast,
}: {
  shopChecks: ShopChecks;
  onToggleCheck: (key: string) => void;
  onClearChecks: (listId: string, size: number) => void;
  onToast: (msg: string) => void;
}) {
  const [currentShop, setCurrentShop] = useState<"week" | "batch">("week");
  const list = currentShop === "week" ? shopWeek : shopBatch;
  const totalEst = list.reduce((sum, [, , cost]) => sum + (parseInt(cost.replace("R", ""), 10) || 0), 0);

  function copyList() {
    const lines = list
      .filter((_, i) => !shopChecks[`${currentShop}-${i}`])
      .map(([name, qty, cost]) => `${name} — ${qty} (${cost})`);
    const header = currentShop === "week" ? "This week's Sixty60 order" : "Batch Day order";
    const text = `${header}\n${lines.join("\n")}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => onToast("Shopping list copied"),
        () => onToast("Could not copy — select and copy manually")
      );
    } else {
      onToast("Copy not supported on this browser");
    }
  }

  return (
    <div className="tab active" id="tab-shopping">
      <h2 className="section-title">Shopping Lists</h2>
      <div className="pill-row">
        <button
          className={`pill${currentShop === "week" ? " active" : ""}`}
          onClick={() => setCurrentShop("week")}
        >
          This week&apos;s quick order
        </button>
        <button
          className={`pill${currentShop === "batch" ? " active" : ""}`}
          onClick={() => setCurrentShop("batch")}
        >
          Batch Day order
        </button>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>
          {currentShop === "week" ? "This week's order" : "Batch Day order"} — est. total R
          {totalEst}
        </div>
        <div>
          {list.map(([name, qty, cost], i) => {
            const key = `${currentShop}-${i}`;
            const checked = !!shopChecks[key];
            return (
              <div key={key} className={`shop-item${checked ? " checked" : ""}`}>
                <span
                  className={`checkbox${checked ? " checked" : ""}`}
                  onClick={() => onToggleCheck(key)}
                >
                  {checked ? "✓" : ""}
                </span>
                <span className="label">{name}</span>
                <span className="qty">
                  {qty} &middot; {cost}
                </span>
              </div>
            );
          })}
        </div>
        <div className="row-flex" style={{ marginTop: 12, marginBottom: 0 }}>
          <button
            className="action secondary"
            onClick={() => onClearChecks(currentShop, list.length)}
          >
            Clear checks
          </button>
          <button className="action" onClick={copyList}>
            Copy list
          </button>
        </div>
      </div>
      <p className="subtle">
        Prices are estimates — confirm at Sixty60 checkout, they vary by branch and promotion.
      </p>
    </div>
  );
}
