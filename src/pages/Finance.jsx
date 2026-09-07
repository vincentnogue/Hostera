const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { DollarSign, Receipt, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';

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
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('invoices');

  useEffect(() => {
    async function fetchData() {
      try {
        const [invData, payData, guestData] = await Promise.all([
          db.entities.Invoice.list(),
          db.entities.Payment.list(),
          db.entities.Guest.list(),
        ]);
        setInvoices(invData || []);
        setPayments(payData || []);
        setGuests(guestData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#E2E8F0] border-t-[#123B63] rounded-full animate-spin"></div>
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
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Invoices', value: invoices.length, icon: Receipt, color: 'text-[#123B63]', bg: 'bg-blue-50' },
    { label: 'Payments', value: completedPayments, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17212B]">Finance & Billing</h1>
        <p className="text-sm text-[#64748B] mt-1">Guest folios, invoices and payment monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#17212B]">{k.value}</p>
                  <p className="text-xs text-[#64748B]">{k.label}</p>
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
              tab === t ? 'bg-[#123B63] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F6F8FB]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'invoices' ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {invoices.length === 0 ? (
            <p className="text-sm text-[#64748B] py-16 text-center">No invoices yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#64748B] bg-[#F6F8FB] border-b border-[#E2E8F0]">
                    <th className="px-4 py-3 font-medium">Invoice #</th>
                    <th className="px-4 py-3 font-medium">Guest</th>
                    <th className="px-4 py-3 font-medium">Issue Date</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F6F8FB]">
                      <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{inv.invoice_number}</td>
                      <td className="px-4 py-3 font-medium text-[#17212B]">{getGuestName(inv.guest_id)}</td>
                      <td className="px-4 py-3 text-[#64748B]">{inv.issue_date || '-'}</td>
                      <td className="px-4 py-3 font-medium text-[#17212B]">${inv.total || 0}</td>
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {payments.length === 0 ? (
            <p className="text-sm text-[#64748B] py-16 text-center">No payments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#64748B] bg-[#F6F8FB] border-b border-[#E2E8F0]">
                    <th className="px-4 py-3 font-medium">Reference</th>
                    <th className="px-4 py-3 font-medium">Guest</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay) => (
                    <tr key={pay.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F6F8FB]">
                      <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{pay.reference || '-'}</td>
                      <td className="px-4 py-3 font-medium text-[#17212B]">{getGuestName(pay.guest_id)}</td>
                      <td className="px-4 py-3 font-medium text-[#17212B]">${pay.amount || 0}</td>
                      <td className="px-4 py-3 text-[#64748B] capitalize">{pay.method?.replace('_', ' ') || '-'}</td>
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