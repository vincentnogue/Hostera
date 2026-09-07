const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Plus, X, TrendingUp, CalendarRange, Lock } from 'lucide-react';

const seasonColors = {
  standard: 'bg-gray-100 text-gray-700',
  high: 'bg-orange-100 text-orange-700',
  low: 'bg-blue-100 text-blue-700',
  peak: 'bg-red-100 text-red-700',
  weekend: 'bg-purple-100 text-purple-700',
  custom: 'bg-teal-100 text-teal-700',
};

export default function RevenueManagement() {
  const [ratePlans, setRatePlans] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', room_type_id: '', season: 'standard', price: 0,
    min_stay: 1, max_stay: 30, start_date: '', end_date: '',
    closed_to_arrival: false, closed_to_departure: false,
    auto_adjust: false, adjustment_percent: 0,
  });

  const fetchData = async () => {
    try {
      const [planData, roomTypeData, propData] = await Promise.all([
        db.entities.RatePlan.list(),
        db.entities.RoomType.list(),
        db.entities.Property.list(),
      ]);
      setRatePlans(planData || []);
      setRoomTypes(roomTypeData || []);
      setProperties(propData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.room_type_id) return;
    setCreating(true);
    try {
      const property = properties[0];
      const roomType = roomTypes.find(rt => rt.id === form.room_type_id);
      await db.entities.RatePlan.create({
        ...form,
        property_id: property?.id || '',
        currency: roomType?.currency || 'USD',
        status: 'active',
        max_stay: form.max_stay || null,
      });
      setShowCreate(false);
      setForm({ name: '', room_type_id: '', season: 'standard', price: 0, min_stay: 1, max_stay: 30, start_date: '', end_date: '', closed_to_arrival: false, closed_to_departure: false, auto_adjust: false, adjustment_percent: 0 });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      await db.entities.RatePlan.update(plan.id, { status: plan.status === 'active' ? 'inactive' : 'active' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
      </div>
    );
  }

  const activePlans = ratePlans.filter(p => p.status === 'active').length;
  const avgPrice = ratePlans.length > 0
    ? Math.round(ratePlans.reduce((s, p) => s + (p.price || 0), 0) / ratePlans.length)
    : 0;

  const inputCls = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm outline-none focus:border-[#123B63] text-[#17212B]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Revenue Management</h1>
          <p className="text-sm text-[#64748B] mt-1">Seasonal pricing, restrictions and automated rate adjustments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#123B63] text-white rounded-lg text-sm font-medium hover:bg-[#1F5A8A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Rate Plan
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Plans', value: activePlans },
          { label: 'Total Plans', value: ratePlans.length },
          { label: 'Average Rate', value: `$${avgPrice}` },
          { label: 'Room Types', value: roomTypes.length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-xl font-bold text-[#17212B]">{s.value}</p>
            <p className="text-xs text-[#64748B] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {ratePlans.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingUp className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">No rate plans defined yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {ratePlans.map((plan) => {
              const roomType = roomTypes.find(rt => rt.id === plan.room_type_id);
              return (
                <div key={plan.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[#F6F8FB] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#17212B]">{plan.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${seasonColors[plan.season] || 'bg-gray-100'}`}>
                        {plan.season}
                      </span>
                      {plan.status !== 'active' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mb-1">{roomType?.name || 'All room types'}</p>
                    <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap">
                      {plan.start_date && <span className="flex items-center gap-1"><CalendarRange className="w-3 h-3" />{plan.start_date} → {plan.end_date || '∞'}</span>}
                      <span>Min stay: {plan.min_stay || 1} night{(plan.min_stay || 1) > 1 ? 's' : ''}</span>
                      {plan.closed_to_arrival && <span className="flex items-center gap-1 text-orange-600"><Lock className="w-3 h-3" />CTA</span>}
                      {plan.closed_to_departure && <span className="flex items-center gap-1 text-orange-600"><Lock className="w-3 h-3" />CTD</span>}
                      {plan.auto_adjust && <span className="text-blue-600">Auto: {plan.adjustment_percent > 0 ? '+' : ''}{plan.adjustment_percent}%</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[#123B63]">${plan.price} <span className="text-xs text-[#64748B] font-normal">{plan.currency}</span></p>
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`mt-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        plan.status === 'active'
                          ? 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F6F8FB]'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {plan.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#17212B]">New Rate Plan</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-[#17212B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#17212B] mb-1 block">Plan Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Summer Peak Rate" className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#17212B] mb-1 block">Room Type</label>
                  <select value={form.room_type_id} onChange={e => setForm({...form, room_type_id: e.target.value})} className={inputCls}>
                    <option value="">Select room type...</option>
                    {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#17212B] mb-1 block">Season</label>
                  <select value={form.season} onChange={e => setForm({...form, season: e.target.value})} className={inputCls}>
                    {['standard','high','low','peak','weekend','custom'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#17212B] mb-1 block">Price / Night</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm({...form, price: parseFloat(e.target.value) || 0})} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#17212B] mb-1 block">Min Stay</label>
                  <input type="number" min="1" value={form.min_stay} onChange={e => setForm({...form, min_stay: parseInt(e.target.value) || 1})} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#17212B] mb-1 block">Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#17212B] mb-1 block">End Date</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'closed_to_arrival', label: 'Closed to Arrival' },
                  { key: 'closed_to_departure', label: 'Closed to Departure' },
                ].map(c => (
                  <label key={c.key} className="flex items-center gap-2 text-sm text-[#17212B]">
                    <input type="checkbox" checked={form[c.key]} onChange={e => setForm({...form, [c.key]: e.target.checked})} className="accent-[#123B63]" />
                    {c.label}
                  </label>
                ))}
              </div>
              <div className="p-3 bg-[#F6F8FB] rounded-lg space-y-2">
                <label className="flex items-center gap-2 text-sm text-[#17212B]">
                  <input type="checkbox" checked={form.auto_adjust} onChange={e => setForm({...form, auto_adjust: e.target.checked})} className="accent-[#123B63]" />
                  Enable automated rate adjustment
                </label>
                {form.auto_adjust && (
                  <div>
                    <label className="text-xs text-[#64748B] mb-1 block">Adjustment % (can be negative for discounts)</label>
                    <input type="number" value={form.adjustment_percent} onChange={e => setForm({...form, adjustment_percent: parseFloat(e.target.value) || 0})} className={inputCls} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F6F8FB]">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.name || !form.room_type_id} className="flex-1 px-4 py-2 bg-[#123B63] text-white rounded-lg text-sm font-medium hover:bg-[#1F5A8A] disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Rate Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}