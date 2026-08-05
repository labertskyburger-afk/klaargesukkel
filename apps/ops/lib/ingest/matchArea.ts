import type { Area } from "@prisma/client";

// Best-effort suburb tagging for a signal's free text — a simple substring
// match against each official suburb's name, not a full NLP/geocoding step.
// Good enough for Phase 1: ArcGIS records already name their suburb
// verbatim in rawText (it's one of the concatenated textFields), and
// search/Reddit/manual-capture text frequently does too since the queries
// themselves are suburb-name alternations. Longest name first so "Durbanville
// Hills" matches before the shorter "Durbanville" substring wins by accident.
export function matchAreaByText(text: string, suburbs: Area[]): Area | null {
  const lower = text.toLowerCase();
  const sorted = [...suburbs].sort((a, b) => b.name.length - a.name.length);
  for (const suburb of sorted) {
    if (lower.includes(suburb.name.toLowerCase())) return suburb;
  }
  return null;
}
