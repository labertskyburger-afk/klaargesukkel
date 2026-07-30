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

- **Reddit, official API.** Free tier is rate-limited (100 QPM) and fine for non-commercial-
  scale querying of Cape Town-focused subreddits — verify current free-tier terms before
  building, Reddit's terms have shifted multiple times and will likely shift again. Do not
  scrape Reddit outside the official API.
- **Google/Bing Search API, geo+intent queries.** Queries like "looking for [service] in
  Durbanville", "does anyone know a good [type] in Durbanville", "where to find [thing]
  Durbanville" — read via the search API's own results/snippets, not by scraping the linked
  pages directly.
- **Google Places API, reviews.** Places API has native radius search — pull reviews for
  businesses/categories in the Durbanville radius, scan for complaint/gap patterns ("wish
  there was...", "no one offers...", "impossible to find..."). This is the best structural
  fit for the "region radius" part of the original idea — it's actually geo-native, unlike
  most forum content.
- **Local classifieds "wanted" sections** (Gumtree/OLX South Africa) — **verify their
  robots.txt/ToS explicitly allows this before implementing**, don't assume. If they don't,
  drop this source rather than scrape around it.
- **Local news RSS + public comments**, where a Cape Town/Durbanville outlet publishes RSS
  (most South African news sites do) — RSS is designed for exactly this kind of aggregation,
  no compliance question.
- **City of Cape Town open data portal** (data.capetown.gov.za or equivalent) — check for
  public service-request/complaint data. If it exists, it's explicitly meant for reuse and
  is probably the single highest-signal, lowest-effort source available — check this first,
  before building anything else.

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
4. **Compute trend, don't just count.** For each theme: total signal count, count this
   period vs. prior periods, first-seen and last-seen dates, and a simple direction (rising /
   steady / falling / dormant) from the period-over-period delta. This is plain SQL
   aggregation over `Signal` grouped by `theme_id` and time bucket — no ML clustering
   pipeline, no separate analytics tool, Claude's classification step plus a group-by is
   enough at this scale. Don't build a rollup/materialized-view table until querying this
   live is actually slow, not before.
5. **Claude writes the digest**: for the top themes by a combination of volume and trend
   (a theme that's small but accelerating matters as much as one that's just consistently
   large), a short write-up with 2-3 supporting example signals, and a flag for whether it
   looks like a viable "practical, smart" Klaargesukkel-shaped solution versus noise or
   something too big/regulated to touch.
6. **Output**: both a written digest and a structured, filterable view — see Output below —
   viewable at `ops.klaargesukkel.com/eyespy` (same session login as the rest of the ops
   app), generated on the weekly rhythm described above.

## Output — "usable manner," not just a text dump

The point of tracking themes persistently (step 3-4 above) is to make trends visible, not
just producible. The eyespy dashboard should be a real table/view, not only a wall of
digest text:

- A themes table sorted by what actually matters most right now (a blend of total volume and
  trend direction — a small-but-rising theme surfacing near the top is more useful than a
  flat sort by raw count), showing: theme label, category, total signal count, trend
  indicator (↑ rising / → steady / ↓ falling / dormant) with the period-over-period delta,
  first-seen and last-seen dates.
- Click into a theme to see its underlying example signals — de-identified text, source,
  link where one exists, date — so Albert can sanity-check what's actually driving a theme
  before acting on it.
- A simple volume-over-time view per theme (a plain bar/line of signal count per period is
  enough — no need for anything fancier) so a trend is visible at a glance, not just implied
  by a number.
- The written digest (step 5) stays as a complementary quick-read artifact, not a
  replacement for the structured view — some sessions Albert will want to skim the narrative,
  others he'll want to filter/drill into the table directly.
- Filters worth having from the start: by category, by source (including "manual capture
  only" to see what the Facebook Group pass specifically surfaced), by date range.

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
  (`automated`/`manual_screenshot`), group_id (nullable, set for manual captures)
- `DigestReport` — region_id, period, ranked_themes (JSON: theme_id, rank, trend direction,
  period count, total count, example signals, "worth building?" flag), generated_at

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

- Google/Bing Search API key (or both)
- Google Places API key
- Reddit API app registration (client ID/secret) once free-tier terms are confirmed workable
- Confirmation the City of Cape Town open data portal has something usable, if Claude Code
  finds a candidate dataset worth pointing at
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
