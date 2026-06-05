# SmarThinkerz Marketing Suite — Build Checklist

## Foundation
- [x] Next.js (App Router) + TypeScript + Tailwind v4 scaffold
- [x] Design tokens + global theme (light/dark) with no-flash script
- [x] Env config loader with mock-safe `isConfigured` fallbacks
- [x] Canonical env template (env.production.template)
- [x] Supabase client utils (browser, server, admin, middleware)
- [x] SQL schema + RLS migration file (supabase/schema.sql)
- [x] Shared types, tier matrix, tools registry, constants
- [x] UI primitives (Button, Card, Badge, Input, Modal, states, theme toggle)
- [x] Config-driven brand Logo + generated app logo/favicon

## Auth & RBAC
- [x] Sign-in / sign-up / callback pages + server actions
- [x] Middleware route protection (subscriber/admin gates)
- [x] Admin-only enforcement at layout + RLS is_admin()
- [x] Profile bootstrap on signup (DB trigger)
- [x] effectiveTier enforcement (grace/expiry downgrade)

## Public site (CMS-driven)
- [x] Marketing header + footer (consistent across pages)
- [x] Homepage: hero, stats, features, pricing, testimonials, final CTA
- [x] Pricing page with FAQ
- [x] Demo page
- [x] About, Contact (working form + Resend), Privacy, Terms

## Subscriber app
- [x] Dashboard shell (sidebar, top bar, user menu, plan/usage badge)
- [x] Dashboard overview (KPIs, usage, quick tools)
- [x] Tier-gate upsell component + sidebar lock states
- [x] Settings (profile, appearance, security)

## 10 AI marketing tools
- [x] Content Creator (GPT)
- [x] SEO Tools (keywords + meta)
- [x] Social Media (captions/hashtags)
- [x] Email Marketing (subject lines + copy)
- [x] AI Chatbot (persona + live chat preview)
- [x] Media Generator (AI images)
- [x] E-commerce (listing optimizer)
- [x] Ad Manager (ad variants)
- [x] Campaigns (CRUD + KPIs + limit enforcement)
- [x] Analytics (charts dashboard + export)
- [x] Generation usage metering + persistence

## Billing & account
- [x] Billing page (plan summary, usage meter, monthly/yearly switch, invoices)
- [x] Hosted-checkout link builder (Payment Hub)
- [x] Grace period + enforcement (downgrade/lockout)

## Admin panel
- [x] Admin overview (KPIs, revenue by plan, recent users, quick links)
- [x] CMS front-page editor (live preview, publish, version history, reset)
- [x] Admin analytics (charts) + CSV/Excel export
- [x] User management (search/filter, role + plan editing, export)

## Payment hub integration
- [x] Generic, env-driven Payment Hub (no brand baked in)
- [x] Signed webhook: HMAC-SHA256, constant-time verify, raw body
- [x] Idempotency on event_id (processed_events)
- [x] Activate / grace / revoke + invoice + analytics events
- [x] Health probe (GET)
- [x] Handoff doc (webhook URL + plan list) for hub owner

## Email (Resend)
- [x] Resend helper with graceful no-op when unconfigured
- [x] Branded templates: receipt, grace period, cancellation, contact

## Hardening & docs
- [x] Security headers (next.config.ts)
- [x] Rate limiting (per-user AI, per-IP contact)
- [x] Input escaping on contact submission
- [x] Loading / empty / error states across screens
- [x] TypeScript passes clean (tsc --noEmit)
- [x] Production build passes (NODE_ENV=production)
- [x] Branding consistent (SmarThinkerz Marketing Suite); excluded-brand references removed
- [x] README, DEPLOYMENT guide, PAYMENT_HUB handoff, design.md

## Known operational notes (documented)
- [ ] Swap in shared-store rate limiter (Redis/Upstash) for multi-instance scale
- [ ] Tighten CSP for production domains before launch
- [ ] Replace stale .env.example (protected file) — use env.production.template
