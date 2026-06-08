-- =============================================================================
-- Migration 0004: Tap Payments Integration
-- Extends the subscriptions table with Tap-specific fields and adds a
-- tap_pending_charges table for webhook idempotency.
-- Safe to re-run (idempotent).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend subscriptions table with Tap fields
-- ---------------------------------------------------------------------------

-- Tap charge reference (e.g. chg_xxxxxxxxxxxxxxxx)
alter table public.subscriptions
  add column if not exists tap_pay_ref text,
  -- planKey e.g. "smarthinkerz-pro-monthly"
  add column if not exists plan_key text,
  -- Total number of installment payments (1 = pay in full)
  add column if not exists installment_count integer not null default 1,
  -- Number of installments successfully captured so far
  add column if not exists installments_paid integer not null default 0,
  -- Per-installment amount in AED (fils stored as decimal)
  add column if not exists installment_amount numeric(12,2),
  -- 10% of each payment allocated to Sophia AI token budget
  add column if not exists ai_token_budget numeric(12,2) not null default 0,
  -- Total amount paid in AED
  add column if not exists total_amount_aed numeric(12,2),
  -- Current period start (set on first CAPTURED event)
  add column if not exists current_period_start timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Extend invoices table to carry Tap-specific data
-- ---------------------------------------------------------------------------

alter table public.invoices
  add column if not exists tap_charge_id text,
  add column if not exists installment_number integer,
  add column if not exists currency_override text; -- 'AED' for Tap charges

-- Migrate existing hub_charge_id data into tap_charge_id where it looks like
-- a Tap charge (starts with 'chg_')
update public.invoices
  set tap_charge_id = hub_charge_id
  where hub_charge_id like 'chg_%'
    and tap_charge_id is null;

-- ---------------------------------------------------------------------------
-- 3. tap_pending_charges — tracks charges created but not yet confirmed
-- ---------------------------------------------------------------------------
-- Used to correlate the webhook CAPTURED event back to the user/plan.
-- The webhook only carries metadata.userId, so we need this lookup table.

create table if not exists public.tap_pending_charges (
  id uuid primary key default gen_random_uuid(),
  tap_charge_id text unique not null,        -- Tap charge ID returned from POST /v2/charges
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null,                    -- e.g. "smarthinkerz-pro-monthly"
  tier text not null,                        -- internal tier: basic|pro|business|enterprise
  cycle text not null default 'monthly',     -- monthly | yearly
  total_amount_aed numeric(12,2) not null,
  installment_count integer not null default 1,
  installment_amount numeric(12,2),
  status text not null default 'pending',    -- pending | captured | failed | refunded
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tap_pending_charges_user_idx
  on public.tap_pending_charges(user_id, created_at desc);

create index if not exists tap_pending_charges_status_idx
  on public.tap_pending_charges(status, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. RLS for tap_pending_charges
-- ---------------------------------------------------------------------------

alter table public.tap_pending_charges enable row level security;

-- Users can read their own pending charges (for status polling)
create policy if not exists "tap_pending_charges: owner read"
  on public.tap_pending_charges
  for select
  using (auth.uid() = user_id);

-- Only service role can insert/update (done server-side, never from client)
create policy if not exists "tap_pending_charges: service insert"
  on public.tap_pending_charges
  for insert
  with check (true);

create policy if not exists "tap_pending_charges: service update"
  on public.tap_pending_charges
  for update
  using (true);

-- ---------------------------------------------------------------------------
-- 5. processed_tap_events — webhook idempotency guard
-- ---------------------------------------------------------------------------
-- Prevents double-processing if Tap retries the same webhook event.

create table if not exists public.processed_tap_events (
  event_id text primary key,               -- Tap charge ID used as idempotency key
  event_type text not null,                -- CAPTURED | FAILED | REFUNDED etc.
  processed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Helper: update updated_at on tap_pending_charges
-- ---------------------------------------------------------------------------

create or replace function public.set_tap_pending_charges_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tap_pending_charges_updated_at
  on public.tap_pending_charges;

create trigger tap_pending_charges_updated_at
  before update on public.tap_pending_charges
  for each row execute function public.set_tap_pending_charges_updated_at();
