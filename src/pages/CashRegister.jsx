const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import {
  Wallet, Plus, X, ArrowDownCircle, ArrowUpCircle, Lock, Unlock,
  AlertTriangle, Check, History
} from 'lucide-react';

export default function CashRegister() {
  const { selectedProperty } = useProperty();
  const [sessions, setSessions] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOpen, setShowOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showMovement, setShowMovement] = useState(null); // 'in' | 'out' | null
  const [saving, setSaving] = useState(false);

  const [openForm, setOpenForm] = useState({ staff_name: '', opening_float: 0, notes: '' });
  const [closeForm, setCloseForm] = useState({ actual_closing: 0, notes: '' });
  const [moveForm, setMoveForm] = useState({ amount: 0, reason: '' });

  useEffect(() => {
    db.entities.CashRegisterSession.list('-opened_at', 200)
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
    db.entities.Property.list().then(setProperties).catch(() => setProperties([]));
  }, []);

  const propertyId = (selectedProperty || properties[0])?.id;
  const currency = selectedProperty?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);
  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const activeSession = sessions.find(s => s.property_id === propertyId && s.status === 'open');
  const history = sessions.filter(s => s.status === 'closed').slice(0, 20);

  const movements = activeSession?.movements || [];
  const cashIn = movements.filter(m => m.type === 'in').reduce((s, m) => s + (m.amount || 0), 0);
  const cashOut = movements.filter(m => m.type === 'out').reduce((s, m) => s + (m.amount || 0), 0);
  const expectedClosing = (activeSession?.opening_float || 0) + cashIn - cashOut;

  const totalVarianceThisWeek = history
    .filter(s => s.closed_at && (Date.now() - new Date(s.closed_at).getTime()) < 7 * 86400000)
    .reduce((sum, s) => sum + ((s.actual_closing || 0) - (s.expected_closing || 0)), 0);

  const openRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await db.entities.CashRegisterSession.create({
        property_id: propertyId,
        staff_name: openForm.staff_name,
        opening_float: Number(openForm.opening_float) || 0,
        notes: openForm.notes,
        movements: [],
        status: 'open',
        opened_at: new Date().toISOString(),
      });
      setSessions(prev => [created, ...prev]);
      setOpenForm({ staff_name: '', opening_float: 0, notes: '' });
      setShowOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const logMovement = async (e) => {
    e.preventDefault();
    if (!activeSession) return;
    setSaving(true);
    try {
      const newMovements = [
        ...movements,
        { type: showMovement, amount: Number(moveForm.amount) || 0, reason: moveForm.reason, at: new Date().toISOString() },
      ];
      await db.entities.CashRegisterSession.update(activeSession.id, { movements: newMovements });
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, movements: newMovements } : s));
      setMoveForm({ amount: 0, reason: '' });
      setShowMovement(null);
    } finally {
      setSaving(false);
    }
  };

  const closeRegister = async (e) => {
    e.preventDefault();
    if (!activeSession) return;
    setSaving(true);
    try {
      const actual = Number(closeForm.actual_closing) || 0;
      const variance = actual - expectedClosing;
      await db.entities.CashRegisterSession.update(activeSession.id, {
        status: 'closed',
        actual_closing: actual,
        expected_closing: expectedClosing,
        variance,
        closing_notes: closeForm.notes,
        closed_at: new Date().toISOString(),
      });
      setSessions(prev => prev.map(s => s.id === activeSession.id
        ? { ...s, status: 'closed', actual_closing: actual, expected_closing: expectedClosing, variance, closing_notes: closeForm.notes, closed_at: new Date().toISOString() }
        : s));
      setCloseForm({ actual_closing: 0, notes: '' });
      setShowClose(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-brand-slate">Loading cash register…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Cash Register</h1>
        <p className="text-sm text-brand-slate">Open a session with a float, log cash movements through the shift, and reconcile on close.</p>
      </div>

      {/* Active session */}
      {activeSession ? (
        <div className="bg-white rounded-2xl border border-brand-border p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-ink">Session open · {activeSession.staff_name}</p>
                <p className="text-[11px] text-brand-slate">Opened {new Date(activeSession.opened_at).toLocaleString()}</p>
              </div>
            </div>
            <button onClick={() => setShowClose(true)} className="flex items-center gap-1.5 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
              <Lock className="w-4 h-4" /> Close Register
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              ['Opening Float', fmt(activeSession.opening_float)],
              ['Cash In', fmt(cashIn)],
              ['Cash Out', fmt(cashOut)],
              ['Expected in Drawer', fmt(expectedClosing)],
            ].map(([label, val]) => (
              <div key={label} className="bg-brand-bg rounded-xl p-3.5">
                <p className="text-base font-bold text-brand-ink">{val}</p>
                <p className="text-[11px] text-brand-slate">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <button onClick={() => setShowMovement('in')} className="flex items-center gap-1.5 px-3.5 py-2 border border-green-200 text-green-700 text-xs font-semibold rounded-full hover:bg-green-50">
              <ArrowDownCircle className="w-3.5 h-3.5" /> Log Cash In
            </button>
            <button onClick={() => setShowMovement('out')} className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50">
              <ArrowUpCircle className="w-3.5 h-3.5" /> Log Cash Out
            </button>
          </div>

          {movements.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {movements.slice().reverse().map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-3 py-2 bg-brand-bg rounded-lg">
                  <span className="flex items-center gap-1.5 text-brand-ink">
                    {m.type === 'in' ? <ArrowDownCircle className="w-3.5 h-3.5 text-green-600" /> : <ArrowUpCircle className="w-3.5 h-3.5 text-red-500" />}
                    {m.reason || (m.type === 'in' ? 'Cash in' : 'Cash out')}
                  </span>
                  <span className={`font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'in' ? '+' : '-'}{fmt(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-brand-border p-10 text-center">
          <Wallet className="w-8 h-8 text-[#C4CDD5] mx-auto mb-3" />
          <p className="text-sm text-brand-slate mb-4">No open cash register session for this property.</p>
          <button onClick={() => setShowOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">
            <Plus className="w-4 h-4" /> Open Register
          </button>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-brand-ink mb-3 flex items-center gap-1.5"><History className="w-4 h-4" /> Session History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-brand-slate">No closed sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-brand-border p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold text-brand-ink">{s.staff_name}</p>
                  <p className="text-[11px] text-brand-slate">
                    {new Date(s.opened_at).toLocaleDateString()} · Float {fmt(s.opening_float)} · Expected {fmt(s.expected_closing)} · Counted {fmt(s.actual_closing)}
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  Math.abs(s.variance || 0) < 0.01 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {Math.abs(s.variance || 0) < 0.01 ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {s.variance > 0 ? `+${fmt(s.variance)} over` : s.variance < 0 ? `${fmt(s.variance)} short` : 'Balanced'}
                </span>
              </div>
            ))}
          </div>
        )}
        {totalVarianceThisWeek !== 0 && history.length > 0 && (
          <p className="text-xs text-brand-slate mt-2">
            Net variance this week: <span className={totalVarianceThisWeek < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{fmt(totalVarianceThisWeek)}</span>
          </p>
        )}
      </div>

      {/* Open dialog */}
      {showOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Open Register</h3>
              <button onClick={() => setShowOpen(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={openRegister} className="space-y-3">
              <input required placeholder="Staff name" value={openForm.staff_name} onChange={e => setOpenForm({ ...openForm, staff_name: e.target.value })} className={inputCls} />
              <input required type="number" min={0} step="0.01" placeholder="Opening float" value={openForm.opening_float || ''} onChange={e => setOpenForm({ ...openForm, opening_float: e.target.value })} className={inputCls} />
              <input placeholder="Notes (optional)" value={openForm.notes} onChange={e => setOpenForm({ ...openForm, notes: e.target.value })} className={inputCls} />
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
                {saving ? 'Opening…' : 'Open Register'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Movement dialog */}
      {showMovement && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowMovement(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink capitalize">Log Cash {showMovement}</h3>
              <button onClick={() => setShowMovement(null)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={logMovement} className="space-y-3">
              <input required type="number" min={0} step="0.01" placeholder="Amount" value={moveForm.amount || ''} onChange={e => setMoveForm({ ...moveForm, amount: e.target.value })} className={inputCls} />
              <input required placeholder={showMovement === 'in' ? 'Reason (e.g. walk-in payment)' : 'Reason (e.g. petty cash, refund)'} value={moveForm.reason} onChange={e => setMoveForm({ ...moveForm, reason: e.target.value })} className={inputCls} />
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
                {saving ? 'Saving…' : `Log Cash ${showMovement === 'in' ? 'In' : 'Out'}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Close dialog */}
      {showClose && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowClose(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Close Register</h3>
              <button onClick={() => setShowClose(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <p className="text-xs text-brand-slate mb-3">Expected in drawer: <span className="font-semibold text-brand-ink">{fmt(expectedClosing)}</span></p>
            <form onSubmit={closeRegister} className="space-y-3">
              <input required type="number" min={0} step="0.01" placeholder="Actual counted cash" value={closeForm.actual_closing || ''} onChange={e => setCloseForm({ ...closeForm, actual_closing: e.target.value })} className={inputCls} />
              {closeForm.actual_closing !== 0 && (
                <p className={`text-xs font-medium ${((Number(closeForm.actual_closing) || 0) - expectedClosing) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Variance: {fmt((Number(closeForm.actual_closing) || 0) - expectedClosing)}
                </p>
              )}
              <input placeholder="Notes (optional)" value={closeForm.notes} onChange={e => setCloseForm({ ...closeForm, notes: e.target.value })} className={inputCls} />
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
                {saving ? 'Closing…' : 'Close Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
