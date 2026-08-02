"use client";

const tabs: [string, string][] = [
  ["tonight", "Tonight"],
  ["tracker", "Freezer Tracker"],
  ["library", "Recipe Library"],
  ["shopping", "Shopping Lists"],
  ["rhythm", "Weekly Rhythm"],
];

export default function Nav({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav>
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={active === id ? "active" : ""}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
