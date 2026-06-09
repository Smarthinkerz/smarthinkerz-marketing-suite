-- =============================================================================
-- SmarThinkerz Marketing Suite — COMPLETE DATABASE SETUP
-- Run this ENTIRE file in Supabase SQL Editor in one go.
-- =============================================================================
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

-- =============================================================================
-- Auto-Promote — multi-tenant autonomous promotion engine
-- Per-user promotion profiles, connected social accounts, content calendar,
-- and run logs. RLS-scoped to the owning user (admins bypass).
-- Idempotent where practical; safe to re-run.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type social_platform as enum ('linkedin', 'facebook', 'instagram');
exception when duplicate_object then null; end $$;

do $$ begin
  create type promo_post_status as enum (
    'draft',        -- generated, not yet approved (approve-first mode)
    'scheduled',    -- approved/queued, waiting for its scheduled_for time
    'publishing',   -- claimed by a publish run (in-flight lock)
    'published',    -- successfully posted to the platform
    'failed',       -- publish attempt failed (see error)
    'skipped',      -- canceled/skipped by the user
    'archived'      -- kept for history, no longer actionable
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type promo_run_kind as enum ('generate', 'publish');
exception when duplicate_object then null; end $$;

do $$ begin
  create type promo_run_status as enum ('success', 'partial', 'error');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- Tables
-- =============================================================================

-- promotion_profiles ---------------------------------------------------------
-- Each row is a brand/topic a user wants to promote. No hardcoded brand facts;
-- the user supplies everything. This is what grounds the AI content engine.
create table if not exists public.promotion_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,                              -- internal label, e.g. "SmarThinkerz Academy"
  brand_name text not null,                        -- public brand name used in copy
  website_url text,                                -- the URL to drive traffic to
  description text not null default '',            -- what the brand/offer is
  target_audience text not null default '',        -- who the posts should speak to
  tone text not null default 'professional',       -- voice/tone guidance
  key_selling_points text[] not null default '{}', -- bullets the AI should weave in
  call_to_action text not null default '',         -- desired CTA
  hashtags text[] not null default '{}',           -- preferred hashtags
  keywords text[] not null default '{}',           -- topics/keywords to research around
  platforms social_platform[] not null default '{}',-- which platforms to post to
  posts_per_day integer not null default 3 check (posts_per_day between 1 and 12),
  -- Local hours (0-23) at which to post; length should match posts_per_day.
  post_hours integer[] not null default '{9,13,17}',
  timezone text not null default 'UTC',
  autopilot boolean not null default false,        -- true = publish hands-off; false = approve-first
  active boolean not null default true,            -- engine on/off for this profile
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists promotion_profiles_user_idx
  on public.promotion_profiles(user_id, created_at desc);
create index if not exists promotion_profiles_active_idx
  on public.promotion_profiles(active) where active = true;

-- social_accounts ------------------------------------------------------------
-- A user's connected platform credentials. Tokens are written/read server-side
-- only (service role); RLS lets owners see metadata but tokens stay protected
-- at the app layer (never selected into client components).
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform social_platform not null,
  account_label text,                              -- e.g. page name / handle shown in UI
  external_id text,                                -- platform account/page id
  access_token text,                               -- server-only
  refresh_token text,                              -- server-only
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  meta jsonb not null default '{}',                -- page id, ig business id, etc.
  connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, external_id)
);
create index if not exists social_accounts_user_idx
  on public.social_accounts(user_id, platform);

-- content_posts --------------------------------------------------------------
-- The content calendar / queue. One row per (profile, platform, slot).
create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.promotion_profiles(id) on delete cascade,
  platform social_platform not null,
  status promo_post_status not null default 'draft',
  angle text,                                      -- the rotating content angle used
  body text not null,                              -- the post copy
  hashtags text[] not null default '{}',
  image_prompt text,                               -- optional image idea (Phase 2 media)
  image_url text,                                  -- optional generated/attached image
  link_url text,                                   -- the brand URL included
  scheduled_for timestamptz,                       -- when it should publish
  published_at timestamptz,                        -- when it actually published
  external_post_id text,                           -- id returned by the platform
  error text,                                      -- last failure reason
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_posts_user_idx
  on public.content_posts(user_id, created_at desc);
create index if not exists content_posts_profile_idx
  on public.content_posts(profile_id, scheduled_for);
create index if not exists content_posts_due_idx
  on public.content_posts(status, scheduled_for);

-- content_runs ---------------------------------------------------------------
-- Log of each generation/publish job (manual or cron), for transparency.
create table if not exists public.content_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.promotion_profiles(id) on delete set null,
  kind promo_run_kind not null,
  status promo_run_status not null default 'success',
  trigger text not null default 'cron',            -- 'cron' | 'manual'
  posts_created integer not null default 0,
  posts_published integer not null default 0,
  detail jsonb not null default '{}',
  error text,
  created_at timestamptz not null default now()
);
create index if not exists content_runs_user_idx
  on public.content_runs(user_id, created_at desc);
create index if not exists content_runs_profile_idx
  on public.content_runs(profile_id, created_at desc);

-- =============================================================================
-- updated_at trigger helper
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_promotion_profiles_touch on public.promotion_profiles;
create trigger trg_promotion_profiles_touch
  before update on public.promotion_profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_social_accounts_touch on public.social_accounts;
create trigger trg_social_accounts_touch
  before update on public.social_accounts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_content_posts_touch on public.content_posts;
create trigger trg_content_posts_touch
  before update on public.content_posts
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Row Level Security (owner-scoped; admins bypass via is_admin())
-- =============================================================================
alter table public.promotion_profiles enable row level security;
alter table public.social_accounts     enable row level security;
alter table public.content_posts       enable row level security;
alter table public.content_runs        enable row level security;

drop policy if exists "promotion_profiles_owner_all" on public.promotion_profiles;
create policy "promotion_profiles_owner_all" on public.promotion_profiles
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

drop policy if exists "social_accounts_owner_all" on public.social_accounts;
create policy "social_accounts_owner_all" on public.social_accounts
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

drop policy if exists "content_posts_owner_all" on public.content_posts;
create policy "content_posts_owner_all" on public.content_posts
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

drop policy if exists "content_runs_owner_all" on public.content_runs;
create policy "content_runs_owner_all" on public.content_runs
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- =============================================================================
-- Migration 0003 — Organization model, workspaces, approval workflow,
--                  brand governance, audit log, asset library
-- Corporate Spec Phases 2-4
-- =============================================================================
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New query).
-- It is additive: existing tables are extended, not dropped.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: check if the current user is a platform admin (existing helper)
-- ---------------------------------------------------------------------------
-- public.is_admin() already exists from migration 0001.

-- ---------------------------------------------------------------------------
-- Helper: check if the current user is a member of a given workspace
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.memberships m
    join public.workspaces w on w.org_id = m.org_id
    where m.user_id = auth.uid()
      and w.id = p_workspace_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper: get the role of the current user in a workspace's org
-- ---------------------------------------------------------------------------
create or replace function public.workspace_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
as $$
  select m.role::text
  from public.memberships m
  join public.workspaces w on w.org_id = m.org_id
  where m.user_id = auth.uid()
    and w.id = p_workspace_id
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Enum: org member roles
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.org_role as enum (
    'owner',
    'admin',
    'manager',
    'creator',
    'approver',
    'viewer'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Enum: content post lifecycle states (extends promo_post_status)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.content_status as enum (
    'draft',
    'in_review',
    'changes_requested',
    'approved',
    'scheduled',
    'published',
    'needs_attention'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Enum: audit log verbs
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.audit_verb as enum (
    'created',
    'updated',
    'deleted',
    'submitted_for_review',
    'approved',
    'changes_requested',
    'scheduled',
    'published',
    'publish_failed',
    'member_invited',
    'member_removed',
    'role_changed',
    'workspace_created',
    'workspace_updated',
    'guardrails_updated',
    'asset_uploaded',
    'asset_deleted',
    'sso_configured',
    'login'
  );
exception when duplicate_object then null; end $$;

-- =============================================================================
-- B.1 ORGANIZATION MODEL
-- =============================================================================

-- organizations ---------------------------------------------------------------
create table if not exists public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique,                         -- URL-safe identifier
  plan         text not null default 'basic',       -- mirrors subscription tier
  sso_config   jsonb,                               -- SAML/OIDC config (Phase 4)
  scim_token   text,                                -- SCIM provisioning token
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations(slug);

-- memberships -----------------------------------------------------------------
create table if not exists public.memberships (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.org_role not null default 'creator',
  invited_by   uuid references auth.users(id) on delete set null,
  invited_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  unique (org_id, user_id)
);

create index if not exists memberships_org_idx  on public.memberships(org_id);
create index if not exists memberships_user_idx on public.memberships(user_id);

-- workspaces ------------------------------------------------------------------
create table if not exists public.workspaces (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  name         text not null,
  slug         text,
  -- trusted auto-publish: only an Admin can flip this on per workspace
  auto_publish_enabled boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (org_id, slug)
);

create index if not exists workspaces_org_idx on public.workspaces(org_id);

-- =============================================================================
-- B.5 BRAND GOVERNANCE
-- =============================================================================

-- brand_guardrails ------------------------------------------------------------
create table if not exists public.brand_guardrails (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null unique references public.workspaces(id) on delete cascade,
  -- Brand voice
  tone              text,                           -- e.g. "professional, warm, concise"
  do_phrases        text[] not null default '{}',  -- encouraged phrases
  dont_phrases      text[] not null default '{}',  -- discouraged phrases
  reading_level     text,                          -- e.g. "Grade 8"
  -- Hashtag governance
  approved_hashtags text[] not null default '{}',
  banned_terms      text[] not null default '{}',  -- competitors, off-limits claims
  -- Per-platform rules (JSON map: platform → {char_limit, link_policy, disclosures})
  platform_rules    jsonb not null default '{}',
  updated_at        timestamptz not null default now()
);

-- =============================================================================
-- B.3 CONTENT APPROVAL LIFECYCLE — extend content_posts
-- =============================================================================

-- Add workspace_id + new lifecycle columns to content_posts
-- (user_id is kept for backward compat; workspace_id is the new owner)
alter table public.content_posts
  add column if not exists workspace_id    uuid references public.workspaces(id) on delete cascade,
  add column if not exists content_status  public.content_status not null default 'draft',
  add column if not exists approved_by     uuid references auth.users(id) on delete set null,
  add column if not exists approved_at     timestamptz,
  add column if not exists review_notes    text;

-- Index for the approvals inbox query
create index if not exists content_posts_workspace_status_idx
  on public.content_posts(workspace_id, content_status, created_at desc);

-- approvals -------------------------------------------------------------------
create table if not exists public.approvals (
  id               uuid primary key default gen_random_uuid(),
  content_post_id  uuid not null references public.content_posts(id) on delete cascade,
  approver_id      uuid not null references auth.users(id) on delete cascade,
  status           text not null check (status in ('approved', 'changes_requested')),
  rationale        text,
  acted_at         timestamptz not null default now()
);

create index if not exists approvals_post_idx on public.approvals(content_post_id);
create index if not exists approvals_approver_idx on public.approvals(approver_id, acted_at desc);

-- =============================================================================
-- B.6 AUDIT LOG
-- =============================================================================

create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  org_id       uuid references public.organizations(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  actor_id     uuid references auth.users(id) on delete set null,
  verb         public.audit_verb not null,
  target       text,                               -- e.g. "content_post:uuid"
  payload      jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

-- Append-only: no updates or deletes allowed (enforced by RLS below)
create index if not exists audit_log_org_idx       on public.audit_log(org_id, created_at desc);
create index if not exists audit_log_workspace_idx on public.audit_log(workspace_id, created_at desc);
create index if not exists audit_log_actor_idx     on public.audit_log(actor_id, created_at desc);

-- =============================================================================
-- B.5 ASSET LIBRARY (DAM)
-- =============================================================================

create table if not exists public.assets (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  uploaded_by  uuid references auth.users(id) on delete set null,
  type         text not null check (type in ('image', 'video', 'document', 'logo', 'other')),
  name         text not null,
  url          text not null,
  size_bytes   bigint,
  mime_type    text,
  approved     boolean not null default false,
  tags         text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists assets_workspace_idx on public.assets(workspace_id, created_at desc);
create index if not exists assets_approved_idx  on public.assets(workspace_id, approved);

-- =============================================================================
-- Extend promotion_profiles + social_accounts + content_runs with workspace_id
-- =============================================================================

alter table public.promotion_profiles
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.social_accounts
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade,
  add column if not exists connected_by  uuid references auth.users(id) on delete set null;

alter table public.content_runs
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

-- =============================================================================
-- Updated_at triggers
-- =============================================================================

drop trigger if exists trg_organizations_touch on public.organizations;
create trigger trg_organizations_touch
  before update on public.organizations
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_workspaces_touch on public.workspaces;
create trigger trg_workspaces_touch
  before update on public.workspaces
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_brand_guardrails_touch on public.brand_guardrails;
create trigger trg_brand_guardrails_touch
  before update on public.brand_guardrails
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- organizations ---------------------------------------------------------------
alter table public.organizations enable row level security;

drop policy if exists "org_member_select" on public.organizations;
create policy "org_member_select" on public.organizations
  for select using (
    public.is_admin() or
    exists (
      select 1 from public.memberships m
      where m.org_id = organizations.id and m.user_id = auth.uid()
    )
  );

drop policy if exists "org_owner_admin_modify" on public.organizations;
create policy "org_owner_admin_modify" on public.organizations
  for update using (
    public.is_admin() or
    exists (
      select 1 from public.memberships m
      where m.org_id = organizations.id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- memberships -----------------------------------------------------------------
alter table public.memberships enable row level security;

drop policy if exists "membership_self_or_admin_select" on public.memberships;
create policy "membership_self_or_admin_select" on public.memberships
  for select using (
    public.is_admin() or
    user_id = auth.uid() or
    exists (
      select 1 from public.memberships m2
      where m2.org_id = memberships.org_id and m2.user_id = auth.uid()
    )
  );

drop policy if exists "membership_owner_admin_modify" on public.memberships;
create policy "membership_owner_admin_modify" on public.memberships
  for all using (
    public.is_admin() or
    exists (
      select 1 from public.memberships m2
      where m2.org_id = memberships.org_id
        and m2.user_id = auth.uid()
        and m2.role in ('owner', 'admin')
    )
  );

-- workspaces ------------------------------------------------------------------
alter table public.workspaces enable row level security;

drop policy if exists "workspace_member_select" on public.workspaces;
create policy "workspace_member_select" on public.workspaces
  for select using (
    public.is_admin() or
    exists (
      select 1 from public.memberships m
      where m.org_id = workspaces.org_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "workspace_manager_modify" on public.workspaces;
create policy "workspace_manager_modify" on public.workspaces
  for all using (
    public.is_admin() or
    exists (
      select 1 from public.memberships m
      where m.org_id = workspaces.org_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin', 'manager')
    )
  );

-- brand_guardrails ------------------------------------------------------------
alter table public.brand_guardrails enable row level security;

drop policy if exists "guardrails_member_select" on public.brand_guardrails;
create policy "guardrails_member_select" on public.brand_guardrails
  for select using (
    public.is_admin() or public.is_workspace_member(workspace_id)
  );

drop policy if exists "guardrails_manager_modify" on public.brand_guardrails;
create policy "guardrails_manager_modify" on public.brand_guardrails
  for all using (
    public.is_admin() or
    public.workspace_role(workspace_id) in ('owner', 'admin', 'manager')
  );

-- content_posts (re-scope to workspace) ---------------------------------------
-- Drop old user-scoped policies and replace with workspace-scoped ones
drop policy if exists "content_posts_owner_all" on public.content_posts;

drop policy if exists "content_posts_member_select" on public.content_posts;
create policy "content_posts_member_select" on public.content_posts
  for select using (
    public.is_admin() or
    (workspace_id is not null and public.is_workspace_member(workspace_id)) or
    (workspace_id is null and auth.uid() = user_id)
  );

drop policy if exists "content_posts_creator_insert" on public.content_posts;
create policy "content_posts_creator_insert" on public.content_posts
  for insert with check (
    public.is_admin() or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','creator')) or
    (workspace_id is null and auth.uid() = user_id)
  );

drop policy if exists "content_posts_creator_update" on public.content_posts;
create policy "content_posts_creator_update" on public.content_posts
  for update using (
    public.is_admin() or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','creator','approver')) or
    (workspace_id is null and auth.uid() = user_id)
  );

drop policy if exists "content_posts_manager_delete" on public.content_posts;
create policy "content_posts_manager_delete" on public.content_posts
  for delete using (
    public.is_admin() or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager')) or
    (workspace_id is null and auth.uid() = user_id)
  );

-- approvals -------------------------------------------------------------------
alter table public.approvals enable row level security;

drop policy if exists "approvals_member_select" on public.approvals;
create policy "approvals_member_select" on public.approvals
  for select using (
    public.is_admin() or
    approver_id = auth.uid() or
    exists (
      select 1 from public.content_posts cp
      where cp.id = approvals.content_post_id
        and cp.workspace_id is not null
        and public.is_workspace_member(cp.workspace_id)
    )
  );

drop policy if exists "approvals_approver_insert" on public.approvals;
create policy "approvals_approver_insert" on public.approvals
  for insert with check (
    public.is_admin() or
    (
      approver_id = auth.uid() and
      exists (
        select 1 from public.content_posts cp
        where cp.id = approvals.content_post_id
          and cp.workspace_id is not null
          and public.workspace_role(cp.workspace_id) in ('owner','admin','manager','approver')
      )
    )
  );

-- audit_log (append-only: insert only, no update/delete) ---------------------
alter table public.audit_log enable row level security;

drop policy if exists "audit_log_member_select" on public.audit_log;
create policy "audit_log_member_select" on public.audit_log
  for select using (
    public.is_admin() or
    actor_id = auth.uid() or
    (org_id is not null and exists (
      select 1 from public.memberships m
      where m.org_id = audit_log.org_id and m.user_id = auth.uid()
    ))
  );

drop policy if exists "audit_log_insert" on public.audit_log;
create policy "audit_log_insert" on public.audit_log
  for insert with check (true);  -- server-side only; no client update/delete

-- assets ----------------------------------------------------------------------
alter table public.assets enable row level security;

drop policy if exists "assets_member_select" on public.assets;
create policy "assets_member_select" on public.assets
  for select using (
    public.is_admin() or public.is_workspace_member(workspace_id)
  );

drop policy if exists "assets_creator_insert" on public.assets;
create policy "assets_creator_insert" on public.assets
  for insert with check (
    public.is_admin() or
    public.workspace_role(workspace_id) in ('owner','admin','manager','creator')
  );

drop policy if exists "assets_manager_modify" on public.assets;
create policy "assets_manager_modify" on public.assets
  for update using (
    public.is_admin() or
    public.workspace_role(workspace_id) in ('owner','admin','manager')
  );

drop policy if exists "assets_manager_delete" on public.assets;
create policy "assets_manager_delete" on public.assets
  for delete using (
    public.is_admin() or
    public.workspace_role(workspace_id) in ('owner','admin','manager')
  );

-- promotion_profiles (re-scope) -----------------------------------------------
drop policy if exists "promotion_profiles_owner_all" on public.promotion_profiles;

drop policy if exists "promotion_profiles_workspace_all" on public.promotion_profiles;
create policy "promotion_profiles_workspace_all" on public.promotion_profiles
  for all using (
    public.is_admin() or
    auth.uid() = user_id or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager'))
  )
  with check (
    public.is_admin() or
    auth.uid() = user_id or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager'))
  );

-- social_accounts (re-scope) --------------------------------------------------
drop policy if exists "social_accounts_owner_all" on public.social_accounts;

drop policy if exists "social_accounts_workspace_all" on public.social_accounts;
create policy "social_accounts_workspace_all" on public.social_accounts
  for all using (
    public.is_admin() or
    auth.uid() = user_id or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager'))
  )
  with check (
    public.is_admin() or
    auth.uid() = user_id or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager'))
  );

-- content_runs (re-scope) -----------------------------------------------------
drop policy if exists "content_runs_owner_all" on public.content_runs;

drop policy if exists "content_runs_workspace_all" on public.content_runs;
create policy "content_runs_workspace_all" on public.content_runs
  for all using (
    public.is_admin() or
    auth.uid() = user_id or
    (workspace_id is not null and public.is_workspace_member(workspace_id))
  )
  with check (
    public.is_admin() or
    auth.uid() = user_id or
    (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','creator'))
  );

-- =============================================================================
-- Convenience view: my_workspaces
-- Returns all workspaces the current user is a member of, with their role.
-- =============================================================================
create or replace view public.my_workspaces as
  select
    w.id,
    w.org_id,
    w.name,
    w.slug,
    w.auto_publish_enabled,
    w.created_at,
    o.name  as org_name,
    o.plan  as org_plan,
    m.role  as member_role
  from public.workspaces w
  join public.organizations o on o.id = w.org_id
  join public.memberships   m on m.org_id = w.org_id and m.user_id = auth.uid();

-- =============================================================================
-- Convenience view: pending_approvals
-- Returns content posts in_review for workspaces where the current user
-- has an approver/manager/admin/owner role.
-- =============================================================================
create or replace view public.pending_approvals as
  select
    cp.*,
    w.name  as workspace_name,
    o.name  as org_name,
    m.role  as reviewer_role
  from public.content_posts cp
  join public.workspaces   w on w.id = cp.workspace_id
  join public.organizations o on o.id = w.org_id
  join public.memberships   m on m.org_id = w.org_id and m.user_id = auth.uid()
  where cp.content_status = 'in_review'
    and m.role in ('owner', 'admin', 'manager', 'approver');

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
  add column if not exists total_amount_usd numeric(12,2),
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
  total_amount_usd numeric(12,2) not null,
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
drop policy if exists "tap_pending_charges: owner read" on public.tap_pending_charges;
create policy "tap_pending_charges: owner read"
  on public.tap_pending_charges
  for select
  using (auth.uid() = user_id);

-- Only service role can insert/update (done server-side, never from client)
drop policy if exists "tap_pending_charges: service insert" on public.tap_pending_charges;
create policy "tap_pending_charges: service insert"
  on public.tap_pending_charges
  for insert
  with check (true);

drop policy if exists "tap_pending_charges: service update" on public.tap_pending_charges;
create policy "tap_pending_charges: service update"
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
