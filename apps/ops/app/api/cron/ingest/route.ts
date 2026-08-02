import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeed } from "@/lib/ingest/seed";
import { pullRss } from "@/lib/ingest/rss";
import { pullArcGis } from "@/lib/ingest/arcgis";
import { pullSearch } from "@/lib/ingest/search";
import { pullReddit } from "@/lib/ingest/reddit";
import { classifySignal } from "@/lib/ingest/classify";
import type {
  ArcGisSourceConfig,
  NormalizedSignal,
  RedditSourceConfig,
  RssSourceConfig,
  SearchSourceConfig,
} from "@/lib/ingest/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function pullForSource(source: {
  id: string;
  type: string;
  config: unknown;
}): Promise<NormalizedSignal[]> {
  switch (source.type) {
    case "rss":
      return pullRss(source.config as RssSourceConfig);
    case "open_data":
      return pullArcGis(source.config as ArcGisSourceConfig);
    case "search":
      return pullSearch(source.config as SearchSourceConfig);
    case "reddit":
      return pullReddit(source.config as RedditSourceConfig);
    default:
      return [];
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const region = await ensureSeed();

  const sources = await prisma.source.findMany({
    where: { regionId: region.id, active: true },
  });

  // Sources run in parallel — with several external APIs now active (RSS,
  // ArcGIS, Google/Brave Search, each doing multiple requests), running them
  // one at a time risked the total exceeding Vercel's 60s function limit,
  // silently starving whichever source came last in the loop.
  const entries = await Promise.all(
    sources.map(async (source) => {
      try {
        const signals = await pullForSource(source);
        let inserted = 0;

        for (const signal of signals) {
          const existing = signal.url
            ? await prisma.signal.findFirst({ where: { sourceId: source.id, url: signal.url } })
            : await prisma.signal.findFirst({
                where: { sourceId: source.id, rawText: signal.rawText },
              });

          if (existing) continue;

          const created = await prisma.signal.create({
            data: {
              regionId: region.id,
              sourceId: source.id,
              rawText: signal.rawText,
              url: signal.url,
              timestamp: signal.timestamp,
              capturedVia: "automated",
            },
          });

          // Classify against the region's existing theme pool. Best-effort —
          // an unclassified signal (themeId null) still exists and can be
          // classified later; don't let one bad classification fail the pull.
          try {
            const themeId = await classifySignal(region.id, signal.rawText);
            await prisma.signal.update({ where: { id: created.id }, data: { themeId } });
          } catch (classifyErr) {
            console.error(`Classification failed for signal ${created.id}:`, classifyErr);
          }

          inserted++;
        }

        return [source.name, { pulled: signals.length, inserted }] as const;
      } catch (err) {
        return [
          source.name,
          { pulled: 0, inserted: 0, error: err instanceof Error ? err.message : String(err) },
        ] as const;
      }
    })
  );

  const results = Object.fromEntries(entries);

  return NextResponse.json({ region: region.name, sources: results });
}
