const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { FileText, Search, Info, AlertTriangle, Shield } from 'lucide-react';

const severityConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  critical: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/15' },
};

export default function PlatformAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await db.entities.AuditLog.list('-timestamp', 200);
        setLogs(data || []);
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
        <div className="w-8 h-8 border-4 border-[#1F5A8A] border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 bg-[#0C2438] border border-white/10 rounded-lg text-sm outline-none focus:border-[#1F5A8A] text-white";

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !search || [log.action, log.user_name, log.entity_type, log.details]
      .some(field => field?.toLowerCase().includes(search.toLowerCase()));
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-sm text-white/50 mt-1">Platform-wide activity trail — {logs.length} events</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, action, entity..."
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="all">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="bg-[#0A1E30] border border-white/5 rounded-xl py-16 text-center">
            <FileText className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No audit events found</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const config = severityConfig[log.severity] || severityConfig.info;
            const Icon = config.icon;
            return (
              <div key={log.id} className="bg-[#0A1E30] border border-white/5 rounded-xl p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{log.user_name || 'System'}</span>
                    <span className="text-sm text-white/50">{log.action}</span>
                  </div>
                  {log.details && <p className="text-xs text-white/40 mt-1">{log.details}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30 flex-wrap">
                    {log.entity_type && <span className="capitalize">{log.entity_type}</span>}
                    {log.timestamp && <span>{new Date(log.timestamp).toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}