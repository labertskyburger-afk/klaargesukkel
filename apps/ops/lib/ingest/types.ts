export type NormalizedSignal = {
  rawText: string;
  url: string | null;
  timestamp: Date;
};

export type RssSourceConfig = {
  feedUrl: string;
};

export type ArcGisSourceConfig = {
  // Base FeatureServer/MapServer layer URL, e.g. ".../FeatureServer/0"
  queryUrl: string;
  whereClause?: string; // defaults to "1=1"
  // Fields concatenated (in order) to build rawText for each feature.
  textFields: string[];
  // Optional field holding a per-record timestamp (epoch ms, as ArcGIS returns).
  dateField?: string;
  // Optional field holding a per-record source URL.
  urlField?: string;
};

export type SearchSourceConfig = {
  provider: "google" | "brave";
  // Geo+intent query strings, e.g. "looking for a reliable plumber in
  // Durbanville" — read via the search API's own result snippets, per
  // EYESPY.md, not by scraping the linked pages. API keys come from
  // GOOGLE_SEARCH_API_KEY/GOOGLE_SEARCH_ENGINE_ID or BRAVE_SEARCH_API_KEY
  // env vars, never stored in this config. (Bing Search API was retired by
  // Microsoft — Brave Search API is the second provider instead.)
  queries: string[];
};

export type RedditSourceConfig = {
  // Subreddits to search within, e.g. ["CapeTown", "southafrica"] — per
  // EYESPY.md, official API only, read-only, no scraping outside it.
  subreddits: string[];
  // Search query run against each subreddit (via /r/<sub>/search,
  // restrict_sr=1) — kept broad ("Durbanville") since this is meant to be
  // the least-filtered source, people describing their own problem
  // unfiltered by a journalist's or form's framing. Classification handles
  // relevance downstream, same as RSS.
  query: string;
  // Credentials come from REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET env vars,
  // never stored in this config.
};
