-- =============================================================================
-- Hostera — CRITICAL FIX #3: platform_admin table was completely empty
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-18.
--
-- is_platform_admin() — used by nearly every cross-tenant RLS policy added
-- this session (organizations, ad campaign moderation, platform_commission,
-- and the base organization/property/reservation/... policies) — checks
-- membership in the `platform_admin` table. That table had zero rows.
--
-- Meanwhile the frontend (src/lib/platformAdmins.js PLATFORM_OWNERS list)
-- independently treats webdxb1@gmail.com and vincentnogue2@gmail.com as
-- platform admins and shows them the SuperAdmin UI. So a platform owner
-- logging in would see the /platform/verifications page render, but every
-- query behind it silently returned zero rows — including a genuinely
-- pending organization sitting right there in the database. Verified live:
-- before this fix, impersonating vincentnogue2@gmail.com and querying
-- `organization` returned 0 rows and is_platform_admin() = false; after,
-- it correctly returns the row and is_platform_admin() = true.
-- =============================================================================

insert into platform_admin (user_id, email, role)
select id, email, 'owner'
from auth.users
where lower(email) in ('webdxb1@gmail.com', 'vincentnogue2@gmail.com')
on conflict do nothing;

-- Keeps this in sync automatically if either owner email signs up later
-- (or a currently-unregistered one finally does) — no manual SQL step
-- required again.
create or replace function public.sync_platform_owner_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) in ('webdxb1@gmail.com', 'vincentnogue2@gmail.com') then
    insert into platform_admin (user_id, email, role)
    values (new.id, new.email, 'owner')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_platform_owner_signup on auth.users;
create trigger on_platform_owner_signup
  after insert on auth.users
  for each row
  execute function public.sync_platform_owner_admin();
