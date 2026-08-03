import { NextRequest, NextResponse } from "next/server";
import { applyThemePurge } from "@/lib/ingest/purgeThemes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { themeIds?: string[] } | null;
  if (!body?.themeIds || !Array.isArray(body.themeIds)) {
    return NextResponse.json({ error: "Missing themeIds array" }, { status: 400 });
  }

  try {
    const result = await applyThemePurge(body.themeIds);
    return NextResponse.json(result);
  } catch (err) {
    console.error("applyThemePurge failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
