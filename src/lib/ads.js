// Ads / Sponsorship shared helpers.
//
// ad_campaign and ad_metric are plain org-scoped Hostera entities (see
// supabase/add-ads-commissions-platform-crosstenant.sql) — db.entities.
// AdCampaign / db.entities.AdMetric work exactly like every other entity in
// this app (list/filter/create/update/delete), no special-casing needed.
//
// A campaign only appears on the public Marketplace once BOTH:
//   - a platform admin has set moderation_status = 'approved' (Ad Manager)
//   - the hotel has set status = 'active' and it's within start/end dates
// (also enforced server-side by the "public can read active approved ad
// campaigns" RLS policy — this file's filtering is a UX convenience, not
// the security boundary).
const db = () => globalThis.__B44_DB__;

export const CAMPAIGN_TYPES = {
  top_listing: { label: 'Top Listing', description: 'Appears first in marketplace search results' },
  display_banner: { label: 'Display Banner', description: 'Featured banner on the marketplace homepage' },
  similar_properties: { label: 'Recommended Hotel', description: 'Shown in "You might also like" on other listings' },
};

export const PRICING_MODELS = {
  flat_rate: { label: 'Flat rate (duration)' },
  cpc: { label: 'Cost per Click (CPC)' },
  cpm: { label: 'Cost per 1,000 Impressions (CPM)' },
};

export const DEFAULT_AD_RATES = {
  flat_rate_7d: 49,
  flat_rate_30d: 149,
  cpc_rate: 0.35,
  cpm_rate: 4.5,
};

// Platform-wide pricing is a single settings row (platform-level entity —
// only platform admins can write it; anyone authenticated can read it to
// price their own campaign before submitting).
export async function fetchAdPricing() {
  try {
    const rows = await db().entities.AdPricingSetting.list();
    return { ...DEFAULT_AD_RATES, ...(rows?.[0] || {}) };
  } catch {
    return DEFAULT_AD_RATES;
  }
}

export function isCampaignLive(campaign) {
  if (!campaign) return false;
  const now = Date.now();
  const start = campaign.start_date ? new Date(campaign.start_date).getTime() : 0;
  const end = campaign.end_date ? new Date(campaign.end_date).getTime() : Infinity;
  return campaign.moderation_status === 'approved'
    && campaign.status === 'active'
    && now >= start && now <= end
    && (campaign.budget_spent || 0) < (campaign.budget_total || 0);
}

// Records one impression/click/conversion event and, for CPC/CPM campaigns,
// deducts the spend from the campaign's budget so pacing actually works
// (a CPC campaign that never runs out of budget isn't a real ad product).
// Best-effort: a failed metric write should never block the guest's page.
export async function recordAdEvent(campaign, eventType) {
  if (!campaign?.id) return;
  try {
    await db().entities.AdMetric.create({
      campaign_id: campaign.id,
      organization_id: campaign.organization_id,
      event_type: eventType, // 'impression' | 'click' | 'conversion'
    });

    if (campaign.pricing_model === 'cpc' && eventType === 'click') {
      const cost = Number(campaign.cpc_or_cpm_rate) || 0;
      await db().entities.AdCampaign.update(campaign.id, {
        budget_spent: Math.min((campaign.budget_spent || 0) + cost, campaign.budget_total || 0),
      });
    }
    if (campaign.pricing_model === 'cpm' && eventType === 'impression') {
      const costPerImpression = (Number(campaign.cpc_or_cpm_rate) || 0) / 1000;
      await db().entities.AdCampaign.update(campaign.id, {
        budget_spent: Math.min((campaign.budget_spent || 0) + costPerImpression, campaign.budget_total || 0),
      });
    }
  } catch {
    /* metrics are best-effort */
  }
}

export function campaignStats(campaign, metrics) {
  const own = metrics.filter(m => m.campaign_id === campaign.id);
  const impressions = own.filter(m => m.event_type === 'impression').length;
  const clicks = own.filter(m => m.event_type === 'click').length;
  const conversions = own.filter(m => m.event_type === 'conversion').length;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  return { impressions, clicks, conversions, ctr };
}
