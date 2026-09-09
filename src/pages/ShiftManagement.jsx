const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { Clock, Plus, X, Sun, Coffee, Moon, ArrowRight, ClipboardList } from 'lucide-react';

const departments = ['front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'security', 'management'];
const deptLabels = { front_desk: 'Front Desk', housekeeping: 'Housekeeping', maintenance: 'Maintenance', food_beverage: 'F&B', security: 'Security', management: 'Management' };
const typeIcons = { morning: Sun, afternoon: Coffee, night: Moon };

export default function ShiftManagement() {
  const { selectedProperty } = useProperty();
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [handoverEdit, setHandoverEdit] = useState(null);
  const [handoverText, setHandoverText] = useState('');
  const [form, setForm] = useState({ staff_name: '', department: 'front_desk', date: new Date().toISOString().slice(0, 10), start_time: '07:00', end_time: '15:00', shift_type: 'morning' });

  useEffect(() => {
    Promise.all([
      db.entities.Shift.list('-date', 100),
      db.entities.StaffMember.list().catch(() => []),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([s, st, p]) => { setShifts(s || []); setStaff(st || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const today = new Date().toISOString().slice(0, 10);
  const filtered = shifts.filter(s => dept === 'all' || s.department === dept);
  const todays = shifts.filter(s => s.date === today);
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const nextStatus = { scheduled: 'in_progress', in_progress: 'completed' };

  const advance = async (s) => {
    const next = nextStatus[s.status];
    if (!next) return;
    await db.entities.Shift.update(s.id, { status: next });
    setShifts(prev => prev.map(x => x.id === s.id ? { ...x, status: next } : x));
  };

  const addShift = async (e) => {
    e.preventDefault();
    if (!form.staff_name || !propertyId) return;
    const created = await db.entities.Shift.create({ ...form, property_id: propertyId, status: 'scheduled' });
    setShifts(prev => [created, ...prev]);
    setForm({ staff_name: '', department: 'front_desk', date: today, start_time: '07:00', end_time: '15:00', shift_type: 'morning' });
    setShowAdd(false);
  };

  const saveHandover = async () => {
    const s = shifts.find(x => x.id === handoverEdit);
    await db.entities.Shift.update(s.id, { handover_notes: handoverText });
    setShifts(prev => prev.map(x => x.id === s.id ? { ...x, handover_notes: handoverText } : x));
    setHandoverEdit(null);
    setHandoverText('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Shift Management</h1>
          <p className="text-sm text-brand-slate">Working hours, shift handovers and team availability across departments.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Schedule Shift
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Shifts", value: todays.length },
          { label: 'In Progress', value: shifts.filter(s => s.status === 'in_progress').length },
          { label: 'Upcoming (7d)', value: shifts.filter(s => s.date > today).length },
          { label: 'Pending Handovers', value: shifts.filter(s => s.status === 'completed' && !s.handover_notes).length },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
            <p className="text-xl font-bold text-brand-ink">{k.value}</p>
            <p className="text-[11px] text-brand-slate">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setDept('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${dept === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All Departments</button>
        {departments.map(d => (
          <button key={d} onClick={() => setDept(d)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${dept === d ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
            {deptLabels[d]} <span className="opacity-60">({shifts.filter(s => s.department === d).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading shifts…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Clock className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No shifts scheduled for this department.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const TypeIcon = typeIcons[s.shift_type] || Sun;
            return (
              <div key={s.id} className="bg-white rounded-xl border border-brand-border p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.shift_type === 'night' ? 'bg-indigo-50' : s.shift_type === 'afternoon' ? 'bg-orange-50' : 'bg-amber-50'}`}>
                    <TypeIcon className="w-4 h-4 text-brand-navy" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-brand-ink truncate">{s.staff_name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg text-brand-slate border border-brand-border capitalize">{deptLabels[s.department] || s.department}</span>
                    </div>
                    <p className="text-[11px] text-brand-slate mt-0.5">{s.date === today ? 'Today' : new Date(s.date).toLocaleDateString()} · {s.start_time} – {s.end_time}</p>
                  </div>
                </div>
                {s.handover_notes && (
                  <div className="md:max-w-xs w-full bg-brand-bg rounded-xl p-2.5 border-l-2 border-brand-navy">
                    <p className="text-[10px] font-semibold text-brand-navy uppercase tracking-wide">Handover</p>
                    <p className="text-[12px] text-brand-ink leading-snug line-clamp-2">{s.handover_notes}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${s.status === 'completed' ? 'bg-green-50 text-green-700' : s.status === 'in_progress' ? 'bg-blue-50 text-brand-navy' : s.status === 'cancelled' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                  {nextStatus[s.status] && (
                    <button onClick={() => advance(s)} className="flex items-center gap-1 px-3 py-1.5 bg-brand-navy text-white text-[11px] font-semibold rounded-full hover:bg-brand-blue capitalize">
                      {nextStatus[s.status]} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {s.status === 'completed' && (
                    <button onClick={() => { setHandoverEdit(s.id); setHandoverText(s.handover_notes || ''); }} className="flex items-center gap-1 px-3 py-1.5 border border-brand-border text-brand-slate text-[11px] font-medium rounded-full hover:border-brand-navy hover:text-brand-navy">
                      <ClipboardList className="w-3 h-3" /> {s.handover_notes ? 'Edit' : 'Add'} Handover
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Schedule Shift</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addShift} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1.5">Team member</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {staff.slice(0, 8).map(m => (
                    <button type="button" key={m.id} onClick={() => setForm({ ...form, staff_name: m.full_name, department: m.department })} className={`px-3 py-1.5 text-xs rounded-full border ${form.staff_name === m.full_name ? 'bg-brand-navy text-white border-brand-navy' : 'border-brand-border text-brand-slate'}`}>
                      {m.full_name}
                    </button>
                  ))}
                </div>
                <input placeholder="Or type a name" value={form.staff_name} onChange={e => setForm({ ...form, staff_name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputCls}>
                  {departments.map(d => <option key={d} value={d}>{deptLabels[d]}</option>)}
                </select>
                <select value={form.shift_type} onChange={e => setForm({ ...form, shift_type: e.target.value })} className={inputCls}>
                  <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="night">Night</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className={inputCls} />
                <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className={inputCls} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Schedule</button>
            </form>
          </div>
        </div>
      )}

      {handoverEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setHandoverEdit(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brand-ink mb-1">Shift Handover Notes</h3>
            <p className="text-xs text-brand-slate mb-4">What the next team needs to know — VIP arrivals, pending issues, follow-ups.</p>
            <textarea value={handoverText} onChange={e => setHandoverText(e.target.value)} rows={5} placeholder="e.g. Suite 502 AC still noisy; VIP arrival at 9pm — Mrs. Laurent; 3 pending wake-up calls…" className="w-full px-4 py-3 border border-brand-border rounded-3xl text-sm outline-none focus:border-brand-navy resize-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={saveHandover} className="flex-1 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Save Handover</button>
              <button onClick={() => setHandoverEdit(null)} className="flex-1 py-2.5 border border-brand-border text-sm font-medium rounded-full text-brand-slate">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}