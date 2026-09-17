// Cloudflare Pages Function — POST /api/create-payment-intent
//
// Creates a PaymentIntent for a guest booking with Stripe Connect's
// destination-charge split: the full amount is charged to the guest,
// `application_fee_amount` (8% platform commission) stays on the platform's
// Stripe account, and the rest transfers automatically to the hotel's
// connected account. This is what makes the 8% commission real money
// movement instead of a number computed after the fact.
//
// STRIPE_SECRET_KEY is server-side only (see stripe-connect-onboarding.js
// for the same pattern). The platform's own commission rate defaults to 8%
// but can be overridden per request for future flexibility (e.g. a
// promotional rate) — never trust a client-supplied fee amount directly,
// always recompute it here from a rate.
const DEFAULT_COMMISSION_RATE = 0.08;

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: 'not_connected', message: 'Stripe is not connected yet. A platform administrator needs to set STRIPE_SECRET_KEY.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'Invalid JSON body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { amount, currency, connected_account_id, booking_reference, commission_rate } = body || {};
  const amountNumber = Number(amount);
  if (!amountNumber || amountNumber <= 0) {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'amount (in the currency\'s smallest unit) must be a positive number.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!connected_account_id) {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'connected_account_id is required — this hotel has not completed Stripe onboarding yet.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const rate = Number.isFinite(Number(commission_rate)) ? Number(commission_rate) : DEFAULT_COMMISSION_RATE;
  const applicationFee = Math.round(amountNumber * rate);

  const params = new URLSearchParams();
  params.append('amount', String(Math.round(amountNumber)));
  params.append('currency', (currency || 'usd').toLowerCase());
  params.append('application_fee_amount', String(applicationFee));
  params.append('transfer_data[destination]', connected_account_id);
  params.append('automatic_payment_methods[enabled]', 'true');
  if (booking_reference) params.append('metadata[booking_reference]', String(booking_reference));
  params.append('metadata[commission_rate]', String(rate));

  try {
    const resp = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-06-20',
      },
      body: params,
    });
    const intent = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'stripe_error', message: intent?.error?.message || 'Could not create payment intent.' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      client_secret: intent.client_secret,
      payment_intent_id: intent.id,
      application_fee_amount: applicationFee,
      hotel_payout_amount: Math.round(amountNumber) - applicationFee,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error', message: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
