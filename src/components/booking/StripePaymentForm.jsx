import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck } from 'lucide-react';

// The publishable key is safe to ship to the browser by design (unlike
// STRIPE_SECRET_KEY, which only ever lives in the Cloudflare Functions —
// see functions/api/create-payment-intent.js). Vite inlines VITE_* vars at
// build time the same way VITE_SUPABASE_URL already is (see wrangler.toml).
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

function CheckoutForm({ onSuccess, onError, payLabel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError('');
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please check your card details and try again.');
      onError?.(confirmError);
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('Payment did not complete. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={!stripe || submitting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-brand-navy text-white text-sm font-bold rounded-full hover:bg-brand-blue disabled:opacity-60">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        {submitting ? 'Processing…' : payLabel}
      </button>
    </form>
  );
}

export default function StripePaymentForm({ clientSecret, onSuccess, onError, payLabel = 'Pay & confirm booking' }) {
  if (!stripePromise) {
    return <p className="text-xs text-red-600">Card payments aren&apos;t configured yet (missing VITE_STRIPE_PUBLISHABLE_KEY).</p>;
  }
  if (!clientSecret) return null;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} payLabel={payLabel} />
    </Elements>
  );
}
