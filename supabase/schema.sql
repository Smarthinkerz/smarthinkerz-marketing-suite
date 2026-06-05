-- =============================================================================
-- SmarThinkerz Marketing Suite — Supabase schema, RLS, triggers, and seed
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Idempotent where practical; safe to re-run.
-- =============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('subscriber', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_tier as enum ('basic', 'pro', 'business', 'enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- Tables
-- =============================================================================

-- profiles -------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'subscriber',
  created_at timestamptz not null default now()
);

-- subscriptions --------------------------------------------------------------
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier subscription_tier not null default 'basic',
  status subscription_status not null default 'trialing',
  current_period_end timestamptz,
  grace_until timestamptz,
  cycle text,                       -- 'monthly' | 'yearly' | null
  hub_order_id text,                -- Payment hub order id
  updated_at timestamptz not null default now()
);

-- campaigns ------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  channels text[] not null default '{}',
  status text not null default 'draft',
  budget numeric not null default 0,
  spend numeric not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  conversions integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists campaigns_user_idx on public.campaigns(user_id);

-- ai_generations -------------------------------------------------------------
create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  prompt text not null,
  result jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ai_generations_user_idx on public.ai_generations(user_id, created_at desc);

-- usage_counters -------------------------------------------------------------
create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,            -- e.g. '2026-06'
  tool text not null,
  count integer not null default 0,
  primary key (user_id, period, tool)
);

-- cms_content (singleton 'homepage') -----------------------------------------
create table if not exists public.cms_content (
  id text primary key,
  data jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- cms_versions (history / rollback) ------------------------------------------
create table if not exists public.cms_versions (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  data jsonb not null,
  label text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists cms_versions_content_idx on public.cms_versions(content_id, created_at desc);

-- analytics_events -----------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_type_idx on public.analytics_events(type, created_at desc);

-- invoices -------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'pending',
  hub_charge_id text,
  created_at timestamptz not null default now()
);
create index if not exists invoices_user_idx on public.invoices(user_id, created_at desc);

-- processed_events (webhook idempotency) ------------------------------------
create table if not exists public.processed_events (
  event_id text primary key,
  event_type text,
  processed_at timestamptz not null default now()
);

-- =============================================================================
-- Helper: is_admin()
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- =============================================================================
-- New-user bootstrap: create profile + trialing basic subscription
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', null),
    'subscriber'
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, tier, status, current_period_end)
  values (new.id, 'basic', 'trialing', now() + interval '14 days')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles        enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.campaigns        enable row level security;
alter table public.ai_generations   enable row level security;
alter table public.usage_counters   enable row level security;
alter table public.cms_content      enable row level security;
alter table public.cms_versions     enable row level security;
alter table public.analytics_events enable row level security;
alter table public.invoices         enable row level security;

-- profiles
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- subscriptions
drop policy if exists "subs_self_read" on public.subscriptions;
create policy "subs_self_read" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin());

-- campaigns (full CRUD for owner)
drop policy if exists "campaigns_owner_all" on public.campaigns;
create policy "campaigns_owner_all" on public.campaigns
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- ai_generations
drop policy if exists "ai_owner_all" on public.ai_generations;
create policy "ai_owner_all" on public.ai_generations
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- usage_counters
drop policy if exists "usage_owner_all" on public.usage_counters;
create policy "usage_owner_all" on public.usage_counters
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- cms_content: readable by everyone, writable by admins only
drop policy if exists "cms_public_read" on public.cms_content;
create policy "cms_public_read" on public.cms_content
  for select using (true);
drop policy if exists "cms_admin_write" on public.cms_content;
create policy "cms_admin_write" on public.cms_content
  for all using (public.is_admin()) with check (public.is_admin());

-- cms_versions: admin only
drop policy if exists "cms_versions_admin" on public.cms_versions;
create policy "cms_versions_admin" on public.cms_versions
  for all using (public.is_admin()) with check (public.is_admin());

-- analytics_events: owner can insert own; admins read all
drop policy if exists "analytics_admin_read" on public.analytics_events;
create policy "analytics_admin_read" on public.analytics_events
  for select using (public.is_admin());
drop policy if exists "analytics_self_insert" on public.analytics_events;
create policy "analytics_self_insert" on public.analytics_events
  for insert with check (auth.uid() = user_id or user_id is null);

-- invoices
drop policy if exists "invoices_self_read" on public.invoices;
create policy "invoices_self_read" on public.invoices
  for select using (auth.uid() = user_id or public.is_admin());

-- =============================================================================
-- Seed default homepage CMS row (no-op if present)
-- The app also falls back to bundled defaults if this row is missing.
-- =============================================================================
insert into public.cms_content (id, data)
values ('homepage', '{}'::jsonb)
on conflict (id) do nothing;
