const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Tag, Plus, X, Calendar, Percent, Zap } from 'lucide-react';

const seasons = ['standard', 'high', 'low', 'peak', 'weekend', 'custom'];
const ruleTypes = { discount: { label: 'Discount', pill: 'bg-green-50 text-green-700' }, surcharge: { label: 'Surcharge', pill: 'bg-amber-50 text-amber-700' }, dynamic_pricing: { label: 'Dynamic Pricing', pill: 'bg-blue-50 text-brand-navy' } };

export default function RateManager() {
  const { selectedProperty } = useProperty();
  const [plans, setPlans] = useState([]);
  const [rules, setRules] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('plans');
  const [dialog, setDialog] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', season: 'standard', price: 0, min_stay: 1, start_date: '', end_date: '' });
  const [ruleForm, setRuleForm] = useState({ name: '', rule_type: 'discount', value_percent: 10, min_occupancy_percent: 80, min_stay: 0, applies_to: 'all', priority: 1 });

  useEffect(() => {
    Promise.all([
      db.entities.RatePlan.list(),
      db.entities.RateRule.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([p, r, props]) => { setPlans(p || []); setRules(r || []); setProperties(props || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentProperty = selectedProperty || properties[0];
  const propertyId = currentProperty?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const savePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name || !propertyId) return;
    const created = await db.entities.RatePlan.create({ ...planForm, property_id: propertyId, currency: currentProperty?.currency || 'USD', status: 'active' });
    setPlans(prev => [...prev, created]);
    setPlanForm({ name: '', season: 'standard', price: 0, min_stay: 1, start_date: '', end_date: '' });
    setDialog(null);
  };

  const saveRule = async (e) => {
    e.preventDefault();
    if (!ruleForm.name || !propertyId) return;
    const created = await db.entities.RateRule.create({ ...ruleForm, property_id: propertyId, status: 'active' });
    setRules(prev => [...prev, created]);
    setRuleForm({ name: '', rule_type: 'discount', value_percent: 10, min_occupancy_percent: 80, min_stay: 0, applies_to: 'all', priority: 1 });
    setDialog(null);
  };

  const toggle = async (item, kind) => {
    const next = item.status === 'active' ? 'inactive' : 'active';
    await db.entities[kind].update(item.id, { status: next });
    const setter = kind === 'RatePlan' ? setPlans : setRules;
    setter(prev => prev.map(x => x.id === item.id ? { ...x, status: next } : x));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Rate Manager</h1>
        <p className="text-sm text-brand-slate">Seasonal pricing, discount tiers and dynamic rate rules.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Rate Plans', value: plans.filter(p => p.status === 'active').length },
          { label: 'Active Rules', value: rules.filter(r => r.status === 'active').length },
          { label: 'Avg Base Price', value: plans.length ? `$${Math.round(plans.reduce((s, p) => s + (p.price || 0), 0) / plans.length)}` : '—' },
          { label: 'Discount Rules', value: rules.filter(r => r.rule_type === 'discount').length },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
            <p className="text-xl font-bold text-brand-ink">{k.value}</p>
            <p className="text-[11px] text-brand-slate">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setTab('plans')} className={`px-4 py-2 text-sm font-medium rounded-full ${tab === 'plans' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>Seasonal Rate Plans</button>
          <button onClick={() => setTab('rules')} className={`px-4 py-2 text-sm font-medium rounded-full ${tab === 'rules' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>Dynamic Rules & Discounts</button>
        </div>
        <button onClick={() => setDialog(tab === 'plans' ? 'plan' : 'rule')} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> {tab === 'plans' ? 'New Rate Plan' : 'New Rule'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading rates…</p>
      ) : tab === 'plans' ? (
        plans.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
            <Tag className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No rate plans yet — create seasonal pricing first.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-border overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-brand-bg border-b border-brand-border text-left text-xs text-brand-slate">
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Season</th>
                  <th className="px-5 py-3 font-semibold">Price / Night</th>
                  <th className="px-5 py-3 font-semibold">Min Stay</th>
                  <th className="px-5 py-3 font-semibold">Dates</th>
                  <th className="px-5 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id} className="border-b border-[#F1F5F9] last:border-0">
                    <td className="px-5 py-3.5 font-medium text-brand-ink">{p.name}</td>
                    <td className="px-5 py-3.5"><span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-brand-navy capitalize">{p.season}</span></td>
                    <td className="px-5 py-3.5 font-semibold text-brand-ink">${p.price}</td>
                    <td className="px-5 py-3.5 text-brand-slate">{p.min_stay} night{p.min_stay > 1 ? 's' : ''}</td>
                    <td className="px-5 py-3.5 text-brand-slate">
                      {p.start_date ? `${new Date(p.start_date).toLocaleDateString()} → ${p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}` : 'Year-round'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => toggle(p, 'RatePlan')} className={`text-[11px] px-3 py-1.5 rounded-full font-semibold ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        rules.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
            <Zap className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No dynamic rules yet — automate discounts and surcharges.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.sort((a, b) => (a.priority || 0) - (b.priority || 0)).map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-brand-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center">
                      {r.rule_type === 'dynamic_pricing' ? <Zap className="w-4 h-4 text-brand-navy" /> : <Percent className="w-4 h-4 text-brand-navy" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-ink">{r.name}</p>
                      <p className="text-[11px] text-brand-slate">Priority {r.priority}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${ruleTypes[r.rule_type]?.pill}`}>{ruleTypes[r.rule_type]?.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 bg-brand-bg rounded-xl">
                    <p className="text-[10px] text-brand-slate-light uppercase">Value</p>
                    <p className="text-sm font-bold text-brand-ink">{r.value_percent}%</p>
                  </div>
                  <div className="p-2.5 bg-brand-bg rounded-xl">
                    <p className="text-[10px] text-brand-slate-light uppercase">Occupancy ≥</p>
                    <p className="text-sm font-bold text-brand-ink">{r.min_occupancy_percent}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                  <div className="flex gap-1.5">
                    {r.min_stay > 0 && <span className="text-[10px] px-2 py-0.5 bg-brand-bg border border-brand-border rounded-full text-brand-slate">Min stay {r.min_stay}n</span>}
                    <span className="text-[10px] px-2 py-0.5 bg-brand-bg border border-brand-border rounded-full text-brand-slate capitalize">Applies: {r.applies_to}</span>
                  </div>
                  <button onClick={() => toggle(r, 'RateRule')} className={`text-[11px] px-3 py-1.5 rounded-full font-semibold ${r.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {dialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDialog(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">{dialog === 'plan' ? 'New Seasonal Rate Plan' : 'New Dynamic Rule'}</h3>
              <button onClick={() => setDialog(null)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            {dialog === 'plan' ? (
              <form onSubmit={savePlan} className="space-y-3">
                <input placeholder="Plan name (e.g. Summer Peak)" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={planForm.season} onChange={e => setPlanForm({ ...planForm, season: e.target.value })} className={inputCls}>
                    {seasons.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                  <input type="number" placeholder="Price per night" value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })} className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Min stay" value={planForm.min_stay} onChange={e => setPlanForm({ ...planForm, min_stay: Number(e.target.value) })} className={inputCls} />
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-brand-slate-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="date" value={planForm.start_date} onChange={e => setPlanForm({ ...planForm, start_date: e.target.value })} className={`${inputCls} pl-8`} />
                  </div>
                  <input type="date" value={planForm.end_date} onChange={e => setPlanForm({ ...planForm, end_date: e.target.value })} className={inputCls} />
                </div>
                <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Create Rate Plan</button>
              </form>
            ) : (
              <form onSubmit={saveRule} className="space-y-3">
                <input placeholder="Rule name (e.g. Last-minute 15% off)" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={ruleForm.rule_type} onChange={e => setRuleForm({ ...ruleForm, rule_type: e.target.value })} className={inputCls}>
                    <option value="discount">Discount</option><option value="surcharge">Surcharge</option><option value="dynamic_pricing">Dynamic Pricing</option>
                  </select>
                  <input type="number" placeholder="Value %" value={ruleForm.value_percent} onChange={e => setRuleForm({ ...ruleForm, value_percent: Number(e.target.value) })} className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Min occupancy %" value={ruleForm.min_occupancy_percent} onChange={e => setRuleForm({ ...ruleForm, min_occupancy_percent: Number(e.target.value) })} className={inputCls} />
                  <input type="number" placeholder="Min stay (nights)" value={ruleForm.min_stay} onChange={e => setRuleForm({ ...ruleForm, min_stay: Number(e.target.value) })} className={inputCls} />
                  <input type="number" placeholder="Priority" value={ruleForm.priority} onChange={e => setRuleForm({ ...ruleForm, priority: Number(e.target.value) })} className={inputCls} />
                </div>
                <select value={ruleForm.applies_to} onChange={e => setRuleForm({ ...ruleForm, applies_to: e.target.value })} className={inputCls}>
                  <option value="all">Applies to all channels</option><option value="direct">Direct bookings only</option><option value="ota">OTA bookings only</option>
                </select>
                <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Create Rule</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}