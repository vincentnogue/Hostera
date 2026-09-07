const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Ticket, Plus, X, TrendingUp, Users } from 'lucide-react';

const typeLabels = {
  percentage_discount: '% Discount',
  fixed_discount: 'Fixed Discount',
  free_trial: 'Free Trial',
  plan_discount: 'Plan Discount',
  limited_time: 'Limited Time',
};

const statusColors = {
  active: 'bg-green-500/15 text-green-400',
  inactive: 'bg-white/10 text-white/50',
  expired: 'bg-orange-500/15 text-orange-400',
};

export default function CommercialCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', type: 'percentage_discount', value: 10, usage_limit: 100, end_date: '' });

  const fetchData = async () => {
    try {
      const data = await db.entities.CommercialCode.list();
      setCodes(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.code || !form.name) return;
    setCreating(true);
    try {
      await db.entities.CommercialCode.create({
        ...form,
        code: form.code.toUpperCase(),
        status: 'active',
        times_used: 0,
        revenue_generated: 0,
        customers_acquired: 0,
        created_by: 'Platform Admin',
      });
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: 'created commercial code',
        entity_type: 'commercial_code',
        details: `${form.code.toUpperCase()} — ${form.name}`,
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
      setShowCreate(false);
      setForm({ code: '', name: '', type: 'percentage_discount', value: 10, usage_limit: 100, end_date: '' });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const toggleStatus = async (codeObj) => {
    try {
      const newStatus = codeObj.status === 'active' ? 'inactive' : 'active';
      await db.entities.CommercialCode.update(codeObj.id, { status: newStatus });
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: `${newStatus === 'active' ? 'activated' : 'deactivated'} commercial code`,
        entity_type: 'commercial_code',
        entity_id: codeObj.id,
        details: codeObj.code,
        severity: 'warning',
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

  const activeCodes = codes.filter(c => c.status === 'active').length;
  const totalRedemptions = codes.reduce((s, c) => s + (c.times_used || 0), 0);
  const totalRevenue = codes.reduce((s, c) => s + (c.revenue_generated || 0), 0);
  const totalCustomers = codes.reduce((s, c) => s + (c.customers_acquired || 0), 0);
  const inputCls = "w-full px-3 py-2 bg-[#0C2438] border border-white/10 rounded-lg text-sm outline-none focus:border-[#1F5A8A] text-white";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Commercial Codes</h1>
          <p className="text-sm text-white/50 mt-1">Promotional code engine with revenue attribution</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F5A8A] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Code
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Codes', value: activeCodes, icon: Ticket, color: 'text-green-400' },
          { label: 'Total Redemptions', value: totalRedemptions, icon: Users, color: 'text-blue-400' },
          { label: 'Revenue Generated', value: `$${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Customers Acquired', value: totalCustomers, icon: Users, color: 'text-white' },
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

      <div className="bg-[#0A1E30] border border-white/5 rounded-xl overflow-hidden">
        {codes.length === 0 ? (
          <div className="py-16 text-center">
            <Ticket className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No commercial codes yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/40 border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Used / Limit</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Customers</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-[#123B63] text-white px-2.5 py-1 rounded-md border border-[#1F5A8A]/40">{c.code}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3 text-white/60">{typeLabels[c.type] || c.type}</td>
                    <td className="px-4 py-3 text-white/60">{c.times_used || 0} / {c.usage_limit || '∞'}</td>
                    <td className="px-4 py-3 font-medium text-green-400">${(c.revenue_generated || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-white/60">{c.customers_acquired || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(c)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[c.status] || statusColors.inactive}`}
                      >
                        {c.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0A1E30] border border-white/10 rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Commercial Code</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Code</label>
                  <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="LAUNCH25" className={`${inputCls} font-mono uppercase`} />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Launch Campaign" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputCls}>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Value</label>
                  <input type="number" value={form.value} onChange={e => setForm({...form, value: parseFloat(e.target.value) || 0})} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={e => setForm({...form, usage_limit: parseInt(e.target.value) || 0})} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">End Date (optional)</label>
                <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.code || !form.name} className="flex-1 px-4 py-2 bg-[#1F5A8A] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}