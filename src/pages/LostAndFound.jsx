const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Search, Plus, X, PackageSearch, ArrowRight, MapPin, User } from 'lucide-react';

const STATUS_FLOW = { found: 'stored', stored: 'claimed', claimed: 'returned' };
const statusPills = {
  found: 'bg-blue-50 text-brand-navy', stored: 'bg-amber-50 text-amber-700', claimed: 'bg-purple-50 text-purple-700',
  returned: 'bg-green-50 text-green-700', donated: 'bg-gray-100 text-gray-500', disposed: 'bg-red-50 text-red-600',
};

export default function LostAndFound() {
  const { selectedProperty } = useProperty();
  const [items, setItems] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ item_name: '', description: '', location: '', found_date: new Date().toISOString().slice(0, 10), found_by: '', guest_name: '', notes: '' });

  useEffect(() => {
    Promise.all([
      db.entities.LostItem.list('-found_date', 200),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([i, p]) => { setItems(i || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const q = search.toLowerCase();
  const filtered = items.filter(i =>
    (status === 'all' || i.status === status) &&
    (!q || (i.item_name || '').toLowerCase().includes(q) || (i.guest_name || '').toLowerCase().includes(q) || (i.location || '').toLowerCase().includes(q))
  );

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.item_name || !propertyId) return;
    const created = await db.entities.LostItem.create({ ...form, property_id: propertyId, status: 'found' });
    setItems(prev => [created, ...prev]);
    setForm({ item_name: '', description: '', location: '', found_date: new Date().toISOString().slice(0, 10), found_by: '', guest_name: '', notes: '' });
    setShowAdd(false);
  };

  const advance = async (i) => {
    const next = STATUS_FLOW[i.status];
    if (!next) return;
    await db.entities.LostItem.update(i.id, { status: next });
    setItems(prev => prev.map(x => x.id === i.id ? { ...x, status: next } : x));
  };

  const markFinal = async (i, finalStatus) => {
    await db.entities.LostItem.update(i.id, { status: finalStatus });
    setItems(prev => prev.map(x => x.id === i.id ? { ...x, status: finalStatus } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Lost & Found</h1>
          <p className="text-sm text-brand-slate">Record, track and manage guest items found on property — from discovery to return.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Record Item
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Recorded', value: items.length },
          { label: 'In Storage', value: items.filter(i => i.status === 'stored').length },
          { label: 'Returned', value: items.filter(i => i.status === 'returned').length },
          { label: 'Awaiting Owner', value: items.filter(i => ['found', 'stored', 'claimed'].includes(i.status)).length },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
            <p className="text-xl font-bold text-brand-ink">{k.value}</p>
            <p className="text-[11px] text-brand-slate">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-brand-border flex-1 max-w-md">
          <Search className="w-4 h-4 text-brand-slate-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item, guest, location…" className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'found', 'stored', 'claimed', 'returned', 'donated', 'disposed'].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${status === s ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading items…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <PackageSearch className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No items match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(i => (
            <div key={i.id} className="bg-white rounded-xl border border-brand-border p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center">
                  <PackageSearch className="w-4 h-4 text-brand-navy" />
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusPills[i.status] || 'bg-gray-100 text-gray-500'}`}>{i.status}</span>
              </div>
              <p className="text-sm font-semibold text-brand-ink">{i.item_name}</p>
              {i.description && <p className="text-[12px] text-brand-slate mt-1 leading-relaxed">{i.description}</p>}
              <div className="space-y-1 mt-3 text-[11px] text-brand-slate">
                {i.location && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{i.location} · found {i.found_date ? new Date(i.found_date).toLocaleDateString() : ''}</p>}
                {i.guest_name && <p className="flex items-center gap-1.5"><User className="w-3 h-3" />{i.guest_name}</p>}
                {i.found_by && <p className="text-brand-slate-light">Found by {i.found_by}</p>}
              </div>
              <div className="flex items-center gap-2 pt-3 mt-auto border-t border-[#F1F5F9] mt-3">
                {STATUS_FLOW[i.status] && (
                  <button onClick={() => advance(i)} className="flex items-center gap-1 px-3 py-1.5 bg-brand-navy text-white text-[11px] font-semibold rounded-full hover:bg-brand-blue capitalize">
                    {STATUS_FLOW[i.status]} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {i.status === 'stored' && (
                  <>
                    <button onClick={() => markFinal(i, 'donated')} className="px-3 py-1.5 border border-brand-border text-[11px] text-brand-slate rounded-full hover:border-brand-navy">Donate</button>
                    <button onClick={() => markFinal(i, 'disposed')} className="px-3 py-1.5 border border-red-200 text-[11px] text-red-500 rounded-full hover:bg-red-50">Dispose</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Record Found Item</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addItem} className="space-y-3">
              <input placeholder="Item (e.g. Black leather wallet)" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} className={inputCls} />
              <input placeholder="Description / distinguishing details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Found location (e.g. Room 502)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} />
                <input type="date" value={form.found_date} onChange={e => setForm({ ...form, found_date: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Found by (staff name)" value={form.found_by} onChange={e => setForm({ ...form, found_by: e.target.value })} className={inputCls} />
                <input placeholder="Guest name (if identifiable)" value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} className={inputCls} />
              </div>
              <input placeholder="Notes (e.g. stored in safe #3)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} />
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Record Item</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}