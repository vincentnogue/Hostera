-- =============================================================================
-- Hostera — CRITICAL FIX #2: organization creation still failed after the
-- INSERT policy fix, because of an INSERT...RETURNING vs SELECT-policy race
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-18. This file documents that change so
-- the repo's migration history stays complete and reproducible elsewhere
-- (e.g. a staging project).
--
-- Diagnosis (verified empirically by impersonating a real stuck user and
-- running the exact query Supabase's JS client issues):
--   - The "authenticated users can create an organization" INSERT policy
--     (see organization-insert-policy-fix.sql) is correct and was already
--     live. A bare INSERT succeeded.
--   - But hosteraBackend.js's create() does `.insert(row).select().single()`,
--     which PostgREST executes as `INSERT ... RETURNING *`. Postgres checks
--     RETURNING rows against SELECT policies too (this is the same
--     mechanism behind the well-documented "Storage 403: new row violates
--     row-level security policy on upload" issue).
--   - organization's only SELECT policy was is_org_member(id), which
--     depends on the on_organization_created AFTER trigger having inserted
--     a membership row — but that trigger's effect is not visible yet at
--     RETURNING-evaluation time within the same statement.
--   - Net effect: 100% of signups failed at onboarding step 1, silently.
--     Verified: 14 auth.users existed, 0 organizations, 0 memberships.
--
-- Fix: track the creator directly on the row (no trigger-timing
-- dependency), and let them read back their own freshly created org
-- immediately — in addition to (not instead of) the existing
-- membership-based access for ongoing reads.
-- =============================================================================

alter table organization add column if not exists created_by uuid references auth.users(id) default auth.uid();

drop policy if exists "creator can read own newly created org" on organization;
create policy "creator can read own newly created org" on organization
  for select
  to authenticated
  using (created_by = auth.uid());
