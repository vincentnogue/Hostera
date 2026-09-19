-- =============================================================================
-- Hostera — CRITICAL FIX #5: subscription_setting / subscription_payment_method
-- had no organization_id and were platform-admin-only — broken for every
-- regular business user
-- =============================================================================
-- STATUS: already applied directly to the live Supabase project via the
-- Supabase MCP connector on 2026-09-19.
--
-- Both tables had zero organization_id column and their only RLS policy
-- was is_platform_admin(). Since SubscriptionSetting/SubscriptionPaymentMethod
-- were also classified as platform-level entities in hosteraBackend.js (no
-- org filtering applied client-side either), a regular hotel user opening
-- Subscription.jsx would get zero rows back (RLS blocks the read), then the
-- fallback "create a starter trial row" would ALSO fail under the same
-- policy, leaving `settings` null while the render already assumed it
-- existed (`settings.plan`) — the page would break for every non-admin
-- account.
--
-- Also fixed in this session: getCurrentUser()'s organization_id used to
-- read from Supabase Auth user_metadata, which nothing in the app ever
-- writes to — it was permanently null for every user. Every org-scoped
-- create() call that relies on that fallback (i.e. doesn't pass
-- organization_id explicitly) was silently failing the same way the
-- onboarding room-type bug did. Fixed by resolving organization_id from a
-- live `memberships` lookup instead (see hosteraBackend.js).
-- =============================================================================

alter table subscription_setting add column if not exists organization_id uuid references organization(id) on delete cascade;
alter table subscription_payment_method add column if not exists organization_id uuid references organization(id) on delete cascade;

drop policy if exists "platform admins can access subscription_setting" on subscription_setting;
create policy "org members can access subscription_setting" on subscription_setting
  for all
  using (is_org_member(organization_id) or is_platform_admin())
  with check (is_org_member(organization_id) or is_platform_admin());

drop policy if exists "platform admins can access subscription_payment_method" on subscription_payment_method;
create policy "org members can access subscription_payment_method" on subscription_payment_method
  for all
  using (is_org_member(organization_id) or is_platform_admin())
  with check (is_org_member(organization_id) or is_platform_admin());

create index if not exists subscription_setting_org_idx on subscription_setting (organization_id);
create index if not exists subscription_payment_method_org_idx on subscription_payment_method (organization_id);

-- =============================================================================
-- After running this, also set these Cloudflare "Secret" env vars for the
-- PSPs you actually plan to use (functions/api/create-subscription-checkout.js
-- and functions/api/subscription-webhook.js):
--   STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET              (already documented earlier)
--   FLUTTERWAVE_SECRET_KEY / FLUTTERWAVE_WEBHOOK_SECRET_HASH
--   PAYSTACK_SECRET_KEY   (also used to verify its own webhook signature)
--   PADDLE_API_KEY / PADDLE_WEBHOOK_SECRET, plus plain (non-secret) vars
--     PADDLE_PRICE_ID_<PLAN>_<MONTHLY|ANNUAL> for each plan in src/lib/marketing.js
--   PAYUNIT_API_KEY / PAYUNIT_API_SECRET / PAYUNIT_WEBHOOK_SECRET
--     (PayUnit's exact request/webhook shape hasn't been verified against a
--     live account — test in their sandbox before relying on it)
-- Register each provider's webhook at:
--   https://<your-domain>/api/subscription-webhook?psp=<stripe|flutterwave|paystack|paddle|payunit>
-- =============================================================================
