const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from 'react';

import { ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';

const statusBlockColors = {
  confirmed: 'bg-blue-500',
  checked_in: 'bg-green-500',
  checked_out: 'bg-gray-400',
  cancelled: 'bg-red-400',
  pending: 'bg-amber-500',
  reserved: 'bg-purple-500',
};

export default function RoomRack() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

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

  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + weekOffset * 7);
      return d;
    });
  }, [weekOffset]);

  const dateStr = (d) => d.toISOString().split('T')[0];

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

  const getResForRoomOnDate = (roomId, date) => {
    const ds = dateStr(date);
    return reservations.find(r =>
      r.room_id === roomId &&
      r.status !== 'cancelled' &&
      r.check_in <= ds &&
      r.check_out > ds
    );
  };

  const sortedRooms = [...rooms].sort((a, b) => {
    const fa = parseInt(a.floor) || 0;
    const fb = parseInt(b.floor) || 0;
    if (fa !== fb) return fa - fb;
    return (a.number || '').localeCompare(b.number || '');
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Room Rack</h1>
          <p className="text-sm text-brand-slate mt-1">Visual overview of room availability and reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-2 bg-white border border-brand-border rounded-lg text-brand-slate hover:bg-brand-bg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-brand-ink px-3">
            {dates[0].toLocaleDateString('en', { month: 'short', day: 'numeric' })} — {dates[6].toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-2 bg-white border border-brand-border rounded-lg text-brand-slate hover:bg-brand-bg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Room Rack Grid */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        {sortedRooms.length === 0 ? (
          <div className="py-16 text-center">
            <Grid3X3 className="w-12 h-12 text-brand-border mx-auto mb-3" />
            <p className="text-sm text-brand-slate">No rooms configured yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-brand-bg border-b border-r border-brand-border px-4 py-3 text-left text-xs font-medium text-brand-slate min-w-[140px]">
                    Room
                  </th>
                  {dates.map((d, i) => {
                    const isToday = dateStr(d) === dateStr(new Date());
                    return (
                      <th
                        key={i}
                        className={`border-b border-r border-brand-border px-2 py-3 text-center text-xs font-medium min-w-[120px] ${
                          isToday ? 'bg-blue-50 text-brand-navy' : 'bg-brand-bg text-brand-slate'
                        }`}
                      >
                        <div>{d.toLocaleDateString('en', { weekday: 'short' })}</div>
                        <div className="text-sm font-semibold mt-0.5">{d.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-brand-bg transition-colors">
                    <td className="sticky left-0 z-10 bg-white border-b border-r border-brand-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-ink">{room.number}</span>
                        <span className="text-xs text-brand-slate">Fl {room.floor}</span>
                      </div>
                    </td>
                    {dates.map((d, i) => {
                      const res = getResForRoomOnDate(room.id, d);
                      const isToday = dateStr(d) === dateStr(new Date());
                      return (
                        <td
                          key={i}
                          className={`border-b border-r border-brand-border p-1 ${isToday ? 'bg-blue-50/30' : ''}`}
                        >
                          {res && (
                            <div
                              className={`${statusBlockColors[res.status] || 'bg-gray-400'} text-white text-xs px-2 py-2 rounded-md truncate cursor-pointer hover:opacity-90 transition-opacity`}
                              title={`${getGuestName(res.guest_id)} — ${res.check_in} to ${res.check_out}`}
                            >
                              <p className="font-medium truncate">{getGuestName(res.guest_id)}</p>
                              <p className="text-[10px] opacity-80 truncate">{res.status.replace(/_/g, ' ')}</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-brand-border p-4">
        <div className="flex items-center gap-6 flex-wrap">
          {Object.entries(statusBlockColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded ${color}`}></span>
              <span className="text-xs text-brand-slate capitalize">{status.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}