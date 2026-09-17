-- =============================================================================
-- Hostera — Ads/Sponsorship, Stripe commission tracking, and platform
-- cross-tenant read access.
-- =============================================================================
-- Run this in the Supabase SQL Editor AFTER schema.sql. Additive only —
-- nothing here drops or rewrites existing tables/data.
--
-- WHAT THIS FIXES: every /platform/* page (PlatformOverview, PlatformOrganizations,
-- etc.) already calls db.entities.Property.list(), db.entities.Reservation.list(),
-- etc. expecting platform-wide totals. Those entities are org-scoped, so today
-- a platform admin only ever sees their OWN organization's rows — both because
-- hosteraBackend.js's scoped() filters by the caller's organization_id, and
-- because RLS on every org-scoped table only allows is_org_member(organization_id).
-- This migration adds "or is_platform_admin()" to those policies; the matching
-- JS-side fix lives in hosteraBackend.js (isCurrentUserPlatformAdmin()).
--
-- WHAT THIS ADDS: ad_campaign / ad_metric (org-scoped — each hotel manages its
-- own sponsorship campaigns) and platform_commission / ad_pricing_setting
-- (platform-level — commission ledger and global ad rate config are platform
-- admin concerns, not per-tenant data).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New org-scoped tables: ad_campaign, ad_metric
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  new_org_scoped_tables text[] := array['ad_campaign', 'ad_metric'];
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

-- Helpful indexes for the two hot access patterns: a hotel listing its own
-- campaigns, and recording/aggregating metric events per campaign.
create index if not exists ad_campaign_org_idx on ad_campaign (organization_id);
create index if not exists ad_metric_org_idx on ad_metric (organization_id);
create index if not exists ad_metric_campaign_idx on ad_metric ((data->>'campaign_id'));

-- The public marketplace (Marketplace.jsx / PublicBooking.jsx) needs to read
-- active, approved top-listing/banner campaigns to actually render
-- sponsorship — without this, ad placements would only ever be visible to
-- the owning hotel, which defeats the point of paid placement. Scoped
-- tightly: anonymous/public visitors may only SELECT campaigns that are
-- both platform-approved and currently active, never write.
drop policy if exists "public can read active approved ad campaigns" on ad_campaign;
create policy "public can read active approved ad campaigns" on ad_campaign
  for select
  using (
    coalesce(data->>'moderation_status', 'pending') = 'approved'
    and coalesce(data->>'status', 'pending') = 'active'
    and (data->>'start_date')::timestamptz <= now()
    and (data->>'end_date')::timestamptz >= now()
  );

-- ---------------------------------------------------------------------------
-- 2. New platform-level tables: platform_commission, ad_pricing_setting
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  new_platform_tables text[] := array['platform_commission', 'ad_pricing_setting'];
begin
  foreach t in array new_platform_tables loop
    execute format($f$
      create table if not exists %I (
        id uuid primary key default gen_random_uuid(),
        data jsonb not null default '{}',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $f$, t);

    execute format('alter table %I enable row level security;', t);

    execute format($f$
      drop policy if exists "platform admins can access %I" on %I;
      create policy "platform admins can access %I" on %I
        for all
        using (is_platform_admin())
        with check (is_platform_admin());
    $f$, t, t, t, t);
  end loop;
end $$;

-- platform_commission rows are written by the Stripe webhook (functions/api/
-- stripe-webhook.js) using the Supabase service role key, which bypasses RLS
-- entirely — the policy above only governs what platform admins can read/
-- write from the browser (moderation, corrections).
create index if not exists platform_commission_hotel_idx on platform_commission ((data->>'hotel_id'));
create index if not exists platform_commission_booking_idx on platform_commission ((data->>'booking_id'));

-- ---------------------------------------------------------------------------
-- 3. Platform-admin cross-tenant READ access on every EXISTING org-scoped
--    table (from schema.sql). Re-creates each policy with the same shape
--    plus "or is_platform_admin()" — safe to re-run, and does not touch
--    table structure or data.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  existing_org_scoped_tables text[] := array[
    'booking_engine_setting','calendar_event','channel_connection',
    'document_template','expense','guest','guest_portal_config',
    'house_rule','housekeeping_task','integration_setting','inventory_item',
    'invoice','lost_item','loyalty_reward','loyalty_tier',
    'maintenance_ticket','marketing_campaign','notification','payment','property',
    'rate_plan','rate_rule','reservation','review','room','room_type',
    'shift','shift_log','staff_member','support_ticket','vendor'
  ];
begin
  foreach t in array existing_org_scoped_tables loop
    execute format($f$
      drop policy if exists "org members can access %I" on %I;
      create policy "org members can access %I" on %I
        for all
        using (is_org_member(organization_id) or is_platform_admin())
        with check (is_org_member(organization_id) or is_platform_admin());
    $f$, t, t, t, t);
  end loop;
end $$;

-- =============================================================================
-- After running this:
-- 1. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and SUPABASE_SERVICE_ROLE_KEY
--    as "Secret" type environment variables on the Cloudflare Pages project
--    (Settings > Environment variables) — same place GEMINI_API_KEY already
--    lives. They must never be prefixed VITE_ and never appear in wrangler.toml.
-- 2. Point your Stripe webhook endpoint at https://<your-domain>/api/stripe-webhook
--    listening for payment_intent.succeeded, and add its signing secret as
--    STRIPE_WEBHOOK_SECRET.
-- 3. platform_commission.commission_rate defaults to 8.00 (%) — see
--    functions/api/stripe-webhook.js if this ever needs to be configurable
--    per organization instead of platform-wide.
-- =============================================================================
