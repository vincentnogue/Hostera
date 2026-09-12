const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';
import { getPropertyToday } from '@/lib/timezone';

import { LogIn, LogOut, Users, BedDouble, DollarSign, Plus, Search, X, Loader2 } from 'lucide-react';

const resStatusColors = {
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
};

export default function FrontDesk() {
  const { selectedProperty, scopeIds, loading: propsLoading } = useProperty();
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [payingRes, setPayingRes] = useState(null);
  const [saving, setSaving] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ guest_name: '', guest_email: '', room_id: '', nights: 1, adults: 1 });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'cash' });

  const currency = selectedProperty?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

  const fetchData = async () => {
    try {
      const [resData, roomData, guestData] = await Promise.all([
        db.entities.Reservation.list(),
        db.entities.Room.list(),
        db.entities.Guest.list(),
      ]);
      // Reservation/Room carry property_id — scope to the current
      // selection (kept permissive for records with no property_id yet,
      // same reasoning as Dashboard.jsx).
      const inScope = (r) => !r.property_id || (scopeIds || []).includes(r.property_id);
      setReservations((resData || []).filter(inScope));
      setRooms((roomData || []).filter(inScope));
      setGuests(guestData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!propsLoading) fetchData(); }, [propsLoading, scopeIds]);

  const handleCheckIn = async (resId, roomId) => {
    try {
      await db.entities.Reservation.update(resId, { status: 'checked_in' });
      if (roomId) await db.entities.Room.update(roomId, { status: 'occupied' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleCheckOut = async (resId, roomId) => {
    try {
      await db.entities.Reservation.update(resId, { status: 'checked_out' });
      if (roomId) await db.entities.Room.update(roomId, { status: 'dirty' });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const submitWalkIn = async (e) => {
    e.preventDefault();
    if (!walkInForm.guest_name || !walkInForm.room_id) return;
    setSaving(true);
    try {
      const room = rooms.find(r => r.id === walkInForm.room_id);
      const today = getPropertyToday(selectedProperty);
      const checkOut = new Date(new Date(today).getTime() + (Number(walkInForm.nights) || 1) * 86400000)
        .toISOString().slice(0, 10);
      const [firstName, ...rest] = walkInForm.guest_name.trim().split(' ');
      const guest = await db.entities.Guest.create({
        first_name: firstName || walkInForm.guest_name,
        last_name: rest.join(' '),
        email: walkInForm.guest_email,
      });
      await db.entities.Reservation.create({
        property_id: room?.property_id || selectedProperty?.id || '',
        guest_id: guest.id,
        room_id: walkInForm.room_id,
        room_type_id: room?.room_type_id || '',
        reservation_number: `RES-${Date.now()}`,
        check_in: today,
        check_out: checkOut,
        adults: Number(walkInForm.adults) || 1,
        children: 0,
        status: 'checked_in',
        source: 'walk_in',
        currency,
        total_amount: 0,
        paid_amount: 0,
      });
      await db.entities.Room.update(walkInForm.room_id, { status: 'occupied' });
      setWalkInForm({ guest_name: '', guest_email: '', room_id: '', nights: 1, adults: 1 });
      setShowWalkIn(false);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!payingRes) return;
    setSaving(true);
    try {
      const amount = Number(paymentForm.amount) || 0;
      await db.entities.Payment.create({
        reservation_id: payingRes.id,
        property_id: payingRes.property_id,
        amount,
        method: paymentForm.method,
        currency,
        paid_at: new Date().toISOString(),
      });
      await db.entities.Reservation.update(payingRes.id, {
        paid_amount: (payingRes.paid_amount || 0) + amount,
      });
      setPaymentForm({ amount: 0, method: 'cash' });
      setPayingRes(null);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const today = getPropertyToday(selectedProperty);
  const activeRes = reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no_show');
  const arrivals = activeRes.filter(r => r.check_in === today);
  const departures = activeRes.filter(r => r.check_out === today);
  const inHouse = reservations.filter(r => r.status === 'checked_in');
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const pendingPayments = activeRes.filter(r => (r.total_amount || 0) > (r.paid_amount || 0));

  const stats = [
    { label: 'Arrivals', value: arrivals.length, icon: LogIn, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Departures', value: departures.length, icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'In-House', value: inHouse.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Available', value: availableRooms, icon: BedDouble, color: 'text-brand-navy', bg: 'bg-blue-50' },
  ];

  const getGuestName = (guestId) => {
    const g = guests.find(g => g.id === guestId);
    return g ? `${g.first_name} ${g.last_name}` : 'Unknown';
  };

  const filterBySearch = (list) => {
    if (!search) return list;
    return list.filter(r => getGuestName(r.guest_id).toLowerCase().includes(search.toLowerCase()));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Front Desk</h1>
          <p className="text-sm text-brand-slate mt-1">Manage today&apos;s arrivals, departures and in-house guests</p>
        </div>
        <button onClick={() => setShowWalkIn(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue transition-colors">
          <Plus className="w-4 h-4" />
          Walk-in
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-brand-border p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-brand-ink">{s.value}</p>
                  <p className="text-xs text-brand-slate">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-brand-border max-w-md">
        <Search className="w-4 h-4 text-brand-slate" />
        <input
          type="text"
          placeholder="Search by guest name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none flex-1 text-brand-ink placeholder:text-brand-slate-light"
        />
      </div>

      {/* Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">Today&apos;s Arrivals</h3>
          {filterBySearch(arrivals).length === 0 ? (
            <p className="text-sm text-brand-slate py-8 text-center">No arrivals for today</p>
          ) : (
            <div className="space-y-3">
              {filterBySearch(arrivals).map((res) => {
                const room = rooms.find(r => r.id === res.room_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg">
                    <div>
                      <p className="text-sm font-medium text-brand-ink">{getGuestName(res.guest_id)}</p>
                      <p className="text-xs text-brand-slate mt-0.5">
                        Room {room?.number || 'Unassigned'} · {res.adults} adults · {res.source}
                      </p>
                    </div>
                    {res.status === 'confirmed' ? (
                      <button
                        onClick={() => handleCheckIn(res.id, res.room_id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Check In
                      </button>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${resStatusColors[res.status] || 'bg-gray-100'}`}>
                        {res.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">Today&apos;s Departures</h3>
          {filterBySearch(departures).length === 0 ? (
            <p className="text-sm text-brand-slate py-8 text-center">No departures for today</p>
          ) : (
            <div className="space-y-3">
              {filterBySearch(departures).map((res) => {
                const room = rooms.find(r => r.id === res.room_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg">
                    <div>
                      <p className="text-sm font-medium text-brand-ink">{getGuestName(res.guest_id)}</p>
                      <p className="text-xs text-brand-slate mt-0.5">
                        Room {room?.number || 'N/A'} · Balance: {fmt((res.total_amount || 0) - (res.paid_amount || 0))}
                      </p>
                    </div>
                    {res.status === 'checked_in' ? (
                      <button
                        onClick={() => handleCheckOut(res.id, res.room_id)}
                        className="px-3 py-1.5 bg-orange-600 text-white text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Check Out
                      </button>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${resStatusColors[res.status] || 'bg-gray-100'}`}>
                        {res.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* In-House Guests */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <h3 className="text-base font-semibold text-brand-ink mb-4">In-House Guests ({inHouse.length})</h3>
        {inHouse.length === 0 ? (
          <p className="text-sm text-brand-slate py-8 text-center">No guests currently in house</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-slate border-b border-brand-border">
                  <th className="pb-2 font-medium">Guest</th>
                  <th className="pb-2 font-medium">Room</th>
                  <th className="pb-2 font-medium">Check-Out</th>
                  <th className="pb-2 font-medium">Balance</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {inHouse.map((res) => {
                  const room = rooms.find(r => r.id === res.room_id);
                  return (
                    <tr key={res.id} className="border-b border-brand-border last:border-0">
                      <td className="py-3 font-medium text-brand-ink">{getGuestName(res.guest_id)}</td>
                      <td className="py-3 text-brand-slate">{room?.number || 'N/A'}</td>
                      <td className="py-3 text-brand-slate">{res.check_out}</td>
                      <td className="py-3 text-brand-slate">{fmt((res.total_amount || 0) - (res.paid_amount || 0))}</td>
                      <td className="py-3">
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

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-semibold text-brand-ink">Pending Payments ({pendingPayments.length})</h3>
          </div>
          <div className="space-y-2">
            {pendingPayments.slice(0, 5).map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                <div>
                  <p className="text-sm font-medium text-brand-ink">{getGuestName(res.guest_id)}</p>
                  <p className="text-xs text-brand-slate mt-0.5">Outstanding: {fmt((res.total_amount || 0) - (res.paid_amount || 0))}</p>
                </div>
                <button
                  onClick={() => { setPayingRes(res); setPaymentForm({ amount: (res.total_amount || 0) - (res.paid_amount || 0), method: 'cash' }); }}
                  className="px-3 py-1.5 bg-brand-navy text-white text-xs font-medium rounded-lg hover:bg-brand-blue transition-colors"
                >
                  Take Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Walk-in dialog */}
      {showWalkIn && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowWalkIn(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Walk-in Guest</h3>
              <button onClick={() => setShowWalkIn(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={submitWalkIn} className="space-y-3">
              <input required placeholder="Guest full name" value={walkInForm.guest_name}
                onChange={e => setWalkInForm({ ...walkInForm, guest_name: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              <input type="email" placeholder="Email (optional)" value={walkInForm.guest_email}
                onChange={e => setWalkInForm({ ...walkInForm, guest_email: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              <select required value={walkInForm.room_id} onChange={e => setWalkInForm({ ...walkInForm, room_id: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                <option value="">Select an available room</option>
                {rooms.filter(r => r.status === 'available').map(r => (
                  <option key={r.id} value={r.id}>Room {r.number}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={1} placeholder="Nights" value={walkInForm.nights}
                  onChange={e => setWalkInForm({ ...walkInForm, nights: e.target.value })}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
                <input type="number" min={1} placeholder="Adults" value={walkInForm.adults}
                  onChange={e => setWalkInForm({ ...walkInForm, adults: e.target.value })}
                  className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              </div>
              {rooms.filter(r => r.status === 'available').length === 0 && (
                <p className="text-xs text-amber-600">No rooms currently show as available.</p>
              )}
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Check In Walk-in
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Take Payment dialog */}
      {payingRes && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPayingRes(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-brand-ink">Take Payment</h3>
              <button onClick={() => setPayingRes(null)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <p className="text-xs text-brand-slate mb-4">{getGuestName(payingRes.guest_id)} · Outstanding {fmt((payingRes.total_amount || 0) - (payingRes.paid_amount || 0))}</p>
            <form onSubmit={submitPayment} className="space-y-3">
              <input required type="number" min={0} step="0.01" placeholder="Amount" value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy" />
              <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Record Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}