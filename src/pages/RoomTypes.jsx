const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Plus, X, BedDouble, Users, DollarSign, Maximize2, Globe2, Camera, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const bedTypeLabels = {
  single: 'Single', double: 'Double', twin: 'Twin',
  queen: 'Queen', king: 'King', suite: 'Suite',
};

export default function RoomTypes() {
  const { selectedProperty } = useProperty();
  const [roomTypes, setRoomTypes] = useState([]);
  const { toast } = useToast();
  const [rooms, setRoomTypesRooms] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', capacity: 2, bed_type: 'double',
    base_price: 0, size_sqm: 0, view: '', photo_urls: [],
  });
  const [uploadingFor, setUploadingFor] = useState(null);
  const [formUploading, setFormUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Individual room units (Room 101, 102, ...) were never actually
  // creatable anywhere in the app — RoomTypes only ever created the
  // *type* (e.g. "Deluxe Double"), so the room count shown here, the
  // Housekeeping board, and the Room Rack were always empty regardless of
  // how many room types got added. This is the fix: real Room rows.
  const [manageRoomsFor, setManageRoomsFor] = useState(null);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('');
  const [bulkStart, setBulkStart] = useState('');
  const [bulkCount, setBulkCount] = useState(1);
  const [savingRoom, setSavingRoom] = useState(false);

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
      setForm({ name: '', description: '', capacity: 2, bed_type: 'double', base_price: 0, size_sqm: 0, view: '', photo_urls: [] });
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not create room type', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const addRoom = async (roomType) => {
    if (!newRoomNumber.trim()) return;
    setSavingRoom(true);
    try {
      const property = selectedProperty || properties[0];
      await db.entities.Room.create({
        // organization_id explicit, not auto-derived — same lesson as the
        // onboarding room-type bug: don't rely on the fallback when we
        // already know exactly which org this belongs to.
        organization_id: roomType.organization_id || property?.organization_id,
        property_id: roomType.property_id || property?.id,
        room_type_id: roomType.id,
        number: newRoomNumber.trim(),
        floor: newRoomFloor ? Number(newRoomFloor) : undefined,
        status: 'available',
      });
      setNewRoomNumber('');
      setNewRoomFloor('');
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not add room', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingRoom(false);
    }
  };

  const addRoomsInBulk = async (roomType) => {
    const start = parseInt(bulkStart, 10);
    const count = Math.max(1, Math.min(50, Number(bulkCount) || 1));
    if (!bulkStart.trim() || Number.isNaN(start)) return;
    setSavingRoom(true);
    try {
      const property = selectedProperty || properties[0];
      const orgId = roomType.organization_id || property?.organization_id;
      const propId = roomType.property_id || property?.id;
      await Promise.all(
        Array.from({ length: count }, (_, i) =>
          db.entities.Room.create({
            organization_id: orgId,
            property_id: propId,
            room_type_id: roomType.id,
            number: String(start + i),
            floor: newRoomFloor ? Number(newRoomFloor) : undefined,
            status: 'available',
          })
        )
      );
      setBulkStart('');
      setBulkCount(1);
      setNewRoomFloor('');
      fetchData();
      toast({ title: `${count} rooms added` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not add rooms', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSavingRoom(false);
    }
  };

  const removeRoom = async (roomId) => {
    try {
      await db.entities.Room.delete(roomId);
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not remove room', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handlePriceUpdate = async (rtId, newPrice) => {
    try {
      await db.entities.RoomType.update(rtId, { base_price: parseFloat(newPrice) || 0 });
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not update price', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleMarketplaceToggle = async (rt) => {
    try {
      await db.entities.RoomType.update(rt.id, { marketplace_visible: rt.marketplace_visible === false });
      fetchData();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not update visibility', description: e.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleFormPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormUploading(true);
    setPhotoError('');
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file, bucket: 'uploads' });
      if (file_url) {
        setForm(prev => ({ ...prev, photo_urls: [...(prev.photo_urls || []), file_url] }));
      } else {
        setPhotoError('Upload returned no file URL — the storage bucket may not be configured yet.');
      }
    } catch (err) {
      setPhotoError(describeUploadError(err));
    } finally {
      setFormUploading(false);
      e.target.value = '';
    }
  };

  const removeFormPhoto = (url) => {
    setForm(prev => ({ ...prev, photo_urls: (prev.photo_urls || []).filter(u => u !== url) }));
  };

  const describeUploadError = (err) => {
    const msg = (err?.message || String(err)).toLowerCase();
    if (msg.includes('bucket not found') || msg.includes('not found')) {
      return "Upload failed: the 'uploads' storage bucket doesn't exist yet in Supabase. Create a public bucket named \"uploads\" in Supabase Dashboard → Storage.";
    }
    if (msg.includes('row-level security') || msg.includes('permission') || msg.includes('policy') || msg.includes('unauthorized')) {
      return "Upload failed: the 'uploads' bucket exists but isn't public / lacks an upload policy. Check Supabase Dashboard → Storage → uploads → Policies.";
    }
    return `Upload failed: ${err?.message || 'unknown error'}. Try a smaller image or a different file.`;
  };

  const handleRoomTypePhotoUpload = async (rt, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFor(rt.id);
    setPhotoError('');
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file, bucket: 'uploads' });
      if (file_url) {
        await db.entities.RoomType.update(rt.id, { photo_urls: [...(rt.photo_urls || []), file_url] });
        fetchData();
      } else {
        setPhotoError('Upload returned no file URL — the storage bucket may not be configured yet.');
      }
    } catch (err) {
      setPhotoError(describeUploadError(err));
    } finally {
      setUploadingFor(null);
      e.target.value = '';
    }
  };

  const removeRoomTypePhoto = async (rt, url) => {
    try {
      await db.entities.RoomType.update(rt.id, { photo_urls: (rt.photo_urls || []).filter(u => u !== url) });
      fetchData();
    } catch (err) { console.error(err); }
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

      {photoError && (
        <div className="flex items-start justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span>{photoError}</span>
          <button onClick={() => setPhotoError('')} className="shrink-0 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

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
                  <button type="button" onClick={() => setManageRoomsFor(rt)}
                    className="text-xs px-2.5 py-1 rounded-full bg-brand-bg text-brand-slate font-medium hover:bg-brand-border/50">
                    {roomCount} rooms
                  </button>
                </div>

                {/* Photo gallery */}
                <div className="flex gap-1.5 mb-3 overflow-x-auto">
                  {(rt.photo_urls || []).map(url => (
                    <div key={url} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={url} alt={rt.name} className="w-full h-full object-cover" loading="lazy" />
                      <button
                        type="button"
                        onClick={() => removeRoomTypePhoto(rt, url)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="shrink-0 w-16 h-16 rounded-lg border border-dashed border-brand-border flex items-center justify-center cursor-pointer hover:border-brand-navy text-brand-slate">
                    {uploadingFor === rt.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleRoomTypePhotoUpload(rt, e)} disabled={uploadingFor === rt.id} />
                  </label>
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

      {/* Manage Rooms Modal — add/remove the individual room units
          (Room 101, 102, ...) that live under this room type */}
      {manageRoomsFor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setManageRoomsFor(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-ink">Rooms — {manageRoomsFor.name}</h2>
              <button onClick={() => setManageRoomsFor(null)} className="text-brand-slate hover:text-brand-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 mb-5 max-h-48 overflow-y-auto">
              {rooms.filter(r => r.room_type_id === manageRoomsFor.id).length === 0 ? (
                <p className="text-xs text-brand-slate">No rooms added yet — add at least one below so this type can actually be booked and shown on Housekeeping / Room Rack.</p>
              ) : (
                rooms.filter(r => r.room_type_id === manageRoomsFor.id).map(r => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-brand-bg rounded-lg">
                    <span className="text-sm text-brand-ink">Room {r.number}{r.floor != null && r.floor !== '' ? ` · Floor ${r.floor}` : ''}</span>
                    <button onClick={() => removeRoom(r.id)} className="text-brand-slate hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-brand-border">
              <div>
                <label className="text-xs font-medium text-brand-slate">Add one room</label>
                <div className="flex gap-2 mt-1">
                  <input placeholder="Room number, e.g. 101" value={newRoomNumber} onChange={e => setNewRoomNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
                  <input placeholder="Floor" type="number" value={newRoomFloor} onChange={e => setNewRoomFloor(e.target.value)}
                    className="w-20 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
                  <button onClick={() => addRoom(manageRoomsFor)} disabled={savingRoom || !newRoomNumber.trim()}
                    className="px-3 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-brand-slate">Or add several at once (sequential numbers)</label>
                <div className="flex gap-2 mt-1">
                  <input placeholder="Starting number, e.g. 201" value={bulkStart} onChange={e => setBulkStart(e.target.value)}
                    className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
                  <input placeholder="Count" type="number" min={1} max={50} value={bulkCount} onChange={e => setBulkCount(e.target.value)}
                    className="w-20 px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy" />
                  <button onClick={() => addRoomsInBulk(manageRoomsFor)} disabled={savingRoom || !bulkStart.trim()}
                    className="px-3 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                    Add all
                  </button>
                </div>
                <p className="text-[11px] text-brand-slate-light mt-1">e.g. start at 201, count 5 → rooms 201–205.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Photos</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(form.photo_urls || []).map(url => (
                    <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeFormPhoto(url)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-lg border border-dashed border-brand-border flex items-center justify-center cursor-pointer hover:border-brand-navy text-brand-slate">
                    {formUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFormPhotoUpload} disabled={formUploading} />
                  </label>
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