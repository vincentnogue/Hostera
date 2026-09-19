-- =============================================================================
-- Hostera — CRITICAL FIX #4: platform admins had NO cross-tenant access to
-- any core table (property, reservation, room, guest, payment, invoice, ...)
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-18.
--
-- A migration earlier in this session (add-ads-commissions-platform-
-- crosstenant.sql) was supposed to add "or is_platform_admin()" to every
-- one of these tables' policies. It did not take effect — verified
-- empirically: `property`'s only membership policy was still exactly the
-- original `is_org_member(organization_id)`, no admin bypass at all, and
-- impersonating the platform admin and querying `property` returned rows
-- only for organizations they happened to belong to (none, in practice).
--
-- This re-applies the same fix directly and verifies it this time:
-- impersonating the platform admin after this migration correctly returns
-- every property platform-wide, not just their own.
--
-- Also includes two org-scoped tables that existed in the schema but were
-- missing from the earlier migration's table list: breakage_report,
-- cash_register_session.
-- =============================================================================
do $$
declare
  t text;
  org_scoped_tables text[] := array[
    'booking_engine_setting','breakage_report','calendar_event','cash_register_session',
    'channel_connection','document_template','expense','guest','guest_portal_config',
    'house_rule','housekeeping_task','integration_setting','inventory_item',
    'invoice','lost_item','loyalty_reward','loyalty_tier',
    'maintenance_ticket','marketing_campaign','notification','payment','property',
    'rate_plan','rate_rule','reservation','review','room','room_type',
    'shift','shift_log','staff_member','support_ticket','vendor'
  ];
begin
  foreach t in array org_scoped_tables loop
    execute format($f$
      drop policy if exists "org members can access %I" on %I;
      create policy "org members can access %I" on %I
        for all
        using (is_org_member(organization_id) or is_platform_admin())
        with check (is_org_member(organization_id) or is_platform_admin());
    $f$, t, t, t, t);
  end loop;
end $$;
