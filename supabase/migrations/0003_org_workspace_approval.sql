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
