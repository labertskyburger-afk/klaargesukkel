# Deploying Klaargesukkel

One repo on GitHub, one Vercel project per app, one subdomain per project. Here's the hub
(klaargesukkel.com) end to end — repeat the Vercel + DNS steps for each future product.

## 1. Push to GitHub

```
cd klaargesukkel        # this folder
git init
git add .
git commit -m "Hub landing page"
git branch -M main
git remote add origin https://github.com/<your-username>/klaargesukkel.git
git push -u origin main
```

(Create the empty repo on GitHub first — github.com/new — don't initialize it with a README
so the push above doesn't conflict.)

## 2. Import into Vercel

1. vercel.com → **Add New** → **Project** → import the `klaargesukkel` repo.
2. **Root Directory**: set to `apps/hub` (important — this repo will hold multiple apps).
3. Framework preset: Next.js (auto-detected). Leave build/output settings default.
4. Deploy. You'll get a `*.vercel.app` URL to confirm it's working before touching DNS.

## 3. Point klaargesukkel.com at Vercel

In the Vercel project → **Settings → Domains** → add `klaargesukkel.com` and `www.klaargesukkel.com`.
Vercel will show you the exact DNS records it needs — normally:

| Type  | Name | Value                  |
|-------|------|-------------------------|
| A     | @    | `76.76.21.21`           |
| CNAME | www  | `cname.vercel-dns.com`  |

In GoDaddy: **My Products → DNS** for klaargesukkel.com → edit/add those records to match
exactly what Vercel showed you (Vercel's values are authoritative if they differ from the
table above — they do change occasionally). DNS can take a few minutes to a few hours to
propagate.

## 4. Repeat for klaargesukkel.co.za

Same domain, same Vercel project — add `klaargesukkel.co.za` as an additional domain on the
**same** hub project (or redirect it to `.com`, your call), then add the matching A/CNAME
records under that domain's DNS in GoDaddy.

## 5. Adding the next product (e.g. a WhatsApp bot)

1. Add code under `apps/<name>` in the same repo, push.
2. Vercel → **Add New Project** → same repo again → **Root Directory**: `apps/<name>`.
3. **Settings → Domains** → add `<name>.klaargesukkel.com`.
4. GoDaddy DNS → add a CNAME: `<name>` → `cname.vercel-dns.com`.
5. Update the `products` array in `apps/hub/app/page.tsx` to link to it and flip its status.

## 5b. Deploying `apps/dinner` specifically

It's static HTML/CSS/JS with no build step, so the Vercel import differs slightly from the
hub:

1. Vercel → **Add New Project** → same repo → **Root Directory**: `apps/dinner`.
2. **Framework Preset**: `Other`. **Build Command**: none/empty. **Output Directory**: `./`.
3. Deploy, confirm the `*.vercel.app` URL works, then add `dinner.klaargesukkel.com` under
   **Settings → Domains** and the matching CNAME in GoDaddy (same pattern as step 3 above).

Heads up: this file uses `localStorage` for the freezer tracker, shopping checks, and batch
date — that data lives per-browser/per-device, it doesn't sync across devices or to a
database. Fine for personal use; worth knowing if this becomes a product other people use.

## 5c. Deploying `apps/ops`

Merged 2026-07-30 from what used to be three separate apps (`admin`, `eyespy`, `dashboard`) —
see ARCHITECTURE.md's Layer 4 section for why. One app, one login, three routes
(`/clients`, `/projects`, `/eyespy`), one Vercel project:

1. Vercel → **Add New Project** → same repo → **Root Directory**: `apps/ops`.
2. **Settings → Environment Variables** → add `ADMIN_USER`, `ADMIN_PASSWORD`, and
   `SESSION_SECRET`. `ADMIN_USER`/`ADMIN_PASSWORD` are the login credentials (can reuse the
   old admin/dashboard values). `SESSION_SECRET` is new — any long random string, it's what
   the session cookie is checked against, not something the user ever types. Without all
   three set, every route redirects to a login page that can never succeed — it fails closed,
   not open.
3. Deploy, confirm you're redirected to `/login` on the `*.vercel.app` URL, log in, confirm
   the nav bar and all three routes work, then add `ops.klaargesukkel.com` under
   **Settings → Domains** + matching GoDaddy CNAME.
4. Don't link to this subdomain from the public hub — it's meant to stay unlisted.

To add or update an idea: edit `apps/ops/data/ideas.json` and redeploy. To add or update a
client: edit `apps/ops/data/clients.json` and redeploy. No database yet for either.

When EyeSpy actually gets built (still spec-only, see EYESPY.md), it becomes a route under
this same app (`apps/ops/app/(app)/eyespy/`) rather than its own project — add its API keys
(Google/Bing Search, Google Places, Reddit) as more env vars on this same Vercel project, and
set up a **Vercel Cron** job on it for the scheduled data pull (check current plan limits on
minimum interval before assuming a cadence).

**Cleanup:** the old `klaargesukkel-admin` and `klaargesukkel-dashboard` Vercel projects are
superseded by this and should eventually be deleted (or at least have their
`admin.klaargesukkel.com` / `dashboard.klaargesukkel.com` domains removed, with the matching
GoDaddy CNAMEs cleaned up) — do this once `ops.klaargesukkel.com` is confirmed working,
Albert's call on timing.

## Cockpit (not part of this repo)

Cockpit is a separate client project you're still building in Claude Code — Next.js, Prisma,
Neon, Auth.js, already deployed on its own Vercel project at `cockpit-omega-blush.vercel.app`.
It's intentionally **not** part of this monorepo: different repo, different owner workflow
(Claude Code, not this Cowork session), and moving a live client app risks disrupting both.
The hub just links out to it as a portfolio piece. If you ever want it properly under
`cockpit.klaargesukkel.com`, that's a domain swap in its own Vercel project whenever you're
ready — no code migration needed.

## Notes

- Every product gets its **own** Vercel project even though they share a repo — that's what
  makes a bug in one app harmless to the others sitting on other subdomains.
- Services that aren't a Next.js frontend (e.g. a WhatsApp bot backend using the WhatsApp
  Business API, which needs a persistent webhook) may fit better on Railway or a small VPS
  instead of Vercel's serverless model — flag it when we build that one and we'll pick the
  right host for it specifically.
- I couldn't run `npm install`/`npm run build` from this session (no package registry access
  in this sandbox), so do a first local build once you've pulled the repo:
  `cd apps/hub && npm install && npm run build`. Vercel will also build it fresh on deploy,
  which is the real test.
