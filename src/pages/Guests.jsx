const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Search, Users, Mail, Phone, MapPin } from 'lucide-react';

const vipColors = {
  none: 'bg-gray-100 text-gray-600',
  silver: 'bg-gray-200 text-gray-700',
  gold: 'bg-amber-100 text-amber-700',
  platinum: 'bg-purple-100 text-purple-700',
};

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [guestData, resData] = await Promise.all([
          db.entities.Guest.list(),
          db.entities.Reservation.list(),
        ]);
        setGuests(guestData || []);
        setReservations(resData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtered = guests.filter(g => {
    if (!search) return true;
    const name = `${g.first_name} ${g.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) ||
      (g.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (g.phone || '').includes(search);
  });

  const getGuestReservations = (guestId) => reservations.filter(r => r.guest_id === guestId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Guests</h1>
          <p className="text-sm text-[#64748B] mt-1">{filtered.length} guests in directory</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#E2E8F0] max-w-md">
        <Search className="w-4 h-4 text-[#64748B]" />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none flex-1 text-[#17212B] placeholder:text-[#94A3B8]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] py-16 text-center">
          <Users className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No guests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((guest) => {
            const guestRes = getGuestReservations(guest.id);
            const activeRes = guestRes.filter(r => r.status !== 'cancelled');
            return (
              <div key={guest.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#123B63] text-white flex items-center justify-center text-sm font-medium">
                      {guest.first_name?.[0]}{guest.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#17212B]">
                        {guest.first_name} {guest.last_name}
                      </h3>
                      {guest.vip_status && guest.vip_status !== 'none' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${vipColors[guest.vip_status]} inline-block mt-1`}>
                          {guest.vip_status.toUpperCase()} VIP
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {guest.country && (
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{guest.city ? `${guest.city}, ` : ''}{guest.country}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#E2E8F0]">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#17212B]">{activeRes.length}</p>
                    <p className="text-[10px] text-[#64748B]">Stays</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#17212B]">${guest.total_spent || 0}</p>
                    <p className="text-[10px] text-[#64748B]">Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#17212B]">{guest.loyalty_points || 0}</p>
                    <p className="text-[10px] text-[#64748B]">Points</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}