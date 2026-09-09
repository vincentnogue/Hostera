const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import Reveal from '@/components/marketing/Reveal';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

const SERVICES = ['Hostera App', 'API', 'Authentication', 'Booking Engine', 'Payments', 'Notifications', 'Integrations', 'Guest App'];

const statusStyles = {
  operational: { icon: CheckCircle2, label: 'Operational', dot: 'bg-green-500', text: 'text-green-600' },
  degraded: { icon: AlertTriangle, label: 'Degraded', dot: 'bg-amber-500', text: 'text-amber-600' },
  outage: { icon: XCircle, label: 'Outage', dot: 'bg-red-500', text: 'text-red-600' },
};

export default function StatusPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await db.entities.PlatformIncident.list('-started_at', 50);
        setIncidents(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const active = incidents.filter(i => i.status !== 'resolved' && i.status !== 'postmortem');
  const affected = new Set(active.flatMap(i => i.affected_services || []));
  const statusOf = (name) =>
    !affected.has(name) ? 'operational'
      : active.some(i => (i.affected_services || []).includes(name) && i.severity === 'critical') ? 'outage'
      : 'degraded';
  const allOperational = active.length === 0;

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="bg-brand-navy-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 border border-white/10 uppercase tracking-wide">System Status</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">Hostera status</h1>
            {loading ? (
              <p className="text-white/50">Loading live status…</p>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/10 border border-white/15">
                <span className={`w-2.5 h-2.5 rounded-full ${allOperational ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
                <span className="text-sm font-semibold text-white">
                  {allOperational ? 'All systems operational' : `${active.length} active incident${active.length > 1 ? 's' : ''}`}
                </span>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-6 space-y-3">
          {SERVICES.map((name, i) => {
            const st = loading ? 'operational' : statusOf(name);
            const config = statusStyles[st];
            const Icon = config.icon;
            return (
              <Reveal key={name} delay={i * 0.04}>
                <div className="flex items-center justify-between p-5 rounded-2xl border border-brand-border hover:border-brand-blue/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-gray-300 animate-pulse' : config.dot}`} />
                    <div>
                      <p className="text-sm font-semibold text-brand-ink">{name}</p>
                      <p className="text-xs text-brand-slate">Live status</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-sm font-medium ${loading ? 'text-gray-400' : config.text}`}>
                    <Icon className="w-4 h-4" />
                    {loading ? 'Checking…' : config.label}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* INCIDENTS */}
      <section className="py-14 bg-brand-bg">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-8">
              <Activity className="w-5 h-5 text-brand-navy" />
              <h2 className="text-2xl font-bold text-brand-ink">Incident history</h2>
            </div>
          </Reveal>
          {loading ? (
            <p className="text-sm text-brand-slate">Loading incidents…</p>
          ) : incidents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-brand-border text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-brand-ink">No incidents recorded</p>
              <p className="text-xs text-brand-slate mt-1">The platform has been running without incidents.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(inc => {
                const resolved = inc.status === 'resolved' || inc.status === 'postmortem';
                return (
                  <Reveal key={inc.id}>
                    <div className="p-6 rounded-2xl bg-white border border-brand-border">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${resolved ? 'bg-green-100 text-green-700' : inc.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {resolved ? 'Resolved' : inc.severity.toUpperCase()}
                        </span>
                        <h3 className="text-sm font-semibold text-brand-ink">{inc.title}</h3>
                      </div>
                      <p className="text-[13px] text-brand-slate leading-relaxed mb-3">{inc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-brand-slate flex-wrap">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{inc.started_at ? new Date(inc.started_at).toLocaleString() : '—'}</span>
                        <span className="capitalize">Status: {inc.status}</span>
                        {(inc.affected_services || []).length > 0 && <span>Affected: {inc.affected_services.join(', ')}</span>}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
          <Reveal>
            <p className="text-xs text-brand-slate mt-6">
              Status is derived from live platform incident data. For questions,{' '}
              <Link to="/contact" className="text-brand-navy font-semibold hover:underline">contact us</Link>.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}