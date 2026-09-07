const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Users, UserRound, CalendarClock, Banknote, Building2, TrendingUp } from 'lucide-react';

const departments = ['front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'security', 'management', 'admin'];
const deptLabels = { front_desk: 'Front Desk', housekeeping: 'Housekeeping', maintenance: 'Maintenance', food_beverage: 'F&B', security: 'Security', management: 'Management', admin: 'Admin' };

export default function PlatformHR() {
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.entities.StaffMember.list(),
      db.entities.Shift.list('-date', 200),
      db.entities.Expense.list('-expense_date', 200),
    ])
      .then(([s, sh, e]) => { setStaff(s || []); setShifts(sh || []); setExpenses(e || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const byDept = departments.map(d => ({
    name: deptLabels[d],
    count: staff.filter(s => s.department === d).length,
  })).filter(d => d.count > 0);
  const maxDept = Math.max(1, ...byDept.map(d => d.count));

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthExpenses = expenses.filter(e => e.expense_date && new Date(e.expense_date) >= monthStart);
  const byCat = {};
  monthExpenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0); });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const upcomingShifts = shifts.filter(s => s.date >= today && s.status !== 'cancelled').slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Workforce & HR Oversight</h1>
        <p className="text-sm text-white/50">Enterprise HR and operational cost intelligence across all customer organizations.</p>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading workforce data…</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Workforce', value: staff.length, icon: Users },
              { label: 'Active Employees', value: staff.filter(s => s.status === 'active').length, icon: UserRound },
              { label: 'Scheduled Shifts (upcoming)', value: upcomingShifts.length, icon: CalendarClock },
              { label: 'Op. Expenses (MTD)', value: `$${monthExpenses.reduce((s, e) => s + (e.amount || 0), 0).toLocaleString()}`, icon: Banknote },
            ].map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="p-5 rounded-xl bg-white/[0.04] border border-white/10">
                  <Icon className="w-5 h-5 text-[#1F5A8A] mb-3" />
                  <p className="text-2xl font-bold text-white">{k.value}</p>
                  <p className="text-[11px] text-white/40 mt-1">{k.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department distribution */}
            <div className="p-6 rounded-xl bg-white/[0.04] border border-white/10">
              <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1F5A8A]" /> Headcount by Department
              </h2>
              {byDept.length === 0 ? (
                <p className="text-xs text-white/40">No workforce data recorded by customers yet.</p>
              ) : (
                <div className="space-y-3">
                  {byDept.map(d => (
                    <div key={d.name}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-white/70">{d.name}</span>
                        <span className="text-white font-semibold">{d.count}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1F5A8A] rounded-full" style={{ width: `${(d.count / maxDept) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses by category */}
            <div className="p-6 rounded-xl bg-white/[0.04] border border-white/10">
              <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1F5A8A]" /> Customer Op. Costs by Category (MTD)
              </h2>
              {catEntries.length === 0 ? (
                <p className="text-xs text-white/40">No expense data recorded this month.</p>
              ) : (
                <div className="space-y-3">
                  {catEntries.map(([cat, total]) => (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                      <span className="text-xs text-white/70 capitalize">{cat.replace('_', ' ')}</span>
                      <span className="text-sm font-semibold text-white">${total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming shifts across orgs */}
          <div className="p-6 rounded-xl bg-white/[0.04] border border-white/10">
            <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#1F5A8A]" /> Shifts Across Customer Organizations
            </h2>
            {upcomingShifts.length === 0 ? (
              <p className="text-xs text-white/40">No scheduled shifts recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-[10px] text-white/40 uppercase tracking-wide border-b border-white/10">
                      <th className="px-3 py-2.5 font-semibold">Date</th>
                      <th className="px-3 py-2.5 font-semibold">Team Member</th>
                      <th className="px-3 py-2.5 font-semibold">Department</th>
                      <th className="px-3 py-2.5 font-semibold">Hours</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingShifts.map(s => (
                      <tr key={s.id} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-3 text-white/60 whitespace-nowrap">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="px-3 py-3 text-white font-medium">{s.staff_name}</td>
                        <td className="px-3 py-3 text-white/60 capitalize">{deptLabels[s.department] || s.department}</td>
                        <td className="px-3 py-3 text-white/60">{s.start_time} – {s.end_time}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${s.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' : s.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}