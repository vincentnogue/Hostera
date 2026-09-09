const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import {
  Building2, Hotel, Users, TrendingUp, AlertTriangle,
  LifeBuoy, Shield, ArrowUpRight, CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

const PLAN_PRICES = { starter: 49, professional: 129, business: 299, enterprise: 499 };
const PIE_COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#123B63', '#1F5A8A', '#DC2626'];

const darkTooltip = { borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0A1E30', color: '#fff', fontSize: 13 };

export default function PlatformOverview() {
  const [orgs, setOrgs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [orgData, subData, propData, incData, ticketData] = await Promise.all([
          db.entities.Organization.list(),
          db.entities.PlatformSubscription.list(),
          db.entities.Property.list(),
          db.entities.PlatformIncident.list(),
          db.entities.SupportTicket.list(),
        ]);
        setOrgs(orgData || []);
        setSubscriptions(subData || []);
        setProperties(propData || []);
        setIncidents(incData || []);
        setTickets(ticketData || []);
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
        <div className="w-8 h-8 border-4 border-brand-blue border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const mrr = activeSubs.reduce((s, x) => s + (x.mrr || PLAN_PRICES[x.plan] || 0), 0);
  const arr = mrr * 12;
  const trials = subscriptions.filter(s => s.status === 'trial').length;
  const pastDue = subscriptions.filter(s => s.status === 'past_due' || s.status === 'grace_period').length;
  const openIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'postmortem').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const countries = [...new Set(properties.map(p => p.country).filter(Boolean))].length;

  const kpis = [
    { label: 'Organizations', value: orgs.length, icon: Building2 },
    { label: 'Hotels / Properties', value: properties.length, icon: Hotel },
    { label: 'Countries', value: countries, icon: TrendingUp },
    { label: 'MRR', value: `$${mrr.toLocaleString()}`, icon: CreditCard },
    { label: 'ARR', value: `$${arr.toLocaleString()}`, icon: ArrowUpRight },
    { label: 'Active Subs', value: activeSubs.length, icon: CreditCard },
    { label: 'Trials', value: trials, icon: Users },
    { label: 'Past Due', value: pastDue, icon: AlertTriangle },
    { label: 'Open Tickets', value: openTickets, icon: LifeBuoy },
    { label: 'Incidents', value: openIncidents, icon: Shield },
  ];

  const mrrByPlan = Object.keys(PLAN_PRICES).map(plan => ({
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    mrr: subscriptions.filter(s => s.plan === plan && s.status === 'active').reduce((s, x) => s + (x.mrr || PLAN_PRICES[plan]), 0),
    customers: subscriptions.filter(s => s.plan === plan).length,
  }));

  const statusDist = ['active', 'trial', 'past_due', 'suspended', 'cancelled'].map(st => ({
    name: st.replace('_', ' '),
    value: subscriptions.filter(s => s.status === st).length,
  })).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-white/50 mt-1">Health of the entire Hostera business — {orgs.length} organizations, {properties.length} properties</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-brand-navy-900 border border-white/5 rounded-xl p-4">
              <Icon className="w-4 h-4 text-brand-blue mb-2" />
              <p className="text-xl font-bold text-white">{k.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-navy-900 border border-white/5 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">MRR by Plan</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mrrByPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="plan" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={darkTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="mrr" fill="#1F5A8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-brand-navy-900 border border-white/5 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Subscription Status</h3>
          {statusDist.length === 0 ? (
            <p className="text-sm text-white/40 py-16 text-center">No subscription data</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name }) => name}>
                  {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={darkTooltip} />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-navy-900 border border-white/5 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Recent Organizations</h3>
          <div className="space-y-2">
            {orgs.slice(0, 5).map(org => (
              <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                <div>
                  <p className="text-sm font-medium text-white">{org.name}</p>
                  <p className="text-xs text-white/40">{org.country || '—'} · {org.plan || 'starter'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                  org.status === 'active' ? 'bg-green-500/15 text-green-400' :
                  org.status === 'trial' ? 'bg-blue-500/15 text-blue-400' :
                  org.status === 'suspended' ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-white/50'
                }`}>{org.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-navy-900 border border-white/5 rounded-xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">Open Incidents</h3>
          {openIncidents === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">All systems operational</p>
          ) : (
            <div className="space-y-2">
              {incidents.filter(i => i.status !== 'resolved' && i.status !== 'postmortem').map(inc => (
                <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium text-white">{inc.title}</p>
                    <p className="text-xs text-white/40 capitalize">{inc.status} · {inc.owner || 'Unassigned'}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                    inc.severity === 'critical' ? 'bg-red-500/15 text-red-400' :
                    inc.severity === 'high' ? 'bg-orange-500/15 text-orange-400' :
                    'bg-blue-500/15 text-blue-400'
                  }`}>{inc.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}