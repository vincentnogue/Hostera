-- =============================================================================
-- Hostera — Supabase schema scaffold
-- =============================================================================
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
--
-- WHAT THIS IS: a runnable starting point that matches the table names and
-- CRUD shape src/lib/hosteraBackend.js already expects (list/create/update/
-- delete), with multi-tenant row-level security wired in. It is NOT a
-- hand-modeled production schema — the entity-specific fields are stored in
-- a flexible `data jsonb` column because the real field-level data model
-- (what a Reservation or a RoomType actually needs) isn't known from the
-- frontend code alone. Review each table, promote the columns you query/
-- filter/sort on often (e.g. `status`, `check_in_date`) to real typed
-- columns for performance and constraints, and drop `data` once you do.
--
-- MULTI-TENANT ISOLATION: every org-scoped table gets an `organization_id`
-- column + a RLS policy restricting access to rows belonging to the
-- organizations the current user is a member of (via `memberships`).
-- Platform-level tables (see PLATFORM_LEVEL_ENTITIES in hosteraBackend.js)
-- are NOT organization-scoped; they use a `platform_admins` check instead.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Core: organizations & membership (drives every RLS policy below)
-- ---------------------------------------------------------------------------
create table if not exists organization (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memberships (
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references organization(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create table if not exists platform_admin (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text default 'admin',
  added_by text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Helper: is the current user a member of this organization?
create or replace function is_org_member(org_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from memberships
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

-- Helper: is the current user a platform admin?
create or replace function is_platform_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from platform_admin where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Org-scoped tables (tenant data — isolated by organization_id)
-- ---------------------------------------------------------------------------
-- One block per entity used in src/pages/**. All share the same shape:
-- id, organization_id, a flexible `data` column, timestamps.

do $$
declare
  t text;
  org_scoped_tables text[] := array[
    'booking_engine_setting','calendar_event','channel_connection',
    'document_template','expense','guest','guest_portal_config',
    'house_rule','housekeeping_task','integration_setting','inventory_item',
    'invoice','lost_item','loyalty_reward','loyalty_tier',
    'maintenance_ticket','marketing_campaign','notification','payment','property',
    'rate_plan','rate_rule','reservation','review','room','room_type',
    'shift','shift_log','staff_member','support_ticket','vendor'
  ];
begin
  foreach t in array org_scoped_tables loop
    execute format($f$
      create table if not exists %I (
        id uuid primary key default gen_random_uuid(),
        organization_id uuid not null references organization(id) on delete cascade,
        data jsonb not null default '{}',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('alter table %I enable row level security;', t);

    execute format($f$
      drop policy if exists "org members can access %I" on %I;
      create policy "org members can access %I" on %I
        for all
        using (is_org_member(organization_id))
        with check (is_org_member(organization_id));
    $f$, t, t, t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Platform-level tables (cross-tenant — platform admins only)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  platform_tables text[] := array[
    'platform_announcement','platform_incident','platform_subscription',
    'commercial_code','subscription_setting','subscription_payment_method',
    'audit_log','security_alert','feature_flag'
  ];
begin
  foreach t in array platform_tables loop
    execute format($f$
      create table if not exists %I (
        id uuid primary key default gen_random_uuid(),
        data jsonb not null default '{}',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('alter table %I enable row level security;', t);

    execute format($f$
      drop policy if exists "platform admins can access %I" on %I;
      create policy "platform admins can access %I" on %I
        for all
        using (is_platform_admin())
        with check (is_platform_admin());
    $f$, t, t, t, t);
  end loop;
end $$;

-- organization and platform_admin themselves: platform admins manage both;
-- org members can read (not write) their own organization row.
alter table organization enable row level security;
drop policy if exists "org members can read own org" on organization;
create policy "org members can read own org" on organization
  for select using (is_org_member(id) or is_platform_admin());
drop policy if exists "platform admins manage orgs" on organization;
create policy "platform admins manage orgs" on organization
  for all using (is_platform_admin()) with check (is_platform_admin());

alter table platform_admin enable row level security;
drop policy if exists "platform admins manage platform_admin" on platform_admin;
create policy "platform admins manage platform_admin" on platform_admin
  for all using (is_platform_admin()) with check (is_platform_admin());

alter table memberships enable row level security;
drop policy if exists "users can read own memberships" on memberships;
create policy "users can read own memberships" on memberships
  for select using (user_id = auth.uid() or is_platform_admin());
drop policy if exists "platform admins manage memberships" on memberships;
create policy "platform admins manage memberships" on memberships
  for all using (is_platform_admin()) with check (is_platform_admin());

-- =============================================================================
-- After running this: set organization_id on a user's account by updating
-- their auth user_metadata, e.g. from the SQL editor or a signup trigger:
--   update auth.users set raw_user_meta_data =
--     raw_user_meta_data || jsonb_build_object('organization_id', '<uuid>')
--     where id = '<user-uuid>';
-- hosteraBackend.js reads organization_id from user_metadata to scope every
-- entities.X.list()/create()/update()/delete() call automatically.
-- =============================================================================
