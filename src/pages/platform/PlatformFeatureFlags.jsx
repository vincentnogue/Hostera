const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Flag, Plus, X } from 'lucide-react';

const statusColors = {
  enabled: 'bg-green-500/15 text-green-400',
  beta: 'bg-amber-500/15 text-amber-400',
  disabled: 'bg-white/10 text-white/50',
};

export default function PlatformFeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ key: '', name: '', description: '', status: 'disabled', rollout_percent: 100, scope: 'global' });

  const fetchData = async () => {
    try {
      const data = await db.entities.FeatureFlag.list();
      setFlags(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateFlag = async (flag, updates) => {
    try {
      await db.entities.FeatureFlag.update(flag.id, { ...updates, updated_at: new Date().toISOString(), updated_by: 'Platform Admin' });
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: 'changed feature flag',
        entity_type: 'feature_flag',
        entity_id: flag.id,
        details: `${flag.name}: ${Object.entries(updates).map(([k, v]) => `${k} → ${v}`).join(', ')}`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!form.key || !form.name) return;
    setCreating(true);
    try {
      await db.entities.FeatureFlag.create({
        ...form,
        key: form.key.toLowerCase().replace(/\s+/g, '_'),
        updated_at: new Date().toISOString(),
        updated_by: 'Platform Admin',
      });
      setShowCreate(false);
      setForm({ key: '', name: '', description: '', status: 'disabled', rollout_percent: 100, scope: 'global' });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#1F5A8A] border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 bg-[#0C2438] border border-white/10 rounded-lg text-sm outline-none focus:border-[#1F5A8A] text-white";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Feature Flags</h1>
          <p className="text-sm text-white/50 mt-1">Controlled deployment — enable features globally, per plan or per organization</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F5A8A] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Flag
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.length === 0 ? (
          <div className="col-span-full bg-[#0A1E30] border border-white/5 rounded-xl py-16 text-center">
            <Flag className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No feature flags defined</p>
          </div>
        ) : (
          flags.map(flag => (
            <div key={flag.id} className="bg-[#0A1E30] border border-white/5 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{flag.name}</h3>
                  <code className="text-[10px] text-[#1F5A8A] font-mono">{flag.key}</code>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[flag.status] || statusColors.disabled}`}>
                  {flag.status}
                </span>
              </div>
              {flag.description && <p className="text-xs text-white/50 mb-4">{flag.description}</p>}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wide block mb-1">Status</label>
                  <select
                    value={flag.status}
                    onChange={e => updateFlag(flag, { status: e.target.value })}
                    className="w-full text-xs px-2 py-1.5 rounded-lg bg-[#123B63] border border-[#1F5A8A]/40 text-white outline-none cursor-pointer"
                  >
                    {['enabled', 'beta', 'disabled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wide block mb-1">Rollout %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={flag.rollout_percent}
                    onBlur={e => {
                      const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      if (v !== flag.rollout_percent) updateFlag(flag, { rollout_percent: v });
                    }}
                    className="w-full text-xs px-2 py-1.5 rounded-lg bg-[#123B63] border border-[#1F5A8A]/40 text-white outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/30">
                <span className="capitalize">Scope: {flag.scope}</span>
                <span>{flag.updated_at ? new Date(flag.updated_at).toLocaleDateString() : ''} by {flag.updated_by || '—'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0A1E30] border border-white/10 rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Feature Flag</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Key</label>
                  <input type="text" value={form.key} onChange={e => setForm({...form, key: e.target.value})} placeholder="ai_revenue_manager" className={`${inputCls} font-mono`} />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="AI Revenue Manager" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What this flag controls..." className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputCls}>
                    {['enabled', 'beta', 'disabled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Scope</label>
                  <select value={form.scope} onChange={e => setForm({...form, scope: e.target.value})} className={inputCls}>
                    {['global', 'organization', 'plan'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Rollout %</label>
                  <input type="number" min="0" max="100" value={form.rollout_percent} onChange={e => setForm({...form, rollout_percent: parseInt(e.target.value) || 0})} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.key || !form.name} className="flex-1 px-4 py-2 bg-[#1F5A8A] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}