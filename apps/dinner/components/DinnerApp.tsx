"use client";

import { useEffect, useRef, useState } from "react";
import Header from "./Header";
import Nav from "./Nav";
import Toast from "./Toast";
import ImportBanner from "./ImportBanner";
import TonightTab from "./TonightTab";
import TrackerTab from "./TrackerTab";
import LibraryTab from "./LibraryTab";
import ShoppingTab from "./ShoppingTab";
import RhythmTab from "./RhythmTab";
import { defaultTracker } from "@/lib/data";
import { DEFAULT_SUBTITLE, type CustomRecipe, type HouseholdState } from "@/lib/types";

const SYNC_DEBOUNCE_MS = 500;
const RETRY_DELAY_MS = 3000;

async function putState(state: HouseholdState) {
  const res = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`PUT /api/state failed: ${res.status}`);
}

export default function DinnerApp({
  initialState,
  userEmail,
  signOutAction,
}: {
  initialState: HouseholdState;
  userEmail: string;
  signOutAction: () => Promise<void>;
}) {
  const [state, setState] = useState<HouseholdState>(initialState);
  const [activeTab, setActiveTab] = useState("tonight");
  const [toastMsg, setToastMsg] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();
  const stateRef = useRef(state);
  stateRef.current = state;
  const isFirstRender = useRef(true);

  function showToast(msg: string) {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 1800);
  }

  // Debounced sync to the server on every state change (skips the initial
  // mount, since that state already came from the server).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      putState(stateRef.current).catch(() => {
        // One retry after a short delay — not a full offline queue, just
        // enough to survive a momentary flaky connection without losing data.
        setTimeout(() => putState(stateRef.current).catch(() => {}), RETRY_DELAY_MS);
      });
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(syncTimer.current);
  }, [state]);

  function update(partial: Partial<HouseholdState>) {
    setState((s) => ({ ...s, ...partial }));
  }

  const tracker = state.trackerState && Object.keys(state.trackerState).length ? state.trackerState : defaultTracker();

  return (
    <>
      <Header
        subtitle={state.subtitle ?? DEFAULT_SUBTITLE}
        onChangeSubtitle={(subtitle) => update({ subtitle })}
      />
      <Nav active={activeTab} onChange={setActiveTab} />
      <main>
        <ImportBanner onImport={(imported) => setState(imported)} />

        {activeTab === "tonight" && (
          <TonightTab
            tracker={tracker}
            onUsePortion={(name) => {
              const next = { ...tracker, [name]: [...tracker[name]] };
              const idx = next[name].findIndex((x) => !x);
              if (idx > -1) {
                next[name][idx] = true;
                update({ trackerState: next });
              }
            }}
            leftovers={state.leftovers}
            onAddLeftover={(text) =>
              update({ leftovers: [...state.leftovers, { text, done: false }] })
            }
            onToggleLeftover={(i) => {
              const next = state.leftovers.map((l, idx) => (idx === i ? { ...l, done: !l.done } : l));
              update({ leftovers: next });
            }}
            onRemoveLeftover={(i) => update({ leftovers: state.leftovers.filter((_, idx) => idx !== i) })}
            customRecipes={state.customRecipes}
          />
        )}

        {activeTab === "tracker" && (
          <TrackerTab
            tracker={tracker}
            onToggle={(name, idx) => {
              const next = { ...tracker, [name]: [...tracker[name]] };
              next[name][idx] = !next[name][idx];
              update({ trackerState: next });
            }}
            onReset={() => update({ trackerState: defaultTracker() })}
            batchDate={state.batchDate}
            onChangeBatchDate={(batchDate) => update({ batchDate })}
          />
        )}

        {activeTab === "library" && (
          <LibraryTab
            customRecipes={state.customRecipes}
            onAddRecipe={(recipe: CustomRecipe) =>
              update({ customRecipes: [...state.customRecipes, recipe] })
            }
            onDeleteRecipe={(i) =>
              update({ customRecipes: state.customRecipes.filter((_, idx) => idx !== i) })
            }
            onToast={showToast}
          />
        )}

        {activeTab === "shopping" && (
          <ShoppingTab
            shopChecks={state.shopChecks}
            onToggleCheck={(key) =>
              update({ shopChecks: { ...state.shopChecks, [key]: !state.shopChecks[key] } })
            }
            onClearChecks={(listId, size) => {
              const next = { ...state.shopChecks };
              for (let i = 0; i < size; i++) delete next[`${listId}-${i}`];
              update({ shopChecks: next });
            }}
            onToast={showToast}
          />
        )}

        {activeTab === "rhythm" && (
          <RhythmTab
            weekOverride={state.weekOverride}
            onEditCell={(day, field, value) => {
              const next = { ...state.weekOverride, [day]: { ...state.weekOverride[day], [field]: value } };
              update({ weekOverride: next });
            }}
            onResetWeek={() => {
              update({ weekOverride: {} });
              showToast("Week plan reset to defaults");
            }}
          />
        )}
      </main>
      <footer>
        Dinner System &middot; {userEmail} &middot; synced to your account &middot;{" "}
        <form action={signOutAction} style={{ display: "inline" }}>
          <button
            type="submit"
            style={{ background: "none", border: "none", padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}
          >
            sign out
          </button>
        </form>
      </footer>
      <Toast message={toastMsg} />
    </>
  );
}
