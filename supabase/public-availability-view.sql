-- =============================================================================
-- Hostera — public_availability view (privacy-safe guest availability data)
-- =============================================================================
-- reservation has no public SELECT policy at all (correctly — it holds
-- guest names, emails, phone numbers), so PublicBooking.jsx's
-- Reservation.list() call always returned empty for anonymous guests.
-- The availability calendar was rendering off a call that could never
-- return real data, and there was no way to re-validate availability
-- before creating a new booking — meaning nothing prevented two guests
-- from booking the last room of a type for the same dates.
--
-- This view exposes only what's needed to compute availability — no
-- guest PII — with its own narrow public-read grant.
-- =============================================================================

create or replace view public_availability as
select
  id,
  organization_id,
  data->>'property_id' as property_id,
  data->>'room_type_id' as room_type_id,
  data->>'room_id' as room_id,
  data->>'check_in' as check_in,
  data->>'check_out' as check_out,
  data->>'status' as status
from reservation
where coalesce(data->>'status', '') not in ('cancelled', 'checked_out');

grant select on public_availability to anon, authenticated;
