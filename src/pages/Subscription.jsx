const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import BrandLogo from '@/components/marketing/BrandLogos';
import { CreditCard, Star, ArrowUpCircle, Building2, Users as UsersIcon, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PLANS, ONBOARDING } from '@/lib/marketing';
import { isCurrentUserPlatformAdmin } from '@/lib/hosteraBackend';

const PSPS = [
  { id: 'payunit', name: 'PayUnit', label: 'PayUnit — Mobile money & cards (Africa)' },
  { id: 'stripe', name: 'Stripe', label: 'Stripe — Global cards' },
  { id: 'paddle', name: 'Paddle', label: 'Paddle — Merchant of record' },
  { id: 'flutterwave', name: 'Flutterwave', label: 'Flutterwave — Africa & global' },
  { id: 'paystack', name: 'Paystack', label: 'Paystack — Africa' },
];

// Single source of truth for plan pricing/limits lives in src/lib/marketing.js
// (PLANS) — this used to be duplicated here with stale numbers, which had
// drifted out of sync with the public Pricing page. Deriving it here instead
// keeps the in-app "Change Plan" panel and the marketing site permanently
// in agreement.
const PLAN_KEYS = PLANS.map(p => p.name.toLowerCase());
const PLAN_BY_KEY = Object.fromEntries(PLANS.map(p => [p.name.toLowerCase(), p]));

export default function Subscription() {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(null); // null = checking
  const [settings, setSettings] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [propertyCount, setPropertyCount] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPsp, setSelectedPsp] = useState('stripe');
  const [checkingOut, setCheckingOut] = useState(false);

  // Paddle Billing is the one PSP here that doesn't do a plain redirect —
  // it opens its own checkout overlay via Paddle.js, so that script has to
  // be loaded and initialized with the account's client-side token before
  // startCheckout() can call window.Paddle.Checkout.open(). Loaded lazily,
  // only once, only when Paddle is actually selected.
  useEffect(() => {
    if (selectedPsp !== 'paddle' || window.Paddle) return;
    const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    if (!token) return; // startCheckout() surfaces a clear error if this is missing
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => window.Paddle?.Initialize({ token });
    document.head.appendChild(script);
  }, [selectedPsp]);

  useEffect(() => {
    (async () => {
      const admin = await isCurrentUserPlatformAdmin();
      setIsAdmin(admin);
      if (admin) { setLoading(false); return; } // platform admins never pay — see below, no subscription row is even created for them

      try {
        const [subs, orgs, properties, members, me] = await Promise.all([
          db.entities.SubscriptionSetting.list(),
          db.entities.Organization.list().catch(() => []),
          db.entities.Property.list().catch(() => []),
          db.entities.User.list().catch(() => []),
          db.auth.me().catch(() => null),
        ]);
        const org = (orgs || [])[0];
        setOrgId(org?.id || null);
        setOrgName(org?.name || 'My Organization');
        setCustomerEmail(me?.email || '');
        let s = (subs || [])[0];
        if (!s && org) {
          const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1); nextMonth.setDate(1);
          s = await db.entities.SubscriptionSetting.create({ organization_id: org.id, organization_name: org.name, plan: 'starter', status: 'trial', billing_cycle: 'monthly', seats: 5, next_billing_date: nextMonth.toISOString().slice(0, 10) });
        }
        setSettings(s || null);
        setPropertyCount((properties || []).length);
        setUserCount((members || []).length);
      } catch (e) {
        console.error(e);
        toast({ title: 'Could not load subscription', description: e.message || 'Please refresh and try again.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updatePlan = async (patch) => {
    setSaving(true);
    try {
      await db.entities.SubscriptionSetting.update(settings.id, patch);
      setSettings({ ...settings, ...patch });
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not update plan', description: e.message || 'Please try again.', variant: 'destructive' });
    }
    finally { setSaving(false); }
  };

  // Real checkout: creates a hosted session with whichever PSP is selected
  // (functions/api/create-subscription-checkout.js) and sends the browser
  // there. The subscription only actually activates once that PSP's
  // webhook confirms payment (functions/api/subscription-webhook.js) —
  // this button starting a checkout is not itself proof of payment.
  const startCheckout = async (plan) => {
    if (!orgId) return;
    setCheckingOut(true);
    try {
      const planDef = PLAN_BY_KEY[plan];
      const resp = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psp: selectedPsp,
          plan,
          billing_cycle: settings.billing_cycle || 'monthly',
          amount: settings.billing_cycle === 'annual' ? planDef.price * 10 : planDef.price, // 2 months free annually, matches the UI copy below
          currency: 'USD',
          organization_id: orgId,
          organization_name: orgName,
          customer_email: customerEmail,
          success_url: `${window.location.origin}/subscription?checkout=success`,
          cancel_url: `${window.location.origin}/subscription?checkout=cancelled`,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        toast({ title: `${PSPS.find(p => p.id === selectedPsp)?.name || selectedPsp} checkout unavailable`, description: data.message || 'Please try a different provider.', variant: 'destructive' });
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.checkout_transaction_id) {
        // Paddle Billing opens its own overlay client-side rather than a
        // plain redirect — Paddle.js must be loaded for this to work; see
        // the note in create-subscription-checkout.js.
        if (window.Paddle) {
          window.Paddle.Checkout.open({ transactionId: data.checkout_transaction_id });
        } else {
          toast({ title: 'Paddle checkout not loaded', description: 'Paddle.js failed to initialize — try another provider.', variant: 'destructive' });
        }
      }
    } catch (err) {
      toast({ title: 'Checkout failed', description: String(err.message || err), variant: 'destructive' });
    } finally {
      setCheckingOut(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2 border border-brand-border rounded-full text-sm outline-none focus:border-brand-navy";

  if (loading || isAdmin === null) return <p className="text-sm text-brand-slate">Loading subscription…</p>;

  if (isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center bg-white rounded-2xl border border-brand-border p-8">
        <ShieldCheck className="w-10 h-10 text-green-600 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-brand-ink">Platform Admin</h1>
        <p className="text-sm text-brand-slate mt-2">Platform administrators don&apos;t pay for a subscription and have unrestricted access to the whole platform — nothing to configure here.</p>
      </div>
    );
  }

  if (!settings) return <p className="text-sm text-brand-slate">No subscription found for your organization yet.</p>;

  const currentPlan = PLAN_BY_KEY[settings.plan] || PLANS[0];
  const propertiesUsed = propertyCount ?? 0;
  const usersUsed = userCount ?? 0;
  const propertyLimitHit = currentPlan.maxProperties != null && propertiesUsed >= currentPlan.maxProperties;
  const userLimitHit = currentPlan.maxUsers != null && usersUsed >= currentPlan.maxUsers;

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
                    <p className="text-lg font-bold text-brand-ink capitalize">{currentPlan.name} Plan</p>
                    <p className="text-xs text-brand-slate">{currentPlan.accessNote}</p>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${settings.status === 'active' ? 'bg-green-50 text-green-700' : settings.status === 'trial' ? 'bg-blue-50 text-brand-navy' : 'bg-red-50 text-red-600'}`}>
                {settings.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Monthly price', value: `$${currentPlan.price}` },
                { label: 'Billing cycle', value: settings.billing_cycle },
                { label: 'Onboarding', value: 'Self-service' },
                { label: 'Next billing', value: settings.next_billing_date ? new Date(settings.next_billing_date).toLocaleDateString() : '—' },
              ].map(k => (
                <div key={k.label} className="p-3 bg-brand-bg rounded-xl">
                  <p className="text-[10px] text-brand-slate-light uppercase">{k.label}</p>
                  <p className="text-sm font-semibold text-brand-ink capitalize">{k.value}</p>
                </div>
              ))}
            </div>

            {/* Usage vs plan limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className={`p-3.5 rounded-xl border ${propertyLimitHit ? 'border-amber-300 bg-amber-50' : 'border-brand-border bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-brand-ink"><Building2 className="w-3.5 h-3.5 text-brand-navy" /> Properties</span>
                  <span className="text-xs font-bold text-brand-ink">{propertiesUsed} / {currentPlan.maxProperties ?? '∞'}</span>
                </div>
                {propertyLimitHit && <p className="text-[10px] text-amber-700 mt-1.5">Limit reached — upgrade to add another property.</p>}
              </div>
              <div className={`p-3.5 rounded-xl border ${userLimitHit ? 'border-amber-300 bg-amber-50' : 'border-brand-border bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-brand-ink"><UsersIcon className="w-3.5 h-3.5 text-brand-navy" /> Users</span>
                  <span className="text-xs font-bold text-brand-ink">{usersUsed} / {currentPlan.maxUsers ?? '∞'}</span>
                </div>
                {userLimitHit && <p className="text-[10px] text-amber-700 mt-1.5">Limit reached — upgrade to invite more users.</p>}
              </div>
            </div>
          </div>

          {/* Upgrade */}
          <div className="bg-white rounded-xl border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-ink mb-4 flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-brand-navy" /> Change Plan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLAN_KEYS.map(p => (
                <button
                  key={p}
                  disabled={saving || checkingOut || p === settings.plan}
                  onClick={() => startCheckout(p)}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all disabled:opacity-60 ${settings.plan === p ? 'border-brand-navy bg-blue-50/30' : 'border-brand-border hover:border-brand-blue/50'}`}
                >
                  <p className="text-sm font-bold text-brand-ink capitalize">{p}</p>
                  <p className="text-xs text-brand-navy font-semibold">${PLAN_BY_KEY[p].price}/mo</p>
                  {settings.plan === p ? <span className="text-[9px] text-green-600 font-semibold">Current</span> : <span className="text-[9px] text-brand-slate">Pay & switch</span>}
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
            <p className="text-[11px] text-brand-slate mt-4 pt-4 border-t border-brand-border">
              Self-service onboarding is included on every plan. Need a white-glove setup instead?{' '}
              <span className="font-semibold text-brand-ink">Assisted onboarding starts at ${ONBOARDING.assistedOnboardingFromPrice}</span>, and is included on Enterprise.
            </p>
          </div>
        </div>

        {/* Payment provider */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-ink flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-brand-navy" /> Payment Provider
          </h3>
          <div className="space-y-2">
            {PSPS.map(p => (
              <button type="button" key={p.id} onClick={() => setSelectedPsp(p.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${selectedPsp === p.id ? 'border-brand-navy bg-blue-50/30' : 'border-brand-border hover:border-brand-blue/50'}`}>
                <BrandLogo name={p.name} size="sm" />
                <span className="text-[11px] text-brand-slate">{p.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => startCheckout(settings.plan)} disabled={checkingOut}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-full hover:bg-brand-blue disabled:opacity-60">
            {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            {checkingOut ? 'Redirecting…' : `Pay with ${PSPS.find(p => p.id === selectedPsp)?.name}`}
          </button>
          <p className="text-[10px] text-brand-slate-light mt-4 leading-relaxed">
            You&apos;ll be taken to {PSPS.find(p => p.id === selectedPsp)?.name}&apos;s secure checkout. Your plan activates automatically once payment is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
