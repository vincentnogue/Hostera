const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Layers, Plus, X, Percent, BedDouble, Zap } from 'lucide-react';

const seasons = ['standard', 'high', 'low', 'peak', 'weekend', 'custom'];

export default function RatePlans() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [rules, setRules] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ room_type_id: '', name: '', season: 'standard', price: 0, min_stay: 1, start_date: '', end_date: '' });

  useEffect(() => {
    Promise.all([
      db.entities.RoomType.list(),
      db.entities.RatePlan.list(),
      db.entities.RateRule.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([rt, p, r, props]) => { setRoomTypes(rt || []); setPlans(p || []); setRules(r || []); setProperties(props || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const inputCls = "w-full px-3.5 py-2 border border-[#E2E8F0] rounded-full text-sm outline-none focus:border-[#123B63]";
  const promoRules = rules.filter(r => r.rule_type === 'discount' && r.status === 'active');

  const addPlan = async (e) => {
    e.preventDefault();
    if (!form.name || !propertyId) return;
    const created = await db.entities.RatePlan.create({ ...form, property_id: propertyId, currency: 'USD', status: 'active' });
    setPlans(prev => [...prev, created]);
    setForm({ room_type_id: '', name: '', season: 'standard', price: 0, min_stay: 1, start_date: '', end_date: '' });
    setShowAdd(false);
  };

  const togglePlan = async (p) => {
    const next = p.status === 'active' ? 'inactive' : 'active';
    await db.entities.RatePlan.update(p.id, { status: next });
    setPlans(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Rate Plans</h1>
          <p className="text-sm text-[#64748B]">Seasonal pricing, promotional discounts and rate logic per room type.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">
          <Plus className="w-4 h-4" /> New Rate Plan
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Room Types', value: roomTypes.length },
          { label: 'Rate Plans', value: plans.length },
          { label: 'Active Plans', value: plans.filter(p => p.status === 'active').length },
          { label: 'Promo Discounts', value: promoRules.length },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
            <p className="text-[11px] text-[#64748B]">{k.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading rate plans…</p>
      ) : (
        <>
          {/* Per room type */}
          <div className="space-y-5">
            {roomTypes.map(rt => {
              const rtPlans = plans.filter(p => p.room_type_id === rt.id || (!p.room_type_id && plans.length === 0));
              return (
                <div key={rt.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F6F8FB] flex items-center justify-center">
                        <BedDouble className="w-4 h-4 text-[#123B63]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#17212B]">{rt.name}</p>
                        <p className="text-[11px] text-[#64748B]">Base ${rt.base_price} · up to {rt.capacity} guests</p>
                      </div>
                    </div>
                    <button onClick={() => { setForm({ room_type_id: rt.id, name: `${rt.name} `, season: 'standard', price: rt.base_price || 0, min_stay: 1, start_date: '', end_date: '' }); setShowAdd(true); }} className="text-[11px] px-3 py-1.5 border border-[#E2E8F0] text-[#123B63] rounded-full font-semibold hover:border-[#123B63]">
                      + Plan
                    </button>
                  </div>
                  {rtPlans.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] py-2 px-3 bg-[#F6F8FB] rounded-xl">No rate plans for this room type yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {rtPlans.map(p => (
                        <div key={p.id} className="p-4 rounded-xl border border-[#E2E8F0]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#123B63] font-semibold capitalize">{p.season}</span>
                            <button onClick={() => togglePlan(p)} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${p.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</button>
                          </div>
                          <p className="text-base font-bold text-[#17212B]">${p.price}<span className="text-[10px] text-[#94A3B8] font-normal">/night</span></p>
                          <p className="text-[11px] text-[#64748B] mt-1">{p.name}</p>
                          <p className="text-[10px] text-[#94A3B8] mt-1">
                            {p.start_date ? `${new Date(p.start_date).toLocaleDateString()} → ${p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}` : 'Year-round'} · Min {p.min_stay}n
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Promo logic */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="text-sm font-semibold text-[#17212B] mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#123B63]" /> Active Promotional Logic
            </h3>
            {promoRules.length === 0 ? (
              <p className="text-xs text-[#94A3B8]">No promotional discounts active — create rules in the Rate Manager.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {promoRules.map(r => (
                  <span key={r.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-medium">
                    <Zap className="w-3 h-3" />{r.name} (−{r.value_percent}%)
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-[#94A3B8] mt-3">Full rule builder — occupancy triggers, channel targeting, min stay — lives in Rate Manager.</p>
          </div>
        </>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#17212B]">New Rate Plan</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-[#64748B]" /></button>
            </div>
            <form onSubmit={addPlan} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#64748B] block mb-1.5">Room type</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {roomTypes.map(rt => (
                    <button type="button" key={rt.id} onClick={() => setForm({ ...form, room_type_id: rt.id })} className={`px-3 py-1.5 text-xs rounded-full border ${form.room_type_id === rt.id ? 'bg-[#123B63] text-white border-[#123B63]' : 'border-[#E2E8F0] text-[#64748B]'}`}>
                      {rt.name}
                    </button>
                  ))}
                </div>
                <input placeholder="Or type a name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} className={inputCls}>
                  {seasons.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                <input type="number" placeholder="Price / night" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" placeholder="Min stay" value={form.min_stay} onChange={e => setForm({ ...form, min_stay: Number(e.target.value) })} className={inputCls} />
                <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
                <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#123B63] text-white text-sm font-semibold rounded-full hover:bg-[#1F5A8A]">Create Rate Plan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}