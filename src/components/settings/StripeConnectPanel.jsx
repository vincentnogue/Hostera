const db = globalThis.__B44_DB__ || { entities: new Proxy({}, { get: () => ({ update: async () => ({}) }) }) };

import React, { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Split-payment commission (Stripe Connect, 8% platform fee) only works
// once a hotel has its own connected account — this panel is the whole
// onboarding + status loop for that, kept isolated from PropertySettings'
// main form/save so a Stripe hiccup never blocks saving ordinary property
// details. Writes stripe_account_id straight to the property row via the
// normal db.entities.Property.update() (RLS-scoped, no server secret
// needed for that part — only functions/api/stripe-connect-onboarding.js
// needs STRIPE_SECRET_KEY).
export default function StripeConnectPanel({ property, onUpdated }) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState(null); // { charges_enabled, payouts_enabled, details_submitted }
  const [checkingStatus, setCheckingStatus] = useState(false);

  const accountId = property?.stripe_account_id;

  useEffect(() => {
    if (!accountId) { setStatus(null); return; }
    setCheckingStatus(true);
    fetch(`/api/stripe-connect-onboarding?account_id=${encodeURIComponent(accountId)}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setStatus(d); })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, [accountId]);

  const startOnboarding = async () => {
    if (!property) return;
    setConnecting(true);
    try {
      const resp = await fetch('/api/stripe-connect-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existing_account_id: accountId || undefined,
          return_url: window.location.href,
          refresh_url: window.location.href,
          email: property.email || undefined,
          country: (property.country || '').slice(0, 2).toUpperCase() || undefined,
          business_name: property.legal_name || property.name || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast({ title: 'Stripe connection unavailable', description: data.message || 'Please try again later.', variant: 'destructive' });
        return;
      }
      if (data.account_id && data.account_id !== accountId) {
        await db.entities.Property.update(property.id, { stripe_account_id: data.account_id });
        onUpdated?.();
      }
      window.location.href = data.onboarding_url;
    } catch (err) {
      toast({ title: 'Could not start Stripe onboarding', description: String(err.message || err), variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="bg-white border border-brand-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="w-4 h-4 text-brand-navy" />
        <h2 className="text-base font-semibold text-brand-ink">Payments — Stripe Connect</h2>
      </div>
      <p className="text-sm text-brand-slate mb-4">
        Guests pay by card at booking. Hostera keeps an 8% platform commission and transfers the rest to you automatically — no manual invoicing.
      </p>

      {!accountId ? (
        <button onClick={startOnboarding} disabled={connecting}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue disabled:opacity-60">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Connect Stripe account
        </button>
      ) : checkingStatus ? (
        <p className="text-sm text-brand-slate flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking status…</p>
      ) : status?.charges_enabled ? (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" /> Connected — this property can accept card payments with automatic commission split.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle className="w-4 h-4" /> Stripe onboarding started but not finished — payments won&apos;t work until it&apos;s complete.
          </div>
          <button onClick={startOnboarding} disabled={connecting}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-blue disabled:opacity-60">
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Finish onboarding
          </button>
        </div>
      )}
    </div>
  );
}
