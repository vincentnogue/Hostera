const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { CreditCard, TrendingUp, AlertTriangle, Search } from 'lucide-react';

const PLAN_PRICES = { starter: 49, professional: 129, business: 299, enterprise: 499 };

const statusColors = {
  active: 'bg-green-500/15 text-green-400',
  trial: 'bg-blue-500/15 text-blue-400',
  past_due: 'bg-orange-500/15 text-orange-400',
  grace_period: 'bg-amber-500/15 text-amber-400',
  suspended: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-white/10 text-white/40',
  expired: 'bg-white/10 text-white/40',
};

export default function PlatformSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const data = await db.entities.PlatformSubscription.list();
      setSubs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateSub = async (sub, updates, actionLabel) => {
    try {
      const price = PLAN_PRICES[updates.plan || sub.plan];
      const finalUpdates = { ...updates };
      if (updates.plan) {
        finalUpdates.mrr = price;
        finalUpdates.arr = price * 12;
      }
      await db.entities.PlatformSubscription.update(sub.id, finalUpdates);
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: `${actionLabel} subscription`,
        entity_type: 'subscription',
        entity_id: sub.id,
        details: `${sub.organization_name || sub.organization_id}: ${Object.entries(updates).map(([k, v]) => `${k} → ${v}`).join(', ')}`,
        severity: updates.status === 'suspended' || updates.status === 'cancelled' ? 'warning' : 'info',
        timestamp: new Date().toISOString(),
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#1F5A8A] border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const active = subs.filter(s => s.status === 'active');
  const mrr = active.reduce((s, x) => s + (x.mrr || PLAN_PRICES[x.plan] || 0), 0);
  const arr = mrr * 12;
  const churnRisk = subs.filter(s => s.status === 'past_due' || s.status === 'grace_period').length;
  const selectCls = "text-xs px-2 py-1.5 rounded-lg bg-[#123B63] border border-[#1F5A8A]/40 text-white outline-none cursor-pointer";

  const filtered = search
    ? subs.filter(s => (s.organization_name || '').toLowerCase().includes(search.toLowerCase()))
    : subs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions & Billing</h1>
        <p className="text-sm text-white/50 mt-1">SaaS subscription management — hotels pay Hostera, guests never pay</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: `$${mrr.toLocaleString()}`, icon: CreditCard, color: 'text-green-400' },
          { label: 'ARR', value: `$${arr.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Active Subscriptions', value: active.length, icon: CreditCard, color: 'text-white' },
          { label: 'Churn Risk (Past Due)', value: churnRisk, icon: AlertTriangle, color: 'text-orange-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#0A1E30] border border-white/5 rounded-xl p-4">
              <Icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-[#0A1E30] rounded-lg border border-white/5 max-w-xs">
        <Search className="w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search organization..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none flex-1 text-white placeholder:text-white/30"
        />
      </div>

      <div className="bg-[#0A1E30] border border-white/5 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-white/40 py-16 text-center">No subscriptions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">MRR</th>
                  <th className="px-4 py-3 font-medium">Cycle</th>
                  <th className="px-4 py-3 font-medium">Next Billing</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr key={sub.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{sub.organization_name || '—'}</p>
                      <p className="text-xs text-white/40">{sub.properties_count || 1} propert{(sub.properties_count || 1) > 1 ? 'ies' : 'y'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={sub.plan}
                        onChange={e => updateSub(sub, { plan: e.target.value }, 'changed plan for')}
                        className={selectCls}
                      >
                        {Object.keys(PLAN_PRICES).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)} — ${PLAN_PRICES[p]}/mo</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-400">${(sub.mrr || PLAN_PRICES[sub.plan] || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <select
                        value={sub.billing_cycle}
                        onChange={e => updateSub(sub, { billing_cycle: e.target.value }, 'changed billing cycle for')}
                        className={selectCls}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-white/60">{sub.next_billing_date || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={sub.status}
                        onChange={e => updateSub(sub, { status: e.target.value }, 'updated status for')}
                        className={`${selectCls} capitalize`}
                      >
                        {['trial', 'active', 'past_due', 'grace_period', 'suspended', 'cancelled'].map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-white/30">
        Every plan change, status change and billing modification is recorded in the platform audit log.
      </p>
    </div>
  );
}