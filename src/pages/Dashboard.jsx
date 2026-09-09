const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import {
  TrendingUp, DollarSign, LogIn, LogOut, BedDouble,
  Users, AlertCircle, ArrowUpRight, ArrowDownRight, CalendarCheck
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
  const { selectedProperty, scopeIds, loading: propsLoading } = useProperty();
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propsLoading) return;
    async function fetchData() {
      setLoading(true);
      try {
        const [resData, roomData, guestData] = await Promise.all([
          db.entities.Reservation.list(),
          db.entities.Room.list(),
          db.entities.Guest.list(),
        ]);
        // Reservation and Room carry property_id; scope to the current
        // selection. Records with no property_id (not yet migrated /
        // single-property setups) are kept rather than hidden, so an
        // incomplete data model doesn't silently blank the dashboard.
        const inScope = (r) => !r.property_id || (scopeIds || []).includes(r.property_id);
        setReservations((resData || []).filter(inScope));
        setRooms((roomData || []).filter(inScope));
        setGuests(guestData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [propsLoading, scopeIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const currency = selectedProperty?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

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

  // Honest week-over-week comparison from the reservations already in
  // memory, instead of hardcoded trend numbers that never reflected
  // anything real.
  const msPerDay = 86400000;
  const todayDate = new Date(today);
  const inWindow = (dateStr, startOffset, endOffset) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const diff = (todayDate - d) / msPerDay;
    return diff >= endOffset && diff < startOffset;
  };
  const revenueInWindow = (startOffset, endOffset) =>
    activeRes
      .filter(r => inWindow(r.check_in, startOffset, endOffset))
      .reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const thisWeekRevenue = revenueInWindow(7, 0);
  const lastWeekRevenue = revenueInWindow(14, 7);
  const revenueTrendPct = lastWeekRevenue > 0
    ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100)
    : null;


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
    { label: 'Occupancy', value: `${occupancyRate}%`, icon: BedDouble, color: 'text-blue-600', bg: 'bg-blue-50', trend: null },
    { label: 'ADR', value: fmt(adr), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', trend: null },
    { label: 'RevPAR', value: fmt(revpar), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: null },
    { label: 'Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-brand-navy', bg: 'bg-blue-50', trend: revenueTrendPct },
    { label: 'Arrivals', value: arrivals.length, icon: LogIn, color: 'text-green-600', bg: 'bg-green-50', trend: null },
    { label: 'Departures', value: departures.length, icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-50', trend: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Dashboard</h1>
        <p className="text-sm text-brand-slate mt-1">
          {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}
          {selectedProperty ? selectedProperty.name : 'All properties'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-brand-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-[18px] h-[18px] ${kpi.color}`} />
                </div>
                {kpi.trend !== null && kpi.trend !== undefined && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-brand-ink">{kpi.value}</p>
              <p className="text-xs text-brand-slate mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-brand-ink">Revenue Trend</h3>
            <span className="text-xs text-brand-slate">Last 7 days</span>
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

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">Room Status</h3>
          <div className="space-y-3">
            {Object.entries(roomStatusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || 'bg-gray-300'}`}></span>
                  <span className="text-sm text-brand-slate capitalize">{status.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-sm font-semibold text-brand-ink">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-brand-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-slate">Total Rooms</span>
              <span className="text-sm font-semibold text-brand-ink">{rooms.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arrivals & Departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">
            Today&apos;s Arrivals ({arrivals.length})
          </h3>
          {arrivals.length === 0 ? (
            <p className="text-sm text-brand-slate py-8 text-center">No arrivals scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {arrivals.map((res) => {
                const guest = guests.find(g => g.id === res.guest_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg">
                    <div>
                      <p className="text-sm font-medium text-brand-ink">
                        {guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest'}
                      </p>
                      <p className="text-xs text-brand-slate mt-0.5">
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

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">
            Today&apos;s Departures ({departures.length})
          </h3>
          {departures.length === 0 ? (
            <p className="text-sm text-brand-slate py-8 text-center">No departures scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {departures.map((res) => {
                const guest = guests.find(g => g.id === res.guest_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg">
                    <div>
                      <p className="text-sm font-medium text-brand-ink">
                        {guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest'}
                      </p>
                      <p className="text-xs text-brand-slate mt-0.5">
                        {res.adults} adults · {res.children} children · {fmt(res.total_amount)}
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
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">
            In-House Guests ({inHouse.length})
          </h3>
          {inHouse.length === 0 ? (
            <p className="text-sm text-brand-slate py-8 text-center">No guests currently checked in</p>
          ) : (
            <div className="space-y-2">
              {inHouse.slice(0, 5).map((res) => {
                const guest = guests.find(g => g.id === res.guest_id);
                const room = rooms.find(r => r.id === res.room_id);
                return (
                  <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-bg">
                    <div>
                      <p className="text-sm font-medium text-brand-ink">
                        {guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest'}
                      </p>
                      <p className="text-xs text-brand-slate mt-0.5">
                        Room {room?.number || 'N/A'} · Check-out {res.check_out}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-base font-semibold text-brand-ink mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-brand-bg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-brand-navy" />
                <span className="text-xs text-brand-slate">Total Guests</span>
              </div>
              <p className="text-xl font-bold text-brand-ink">{guests.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-brand-bg">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-4 h-4 text-brand-navy" />
                <span className="text-xs text-brand-slate">Active Reservations</span>
              </div>
              <p className="text-xl font-bold text-brand-ink">{activeRes.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-brand-bg">
              <div className="flex items-center gap-2 mb-2">
                <BedDouble className="w-4 h-4 text-brand-navy" />
                <span className="text-xs text-brand-slate">Available Rooms</span>
              </div>
              <p className="text-xl font-bold text-brand-ink">{roomStatusCounts.available}</p>
            </div>
            <div className="p-4 rounded-lg bg-brand-bg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-brand-slate">Dirty Rooms</span>
              </div>
              <p className="text-xl font-bold text-brand-ink">{roomStatusCounts.dirty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}