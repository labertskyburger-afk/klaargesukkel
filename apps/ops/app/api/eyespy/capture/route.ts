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

  // The group/page name is read directly off each screenshot (usually
  // visible in Facebook's own header), so a whole folder of screenshots
  // from different groups can be uploaded in one batch without picking a
  // group per file — this auto-tags (or auto-registers, if it's a group
  // not seen before) instead. The form's group dropdown is only a fallback
  // for screenshots cropped tight enough that the group name isn't visible.
  const manualGroupId = typeof groupId === "string" && groupId ? groupId : null;
  let resolvedGroupId = manualGroupId;
  let groupLabel: string | null = null;

  if (extracted.groupName) {
    let group = await prisma.group.findFirst({
      where: { regionId: region.id, label: { equals: extracted.groupName, mode: "insensitive" } },
    });
    if (!group) {
      group = await prisma.group.create({ data: { regionId: region.id, label: extracted.groupName } });
    }
    resolvedGroupId = group.id;
    groupLabel = group.label;
  }

  const suburbs = await getOfficialSuburbs(region.id);
  // Group name folded in — a post's own text might just say "does anyone
  // know a plumber" with no suburb named, but a group called "Bellville
  // Chat" situates it geographically on its own.
  const area = matchAreaByText(`${groupLabel ?? ""} ${extracted.signalText}`, suburbs);

  const signal = await prisma.signal.create({
    data: {
      regionId: region.id,
      sourceId: source.id,
      groupId: resolvedGroupId,
      areaId: area?.id ?? null,
      rawText: extracted.signalText,
      capturedVia: "manual_screenshot",
      timestamp: new Date(),
    },
  });

  const { themeId, signalType } = await classifySignal(region.id, extracted.signalText);
  await prisma.signal.update({ where: { id: signal.id }, data: { themeId, signalType } });

  return NextResponse.json({
    stored: true,
    signalText: extracted.signalText,
    group: groupLabel,
    area: area?.name ?? null,
    themeId,
    signalType,
  });
}
