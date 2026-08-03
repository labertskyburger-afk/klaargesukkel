# EyeSpy — demand-signal research tool

## What this is

Not a product for clients, not a public product at all — an **internal tool** for Albert.
EyeSpy periodically reads what people in a given area are struggling with, asking for
recommendations on, or trying and failing to find/buy, and turns that into a ranked digest
Albert uses as input for what to build next on Klaargesukkel. It's the ideation engine behind
the ideation engine. Lives in the klaargesukkel monorepo as a route inside `apps/ops`
(`apps/ops/app/(app)/eyespy/`, replacing the current placeholder page) — same reasoning as
`/clients` and `/projects` in that app: internal, behind the ops login, never linked from the
public hub. (Was originally scoped as its own `apps/eyespy` app before the 2026-07-30 ops
merge — see ARCHITECTURE.md's Layer 4 section — build it as a route, not a new app.)

## The constraint that shapes everything here (don't relitigate — checked 2026-07-29)

Broad scraping of social platforms (Facebook, Instagram, TikTok, LinkedIn) is generally not
*illegal* for public data in the US (hiQ v. LinkedIn), but it does typically violate those
platforms' terms of service — a contract-breach/account-ban risk, enforced technically (rate
limiting, IP blocks, account termination) regardless of the legal question. Reddit locked
down unauthenticated scraping as recently as May 2026 specifically to stop this pattern.
Separately, POPIA (South Africa's data protection act) governs processing personal
information even from public posts. **Decision: compliant sources only.** No direct scraping
of Facebook, Instagram, TikTok, or any platform whose ToS prohibits it. This trades some
coverage for zero ban/legal exposure — the right trade for a tool that needs to keep running
for years, not a one-off scrape.

## Starting region

**Durbanville, Cape Town.** Small enough to validate findings against Albert's own local
knowledge, large enough to have real signal volume. Build region as configuration, not a
hardcoded value — this should extend to other areas (Namaqualand, nationwide) once proven.

## Data sources (v1 — compliant only)

**Reconciled 2026-08-02** — Albert flagged low confidence in the sources actually live so far
(just IOL Western Cape RSS + the Cape Town Service Requests feed). Researched and confirmed
the following, ranked by how directly they capture "someone asking/struggling," not just
general news:

- **Reddit, official API — highest priority of everything on this list.** The only source
  here where people describe their own problem in their own words, unfiltered by a
  journalist's or a government form's framing. Free tier is rate-limited (100 QPM) and fine
  for non-commercial-scale querying of r/CapeTown and r/southafrica — verify current
  free-tier terms before building, Reddit's terms have shifted multiple times and will
  likely shift again. Do not scrape Reddit outside the official API. Blocked on Albert
  creating API app credentials — see Prerequisites.
- **GroundUp Q&A RSS** (`https://groundup.org.za/qanda/rss/`) — confirmed live 2026-08-02.
  GroundUp runs an ongoing reader-question franchise on social grants, ID documents, UIF,
  housing, home affairs processes — real people's questions, already public-interest
  journalism, no scraping/ToS question at all. The closest compliant match to raw demand
  signal available. **No prerequisite — wire in now.**
- **GroundUp News RSS** (`https://groundup.org.za/sitenews/rss/`) — confirmed live
  2026-08-02. Their reporting skews toward service delivery, sanitation, housing, health —
  closer to "struggling with" signal than a general news outlet. **No prerequisite — wire in
  now.**
- **Daily Maverick RSS** (`https://www.dailymaverick.co.za/dmrss`) — confirmed live
  2026-08-02. National scope, but the Maverick Citizen section covers community/social-issue
  stories worth a secondary cross-check against GroundUp. **No prerequisite — wire in now.**
- **CapeTalk "Consumer Talk with Wendy Knowler" podcast** (feed:
  `https://www.omnycontent.com/d/playlist/5dcefa8e-00a9-4595-8ce1-a4ab0080f142/1df82789-1c5e-420b-8aa0-a6dd00f1f24f/5c722964-f3dd-4a32-b2dc-a97a00ebdd50/podcast.rss`,
  confirmed live and publishing as of 2026-08-02) — a new source *type*: a professional SA
  consumer journalist already vets and reports on real, widespread consumer complaints
  weekly. This is human-curated signal, arguably more reliable per-item than anything else
  on this list since someone else already did the filtering. Ingest via the podcast RSS
  (episode titles/descriptions are usually enough to classify the complaint topic; only
  reach for a transcript/audio pipeline if descriptions prove too thin — don't over-build
  this before checking). **No prerequisite — wire in now.**
- **Google/Bing/Brave Search API, geo+intent queries — read the caveat below before trusting
  this source's volume.** A plain query like "looking for a reliable plumber in Durbanville"
  doesn't return people asking that question — it returns businesses whose SEO copy targets
  that exact phrase, since that's precisely what a plumber's marketing is optimized to catch.
  Confirmed 2026-08-02: the live "Plumbing and pipe repair services" theme in `apps/ops` is
  100% business ad copy (Sprint Plumbers, Anton's Plumbing, NovaCore, Blue Water Plumbing),
  not a single real demand signal — search engines structurally return supply for
  commercial-intent phrasing, not demand. Two mitigations, build both:
  1. **Classify demand vs. supply before counting toward a theme.** Add a `signal_type`
     field (`demand` / `supply` / `unclear`) to the classification step already running on
     every signal (see Processing below) — a business describing itself is not evidence
     someone needs the service. Only `demand`-tagged signals should count toward a theme's
     volume/trend. Keep `supply` signals on the theme's detail page as context (a suburb
     flooded with ads might mean the category's already well-served), just don't let them
     drive "this is trending" conclusions.
  2. **Restrict queries to domains that host people's own words**, not the open web —
     `site:reddit.com`, `site:quora.com`, and similar UGC domains, rather than unrestricted
     geo+intent phrases. Open-web search should be a secondary/context source, not a primary
     volume driver — GroundUp, Reddit, and the CapeTalk podcast are structurally better
     sources for demand signal and should be weighted above it.
  (Brave Search is already active in `apps/ops` and is exactly what's producing the
  ad-copy-only "Plumbing and pipe repair services" theme right now — either fix it with the
  signal_type filter + domain restriction above, or set it back to inactive until that's
  built, since a live source flooding themes with business ads is worse than no source at
  all. Google/Bing remain reasonable alternatives/additions once the filter exists.)
- **Google Places API, reviews.** Places API has native radius search — pull reviews for
  businesses/categories in the Durbanville radius, scan for complaint/gap patterns ("wish
  there was...", "no one offers...", "impossible to find..."). This is the best structural
  fit for the "region radius" part of the original idea — it's actually geo-native, unlike
  most forum content.
- **Google Trends API (alpha)** — Google opened an official API for this in July 2025;
  still an application-gated alpha as of 2026-08-02, free for approved testers. Worth
  applying for: gives quantified search-intent data ("N people searched 'water outage
  Durbanville' this week") to cross-check what RSS/Reddit/podcast sources surface
  qualitatively — turns "someone complained once" into "this is actually common." Not
  urgent — application/approval timeline unknown, don't block other sources on it.
- **City of Cape Town open data portal** — the Service Requests dataset is live (see
  "Current state" in CLAUDE.md). Worth periodically checking for additional datasets beyond
  service requests (load-shedding schedules, water outage bulletins) as the portal adds more.

**Checked and confirmed not viable, don't chase these:**
- **Hellopeter** — no public API found. Would mean scraping a review platform's complaint
  pages; ToS status is unclear and review platforms typically restrict this. Skip unless a
  real API surfaces.
- **Gumtree/OLX "wanted" listings** — confirmed no official API. Third-party scrapers exist
  but rely on beating anti-bot measures — a ToS violation, not a gray area. Drop this
  source, consistent with the compliant-sources-only rule below.

**Excluded from automated collection:** Facebook Groups, Instagram, TikTok, Nextdoor,
WhatsApp groups — Meta killed third-party API access to Groups entirely in April 2024, and
the one Meta tool that does cover group content (Meta Content Library) is restricted to
accredited academic/nonprofit research, not commercial use. Don't build a scraper or bot
account for any of these — no automated path here is actually compliant, whatever a
"scraper API" vendor's marketing claims. Facebook Group content still gets into EyeSpy — see
Manual capture below — just not through automation.

## Manual capture workflow (Facebook Groups)

Facebook Groups are, by Albert's own read of where the complaints live, probably the single
highest-signal source available — the constraint above rules out automating collection, not
using the content at all. The compliant version: a human reads it, same as anyone scrolling
their own feed, and hands the interesting parts to EyeSpy manually.

**Cadence: weekly, Wednesdays.** (Originally scoped as bi-weekly, then twice a week — landed
on weekly as the sustainable middle ground: frequent enough to catch trends early, not so
frequent it becomes a chore that gets skipped. Wednesday specifically: mid-week, enough
runway to review and act on it before the weekend.) Every Wednesday, someone (Albert or
whoever he delegates it to) opens
the 5–10 tracked Durbanville-area Facebook groups as a normal logged-in member and screenshots
anything that looks like a complaint, a question, a recommendation request, or someone trying
to buy/find something. This is completely unremarkable Facebook use — no automation, no bot
account, nothing that touches the ToS question at all.

**Ingestion:** a simple upload page at `ops.klaargesukkel.com/eyespy` (same session-login
gate as the rest of the ops app) where that batch of screenshots gets dropped in. For each
screenshot:

1. Tag which tracked group it's from (a dropdown of the configured group list — see
   `Group` in the data model below).
2. Send the image to Claude via the Anthropic API's vision support — no separate OCR
   pipeline needed, Claude reads the screenshot directly. Prompt it to extract: the
   underlying need/complaint/question in plain text, a category tag, and explicitly
   instruct it **not** to carry through the poster's name, profile photo, or other
   identifying details into what gets stored — the useful signal is "someone in Durbanville
   can't find a reliable electrician," not who said it.
3. Store the extracted, de-identified text as a `Signal` row (same table the automated
   sources write to, `captured_via: manual_screenshot`), and **discard the raw screenshot
   once extraction succeeds** — don't keep a growing archive of images containing real
   people's names and faces. This is a deliberate POPIA-minded default: the raw image only
   needs to exist for the seconds it takes Claude to read it, not indefinitely. If Albert
   wants a short review window in case extraction looks wrong, keep raw images for a few
   days in temporary storage and auto-delete on a schedule — not permanent retention either
   way.

**Digest cadence follows the same weekly rhythm** — generate the ranked `DigestReport` right
after each Wednesday capture session (same day or next), pulling in both the fresh
manual-capture signals and whatever the automated sources gathered since the last run. This
keeps the report's cadence tied to the highest-effort, highest-signal input rather than
running on an arbitrary schedule that might land before or after the actual capture session.

## Processing

1. **Scheduled pull** (Vercel Cron — check current plan limits on frequency before assuming
   a schedule; Hobby/Pro tiers have historically differed on minimum interval) hits each
   configured automated source for the region, since the last run. **Manual capture pull**
   (see above) happens weekly (Wednesdays) via the upload page instead of a cron schedule — it's
   triggered by a human action, not time alone.
2. **Store raw signal items**: region, source, raw text/snippet (or Claude's extracted text
   for manual captures), source URL (where applicable), timestamp. Keep this reasonably lean
   — strip usernames/handles where a source exposes them and they're not needed, POPIA-minded
   default rather than an afterthought.
3. **Classify against existing themes, not fresh each time.** This is the part that makes
   trend-finding actually work: when a new signal comes in, Claude checks it against the
   region's existing `Theme` list (see data model) and either attaches it to a matching theme
   or creates a new one — themes persist and accumulate across every source and every period,
   they aren't recomputed from scratch each digest. Without this, "trending" is meaningless —
   you'd just get disconnected snapshots that can't show whether something's growing,
   recurring, or a one-off. Every signal, from every source (RSS, search, Places, manual
   screenshots — all of it, not just whichever source is easiest), feeds the same pool of
   themes.
3b. **Same classification pass also tags `signal_type` (demand/supply/unclear) — added
   2026-08-02.** A signal isn't just "which theme," it's also "is this someone needing the
   thing, or a business selling it." Prompt Claude with both jobs in one pass: theme match/
   creation, plus a demand-vs-supply judgment (a listing/ad/business-homepage snippet is
   `supply`; a question, complaint, or recommendation-request is `demand`; anything unclear
   stays `unclear` rather than guessing). This exists because search-API results in
   particular skew almost entirely `supply` — see the Data sources caveat above — and without
   this tag there's no way to tell a genuinely rising need apart from a suburb that just has a
   lot of plumbers advertising.
4. **Compute trend, don't just count — and only count `demand` signals.** For each theme:
   total `demand`-tagged signal count, count this period vs. prior periods, first-seen and
   last-seen dates, and a simple direction (rising / steady / falling / dormant) from the
   period-over-period delta. `supply`-tagged signals are excluded from these numbers entirely
   — they're kept and shown (see Output below) as separate context, not folded into "is this
   trending." This is plain SQL aggregation over `Signal` grouped by `theme_id` and time
   bucket (with a `WHERE signal_type = 'demand'` on the trend query) — no ML clustering
   pipeline, no separate analytics tool. Don't build a rollup/materialized-view table until
   querying this live is actually slow, not before.
5. **Compute a `gap_score` per theme — added 2026-08-02, replaces the vague "volume+trend
   blend."** Volume and trend alone conflate "popular topic" with "actual opportunity" — the
   Plumbing theme proved this (high volume, 100% businesses advertising, zero real gap). A
   theme is a genuine opportunity when demand is meaningful, relatively unmet, and not
   fading. Computed at query/digest time (plain SQL + arithmetic, not stored, same
   no-rollup-table-until-slow principle as trend):
   - `demand_volume` — recency-weighted count of `demand`-tagged signals (recent periods
     weighted higher than old ones, simple decay is enough, no need for anything fancier).
   - `trend_multiplier` — rising ×1.5, steady ×1.0, falling ×0.7, dormant themes excluded
     from scoring entirely (they still exist in the data, just don't surface as an
     opportunity).
   - `supply_ratio` — demand signals ÷ (demand + supply signals) for the theme. High ratio =
     little competition = bigger gap. Low ratio = saturated = not really a gap, just a
     popular category.
   - `gap_score = demand_volume × trend_multiplier × supply_ratio`.
   - `confidence` — themes below a minimum signal count (start at 5, tune once real data
     volume is seen) are flagged low-confidence and held out of top rankings regardless of
     score, so a 3-signal theme can't outrank a 40-signal one on a fluke.
6. **Claude writes the digest, organized into three buckets, not one flat ranked list**:
   - **Clear gaps** — top themes by `gap_score`, confidence permitting. Each gets: the score,
     2-3 supporting `demand` example signals, a plain-English "why this looks like a gap"
     (what the supply_ratio and trend say), and the existing "practical, smart,
     Klaargesukkel-shaped solution, or too big/regulated/niche to touch" judgment call.
   - **Rising but crowded** — real, growing demand, but low `supply_ratio` (plenty of
     existing competitors). Not zero-opportunity, but the digest should say so explicitly and
     note it'd need a differentiation angle, not a straight build.
   - **Watch list** — themes below the confidence threshold. Worth naming so Albert knows
     they exist and can sanity-check against his own knowledge, but explicitly not
     recommendations yet.
   - **Cross-theme rollup note** — as a last step, Claude scans the Clear gaps + Rising
     themes for obvious overlap (e.g. "plumber," "geyser repair," and "leak detection" might
     really be one bigger "home emergency repairs" opportunity) and calls it out as a short
     paragraph if found. Not a rigid structural feature — just an instruction in the digest
     prompt, skip it if nothing overlaps.
   - Also note what got filtered out and why (e.g. "N supply-only themes and N low-confidence
     themes excluded, see the dashboard's Watch/supply filters if curious") — a digest that
     silently drops data is less trustworthy than one that says what it left out.
7. **Output**: both a written digest and a structured, filterable view — see Output below —
   viewable at `ops.klaargesukkel.com/eyespy` (same session login as the rest of the ops
   app). Digest generation does **not** depend on the Google Places source being wired in —
   it should run against whatever sources are live at the time, same as the dashboard.
   Generated on the weekly Wednesday rhythm as a baseline, plus an on-demand "regenerate now"
   action in the dashboard — given how much volume is already flowing across 9 sources,
   Albert shouldn't have to wait until Wednesday to get a fresh read.

## Output — "usable manner," not just a text dump

The point of tracking themes persistently (step 3-4 above) is to make trends visible, not
just producible. The eyespy dashboard should be a real table/view, not only a wall of
digest text:

- A themes table **default-sorted by `gap_score`** (added 2026-08-02, replaces the old vague
  "volume+trend blend" sort — see Processing step 5 for the formula), showing: theme label,
  category, gap_score, a bucket badge (Clear gap / Rising but crowded / Watch — same three
  buckets as the digest, so the always-live dashboard and the periodic digest tell the same
  story instead of using two different mental models), `demand` signal count, `supply_ratio`,
  trend indicator (↑ rising / → steady / ↓ falling / dormant) with the period-over-period
  delta, first-seen and last-seen dates.
- Click into a theme to see its underlying example signals — de-identified text, source,
  link where one exists, date — so Albert can sanity-check what's actually driving a theme
  before acting on it.
- A simple volume-over-time view per theme (a plain bar/line of signal count per period is
  enough — no need for anything fancier) so a trend is visible at a glance, not just implied
  by a number.
- The written digest (Processing steps 5-6) stays as a complementary quick-read artifact, not
  a replacement for the structured view — some sessions Albert will want to skim the
  narrative, others he'll want to filter/drill into the table directly. Add a "Regenerate
  digest now" action here too, per the cadence note in Processing step 7.
- Filters worth having from the start: by category, by source (including "manual capture
  only" to see what the Facebook Group pass specifically surfaced), by date range, and by
  `signal_type` (added 2026-08-02) — default the themes table and volume/trend numbers to
  `demand` only, with an explicit toggle to also show `supply` signals as context rather than
  mixing them in silently.
- **Backfill note:** themes classified before the `signal_type` field existed (e.g. the
  "Plumbing and pipe repair services" theme, currently 100% business ad copy from Brave
  Search) need a one-time reclassification pass once the field's built, or they'll keep
  showing inflated/misleading volume until they naturally age out. Don't leave old data
  silently wrong — reclassify existing signals, don't just apply the filter going forward.

## Data model (starting point)

- `Region` — name, search keywords, place/lat-lng + radius
- `Source` — type (reddit/search/places/rss/manual_capture/etc.), config (subreddit name,
  query templates, place categories, feed URL)
- `Group` — the configured list of 5–10 tracked Facebook groups (name/label only — not
  scraped, just used to tag manual captures during upload)
- `Theme` — region_id, label, description, category, first_seen_at, last_seen_at, status
  (active/dormant) — persists and accumulates across periods and sources, this is what makes
  trend-finding possible
- `Signal` — region_id, source_id, theme_id (nullable until classified), raw_text, url
  (nullable — manual captures won't have one), timestamp, captured_via
  (`automated`/`manual_screenshot`), group_id (nullable, set for manual captures),
  `signal_type` (`demand`/`supply`/`unclear` — added 2026-08-02 after confirming search-API
  results were 100% business ad copy classified as if it were demand; only `demand` signals
  should count toward a theme's volume/trend computation, see Data sources' search-API
  caveat above)
- `DigestReport` — region_id, period, generated_at, generated_by (`scheduled`/`manual`, added
  2026-08-02 to support the on-demand regenerate action), ranked_themes (JSON: theme_id,
  bucket [`clear_gap`/`rising_crowded`/`watch`], gap_score, supply_ratio, trend direction,
  demand period count, demand total count, confidence, example signals, "worth building?"
  flag), rollup_note (text, nullable — the cross-theme overlap paragraph, when found),
  excluded_summary (text — what got filtered out and why, per the digest's "don't silently
  drop data" rule)

Raw screenshot images are **not** part of this data model as a persisted entity — they exist
only transiently during the upload-and-extract step (see Manual capture workflow above).

## Hosting

Unlike Sukkel Bot, this fits Vercel fine — no persistent connection needed, just a scheduled
job hitting a handful of APIs on a cadence and writing to a database, plus an upload page for
manual captures. Vercel Cron + Vercel Postgres (or whatever DB the rest of the monorepo ends
up using) covers the automated side; the manual-capture upload needs short-lived file storage
for the screenshot during extraction (Vercel Blob is the natural fit given everything else is
already on Vercel — a few days' retention at most, not permanent). Ships as a route inside
the existing `apps/ops` project (`/eyespy`) — no new Root Directory, no new Vercel project, no
new subdomain, no new auth. Its API keys (Google/Bing Search, Google Places, Reddit) get
added as more env vars on that same `apps/ops` Vercel project, and the Cron job gets added to
that project too.

## Prerequisites only Albert can provide

**Nothing blocks GroundUp (Q&A + News), Daily Maverick, or the CapeTalk podcast** — those
three are free, live, and ready to wire in with no key/account from Albert. Remaining
prerequisites, in priority order (reordered 2026-08-02 — Reddit moved to top, it's the
highest-signal source still blocked):

- **Reddit API app registration** (client ID/secret) — top priority. Check current free-tier
  terms first (reddit.com/wiki/api, terms have shifted before), then create a "script" app at
  reddit.com/prefs/apps.
- Google/Bing/Brave Search API key (any one unblocks geo+intent search queries — Brave has a
  free developer tier worth checking first)
- Google Places API key
- Google Trends API (alpha) — optional, apply for access at the developer blog announcement;
  not urgent, approval timeline unknown
- The actual list of 5–10 Durbanville-area Facebook groups to track for manual capture, and
  who's doing the weekly (Wednesday) capture session (Albert himself or a delegate)

## What NOT to build in v1

- No scraping of any ToS-prohibited platform, even if a client asks or it seems tempting for
  coverage — this is the one rule not to bend. Manual capture (human-driven, not automated)
  is the sanctioned way Facebook Group content gets in — don't build anything that automates
  the capture step itself (no bot logging into Facebook, no auto-screenshotting).
- No separate OCR pipeline — Claude's vision support reads the screenshots directly.
- No permanent screenshot archive — extract and discard, per the retention note above.
- No fully automatic "build this" pipeline — EyeSpy produces a ranked digest, Albert decides
  what to actually build. Keep human judgment in the loop.
- No multi-region support until Durbanville proves the concept.
- No separate analytics/BI tool and no ML clustering pipeline for trend detection — Claude's
  theme classification plus a SQL group-by is enough at this scale. No rollup/materialized-
  view table for trend stats until querying `Signal` live is actually measured as slow.
