import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import DinnerApp from "@/components/DinnerApp";
import type { HouseholdState } from "@/lib/types";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  let household = await prisma.household.findUnique({
    where: { ownerUserId: session.user.id },
  });
  if (!household) {
    household = await prisma.household.create({
      data: { ownerUserId: session.user.id },
    });
  }

  const initialState: HouseholdState = {
    subtitle: household.subtitle,
    trackerState: household.trackerState as HouseholdState["trackerState"],
    shopChecks: household.shopChecks as HouseholdState["shopChecks"],
    batchDate: household.batchDate,
    weekOverride: household.weekOverride as HouseholdState["weekOverride"],
    leftovers: household.leftovers as HouseholdState["leftovers"],
    customRecipes: household.customRecipes as HouseholdState["customRecipes"],
  };

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <DinnerApp
      initialState={initialState}
      userEmail={session.user.email}
      signOutAction={signOutAction}
    />
  );
}
