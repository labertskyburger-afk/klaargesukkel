import Parser from "rss-parser";
import type { NormalizedSignal, RssSourceConfig } from "./types";

const parser = new Parser({
  customFields: {
    item: [["dc:abstract", "abstract"]],
  },
});

export async function pullRss(config: RssSourceConfig): Promise<NormalizedSignal[]> {
  const feed = await parser.parseURL(config.feedUrl);

  return (feed.items ?? []).map((item) => {
    const abstract = (item as unknown as { abstract?: string }).abstract;
    const parts = [item.title, abstract ?? item.contentSnippet].filter(Boolean);

    return {
      rawText: parts.join(" — "),
      url: item.link ?? null,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
    };
  });
}
