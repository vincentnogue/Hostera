const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Plus, X, BedDouble, Users, DollarSign, Maximize2, Globe2 } from 'lucide-react';

const bedTypeLabels = {
  single: 'Single', double: 'Double', twin: 'Twin',
  queen: 'Queen', king: 'King', suite: 'Suite',
};

export default function RoomTypes() {
  const { selectedProperty } = useProperty();
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRoomTypesRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', capacity: 2, bed_type: 'double',
    base_price: 0, size_sqm: 0, view: '',
  });

  const fetchData = async () => {
    try {
      const [rtData, roomData, propData] = await Promise.all([
        db.entities.RoomType.list(),
        db.entities.Room.list(),
        db.entities.Property.list(),
      ]);
      setRoomTypes(rtData || []);
      setRoomTypesRooms(roomData || []);
      setProperties(propData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    setCreating(true);
    try {
      const property = selectedProperty || properties[0];
      await db.entities.RoomType.create({
        ...form,
        property_id: property?.id || '',
        currency: property?.currency || 'USD',
        amenities: ['wifi', 'tv', 'ac'],
      });
      setShowCreate(false);
      setForm({ name: '', description: '', capacity: 2, bed_type: 'double', base_price: 0, size_sqm: 0, view: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handlePriceUpdate = async (rtId, newPrice) => {
    try {
      await db.entities.RoomType.update(rtId, { base_price: parseFloat(newPrice) || 0 });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleMarketplaceToggle = async (rt) => {
    try {
      await db.entities.RoomType.update(rt.id, { marketplace_visible: rt.marketplace_visible === false });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy text-brand-ink";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Room Types</h1>
          <p className="text-sm text-brand-slate mt-1">{roomTypes.length} room types across your properties</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Room Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roomTypes.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-brand-border py-16 text-center">
            <BedDouble className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No room types defined</p>
          </div>
        ) : (
          roomTypes.map((rt) => {
            const roomCount = rooms.filter(r => r.room_type_id === rt.id).length;
            return (
              <div key={rt.id} className="bg-white rounded-xl border border-brand-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-bg flex items-center justify-center">
                    <BedDouble className="w-5 h-5 text-brand-navy" />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-brand-bg text-brand-slate font-medium">
                    {roomCount} rooms
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-brand-ink mb-1">{rt.name}</h3>
                {rt.description && <p className="text-xs text-brand-slate mb-3 line-clamp-2">{rt.description}</p>}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-brand-slate">
                    <Users className="w-3.5 h-3.5" />
                    <span>Up to {rt.capacity} guests</span>
                    <span>·</span>
                    <span>{bedTypeLabels[rt.bed_type] || rt.bed_type}</span>
                  </div>
                  {rt.size_sqm > 0 && (
                    <div className="flex items-center gap-2 text-xs text-brand-slate">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{rt.size_sqm} m²{rt.view ? ` · ${rt.view} view` : ''}</span>
                    </div>
                  )}
                  {rt.amenities && rt.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rt.amenities.slice(0, 4).map(a => (
                        <span key={a} className="text-[10px] px-2 py-0.5 bg-brand-bg rounded-full text-brand-slate">{a}</span>
                      ))}
                      {rt.amenities.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 text-brand-slate">+{rt.amenities.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-brand-navy" />
                    <input
                      type="number"
                      defaultValue={rt.base_price}
                      onBlur={e => handlePriceUpdate(rt.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-brand-border rounded text-sm font-medium outline-none focus:border-brand-navy"
                    />
                    <span className="text-xs text-brand-slate">{rt.currency}/night</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarketplaceToggle(rt)}
                  className={`w-full mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    rt.marketplace_visible === false
                      ? 'bg-brand-bg text-brand-slate hover:bg-brand-border/40'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                  title="Toggle whether this room type appears on the Hostera Marketplace"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5" />
                    {rt.marketplace_visible === false ? 'Hidden from marketplace' : 'Live on marketplace'}
                  </span>
                  <span className={`w-8 h-4 rounded-full relative transition-colors ${rt.marketplace_visible === false ? 'bg-brand-border' : 'bg-green-500'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${rt.marketplace_visible === false ? 'left-0.5' : 'left-4'}`} />
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-ink">New Room Type</h2>
              <button onClick={() => setShowCreate(false)} className="text-brand-slate hover:text-brand-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Deluxe Double Room" className={inputCls} />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} placeholder="Describe this room type..." className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Capacity</label>
                  <input type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 1})} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Bed Type</label>
                  <select value={form.bed_type} onChange={e => setForm({...form, bed_type: e.target.value})} className={inputCls}>
                    {Object.entries(bedTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Base Price</label>
                  <input type="number" min="0" value={form.base_price} onChange={e => setForm({...form, base_price: parseFloat(e.target.value) || 0})} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Size (m²)</label>
                  <input type="number" min="0" value={form.size_sqm} onChange={e => setForm({...form, size_sqm: parseInt(e.target.value) || 0})} className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">View</label>
                  <input type="text" value={form.view} onChange={e => setForm({...form, view: e.target.value})} placeholder="e.g. city, ocean..." className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-sm font-medium text-brand-slate hover:bg-brand-bg">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.name} className="flex-1 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Room Type'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}