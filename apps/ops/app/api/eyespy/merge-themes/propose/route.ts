import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proposeThemeMerges } from "@/lib/ingest/mergeThemes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });
    if (!region) {
      return NextResponse.json({ error: "No region configured yet" }, { status: 400 });
    }

    const { groups, errors } = await proposeThemeMerges(region.id);
    return NextResponse.json({ groups, errors });
  } catch (err) {
    console.error("proposeThemeMerges failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
