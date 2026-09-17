const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from 'react';
import { Megaphone, Check, X, Save, TrendingUp, Eye, MousePointerClick, Wallet } from 'lucide-react';
import { CAMPAIGN_TYPES, PRICING_MODELS, DEFAULT_AD_RATES, campaignStats } from '@/lib/ads';

// Cross-tenant on purpose: db.entities.AdCampaign / Organization skip the
// organization_id filter for platform admins (see isCurrentUserPlatformAdmin
// in hosteraBackend.js), so this page genuinely sees every hotel's
// campaigns, not just the admin's own org.
export default function PlatformAdManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [pricingRow, setPricingRow] = useState(null);
  const [rates, setRates] = useState(DEFAULT_AD_RATES);
  const [loading, setLoading] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [filter, setFilter] = useState('pending');

  const load = () => {
    setLoading(true);
    Promise.all([
      db.entities.AdCampaign.list('-created_date', 500),
      db.entities.AdMetric.list(undefined, 10000),
      db.entities.Organization.list(),
      db.entities.AdPricingSetting.list(),
    ])
      .then(([c, m, o, p]) => {
        setCampaigns(c || []);
        setMetrics(m || []);
        setOrgs(o || []);
        const row = (p || [])[0];
        setPricingRow(row || null);
        if (row) setRates({ ...DEFAULT_AD_RATES, ...row });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const orgName = (id) => orgs.find(o => o.id === id)?.name || '—';

  const filtered = useMemo(() => {
    if (filter === 'all') return campaigns;
    if (filter === 'pending') return campaigns.filter(c => (c.moderation_status || 'pending') === 'pending');
    return campaigns.filter(c => c.moderation_status === filter);
  }, [campaigns, filter]);

  const totals = useMemo(() => {
    const spend = campaigns.reduce((s, c) => s + (Number(c.budget_spent) || 0), 0);
    const impressions = metrics.filter(m => m.event_type === 'impression').length;
    const clicks = metrics.filter(m => m.event_type === 'click').length;
    return { spend, impressions, clicks, live: campaigns.filter(c => c.status === 'active' && c.moderation_status === 'approved').length };
  }, [campaigns, metrics]);

  const moderate = async (c, moderation_status) => {
    await db.entities.AdCampaign.update(c.id, { moderation_status });
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, moderation_status } : x));
  };

  const saveRates = async (e) => {
    e.preventDefault();
    setSavingRates(true);
    try {
      if (pricingRow) {
        await db.entities.AdPricingSetting.update(pricingRow.id, rates);
      } else {
        const created = await db.entities.AdPricingSetting.create(rates);
        setPricingRow(created);
      }
    } finally {
      setSavingRates(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-blue border-t-white rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-brand-blue" /> Ad Network</h1>
        <p className="text-sm text-white/40">Moderate sponsorship campaigns across every organization and set platform-wide ad rates.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ad Revenue', value: `$${totals.spend.toFixed(2)}`, icon: Wallet },
          { label: 'Live Campaigns', value: totals.live, icon: TrendingUp },
          { label: 'Impressions', value: totals.impressions.toLocaleString(), icon: Eye },
          { label: 'Clicks', value: totals.clicks.toLocaleString(), icon: MousePointerClick },
        ].map(k => (
          <div key={k.label} className="bg-brand-navy-900 border border-white/5 rounded-2xl p-4">
            <k.icon className="w-4 h-4 text-brand-blue mb-2" />
            <p className="text-lg font-bold text-white">{k.value}</p>
            <p className="text-xs text-white/40">{k.label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={saveRates} className="bg-brand-navy-900 border border-white/5 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Global ad rates</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'flat_rate_7d', label: 'Flat rate / 7d ($)' },
            { key: 'flat_rate_30d', label: 'Flat rate / 30d ($)' },
            { key: 'cpc_rate', label: 'CPC rate ($/click)' },
            { key: 'cpm_rate', label: 'CPM rate ($/1000 impr.)' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-white/40 mb-1 block">{f.label}</label>
              <input type="number" step="0.01" min="0" value={rates[f.key]}
                onChange={e => setRates({ ...rates, [f.key]: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-brand-blue" />
            </div>
          ))}
        </div>
        <button type="submit" disabled={savingRates} className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white text-sm font-semibold rounded-full hover:opacity-90 disabled:opacity-60">
          <Save className="w-4 h-4" /> {savingRates ? 'Saving…' : 'Save rates'}
        </button>
      </form>

      <div className="flex items-center gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filter === f ? 'bg-brand-blue text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-brand-navy-900 border border-white/5 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/40">No campaigns in this view.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/40 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Organization</th>
                <th className="text-left px-4 py-3">Campaign</th>
                <th className="text-left px-4 py-3">Pricing</th>
                <th className="text-left px-4 py-3">Performance</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(c => {
                const s = campaignStats(c, metrics);
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-white/80">{orgName(c.organization_id)}</td>
                    <td className="px-4 py-3 text-white/60">{CAMPAIGN_TYPES[c.campaign_type]?.label || c.campaign_type}</td>
                    <td className="px-4 py-3 text-white/60">{PRICING_MODELS[c.pricing_model]?.label || c.pricing_model}</td>
                    <td className="px-4 py-3 text-white/60">{s.impressions} impr · {s.clicks} clicks · {s.ctr.toFixed(1)}% CTR</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/50 capitalize">{c.moderation_status || 'pending'}</span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {c.moderation_status !== 'approved' && (
                        <button onClick={() => moderate(c, 'approved')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20">
                          <Check className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {c.moderation_status !== 'rejected' && (
                        <button onClick={() => moderate(c, 'rejected')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20">
                          <X className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
