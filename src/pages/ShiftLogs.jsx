const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { ClipboardList, Plus, X, CheckCircle2, AlertTriangle, ListTodo, FileText } from 'lucide-react';

const logTypes = {
  handover: { icon: ClipboardList, pill: 'bg-blue-50 text-brand-navy' },
  task: { icon: ListTodo, pill: 'bg-green-50 text-green-700' },
  incident: { icon: AlertTriangle, pill: 'bg-red-50 text-red-600' },
  note: { icon: FileText, pill: 'bg-gray-100 text-gray-600' },
};
const departments = ['front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'security', 'management'];

export default function ShiftLogs() {
  const [logs, setLogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ log_type: 'note', department: 'front_desk', shift_type: 'morning', content: '', staff_name: '' });

  useEffect(() => {
    Promise.all([
      db.entities.ShiftLog.list('-created_date', 200),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([l, p]) => { setLogs(l || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";
  const filtered = logs.filter(l => filter === 'all' || l.log_type === filter);

  const addLog = async (e) => {
    e.preventDefault();
    if (!form.content || !propertyId) return;
    const created = await db.entities.ShiftLog.create({ ...form, property_id: propertyId, status: form.log_type === 'incident' ? 'open' : 'resolved' });
    setLogs(prev => [created, ...prev]);
    setForm({ log_type: 'note', department: 'front_desk', shift_type: 'morning', content: '', staff_name: '' });
    setShowAdd(false);
  };

  const resolve = async (l) => {
    await db.entities.ShiftLog.update(l.id, { status: 'resolved' });
    setLogs(prev => prev.map(x => x.id === l.id ? { ...x, status: 'resolved' } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Shift Logs</h1>
          <p className="text-sm text-brand-slate">Notes, handover tasks and operational events recorded during each work shift.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Log Entry
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Entries', value: logs.length },
          { label: 'Handovers', value: logs.filter(l => l.log_type === 'handover').length },
          { label: 'Open Incidents', value: logs.filter(l => l.log_type === 'incident' && l.status === 'open').length },
          { label: 'Tasks Logged', value: logs.filter(l => l.log_type === 'task').length },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
            <p className="text-xl font-bold text-brand-ink">{k.value}</p>
            <p className="text-[11px] text-brand-slate">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${filter === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All</button>
        {Object.keys(logTypes).map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${filter === t ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>{t} ({logs.filter(l => l.log_type === t).length})</button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading shift logs…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <ClipboardList className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No entries yet — record the first shift note.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => {
            const config = logTypes[l.log_type] || logTypes.note;
            const Icon = config.icon;
            return (
              <div key={l.id} className="bg-white rounded-xl border border-brand-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${l.log_type === 'incident' ? 'text-red-500' : 'text-brand-navy'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${config.pill}`}>{l.log_type}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg text-brand-slate border border-brand-border capitalize">{l.department?.replace('_', ' ')} · {l.shift_type}</span>
                    {l.log_type === 'incident' && l.status === 'open' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">open</span>
                    )}
                  </div>
                  <p className="text-[13px] text-brand-ink leading-relaxed mt-2">{l.content}</p>
                  <p className="text-[11px] text-brand-slate-light mt-1.5">
                    {l.staff_name || 'Staff'} · {new Date(l.created_date).toLocaleString()}
                  </p>
                </div>
                {l.log_type === 'incident' && l.status === 'open' && (
                  <button onClick={() => resolve(l)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-[11px] font-semibold rounded-full hover:bg-green-700 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Log Shift Entry</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addLog} className="space-y-3">
              <input placeholder="Your name" value={form.staff_name} onChange={e => setForm({ ...form, staff_name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-3 gap-3">
                <select value={form.log_type} onChange={e => setForm({ ...form, log_type: e.target.value })} className={inputCls}>
                  <option value="note">Note</option><option value="handover">Handover</option><option value="task">Task</option><option value="incident">Incident</option>
                </select>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputCls}>
                  {departments.map(d => <option key={d} value={d} className="capitalize">{d.replace('_', ' ')}</option>)}
                </select>
                <select value={form.shift_type} onChange={e => setForm({ ...form, shift_type: e.target.value })} className={inputCls}>
                  <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="night">Night</option>
                </select>
              </div>
              <textarea placeholder="What happened during the shift? Handover tasks, incidents, follow-ups…" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="w-full px-4 py-3 border border-brand-border rounded-3xl text-sm outline-none focus:border-brand-navy resize-none" />
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Save Entry</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}