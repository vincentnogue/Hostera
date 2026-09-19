-- =============================================================================
-- Hostera — platform_admin: add third owner, fix missing unique constraint
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-19.
--
-- platform_admin had no unique constraint on user_id at all, so the
-- ON CONFLICT DO NOTHING clauses in sync_platform_owner_admin() (see
-- platform-admin-table-empty-fix.sql) were silent no-ops — nothing to
-- actually conflict against. Re-running the owner-sync insert had already
-- produced a duplicate row for vincentnogue2@gmail.com. Deduped, then
-- added the constraint.
-- =============================================================================

delete from platform_admin a
using platform_admin b
where a.id > b.id and a.user_id = b.user_id;

alter table platform_admin add constraint platform_admin_user_id_key unique (user_id);

-- Third designated platform owner, alongside webdxb1@gmail.com and
-- vincentnogue2@gmail.com (see src/lib/platformAdmins.js PLATFORM_OWNERS).
insert into platform_admin (user_id, email, role)
select id, email, 'owner'
from auth.users
where lower(email) in ('webdxb1@gmail.com', 'vincentnogue2@gmail.com', 'vincentnogue@yahoo.com')
on conflict (user_id) do nothing;

create or replace function public.sync_platform_owner_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) in ('webdxb1@gmail.com', 'vincentnogue2@gmail.com', 'vincentnogue@yahoo.com') then
    insert into platform_admin (user_id, email, role)
    values (new.id, new.email, 'owner')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
