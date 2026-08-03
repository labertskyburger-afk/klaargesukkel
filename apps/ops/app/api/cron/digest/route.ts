import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDigest } from "@/lib/ingest/digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Weekly Wednesday baseline digest — EYESPY.md's Manual capture workflow
// section: "generate the ranked DigestReport right after each Wednesday
// capture session." A fixed cron can't perfectly track a human's capture
// timing, so this is a baseline (scheduled later in the day to give a
// same-day capture session time to land) plus the on-demand "regenerate
// now" action in /api/eyespy/digest covers the "right after capture" case.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });
    if (!region) {
      return NextResponse.json({ error: "No region configured yet" }, { status: 400 });
    }

    const digest = await generateDigest(region.id, "scheduled");
    return NextResponse.json({ digestId: digest.id });
  } catch (err) {
    console.error("generateDigest (scheduled) failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
