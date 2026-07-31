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
