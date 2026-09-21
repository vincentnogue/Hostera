-- =============================================================================
-- Hostera — CRITICAL FIX #7: memberships only let a user see their OWN
-- row — Team Access could never show more than one person: yourself
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-19.
--
-- memberships' only SELECT policy was `user_id = auth.uid() OR
-- is_platform_admin()` — no policy let a regular org member see their
-- teammates' rows. TeamAccess.jsx's team listing (src/lib/hosteraBackend.js
-- userEntityClient.list()) queries memberships filtered by
-- organization_id to find who to show; for anyone but a platform admin,
-- RLS silently collapsed that to just their own row.
--
-- First attempt at the fix caused "infinite recursion detected in policy
-- for relation memberships" — a policy on a table can't directly
-- subquery that same table. Fixed using is_org_member(organization_id),
-- which is SECURITY DEFINER and so bypasses RLS for its own internal
-- lookup, the same pattern every other table's policies already use.
-- Verified empirically: a second membership became visible to another
-- org member only after this fix (1 row before, 2 after).
-- =============================================================================

drop policy if exists "org mates can view each other's memberships" on memberships;
create policy "org mates can view each other's memberships" on memberships
  for select
  using (
    user_id = auth.uid()
    or is_platform_admin()
    or is_org_member(organization_id)
  );
