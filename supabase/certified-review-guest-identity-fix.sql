-- =============================================================================
-- Hostera — CRITICAL FIX #8: certified_review's guest-identity model was
-- wrong, so real guests could never actually submit one
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-19.
--
-- There are two entirely separate guest experiences in this app:
--   1. PublicBooking.jsx — anonymous, per-property direct link, no account
--      at all, reservation.guest_id is never set.
--   2. GuestDashboard.jsx (/guest) — a real "individual" account_type
--      login where a traveler books and later sees "My stays". RLS
--      already correctly grants these guests access to their OWN
--      reservations via `(reservation.guest_id)::uuid = auth.uid()` — NOT
--      via org membership, since a guest should never be an org member of
--      the hotel's own business account.
--
-- The certified_review INSERT policy required is_org_member(organization_id)
-- — the wrong mental model, assuming a hotel STAFF member (who IS an org
-- member) would be the one submitting a review on behalf of/as the guest.
-- The only reachable, correct guest-review flow (GuestDashboard.jsx,
-- where guest_id genuinely equals auth.uid()) could never actually
-- insert a row. Fixed to check the reservation's actual guest_id instead
-- (or org membership, kept for any other legitimate internal path).
--
-- Known remaining gap, not fixed here: a guest who books through the
-- anonymous PublicBooking.jsx flow (no account, no guest_id) still has no
-- path to ever leave a certified review — that would need a new
-- token/magic-link mechanism tied to their reservation_number + email,
-- which is a larger feature, not a policy fix.
-- =============================================================================

drop policy if exists "guests can certify a review after checkout" on certified_review;
create policy "guests can certify a review after checkout" on certified_review
  for insert
  with check (
    exists (
      select 1 from reservation r
      where r.id = (data->>'reservation_id')::uuid
        and r.organization_id = certified_review.organization_id
        and coalesce(r.data->>'status', '') = 'checked_out'
        and (
          is_org_member(certified_review.organization_id)
          or (r.data->>'guest_id')::uuid = auth.uid()
        )
    )
  );
