import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { backfillNatureInBatches } from "@/lib/ingest/classify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One-off bulk backfill for the SignalNature field (commercial vs
// civic_municipal) — the routine cron only processes 40/run, shared with
// pulling+classifying, which is far too slow to work through an existing
// backlog of hundreds of signals. This gets its own request budget and a
// much larger cap; safe to click repeatedly until "stillMissing" hits 0.
// Not a review-then-apply flow like merge/purge-themes — this only adds
// metadata, nothing is deleted or reassigned, so no confirmation step.
const BULK_BACKFILL_CAP = 250;
const BULK_BACKFILL_CONCURRENCY = 8;

export async function POST() {
  try {
    const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });
    if (!region) {
      return NextResponse.json({ error: "No region configured yet" }, { status: 400 });
    }

    const needsNature = { regionId: region.id, signalType: "demand" as const, nature: null };
    const missing = await prisma.signal.findMany({
      where: needsNature,
      orderBy: { createdAt: "asc" },
      take: BULK_BACKFILL_CAP,
      select: { id: true, rawText: true },
    });

    const backfilled = await backfillNatureInBatches(missing, BULK_BACKFILL_CONCURRENCY);
    const stillMissing = await prisma.signal.count({ where: needsNature });

    return NextResponse.json({ backfilled, stillMissing });
  } catch (err) {
    console.error("backfill-nature failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
