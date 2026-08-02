import type { NormalizedSignal, PlacesSourceConfig } from "./types";

type PlaceReview = {
  text?: { text?: string };
  publishTime?: string;
  // authorAttribution deliberately not requested/typed — reviewer
  // name/photo are never stored, only the review text itself.
};

type Place = {
  id?: string;
  displayName?: { text?: string };
  reviews?: PlaceReview[];
};

type SearchNearbyResponse = {
  places?: Place[];
};

// Google Places API (New) — radius search around Durbanville, reviews only.
// No reviewer identity is requested or stored (field mask omits
// authorAttribution), matching the de-identification approach used for
// manual-capture screenshots.
export async function pullPlaces(config: PlacesSourceConfig): Promise<NormalizedSignal[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY not set");
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.reviews",
    },
    body: JSON.stringify({
      includedTypes: config.placeTypes,
      maxResultCount: config.maxResultCount ?? 20,
      locationRestriction: {
        circle: {
          center: { latitude: config.lat, longitude: config.lng },
          radius: config.radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Places search failed: ${res.status} ${res.statusText} ${body}`);
  }

  const data = (await res.json()) as SearchNearbyResponse;
  const signals: NormalizedSignal[] = [];

  for (const place of data.places ?? []) {
    const businessName = place.displayName?.text ?? "unknown business";
    for (const review of place.reviews ?? []) {
      const text = review.text?.text;
      if (!text) continue;

      signals.push({
        rawText: `${businessName}: ${text}`,
        // Not a per-review URL — Google's API doesn't expose direct review
        // permalinks, only a place-level one, and reusing that across every
        // review of the same business would make the ingest route's
        // url-based dedup treat later reviews as duplicates of the first.
        // Leaving this null falls back to rawText-based dedup instead,
        // which is correct since each review's text actually differs.
        url: null,
        timestamp: review.publishTime ? new Date(review.publishTime) : new Date(),
      });
    }
  }

  return signals;
}
