import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeed, getManualCaptureSource, getOfficialSuburbs } from "@/lib/ingest/seed";
import { extractSignalFromScreenshot } from "@/lib/ingest/extractSignal";
import { classifySignal } from "@/lib/ingest/classify";
import { matchAreaByText } from "@/lib/ingest/matchArea";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("screenshot");
  const groupId = formData.get("groupId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No screenshot uploaded" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type}` },
      { status: 400 }
    );
  }

  const region = await ensureSeed();
  const source = await getManualCaptureSource(region.id);

  // Processed entirely in-memory for this one request — the raw screenshot
  // is never written to disk or blob storage, and goes out of scope the
  // moment this handler returns. See EYESPY.md's manual capture workflow:
  // extract, discard, don't archive.
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const extracted = await extractSignalFromScreenshot(
    base64,
    file.type as "image/png" | "image/jpeg" | "image/webp"
  );

  if (!extracted.relevant) {
    return NextResponse.json({
      stored: false,
      reason: "Not a complaint, question, recommendation request, or buy/find attempt.",
    });
  }

  const suburbs = await getOfficialSuburbs(region.id);
  const area = matchAreaByText(extracted.signalText, suburbs);

  const signal = await prisma.signal.create({
    data: {
      regionId: region.id,
      sourceId: source.id,
      groupId: typeof groupId === "string" && groupId ? groupId : null,
      areaId: area?.id ?? null,
      rawText: extracted.signalText,
      capturedVia: "manual_screenshot",
      timestamp: new Date(),
    },
  });

  const { themeId, signalType } = await classifySignal(region.id, extracted.signalText);
  await prisma.signal.update({ where: { id: signal.id }, data: { themeId, signalType } });

  return NextResponse.json({ stored: true, signalText: extracted.signalText, themeId, signalType });
}
