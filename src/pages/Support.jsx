const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { LifeBuoy, Plus, X, Search, Clock, MessageSquare, CheckCircle2, AlertCircle, Mail, BookOpen } from 'lucide-react';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const STATUS_FLOW = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed' };
const statusPills = {
  open: 'bg-blue-50 text-brand-navy',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};
const priorityPills = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-blue-50 text-brand-navy',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-600',
};

// Customer Support — tickets from both guests (submitted via the Guest
// Portal or the public booking page, unauthenticated) and staff. A single
// SupportTicket entity backs both entry points; this is the internal
// triage view.
export default function Support() {
  const { selectedProperty } = useProperty();
  const [tickets, setTickets] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [active, setActive] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [form, setForm] = useState({
    subject: '', description: '', priority: 'medium',
    requester_name: '', requester_email: '', booking_reference: '',
  });

  const fetchData = () => {
    Promise.all([
      db.entities.SupportTicket.list('-created_date', 200),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([t, p]) => { setTickets(t || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const q = search.toLowerCase();
  const filtered = tickets.filter(t =>
    (status === 'all' || t.status === status) &&
    (!q || (t.subject || '').toLowerCase().includes(q) || (t.requester_name || '').toLowerCase().includes(q) || (t.booking_reference || '').toLowerCase().includes(q))
  );

  const createTicket = async (e) => {
    e.preventDefault();
    if (!form.subject || !propertyId) return;
    const created = await db.entities.SupportTicket.create({ ...form, property_id: propertyId, status: 'open', source: 'staff', internal_notes: '' });
    setTickets(prev => [created, ...prev]);
    setForm({ subject: '', description: '', priority: 'medium', requester_name: '', requester_email: '', booking_reference: '' });
    setShowAdd(false);
  };

  const advance = async (t) => {
    const next = STATUS_FLOW[t.status];
    if (!next) return;
    const updated = await db.entities.SupportTicket.update(t.id, { status: next });
    setTickets(prev => prev.map(x => x.id === t.id ? updated : x));
    if (active?.id === t.id) setActive(updated);
  };

  const addNote = async () => {
    if (!noteDraft.trim() || !active) return;
    const stamped = `${new Date().toLocaleString()} — ${noteDraft.trim()}`;
    const merged = active.internal_notes ? `${active.internal_notes}\n${stamped}` : stamped;
    const updated = await db.entities.SupportTicket.update(active.id, { internal_notes: merged });
    setTickets(prev => prev.map(x => x.id === active.id ? updated : x));
    setActive(updated);
    setNoteDraft('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink flex items-center gap-2"><LifeBuoy className="w-6 h-6 text-brand-navy" /> Customer Support</h1>
          <p className="text-sm text-brand-slate">Tickets from guests and staff — booking issues, questions, complaints.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: tickets.filter(t => t.status === 'open').length, icon: AlertCircle },
          { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, icon: Clock },
          { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, icon: CheckCircle2 },
          { label: 'From Guests', value: tickets.filter(t => t.source === 'guest').length, icon: Mail },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-bg flex items-center justify-center shrink-0"><k.icon className="w-4 h-4 text-brand-navy" /></div>
            <div>
              <p className="text-xl font-bold text-brand-ink leading-none">{k.value}</p>
              <p className="text-[11px] text-brand-slate mt-1">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-brand-border flex-1 max-w-md">
          <Search className="w-4 h-4 text-brand-slate-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject, guest, booking ref…" className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${status === s ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>{s.replace('_', ' ')}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading tickets…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <BookOpen className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No tickets match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border divide-y divide-[#F1F5F9]">
          {filtered.map(t => (
            <button key={t.id} onClick={() => setActive(t)} className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-brand-bg transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-brand-ink truncate">{t.subject}</p>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${priorityPills[t.priority] || priorityPills.medium}`}>{t.priority}</span>
                </div>
                <p className="text-[12px] text-brand-slate mt-0.5 truncate">
                  {t.requester_name || 'Unknown requester'}{t.booking_reference ? ` · ref ${t.booking_reference}` : ''}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusPills[t.status] || statusPills.open}`}>{(t.status || 'open').replace('_', ' ')}</span>
            </button>
          ))}
        </div>
      )}

      {/* Create ticket */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">New Support Ticket</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={createTicket} className="space-y-3">
              <input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={inputCls} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3.5 py-2 border border-brand-border rounded-2xl text-sm outline-none focus:border-brand-navy resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Requester name" value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} className={inputCls} />
                <input placeholder="Requester email" value={form.requester_email} onChange={e => setForm({ ...form, requester_email: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Booking reference (optional)" value={form.booking_reference} onChange={e => setForm({ ...form, booking_reference: e.target.value })} className={inputCls} />
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={inputCls}>
                  {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Create Ticket</button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket detail */}
      {active && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-brand-ink">{active.subject}</h3>
                <p className="text-xs text-brand-slate mt-0.5">
                  {active.requester_name} {active.requester_email ? `· ${active.requester_email}` : ''}
                  {active.booking_reference ? ` · ref ${active.booking_reference}` : ''}
                </p>
              </div>
              <button onClick={() => setActive(null)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusPills[active.status] || statusPills.open}`}>{(active.status || 'open').replace('_', ' ')}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${priorityPills[active.priority] || priorityPills.medium}`}>{active.priority} priority</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-brand-bg text-brand-slate capitalize">{active.source === 'guest' ? 'From guest' : 'Internal'}</span>
            </div>
            {active.description && <p className="text-sm text-brand-ink leading-relaxed bg-brand-bg rounded-xl p-3.5 mb-4">{active.description}</p>}

            <div className="flex items-center gap-2 mb-4">
              {STATUS_FLOW[active.status] && (
                <button onClick={() => advance(active)} className="px-3.5 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue capitalize">
                  Mark as {STATUS_FLOW[active.status].replace('_', ' ')}
                </button>
              )}
            </div>

            <p className="text-xs font-semibold text-brand-slate mb-2 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Internal notes</p>
            {active.internal_notes && (
              <pre className="whitespace-pre-wrap text-[12px] text-brand-ink bg-brand-bg rounded-xl p-3.5 mb-3 font-sans">{active.internal_notes}</pre>
            )}
            <div className="flex gap-2">
              <input value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="Add an internal note…" className={inputCls} onKeyDown={e => e.key === 'Enter' && addNote()} />
              <button onClick={addNote} className="px-4 py-2 bg-brand-bg text-brand-navy text-sm font-semibold rounded-full hover:bg-brand-border/50 shrink-0">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
