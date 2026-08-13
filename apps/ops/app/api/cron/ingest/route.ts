import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeed, getOfficialSuburbs } from "@/lib/ingest/seed";
import { pullRss } from "@/lib/ingest/rss";
import { pullArcGis } from "@/lib/ingest/arcgis";
import { pullSearch } from "@/lib/ingest/search";
import { pullReddit } from "@/lib/ingest/reddit";
import { pullPlaces } from "@/lib/ingest/places";
import { classifySignal, classifySignalNature } from "@/lib/ingest/classify";
import { matchAreaByText } from "@/lib/ingest/matchArea";
import type {
  ArcGisSourceConfig,
  NormalizedSignal,
  PlacesSourceConfig,
  RedditSourceConfig,
  RssSourceConfig,
  SearchSourceConfig,
} from "@/lib/ingest/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Classification is a live Claude call per signal — with several sources
// now active (RSS feeds alone can have 50-100 items each), a first/bulk run
// could mean hundreds of sequential calls, well past any function timeout.
// Cap how many get classified per run; anything left over stays
// unclassified (themeId null) and gets picked up on the next run — EYESPY.md
// already treats that as an acceptable, temporary state, not a failure.
const CLASSIFY_CAP_PER_RUN = 40;
const CLASSIFY_CONCURRENCY = 5;

async function classifyInBatches(
  regionId: string,
  signals: { id: string; rawText: string }[]
): Promise<number> {
  let classified = 0;
  for (let i = 0; i < signals.length; i += CLASSIFY_CONCURRENCY) {
    const batch = signals.slice(i, i + CLASSIFY_CONCURRENCY);
    await Promise.all(
      batch.map(async (signal) => {
        try {
          const result = await classifySignal(regionId, signal.rawText);
          await prisma.signal.update({
            where: { id: signal.id },
            data: { themeId: result.themeId, signalType: result.signalType, nature: result.nature },
          });
          classified++;
        } catch (err) {
          console.error(`Classification failed for signal ${signal.id}:`, err);
        }
      })
    );
  }
  return classified;
}

// Backfill for signals classified before `nature` existed (see
// schema.prisma's SignalNature comment) — only demand signals matter here,
// since gapScore.ts only reads nature off demand signals. Same capped,
// oldest-first, safe-to-re-run pattern as the classification phase above,
// just a lighter/cheaper judgment (classifySignalNature doesn't touch theme
// attachment or signal_type).
const NATURE_BACKFILL_CAP_PER_RUN = 40;

async function backfillNatureInBatches(signals: { id: string; rawText: string }[]): Promise<number> {
  let backfilled = 0;
  for (let i = 0; i < signals.length; i += CLASSIFY_CONCURRENCY) {
    const batch = signals.slice(i, i + CLASSIFY_CONCURRENCY);
    await Promise.all(
      batch.map(async (signal) => {
        try {
          const nature = await classifySignalNature(signal.rawText);
          await prisma.signal.update({ where: { id: signal.id }, data: { nature } });
          backfilled++;
        } catch (err) {
          console.error(`Nature backfill failed for signal ${signal.id}:`, err);
        }
      })
    );
  }
  return backfilled;
}

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
    case "places":
      return pullPlaces(source.config as PlacesSourceConfig);
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
  const suburbs = await getOfficialSuburbs(region.id);

  const sources = await prisma.source.findMany({
    where: { regionId: region.id, active: true },
  });

  // Phase 1: pull + dedupe + insert, sources in parallel, no classification
  // inline — this stays fast (bounded by external API + DB latency) no
  // matter how many new items land.
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

          const area = matchAreaByText(signal.rawText, suburbs);

          await prisma.signal.create({
            data: {
              regionId: region.id,
              sourceId: source.id,
              areaId: area?.id ?? null,
              rawText: signal.rawText,
              url: signal.url,
              timestamp: signal.timestamp,
              capturedVia: "automated",
            },
          });

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

  // Phase 2: classify a capped batch of signals missing signalType (oldest
  // first, across all sources) — see CLASSIFY_CAP_PER_RUN comment above.
  // signalType null is the sole "needs classification" marker — checking
  // themeId too (as this used to) would make "irrelevant" signals (added
  // 2026-08-03, themeId permanently null by design) get endlessly
  // reclassified every run instead of staying marked done.
  const needsClassification = { signalType: null };
  const unclassified = await prisma.signal.findMany({
    where: { regionId: region.id, ...needsClassification },
    orderBy: { createdAt: "asc" },
    take: CLASSIFY_CAP_PER_RUN,
    select: { id: true, rawText: true },
  });
  const classified = await classifyInBatches(region.id, unclassified);
  const remainingUnclassified = await prisma.signal.count({
    where: { regionId: region.id, ...needsClassification },
  });

  // Phase 3: backfill `nature` for already-classified demand signals that
  // predate the field (signalType "demand", nature still null).
  const needsNature = { signalType: "demand" as const, nature: null };
  const missingNature = await prisma.signal.findMany({
    where: { regionId: region.id, ...needsNature },
    orderBy: { createdAt: "asc" },
    take: NATURE_BACKFILL_CAP_PER_RUN,
    select: { id: true, rawText: true },
  });
  const natureBackfilled = await backfillNatureInBatches(missingNature);
  const remainingMissingNature = await prisma.signal.count({
    where: { regionId: region.id, ...needsNature },
  });

  return NextResponse.json({
    region: region.name,
    sources: results,
    classification: { classifiedThisRun: classified, stillUnclassified: remainingUnclassified },
    natureBackfill: { backfilledThisRun: natureBackfilled, stillMissing: remainingMissingNature },
  });
}
