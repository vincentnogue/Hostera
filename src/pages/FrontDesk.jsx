const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { LogIn, LogOut, Users, BedDouble, DollarSign, Plus, Search } from 'lucide-react';

const resStatusColors = {
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
};

export default function FrontDesk() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [resData, roomData, guestData] = await Promise.all([
        db.entities.Reservation.list(),
        db.entities.Room.list(),
        db.entities.Guest.list(),
      ]);
      setReservations(resData || []);
      setRooms(roomData || []);
      setGuests(guestData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
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
    { label: 'Available', value: availableRooms, icon: BedDouble, color: 'text-[#123B63]', bg: 'bg-blue-50' },
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
          <h1 className="text-2xl font-bold text-[#17212B]">Front Desk</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage today's arrivals, departures and in-house guests</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#123B63] text-white rounded-lg text-sm font-medium hover:bg-[#1F5A8A] transition-colors">
          <Plus className="w-4 h-4" />
          Walk-in
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#17212B]">{s.value}</p>
                  <p className="text-xs text-[#64748B]">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#E2E8F0] max-w-md">
        <Search className="w-4 h-4 text-[#64748B]" />
        <input
          type="text"
          placeholder="Search by guest name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none flex-1 text-[#17212B] placeholder:text-[#94A3B8]"
        />
      </div>

      {/* Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">Today's Arrivals</h3>
          {filterBySearch(arrivals).length === 0 ? (
            <p className="text-sm text-[#64748B] py-8 text-center">No arrivals for today</p>
          ) : (
            <div className="space-y-3">
              {filterBySearch(arrivals).map((res) => {
                const room = rooms.find(r => r.id === res.room_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F6F8FB]">
                    <div>
                      <p className="text-sm font-medium text-[#17212B]">{getGuestName(res.guest_id)}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
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

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">Today's Departures</h3>
          {filterBySearch(departures).length === 0 ? (
            <p className="text-sm text-[#64748B] py-8 text-center">No departures for today</p>
          ) : (
            <div className="space-y-3">
              {filterBySearch(departures).map((res) => {
                const room = rooms.find(r => r.id === res.room_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F6F8FB]">
                    <div>
                      <p className="text-sm font-medium text-[#17212B]">{getGuestName(res.guest_id)}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Room {room?.number || 'N/A'} · Balance: ${((res.total_amount || 0) - (res.paid_amount || 0))}
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
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="text-base font-semibold text-[#17212B] mb-4">In-House Guests ({inHouse.length})</h3>
        {inHouse.length === 0 ? (
          <p className="text-sm text-[#64748B] py-8 text-center">No guests currently in house</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#64748B] border-b border-[#E2E8F0]">
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
                    <tr key={res.id} className="border-b border-[#E2E8F0] last:border-0">
                      <td className="py-3 font-medium text-[#17212B]">{getGuestName(res.guest_id)}</td>
                      <td className="py-3 text-[#64748B]">{room?.number || 'N/A'}</td>
                      <td className="py-3 text-[#64748B]">{res.check_out}</td>
                      <td className="py-3 text-[#64748B]">${((res.total_amount || 0) - (res.paid_amount || 0))}</td>
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-semibold text-[#17212B]">Pending Payments ({pendingPayments.length})</h3>
          </div>
          <div className="space-y-2">
            {pendingPayments.slice(0, 5).map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                <div>
                  <p className="text-sm font-medium text-[#17212B]">{getGuestName(res.guest_id)}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Outstanding: ${((res.total_amount || 0) - (res.paid_amount || 0))}</p>
                </div>
                <button className="px-3 py-1.5 bg-[#123B63] text-white text-xs font-medium rounded-lg hover:bg-[#1F5A8A] transition-colors">
                  Take Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}