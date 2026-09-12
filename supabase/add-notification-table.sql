-- =============================================================================
-- Hostera — Notification Center table
-- =============================================================================
-- OPTIONAL, ADDITIVE migration. Creates the `notification` table that was
-- missing from the original schema.sql's org_scoped_tables list (it has
-- since been added there too, for anyone re-running schema.sql fresh).
-- Matches the exact same shape and RLS pattern as every other org-scoped
-- table — safe to run even if schema.sql is later re-run in full, since
-- both use `create table if not exists`.
-- =============================================================================

create table if not exists notification (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organization(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notification enable row level security;

drop policy if exists "org members can access notification" on notification;
create policy "org members can access notification" on notification
  for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));
