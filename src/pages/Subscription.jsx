const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import BrandLogo from '@/components/marketing/BrandLogos';
import { CreditCard, Plus, X, Check, Star, ArrowUpCircle } from 'lucide-react';

const PSPS = [
  { id: 'payunit', name: 'PayUnit', label: 'PayUnit — Mobile money & cards (Africa)' },
  { id: 'stripe', name: 'Stripe', label: 'Stripe — Global cards' },
  { id: 'paddle', name: 'Paddle', label: 'Paddle — Merchant of record' },
  { id: 'flutterwave', name: 'Flutterwave', label: 'Flutterwave — Africa & global' },
  { id: 'paystack', name: 'Paystack', label: 'Paystack — Africa' },
  { id: 'korapay', name: 'Kora Pay', label: 'Kora Pay — Africa payouts' },
];

const PLAN_PRICES = { starter: 49, professional: 129, business: 299, enterprise: 499 };
const PLAN_INFO = {
  starter: 'Up to 5 users · 1 property · Core PMS',
  professional: 'Up to 15 users · Channel Manager · Revenue Management',
  business: 'Up to 50 users · Integration Hub · API · Hostera AI',
  enterprise: 'Unlimited users & properties · Consolidated reporting',
};

export default function Subscription() {
  const [settings, setSettings] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ psp: 'stripe', label: '' });

  useEffect(() => {
    Promise.all([
      db.entities.SubscriptionSetting.list(),
      db.entities.SubscriptionPaymentMethod.list(),
      db.entities.Organization.list().catch(() => []),
    ])
      .then(async ([subs, pm, orgs]) => {
        let s = (subs || [])[0];
        if (!s) {
          const orgName = (orgs || [])[0]?.name || 'My Organization';
          const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1); nextMonth.setDate(1);
          s = await db.entities.SubscriptionSetting.create({ organization_name: orgName, plan: 'starter', status: 'trial', billing_cycle: 'monthly', seats: 5, next_billing_date: nextMonth.toISOString().slice(0, 10) });
        }
        setSettings(s);
        setMethods(pm || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  const updatePlan = async (patch) => {
    setSaving(true);
    try {
      await db.entities.SubscriptionSetting.update(settings.id, patch);
      setSettings({ ...settings, ...patch });
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const addMethod = async (e) => {
    e.preventDefault();
    if (!form.label) return;
    const first = methods.length === 0;
    const created = await db.entities.SubscriptionPaymentMethod.create({ psp: form.psp, label: form.label, is_default: first });
    setMethods(prev => [...prev, created]);
    if (first) await updatePlan({ current_psp: form.psp });
    setForm({ psp: 'stripe', label: '' });
    setShowAdd(false);
  };

  const setDefault = async (m) => {
    await db.entities.SubscriptionPaymentMethod.updateMany({ is_default: true }, { $set: { is_default: false } });
    await db.entities.SubscriptionPaymentMethod.update(m.id, { is_default: true });
    setMethods(prev => prev.map(x => ({ ...x, is_default: x.id === m.id })));
    await updatePlan({ current_psp: m.psp });
  };

  const removeMethod = async (id) => {
    await db.entities.SubscriptionPaymentMethod.delete(id);
    setMethods(prev => prev.filter(m => m.id !== id));
  };

  if (loading) return <p className="text-sm text-brand-slate">Loading subscription…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">Subscription</h1>
        <p className="text-sm text-brand-slate">Your plan, payment methods and upgrade options.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current plan */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-brand-border p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-brand-ink capitalize">{settings.plan} Plan</p>
                    <p className="text-xs text-brand-slate">{PLAN_INFO[settings.plan]}</p>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${settings.status === 'active' ? 'bg-green-50 text-green-700' : settings.status === 'trial' ? 'bg-blue-50 text-brand-navy' : 'bg-red-50 text-red-600'}`}>
                {settings.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Monthly price', value: `$${PLAN_PRICES[settings.plan]}` },
                { label: 'Billing cycle', value: settings.billing_cycle },
                { label: 'Seats', value: settings.seats },
                { label: 'Next billing', value: settings.next_billing_date ? new Date(settings.next_billing_date).toLocaleDateString() : '—' },
              ].map(k => (
                <div key={k.label} className="p-3 bg-brand-bg rounded-xl">
                  <p className="text-[10px] text-brand-slate-light uppercase">{k.label}</p>
                  <p className="text-sm font-semibold text-brand-ink capitalize">{k.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade */}
          <div className="bg-white rounded-xl border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-brand-navy" /> Change Plan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(PLAN_PRICES).map(p => (
                <button
                  key={p}
                  disabled={saving}
                  onClick={() => updatePlan({ plan: p })}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all disabled:opacity-60 ${settings.plan === p ? 'border-brand-navy bg-blue-50/30' : 'border-brand-border hover:border-brand-blue/50'}`}
                >
                  <p className="text-sm font-bold text-brand-ink capitalize">{p}</p>
                  <p className="text-xs text-brand-navy font-semibold">${PLAN_PRICES[p]}/mo</p>
                  {settings.plan === p && <span className="text-[9px] text-green-600 font-semibold">Current</span>}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs text-brand-slate">Billing cycle:</span>
              {['monthly', 'annual'].map(c => (
                <button key={c} disabled={saving} onClick={() => updatePlan({ billing_cycle: c })} className={`px-3.5 py-1.5 text-xs font-medium rounded-full capitalize disabled:opacity-60 ${settings.billing_cycle === c ? 'bg-brand-navy text-white' : 'border border-brand-border text-brand-slate'}`}>
                  {c} {c === 'annual' && '(−2 months)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-navy" /> Payment Methods
            </h3>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-1.5 bg-brand-navy text-white text-xs font-semibold rounded-full hover:bg-brand-blue">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {methods.length === 0 ? (
            <p className="text-xs text-brand-slate-light py-4 text-center border border-dashed border-brand-border rounded-xl">No payment method yet.</p>
          ) : (
            <div className="space-y-2.5">
              {methods.map(m => (
                <div key={m.id} className="p-3.5 rounded-xl border border-brand-border">
                  <div className="flex items-center justify-between mb-2">
                    <BrandLogo name={PSPS.find(p => p.id === m.psp)?.name || m.psp} size="sm" />
                    {m.is_default ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold"><Check className="w-3 h-3" /> Default</span>
                    ) : (
                      <button onClick={() => setDefault(m)} className="text-[10px] px-2 py-0.5 border border-brand-border text-brand-slate rounded-full hover:border-brand-navy">Set default</button>
                    )}
                  </div>
                  <p className="text-xs text-brand-ink font-medium">{m.label}</p>
                  {!m.is_default && (
                    <button onClick={() => removeMethod(m.id)} className="text-[10px] text-red-500 hover:text-red-600 mt-1.5 font-medium">Remove</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-brand-slate-light mt-4 leading-relaxed">
            Hostera connects through 6 payment service providers for subscriptions: PayUnit, Stripe, Paddle, Flutterwave, Paystack and Kora Pay.
          </p>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-ink">Add Payment Method</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-brand-slate" /></button>
            </div>
            <form onSubmit={addMethod} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-brand-slate block mb-1.5">Provider</label>
                <div className="space-y-2">
                  {PSPS.map(p => (
                    <button type="button" key={p.id} onClick={() => setForm({ ...form, psp: p.id })} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${form.psp === p.id ? 'border-brand-navy bg-blue-50/30' : 'border-brand-border hover:border-brand-blue/50'}`}>
                      <BrandLogo name={p.name} size="sm" />
                      <span className="text-[11px] text-brand-slate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <input placeholder="Label (e.g. Visa •••• 4242 or account name)" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className={inputCls} />
              <button type="submit" className="w-full py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue">Add Method</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}