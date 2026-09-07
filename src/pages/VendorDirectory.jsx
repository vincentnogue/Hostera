const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Truck, Plus, X, Mail, Phone, User, Star, Trash2 } from 'lucide-react';

const categories = ['laundry', 'food_beverage', 'repair', 'security', 'it', 'landscaping', 'other'];
const catPills = {
  laundry: 'bg-blue-50 text-[#123B63]', food_beverage: 'bg-orange-50 text-orange-700', repair: 'bg-amber-50 text-amber-700',
  security: 'bg-gray-100 text-gray-600', it: 'bg-indigo-50 text-indigo-700', landscaping: 'bg-green-50 text-green-700', other: 'bg-slate-100 text-slate-600',
};

export default function VendorDirectory() {
  const [vendors, setVendors] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'laundry', contact_person: '', email: '', phone: '', rating: 4, performance_notes: '' });

  useEffect(() => {
    Promise.all([
      db.entities.Vendor.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([v, p]) => { setVendors(v || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const inputCls = "w-full px-3.5 py-2 border border-[#E2E8F0] rounded-full text-sm outline-none focus:border-[#123B63]";
  const filtered = vendors.filter(v => cat === 'all' || v.category === cat);

  const addVendor = async (e) => {
    e.preventDefault();
    if (!form.name || !propertyId) return;
    const created = await db.entities.Vendor.create({ ...form, property_id: propertyId });
    setVendors(prev => [...prev, created]);
    setForm({ name: '', category: 'laundry', contact_person: '', email: '', phone: '', rating: 4, performance_notes: '' });
    setShowAdd(false);
  };

  const removeVendor = async (id) => {
    await db.entities.Vendor.delete(id);
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Vendor Directory</h1>
          <p className="text-sm text-[#64748B]">External suppliers — laundry, food, repair services — with contacts and performance notes.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vendors', value: vendors.length },
          { label: 'Categories', value: new Set(vendors.map(v => v.category)).size },
          { label: 'Avg Rating', value: vendors.length ? (vendors.reduce((s, v) => s + (v.rating || 0), 0) / vendors.length).toFixed(1) : '—' },
          { label: 'Top Rated', value: [...vendors].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]?.name || '—' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-lg font-bold text-[#17212B] truncate">{k.value}</p>
            <p className="text-[11px] text-[#64748B]">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCat('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${cat === 'all' ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>All</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${cat === c ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>
            {c.replace('_', ' ')} ({vendors.filter(v => v.category === c).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading vendors…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center">
          <Truck className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No vendors in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#123B63] text-white flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#17212B]">{v.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${catPills[v.category] || catPills.other}`}>{v.category?.replace('_', ' ')}</span>
                  </div>
                </div>
                <button onClick={() => removeVendor(v.id)} className="p-1.5 text-[#94A3B8] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={`w-3.5 h-3.5 ${n <= (v.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-[#E2E8F0] fill-[#E2E8F0]'}`} />
                ))}
              </div>
              <div className="space-y-1 text-[11px] text-[#64748B]">
                {v.contact_person && <p className="flex items-center gap-1.5"><User className="w-3 h-3" />{v.contact_person}</p>}
                {v.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{v.email}</p>}
                {v.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{v.phone}</p>}
              </div>
              {v.performance_notes && (
                <p className="text-[11px] text-[#94A3B8] mt-3 p-2.5 bg-[#F6F8FB] rounded-xl leading-relaxed">{v.performance_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#17212B]">Add Vendor</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <form onSubmit={addVendor} className="space-y-3">
              <input placeholder="Vendor name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  {categories.map(c => <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>)}
                </select>
                <select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className={inputCls}>
                  {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <input placeholder="Contact person" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              </div>
              <textarea placeholder="Performance notes (e.g. 24h turnaround, bulk discounts)" value={form.performance_notes} onChange={e => setForm({ ...form, performance_notes: e.target.value })} rows={3} className="w-full px-4 py-3 border border-[#E2E8F0] rounded-3xl text-sm outline-none focus:border-[#123B63] resize-none" />
              <button type="submit" className="w-full py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">Add Vendor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}