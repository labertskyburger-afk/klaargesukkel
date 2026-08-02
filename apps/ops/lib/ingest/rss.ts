import Parser from "rss-parser";
import type { NormalizedSignal, RssSourceConfig } from "./types";

const parser = new Parser({
  customFields: {
    item: [["dc:abstract", "abstract"]],
  },
  // Some feeds (Daily Maverick's Cloudflare-fronted CDN in particular) block
  // or hang on requests without a normal browser-looking User-Agent.
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
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
