"use client";

import { useState } from "react";
import { DEFAULT_SUBTITLE } from "@/lib/types";

export default function Header({
  subtitle,
  onChangeSubtitle,
}: {
  subtitle: string;
  onChangeSubtitle: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtitle);

  function save() {
    onChangeSubtitle(draft.trim() || DEFAULT_SUBTITLE);
    setEditing(false);
  }

  return (
    <header>
      <h1>The Monday&ndash;Thursday Dinner System</h1>
      <div className="header-sub-row">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            autoFocus
            style={{
              flex: 1,
              minWidth: 200,
              padding: "6px 10px",
              borderRadius: 6,
              border: "none",
              fontSize: "13.5px",
            }}
          />
        ) : (
          <p>{subtitle}</p>
        )}
        <button
          className="icon-btn"
          title="Edit household info"
          onClick={() => {
            setDraft(subtitle);
            setEditing(true);
          }}
        >
          Edit
        </button>
      </div>
    </header>
  );
}
