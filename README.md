# SmarThinkerz Marketing Suite — AI-Powered Marketing Platform

A production-grade, self-hostable, all-in-one marketing platform built on
**Next.js (App Router) + Supabase**. It bundles ten AI marketing tools, a
tier-based subscription model, a subscriber dashboard, an admin CMS with a live
homepage editor, admin analytics with exports, and brand-neutral hosted billing
via an external Payment Hub. No Firebase anywhere — authentication, database,
storage, and row-level security all run on Supabase.

---

## Table of contents

1. [Highlights](#highlights)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project structure](#project-structure)
5. [Local development](#local-development)
6. [Environment variables](#environment-variables)
7. [Setup mode vs. production](#setup-mode-vs-production)
8. [Subscription tiers](#subscription-tiers)
9. [Scripts](#scripts)
10. [Further documentation](#further-documentation)

---

## Highlights

- **10 AI marketing tools** — Campaigns, Content Creator, SEO, Social Media,
  Email Marketing, AI Chatbot, Media Generator, E-commerce, Ad Manager, and
  Analytics. Text tools use OpenAI chat models; the Media Generator uses an
  image model.
- **Role-based access control** — `subscriber` and `admin` roles, enforced by
  Next.js middleware, server-side layout guards, and Supabase row-level
  security (defense in depth).
- **Four subscription tiers** — Basic, Pro, Business, Enterprise, each unlocking
  a defined set of tools with monthly campaign and AI-generation quotas.
- **Effective-tier enforcement** — lapsed or canceled subscriptions are
  automatically downgraded after a grace window; access is computed from a
  single `effectiveTier`, so gating is consistent across UI and server actions.
- **Admin CMS** — a live homepage editor (hero, features, pricing, testimonials,
  final CTA, footer) with a real-time preview, publish, version history with
  restore, and reset-to-default.
- **Admin analytics + exports** — KPIs, signup/revenue trends, revenue by plan,
  status breakdown, plus one-click CSV/Excel export. User management supports
  search, filter, and role/plan editing.
- **Brand-neutral hosted billing** — an external Payment Hub renders checkout
  and posts a signed webhook back; this app never touches card data.
- **Transactional email** — receipts, grace-period notices, and cancellation
  emails via Resend, with branded HTML templates.
- **Production hardening** — security headers, per-user/IP rate limiting, input
  escaping, graceful loading/empty/error states, and full light/dark theming.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router, Server Actions, Route Handlers) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, light/dark theme tokens |
| Auth / DB / Storage | Supabase (Postgres + RLS + Auth) |
| AI | OpenAI (chat + image models) |
| Email | Resend |
| Charts | Recharts |
| Icons | lucide-react |
| Validation | Zod |

---

## Architecture

The app is a single Next.js deployment with three route groups:

- **Public marketing site** (`/`, `/pricing`, `/demo`, `/about`, `/contact`,
  `/legal/*`) — statically rendered, content driven by the CMS with a safe
  default fallback when the database is empty or unconfigured.
- **Subscriber app** (`/dashboard/*`) — server-rendered on demand, resolves the
  current user (role + effective tier), and gates every tool both in the UI and
  in the server actions.
- **Admin panel** (`/admin/*`) — server-rendered on demand, hard-guarded to the
  `admin` role at the layout level, with all writes additionally protected by
  Supabase RLS (`is_admin()`).

Billing is **out-of-band**: the app builds hosted-checkout links to an external
Payment Hub and exposes a single signed webhook at
`/api/webhooks/payment-hub` that verifies an HMAC-SHA256 signature over the raw
body, is idempotent on `event_id`, and applies plan activation, grace, or
revocation. See [`docs/PAYMENT_HUB.md`](docs/PAYMENT_HUB.md).

---

## Project structure

```
src/
  app/
    (public)              # homepage, pricing, demo, about, contact, legal
    auth/                 # sign-in, sign-up, callback, server actions
    dashboard/            # subscriber app + the 10 tools (page + actions + client)
    admin/                # overview, cms, analytics, users
    api/webhooks/payment-hub  # signed billing webhook (Node runtime)
  components/
    brand/                # config-driven Logo wordmark
    marketing/            # header, footer, homepage sections, pricing cards
    dashboard/            # shell, sidebar, page header, tool form, tool gate
    admin/                # admin shell
    ui/                   # Button, Card, Badge, Input, Modal, states, theme toggle
  lib/
    config.ts             # central runtime config + isConfigured flags
    plans.ts              # tier matrix, slugs, tool unlocks, quotas
    tools.ts              # tool registry metadata
    auth.ts / session.ts  # session resolution + effectiveTier enforcement
    usage.ts              # tier gating + usage metering for AI actions
    tool-runner.ts        # shared AI action wrapper (gate + rate limit + record)
    rate-limit.ts         # in-memory sliding-window limiter
    ai.ts                 # OpenAI client + generation helpers
    billing.ts            # hosted-checkout link builder
    payment-hub.ts        # webhook verification + idempotent provisioning
    email.ts              # Resend helper + branded templates
    cms.ts / cms-default.ts  # CMS loader + safe default content
    export.ts             # CSV/Excel export utilities
    supabase/             # browser, server, admin, middleware clients
supabase/
  schema.sql              # full schema: tables, RLS policies, triggers, seed
env.production.template   # canonical env template (copy to .env.local)
docs/
  DEPLOYMENT.md           # Supabase + hosting setup guide
  PAYMENT_HUB.md          # billing integration handoff
```

---

## Local development

```bash
# 1. Install dependencies
pnpm install

# 2. Create your local env file from the template
cp env.production.template .env.local
#    (fill in values as you wire each service; the app runs without them)

# 3. Start the dev server
pnpm dev
# -> http://localhost:3000
```

The app boots immediately in **setup mode** even with no keys, so you can click
through every screen with realistic demo data before connecting services.

---

## Environment variables

All variables and inline explanations live in
[`env.production.template`](env.production.template). Copy it to `.env.local`
and fill in values. Summary:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_APP_NAME` | optional | Product name in UI/emails (defaults to `SmarThinkerz Marketing Suite`) |
| `NEXT_PUBLIC_APP_URL` | recommended | Public base URL for emails/redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only key used by the webhook |
| `OPENAI_API_KEY` | for AI | Powers the AI tools |
| `OPENAI_MODEL` | optional | Chat model (default `gpt-4o`) |
| `OPENAI_IMAGE_MODEL` | optional | Image model (default `dall-e-3`) |
| `PAYMENT_HUB_WEBHOOK_SECRET` | for billing | Shared HMAC secret for webhook verification |
| `PAYMENT_HUB_PRODUCT_KEY` | optional | Product identifier sent to the hub |
| `NEXT_PUBLIC_PAYMENT_HUB_CHECKOUT_URL` | for billing | Hosted checkout base URL |
| `NEXT_PUBLIC_PAYMENT_HUB_RETURN_URL` | optional | Post-payment return URL |
| `RESEND_API_KEY` | for email | Transactional email |
| `RESEND_FROM_EMAIL` | for email | Verified sender address |

> Note: the older `.env.example` in the repo is **stale** (pre-rebrand variable
> names). Use `env.production.template` as the source of truth.

---

## Setup mode vs. production

Each integration reports an `isConfigured` flag (see `src/lib/config.ts`). When
a service is unconfigured:

- **Supabase** — auth uses a demo session and data layers return representative
  demo data; clear setup notices are shown.
- **OpenAI** — AI tools return a friendly "configure AI" notice instead of
  fabricated output.
- **Payment Hub** — checkout buttons render a "billing not configured" state;
  the webhook returns `503`.
- **Resend** — email sends are safely skipped and logged.

`isProductionReady` is `true` only when Supabase, OpenAI, Payment Hub, and
Resend are all configured.

---

## Subscription tiers

| Tier | Monthly | Yearly | Campaign cap | AI cap / mo | Tools unlocked |
|------|---------|--------|--------------|-------------|----------------|
| Basic | $29 | $290 | 5 | 100 | Campaigns, Content, SEO, Social, Email, Analytics |
| Pro | $79 | $790 | Unlimited | 1,000 | + AI Chatbot |
| Business | $149 | $1,490 | Unlimited | 5,000 | + Media, E-commerce, Ad Manager (all 10) |
| Enterprise | $299 | $2,990 | Unlimited | Unlimited | All 10 + white-label, API, multi-user |

Plan slugs used for hosted checkout: `smarthinkerz-basic`, `smarthinkerz-pro`,
`smarthinkerz-business`, `smarthinkerz-enterprise`.

---

## Scripts

```bash
pnpm dev      # start the dev server
pnpm build    # production build (run with NODE_ENV=production)
pnpm start    # serve the production build
pnpm lint     # run ESLint
npx tsc --noEmit   # typecheck
```

> When building, ensure `NODE_ENV=production` is set so the build does not
> inherit a development environment value:
> `env NODE_ENV=production pnpm build`

---

## Further documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Supabase project setup, schema
  migration, environment configuration, and hosting.
- [`docs/PAYMENT_HUB.md`](docs/PAYMENT_HUB.md) — Payment Hub integration:
  checkout links, plan slugs, webhook events, and signature verification.
- [`design.md`](design.md) — product design and architecture rationale.
