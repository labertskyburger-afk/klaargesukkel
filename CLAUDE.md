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

## Current state (as of 2026-07-26)

Nothing has been pushed to GitHub or deployed to Vercel yet. Everything below exists locally
in this folder only.

```
apps/
  hub/     — Next.js 14 (App Router) + Tailwind. Landing page, product cards. Builds fine
             locally (Albert confirmed npm install/build/dev all work on his machine).
  dinner/  — plain static HTML/CSS/JS, no framework, no build step. A real weeknight dinner
             planner (freezer tracker, batch-cook scheduler, shopping lists). Uses
             localStorage — per-device only, no backend.
  admin/   — Next.js 14 + Tailwind. Private client tracker, gated by Basic Auth middleware
             (middleware.ts) reading ADMIN_USER/ADMIN_PASSWORD env vars — fails closed if
             unset. Data source is apps/admin/data/clients.json (hand-edited, no DB yet).
  dashboard/ — Next.js 14 + Tailwind. Private idea/project tracker (same Basic Auth pattern
             as admin), Kanban-style view grouped by status. Data source is
             apps/dashboard/data/ideas.json (hand-edited, no DB yet) — update this file
             whenever a new idea/product is discussed or an existing one's status changes,
             same spirit as clients.json for apps/admin.
```

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

**New app to scaffold: `apps/eyespy`.** Full spec in EYESPY.md (repo root) — read it before
starting. Short version: an internal (not client-facing) tool that periodically pulls
demand/pain-point signals for a region (starting with Durbanville, Cape Town) from compliant
sources only — official APIs, RSS, open data, explicitly **not** automated scraping of any
platform whose ToS prohibits it. Facebook Groups are excluded from *automation* (Meta killed
third-party Groups API access in April 2024) but still get in via a **weekly (Wednesday) manual
capture workflow**: a human screenshots relevant posts while browsing normally (fully
ToS-compliant), uploads them to an intake page, Claude's vision support extracts the
de-identified signal text (no separate OCR needed), and the raw screenshot is discarded, not
archived — see EYESPY.md's "Manual capture workflow" section for the full design, it's not
optional detail. Same private/basic-auth pattern as `apps/admin`, own Vercel project + Vercel
Cron for the automated sources, Vercel Blob for short-lived screenshot storage during
extraction, subdomain `eyespy.klaargesukkel.com`, not linked from the public hub.
Prerequisites Albert needs to provide before this can really be built: a Google/Bing Search
API key, a Google Places API key, Reddit API app credentials (check current free-tier terms
first, they've shifted more than once), and the actual list of 5–10 Durbanville Facebook
groups to track. Ask him for these rather than stubbing around them, same pattern as the
WhatsApp bot's prerequisites.

Core requirement, not an add-on: every signal from every source (automated and manual
screenshots alike) feeds one persistent, cross-period `Theme` pool per region, and the
eyespy dashboard surfaces actual trends (rising/falling/steady, volume over time) — not just
a per-period digest with no memory of prior periods. See EYESPY.md's "Processing" and
"Output" sections for the specific data-model and presentation shape this implies.

## Immediate to-do

1. **Git + GitHub.** `git init` at the repo root if not already, commit everything, create a
   GitHub repo (Albert will need to do the actual github.com/new step or grant you access —
   confirm with him rather than assuming), push. Exact commands in DEPLOYMENT.md §1.
2. **Deploy `apps/hub` to Vercel.** Root Directory `apps/hub`, Next.js preset auto-detected.
   DEPLOYMENT.md §2.
3. **Point klaargesukkel.com + klaargesukkel.co.za at it via GoDaddy DNS.** DEPLOYMENT.md §3–4.
   Vercel's domain settings show the exact A/CNAME values to use — don't hardcode old ones.
4. **Deploy `apps/dinner`.** Different Vercel settings than the other apps — Framework Preset
   **Other**, no build command, output directory `./`. DEPLOYMENT.md §5b. Subdomain
   `dinner.klaargesukkel.com`.
5. **Deploy `apps/admin`.** Set `ADMIN_USER`/`ADMIN_PASSWORD` in that Vercel project's env
   vars before/at deploy — otherwise every request 401s (which is correct, just don't be
   surprised). Subdomain `admin.klaargesukkel.com`, and don't link it from the public hub.
   DEPLOYMENT.md §5c.
6. **Deploy `apps/dashboard`.** Already fully built (Cowork wrote all the code, nothing left
   to author) — same Basic Auth env vars as admin, can reuse the same values. Subdomain
   `dashboard.klaargesukkel.com`, don't link it from the public hub. DEPLOYMENT.md §5e. Do a
   local `npm install && npm run build` first if you want to verify before pushing — it
   hasn't been build-tested anywhere yet (no npm registry access existed in the Cowork
   sandbox that wrote it).
7. **Sanity check the hub's Cockpit card** still points at
   `https://cockpit-omega-blush.vercel.app/` (or wherever Cockpit currently lives — confirm
   with Albert if it's moved).

## Known gotchas from building this so far

- `apps/hub/app/page.tsx`'s `products` array needs an explicit `Product` type with
  `href?: string` — without it, TypeScript's strict mode chokes on accessing `.href` across a
  union of object literals with/without that field. Already fixed, just don't regress it if
  you refactor.
- No sandbox that built this had npm registry access, so builds were never verified with a
  real `npm install && npm run build` from that side — Albert's own machine did confirm the
  hub builds fine, but double-check `apps/admin` and `apps/dashboard` the same way since
  neither has been build tested anywhere yet.
- Don't commit `node_modules` or `.next` — both gitignored per-app already, keep it that way.

## Conventions going forward

- New owned product → `apps/<name>` in this repo, own Vercel project (Root Directory
  `apps/<name>`), own `<name>.klaargesukkel.com` subdomain, add a card to
  `apps/hub/app/page.tsx`.
- New client-delivered engine (bot, platform) → its own repo, multi-tenant from day one
  (tenant resolved by hostname for web, `phone_number_id` for WhatsApp — see ARCHITECTURE.md
  "How white-labeling actually works"), hub gets a portfolio card linking out, nothing more.
- Every client that goes live anywhere → add a row to `apps/admin/data/clients.json` so the
  ops view stays accurate.
