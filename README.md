# Klaargesukkel

*Klaar met sukkel.* Small, sharp digital solutions for everyday hassles.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full picture (hub, owned products,
client-delivered engines, ops), [BRAND.md](BRAND.md) for identity/positioning,
[EYESPY.md](EYESPY.md) for the internal demand-signal research tool, and
[DEPLOYMENT.md](DEPLOYMENT.md) for how to get this live on klaargesukkel.com /
klaargesukkel.co.za.

## Structure

This is a monorepo. Each product is its own app under `apps/`, deployed as its own Vercel
project pointed at its own subdomain. Nothing shares a deploy — a bug in one product can't
take another one down.

```
apps/
  hub/     → klaargesukkel.com        (landing page — live)
  dinner/  → dinner.klaargesukkel.com (dinner planner — live)
  ops/     → ops.klaargesukkel.com    (private internal ops app — live)
  orders/  → orders.klaargesukkel.com (not started)
  chat/    → chat.klaargesukkel.com   (not started)
  pace/    → pace.klaargesukkel.com   (not started)
```

`apps/dinner` is plain static HTML/CSS/JS (no framework, no build step) — a self-contained
weeknight dinner planner with a freezer tracker, batch-cook scheduling, and shopping lists.
On Vercel it needs **Framework Preset: Other**, no build command, output directory `./`.

`apps/ops` is a private internal-ops app — not linked from the public hub, gated by a real
login page (session cookie via `middleware.ts`, needs `ADMIN_USER`/`ADMIN_PASSWORD`/
`SESSION_SECRET` env vars or every route redirects to a login that can never succeed) with a
nav bar across three tools:

- `/clients` — who your clients are, which engine/product they're on, their domain or
  WhatsApp number, status.
- `/projects` — every idea, product, and project across the whole business, tracked by
  status/priority in a Kanban-style view, plus a cross-project "next steps" panel so nothing
  gets lost between conversations.
- `/eyespy` — placeholder for now (spec only, see EYESPY.md); a scheduled job that reads
  compliant sources (official APIs, RSS, open data, deliberately no direct scraping of
  platforms whose ToS forbids it) for a given area and produces a ranked digest of local
  demand/pain-point signals, used as ideation input for what to build next.

This used to be three separate apps (`admin`, `eyespy`, `dashboard`), each its own subdomain
and browser Basic-Auth popup — merged 2026-07-30 into one login/one nav since all three are
private single-operator tools. See ARCHITECTURE.md's Layer 4 section for the full reasoning.

Client-delivered products — Cockpit, and eventually a WhatsApp bot engine — are **not** part
of this monorepo. They're separate repos, built multi-tenant (one app serves every client via
custom-domain/phone-number lookup), and the hub only ever shows a portfolio card linking out.
Full reasoning in ARCHITECTURE.md.

## Adding a new product

1. `mkdir apps/<name>` and scaffold it (copy `apps/hub` as a starting point for a Next.js app,
   or use whatever stack fits the product — a WhatsApp bot might be a plain Node service
   instead).
2. Push to the same GitHub repo.
3. In Vercel: **Add New Project** → same repo → set **Root Directory** to `apps/<name>`.
4. Add a subdomain (`<name>.klaargesukkel.com`) to that Vercel project and point it at your
   GoDaddy DNS (see DEPLOYMENT.md — same steps as the hub, just a new CNAME).
5. Add a card for it in `apps/hub/app/page.tsx` (the `products` array) and flip its status
   once it's live.

## Local dev (hub)

```
cd apps/hub
npm install
npm run dev
```
