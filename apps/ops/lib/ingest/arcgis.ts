import type { ArcGisSourceConfig, NormalizedSignal } from "./types";

type ArcGisFeature = {
  attributes: Record<string, unknown>;
};

type ArcGisQueryResponse = {
  features?: ArcGisFeature[];
  error?: { message?: string };
};

// Generic client for any ArcGIS Hub open-data FeatureServer/MapServer layer.
// No API key required — these are public query endpoints.
export async function pullArcGis(config: ArcGisSourceConfig): Promise<NormalizedSignal[]> {
  const where = encodeURIComponent(config.whereClause ?? "1=1");
  const url = `${config.queryUrl}/query?where=${where}&outFields=*&f=json&resultRecordCount=200&orderByFields=OBJECTID DESC`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ArcGIS query failed: ${res.status} ${res.statusText} (${config.queryUrl})`);
  }

  const data = (await res.json()) as ArcGisQueryResponse;
  if (data.error) {
    throw new Error(`ArcGIS query error: ${data.error.message ?? "unknown"} (${config.queryUrl})`);
  }

  return (data.features ?? []).map((f) => {
    const rawText = config.textFields
      .map((field) => f.attributes[field])
      .filter((v) => v !== null && v !== undefined && v !== "")
      .join(" — ");

    const dateValue = config.dateField ? f.attributes[config.dateField] : undefined;
    const urlValue = config.urlField ? f.attributes[config.urlField] : undefined;

    return {
      rawText: rawText || "(no text fields populated)",
      url: typeof urlValue === "string" ? urlValue : null,
      timestamp: typeof dateValue === "number" ? new Date(dateValue) : new Date(),
    };
  });
}
