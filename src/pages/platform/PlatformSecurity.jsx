const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Shield, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15', label: 'Critical' },
  high: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/15', label: 'High' },
  medium: { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Medium' },
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15', label: 'Low' },
  informational: { icon: Info, color: 'text-white/50', bg: 'bg-white/10', label: 'Info' },
};

const statusFlow = ['new', 'investigating', 'resolved'];

export default function PlatformSecurity() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');

  const fetchData = async () => {
    try {
      const data = await db.entities.SecurityAlert.list('-detected_at', 100);
      setAlerts(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const advanceStatus = async (alert) => {
    try {
      const next = statusFlow[Math.min(statusFlow.indexOf(alert.status) + 1, statusFlow.length - 1)];
      const updates = { status: next };
      if (next === 'investigating') updates.acknowledged_by = 'Platform Admin';
      if (next === 'resolved') updates.acknowledged_by = 'Platform Admin';
      await db.entities.SecurityAlert.update(alert.id, updates);
      await db.entities.AuditLog.create({
        user_name: 'Platform Admin',
        action: `security alert ${next}`,
        entity_type: 'security_alert',
        entity_id: alert.id,
        details: alert.title,
        severity: alert.severity === 'critical' ? 'critical' : 'warning',
        timestamp: new Date().toISOString(),
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const unacknowledgedCritical = alerts.filter(a => a.severity === 'critical' && a.status === 'new').length;
  const open = alerts.filter(a => a.status !== 'resolved').length;

  const filtered = severityFilter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === severityFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security Center</h1>
        <p className="text-sm text-white/50 mt-1">Security alerts, suspicious activity and incident response</p>
      </div>

      {unacknowledgedCritical > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            {unacknowledgedCritical} critical alert{unacknowledgedCritical > 1 ? 's' : ''} require acknowledgment.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Alerts', value: open },
          { label: 'Critical (Unacked)', value: unacknowledgedCritical },
          { label: 'Resolved', value: alerts.filter(a => a.status === 'resolved').length },
          { label: 'Total Events', value: alerts.length },
        ].map(s => (
          <div key={s.label} className="bg-brand-navy-900 border border-white/5 rounded-xl p-4">
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'critical', 'high', 'medium', 'low'].map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              severityFilter === s ? 'bg-brand-blue text-white' : 'bg-brand-navy-900 border border-white/5 text-white/50 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-brand-navy-900 border border-white/5 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No security alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(alert => {
              const config = severityConfig[alert.severity] || severityConfig.low;
              const SevIcon = config.icon;
              return (
                <div key={alert.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/[0.02]">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                      <SevIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{alert.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>{config.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-white/10 text-white/50 capitalize">{alert.status}</span>
                      </div>
                      {alert.details && <p className="text-xs text-white/50 mt-1">{alert.details}</p>}
                      <p className="text-[10px] text-white/30 mt-1">
                        {alert.detected_at ? new Date(alert.detected_at).toLocaleString() : ''}
                        {alert.acknowledged_by ? ` · Ack by ${alert.acknowledged_by}` : ''}
                      </p>
                    </div>
                  </div>
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => advanceStatus(alert)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white text-xs font-medium rounded-lg hover:bg-[#2563EB] transition-colors shrink-0"
                    >
                      {alert.status === 'new' ? (
                        <>Acknowledge & Investigate</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Resolve</>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-white/30">
        Every alert acknowledgment, investigation and resolution is written to the immutable platform audit log.
      </p>
    </div>
  );
}