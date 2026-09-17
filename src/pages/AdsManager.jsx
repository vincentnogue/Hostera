const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from 'react';
import { useProperty } from '@/lib/PropertyContext';
import { CAMPAIGN_TYPES, PRICING_MODELS, fetchAdPricing, campaignStats } from '@/lib/ads';
import { Megaphone, Plus, X, TrendingUp, MousePointerClick, Eye, Target, Wallet, Clock, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const STATUS_PILL = {
  active: 'bg-green-50 text-green-700',
  paused: 'bg-amber-50 text-amber-700',
  completed: 'bg-slate-100 text-slate-600',
  pending: 'bg-blue-50 text-brand-navy',
};

const MODERATION_BADGE = {
  approved: { icon: ShieldCheck, label: 'Approved', cls: 'text-green-600' },
  rejected: { icon: ShieldAlert, label: 'Rejected', cls: 'text-red-600' },
  pending: { icon: ShieldQuestion, label: 'Pending review', cls: 'text-amber-600' },
};

export default function AdsManager() {
  const { toast } = useToast();
  const { selectedProperty, properties } = useProperty();
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const property = selectedProperty || properties[0];

  const emptyForm = {
    campaign_type: 'top_listing',
    pricing_model: 'flat_rate',
    duration: '7d',
  };
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    Promise.all([
      db.entities.AdCampaign.list('-created_date', 200),
      db.entities.AdMetric.list(undefined, 5000),
      fetchAdPricing(),
    ])
      .then(([c, m, r]) => { setCampaigns(c || []); setMetrics(m || []); setRates(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const totals = useMemo(() => {
    const spent = campaigns.reduce((s, c) => s + (Number(c.budget_spent) || 0), 0);
    const budget = campaigns.reduce((s, c) => s + (Number(c.budget_total) || 0), 0);
    const impressions = metrics.filter(m => m.event_type === 'impression').length;
    const clicks = metrics.filter(m => m.event_type === 'click').length;
    const conversions = metrics.filter(m => m.event_type === 'conversion').length;
    return { spent, budget, impressions, clicks, conversions, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0 };
  }, [campaigns, metrics]);

  const estimatedCost = () => {
    if (!rates) return 0;
    if (form.pricing_model === 'flat_rate') return form.duration === '30d' ? rates.flat_rate_30d : rates.flat_rate_7d;
    if (form.pricing_model === 'cpc') return rates.cpc_rate;
    if (form.pricing_model === 'cpm') return rates.cpm_rate;
    return 0;
  };

  const createCampaign = async (e) => {
    e.preventDefault();
    if (!property) return;
    setSaving(true);
    try {
      const now = new Date();
      const days = form.pricing_model === 'flat_rate' ? (form.duration === '30d' ? 30 : 7) : 30;
      const end = new Date(now.getTime() + days * 86400000);
      const rate = estimatedCost();
      await db.entities.AdCampaign.create({
        property_id: property.id,
        campaign_type: form.campaign_type,
        pricing_model: form.pricing_model,
        cpc_or_cpm_rate: form.pricing_model === 'flat_rate' ? null : rate,
        budget_total: form.pricing_model === 'flat_rate' ? rate : (Number(form.budget_total) || 0),
        budget_spent: 0,
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        status: 'active',
        moderation_status: 'pending', // reviewed by a platform admin in /platform/ads
      });
      toast({ title: 'Campaign submitted', description: 'It goes live once a platform admin approves it.' });
      setShowAdd(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast({ title: 'Could not create campaign', description: String(err.message || err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c) => {
    const next = c.status === 'active' ? 'paused' : 'active';
    await db.entities.AdCampaign.update(c.id, { status: next });
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: next } : x));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2"><Megaphone className="w-5 h-5" /> Publicité &amp; Sponsorisation</h1>
          <p className="text-sm text-brand-navy/50">Sponsor your listing on the Hostera marketplace and track real performance.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> New campaign
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ad Spend', value: `$${totals.spent.toFixed(2)}`, icon: Wallet },
          { label: 'Impressions', value: totals.impressions.toLocaleString(), icon: Eye },
          { label: 'Clicks', value: totals.clicks.toLocaleString(), icon: MousePointerClick },
          { label: 'CTR', value: `${totals.ctr.toFixed(2)}%`, icon: TrendingUp },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-brand-border rounded-2xl p-4">
            <kpi.icon className="w-4 h-4 text-brand-navy/40 mb-2" />
            <p className="text-lg font-bold text-brand-navy">{kpi.value}</p>
            <p className="text-xs text-brand-navy/50">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-navy/50">No campaigns yet. Create one to get featured on the marketplace.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-bg/50 text-brand-navy/50 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Campaign</th>
                <th className="text-left px-4 py-3">Pricing</th>
                <th className="text-left px-4 py-3">Budget</th>
                <th className="text-left px-4 py-3">Impr. / Clicks / CTR</th>
                <th className="text-left px-4 py-3">Review</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {campaigns.map(c => {
                const s = campaignStats(c, metrics);
                const mod = MODERATION_BADGE[c.moderation_status || 'pending'];
                return (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-navy">{CAMPAIGN_TYPES[c.campaign_type]?.label || c.campaign_type}</p>
                      <p className="text-xs text-brand-navy/40 flex items-center gap-1"><Clock className="w-3 h-3" /> ends {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-brand-navy/70">{PRICING_MODELS[c.pricing_model]?.label || c.pricing_model}</td>
                    <td className="px-4 py-3">
                      <div className="w-28 h-1.5 bg-brand-bg rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-brand-navy" style={{ width: `${Math.min(100, ((c.budget_spent || 0) / (c.budget_total || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-brand-navy/50">${(c.budget_spent || 0).toFixed(2)} / ${(c.budget_total || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-brand-navy/70">{s.impressions} / {s.clicks} / {s.ctr.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${mod.cls}`}><mod.icon className="w-3.5 h-3.5" /> {mod.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_PILL[c.status] || STATUS_PILL.pending}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status !== 'completed' && (
                        <button onClick={() => toggleStatus(c)} className="text-xs font-semibold text-brand-navy hover:text-brand-blue">
                          {c.status === 'active' ? 'Pause' : 'Resume'}
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

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <form onSubmit={createCampaign} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-brand-navy flex items-center gap-2"><Target className="w-4 h-4" /> New campaign</h2>
              <button type="button" onClick={() => setShowAdd(false)}><X className="w-4 h-4" /></button>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Type</label>
              <select value={form.campaign_type} onChange={e => setForm({ ...form, campaign_type: e.target.value })} className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                {Object.entries(CAMPAIGN_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <p className="text-xs text-brand-navy/40 mt-1">{CAMPAIGN_TYPES[form.campaign_type]?.description}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Pricing model</label>
              <select value={form.pricing_model} onChange={e => setForm({ ...form, pricing_model: e.target.value })} className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                {Object.entries(PRICING_MODELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {form.pricing_model === 'flat_rate' && (
              <div>
                <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Duration</label>
                <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
              </div>
            )}

            {form.pricing_model !== 'flat_rate' && (
              <div>
                <label className="text-xs font-semibold text-brand-navy/60 mb-1 block">Total budget ($)</label>
                <input type="number" min="1" step="0.01" value={form.budget_total || ''} onChange={e => setForm({ ...form, budget_total: e.target.value })}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              </div>
            )}

            <div className="bg-brand-bg/60 rounded-2xl p-3 text-xs text-brand-navy/60">
              {form.pricing_model === 'flat_rate'
                ? <>Estimated cost: <strong>${estimatedCost().toFixed(2)}</strong> for {form.duration === '30d' ? '30' : '7'} days.</>
                : <>Rate: <strong>${estimatedCost().toFixed(2)}</strong> {form.pricing_model === 'cpc' ? 'per click' : 'per 1,000 impressions'}.</>}
            </div>

            <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
              {saving ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
