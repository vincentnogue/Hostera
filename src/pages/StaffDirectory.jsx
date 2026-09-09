const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Plus, X, Mail, Phone, Sun, Moon, Coffee, CalendarDays, UserRound } from 'lucide-react';

const departments = ['front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'security', 'management', 'admin'];
const deptLabels = { front_desk: 'Front Desk', housekeeping: 'Housekeeping', maintenance: 'Maintenance', food_beverage: 'F&B', security: 'Security', management: 'Management', admin: 'Admin' };
const deptPills = { front_desk: 'bg-blue-50 text-blue-700', housekeeping: 'bg-green-50 text-green-700', maintenance: 'bg-amber-50 text-amber-700', food_beverage: 'bg-orange-50 text-orange-700', security: 'bg-gray-100 text-gray-600', management: 'bg-purple-50 text-purple-700', admin: 'bg-slate-100 text-slate-600' };
const availabilityIcons = { morning: Sun, afternoon: Coffee, night: Moon, weekends: CalendarDays, flexible: UserRound };

export default function StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', department: 'front_desk', position: '', employment_type: 'full_time', shift_availability: ['morning'] });

  useEffect(() => {
    Promise.all([
      db.entities.StaffMember.list(),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([s, p]) => { setStaff(s || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const filtered = staff.filter(s => dept === 'all' || s.department === dept);
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const addStaff = async (e) => {
    e.preventDefault();
    if (!form.full_name || !propertyId) return;
    const created = await db.entities.StaffMember.create({ ...form, property_id: propertyId, status: 'active' });
    setStaff(prev => [...prev, created]);
    setForm({ full_name: '', email: '', phone: '', department: 'front_desk', position: '', employment_type: 'full_time', shift_availability: ['morning'] });
    setShowAdd(false);
  };

  const toggleStatus = async (s) => {
    const next = s.status === 'active' ? 'on_leave' : 'active';
    await db.entities.StaffMember.update(s.id, { status: next });
    setStaff(prev => prev.map(x => x.id === s.id ? { ...x, status: next } : x));
  };

  const toggleAvailability = (slot) => {
    setForm(f => ({
      ...f,
      shift_availability: f.shift_availability.includes(slot)
        ? f.shift_availability.filter(a => a !== slot)
        : [...f.shift_availability, slot],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Staff Directory</h1>
          <p className="text-sm text-brand-slate">Team members, department roles and shift availability.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Staff', value: staff.length },
          { label: 'Active', value: staff.filter(s => s.status === 'active').length },
          { label: 'On Leave', value: staff.filter(s => s.status === 'on_leave').length },
          { label: 'Departments', value: new Set(staff.map(s => s.department)).size },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
            <p className="text-xl font-bold text-brand-ink">{k.value}</p>
            <p className="text-[11px] text-brand-slate">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setDept('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${dept === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All</button>
        {departments.map(d => (
          <button key={d} onClick={() => setDept(d)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${dept === d ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>
            {deptLabels[d]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading staff…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <UserRound className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No staff in this department yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-brand-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-brand-navy text-white flex items-center justify-center text-sm font-bold">
                    {s.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-ink">{s.full_name}</p>
                    <p className="text-[11px] text-brand-slate">{s.position || 'Staff'}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${deptPills[s.department] || 'bg-gray-100 text-gray-600'}`}>
                  {deptLabels[s.department] || s.department}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {s.email && <p className="flex items-center gap-2 text-[11px] text-brand-slate"><Mail className="w-3 h-3" />{s.email}</p>}
                {s.phone && <p className="flex items-center gap-2 text-[11px] text-brand-slate"><Phone className="w-3 h-3" />{s.phone}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(s.shift_availability || []).map(a => {
                  const Icon = availabilityIcons[a];
                  return (
                    <span key={a} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-brand-bg border border-brand-border rounded-full text-brand-slate capitalize">
                      {Icon && <Icon className="w-3 h-3" />}{a}
                    </span>
                  );
                })}
                <span className="text-[10px] px-2 py-0.5 bg-brand-bg border border-brand-border rounded-full text-brand-slate capitalize">{s.employment_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{s.status?.replace('_', ' ')}</span>
                <button onClick={() => toggleStatus(s)} className="text-[11px] px-3 py-1.5 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy hover:text-brand-navy font-medium">
                  {s.status === 'active' ? 'Set On Leave' : 'Set Active'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Add Team Member</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addStaff} className="space-y-3">
              <input placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={inputCls}>
                  {departments.map(d => <option key={d} value={d}>{deptLabels[d]}</option>)}
                </select>
                <input placeholder="Position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className={inputCls} />
              </div>
              <select value={form.employment_type} onChange={e => setForm({ ...form, employment_type: e.target.value })} className={inputCls}>
                <option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option><option value="intern">Intern</option>
              </select>
              <div>
                <p className="text-xs font-medium text-brand-slate mb-1.5">Shift availability</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(availabilityIcons).map(slot => (
                    <button type="button" key={slot} onClick={() => toggleAvailability(slot)} className={`px-3 py-1.5 text-xs rounded-full capitalize border ${form.shift_availability.includes(slot) ? 'bg-brand-navy text-white border-brand-navy' : 'border-brand-border text-brand-slate'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Add Member</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}