const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Banknote, Plus, X, Check, TrendingDown, Building, CalendarDays } from 'lucide-react';

const categories = ['utilities', 'maintenance', 'housekeeping', 'food_beverage', 'marketing', 'payroll', 'office', 'other'];
const statusPills = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-600' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [vendor, setVendor] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: '', category: 'utilities', amount: 0, vendor: '', expense_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    Promise.all([
      db.entities.Expense.list('-expense_date', 200),
      db.entities.Property.list().catch(() => []),
    ])
      .then(([e, p]) => { setExpenses(e || []); setProperties(p || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const propertyId = properties[0]?.id;
  const vendors = [...new Set(expenses.map(e => e.vendor).filter(Boolean))];
  const filtered = expenses.filter(e => (cat === 'all' || e.category === cat) && (vendor === 'all' || e.vendor === vendor));

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const thisMonth = expenses.filter(e => e.expense_date && new Date(e.expense_date) >= monthStart);
  const monthTotal = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);
  const pending = expenses.filter(e => e.status === 'pending');
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0); });
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const addExpense = async (e) => {
    e.preventDefault();
    if (!form.description || !propertyId) return;
    const created = await db.entities.Expense.create({ ...form, property_id: propertyId, currency: 'USD', status: 'pending' });
    setExpenses(prev => [created, ...prev]);
    setForm({ description: '', category: 'utilities', amount: 0, vendor: '', expense_date: new Date().toISOString().slice(0, 10) });
    setShowAdd(false);
  };

  const setStatus = async (exp, status) => {
    await db.entities.Expense.update(exp.id, { status });
    setExpenses(prev => prev.map(x => x.id === exp.id ? { ...x, status } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">Expense Tracking</h1>
          <p className="text-sm text-brand-slate">Property operational costs, linked to vendors, with approval workflow.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
          <Plus className="w-4 h-4" /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'This Month', value: `$${monthTotal.toLocaleString()}`, icon: Banknote, tint: 'text-brand-navy' },
          { label: 'Pending Approval', value: pending.length, icon: CalendarDays, tint: 'text-amber-500' },
          { label: 'Top Category', value: topCat ? topCat[0].replace('_', ' ') : '—', icon: TrendingDown, tint: 'text-brand-blue' },
          { label: 'Vendors', value: vendors.length, icon: Building, tint: 'text-green-600' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
              <Icon className={`w-4 h-4 mb-2 ${k.tint}`} />
              <p className="text-lg font-bold text-brand-ink capitalize">{k.value}</p>
              <p className="text-[11px] text-brand-slate">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setCat('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${cat === 'all' ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All Categories</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize ${cat === c ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>{c.replace('_', ' ')}</button>
        ))}
        {vendors.length > 0 && (
          <>
            <span className="w-px h-6 bg-brand-border mx-1 self-center" />
            <button onClick={() => setVendor('all')} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${vendor === 'all' ? 'bg-brand-blue text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>All Vendors</button>
            {vendors.map(v => (
              <button key={v} onClick={() => setVendor(v)} className={`px-3.5 py-1.5 text-xs font-medium rounded-full ${vendor === v ? 'bg-brand-blue text-white' : 'bg-white border border-brand-border text-brand-slate hover:border-brand-navy'}`}>{v}</button>
            ))}
          </>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-brand-slate">Loading expenses…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-brand-border p-10 text-center">
          <Banknote className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border text-left text-xs text-brand-slate">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Vendor</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-[#F1F5F9] last:border-0">
                  <td className="px-5 py-3.5 text-brand-slate whitespace-nowrap">{e.expense_date ? new Date(e.expense_date).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3.5 font-medium text-brand-ink">{e.description}</td>
                  <td className="px-5 py-3.5"><span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-bg text-brand-slate border border-brand-border capitalize">{e.category?.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3.5 text-brand-slate">{e.vendor || '—'}</td>
                  <td className="px-5 py-3.5 font-semibold text-brand-ink">${(e.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${statusPills[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {e.status === 'pending' ? (
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => setStatus(e, 'approved')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-[11px] font-semibold rounded-full hover:bg-green-700">
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => setStatus(e, 'rejected')} className="px-3 py-1.5 border border-red-200 text-red-600 text-[11px] font-medium rounded-full hover:bg-red-50">Reject</button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-brand-slate-light">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Record Expense</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addExpense} className="space-y-3">
              <input placeholder="Description (e.g. Monthly electricity)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  {categories.map(c => <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>)}
                </select>
                <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Vendor" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className={inputCls} />
                <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} className={inputCls} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Record Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}