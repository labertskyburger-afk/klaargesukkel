# Klaargesukkel

*Klaar met sukkel.* Small, sharp digital solutions for everyday hassles.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full picture (hub, owned products,
client-delivered engines, ops), [BRAND.md](BRAND.md) for identity/positioning, and
[DEPLOYMENT.md](DEPLOYMENT.md) for how to get this live on klaargesukkel.com /
klaargesukkel.co.za.

## Structure

This is a monorepo. Each product is its own app under `apps/`, deployed as its own Vercel
project pointed at its own subdomain. Nothing shares a deploy — a bug in one product can't
take another one down.

```
apps/
  hub/        → klaargesukkel.com          (landing page — live locally, not deployed yet)
  dinner/     → dinner.klaargesukkel.com   (dinner planner — built, not deployed yet)
  admin/      → admin.klaargesukkel.com    (private client tracker — built, not deployed yet)
  orders/     → orders.klaargesukkel.com   (not started)
  chat/       → chat.klaargesukkel.com     (not started)
  pace/       → pace.klaargesukkel.com     (not started)
```

`apps/dinner` is plain static HTML/CSS/JS (no framework, no build step) — a self-contained
weeknight dinner planner with a freezer tracker, batch-cook scheduling, and shopping lists.
On Vercel it needs **Framework Preset: Other**, no build command, output directory `./`.

`apps/admin` is a private, basic-auth-protected dashboard tracking clients (which
engine/product they're on, their domain or WhatsApp number, status). Not linked from the
public hub. Needs `ADMIN_USER` / `ADMIN_PASSWORD` environment variables set in its Vercel
project or every request is rejected. See ARCHITECTURE.md for why it exists and where it's
headed.

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
