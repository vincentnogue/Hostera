const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import CommunicationActions from '@/components/CommunicationActions';

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
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
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
          <h1 className="text-2xl font-bold text-brand-ink">Guests</h1>
          <p className="text-sm text-brand-slate mt-1">{filtered.length} guests in directory</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-brand-border max-w-md">
        <Search className="w-4 h-4 text-brand-slate" />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none flex-1 text-brand-ink placeholder:text-brand-slate-light"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-border py-16 text-center">
          <Users className="w-12 h-12 text-brand-border mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No guests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((guest) => {
            const guestRes = getGuestReservations(guest.id);
            const activeRes = guestRes.filter(r => r.status !== 'cancelled');
            return (
              <div key={guest.id} className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-medium">
                      {guest.first_name?.[0]}{guest.last_name?.[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-ink">
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
                    <div className="flex items-center gap-2 text-xs text-brand-slate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-xs text-brand-slate">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                  {guest.country && (
                    <div className="flex items-center gap-2 text-xs text-brand-slate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{guest.city ? `${guest.city}, ` : ''}{guest.country}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-brand-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-brand-ink">{activeRes.length}</p>
                    <p className="text-[10px] text-brand-slate">Stays</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-brand-ink">${guest.total_spent || 0}</p>
                    <p className="text-[10px] text-brand-slate">Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-brand-ink">{guest.loyalty_points || 0}</p>
                    <p className="text-[10px] text-brand-slate">Points</p>
                  </div>
                </div>

                {(guest.email || guest.phone) && (
                  <div className="mt-4 pt-4 border-t border-brand-border">
                    <CommunicationActions
                      email={guest.email}
                      phone={guest.phone}
                      guestName={`${guest.first_name || ''} ${guest.last_name || ''}`.trim()}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}