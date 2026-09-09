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
          <h1 className="text-2xl font-bold text-brand-ink">Audit Logs</h1>
          <p className="text-sm text-brand-slate">Chronological, append-only record of administrative changes and system-wide operations.</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-1.5 px-4 py-2.5 border border-brand-border text-brand-navy text-sm font-semibold rounded-full hover:border-brand-navy">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: logs.length, icon: FileSearch, tint: 'text-brand-navy' },
          { label: 'Info', value: logs.filter(l => l.severity === 'info').length, icon: Info, tint: 'text-blue-500' },
          { label: 'Warnings', value: logs.filter(l => l.severity === 'warning').length, icon: AlertTriangle, tint: 'text-amber-500' },
          { label: 'Critical', value: logs.filter(l => l.severity === 'critical').length, icon: ShieldAlert, tint: 'text-red-500' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${k.tint}`} />
              <div>
                <p className="text-xl font-bold text-brand-ink">{k.value}</p>
                <p className="text-[11px] text-brand-slate">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-brand-border flex-1 max-w-md">
          <Search className="w-4 h-4 text-brand-slate-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action, entity, record ID…" className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-slate" />
          {['all', 'info', 'warning', 'critical'].map(s => (
            <button key={s} onClick={() => setSeverity(s)} className={`px-3.5 py-2 text-xs font-medium rounded-full capitalize ${severity === s ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading audit trail…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <FileSearch className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No audit entries match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border text-left text-xs text-brand-slate">
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
                <tr key={l.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-brand-bg/50">
                  <td className="px-5 py-3 text-brand-slate whitespace-nowrap">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  <td className="px-5 py-3 font-medium text-brand-ink whitespace-nowrap">{l.user_name}</td>
                  <td className="px-5 py-3 text-brand-ink">{l.action}</td>
                  <td className="px-5 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-bg border border-brand-border text-brand-slate">{l.entity_type || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${severityConfig[l.severity]?.pill || severityConfig.info.pill}`}>{l.severity}</span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-brand-slate max-w-sm">{l.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}