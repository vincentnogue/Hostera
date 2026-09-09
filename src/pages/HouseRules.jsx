const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { ScrollText, Plus, X, Send, Eye, RotateCcw, Check } from 'lucide-react';

export default function HouseRules() {
  const { selectedProperty } = useProperty();
  const [rules, setRules] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      db.entities.HouseRule.list('-created_date', 50),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([r, p]) => { setRules(r || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";
  const published = rules.find(r => r.status === 'published');
  const drafts = rules.filter(r => r.status !== 'published' && r.status !== 'archived');

  const openNew = () => { setEditingId('new'); setForm({ title: '', content: '' }); };
  const openEdit = (r) => { setEditingId(r.id); setForm({ title: r.title, content: r.content }); };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title || !propertyId) return;
    if (editingId === 'new') {
      const created = await db.entities.HouseRule.create({ ...form, property_id: propertyId, status: 'draft', version: 1 });
      setRules(prev => [created, ...prev]);
    } else {
      const existing = rules.find(r => r.id === editingId);
      await db.entities.HouseRule.update(editingId, { ...form, version: (existing.version || 1) + 1 });
      setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...form, version: (r.version || 1) + 1 } : r));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setEditingId(null);
  };

  const publish = async (r) => {
    await db.entities.HouseRule.updateMany({ property_id: propertyId, status: 'published' }, { $set: { status: 'archived' } });
    await db.entities.HouseRule.update(r.id, { status: 'published', published_at: new Date().toISOString() });
    setRules(prev => prev.map(x => x.id === r.id ? { ...x, status: 'published', published_at: new Date().toISOString() } : (x.status === 'published' ? { ...x, status: 'archived' } : x)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">House Rules</h1>
          <p className="text-sm text-brand-slate">Draft, edit and publish house rules and terms shared with your guests.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> New Draft
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700">Draft saved.</p>
        </div>
      )}

      {/* Published */}
      <div className="bg-white rounded-xl border-2 border-brand-navy p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            <Eye className="w-4 h-4 text-green-600" /> Currently Published to Guests
          </h3>
          {published && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-brand-slate-light">v{published.version} · {published.published_at ? new Date(published.published_at).toLocaleDateString() : ''}</span>
              <button onClick={() => openEdit(published)} className="text-[11px] px-3 py-1.5 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy hover:text-brand-navy font-medium">Edit</button>
              <button onClick={() => publish(published)} className="flex items-center gap-1 text-[11px] px-3 py-1.5 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy"><RotateCcw className="w-3 h-3" /> Republish</button>
            </div>
          )}
        </div>
        {!published ? (
          <p className="text-xs text-brand-slate-light">Nothing published yet — draft your house rules, then publish them to share with guests.</p>
        ) : (
          <div>
            <p className="text-lg font-bold text-brand-ink">{published.title}</p>
            <div className="text-[13px] text-brand-slate leading-relaxed mt-3 whitespace-pre-wrap">{published.content}</div>
          </div>
        )}
      </div>

      {/* Drafts */}
      <div>
        <h3 className="text-sm font-semibold text-brand-ink mb-3">Drafts & Archives</h3>
        {loading ? (
          <p className="text-xs text-brand-slate">Loading…</p>
        ) : rules.filter(r => r.id !== published?.id).length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
            <ScrollText className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No other versions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.filter(r => r.id !== published?.id).map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-brand-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${r.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status} · v{r.version || 1}
                  </span>
                  {r.status === 'draft' && (
                    <button onClick={() => publish(r)} className="flex items-center gap-1 text-[11px] px-3 py-1.5 bg-brand-navy text-white rounded-full font-semibold hover:bg-brand-blue">
                      <Send className="w-3 h-3" /> Publish
                    </button>
                  )}
                </div>
                <p className="text-sm font-semibold text-brand-ink">{r.title}</p>
                <p className="text-[12px] text-brand-slate mt-1.5 line-clamp-3 leading-relaxed">{r.content}</p>
                <button onClick={() => openEdit(r)} className="text-[11px] px-3 py-1.5 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy hover:text-brand-navy font-medium mt-3">Edit</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">{editingId === 'new' ? 'New House Rules Draft' : 'Edit Draft'}</h3>
              <button onClick={() => setEditingId(null)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <input placeholder="Title (e.g. House Rules & Cancellation Terms)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
              <textarea placeholder={'e.g. Check-in from 14:00, check-out until 11:00.\nQuiet hours: 22:00 – 07:00.\nSmoking is not permitted inside the property…'} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} className="w-full px-4 py-3 border border-brand-border rounded-3xl text-sm outline-none focus:border-brand-navy resize-none" />
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Save Draft</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}