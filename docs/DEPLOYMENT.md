# Deployment & Self-Hosting Guide — SmarThinkerz Marketing Suite

This guide takes you from a fresh clone to a live, production deployment on
**Next.js + Supabase**. Estimated time: 30–45 minutes.

> The application is designed so you can deploy first and wire services
> incrementally. Until each key is present, the corresponding feature runs in a
> clearly-labeled setup mode rather than breaking.

---

## 1. Prerequisites

- Node.js 20+ and pnpm 9+
- A [Supabase](https://supabase.com) account (free tier is fine to start)
- An [OpenAI](https://platform.openai.com) API key (for the AI tools)
- A [Resend](https://resend.com) account + verified sending domain (for email)
- Access to your external **Payment Hub** to register a product and webhook
- A host that runs a Node server (Vercel, Render, Fly.io, Railway, a VM, etc.)

---

## 2. Create the Supabase project

1. In the Supabase dashboard, create a new project and choose a strong database
   password. Wait for provisioning to finish.
2. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it
     bypasses RLS and is used only by the billing webhook on the server)

---

## 3. Apply the database schema

The full schema — tables, row-level security policies, triggers, and seed — is
in [`supabase/schema.sql`](../supabase/schema.sql).

1. In the Supabase dashboard open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and run it.
3. Confirm the tables were created under **Table Editor**: `profiles`,
   `subscriptions`, `invoices`, `usage_events`, `campaigns`, `cms_content`,
   `cms_versions`, `analytics_events`, and `processed_events`.

### What the schema sets up

- **`profiles`** — one row per auth user, including `role` (`subscriber` /
  `admin`). A trigger auto-creates a profile on signup.
- **`subscriptions`** — current tier, status (`active` / `past_due` /
  `canceled`), billing cycle, period end, and grace window.
- **Row-level security** — users can read/write only their own rows; an
  `is_admin()` helper unlocks admin-wide access. RLS is enabled on every table.
- **`processed_events`** — idempotency ledger for billing webhooks.

### Promote your first admin

After you sign up through the app once, promote that account:

```sql
update profiles set role = 'admin' where email = 'you@example.com';
```

---

## 4. Configure environment variables

Copy the template and fill it in:

```bash
cp env.production.template .env.local
```

See the table in the [README](../README.md#environment-variables) for the full
list. At minimum, set the three Supabase values to leave setup mode for auth and
data. Add OpenAI, Payment Hub, and Resend keys as you enable those features.

On your host, set the same variables as project/environment secrets. Remember
that `NEXT_PUBLIC_*` values are exposed to the browser by design; everything
else stays server-side.

---

## 5. Configure email (Resend)

1. Create a Resend API key → `RESEND_API_KEY`.
2. Verify your sending domain in Resend and set a matching
   `RESEND_FROM_EMAIL`, e.g. `SmarThinkerz Marketing Suite <noreply@yourdomain.com>`.
3. Until configured, email sends are safely skipped (logged, never thrown).

---

## 6. Configure billing (Payment Hub)

Billing is handled by an external hosted Payment Hub. Follow the dedicated
handoff in [`docs/PAYMENT_HUB.md`](PAYMENT_HUB.md). In short:

1. Register the four plans in your hub using the slugs `smarthinkerz-basic`,
   `smarthinkerz-pro`, `smarthinkerz-business`, `smarthinkerz-enterprise`.
2. Set the hub's webhook URL to
   `https://YOUR-DOMAIN/api/webhooks/payment-hub`.
3. Share one HMAC secret between the hub and this app via
   `PAYMENT_HUB_WEBHOOK_SECRET`.
4. Set `NEXT_PUBLIC_PAYMENT_HUB_CHECKOUT_URL` to the hub's hosted checkout page.

---

## 7. Build and run

```bash
pnpm install
env NODE_ENV=production pnpm build
pnpm start            # serves on PORT (default 3000)
```

> Always build with `NODE_ENV=production` set explicitly so the build does not
> inherit a development value from the shell.

### Deploying to a managed host

- **Vercel** — import the repo, add the environment variables, and deploy. The
  webhook route is already pinned to the Node runtime.
- **Render / Railway / Fly.io** — use build command
  `pnpm install && pnpm build` and start command `pnpm start`. Expose the
  assigned `PORT`.
- **Your own VM / container** — run `pnpm start` behind a reverse proxy
  (nginx/Caddy) terminating TLS. Ensure the webhook path is publicly reachable.

---

## 8. Post-deploy verification

Work through this checklist against the live URL:

- [ ] Homepage loads; theme toggle works; navigation is consistent.
- [ ] Sign up creates a profile row in Supabase; sign in works.
- [ ] Promote yourself to admin; `/admin` is reachable and non-admins are
      redirected away from it.
- [ ] In **Admin → CMS**, edit the homepage, publish, confirm the change on
      `/`, then restore a previous version.
- [ ] Run an AI tool (e.g., Content Creator) and confirm real output once
      `OPENAI_API_KEY` is set; usage increments on the dashboard.
- [ ] Tier gating: a Basic user sees locked tools with an upgrade prompt.
- [ ] Billing webhook health: `GET /api/webhooks/payment-hub` returns
      `{ ok: true, configured: true }` once secrets are set.
- [ ] Send a signed test event and confirm the subscription activates and a
      receipt email is sent (see PAYMENT_HUB.md).

---

## 9. Operational notes

- **Rate limiting** — `src/lib/rate-limit.ts` is an in-memory sliding-window
  limiter (per-user for AI, per-IP for the contact form). It protects a single
  instance. For multi-instance/serverless deployments, back it with a shared
  store (Redis/Upstash/Supabase) — the file documents the swap point.
- **Secrets hygiene** — never expose `SUPABASE_SERVICE_ROLE_KEY` or
  `PAYMENT_HUB_WEBHOOK_SECRET` to the client. Rotate them if leaked.
- **Backups** — enable Supabase point-in-time recovery for production data.
- **Security headers** — baseline headers are configured in `next.config.ts`;
  review and tighten the CSP for your domains before launch.
