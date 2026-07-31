import { prisma } from "@/lib/prisma";
import CaptureForm from "./capture-form";

export const dynamic = "force-dynamic";

export default async function CapturePage() {
  const region = await prisma.region.findFirst({ orderBy: { createdAt: "asc" } });
  const groups = region
    ? await prisma.group.findMany({ where: { regionId: region.id }, orderBy: { label: "asc" } })
    : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl font-bold text-ink">Weekly capture</h1>
      <p className="mt-2 text-ink/60">
        Upload screenshots from this week&apos;s Facebook Group pass. Each one is sent to Claude
        for extraction, then discarded — nothing is stored except the de-identified text. See{" "}
        <code>EYESPY.md</code> for the full workflow.
      </p>

      {groups.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-ink/10 bg-white p-4 text-sm text-ink/50">
          No Facebook groups configured yet — uploads still work, they just won&apos;t be tagged
          to a specific group until the group list is added.
        </p>
      )}

      <CaptureForm groups={groups.map((g) => ({ id: g.id, label: g.label }))} />
    </main>
  );
}
