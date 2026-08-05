import { prisma } from "@/lib/prisma";

const REGION_NAME = "Durbanville, Cape Town";

// A region isn't just its umbrella name — real data (service requests,
// forum posts) usually names the specific sub-suburb, not "Durbanville"
// itself. Found 2026-08-03: the ArcGIS source's whereClause only matched
// "%DURBANVILLE%", silently missing real records like "EVERSDAL",
// "Stellenryk.", "Stellenberg Village" that never mention Durbanville by
// name at all.
//
// 2026-08-05: this used to be a flat DURBANVILLE_AREAS string array read
// directly by every source's geo-scoping. Replaced with real Area rows
// (see schema.prisma) per the local-area-research-system geographic model —
// official planning suburbs are peers, NOT children of "Durbanville" itself
// (Stellenridge/Stellenryk statistically belong to Bellville's Census Main
// Place, not Durbanville's), grouped under an optional analytical
// "local_market" Area rather than encoded as a fake parent/child suburb
// hierarchy. Whenever a new region gets built for EyeSpy, do this suburb
// research up front (official planning suburb + Census Main Place per
// suburb) and seed it the same way — see EYESPY.md's "Starting region"
// section and the geographic-model spec.
//
// 2026-08-05 (later same day): "Northern Suburbs" was sitting as a
// colloquial alias on the Durbanville local market row, but it's a real
// City of Cape Town planning district containing several distinct local
// markets (Durbanville, Bellville, Brackenfell, ...), not just an
// alternate name for Durbanville — promoted to its own "district" Area,
// one level above local_market in the same self-relation. Bellville's and
// Brackenfell's suburb lists are a small, high-confidence starting set
// (headline name + well-known named sub-areas), not the ~40+ entry Census
// sub-place breakdown — same "modest, not exhaustive" approach as
// Durbanville's original 7, expand later if real data shows gaps. Eversdal
// and Stellenberg/Stellenridge/Stellenryk stay under Durbanville (already
// confirmed live) rather than also being listed under Bellville, even
// though Census-wise some of them tie to Bellville's Main Place — a suburb
// only ever sits in one tracked local market's list at a time.
const DISTRICT_NAME = "Northern Suburbs";

const LOCAL_MARKETS: { name: string; aliases: string[]; suburbs: string[] }[] = [
  {
    name: "Durbanville local market",
    aliases: ["Durbanville area"],
    suburbs: [
      "Durbanville",
      "Durbanville Hills",
      "Sonstraal Heights",
      "Eversdal",
      "Stellenberg",
      "Stellenridge",
      "Stellenryk",
    ],
  },
  {
    name: "Bellville local market",
    aliases: [],
    suburbs: ["Bellville", "Welgemoed", "Loevenstein", "Boston", "Oakdale", "Sanlamhof"],
  },
  {
    name: "Brackenfell local market",
    aliases: [],
    suburbs: ["Brackenfell", "Protea Village", "Vredekloof", "Northpine", "Kaapsig"],
  },
];

// Idempotent: creates the district Area, its local-market children, and
// their suburb children once; refreshes parentAreaId/aliases on existing
// rows each run (so e.g. the pre-existing "Durbanville local market" row
// gets reparented under the new district without a manual fix). Returns
// the full flat list of official suburb Area rows across every local
// market — used to build every source's geo-scoping. Safe to call on
// every cron run.
async function ensureAreas(regionId: string) {
  let district = await prisma.area.findFirst({
    where: { regionId, name: DISTRICT_NAME, unitType: "district" },
  });
  if (!district) {
    district = await prisma.area.create({
      data: { regionId, name: DISTRICT_NAME, unitType: "district", boundaryConfidence: "analytical" },
    });
  }

  const suburbs = [];
  for (const market of LOCAL_MARKETS) {
    let localMarket = await prisma.area.findFirst({
      where: { regionId, name: market.name, unitType: "local_market" },
    });
    if (!localMarket) {
      localMarket = await prisma.area.create({
        data: {
          regionId,
          name: market.name,
          unitType: "local_market",
          parentAreaId: district.id,
          aliases: market.aliases,
          boundaryConfidence: "analytical",
        },
      });
    } else if (localMarket.parentAreaId !== district.id) {
      localMarket = await prisma.area.update({
        where: { id: localMarket.id },
        data: { parentAreaId: district.id, aliases: market.aliases },
      });
    }

    for (const name of market.suburbs) {
      let suburb = await prisma.area.findFirst({
        where: { regionId, name, unitType: "official_planning_suburb" },
      });
      if (!suburb) {
        suburb = await prisma.area.create({
          data: {
            regionId,
            name,
            unitType: "official_planning_suburb",
            parentAreaId: localMarket.id,
            boundaryConfidence: "official",
          },
        });
      }
      suburbs.push(suburb);
    }
  }
  return suburbs;
}

// Restricted to community/forum sites, not the open web — general geo+intent
// queries against the whole web mostly surface local businesses' own SEO
// landing pages (their ad copy literally echoes "are you looking for a
// reliable plumber in Durbanville?" back at the searcher, since that's what
// they're optimizing to rank for), not real people asking. Found 2026-08-02
// after Brave Search's first real results turned out to be 100% plumber ads.
const SITE_RESTRICTION = "(site:reddit.com OR site:facebook.com OR site:hellopeter.com OR site:gumtree.co.za)";

// Starter geo+intent queries per EYESPY.md — a small, deliberately modest set
// to stay well within free-tier daily quotas (Google CSE: 100/day, Brave:
// $5/month free credit covers well over 1,000 requests/month at this volume).
// Phrased as a real person would ask, not as ad copy would ("can anyone
// recommend" / "does anyone know a good" — businesses essentially never
// write their own marketing copy that way), which should filter out most
// of the SEO-ad noise even before the site restriction does its part.
// Tune/expand this list later via a direct SQL update to the Source row,
// same pattern as the ArcGIS source's config.
// Each geo term is quoted and OR'd across every official suburb in the
// local market — found 2026-08-03 that (a) an unquoted geo term is treated
// as a relevance nice-to-have, not a requirement, so a well-matching Reddit
// post from Durham, NC ("r/bullcity ... north durham") or Johannesburg was
// outranking on phrase-similarity alone despite never mentioning
// Durbanville at all, and (b) "Durbanville" alone misses real local
// content that only names a sub-suburb (e.g. "Eversdal", "Stellenryk").
function buildGeoAlternation(suburbNames: string[]): string {
  return `(${suburbNames.map((a) => `"${a}"`).join(" OR ")})`;
}

function buildSearchQueries(suburbNames: string[]): string[] {
  const geo = buildGeoAlternation(suburbNames);
  return [
    `${SITE_RESTRICTION} "can anyone recommend" plumber ${geo}`,
    `${SITE_RESTRICTION} "does anyone know a good" electrician ${geo}`,
    `${SITE_RESTRICTION} "can anyone recommend" handyman ${geo}`,
    `${SITE_RESTRICTION} "does anyone know" childcare ${geo}`,
    `${SITE_RESTRICTION} "does anyone offer" dog walking ${geo}`,
  ];
}

function buildArcGisWhereClause(suburbNames: string[]): string {
  return suburbNames.map((a) => `UPPER(Suburb) LIKE '%${a.toUpperCase()}%'`).join(" OR ");
}

// Idempotent: safe to call on every cron run. Creates the starting region,
// its Area rows and sources once; on later runs it refreshes the suburb-
// derived config (whereClause/queries/keywords) on the geo-scoped sources
// so adding a suburb to LOCAL_MARKETS actually reaches production without a
// manual SQL update — everything else (new sources, active flags) stays
// create-once as before.
export async function ensureSeed() {
  let region = await prisma.region.findFirst({ where: { name: REGION_NAME } });
  if (!region) {
    region = await prisma.region.create({
      data: { name: REGION_NAME, keywords: [] },
    });
  }

  const suburbs = await ensureAreas(region.id);
  const suburbNames = suburbs.map((s) => s.name);
  const marketAliases = LOCAL_MARKETS.flatMap((m) => m.aliases);

  await prisma.region.update({
    where: { id: region.id },
    data: {
      keywords: [...suburbNames, ...marketAliases, DISTRICT_NAME, "Cape Town", "Western Cape"],
    },
  });

  // RSS/podcast-RSS sources — podcast feeds are just RSS with iTunes
  // extensions, and the CapeTalk feed uses standard <title>/<description>
  // per item, so pullRss handles it unchanged (episode titles/descriptions
  // are enough to classify, per EYESPY.md — only build a transcript
  // pipeline if that proves too thin).
  const rssSources: { name: string; feedUrl: string }[] = [
    { name: "IOL Western Cape RSS", feedUrl: "https://rss.iol.io/iol/news/south-africa/western-cape" },
    { name: "GroundUp Q&A RSS", feedUrl: "https://groundup.org.za/qanda/rss/" },
    { name: "GroundUp News RSS", feedUrl: "https://groundup.org.za/sitenews/rss/" },
    { name: "Daily Maverick RSS", feedUrl: "https://www.dailymaverick.co.za/dmrss" },
    {
      name: "CapeTalk: Consumer Talk with Wendy Knowler (podcast)",
      feedUrl:
        "https://www.omnycontent.com/d/playlist/5dcefa8e-00a9-4595-8ce1-a4ab0080f142/1df82789-1c5e-420b-8aa0-a6dd00f1f24f/5c722964-f3dd-4a32-b2dc-a97a00ebdd50/podcast.rss",
    },
  ];
  for (const { name, feedUrl } of rssSources) {
    const existing = await prisma.source.findFirst({ where: { regionId: region.id, name } });
    if (!existing) {
      await prisma.source.create({
        data: { regionId: region.id, type: "rss", name, active: true, config: { feedUrl } },
      });
    }
  }

  const arcgisSourceName = "Cape Town Service Requests (open data)";
  const arcgisConfig = {
    queryUrl:
      "https://services6.arcgis.com/nyYfO9SxHU2ChQd9/arcgis/rest/services/Service_Requests_2023_until_20_May_2026/FeatureServer/0",
    whereClause: buildArcGisWhereClause(suburbNames),
    textFields: ["C3_Complaint_Type", "Notification_type", "Suburb", "Ward"],
    dateField: "Created_On_Date",
  };
  const existingArcgis = await prisma.source.findFirst({
    where: { regionId: region.id, name: arcgisSourceName },
  });
  if (!existingArcgis) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "open_data",
        name: arcgisSourceName,
        active: true,
        // "Service Requests 2023 until 30 July 2026" — City of Cape Town's
        // public SAP C3 Notifications feed, confirmed live 2026-08-02.
        // Scoped to the district via whereClause since the feed covers all
        // of Cape Town otherwise — OR'd across every official suburb in
        // every local market (not just "Durbanville" itself, see
        // LOCAL_MARKETS comment).
        config: arcgisConfig,
      },
    });
  } else {
    // Refresh whereClause each run so adding a suburb to LOCAL_MARKETS
    // actually reaches the already-seeded Source row, not just new regions.
    await prisma.source.update({ where: { id: existingArcgis.id }, data: { config: arcgisConfig } });
  }

  const searchQueries = buildSearchQueries(suburbNames);

  const googleSearchName = "Google Search (geo+intent)";
  const existingGoogleSearch = await prisma.source.findFirst({
    where: { regionId: region.id, name: googleSearchName },
  });
  if (!existingGoogleSearch) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "search",
        name: googleSearchName,
        // Inactive until GOOGLE_SEARCH_API_KEY/GOOGLE_SEARCH_ENGINE_ID are
        // set on the apps/ops Vercel project.
        active: false,
        config: { provider: "google", queries: searchQueries },
      },
    });
  } else {
    await prisma.source.update({
      where: { id: existingGoogleSearch.id },
      data: { config: { provider: "google", queries: searchQueries } },
    });
  }

  const braveSearchName = "Brave Search (geo+intent)";
  const existingBraveSearch = await prisma.source.findFirst({
    where: { regionId: region.id, name: braveSearchName },
  });
  if (!existingBraveSearch) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "search",
        name: braveSearchName,
        // Inactive until BRAVE_SEARCH_API_KEY is set on the apps/ops Vercel
        // project. (Bing Search API was retired by Microsoft — Brave is the
        // second search provider instead.)
        active: false,
        config: { provider: "brave", queries: searchQueries },
      },
    });
  } else {
    await prisma.source.update({
      where: { id: existingBraveSearch.id },
      data: { config: { provider: "brave", queries: searchQueries } },
    });
  }

  const redditSourceName = "Reddit (r/CapeTown, r/southafrica)";
  const redditQuery = suburbNames.map((a) => `"${a}"`).join(" OR ");
  const existingReddit = await prisma.source.findFirst({
    where: { regionId: region.id, name: redditSourceName },
  });
  if (!existingReddit) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "reddit",
        name: redditSourceName,
        // Inactive until REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET are set on
        // the apps/ops Vercel project. Per EYESPY.md, highest-priority
        // source — least filtered, people describing their own problem in
        // their own words. Kept to an OR'd suburb query rather than pulling
        // entire subreddit feeds, so classification isn't drowned in
        // general Cape Town chatter.
        active: false,
        config: { subreddits: ["CapeTown", "southafrica"], query: redditQuery },
      },
    });
  } else {
    await prisma.source.update({
      where: { id: existingReddit.id },
      data: { config: { subreddits: ["CapeTown", "southafrica"], query: redditQuery } },
    });
  }

  const placesSourceName = "Google Places (business reviews)";
  const existingPlaces = await prisma.source.findFirst({
    where: { regionId: region.id, name: placesSourceName },
  });
  if (!existingPlaces) {
    await prisma.source.create({
      data: {
        regionId: region.id,
        type: "places",
        name: placesSourceName,
        // Active immediately — Albert already has GOOGLE_PLACES_API_KEY set.
        // Per EYESPY.md, the most structurally geo-native source (native
        // radius search, unlike forum content). Reviews of existing
        // businesses skew "supply" by nature, but occasionally surface
        // genuine gap-in-market language ("wish there was...") — the
        // demand/supply classifier sorts that out, same as every other
        // source, no special-casing needed here.
        active: true,
        config: {
          lat: -33.8304,
          lng: 18.6497,
          radiusMeters: 5000,
          // "general_contractor" is NOT a valid Places API (New) type
          // (confirmed 2026-08-03 — every request was failing with
          // "Unsupported types: general_contractor") — dropped it, the
          // remaining four are confirmed working with real reviews.
          placeTypes: ["plumber", "electrician", "locksmith", "painter"],
        },
      },
    });
  }

  // Tracked Facebook groups for the weekly manual-capture workflow — name/
  // label only, per EYESPY.md (never scraped, just used to tag uploads).
  const trackedGroups = ["Durbanville Mammas", "Durbanville"];
  for (const label of trackedGroups) {
    const existingGroup = await prisma.group.findFirst({
      where: { regionId: region.id, label },
    });
    if (!existingGroup) {
      await prisma.group.create({ data: { regionId: region.id, label } });
    }
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

// Read-only lookup for callers that need the current suburb list without
// re-running the full seed (e.g. tagging a signal's areaId, or building the
// classifier's relevance-gate prompt).
export async function getOfficialSuburbs(regionId: string) {
  return prisma.area.findMany({ where: { regionId, unitType: "official_planning_suburb" } });
}

// Signals from the weekly manual-capture upload attach to this Source row.
export async function getManualCaptureSource(regionId: string) {
  const source = await prisma.source.findFirst({
    where: { regionId, type: "manual_capture" },
  });
  if (!source) throw new Error("Manual capture source not seeded — call ensureSeed() first");
  return source;
}
