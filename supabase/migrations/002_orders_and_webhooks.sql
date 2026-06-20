-- =============================================================================
-- Migration 002: Orders table + webhook event tables
-- Run this in Supabase SQL Editor after FULL_SCHEMA_RUN_THIS.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- orders — every checkout attempt, regardless of outcome
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete set null,
  tap_charge_id         text unique,
  plan                  text not null,                    -- canonical track slug
  plan_name             text not null,
  product               text not null default 'SmarThinkerz Academy',
  amount                numeric(10,2) not null,
  currency              text not null default 'USD',
  status                text not null default 'initiated', -- initiated | paid | failed | cancelled | refunded | partially_refunded | refunding
  tap_status            text,                              -- raw Tap status for debugging
  customer_first_name   text,
  customer_last_name    text,
  customer_email        text,
  customer_phone        text,
  transaction_ref       text,
  order_ref             text,
  paid_at               timestamptz,
  failure_message       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists orders_user_idx        on public.orders(user_id);
create index if not exists orders_tap_charge_idx  on public.orders(tap_charge_id);
create index if not exists orders_status_idx      on public.orders(status);
create index if not exists orders_created_idx     on public.orders(created_at desc);

-- ---------------------------------------------------------------------------
-- processed_webhook_events — idempotency guard
-- event_key = "<chargeId>:<rawStatus>"
-- ---------------------------------------------------------------------------
create table if not exists public.processed_webhook_events (
  event_key   text primary key,
  charge_id   text not null,
  status      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists processed_webhook_events_charge_idx on public.processed_webhook_events(charge_id);

-- ---------------------------------------------------------------------------
-- webhook_events — audit log
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_events (
  id          uuid primary key default gen_random_uuid(),
  charge_id   text,
  result      text not null,  -- received | invalid_signature | duplicate | rejected | processing_error | not_configured
  detail      text,
  created_at  timestamptz not null default now()
);

create index if not exists webhook_events_charge_idx  on public.webhook_events(charge_id);
create index if not exists webhook_events_created_idx on public.webhook_events(created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.orders                    enable row level security;
alter table public.processed_webhook_events  enable row level security;
alter table public.webhook_events            enable row level security;

-- Users can read their own orders
drop policy if exists "orders_user_read"  on public.orders;
create policy "orders_user_read" on public.orders for select
  using (user_id = auth.uid());

-- Service role (webhook handler) can insert/update orders — handled via service key, no policy needed
-- Admins can read all orders
drop policy if exists "orders_admin_all"  on public.orders;
create policy "orders_admin_all" on public.orders for all
  using (public.is_admin());

-- processed_webhook_events and webhook_events: service role only (no user policies needed)
drop policy if exists "webhook_events_admin_read" on public.webhook_events;
create policy "webhook_events_admin_read" on public.webhook_events for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at trigger for orders
-- ---------------------------------------------------------------------------
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- =============================================================================
