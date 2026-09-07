const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { FileSearch, Search, AlertTriangle, Info, ShieldAlert, Download, Filter } from 'lucide-react';

const severityConfig = {
  info: { pill: 'bg-blue-50 text-blue-700' },
  warning: { pill: 'bg-amber-50 text-amber-700' },
  critical: { pill: 'bg-red-50 text-red-600' },
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    db.entities.AuditLog.list('-timestamp', 300)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const matchSeverity = severity === 'all' || l.severity === severity;
    const q = search.toLowerCase();
    const matchSearch = !q || [l.action, l.user_name, l.details, l.entity_type, l.entity_id].some(f => (f || '').toLowerCase().includes(q));
    return matchSeverity && matchSearch;
  });

  const exportCsv = () => {
    const header = 'Timestamp,User,Action,Entity Type,Entity ID,Severity,Details';
    const rows = filtered.map(l => [
      l.timestamp || '', (l.user_name || '').replace(/,/g, ';'), (l.action || '').replace(/,/g, ';'),
      l.entity_type || '', l.entity_id || '', l.severity || '', (l.details || '').replace(/,/g, ';'),
    ].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hostera-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#17212B]">Audit Logs</h1>
          <p className="text-sm text-[#64748B]">Chronological, append-only record of administrative changes and system-wide operations.</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-4 py-2.5 border border-[#E2E8F0] text-[#123B63] text-sm font-semibold rounded-full hover:border-[#123B63]">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: logs.length, icon: FileSearch, tint: 'text-[#123B63]' },
          { label: 'Info', value: logs.filter(l => l.severity === 'info').length, icon: Info, tint: 'text-blue-500' },
          { label: 'Warnings', value: logs.filter(l => l.severity === 'warning').length, icon: AlertTriangle, tint: 'text-amber-500' },
          { label: 'Critical', value: logs.filter(l => l.severity === 'critical').length, icon: ShieldAlert, tint: 'text-red-500' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${k.tint}`} />
              <div>
                <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
                <p className="text-[11px] text-[#64748B]">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-[#E2E8F0] flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action, entity, record ID…" className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#64748B]" />
          {['all', 'info', 'warning', 'critical'].map(s => (
            <button key={s} onClick={() => setSeverity(s)} className={`px-3.5 py-2 text-xs font-medium rounded-full capitalize ${severity === s ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#123B63]'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading audit trail…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center">
          <FileSearch className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">No audit entries match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="bg-[#F6F8FB] border-b border-[#E2E8F0] text-left text-xs text-[#64748B]">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Entity</th>
                <th className="px-5 py-3 font-semibold">Severity</th>
                <th className="px-5 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F6F8FB]/50">
                  <td className="px-5 py-3 text-[#64748B] whitespace-nowrap">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  <td className="px-5 py-3 font-medium text-[#17212B] whitespace-nowrap">{l.user_name}</td>
                  <td className="px-5 py-3 text-[#17212B]">{l.action}</td>
                  <td className="px-5 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F6F8FB] border border-[#E2E8F0] text-[#64748B]">{l.entity_type || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${severityConfig[l.severity]?.pill || severityConfig.info.pill}`}>{l.severity}</span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#64748B] max-w-sm">{l.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}