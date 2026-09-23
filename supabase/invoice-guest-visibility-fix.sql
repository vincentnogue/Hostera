-- =============================================================================
-- Hostera — guests can read their own invoices
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-19.
--
-- Same gap as certified_review before it: invoice was only readable by
-- is_org_member()/is_platform_admin() — a real guest (GuestDashboard.jsx,
-- guest_id = auth.uid()) could never see their own invoice, even now that
-- invoices are actually generated on checkout (see invoicing-fix commit).
-- invoice.guest_id is set directly at generation time
-- (src/lib/invoicing.js), so this checks it directly without needing to
-- join reservation.
-- =============================================================================

drop policy if exists "guests can read their own invoices" on invoice;
create policy "guests can read their own invoices" on invoice
  for select
  using ((data->>'guest_id')::uuid = auth.uid());
