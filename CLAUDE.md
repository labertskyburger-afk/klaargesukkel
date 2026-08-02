# Klaargesukkel — instructions for Claude Code

Read this first. Then read `ARCHITECTURE.md`, `BRAND.md`, and `DEPLOYMENT.md` in this same
folder before doing anything — they're the real source of truth, this file just orients you
and lists what's outstanding.

## What this is

Albert's business: small, sharp digital solutions for everyday hassles, hosted under
`klaargesukkel.com` / `klaargesukkel.co.za` (both owned on GoDaddy). This repo is the
**marketing hub + owned products + internal ops** — see ARCHITECTURE.md for the full 4-layer
picture (hub / owned products / client-delivered engines / ops). Client-delivered engines
(Cockpit, a future WhatsApp bot) are deliberately **separate repos**, not in here — Cockpit
already exists at `github.com/labertskyburger-afk/cockpit` and you may already be working on
it in another session.

## How this repo and the Cowork side split the work

Albert also works on this business in Claude's Cowork mode (Claude Desktop) — that's where
architecture decisions, brand direction, and content get worked out, because it has better
research/planning tools and no reason to touch git or npm. This repo's `.md` files
(ARCHITECTURE.md, BRAND.md, DEPLOYMENT.md, README.md, this file) are the handoff surface
between the two: Cowork writes decisions into them, you read them fresh each session rather
than trusting memory of a past one. If you make a structural decision here (new app, new
convention, new engine), update the relevant doc so the Cowork side stays accurate too — it
doesn't read git history, only these files.

**Your side of the line:** git, GitHub, npm/build/test, Vercel deploys, DNS-adjacent config,
actual product code for `apps/*`, and (in its own repo/session) Cockpit and any future
client-delivered engine.

**Not your side of the line:** brand/positioning changes, new business-architecture decisions
(multi-tenant vs. per-client, what a new product should even do) — flag these back to Albert
rather than deciding unilaterally, since the Cowork side is where that gets worked through.

**Keep `apps/ops/data/ideas.json` in sync — this is not optional.** It's the one place
Albert checks across the whole business to make sure nothing gets missed (at `/projects`
inside the ops app — see "Current state" below for why this used to be its own
`apps/dashboard` app and isn't anymore). Every prerequisite, blocker, or open decision
mentioned anywhere in this file — and anything you discover or resolve while working — needs
to be reflected in the relevant project's `nextSteps` array there: add new ones as they come
up, remove/update ones that get resolved, keep `waitingOn` accurate. Don't let this file and
the dashboard drift apart — if you update one, check whether the other needs the same update.

## Current state (as of 2026-07-31)

`hub`, `dinner`, and `ops` are live and deployed. Nothing else has shipped yet.

```
apps/
  hub/     — Next.js 14 (App Router) + Tailwind. Landing page, product cards. Live at
             klaargesukkel.com / klaargesukkel.co.za.
  dinner/  — Next.js 14 (App Router) + Tailwind, converted from static HTML on 2026-08-02 (see
             "Pending from Cowork (added 2026-08-02)" below). A real weeknight dinner planner
             (freezer tracker, batch-cook scheduler, recipe library, shopping lists, editable
             week plan, a leftovers/on-the-fly board, user-added custom recipes), installable
             as a home-screen PWA. Accounts (Auth.js, Resend email magic-link) + server-side
             sync (GET/PUT /api/state, debounced, scoped to the logged-in user's household) are
             built and build-tested locally (`npm run build` passes clean) but **not yet live**
             — blocked on Albert provisioning a separate Neon Postgres project, a Resend
             account, and the Vercel project's env vars (DATABASE_URL, AUTH_SECRET,
             RESEND_API_KEY). See apps/ops/data/ideas.json's Dinner System entry for the exact
             remaining steps. Until that lands, dinner.klaargesukkel.com is still serving the
             old static localStorage-only build — don't deploy this app's `main` branch until
             the new Neon DB exists and its migration has been hand-applied, or the live site
             will break (no DATABASE_URL to connect to).
  ops/     — Next.js 14 + Tailwind. Private internal-ops app, live at ops.klaargesukkel.com.
             Merged 2026-07-30 from three separate apps (`admin`, `eyespy` stub, `dashboard`)
             that each had their own subdomain and browser Basic-Auth popup with no shared
             session or nav — see ARCHITECTURE.md's Layer 4 section for the full reasoning.
             Now one app, one real login page (session cookie via middleware.ts, not the
             browser's native auth popup), one nav bar. Requires ADMIN_USER, ADMIN_PASSWORD,
             and SESSION_SECRET env vars — fails closed (no route renders) if any are unset.
             Routes: `/clients` (client tracker, data in apps/ops/data/clients.json),
             `/projects` (idea/project tracker + cross-project "next steps" panel, data in
             apps/ops/data/ideas.json — schema: each idea has a top-level `priority`
             ("High"/"Medium"/"Low") plus a `nextSteps` array, each entry
             `{ step, owner, waitingOn, priority }` — keep every open action item as its own
             entry, not one long string, or the cross-project panel loses it), `/eyespy`
             (built 2026-07-31 — themes table sorted by trend+volume, per-theme detail with
             volume-over-time and example signals, category/source filters — see below for
             what's still blocked), and `/eyespy/capture` (weekly manual-capture upload:
             screenshot → Claude vision extraction → de-identified Signal, processed
             entirely in-memory, never persisted to disk/blob storage).
```

Postgres (Neon, via Vercel) is now provisioned for `apps/ops` — six tables (Region, Source,
Group, Theme, Signal, DigestReport) per EYESPY.md's data model. Migrations are hand-applied
via Neon's SQL console (`apps/ops/prisma/migrations/`), not `prisma migrate deploy` in the
build — a pooled Neon connection blocks DDL, same lesson as the Cockpit repo. Regular
app queries go through the pooled `DATABASE_URL` as normal; only schema changes need the
manual-SQL route.

## Pending from Cowork (added 2026-07-29)

BRAND.md changed since you may have last read it: a new primary English catchline,
**"Smart enough to keep it simple."**, was chosen to replace "No more sukkel. Just
solutions." (see BRAND.md's Tagline options section for the full reasoning and backup
options). "Klaar met sukkel." stays as the primary Afrikaans-facing tagline — this is an
addition alongside it, not a replacement of the Afrikaans line.

Action needed in `apps/hub`: work the new catchline into the hero (e.g. as a short subheading
under the "Klaar met sukkel." H1 in `app/page.tsx`) and/or the meta description in
`app/layout.tsx`. Exact placement/wording polish is your call — just don't drop the Afrikaans
H1, and flag back to Albert if you think the tagline itself needs further wordsmithing rather
than silently changing it again.

A matching Gmail signature (`brand/email-signature.html`) already uses the new catchline —
not part of this repo's deploy, just FYI so the two stay in sync if the wording ever changes
again.

**EyeSpy — built 2026-07-31, but not fully wired up yet.** Lives as routes inside `apps/ops`
(`/eyespy`, `/eyespy/[themeId]`, `/eyespy/capture`), not its own app — see the 2026-07-30 ops
merge in "Current state" above. Full spec in EYESPY.md. What's actually working:

- Postgres schema live (Region/Source/Group/Theme/Signal/DigestReport)
- RSS source wired to IOL's Western Cape feed, tested against the live feed
- Daily Vercel Cron (`/api/cron/ingest`, `apps/ops/vercel.json`) that self-seeds the region
  and sources, pulls, dedupes, and classifies signals against the region's theme pool
  (Claude Haiku 4.5 — cheap/fast, right for this) via `lib/ingest/classify.ts`
- Period-over-period trend computation (rising/falling/steady/dormant) — plain group-by
  queries, no rollup table, per EYESPY.md's "don't build one until it's slow" guidance
- The actual dashboard: themes table sorted by trend+volume blend, per-theme detail with a
  volume-over-time chart and example signals, category/source/manual-only filters
- The weekly manual-capture upload flow at `/eyespy/capture` — screenshot → Claude Opus 5
  vision extraction (de-identified text only) → classified Signal. Deliberately skips Vercel
  Blob: the screenshot is processed entirely in-memory in one request, never persisted, which
  more strongly guarantees "discard the raw screenshot" than a storage-plus-cleanup-job would

**Update 2026-08-02:** `ANTHROPIC_API_KEY` and `CRON_SECRET` are now set on the `apps/ops`
Vercel project. While verifying this, found and fixed a real bug: `apps/ops/middleware.ts`'s
session-cookie login gate had no exclusion for `/api/cron`, so it was redirecting every call to
`/api/cron/ingest` — including Vercel Cron's own scheduled calls — to `/login` before the
route's own `CRON_SECRET` bearer-token check ever ran. The daily ingest cron had likely never
actually executed even once. Fixed by adding `/api/cron` to `middleware.ts`'s `PUBLIC_PATHS`
(the route's own secret check still protects it — `/api/eyespy/capture` was left alone since
that one's correctly meant to run behind the login session, not independently). Still needs a
real run to confirm end-to-end (next scheduled 06:00 run, or a manual trigger).

**Still blocked on Albert** (mirrored in `apps/ops/data/ideas.json`'s EyeSpy entry — keep
both in sync if any of these change):

- The Cape Town Service Requests ArcGIS FeatureServer query URL — the dataset is confirmed
  real and needs no API key, but the query endpoint itself needs a human with a real browser
  to find (Claude Code's fetch tooling hit 404s on the ArcGIS Hub site). Once you have it, it
  goes in the `Source.config.queryUrl` for the "Cape Town Service Requests" source (currently
  seeded but `active: false`) — flip it active once the URL's in
- Google/Bing Search API key
- Google Places API key
- Reddit API app credentials (check current free-tier terms first, they've shifted more than
  once)
- The actual list of 5–10 Durbanville Facebook groups to track, and who's doing the weekly
  Wednesday capture session

Ask him for these rather than stubbing around them, same pattern as the WhatsApp bot's
prerequisites. **Not yet built:** wiring Search/Places/Reddit into `lib/ingest/` once those
keys land (follow the same `NormalizedSignal`-returning pattern as `rss.ts`/`arcgis.ts`), and
a written per-period digest (`DigestReport` — the structured dashboard is built, the
complementary AI-authored digest text is not).

## Pending from Cowork (added 2026-08-02)

**Update from Claude Code (2026-08-02): the accounts/sync build described below is done.**
`apps/dinner` is now Next.js 14 + Tailwind, all existing client logic (freezer tracker,
editable week plan, leftovers board, custom recipes, shopping lists) ported into React
components, Prisma schema + hand-written migration ready at
`apps/dinner/prisma/migrations/20260802120000_init/`, Auth.js v5 wired up with Resend
(Albert's answer to the "which email provider" question below — already applied), GET/PUT
`/api/state` with 500ms-debounced client sync and one retry on failed PUTs, and the one-time
localStorage-import banner. `vercel.json` is back to `{"framework": "nextjs"}` and the old
static `index.html`/top-level `manifest.json`/`icons/` are deleted. `npm install && npm run
build` passes clean locally. Also already answered: v1 ships scoped to **just Albert syncing
his own devices** — no invite/multi-user-per-household/billing flow built, that's a later
phase per Albert's own instruction.

**What's still blocked on Albert** (dashboard actions Claude Code can't do — needs real
credentials): provisioning the separate Neon Postgres project, hand-applying the migration SQL
via Neon's console, creating a Resend account, and setting `DATABASE_URL`/`AUTH_SECRET`/
`RESEND_API_KEY` on the `apps/dinner` Vercel project (Root Directory `apps/dinner`, Framework
Preset Next.js). Once those are in place, this needs a real-browser smoke test of the full
flow (magic-link login, all 5 tabs, the import banner, cross-device sync) before treating it as
shipped — see apps/ops/data/ideas.json's Dinner System entry for the itemized list.

Albert asked in Cowork to have `apps/dinner` upgraded into a genuinely practical daily tool
(he's now doing all Mon–Thu family cooking) and, eventually, a product other families can use.
Two decisions came out of that conversation:

**Already shipped directly from Cowork (no npm/build needed, so done there rather than
handed to you):** `apps/dinner/index.html` got a real usability pass — a "Leftovers & on-the-fly
plans" board (freeform notes so mid-week reuse plans like "leftover mince → lasagna Thu" don't
get lost), an editable subtitle (household composition, no longer hardcoded to Albert's
family), an editable week plan (tap any cell to change it, with today's row highlighted), a
"add your own recipe" flow so Albert's own recipes join the built-in library and the Tonight
picker, a "copy shopping list" button (for pasting into Sixty60 or WhatsApp), a fixed missing
viewport meta tag, and PWA installability (`manifest.json` + `icons/icon-192.png` +
`icons/icon-512.png`, generated with Pillow — simple navy/gold plate-and-cutlery mark, replace
if you want something more polished). All still localStorage-backed, no schema changes, no
build step involved — verified with `node --check` on the extracted script and a tag-balance
pass rather than a real browser (no headless browser available in that sandbox). **Worth a
real browser smoke-test before/after your next deploy of this app**, since it hasn't been
visually verified.

**Decision: add accounts + server-side sync — this is your side of the line (npm/Postgres/
Next.js).** The tool currently only lives in whichever browser storage it's opened in, so
Albert's phone and laptop have separate, unsynced state, and there's no way to hand a working
copy to another family without them starting from zero on a disconnected device. Agreed
approach:

- **Convert `apps/dinner` from static HTML to Next.js 14 + Tailwind**, matching `hub`/`ops`,
  so it can have API routes and a database. This is the biggest structural change — budget
  for it accordingly, and it changes the Vercel project's Framework Preset back to Next.js
  (auto-detected) instead of "Other."
- **Keep the existing client-side data shapes as-is** rather than redesigning a relational
  schema — the fastest, lowest-risk path is to keep the same JSON blobs the localStorage
  version already uses (tracker state, shop-check state, batch date, week-plan overrides,
  leftovers array, custom recipes array) and just move where they're persisted. Concretely,
  a `Household` table with JSON columns mirroring each of those, e.g. (Prisma):
  ```
  model User {
    id        String    @id @default(cuid())
    email     String    @unique
    household Household?
    createdAt DateTime  @default(now())
  }
  model Household {
    id            String   @id @default(cuid())
    ownerUserId   String   @unique
    subtitle      String?
    trackerState  Json     @default("{}")
    shopChecks    Json     @default("{}")
    batchDate     String?
    weekOverride  Json     @default("{}")
    leftovers     Json     @default("[]")
    customRecipes Json     @default("[]")
    updatedAt     DateTime @updatedAt
  }
  ```
  One `GET /api/state` + `PUT /api/state` pair (auth-scoped to the logged-in user's household)
  replaces every `localStorage.getItem`/`setItem` call in the current script — client logic
  otherwise barely changes. Debounce the PUT on rapid changes (checkbox taps) rather than
  firing one request per click.
- **Auth: Auth.js with an email magic-link provider** (passwordless — fits a busy-parent
  audience better than a password to remember), same library Cockpit already uses, so the
  pattern's familiar. Needs an email-sending provider (Resend or similar) — ask Albert which
  he wants before wiring it up, don't default silently.
- **Separate Neon Postgres project from `apps/ops`'s**, not new tables in the same database —
  this one will hold real families' personal data (not just Albert's internal business data),
  worth keeping the blast radius/access separate from day one.
- **One-time import for Albert's own existing data**: on first login, if the browser still has
  the old localStorage keys (`dinnerTracker`, `dinnerShopChecks`, `dinnerBatchDate`,
  `dinnerWeekOverride`, `dinnerLeftovers`, `dinnerCustomRecipes`, `dinnerSubtitle`), offer a
  one-click "import this device's data" that POSTs it into the new household record — otherwise
  he loses everything he's already customized when accounts land.

**Still open, ask Albert rather than deciding unilaterally:**
- ~~Email provider for magic links~~ — resolved 2026-08-02: Resend, already wired up.
- ~~Whether v1 ships as "just Albert" first vs. multi-family~~ — resolved 2026-08-02:
  just-Albert first, already built that way.
- Timeline/priority for this relative to Cockpit and Sukkel Bot work
- Pricing/access model for other families eventually (free, paid, waitlist) — explicitly a
  business decision, not yours to make

## Immediate to-do

1. **Deploy `apps/ops` to Vercel.** New merged app (see "Current state" above) — Root
   Directory `apps/ops`, Next.js preset auto-detected. Needs `ADMIN_USER`, `ADMIN_PASSWORD`,
   and `SESSION_SECRET` env vars set before/at deploy — otherwise nothing renders (fails
   closed, correct behavior, don't be surprised). `ADMIN_USER`/`ADMIN_PASSWORD` can reuse the
   old admin/dashboard values; `SESSION_SECRET` is new — any random string, doesn't need to
   be memorable, just long and unique. Subdomain `ops.klaargesukkel.com`, don't link it from
   the public hub. Build-tested clean by Claude Code 2026-07-30 (full login → nav →
   logout cycle verified locally).
2. **Decommission the old `admin` and `dashboard` Vercel projects.** Now superseded by
   `apps/ops`. Delete both Vercel projects (or at minimum remove their
   `admin.klaargesukkel.com` / `dashboard.klaargesukkel.com` domains) and the matching CNAME
   records in GoDaddy once `ops.klaargesukkel.com` is confirmed working — this is a
   judgment call on timing, flag it to Albert rather than deleting anything unprompted.
3. **Add `ANTHROPIC_API_KEY` and `CRON_SECRET` to `apps/ops`'s env vars** so EyeSpy's
   classification, vision extraction, and cron auth actually work — the code is built and
   deployed, it just can't run without these. See the EyeSpy section above for the rest of
   what's blocked (ArcGIS URL, Search/Places/Reddit keys, Facebook groups list).

## Known gotchas from building this so far

- `apps/hub/app/page.tsx`'s `products` array needs an explicit `Product` type with
  `href?: string` — without it, TypeScript's strict mode chokes on accessing `.href` across a
  union of object literals with/without that field. Already fixed, just don't regress it if
  you refactor.
- No sandbox that built this had npm registry access, so builds were never verified with a
  real `npm install && npm run build` from that side — Albert's own machine did confirm the
  hub builds fine. `apps/ops` has since been build-tested by Claude Code (2026-07-30).
- Don't commit `node_modules` or `.next` — both gitignored per-app already, keep it that way.

## Conventions going forward

- New owned product → `apps/<name>` in this repo, own Vercel project (Root Directory
  `apps/<name>`), own `<name>.klaargesukkel.com` subdomain, add a card to
  `apps/hub/app/page.tsx`.
- New client-delivered engine (bot, platform) → its own repo, multi-tenant from day one
  (tenant resolved by hostname for web, `phone_number_id` for WhatsApp — see ARCHITECTURE.md
  "How white-labeling actually works"), hub gets a portfolio card linking out, nothing more.
- Every client that goes live anywhere → add a row to `apps/ops/data/clients.json` so the
  ops view stays accurate.
