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
