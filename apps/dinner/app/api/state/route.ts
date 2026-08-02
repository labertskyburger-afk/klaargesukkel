import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { HouseholdState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const household = await prisma.household.upsert({
    where: { ownerUserId: session.user.id },
    create: { ownerUserId: session.user.id },
    update: {},
  });

  return NextResponse.json(household);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Partial<HouseholdState> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const household = await prisma.household.upsert({
    where: { ownerUserId: session.user.id },
    create: {
      ownerUserId: session.user.id,
      subtitle: body.subtitle ?? undefined,
      trackerState: body.trackerState ?? undefined,
      shopChecks: body.shopChecks ?? undefined,
      batchDate: body.batchDate ?? undefined,
      weekOverride: body.weekOverride ?? undefined,
      leftovers: body.leftovers ?? undefined,
      customRecipes: body.customRecipes ?? undefined,
    },
    update: {
      subtitle: body.subtitle ?? undefined,
      trackerState: body.trackerState ?? undefined,
      shopChecks: body.shopChecks ?? undefined,
      batchDate: body.batchDate ?? undefined,
      weekOverride: body.weekOverride ?? undefined,
      leftovers: body.leftovers ?? undefined,
      customRecipes: body.customRecipes ?? undefined,
    },
  });

  return NextResponse.json(household);
}
