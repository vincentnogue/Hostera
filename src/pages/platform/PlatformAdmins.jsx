const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { PLATFORM_OWNERS } from '@/lib/platformAdmins';
import { UserCog, Plus, X, Shield, Trash2, Mail } from 'lucide-react';

export default function PlatformAdmins() {
  const [admins, setAdmins] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'admin', department: '' });

  useEffect(() => {
    Promise.all([
      db.entities.PlatformAdmin.list(),
      db.auth.me().catch(() => null),
    ])
      .then(([a, u]) => { setAdmins(a || []); setUser(u); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isOwner = user?.email && PLATFORM_OWNERS.includes(user.email.toLowerCase());
  const inputCls = "w-full px-3.5 py-2 border border-white/10 rounded-full text-sm bg-white/5 text-white outline-none focus:border-[#1F5A8A] placeholder:text-white/30";

  const addAdmin = async (e) => {
    e.preventDefault();
    if (!form.email || !isOwner) return;
    const created = await db.entities.PlatformAdmin.create({ ...form, email: form.email.toLowerCase(), added_by: user.email });
    setAdmins(prev => [...prev, created]);
    setForm({ email: '', name: '', role: 'admin', department: '' });
    setShowAdd(false);
  };

  const removeAdmin = async (id) => {
    await db.entities.PlatformAdmin.delete(id);
    setAdmins(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Administrators</h1>
          <p className="text-sm text-white/50">Who can access the Hostera Control Center. Owners are protected accounts.</p>
        </div>
        {isOwner && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1F5A8A] text-white text-sm font-semibold rounded-full hover:bg-[#2A6E9E]">
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        )}
      </div>

      {/* Owners */}
      <div>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Owners — Protected Access</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORM_OWNERS.map(email => (
            <div key={email} className="p-5 rounded-xl bg-[#123B63] border border-[#1F5A8A]/50 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-[#1F5A8A] flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{email}</p>
                <p className="text-[11px] text-white/50">Full owner — cannot be removed</p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold uppercase tracking-wide">Owner</span>
            </div>
          ))}
        </div>
      </div>

      {/* Added admins */}
      <div>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Granted Administrators</p>
        {loading ? (
          <p className="text-xs text-white/40">Loading administrators…</p>
        ) : admins.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-white/10 text-center">
            <UserCog className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/50">No additional administrators yet.</p>
            {isOwner && <p className="text-xs text-white/30 mt-1">Owners can grant Control Center access to trusted team members.</p>}
          </div>
        ) : (
          <div className="space-y-2.5">
            {admins.map(a => (
              <div key={a.id} className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1F5A8A]/30 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.name || a.email}</p>
                  <p className="text-[11px] text-white/40 truncate">{a.email} · added by {a.added_by || '—'}{a.department ? ` · ${a.department}` : ''}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase ${a.role === 'admin' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-white/50'}`}>{a.role}</span>
                {isOwner && (
                  <button onClick={() => removeAdmin(a.id)} className="p-2 border border-red-500/30 text-red-400 rounded-full hover:bg-red-500/10" title="Revoke access">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isOwner && user && (
        <p className="text-xs text-white/30">Only owners can grant or revoke administrator access.</p>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-[#0C2438] rounded-2xl p-6 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Grant Control Center Access</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-white/50" /></button>
            </div>
            <form onSubmit={addAdmin} className="space-y-3">
              <input type="email" placeholder="admin@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
              <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls}>
                  <option value="admin">Admin</option><option value="viewer">Viewer</option>
                </select>
                <input placeholder="Department (optional)" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputCls} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#1F5A8A] text-white text-sm font-semibold rounded-full hover:bg-[#2A6E9E]">Grant Access</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}