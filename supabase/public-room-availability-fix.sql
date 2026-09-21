-- =============================================================================
-- Hostera — CRITICAL FIX #6: the room table had zero public read access,
-- so the entire public booking availability calendar was non-functional
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-19.
--
-- `room`'s only RLS policy was is_org_member(organization_id) OR
-- is_platform_admin() — no public SELECT at all, unlike `property` and
-- `room_type`, which already had one (marketplace-public-access.sql).
--
-- AvailabilityCalendar.jsx's computeUnavailableDates() marks a date
-- unavailable when (rooms booked that night) >= (total rooms of that
-- type). Since an anonymous guest could never see any Room rows, "total
-- rooms" was always 0 for them — which the function short-circuits to
-- "nothing is unavailable". This was true both for the calendar UI AND
-- for PublicBooking.jsx's own pre-submit safety check (same empty rooms
-- array), so a guest could complete a booking for a room type that was
-- already fully sold out for those dates. Verified empirically:
-- impersonating the anon role and querying `room` returned 0 rows before
-- this fix, 14 (the real room inventory) after.
--
-- Room number/floor is operational detail, not guest PII — this matches
-- the same public-read pattern already granted to property and room_type.
-- =============================================================================

drop policy if exists "public can read rooms for availability" on room;
create policy "public can read rooms for availability" on room
  for select
  using (true);
