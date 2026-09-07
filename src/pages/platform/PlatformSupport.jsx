const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { LifeBuoy, Clock, CheckCircle2 } from 'lucide-react';

const priorityColors = {
  urgent: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-blue-500/15 text-blue-400',
  low: 'bg-white/10 text-white/50',
};

const statusColors = {
  open: 'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  resolved: 'bg-green-500/15 text-green-400',
  closed: 'bg-white/10 text-white/40',
};

const AGENTS = ['Sarah (Support)', 'David (Support)', 'Unassigned'];

export default function PlatformSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      const data = await db.entities.SupportTicket.list('-created_date', 100);
      setTickets(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateTicket = async (ticket, updates) => {
    try {
      await db.entities.SupportTicket.update(ticket.id, { ...updates, last_response_at: new Date().toISOString() });
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

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length,
  };

  const filtered = statusFilter === 'all' ? tickets : tickets.filter(t => t.status === statusFilter);
  const selectCls = "text-xs px-2 py-1.5 rounded-lg bg-[#123B63] border border-[#1F5A8A]/40 text-white outline-none cursor-pointer";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Center</h1>
        <p className="text-sm text-white/50 mt-1">Tenant-aware support tickets across the platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, icon: LifeBuoy, color: 'text-blue-400' },
          { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'text-amber-400' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Urgent', value: stats.urgent, icon: LifeBuoy, color: 'text-red-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#0A1E30] border border-white/5 rounded-xl p-4">
              <Icon className={`w-5 h-5 ${s.color} mb-2`} />
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              statusFilter === s ? 'bg-[#1F5A8A] text-white' : 'bg-[#0A1E30] border border-white/5 text-white/50 hover:text-white'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-[#0A1E30] border border-white/5 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <LifeBuoy className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-sm text-white/40">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(t => (
              <div key={t.id} className="p-4 flex items-start justify-between gap-4 hover:bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{t.subject}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || priorityColors.low}`}>
                      {t.priority}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] || statusColors.closed}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{t.organization_name || '—'} · {t.category || 'general'}</p>
                  {t.description && <p className="text-xs text-white/40 mt-1 line-clamp-2">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={t.assigned_to || 'Unassigned'}
                    onChange={e => updateTicket(t, { assigned_to: e.target.value === 'Unassigned' ? '' : e.target.value })}
                    className={selectCls}
                  >
                    {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select
                    value={t.status}
                    onChange={e => updateTicket(t, { status: e.target.value })}
                    className={`${selectCls} capitalize`}
                  >
                    {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}