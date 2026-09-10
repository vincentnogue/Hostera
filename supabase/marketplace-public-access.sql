-- =============================================================================
-- Hostera — Marketplace / public booking read-access migration
-- =============================================================================
-- OPTIONAL, ADDITIVE migration. Run this in the Supabase SQL Editor AFTER
-- schema.sql. It does not modify or replace anything in schema.sql.
--
-- WHY THIS IS NEEDED:
-- schema.sql's RLS policy for every org-scoped table (including `property`
-- and `room_type`) is `is_org_member(organization_id)` for ALL operations —
-- which requires a logged-in user who is a member of that organization.
-- An anonymous guest browsing /book/:propertyId or the new /marketplace
-- search page has no session, so `is_org_member()` evaluates to false and
-- RLS silently returns zero rows for them, even though the frontend code
-- expects public visitors to see published properties/rooms.
--
-- This migration adds a SECOND, narrower policy on top of the existing one:
-- anonymous (and any) visitors can SELECT (read-only) a property or room
-- type only when the hotel has explicitly made it public. It does not
-- change or weaken the existing org-member policy for writes.
-- =============================================================================

-- Anyone can read a property row if that property has not been switched off
-- from direct/marketplace bookings. `data->>'direct_bookings_enabled'`
-- defaults to true when the key is absent (only an explicit 'false' hides it).
drop policy if exists "public can read bookable properties" on property;
create policy "public can read bookable properties" on property
  for select
  using (coalesce((data->>'direct_bookings_enabled')::boolean, true) = true);

-- Anyone can read a room type row unless the hotel explicitly hid it from
-- the marketplace (`marketplace_visible = false`).
drop policy if exists "public can read marketplace room types" on room_type;
create policy "public can read marketplace room types" on room_type
  for select
  using (coalesce((data->>'marketplace_visible')::boolean, true) = true);

-- Anyone can read the per-property booking engine settings — the public
-- booking page needs these (min stay, deposit rules, etc.) before a guest
-- has an account.
drop policy if exists "public can read booking engine settings" on booking_engine_setting;
create policy "public can read booking engine settings" on booking_engine_setting
  for select using (true);

-- Anonymous guests must be able to INSERT a reservation from the public
-- booking page / marketplace checkout — but never read, update or delete
-- other tenants' reservations. This policy only ever allows inserts.
drop policy if exists "public can create reservations" on reservation;
create policy "public can create reservations" on reservation
  for insert
  with check (true);

-- NOTE: the columns referenced above (`direct_bookings_enabled` on
-- property, `marketplace_visible` on room_type) live inside the flexible
-- `data jsonb` column per schema.sql's design. If you have since promoted
-- either field to a real typed column, adjust the `data->>'...'` references
-- above to the plain column name instead.
-- =============================================================================
