const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import {
  TrendingUp, DollarSign, LogIn, LogOut, BedDouble,
  Users, AlertCircle, ArrowUpRight, CalendarCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts';

const statusColors = {
  available: 'bg-green-500',
  occupied: 'bg-blue-500',
  reserved: 'bg-purple-500',
  dirty: 'bg-orange-500',
  clean: 'bg-teal-500',
  inspected: 'bg-green-600',
  out_of_order: 'bg-red-500',
  maintenance: 'bg-red-500',
};

const resStatusColors = {
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
};

export default function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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

  const today = new Date().toISOString().split('T')[0];
  const activeRes = reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no_show');
  const arrivals = activeRes.filter(r => r.check_in === today);
  const departures = activeRes.filter(r => r.check_out === today);
  const inHouse = reservations.filter(r => r.status === 'checked_in');
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  const totalRevenue = activeRes.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const adr = activeRes.length > 0 ? Math.round(totalRevenue / activeRes.length) : 0;
  const revpar = rooms.length > 0 ? Math.round(totalRevenue / rooms.length) : 0;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayRes = activeRes.filter(r => r.check_in <= dateStr && r.check_out > dateStr);
    return {
      date: date.toLocaleDateString('en', { weekday: 'short' }),
      revenue: dayRes.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      occupancy: rooms.length > 0 ? Math.round((dayRes.length / rooms.length) * 100) : 0,
    };
  });

  const roomStatusCounts = {
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    dirty: rooms.filter(r => r.status === 'dirty').length,
    clean: rooms.filter(r => r.status === 'clean').length,
    inspected: rooms.filter(r => r.status === 'inspected').length,
    out_of_order: rooms.filter(r => r.status === 'out_of_order' || r.status === 'maintenance').length,
  };

  const kpis = [
    { label: 'Occupancy', value: `${occupancyRate}%`, icon: BedDouble, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+5%' },
    { label: 'ADR', value: `$${adr}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', trend: '+$12' },
    { label: 'RevPAR', value: `$${revpar}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+$8' },
    { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-[#123B63]', bg: 'bg-blue-50', trend: '+15%' },
    { label: 'Arrivals', value: arrivals.length, icon: LogIn, color: 'text-green-600', bg: 'bg-green-50', trend: '' },
    { label: 'Departures', value: departures.length, icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-50', trend: '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17212B]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-[18px] h-[18px] ${kpi.color}`} />
                </div>
                {kpi.trend && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    {kpi.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-[#17212B]">{kpi.value}</p>
              <p className="text-xs text-[#64748B] mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#17212B]">Revenue Trend</h3>
            <span className="text-xs text-[#64748B]">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#123B63" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#123B63" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#123B63" strokeWidth={2} fill="url(#revGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">Room Status</h3>
          <div className="space-y-3">
            {Object.entries(roomStatusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || 'bg-gray-300'}`}></span>
                  <span className="text-sm text-[#64748B] capitalize">{status.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-sm font-semibold text-[#17212B]">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Total Rooms</span>
              <span className="text-sm font-semibold text-[#17212B]">{rooms.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">
            Today's Arrivals ({arrivals.length})
          </h3>
          {arrivals.length === 0 ? (
            <p className="text-sm text-[#64748B] py-8 text-center">No arrivals scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {arrivals.map((res) => {
                const guest = guests.find(g => g.id === res.guest_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F6F8FB]">
                    <div>
                      <p className="text-sm font-medium text-[#17212B]">
                        {guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {res.adults} adults · {res.children} children · {res.source}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${resStatusColors[res.status] || 'bg-gray-100'}`}>
                      {res.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">
            Today's Departures ({departures.length})
          </h3>
          {departures.length === 0 ? (
            <p className="text-sm text-[#64748B] py-8 text-center">No departures scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {departures.map((res) => {
                const guest = guests.find(g => g.id === res.guest_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F6F8FB]">
                    <div>
                      <p className="text-sm font-medium text-[#17212B]">
                        {guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {res.adults} adults · {res.children} children · ${res.total_amount || 0}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${resStatusColors[res.status] || 'bg-gray-100'}`}>
                      {res.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* In-House Guests & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">
            In-House Guests ({inHouse.length})
          </h3>
          {inHouse.length === 0 ? (
            <p className="text-sm text-[#64748B] py-8 text-center">No guests currently checked in</p>
          ) : (
            <div className="space-y-2">
              {inHouse.slice(0, 5).map((res) => {
                const guest = guests.find(g => g.id === res.guest_id);
                const room = rooms.find(r => r.id === res.room_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F6F8FB]">
                    <div>
                      <p className="text-sm font-medium text-[#17212B]">
                        {guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest'}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Room {room?.number || 'N/A'} · Check-out {res.check_out}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#F6F8FB]">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#123B63]" />
                <span className="text-xs text-[#64748B]">Total Guests</span>
              </div>
              <p className="text-xl font-bold text-[#17212B]">{guests.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F6F8FB]">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-4 h-4 text-[#123B63]" />
                <span className="text-xs text-[#64748B]">Active Reservations</span>
              </div>
              <p className="text-xl font-bold text-[#17212B]">{activeRes.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F6F8FB]">
              <div className="flex items-center gap-2 mb-2">
                <BedDouble className="w-4 h-4 text-[#123B63]" />
                <span className="text-xs text-[#64748B]">Available Rooms</span>
              </div>
              <p className="text-xl font-bold text-[#17212B]">{roomStatusCounts.available}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F6F8FB]">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-[#64748B]">Dirty Rooms</span>
              </div>
              <p className="text-xl font-bold text-[#17212B]">{roomStatusCounts.dirty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}