const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { FileText, Search, Shield, AlertTriangle, Info } from 'lucide-react';

const severityConfig = {
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  warning: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  critical: { icon: Shield, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await db.entities.AuditLog.list('-timestamp', 100);
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
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtered = logs.filter(l => {
    if (severityFilter !== 'all' && l.severity !== severityFilter) return false;
    if (search) {
      const text = `${l.user_name} ${l.action} ${l.entity_type} ${l.details}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const counts = {
    total: logs.length,
    info: logs.filter(l => l.severity === 'info').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    critical: logs.filter(l => l.severity === 'critical').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17212B]">System Logs</h1>
        <p className="text-sm text-[#64748B] mt-1">Audit trail of staff actions, logins and configuration changes</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: counts.total },
          { label: 'Info', value: counts.info },
          { label: 'Warnings', value: counts.warning },
          { label: 'Critical', value: counts.critical },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-xl font-bold text-[#17212B]">{s.value}</p>
            <p className="text-xs text-[#64748B] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#E2E8F0] flex-1 max-w-xs">
          <Search className="w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 text-[#17212B] placeholder:text-[#94A3B8]"
          />
        </div>
        {['all', 'info', 'warning', 'critical'].map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              severityFilter === s ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F6F8FB]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">No activity logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {filtered.map((log) => {
              const config = severityConfig[log.severity] || severityConfig.info;
              const SevIcon = config.icon;
              return (
                <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-[#F6F8FB] transition-colors">
                  <div className={`w-9 h-9 rounded-lg ${config.bg} ${config.border} border flex items-center justify-center shrink-0`}>
                    <SevIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#17212B]">{log.user_name}</span>
                      <span className="text-sm text-[#64748B]">{log.action}</span>
                      {log.entity_type && (
                        <span className="text-xs px-2 py-0.5 bg-[#F6F8FB] rounded-full text-[#64748B] capitalize">
                          {log.entity_type}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-[#64748B] mt-0.5">{log.details}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#64748B]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}