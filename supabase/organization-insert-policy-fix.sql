-- =============================================================================
-- Hostera — CRITICAL FIX: organization had no INSERT policy at all
-- =============================================================================
-- This is why onboarding was completely dead: clicking "Continue" on
-- step 1 tried to create the organization (the very first write the
-- entire onboarding flow depends on), and RLS silently rejected it for
-- every single user, every time. organization only ever had:
--   - SELECT for existing members (is_org_member(id) — impossible before
--     the org exists)
--   - ALL for platform admins
-- No ordinary authenticated user has ever had permission to create a new
-- organization.
--
-- Any authenticated user can create exactly one new organization — there
-- is no membership to gate this by, since the org doesn't exist yet. The
-- existing on_organization_created trigger (see
-- critical-membership-and-storage-fix.sql) immediately grants them
-- 'owner' membership on creation, which is what makes every subsequent
-- write (Property, RoomType, ...) work correctly.
-- =============================================================================

drop policy if exists "authenticated users can create an organization" on organization;
create policy "authenticated users can create an organization" on organization
  for insert
  to authenticated
  with check (true);
