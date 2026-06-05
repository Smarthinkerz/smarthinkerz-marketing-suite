# Marketing Suite — Web App Design & Architecture

## 1. Product
A production-grade, self-hostable, AI-powered all-in-one marketing platform delivered as a responsive web app. It unifies 10 marketing tools, subscriber dashboards, billing, an admin CMS front-page editor, and analytics into one premium interface.

## 2. Stack (per user constraint — no Firebase)
- **Framework:** Next.js 16 (App Router, Server Components, Server Actions), TypeScript, React 19.
- **Styling:** Tailwind CSS v4, custom design tokens, dark mode via `class`.
- **Auth + DB + Storage + RBAC:** Supabase (Postgres, Auth, Row Level Security, Storage buckets for CMS media).
- **AI:** OpenAI (GPT) for content/SEO/social/email/e-commerce/ad/chatbot generation; image generation for Media Generator.
- **Billing:** Tap Payments (4 tiers) via hosted charges + webhook (HMAC verified).
- **Email:** Resend (transactional: welcome, receipts, grace-period, churn).
- **Charts:** Recharts. **Icons:** lucide-react.

## 3. Roles & RBAC
- `visitor` — public marketing pages, pricing, auth.
- `subscriber` — tier-aware tools + dashboard (Basic/Pro/Business/Enterprise).
- `admin` — everything + CMS editor, admin analytics, user management.
Enforced in three layers: Next.js middleware (route protection), server actions (role/tier checks), and Supabase RLS (row-level data protection).

## 4. Color System
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #6D28D9 | #8B5CF6 | Brand, primary actions |
| accent | #06B6D4 | #22D3EE | Highlights, gradients, charts |
| background | #FFFFFF | #0B1020 | Page background |
| surface | #F7F7FB | #151B2E | Cards |
| surface2 | #EFEFF6 | #1E2740 | Inputs, nested cards |
| foreground | #0F1222 | #F4F5FB | Primary text |
| muted | #6B7280 | #9AA3B2 | Secondary text |
| border | #E6E6EF | #283353 | Dividers |
| success | #16A34A | #4ADE80 | Positive |
| warning | #D97706 | #FBBF24 | Grace/alert |
| error | #DC2626 | #F87171 | Failure/churn |
Hero/CTA use `primary → accent` gradient. Rounded 16–24px cards, pill buttons, soft shadows.

## 5. Route Map (App Router)
```
/                      Public homepage (CMS-driven: hero, features, pricing, testimonials, CTA, footer)
/pricing               Full pricing page
/demo                  Product demo / feature tour
/legal/privacy         Privacy Policy (CMS footer link)
/legal/terms           Terms (CMS footer link)
/about , /contact      CMS footer links
/auth/sign-in          Sign in
/auth/sign-up          Sign up (+ optional plan preselect)
/dashboard             Subscriber home (KPIs, quick actions, activity, plan/usage)
/dashboard/campaigns   Campaigns tool
/dashboard/content     Content Creator
/dashboard/seo         SEO Tools
/dashboard/social      Social Media
/dashboard/email       Email Marketing
/dashboard/chatbot     AI Chatbot
/dashboard/media       Media Generator
/dashboard/ecommerce   E-commerce Tools
/dashboard/ads         Ad Manager
/dashboard/analytics   Unified Analytics
/dashboard/billing     Plan, usage, invoices, upgrade/downgrade
/dashboard/settings    Profile, appearance, security
/admin                 Admin home (platform KPIs)
/admin/cms             CMS front-page editor (live preview, sections, version history/rollback)
/admin/analytics       Subscriber growth, revenue, churn, CSV/Excel export
/admin/users           User management (tier, status, role)
/api/ai/*              AI generation endpoints
/api/tap/webhook       Tap Payments webhook (HMAC)
/api/health            Health check
```

## 6. Tier Matrix
| Feature | Basic $29 | Pro $79 | Business $149 | Enterprise $299 |
|---|---|---|---|---|
| Campaigns | 5/mo | Unlimited | Unlimited | Unlimited |
| Content Creator | Basic | Advanced | Advanced | Advanced |
| SEO Tools | Keyword | Full suite | Full suite | Full suite |
| Social Media | Captions | Automation | Automation | Automation |
| Email Marketing | Basic | AI copy | AI copy | AI copy |
| AI Chatbot | — | Basic | Advanced | Advanced |
| Media Generator | — | — | Yes | Yes |
| E-commerce | — | — | Yes | Yes |
| Ad Manager | — | — | Yes | Yes |
| Analytics | Limited | Full | Full | Advanced |
| White-label / Team / API / Manager | — | — | — | Yes |

## 7. Database (Supabase Postgres)
- `profiles` (id→auth.users, full_name, role, created_at)
- `subscriptions` (user_id, tier, status [active/past_due/canceled], current_period_end, grace_until, tap_customer_id, tap_subscription_id)
- `campaigns` (user_id, name, channels[], status, budget, spend, impressions, clicks, conversions, created_at)
- `ai_generations` (user_id, tool, prompt, result jsonb, created_at) — history + usage metering
- `usage_counters` (user_id, period, tool, count)
- `cms_content` (id, singleton 'homepage', data jsonb, updated_by, updated_at)
- `cms_versions` (id, content_id, data jsonb, label, created_by, created_at) — version history/rollback
- `analytics_events` (user_id, type [signup/upgrade/downgrade/churn/payment], meta jsonb, created_at)
- `invoices` (user_id, amount, currency, status, tap_charge_id, created_at)
RLS: users read/write only their own rows; admins bypass via role check; CMS readable by anon, writable by admins only.

## 8. CMS Content Model (homepage jsonb)
hero{eyebrow,headline,subheadline,ctaPrimary,ctaSecondary,bgImageUrl}; features{title,subtitle,items[{icon,title,desc}]}; pricing{title,subtitle,tiers[]}; testimonials{title,subtitle,items[{quote,author,role}]}; finalCta{headline,subheadline,button}; footer{links[],copyright}. Editor provides field-level editing + live preview iframe + image upload to Supabase Storage + save (writes version).

## 9. Quality Bar (market-ready, not MVP)
Complete flows, loading/empty/error states, tier enforcement everywhere, persistence, security headers + rate limiting + HTTPS enforcement, accessible contrast and focus states, responsive from 360px to desktop, graceful behavior when external keys are absent (mock-safe dev mode clearly flagged, never fake data in production paths).
