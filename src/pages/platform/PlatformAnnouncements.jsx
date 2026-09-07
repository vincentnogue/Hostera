const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Megaphone, Plus, X, Globe } from 'lucide-react';

const statusColors = {
  published: 'bg-green-500/15 text-green-400',
  scheduled: 'bg-blue-500/15 text-blue-400',
  draft: 'bg-white/10 text-white/50',
  expired: 'bg-orange-500/15 text-orange-400',
};

const priorityColors = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  normal: 'bg-blue-500/15 text-blue-400',
  low: 'bg-white/10 text-white/50',
};

const LANGUAGES = [['en', 'English'], ['fr', 'French'], ['es', 'Spanish'], ['de', 'German'], ['it', 'Italian'], ['pt', 'Portuguese'], ['ar', 'Arabic (RTL)']];

export default function PlatformAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', audience: 'all', language: 'en', priority: 'normal', start_date: '', end_date: '' });

  const fetchData = async () => {
    try {
      const data = await db.entities.PlatformAnnouncement.list();
      setAnnouncements(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    setCreating(true);
    try {
      await db.entities.PlatformAnnouncement.create({
        ...form,
        status: form.start_date && form.start_date > new Date().toISOString().split('T')[0] ? 'scheduled' : 'published',
        created_by: 'Platform Admin',
      });
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: 'created platform announcement',
        entity_type: 'announcement',
        details: form.title,
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
      setShowCreate(false);
      setForm({ title: '', content: '', audience: 'all', language: 'en', priority: 'normal', start_date: '', end_date: '' });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const setStatus = async (ann, status) => {
    try {
      await db.entities.PlatformAnnouncement.update(ann.id, { status });
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: `announcement ${status}`,
        entity_type: 'announcement',
        entity_id: ann.id,
        details: ann.title,
        severity: 'info',
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

  const inputCls = "w-full px-3 py-2 bg-[#0C2438] border border-white/10 rounded-lg text-sm outline-none focus:border-[#1F5A8A] text-white";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-sm text-white/50 mt-1">Multilingual platform announcement CMS — {announcements.length} announcements</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F5A8A] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-[#0A1E30] border border-white/5 rounded-xl py-16 text-center">
            <Megaphone className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No announcements yet</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="bg-[#0A1E30] border border-white/5 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white">{ann.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[ann.status] || statusColors.draft}`}>{ann.status}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[ann.priority] || priorityColors.normal}`}>{ann.priority}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={ann.status}
                    onChange={e => setStatus(ann, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-lg bg-[#123B63] border border-[#1F5A8A]/40 text-white outline-none cursor-pointer capitalize"
                  >
                    {['draft', 'scheduled', 'published', 'expired'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{ann.content}</p>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-white/30 flex-wrap">
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{ann.language?.toUpperCase()}</span>
                <span className="capitalize">Audience: {ann.audience}</span>
                {ann.start_date && <span>{ann.start_date}{ann.end_date ? ` → ${ann.end_date}` : ''}</span>}
                <span>By {ann.created_by || '—'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0A1E30] border border-white/10 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">New Announcement</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Scheduled maintenance window" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">Content</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4} placeholder="Announcement body..." className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Audience</label>
                  <select value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className={inputCls}>
                    {['all', 'enterprise', 'business', 'professional', 'starter'].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Language</label>
                  <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} className={inputCls}>
                    {LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className={inputCls}>
                    {['low', 'normal', 'high', 'critical'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.title || !form.content} className="flex-1 px-4 py-2 bg-[#1F5A8A] text-white rounded-lg text-sm font-medium hover:bg-[#2563EB] disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}