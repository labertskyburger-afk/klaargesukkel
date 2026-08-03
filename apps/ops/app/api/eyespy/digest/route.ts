import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDigest } from "@/lib/ingest/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// "Regenerate digest now" — EYESPY.md Processing step 7 (added 2026-08-02):
// given how much volume already flows across every source, Albert shouldn't
// have to wait for the weekly Wednesday cron to get a fresh read. No auth
// header check needed beyond the ops app's own session-cookie middleware,
// which already gates every route under /eyespy and /api/eyespy.
export async function POST() {
  const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });
  if (!region) {
    return NextResponse.json({ error: "No region configured yet" }, { status: 400 });
  }

  const digest = await generateDigest(region.id, "manual");
  return NextResponse.json({ digestId: digest.id });
}
