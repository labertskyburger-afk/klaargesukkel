"use client";

import { useEffect, useState } from "react";
import type { HouseholdState } from "@/lib/types";

const IMPORT_HANDLED_FLAG = "dinnerImportHandled";

function readLegacyState(): HouseholdState | null {
  const hasAny = [
    "dinnerTracker",
    "dinnerShopChecks",
    "dinnerBatchDate",
    "dinnerWeekOverride",
    "dinnerLeftovers",
    "dinnerCustomRecipes",
    "dinnerSubtitle",
  ].some((k) => localStorage.getItem(k) !== null);
  if (!hasAny) return null;

  return {
    subtitle: localStorage.getItem("dinnerSubtitle"),
    trackerState: JSON.parse(localStorage.getItem("dinnerTracker") || "{}"),
    shopChecks: JSON.parse(localStorage.getItem("dinnerShopChecks") || "{}"),
    batchDate: localStorage.getItem("dinnerBatchDate"),
    weekOverride: JSON.parse(localStorage.getItem("dinnerWeekOverride") || "{}"),
    leftovers: JSON.parse(localStorage.getItem("dinnerLeftovers") || "[]"),
    customRecipes: JSON.parse(localStorage.getItem("dinnerCustomRecipes") || "[]"),
  };
}

export default function ImportBanner({
  onImport,
}: {
  onImport: (state: HouseholdState) => void;
}) {
  const [legacyState, setLegacyState] = useState<HouseholdState | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(IMPORT_HANDLED_FLAG)) return;
    setLegacyState(readLegacyState());
  }, []);

  if (!legacyState) return null;

  function dismiss() {
    localStorage.setItem(IMPORT_HANDLED_FLAG, "1");
    setLegacyState(null);
  }

  async function doImport() {
    if (!legacyState) return;
    setImporting(true);
    onImport(legacyState);
    localStorage.setItem(IMPORT_HANDLED_FLAG, "1");
    setImporting(false);
    setLegacyState(null);
  }

  return (
    <div className="banner amber" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ flex: 1 }}>
        This device has an earlier local copy of your dinner data. Import it into your account?
      </span>
      <button className="action" onClick={doImport} disabled={importing}>
        {importing ? "Importing…" : "Import this device's data"}
      </button>
      <button className="action secondary" onClick={dismiss} disabled={importing}>
        Dismiss
      </button>
    </div>
  );
}
