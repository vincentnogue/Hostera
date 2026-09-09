const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Plus, Search, X, CalendarCheck } from 'lucide-react';

const resStatusColors = {
  inquiry: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
};

const sourceLabels = {
  direct: 'Direct', walk_in: 'Walk-in', ota: 'OTA', phone: 'Phone',
  corporate: 'Corporate', travel_agent: 'Travel Agent', group: 'Group',
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    guest_id: '', room_id: '', check_in: '', check_out: '',
    adults: 1, children: 0, source: 'direct',
  });

  const fetchData = async () => {
    try {
      const [resData, roomData, guestData, propData] = await Promise.all([
        db.entities.Reservation.list(),
        db.entities.Room.list(),
        db.entities.Guest.list(),
        db.entities.Property.list(),
      ]);
      setReservations(resData || []);
      setRooms(roomData || []);
      setGuests(guestData || []);
      setProperties(propData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.guest_id || !form.check_in || !form.check_out) return;
    setCreating(true);
    try {
      const room = rooms.find(r => r.id === form.room_id);
      const property = properties[0];
      const nights = Math.ceil(
        (new Date(form.check_out) - new Date(form.check_in)) / (1000 * 60 * 60 * 24)
      );
      await db.entities.Reservation.create({
        ...form,
        property_id: property?.id || '',
        room_type_id: room?.room_type_id || '',
        reservation_number: `RES-${Date.now()}`,
        status: 'confirmed',
        currency: 'USD',
        total_amount: nights * 150,
        paid_amount: 0,
      });
      if (room) {
        await db.entities.Room.update(room.id, { status: 'reserved' });
      }
      setShowCreate(false);
      setForm({ guest_id: '', room_id: '', check_in: '', check_out: '', adults: 1, children: 0, source: 'direct' });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const getGuestName = (id) => {
    const g = guests.find(g => g.id === id);
    return g ? `${g.first_name} ${g.last_name}` : 'Unknown';
  };

  const filtered = reservations.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !getGuestName(r.guest_id).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Reservations</h1>
          <p className="text-sm text-brand-slate mt-1">{filtered.length} reservations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Reservation
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-brand-border flex-1 max-w-xs">
          <Search className="w-4 h-4 text-brand-slate" />
          <input
            type="text"
            placeholder="Search guest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-brand-ink placeholder:text-brand-slate-light"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white rounded-lg border border-brand-border text-sm text-brand-ink outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarCheck className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No reservations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-slate bg-brand-bg border-b border-brand-border">
                  <th className="px-4 py-3 font-medium">Confirmation</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Room</th>
                  <th className="px-4 py-3 font-medium">Check-In</th>
                  <th className="px-4 py-3 font-medium">Check-Out</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res) => {
                  const room = rooms.find(r => r.id === res.room_id);
                  return (
                    <tr key={res.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-brand-slate">{res.reservation_number || '-'}</td>
                      <td className="px-4 py-3 font-medium text-brand-ink">{getGuestName(res.guest_id)}</td>
                      <td className="px-4 py-3 text-brand-slate">{room?.number || 'Unassigned'}</td>
                      <td className="px-4 py-3 text-brand-slate">{res.check_in}</td>
                      <td className="px-4 py-3 text-brand-slate">{res.check_out}</td>
                      <td className="px-4 py-3 text-brand-slate">{sourceLabels[res.source] || res.source}</td>
                      <td className="px-4 py-3 text-brand-ink font-medium">${res.total_amount || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${resStatusColors[res.status] || 'bg-gray-100'}`}>
                          {res.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-ink">New Reservation</h2>
              <button onClick={() => setShowCreate(false)} className="text-brand-slate hover:text-brand-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Guest</label>
                <select
                  value={form.guest_id}
                  onChange={e => setForm({ ...form, guest_id: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                >
                  <option value="">Select guest...</option>
                  {guests.map(g => (
                    <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-ink mb-1 block">Room</label>
                <select
                  value={form.room_id}
                  onChange={e => setForm({ ...form, room_id: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                >
                  <option value="">Select room...</option>
                  {rooms.filter(r => r.status === 'available' || r.status === 'reserved').map(r => (
                    <option key={r.id} value={r.id}>Room {r.number} (Floor {r.floor})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Check-In</label>
                  <input
                    type="date"
                    value={form.check_in}
                    onChange={e => setForm({ ...form, check_in: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Check-Out</label>
                  <input
                    type="date"
                    value={form.check_out}
                    onChange={e => setForm({ ...form, check_out: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Adults</label>
                  <input
                    type="number"
                    min="1"
                    value={form.adults}
                    onChange={e => setForm({ ...form, adults: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Children</label>
                  <input
                    type="number"
                    min="0"
                    value={form.children}
                    onChange={e => setForm({ ...form, children: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-brand-ink mb-1 block">Source</label>
                  <select
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm outline-none focus:border-brand-navy"
                  >
                    <option value="direct">Direct</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="ota">OTA</option>
                    <option value="phone">Phone</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-sm font-medium text-brand-slate hover:bg-brand-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.guest_id || !form.check_in || !form.check_out}
                className="flex-1 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}