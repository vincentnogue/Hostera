-- =============================================================================
-- Hostera — public read access for published house rules
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-19.
--
-- house_rule had no public SELECT policy at all — staff could manage
-- rules (HouseRules.jsx) but there was no way for an anonymous guest to
-- ever read them, and nothing in the app displayed them either (now
-- fixed in PublicBooking.jsx). Only the published version is exposed;
-- drafts and archived versions stay staff-only.
-- =============================================================================

drop policy if exists "public can read published house rules" on house_rule;
create policy "public can read published house rules" on house_rule
  for select
  using (coalesce(data->>'status', '') = 'published');
