const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Activity, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const SERVICES = [
  { key: 'Hostera App', icon: Activity },
  { key: 'API', icon: Activity },
  { key: 'Authentication', icon: Activity },
  { key: 'Payments', icon: Activity },
  { key: 'Notifications', icon: Activity },
  { key: 'Integrations', icon: Activity },
];

const incidentSeverityColors = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-blue-500/15 text-blue-400',
};

export default function PlatformSystemHealth() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await db.entities.PlatformIncident.list('-started_at', 50);
      setIncidents(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const advanceIncident = async (incident) => {
    const flow = ['detected', 'investigating', 'contained', 'resolved', 'postmortem'];
    const next = flow[Math.min(flow.indexOf(incident.status) + 1, flow.length - 1)];
    try {
      const updates = { status: next };
      if (next === 'resolved') updates.resolved_at = new Date().toISOString();
      await db.entities.PlatformIncident.update(incident.id, updates);
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: `incident status → ${next}`,
        entity_type: 'platform_incident',
        entity_id: incident.id,
        details: incident.title,
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#1F5A8A] border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'postmortem');
  const affectedServices = new Set(activeIncidents.flatMap(i => i.affected_services || []));

  const serviceStatus = (name) => {
    if (!affectedServices.has(name)) return 'operational';
    const hasCritical = activeIncidents.some(i => (i.affected_services || []).includes(name) && i.severity === 'critical');
    return hasCritical ? 'outage' : 'degraded';
  };

  const statusStyles = {
    operational: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Operational' },
    degraded: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Degraded' },
    outage: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Outage' },
  };

  const flow = ['detected', 'investigating', 'contained', 'resolved', 'postmortem'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-sm text-white/50 mt-1">Global platform status and incident management</p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SERVICES.map(svc => {
          const st = serviceStatus(svc.key);
          const config = statusStyles[st];
          const StatusIcon = config.icon;
          return (
            <div key={svc.key} className={`rounded-xl border p-5 ${config.bg} ${config.border}`}>
              <div className="flex items-center justify-between mb-3">
                <svc.icon className="w-5 h-5 text-white/60" />
                <StatusIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-white">{svc.key}</h3>
              <p className={`text-xs mt-0.5 ${config.color}`}>{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Incidents */}
      <div className="bg-[#0A1E30] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Incidents ({incidents.length})</h3>
          {activeIncidents.length === 0 ? (
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> All resolved
            </span>
          ) : (
            <span className="text-xs text-amber-400">{activeIncidents.length} active</span>
          )}
        </div>
        {incidents.length === 0 ? (
          <p className="text-sm text-white/40 py-16 text-center">No incidents recorded</p>
        ) : (
          <div className="divide-y divide-white/5">
            {incidents.map(inc => (
              <div key={inc.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-semibold text-white">{inc.title}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${incidentSeverityColors[inc.severity] || incidentSeverityColors.low}`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/10 text-white/50 capitalize">{inc.status}</span>
                  </div>
                  <p className="text-xs text-white/50">{inc.description}</p>
                  <p className="text-[10px] text-white/30 mt-1">
                    Started {inc.started_at ? new Date(inc.started_at).toLocaleString() : '—'} · Owner: {inc.owner || 'Unassigned'}
                    {(inc.affected_services || []).length > 0 && ` · Services: ${inc.affected_services.join(', ')}`}
                  </p>
                </div>
                {inc.status !== 'postmortem' && (
                  <button
                    onClick={() => advanceIncident(inc)}
                    className="px-3 py-1.5 bg-[#1F5A8A] text-white text-xs font-medium rounded-lg hover:bg-[#2563EB] transition-colors shrink-0"
                  >
                    {flow[Math.min(flow.indexOf(inc.status) + 1, flow.length - 1)] === 'resolved' ? 'Resolve' : 'Advance →'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-white/30">
        Service status is derived from active incidents. Incident status transitions follow the controlled workflow:
        Detected → Investigating → Contained → Resolved → Postmortem.
      </p>
    </div>
  );
}