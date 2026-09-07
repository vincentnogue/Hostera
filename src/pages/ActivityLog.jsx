const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { History, Search, AlertTriangle, Info, ShieldAlert, User, Clock } from 'lucide-react';

const severityConfig = {
  info: { icon: Info, dot: 'bg-blue-400', pill: 'bg-blue-50 text-blue-700' },
  warning: { icon: AlertTriangle, dot: 'bg-amber-400', pill: 'bg-amber-50 text-amber-700' },
  critical: { icon: ShieldAlert, dot: 'bg-red-400', pill: 'bg-red-50 text-red-600' },
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    db.entities.AuditLog.list('-timestamp', 200)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const matchSeverity = severity === 'all' || l.severity === severity;
    const q = search.toLowerCase();
    const matchSearch = !q || (l.action || '').toLowerCase().includes(q) || (l.user_name || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q) || (l.entity_type || '').toLowerCase().includes(q);
    return matchSeverity && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17212B]">Activity Log</h1>
        <p className="text-sm text-[#64748B]">Chronological record of all system actions, changes and user activities.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length },
          { label: 'Warnings', value: logs.filter(l => l.severity === 'warning').length },
          { label: 'Critical', value: logs.filter(l => l.severity === 'critical').length },
          { label: 'Active Users', value: new Set(logs.map(l => l.user_name)).size },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
            <p className="text-[11px] text-[#64748B]">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-[#E2E8F0] flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actions, users, entities…" className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <div className="flex gap-2">
          {['all', 'info', 'warning', 'critical'].map(s => (
            <button key={s} onClick={() => setSeverity(s)} className={`px-3.5 py-2 text-xs font-medium rounded-full capitalize ${severity === s ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading activity…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center">
          <History className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="space-y-0">
            {filtered.map((log, i) => {
              const config = severityConfig[log.severity] || severityConfig.info;
              const Icon = config.icon;
              return (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full bg-[#F6F8FB] flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${log.severity === 'critical' ? 'text-red-500' : log.severity === 'warning' ? 'text-amber-500' : 'text-[#1F5A8A]'}`} />
                    </div>
                    {i < filtered.length - 1 && <div className="w-px flex-1 bg-[#E2E8F0] my-1" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#17212B]">{log.action}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.pill}`}>{log.severity}</span>
                      {log.entity_type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F6F8FB] text-[#64748B] border border-[#E2E8F0]">{log.entity_type}</span>}
                    </div>
                    {log.details && <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">{log.details}</p>}
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-[#94A3B8]">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.user_name}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}