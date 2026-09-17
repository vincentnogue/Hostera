-- =============================================================================
-- Hostera — Certified Reviews, Guest Q&A, and Experiences Marketplace
-- =============================================================================
-- Run in the Supabase SQL Editor AFTER schema.sql and
-- add-ads-commissions-platform-crosstenant.sql. Additive only.
--
-- Distinct from the existing `review` table (used by Reputation.jsx /
-- ReputationManagement.jsx to manually log & respond to reviews imported
-- from Google/Booking.com/TripAdvisor/Expedia): `certified_review` can only
-- be created by a guest with their own account from the Guest Portal
-- (GuestPortal.jsx), and only once their reservation's status is
-- 'checked_out' — that gating is enforced both in the UI and, below, at
-- the RLS level via a subquery against `reservation`.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New org-scoped tables
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  new_org_scoped_tables text[] := array['certified_review', 'hotel_question', 'experience', 'experience_booking'];
begin
  foreach t in array new_org_scoped_tables loop
    execute format($f$
      create table if not exists %I (
        id uuid primary key default gen_random_uuid(),
        organization_id uuid not null references organization(id) on delete cascade,
        data jsonb not null default '{}',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('alter table %I enable row level security;', t);

    execute format($f$
      drop policy if exists "org members can access %I" on %I;
      create policy "org members can access %I" on %I
        for all
        using (is_org_member(organization_id) or is_platform_admin())
        with check (is_org_member(organization_id) or is_platform_admin());
    $f$, t, t, t, t);
  end loop;
end $$;

create index if not exists certified_review_property_idx on certified_review ((data->>'property_id'));
create index if not exists certified_review_reservation_idx on certified_review ((data->>'reservation_id'));
create index if not exists hotel_question_property_idx on hotel_question ((data->>'property_id'));
create index if not exists experience_property_idx on experience ((data->>'property_id'));
create index if not exists experience_booking_experience_idx on experience_booking ((data->>'experience_id'));

-- ---------------------------------------------------------------------------
-- 2. certified_review — one per reservation, only after checkout
-- ---------------------------------------------------------------------------
-- A guest may only insert a review for a reservation that (a) belongs to
-- them (is_org_member already covers "logged in, same org as the property"
-- since a guest account's organization_id is set to the hotel's org on
-- signup/invite — see AGENTS.md / onboarding flow) and (b) is actually
-- checked_out. This is the real enforcement — GuestPortal.jsx hiding the
-- form for non-checked-out stays is just UX, not the security boundary.
drop policy if exists "guests can certify a review after checkout" on certified_review;
create policy "guests can certify a review after checkout" on certified_review
  for insert
  with check (
    is_org_member(organization_id)
    and exists (
      select 1 from reservation r
      where r.id = (data->>'reservation_id')::uuid
        and r.organization_id = certified_review.organization_id
        and coalesce(r.data->>'status', '') = 'checked_out'
    )
  );

-- Published certified reviews are the whole point of a public review
-- system — anyone can read them on the marketplace / property page.
drop policy if exists "public can read published certified reviews" on certified_review;
create policy "public can read published certified reviews" on certified_review
  for select
  using (coalesce(data->>'status', 'published') = 'published');

-- ---------------------------------------------------------------------------
-- 3. hotel_question — public Q&A on a property's listing
-- ---------------------------------------------------------------------------
drop policy if exists "public can ask a question" on hotel_question;
create policy "public can ask a question" on hotel_question
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can read hotel questions" on hotel_question;
create policy "public can read hotel questions" on hotel_question
  for select
  using (true);

-- ---------------------------------------------------------------------------
-- 4. experience — hotel-curated local activities/tours, and their bookings
-- ---------------------------------------------------------------------------
drop policy if exists "public can read active experiences" on experience;
create policy "public can read active experiences" on experience
  for select
  using (coalesce(data->>'status', 'active') = 'active');

-- Guests book experiences the same way they book a room: an anonymous,
-- insert-only write (see "public can create reservations" in
-- marketplace-public-access.sql for the identical pattern).
drop policy if exists "public can request an experience booking" on experience_booking;
create policy "public can request an experience booking" on experience_booking
  for insert
  to anon, authenticated
  with check (true);

-- =============================================================================
-- Nothing here needs a new Cloudflare secret — certified reviews, Q&A and
-- experience bookings are all recorded directly through the normal
-- db.entities.* client, same as every other entity in this app.
-- =============================================================================
