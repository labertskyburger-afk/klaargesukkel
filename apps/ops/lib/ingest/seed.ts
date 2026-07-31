import { prisma } from "@/lib/prisma";

const REGION_NAME = "Durbanville, Cape Town";

// Idempotent: safe to call on every cron run. Creates the starting region and
// sources once, does nothing on subsequent runs. New sources (e.g. once the
// ArcGIS Service Requests URL is confirmed) get added here and picked up
// automatically — flip `active` on once a source's config is real.
export async function ensureSeed() {
  let region = await prisma.region.findFirst({ where: { name: REGION_NAME } });
  if (!region) {
    region = await prisma.region.create({
      data: {
        name: REGION_NAME,
        keywords: ["Durbanville", "Cape Town", "Western Cape"],
      },
    });
  }

  const rssSourceName = "IOL Western Cape RSS";
  const existingRss = await prisma.source.findFirst({
    where: { regionId: region.id, name: rssSourceName },
  });
  if (!existingRss) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "rss",
        name: rssSourceName,
        active: true,
        config: { feedUrl: "https://rss.iol.io/iol/news/south-africa/western-cape" },
      },
    });
  }

  const arcgisSourceName = "Cape Town Service Requests (open data)";
  const existingArcgis = await prisma.source.findFirst({
    where: { regionId: region.id, name: arcgisSourceName },
  });
  if (!existingArcgis) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "open_data",
        name: arcgisSourceName,
        // Inactive until the real FeatureServer query URL is confirmed and
        // filled in below — see EYESPY.md / CLAUDE.md prerequisites.
        active: false,
        config: { queryUrl: null },
      },
    });
  }

  const manualSourceName = "Manual Facebook Group capture";
  const existingManual = await prisma.source.findFirst({
    where: { regionId: region.id, name: manualSourceName },
  });
  if (!existingManual) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "manual_capture",
        name: manualSourceName,
        active: true,
        config: {},
      },
    });
  }

  return region;
}

// Signals from the weekly manual-capture upload attach to this Source row.
export async function getManualCaptureSource(regionId: string) {
  const source = await prisma.source.findFirst({
    where: { regionId, type: "manual_capture" },
  });
  if (!source) throw new Error("Manual capture source not seeded — call ensureSeed() first");
  return source;
}
