-- Run this in the Supabase SQL Editor to add the two tables for the new
-- Breakage & Damage and Cash Register modules — these didn't exist in the
-- original supabase/schema.sql run. Same pattern as every other org-scoped
-- table there: id, organization_id, data jsonb, timestamps, RLS via
-- is_org_member(organization_id).

do $$
declare
  t text;
  new_tables text[] := array['breakage_report', 'cash_register_session'];
begin
  foreach t in array new_tables loop
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
