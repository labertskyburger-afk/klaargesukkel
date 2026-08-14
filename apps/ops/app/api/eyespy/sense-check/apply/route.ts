import { NextRequest, NextResponse } from "next/server";
import { applySenseCheck } from "@/lib/ingest/senseCheckThemes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const misattachedSignalIds: string[] = Array.isArray(body.misattachedSignalIds)
      ? body.misattachedSignalIds
      : [];
    const duplicateRemoveSignalIds: string[] = Array.isArray(body.duplicateRemoveSignalIds)
      ? body.duplicateRemoveSignalIds
      : [];

    const result = await applySenseCheck(misattachedSignalIds, duplicateRemoveSignalIds);
    return NextResponse.json(result);
  } catch (err) {
    console.error("applySenseCheck failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
