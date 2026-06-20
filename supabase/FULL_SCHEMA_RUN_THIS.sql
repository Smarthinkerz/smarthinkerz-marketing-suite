-- =============================================================================
-- SmarThinkerz Marketing Suite — COMPLETE DATABASE SETUP
-- Run this ENTIRE file in Supabase SQL Editor in one go.
-- Order: Extensions → Enums → Tables → Functions → Triggers → RLS → Views → Seed
-- =============================================================================

-- =============================================================================
-- SECTION 1: EXTENSIONS
-- =============================================================================
create extension if not exists "pgcrypto";

-- =============================================================================
-- SECTION 2: ENUMS
-- =============================================================================
do $$ begin create type public.user_role as enum ('subscriber', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin create type public.subscription_tier as enum ('basic', 'pro', 'business', 'enterprise');
exception when duplicate_object then null; end $$;

do $$ begin create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');
exception when duplicate_object then null; end $$;

do $$ begin create type public.social_platform as enum ('linkedin', 'twitter', 'instagram', 'facebook', 'tiktok', 'youtube', 'pinterest');
exception when duplicate_object then null; end $$;

do $$ begin create type public.promo_post_status as enum ('draft','scheduled','publishing','published','failed','skipped','archived');
exception when duplicate_object then null; end $$;

do $$ begin create type public.promo_run_kind as enum ('generate', 'publish', 'generate_and_publish');
exception when duplicate_object then null; end $$;

do $$ begin create type public.promo_run_status as enum ('success', 'partial', 'error', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin create type public.org_role as enum ('owner','admin','manager','creator','approver','viewer');
exception when duplicate_object then null; end $$;

do $$ begin create type public.content_status as enum ('draft','in_review','changes_requested','approved','scheduled','published','needs_attention');
exception when duplicate_object then null; end $$;

do $$ begin create type public.audit_verb as enum ('created','updated','deleted','submitted_for_review','approved','changes_requested','scheduled','published','publish_failed','member_invited','member_removed','role_changed','workspace_created','workspace_updated','guardrails_updated','asset_uploaded','asset_deleted','sso_configured','login');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- SECTION 3: BASE TABLES
-- =============================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null default '',
  full_name   text,
  avatar_url  text,
  role        text not null default 'subscriber',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null unique references auth.users(id) on delete cascade,
  tier                  text not null default 'basic',
  status                text not null default 'trialing',
  cycle                 text,
  current_period_end    timestamptz,
  current_period_start  timestamptz,
  grace_until           timestamptz,
  hub_charge_id         text,
  tap_pay_ref           text,
  plan_key              text,
  installment_count     integer not null default 1,
  installments_paid     integer not null default 0,
  installment_amount    numeric(12,2),
  ai_token_budget       numeric(12,2) not null default 0,
  total_amount_usd      numeric(12,2),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists campaigns_user_idx on public.campaigns(user_id);

create table if not exists public.ai_generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tool        text not null,
  prompt      text,
  result      text,
  tokens_used integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists ai_generations_user_idx on public.ai_generations(user_id, created_at desc);

create table if not exists public.usage_counters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  period      text not null default '',
  counts      jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

create table if not exists public.cms_content (
  id          text primary key,
  data        jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

create table if not exists public.cms_versions (
  id          uuid primary key default gen_random_uuid(),
  content_id  text not null references public.cms_content(id) on delete cascade,
  data        jsonb not null default '{}',
  author_id   uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists cms_versions_content_idx on public.cms_versions(content_id, created_at desc);

create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  type        text not null,
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists analytics_events_type_idx on public.analytics_events(type, created_at desc);

create table if not exists public.invoices (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  amount              numeric(12,2) not null,
  currency            text not null default 'USD',
  status              text not null default 'paid',
  hub_charge_id       text,
  tap_charge_id       text,
  installment_number  integer,
  currency_override   text,
  description         text,
  created_at          timestamptz not null default now()
);
create index if not exists invoices_user_idx on public.invoices(user_id, created_at desc);

create table if not exists public.processed_events (
  event_id      text primary key,
  event_type    text not null,
  processed_at  timestamptz not null default now()
);

-- =============================================================================
-- SECTION 4: AUTO-PROMOTE TABLES
-- =============================================================================

create table if not exists public.promotion_profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  workspace_id        uuid,
  name                text not null,
  brand_name          text not null,
  brand_url           text,
  brand_desc          text,
  platforms           public.social_platform[] not null default '{}',
  content_angles      text[] not null default '{}',
  hashtags            text[] not null default '{}',
  posting_freq        integer not null default 3,
  is_active           boolean not null default false,
  last_run_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists promotion_profiles_user_idx on public.promotion_profiles(user_id);
create index if not exists promotion_profiles_active_idx on public.promotion_profiles(is_active, last_run_at) where is_active = true;

create table if not exists public.social_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  workspace_id    uuid,
  platform        public.social_platform not null,
  account_name    text not null,
  access_token    text,
  refresh_token   text,
  token_expires_at timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, platform)
);
create index if not exists social_accounts_user_idx on public.social_accounts(user_id, platform);

create table if not exists public.content_posts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  profile_id        uuid not null references public.promotion_profiles(id) on delete cascade,
  workspace_id      uuid,
  platform          public.social_platform not null,
  status            public.promo_post_status not null default 'draft',
  content_status    public.content_status,
  angle             text,
  body              text not null,
  hashtags          text[] not null default '{}',
  image_prompt      text,
  image_url         text,
  link_url          text,
  scheduled_for     timestamptz,
  published_at      timestamptz,
  external_post_id  text,
  error             text,
  attempts          integer not null default 0,
  reviewer_id       uuid references auth.users(id) on delete set null,
  reviewer_note     text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists content_posts_user_idx    on public.content_posts(user_id, created_at desc);
create index if not exists content_posts_profile_idx on public.content_posts(profile_id, scheduled_for);
create index if not exists content_posts_due_idx     on public.content_posts(status, scheduled_for);

create table if not exists public.content_runs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  profile_id      uuid references public.promotion_profiles(id) on delete set null,
  workspace_id    uuid,
  kind            public.promo_run_kind not null,
  status          public.promo_run_status not null default 'success',
  trigger         text not null default 'cron',
  posts_created   integer not null default 0,
  posts_published integer not null default 0,
  detail          jsonb not null default '{}',
  error           text,
  created_at      timestamptz not null default now()
);
create index if not exists content_runs_user_idx    on public.content_runs(user_id, created_at desc);
create index if not exists content_runs_profile_idx on public.content_runs(profile_id, created_at desc);

-- =============================================================================
-- SECTION 5: ORG / WORKSPACE TABLES
-- =============================================================================

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  plan        text not null default 'basic',
  sso_config  jsonb,
  scim_token  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists organizations_slug_idx on public.organizations(slug);

create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.org_role not null default 'creator',
  invited_by  uuid references auth.users(id) on delete set null,
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (org_id, user_id)
);
create index if not exists memberships_org_idx  on public.memberships(org_id);
create index if not exists memberships_user_idx on public.memberships(user_id);

create table if not exists public.workspaces (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null references public.organizations(id) on delete cascade,
  name                  text not null,
  slug                  text,
  auto_publish_enabled  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (org_id, slug)
);
create index if not exists workspaces_org_idx on public.workspaces(org_id);

-- Add workspace FK columns now that workspaces table exists
alter table public.promotion_profiles add column if not exists workspace_id_fk uuid references public.workspaces(id) on delete set null;
alter table public.social_accounts    add column if not exists workspace_id_fk uuid references public.workspaces(id) on delete set null;
alter table public.content_posts      add column if not exists workspace_id_fk uuid references public.workspaces(id) on delete set null;
alter table public.content_runs       add column if not exists workspace_id_fk uuid references public.workspaces(id) on delete set null;

create table if not exists public.brand_guardrails (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null unique references public.workspaces(id) on delete cascade,
  tone              text,
  voice_pillars     text[] not null default '{}',
  required_hashtags text[] not null default '{}',
  optional_hashtags text[] not null default '{}',
  banned_terms      text[] not null default '{}',
  platform_rules    jsonb not null default '{}',
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id) on delete set null
);

create table if not exists public.approvals (
  id              uuid primary key default gen_random_uuid(),
  content_post_id uuid not null references public.content_posts(id) on delete cascade,
  workspace_id    uuid references public.workspaces(id) on delete set null,
  org_id          uuid references public.organizations(id) on delete set null,
  requested_by    uuid not null references auth.users(id) on delete cascade,
  assigned_to     uuid references auth.users(id) on delete set null,
  status          text not null default 'pending',
  note            text,
  decided_at      timestamptz,
  decided_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists approvals_post_idx      on public.approvals(content_post_id);
create index if not exists approvals_workspace_idx on public.approvals(workspace_id, status);

create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid references public.organizations(id) on delete set null,
  workspace_id  uuid references public.workspaces(id) on delete set null,
  actor_id      uuid references auth.users(id) on delete set null,
  verb          public.audit_verb not null,
  target_type   text,
  target_id     text,
  meta          jsonb not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists audit_log_org_idx       on public.audit_log(org_id, created_at desc);
create index if not exists audit_log_workspace_idx on public.audit_log(workspace_id, created_at desc);
create index if not exists audit_log_actor_idx     on public.audit_log(actor_id, created_at desc);

create table if not exists public.assets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  org_id        uuid references public.organizations(id) on delete set null,
  uploaded_by   uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  storage_path  text not null,
  public_url    text,
  mime_type     text,
  size_bytes    bigint,
  asset_type    text not null default 'other',
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists assets_workspace_idx on public.assets(workspace_id, created_at desc);
create index if not exists assets_org_idx       on public.assets(org_id, created_at desc);

-- =============================================================================
-- SECTION 6: TAP PAYMENTS TABLES
-- =============================================================================

create table if not exists public.tap_pending_charges (
  id                  uuid primary key default gen_random_uuid(),
  tap_charge_id       text unique not null,
  user_id             uuid not null references auth.users(id) on delete cascade,
  plan_key            text not null,
  tier                text not null,
  cycle               text not null default 'monthly',
  total_amount_usd    numeric(12,2) not null,
  installment_count   integer not null default 1,
  installment_amount  numeric(12,2),
  status              text not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists tap_pending_charges_user_idx   on public.tap_pending_charges(user_id, created_at desc);
create index if not exists tap_pending_charges_status_idx on public.tap_pending_charges(status, created_at desc);

create table if not exists public.processed_tap_events (
  event_id      text primary key,
  event_type    text not null,
  processed_at  timestamptz not null default now()
);

-- =============================================================================
-- SECTION 7: FUNCTIONS (all tables exist now)
-- =============================================================================

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.memberships m
    join public.workspaces w on w.org_id = m.org_id
    where m.user_id = auth.uid() and w.id = p_workspace_id
  );
$$;

create or replace function public.workspace_role(p_workspace_id uuid)
returns text language sql stable security definer as $$
  select m.role::text
  from public.memberships m
  join public.workspaces w on w.org_id = m.org_id
  where m.user_id = auth.uid() and w.id = p_workspace_id
  limit 1;
$$;

create or replace function public.user_org_role(p_org_id uuid)
returns text language sql stable security definer as $$
  select role::text from public.memberships
  where org_id = p_org_id and user_id = auth.uid() limit 1;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'full_name',null), 'subscriber')
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, tier, status, current_period_end)
  values (new.id, 'basic', 'trialing', now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.set_tap_pending_charges_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- =============================================================================
-- SECTION 8: TRIGGERS
-- =============================================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

drop trigger if exists trg_promotion_profiles_touch on public.promotion_profiles;
create trigger trg_promotion_profiles_touch
  before update on public.promotion_profiles for each row execute function public.touch_updated_at();

drop trigger if exists trg_social_accounts_touch on public.social_accounts;
create trigger trg_social_accounts_touch
  before update on public.social_accounts for each row execute function public.touch_updated_at();

drop trigger if exists trg_content_posts_touch on public.content_posts;
create trigger trg_content_posts_touch
  before update on public.content_posts for each row execute function public.touch_updated_at();

drop trigger if exists tap_pending_charges_updated_at on public.tap_pending_charges;
create trigger tap_pending_charges_updated_at
  before update on public.tap_pending_charges for each row execute function public.set_tap_pending_charges_updated_at();

-- =============================================================================
-- SECTION 9: ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles             enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.campaigns            enable row level security;
alter table public.ai_generations       enable row level security;
alter table public.usage_counters       enable row level security;
alter table public.cms_content          enable row level security;
alter table public.cms_versions         enable row level security;
alter table public.analytics_events     enable row level security;
alter table public.invoices             enable row level security;
alter table public.promotion_profiles   enable row level security;
alter table public.social_accounts      enable row level security;
alter table public.content_posts        enable row level security;
alter table public.content_runs         enable row level security;
alter table public.organizations        enable row level security;
alter table public.memberships          enable row level security;
alter table public.workspaces           enable row level security;
alter table public.brand_guardrails     enable row level security;
alter table public.approvals            enable row level security;
alter table public.audit_log            enable row level security;
alter table public.assets               enable row level security;
alter table public.tap_pending_charges  enable row level security;

-- profiles
drop policy if exists "profiles_self_read"   on public.profiles;
create policy "profiles_self_read"   on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- subscriptions
drop policy if exists "subs_self_read" on public.subscriptions;
create policy "subs_self_read" on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());

-- campaigns
drop policy if exists "campaigns_owner_all" on public.campaigns;
create policy "campaigns_owner_all" on public.campaigns for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

-- ai_generations
drop policy if exists "ai_owner_all" on public.ai_generations;
create policy "ai_owner_all" on public.ai_generations for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

-- usage_counters
drop policy if exists "usage_owner_all" on public.usage_counters;
create policy "usage_owner_all" on public.usage_counters for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);

-- cms_content
drop policy if exists "cms_public_read"  on public.cms_content;
create policy "cms_public_read"  on public.cms_content for select using (true);
drop policy if exists "cms_admin_write"  on public.cms_content;
create policy "cms_admin_write"  on public.cms_content for all using (public.is_admin()) with check (public.is_admin());

-- cms_versions
drop policy if exists "cms_versions_admin" on public.cms_versions;
create policy "cms_versions_admin" on public.cms_versions for all using (public.is_admin()) with check (public.is_admin());

-- analytics_events
drop policy if exists "analytics_admin_read"  on public.analytics_events;
create policy "analytics_admin_read"  on public.analytics_events for select using (public.is_admin());
drop policy if exists "analytics_self_insert" on public.analytics_events;
create policy "analytics_self_insert" on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);

-- invoices
drop policy if exists "invoices_self_read" on public.invoices;
create policy "invoices_self_read" on public.invoices for select using (auth.uid() = user_id or public.is_admin());

-- promotion_profiles
drop policy if exists "promotion_profiles_workspace_all" on public.promotion_profiles;
create policy "promotion_profiles_workspace_all" on public.promotion_profiles for all
  using (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager')))
  with check (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager')));

-- social_accounts
drop policy if exists "social_accounts_workspace_all" on public.social_accounts;
create policy "social_accounts_workspace_all" on public.social_accounts for all
  using (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager')))
  with check (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager')));

-- content_posts
drop policy if exists "content_posts_workspace_all" on public.content_posts;
create policy "content_posts_workspace_all" on public.content_posts for all
  using (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.is_workspace_member(workspace_id)))
  with check (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','creator')));

-- content_runs
drop policy if exists "content_runs_workspace_all" on public.content_runs;
create policy "content_runs_workspace_all" on public.content_runs for all
  using (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.is_workspace_member(workspace_id)))
  with check (public.is_admin() or auth.uid() = user_id or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','creator')));

-- organizations
drop policy if exists "organizations_member_read"  on public.organizations;
create policy "organizations_member_read" on public.organizations for select
  using (public.is_admin() or exists (select 1 from public.memberships m where m.org_id = organizations.id and m.user_id = auth.uid()));
drop policy if exists "organizations_owner_update" on public.organizations;
create policy "organizations_owner_update" on public.organizations for update
  using (public.is_admin() or public.user_org_role(id) in ('owner','admin'));

-- memberships
drop policy if exists "memberships_member_read"  on public.memberships;
create policy "memberships_member_read" on public.memberships for select
  using (public.is_admin() or auth.uid() = user_id or public.user_org_role(org_id) in ('owner','admin','manager'));
drop policy if exists "memberships_admin_write"  on public.memberships;
create policy "memberships_admin_write" on public.memberships for all
  using (public.is_admin() or public.user_org_role(org_id) in ('owner','admin'))
  with check (public.is_admin() or public.user_org_role(org_id) in ('owner','admin'));

-- workspaces
drop policy if exists "workspaces_member_read"   on public.workspaces;
create policy "workspaces_member_read" on public.workspaces for select
  using (public.is_admin() or public.is_workspace_member(id));
drop policy if exists "workspaces_manager_write" on public.workspaces;
create policy "workspaces_manager_write" on public.workspaces for all
  using (public.is_admin() or public.workspace_role(id) in ('owner','admin','manager'))
  with check (public.is_admin() or public.workspace_role(id) in ('owner','admin','manager'));

-- brand_guardrails
drop policy if exists "guardrails_member_read"   on public.brand_guardrails;
create policy "guardrails_member_read" on public.brand_guardrails for select
  using (public.is_admin() or public.is_workspace_member(workspace_id));
drop policy if exists "guardrails_manager_write" on public.brand_guardrails;
create policy "guardrails_manager_write" on public.brand_guardrails for all
  using (public.is_admin() or public.workspace_role(workspace_id) in ('owner','admin','manager'))
  with check (public.is_admin() or public.workspace_role(workspace_id) in ('owner','admin','manager'));

-- approvals
drop policy if exists "approvals_member_read"    on public.approvals;
create policy "approvals_member_read" on public.approvals for select
  using (public.is_admin() or auth.uid() = requested_by or auth.uid() = assigned_to or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','approver')));
drop policy if exists "approvals_approver_write" on public.approvals;
create policy "approvals_approver_write" on public.approvals for all
  using (public.is_admin() or auth.uid() = requested_by or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','approver')))
  with check (public.is_admin() or auth.uid() = requested_by or (workspace_id is not null and public.workspace_role(workspace_id) in ('owner','admin','manager','approver')));

-- audit_log
drop policy if exists "audit_log_select" on public.audit_log;
create policy "audit_log_select" on public.audit_log for select
  using (public.is_admin() or actor_id = auth.uid() or (org_id is not null and exists (select 1 from public.memberships m where m.org_id = audit_log.org_id and m.user_id = auth.uid())));
drop policy if exists "audit_log_insert" on public.audit_log;
create policy "audit_log_insert" on public.audit_log for insert with check (true);

-- assets
drop policy if exists "assets_member_select"  on public.assets;
create policy "assets_member_select"  on public.assets for select using (public.is_admin() or public.is_workspace_member(workspace_id));
drop policy if exists "assets_creator_insert" on public.assets;
create policy "assets_creator_insert" on public.assets for insert with check (public.is_admin() or public.workspace_role(workspace_id) in ('owner','admin','manager','creator'));
drop policy if exists "assets_manager_modify" on public.assets;
create policy "assets_manager_modify" on public.assets for update using (public.is_admin() or public.workspace_role(workspace_id) in ('owner','admin','manager'));
drop policy if exists "assets_manager_delete" on public.assets;
create policy "assets_manager_delete" on public.assets for delete using (public.is_admin() or public.workspace_role(workspace_id) in ('owner','admin','manager'));

-- tap_pending_charges
drop policy if exists "tap_pending_charges: owner read"     on public.tap_pending_charges;
create policy "tap_pending_charges: owner read"     on public.tap_pending_charges for select using (auth.uid() = user_id);
drop policy if exists "tap_pending_charges: service insert" on public.tap_pending_charges;
create policy "tap_pending_charges: service insert" on public.tap_pending_charges for insert with check (true);
drop policy if exists "tap_pending_charges: service update" on public.tap_pending_charges;
create policy "tap_pending_charges: service update" on public.tap_pending_charges for update using (true);

-- =============================================================================
-- SECTION 10: VIEWS
-- =============================================================================

create or replace view public.my_workspaces as
  select w.id, w.org_id, w.name, w.slug, w.auto_publish_enabled, w.created_at,
         o.name as org_name, o.plan as org_plan, m.role as member_role
  from public.workspaces w
  join public.organizations o on o.id = w.org_id
  join public.memberships   m on m.org_id = w.org_id and m.user_id = auth.uid();

create or replace view public.pending_approvals as
  select cp.*, w.name as workspace_name, o.name as org_name, m.role as reviewer_role
  from public.content_posts cp
  join public.workspaces    w on w.id = cp.workspace_id
  join public.organizations o on o.id = w.org_id
  join public.memberships   m on m.org_id = w.org_id and m.user_id = auth.uid()
  where cp.content_status = 'in_review'
    and m.role in ('owner','admin','manager','approver');

-- =============================================================================
-- SECTION 11: SEED DATA
-- =============================================================================

insert into public.cms_content (id, data)
values ('homepage', '{}'::jsonb)
on conflict (id) do nothing;
