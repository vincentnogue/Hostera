const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useProperty } from '@/lib/PropertyContext';

import { DollarSign, Receipt, CreditCard, AlertCircle } from 'lucide-react';

const invoiceStatusColors = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const paymentStatusColors = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  partial: 'bg-blue-100 text-blue-700',
};

export default function Finance() {
  const { selectedProperty, scopeIds, loading: propsLoading } = useProperty();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('invoices');

  useEffect(() => {
    if (propsLoading) return;
    async function fetchData() {
      try {
        const [invData, payData, guestData] = await Promise.all([
          db.entities.Invoice.list(),
          db.entities.Payment.list(),
          db.entities.Guest.list(),
        ]);
        const inScope = (r) => !r.property_id || (scopeIds || []).includes(r.property_id);
        setInvoices((invData || []).filter(inScope));
        setPayments((payData || []).filter(inScope));
        setGuests(guestData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [propsLoading, scopeIds]);

  const currency = selectedProperty?.currency || 'USD';
  const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-brand-border border-t-brand-navy rounded-full animate-spin"></div>
      </div>
    );
  }

  const getGuestName = (id) => {
    const g = guests.find(g => g.id === id);
    return g ? `${g.first_name} ${g.last_name}` : 'Unknown';
  };

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.total - (i.paid_amount || 0) || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const completedPayments = payments.filter(p => p.status === 'completed').length;

  const kpis = [
    { label: 'Total Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Outstanding', value: fmt(outstanding), icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Invoices', value: invoices.length, icon: Receipt, color: 'text-brand-navy', bg: 'bg-blue-50' },
    { label: 'Payments', value: completedPayments, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Finance & Billing</h1>
        <p className="text-sm text-brand-slate mt-1">Guest folios, invoices and payment monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-brand-border p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-brand-ink">{k.value}</p>
                  <p className="text-xs text-brand-slate">{k.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        {['invoices', 'payments'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-brand-navy text-white' : 'bg-white border border-brand-border text-brand-slate hover:bg-brand-bg'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'invoices' ? (
        <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
          {invoices.length === 0 ? (
            <p className="text-sm text-brand-slate py-16 text-center">No invoices yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-brand-slate bg-brand-bg border-b border-brand-border">
                    <th className="px-4 py-3 font-medium">Invoice #</th>
                    <th className="px-4 py-3 font-medium">Guest</th>
                    <th className="px-4 py-3 font-medium">Issue Date</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg">
                      <td className="px-4 py-3 font-mono text-xs text-brand-slate">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-medium text-brand-ink">{getGuestName(inv.guest_id)}</td>
                      <td className="px-4 py-3 text-brand-slate">{inv.issue_date || '-'}</td>
                      <td className="px-4 py-3 font-medium text-brand-ink">{fmt(inv.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${invoiceStatusColors[inv.status] || 'bg-gray-100'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
          {payments.length === 0 ? (
            <p className="text-sm text-brand-slate py-16 text-center">No payments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-brand-slate bg-brand-bg border-b border-brand-border">
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Guest</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.id} className="border-b border-brand-border last:border-0 hover:bg-brand-bg">
                      <td className="px-4 py-3 font-mono text-xs text-brand-slate">{pay.reference || '-'}</td>
                      <td className="px-4 py-3 font-medium text-brand-ink">{getGuestName(pay.guest_id)}</td>
                      <td className="px-4 py-3 font-medium text-brand-ink">{fmt(pay.amount)}</td>
                      <td className="px-4 py-3 text-brand-slate capitalize">{pay.method?.replace('_', ' ') || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${paymentStatusColors[pay.status] || 'bg-gray-100'}`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}