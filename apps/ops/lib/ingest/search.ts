import type { NormalizedSignal, SearchSourceConfig } from "./types";

type GoogleSearchItem = {
  title?: string;
  snippet?: string;
  link?: string;
};

type BraveSearchItem = {
  title?: string;
  description?: string;
  url?: string;
};

async function pullGoogle(query: string): Promise<NormalizedSignal[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !engineId) {
    throw new Error("GOOGLE_SEARCH_API_KEY / GOOGLE_SEARCH_ENGINE_ID not set");
  }

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Search failed for "${query}": ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { items?: GoogleSearchItem[] };
  return (data.items ?? []).map((item) => ({
    rawText: [item.title, item.snippet].filter(Boolean).join(" — ") || "(no snippet)",
    url: item.link ?? null,
    timestamp: new Date(),
  }));
}

async function pullBrave(query: string): Promise<NormalizedSignal[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("BRAVE_SEARCH_API_KEY not set");
  }

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
  });
  if (!res.ok) {
    throw new Error(`Brave Search failed for "${query}": ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { web?: { results?: BraveSearchItem[] } };
  return (data.web?.results ?? []).map((item) => ({
    rawText: [item.title, item.description].filter(Boolean).join(" — ") || "(no snippet)",
    url: item.url ?? null,
    // Brave's "age" field is a human string ("3 days ago"), not a parseable
    // timestamp — same as Google, just use pull time.
    timestamp: new Date(),
  }));
}

// Runs each configured geo+intent query against the source's provider and
// concatenates results. One source row = one provider; run separate Google
// and Bing source rows to use both.
export async function pullSearch(config: SearchSourceConfig): Promise<NormalizedSignal[]> {
  const pull = config.provider === "google" ? pullGoogle : pullBrave;
  const results: NormalizedSignal[] = [];
  for (const query of config.queries) {
    results.push(...(await pull(query)));
  }
  return results;
}
