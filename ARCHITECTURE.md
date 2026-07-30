# Klaargesukkel — Architecture

How this grows from "a landing page with some cards on it" into an actual business. Three
layers, each with a different job and a different reason for existing.

## Layer 1 — The Hub (`apps/hub`, this repo)

`klaargesukkel.com`. Marketing, portfolio, single front door. Lists what's been built,
whether it's yours to try (owned products) or a client's (portfolio links). Not where any
real product logic lives.

## Layer 2 — Owned products (`apps/*` in this repo)

Things Klaargesukkel itself owns and gives away or sells directly — no client, no
white-labeling. Dinner System is the first one. Each gets its own `apps/<name>` folder, its
own Vercel project, its own `<name>.klaargesukkel.com` subdomain. This is the pattern already
in DEPLOYMENT.md and doesn't change.

## Layer 3 — Client-delivered engines (separate repos, NOT in this monorepo)

This is the part that makes it a business rather than a portfolio: WhatsApp bots, Cockpit,
and anything future where a *client* uses the product under *their* name, not yours.

**Decision: multi-tenant, not one-deployment-per-client.** You build the engine once —
one codebase, one running app, one database — and every client is a row of config inside it
(their branding, their domain, their WhatsApp number, their data). Cockpit already works this
way: a new leader "signs up" into a shared platform rather than getting their own copy of the
codebase. This is the only version of this business that scales past 2-3 clients without you
personally maintaining N forked codebases.

**Decision: each engine is its own repo**, built and iterated on in Claude Code (matches how
Cockpit already works), not folded into the klaargesukkel monorepo. The hub only ever links
out to these — a portfolio card, nothing more. Reasons: they deploy on their own schedule,
they may eventually need their own CI/secrets/team access separate from the marketing site,
and mixing "client product IP" with "marketing site source" is just messy.

### How white-labeling actually works, technically

**Custom domains.** Vercel lets you attach any number of domains to one project. The app
itself resolves *which tenant* is being served by reading the incoming request's hostname
(Next.js middleware, `request.headers.get('host')`), then loads that tenant's branding/config
from the database. A client's own domain (`plans.theirclient.com`) points at Cockpit's Vercel
project via a CNAME they add on their end — same running app, different look, different data,
because the app looked up the hostname and served that tenant's world. This is standard SaaS
multi-tenancy (Vercel's own docs call it "platforms" — worth reading if/when you build this
into Cockpit).

**WhatsApp bots specifically.** WhatsApp doesn't work like a website — there's no "domain" to
white-label, there's a *phone number*. The multi-tenant version: one backend, registered with
Meta's WhatsApp Business Platform, handling webhooks for *multiple* phone numbers (one per
client, or per client-of-a-client). Meta's webhook payload includes a `phone_number_id` —
that's your tenant key, exactly like hostname is for a web app. Route the incoming message to
the right client's config/prompt/knowledge base based on that ID. Clients can either operate
under a number you provision on their behalf (simplest for them), or connect their own WhatsApp
Business number to your backend (more setup, more "theirs," some clients will want this for
trust reasons).

**Groups, specifically (checked 2026-07-29):** Meta added native Groups support to the Cloud
API in February 2026, but it's capped at 8 participants per group and only works for groups
the business creates/manages itself via the API — it does not let a bot join or operate
inside an existing large community WhatsApp group (a typical club/org group is well past 8
members). If a future client wants the bot inside their existing large group, the official
API can't do it; that would mean an unofficial WhatsApp Web automation approach instead,
which violates WhatsApp's terms and risks the number being banned — treat that as a real
build-vs-risk decision to make explicitly with the client, not a default.

**The pattern is the same both times:** one engine, a lookup key from the incoming
request (hostname or phone_number_id), tenant config pulled from a database, everything else
downstream of that lookup is client-specific. Build this lookup layer once per engine and
every future client is a database row, not a deployment.

**Klaarkantoor (added 2026-07-29):** a co-working/flexible-space booking and management
platform — listing, dynamic pricing, bookings, payments, insurance/compliance, ops admin,
delivered to a space-operator business the same way Cockpit is delivered to an executive
onboarding client (single tenant per operator, hostname-resolved, not a cross-operator public
marketplace — that assumption needs confirming with Albert before payments get built). Own
repo, own Claude Code session, same as Cockpit/Sukkel Bot. Full spec, feature set, MVP
staging, and the South African payment-gateway reasoning (Stripe doesn't support SA
merchants) in that repo's own CLAUDE.md — ask Albert for the path/repo location if it's not
open in this session.

## Layer 4 — Operations & Intelligence (`apps/admin`, `apps/eyespy`, `apps/dashboard`, this repo)

`admin.klaargesukkel.com`, private, basic-auth protected, not linked from the public hub. A
running list of who your clients are, what they're on (which engine, which domain/number),
and what state they're in (prospect / active / paused). Starts as a JSON file you hand-edit
and redeploy — genuinely enough for the first handful of clients. Graduates to a real database
+ form the moment editing a JSON file and redeploying feels slower than the problem deserves
(a good sign to watch for, not something to pre-solve now).

`eyespy.klaargesukkel.com` (added 2026-07-29), same private/basic-auth pattern. Not a client
tool — it's the ideation engine behind the ideation engine: a scheduled job that reads
compliant sources (official APIs, RSS, open data — deliberately not direct scraping of
platforms whose ToS prohibits it) for a given area, and produces a ranked digest of what
people there are struggling with or looking for. Full spec, data sources, and the reasoning
behind "compliant sources only" in EYESPY.md.

`dashboard.klaargesukkel.com` (added 2026-07-29), same pattern again. The project-control
view across everything in this section and Layer 2/3 combined — every owned product, client
engine, and internal tool, tracked by status (Idea → Spec written → In development → Built →
Live) in one place, so nothing gets lost between conversations. Hand-edited JSON for now,
same restraint as `apps/admin` and `apps/eyespy`.

## Summary of what lives where

| What | Repo | Deploy | Domain |
|---|---|---|---|
| Marketing/portfolio | this repo, `apps/hub` | Vercel | klaargesukkel.com |
| Owned free/paid tools | this repo, `apps/<name>` | Vercel (own project) | `<name>.klaargesukkel.com` |
| Internal ops tracker | this repo, `apps/admin` | Vercel (own project) | admin.klaargesukkel.com |
| Internal demand-signal research | this repo, `apps/eyespy` | Vercel (own project + Cron) | eyespy.klaargesukkel.com |
| Idea/project tracker | this repo, `apps/dashboard` | Vercel (own project) | dashboard.klaargesukkel.com |
| WhatsApp bot engine | separate repo | Vercel or a host with persistent webhooks | N/A — phone numbers, not domains |
| Cockpit (and future client platforms) | separate repo (already exists for Cockpit) | its own Vercel project | its own domain, or client's own domain via CNAME |

## What this deliberately doesn't solve yet

No shared auth/SSO across products — each engine handles its own login. No shared billing —
you're not charging anyone yet. No CI/CD beyond Vercel's own git-push-to-deploy. These are
real problems eventually, not now — solving them before there's a paying client to justify
them is effort spent on the wrong thing.
