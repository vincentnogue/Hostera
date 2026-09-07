const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import {
  CalendarCheck, MapPin, Users, Clock, Receipt, CreditCard,
  Bell, Coffee, Wifi, Car, Sparkles
} from 'lucide-react';

export default function GuestPortal() {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    early_checkin: false, late_checkout: false,
    quiet_room: false, high_floor: false, extra_pillows: false,
  });

  const fetchData = async () => {
    try {
      const [resData, guestData, roomData, invData] = await Promise.all([
        db.entities.Reservation.list(),
        db.entities.Guest.list(),
        db.entities.Room.list(),
        db.entities.Invoice.list(),
      ]);
      setReservations(resData || []);
      setGuests(guestData || []);
      setRooms(roomData || []);
      setInvoices(invData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePrefChange = async (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    try {
      const guest = guests[0];
      if (guest) {
        await db.entities.Guest.update(guest.id, {
          preferences: Object.entries(newPrefs).filter(([_, v]) => v).map(([k]) => k.replace(/_/g, ' ')).join(', ')
        });
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const upcoming = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
  const currentGuest = guests[0];
  const guestInvoices = invoices.slice(0, 5);

  const prefOptions = [
    { key: 'early_checkin', label: 'Early Check-In', icon: Clock, desc: 'Request to check in before standard time' },
    { key: 'late_checkout', label: 'Late Check-Out', icon: Clock, desc: 'Request a later departure time' },
    { key: 'quiet_room', label: 'Quiet Room', icon: Bell, desc: 'Away from elevators and noise' },
    { key: 'high_floor', label: 'High Floor', icon: MapPin, desc: 'Prefer a room on a higher floor' },
    { key: 'extra_pillows', label: 'Extra Pillows', icon: Sparkles, desc: 'Additional pillows for comfort' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-[#17212B]">Guest Portal</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Welcome{currentGuest ? `, ${currentGuest.first_name}` : ''} — manage your stay
        </p>
      </div>

      {/* Upcoming Reservations */}
      {upcoming.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] py-16 text-center">
          <CalendarCheck className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No upcoming reservations</p>
        </div>
      ) : (
        upcoming.map((res) => {
          const guest = guests.find(g => g.id === res.guest_id);
          const room = rooms.find(r => r.id === res.room_id);
          return (
            <div key={res.id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="bg-[#123B63] p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide">Reservation</p>
                    <p className="text-lg font-bold">{res.reservation_number}</p>
                  </div>
                  <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-medium capitalize backdrop-blur-sm">
                    {res.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F6F8FB] flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#123B63]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#17212B]">Room {room?.number || 'TBA'}</p>
                    <p className="text-xs text-[#64748B]">Floor {room?.floor || '—'} · {guest ? `${guest.first_name} ${guest.last_name}` : ''}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#F6F8FB] rounded-lg">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Check-In</p>
                    <p className="text-sm font-semibold text-[#17212B] mt-0.5">{res.check_in}</p>
                  </div>
                  <div className="p-3 bg-[#F6F8FB] rounded-lg">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Check-Out</p>
                    <p className="text-sm font-semibold text-[#17212B] mt-0.5">{res.check_out}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F6F8FB] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#64748B]" />
                    <span className="text-sm text-[#17212B]">{res.adults} adults · {res.children} children</span>
                  </div>
                  <span className="text-sm font-bold text-[#123B63]">${res.total_amount || 0}</span>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Check-in Preferences */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h2 className="text-base font-semibold text-[#17212B] mb-4">Check-In Preferences</h2>
        <div className="space-y-2">
          {prefOptions.map((opt) => {
            const Icon = opt.icon;
            const active = preferences[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => handlePrefChange(opt.key)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                  active ? 'border-[#123B63] bg-blue-50/30' : 'border-[#E2E8F0] hover:bg-[#F6F8FB]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-[#123B63]' : 'bg-[#F6F8FB]'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#64748B]'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#17212B]">{opt.label}</p>
                    <p className="text-xs text-[#64748B]">{opt.desc}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'bg-[#123B63] border-[#123B63]' : 'border-[#E2E8F0]'}`}>
                  {active && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Billing & Receipts */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-[#123B63]" />
          <h2 className="text-base font-semibold text-[#17212B]">Billing & Receipts</h2>
        </div>
        {guestInvoices.length === 0 ? (
          <p className="text-sm text-[#64748B] py-6 text-center">No billing documents yet</p>
        ) : (
          <div className="space-y-2">
            {guestInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F6F8FB]">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-[#64748B]" />
                  <div>
                    <p className="text-sm font-medium text-[#17212B]">{inv.invoice_number || 'Invoice'}</p>
                    <p className="text-xs text-[#64748B]">{inv.issue_date || ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#17212B]">${inv.total || 0}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}