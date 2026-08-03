import { NextRequest, NextResponse } from "next/server";
import { applyThemeMerges, type ConfirmedMergeGroup } from "@/lib/ingest/mergeThemes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { groups?: ConfirmedMergeGroup[] } | null;
  if (!body?.groups || !Array.isArray(body.groups)) {
    return NextResponse.json({ error: "Missing groups array" }, { status: 400 });
  }

  const result = await applyThemeMerges(body.groups);
  return NextResponse.json(result);
}
