const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { TrendingUp, DollarSign, BedDouble, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#123B63', '#1F5A8A', '#2563EB', '#16A34A', '#F59E0B', '#DC2626'];

export default function Analytics() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resData, roomData] = await Promise.all([
          db.entities.Reservation.list(),
          db.entities.Room.list(),
        ]);
        setReservations(resData || []);
        setRooms(roomData || []);
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

  const activeRes = reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no_show');
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  const totalRevenue = activeRes.reduce((s, r) => s + (r.total_amount || 0), 0);
  const adr = activeRes.length > 0 ? Math.round(totalRevenue / activeRes.length) : 0;
  const revpar = rooms.length > 0 ? Math.round(totalRevenue / rooms.length) : 0;

  // 14-day trend
  const trendData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 13 + i);
    const ds = date.toISOString().split('T')[0];
    const dayRes = activeRes.filter(r => r.check_in <= ds && r.check_out > ds);
    const dayRev = dayRes.reduce((s, r) => s + (r.total_amount || 0), 0);
    const dayOcc = rooms.length > 0 ? Math.round((dayRes.length / rooms.length) * 100) : 0;
    return {
      date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      revenue: dayRev,
      occupancy: dayOcc,
      adr: dayRes.length > 0 ? Math.round(dayRev / dayRes.length) : 0,
    };
  });

  // Revenue by source
  const sourceData = Object.entries(
    activeRes.reduce((acc, r) => {
      acc[r.source || 'direct'] = (acc[r.source || 'direct'] || 0) + (r.total_amount || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const kpis = [
    { label: 'ADR', value: `$${adr}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'RevPAR', value: `$${revpar}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Occupancy', value: `${occupancyRate}%`, icon: BedDouble, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: BarChart3, color: 'text-[#123B63]', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17212B]">Revenue Analytics</h1>
        <p className="text-sm text-[#64748B] mt-1">ADR, RevPAR and occupancy trends for data-driven decisions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
                  <p className="text-xs text-[#64748B]">{k.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">Revenue Trend (14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#123B63" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#123B63" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#123B63" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">Occupancy Rate (14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <Bar dataKey="occupancy" fill="#1F5A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">Revenue by Booking Source</h3>
          {sourceData.length === 0 ? (
            <p className="text-sm text-[#64748B] py-12 text-center">No booking data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name }) => name}>
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h3 className="text-base font-semibold text-[#17212B] mb-4">ADR Trend (14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="adrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13 }} />
              <Area type="monotone" dataKey="adr" stroke="#16A34A" strokeWidth={2} fill="url(#adrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}