-- Deep audit (2026-10-13): three real, exploitable issues found and already
-- applied live via Supabase MCP. This file documents them; nothing here
-- needs to be re-run manually.

-- 1. CRITICAL — cross-tenant data corruption.
-- auto_mark_no_shows() is SECURITY DEFINER, takes no arguments, and had
-- EXECUTE granted to `anon` and `authenticated`. Any unauthenticated visitor
-- could POST to /rest/v1/rpc/auto_mark_no_shows and it would loop over EVERY
-- organization on the platform, flipping every overdue confirmed/pending
-- reservation to 'no_show' and firing a notification — no auth check, no
-- org scoping, callable by anyone. Restricted to postgres/service_role so
-- it can still be driven by a cron job or the backend, never by a client.
revoke execute on function public.auto_mark_no_shows() from public;
revoke execute on function public.auto_mark_no_shows() from anon;
revoke execute on function public.auto_mark_no_shows() from authenticated;

-- 2. Guest PII leak across every tenant.
-- hotel_question had `for select using (true)` — completely unscoped.
-- PublicBooking.jsx calls HotelQuestion.list() and filters by property_id
-- only in the browser, so every anonymous visitor to any hotel's booking
-- page downloaded the ENTIRE platform's Q&A table: every other hotel's
-- questions, including guest_name on still-pending (unanswered) questions.
-- Narrowed to answered questions only, matching the certified_review /
-- house_rule precedent (status-gated public read).
alter policy "public can read hotel questions" on hotel_question
  using (coalesce(data->>'status', '') = 'answered');
-- (now named "public can read answered hotel questions")

-- 3. Hardening — function_search_path_mutable advisor warnings.
-- is_org_member / is_platform_admin / update_updated_at_column had no
-- SET search_path, which the Postgres/Supabase linter flags because a
-- SECURITY DEFINER function with a mutable search_path can be tricked by a
-- role that can create objects earlier in the path. No known exploit here
-- (none of these three take untrusted identifiers into dynamic SQL), but
-- pinned search_path = public on all three as defense in depth.
create or replace function public.is_org_member(org_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path = public
as $function$
  select exists (
    select 1 from memberships
    where organization_id = org_id and user_id = auth.uid()
  );
$function$;

create or replace function public.is_platform_admin()
 returns boolean
 language sql
 stable security definer
 set search_path = public
as $function$
  select exists (
    select 1 from platform_admin where user_id = auth.uid()
  );
$function$;

create or replace function public.update_updated_at_column()
 returns trigger
 language plpgsql
 set search_path = public
as $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

-- Verified live (as of this audit):
--   has_function_privilege('anon', 'public.auto_mark_no_shows()', 'EXECUTE') = false
--   has_function_privilege('authenticated', ...) = false
--   `set local role anon; select count(*) from hotel_question;` = 0 rows
--     visible (the one seed row in the project was status='pending')

-- Reviewed, not fixed (by design, left as-is):
--   - public.public_availability is a SECURITY DEFINER view (ERROR-level
--     advisor finding). Reviewed its definition: it only exposes
--     id/organization_id/property_id/room_type_id/room_id/check_in/
--     check_out/status from `reservation` — no guest_id, no guest name, no
--     money fields. It intentionally bypasses per-org RLS so anonymous
--     marketplace visitors can compute availability across properties they
--     aren't members of. Column list is minimal enough that this is an
--     accepted/intentional cross-tenant read, not a leak.
--   - booking_engine_setting and property/room_type "public can read ..."
--     policies are also intentionally unscoped by org (marketplace browse
--     flow reads across all organizations, then filters client-side by
--     property_id) and only expose non-sensitive operational flags
--     (direct_bookings_enabled, min_stay_default, require_deposit,
--     marketplace_visible, pricing) — not PII, left as-is.
--   - auth_leaked_password_protection (WARN): Supabase Auth setting, not
--     SQL — enable manually in Dashboard > Authentication > Policies >
--     "Leaked password protection".
--   - Performance advisor: 39 unindexed FKs, 10 auth_rls_initplan, 11
--     unused indexes, 83 multiple_permissive_policies. All INFO/WARN-level
--     performance lints, not correctness/security bugs — the
--     multiple_permissive_policies count is high because almost every
--     table legitimately has 2 policies (an org-member ALL policy + a
--     public SELECT policy for the marketplace/booking flow), which is the
--     intended design, not an accident. Left for a dedicated performance
--     pass rather than mixed into a security audit.
