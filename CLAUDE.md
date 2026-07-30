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

## Current state (as of 2026-07-30)

`hub`, `dinner`, and `ops` are live and deployed. Nothing else has shipped yet.

```
apps/
  hub/     — Next.js 14 (App Router) + Tailwind. Landing page, product cards. Live at
             klaargesukkel.com / klaargesukkel.co.za.
  dinner/  — plain static HTML/CSS/JS, no framework, no build step. A real weeknight dinner
             planner (freezer tracker, batch-cook scheduler, shopping lists). Uses
             localStorage — per-device only, no backend. Live at dinner.klaargesukkel.com.
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
             entry, not one long string, or the cross-project panel loses it), and `/eyespy`
             (placeholder only — not built, see EYESPY.md and the "Pending from Cowork"
             section below).
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

**To scaffold: EyeSpy, as a route inside `apps/ops` (not its own app anymore — see the
2026-07-30 ops merge in "Current state" above).** Full spec in EYESPY.md (repo root) — read
it before starting. Short version: an internal (not client-facing) tool that periodically
pulls demand/pain-point signals for a region (starting with Durbanville, Cape Town) from
compliant sources only — official APIs, RSS, open data, explicitly **not** automated scraping
of any platform whose ToS prohibits it. Facebook Groups are excluded from *automation* (Meta
killed third-party Groups API access in April 2024) but still get in via a **weekly
(Wednesday) manual capture workflow**: a human screenshots relevant posts while browsing
normally (fully ToS-compliant), uploads them to an intake page, Claude's vision support
extracts the de-identified signal text (no separate OCR needed), and the raw screenshot is
discarded, not archived — see EYESPY.md's "Manual capture workflow" section for the full
design, it's not optional detail. Build it under `apps/ops/app/(app)/eyespy/` (replacing the
current placeholder page), reuse the existing session-cookie auth (no new auth needed — it's
already behind the ops login), add a Vercel Cron job on the `apps/ops` project for the
automated sources, Vercel Blob for short-lived screenshot storage during extraction. Its API
keys become additional env vars on the same `apps/ops` Vercel project. Prerequisites Albert
needs to provide before this can really be built (already mirrored in
`apps/ops/data/ideas.json`'s EyeSpy entry — keep both in sync if any of these change):

- Google/Bing Search API key
- Google Places API key
- Reddit API app credentials (check current free-tier terms first, they've shifted more than
  once)
- The actual list of 5–10 Durbanville Facebook groups to track

Ask him for these rather than stubbing around them, same pattern as the WhatsApp bot's
prerequisites.

Core requirement, not an add-on: every signal from every source (automated and manual
screenshots alike) feeds one persistent, cross-period `Theme` pool per region, and the
eyespy dashboard surfaces actual trends (rising/falling/steady, volume over time) — not just
a per-period digest with no memory of prior periods. See EYESPY.md's "Processing" and
"Output" sections for the specific data-model and presentation shape this implies.

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
