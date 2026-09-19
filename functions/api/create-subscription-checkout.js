// Cloudflare Pages Function — POST /api/create-subscription-checkout
//
// This is Hostera's OWN subscription billing (a hotel paying Hostera for
// the PMS) — a completely separate payment flow from functions/api/
// create-payment-intent.js, which is a guest paying a hotel for a room
// with Hostera taking an 8% cut via Stripe Connect. Nothing here touches
// Stripe Connect; each PSP here is billed directly to Hostera's own
// merchant account.
//
// Every secret below is server-side only (Cloudflare "Secret" env vars,
// same pattern as STRIPE_SECRET_KEY) and none of them are the Stripe
// Connect keys used for bookings.
//
// Body: { psp: 'stripe'|'flutterwave'|'paystack'|'paddle'|'payunit',
//         plan: 'starter'|'growth'|'pro'|'enterprise', billing_cycle: 'monthly'|'annual',
//         amount: number (major currency unit, e.g. 49.00), currency: 'USD',
//         organization_id: string, organization_name: string,
//         customer_email: string, success_url: string, cancel_url: string }
//
// Returns { checkout_url } — the frontend redirects the browser there.
// Each PSP confirms payment via its own webhook
// (functions/api/subscription-webhook.js?psp=<name>), never via this
// response, since the person can close the tab before finishing.

function jsonError(status, message, extra) {
  return new Response(JSON.stringify({ error: true, message, ...extra }), { status, headers: { 'Content-Type': 'application/json' } });
}
function jsonOk(body) {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

async function stripeCheckout(env, body) {
  if (!env.STRIPE_SECRET_KEY) return jsonError(503, 'Stripe is not connected — a platform administrator needs to set STRIPE_SECRET_KEY.');
  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('success_url', body.success_url);
  params.append('cancel_url', body.cancel_url);
  params.append('customer_email', body.customer_email || '');
  params.append('client_reference_id', body.organization_id);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', (body.currency || 'usd').toLowerCase());
  params.append('line_items[0][price_data][unit_amount]', String(Math.round(body.amount * 100)));
  params.append('line_items[0][price_data][recurring][interval]', body.billing_cycle === 'annual' ? 'year' : 'month');
  params.append('line_items[0][price_data][product_data][name]', `Hostera ${body.plan} plan`);
  params.append('metadata[organization_id]', body.organization_id);
  params.append('metadata[plan]', body.plan);
  params.append('metadata[billing_cycle]', body.billing_cycle);
  params.append('subscription_data[metadata][organization_id]', body.organization_id);

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Stripe-Version': '2024-06-20' },
    body: params,
  });
  const session = await resp.json();
  if (!resp.ok) return jsonError(502, session?.error?.message || 'Stripe checkout failed');
  return jsonOk({ checkout_url: session.url, reference: session.id });
}

async function flutterwaveCheckout(env, body) {
  if (!env.FLUTTERWAVE_SECRET_KEY) return jsonError(503, 'Flutterwave is not connected — set FLUTTERWAVE_SECRET_KEY.');
  const tx_ref = `hostera-${body.organization_id}-${Date.now()}`;
  const resp = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_ref,
      amount: body.amount,
      currency: body.currency || 'USD',
      redirect_url: body.success_url,
      customer: { email: body.customer_email, name: body.organization_name },
      customizations: { title: 'Hostera Subscription', description: `${body.plan} plan (${body.billing_cycle})` },
      meta: { organization_id: body.organization_id, plan: body.plan, billing_cycle: body.billing_cycle },
    }),
  });
  const data = await resp.json();
  if (!resp.ok || data.status !== 'success') return jsonError(502, data?.message || 'Flutterwave checkout failed');
  return jsonOk({ checkout_url: data.data.link, reference: tx_ref });
}

async function paystackCheckout(env, body) {
  if (!env.PAYSTACK_SECRET_KEY) return jsonError(503, 'Paystack is not connected — set PAYSTACK_SECRET_KEY.');
  const reference = `hostera-${body.organization_id}-${Date.now()}`;
  const resp = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: body.customer_email,
      amount: Math.round(body.amount * 100), // Paystack uses the smallest currency unit (kobo/cents)
      currency: body.currency || 'NGN',
      reference,
      callback_url: body.success_url,
      metadata: { organization_id: body.organization_id, plan: body.plan, billing_cycle: body.billing_cycle },
    }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.status) return jsonError(502, data?.message || 'Paystack checkout failed');
  return jsonOk({ checkout_url: data.data.authorization_url, reference });
}

async function paddleCheckout(env, body) {
  if (!env.PADDLE_API_KEY) return jsonError(503, 'Paddle is not connected — set PADDLE_API_KEY (and PADDLE_PRICE_ID_<PLAN>_<CYCLE>).');
  // Paddle Billing sells fixed catalog prices rather than an arbitrary
  // amount per request — a price_id must exist in the Paddle dashboard for
  // each plan/cycle combination. Configure PADDLE_PRICE_ID_STARTER_MONTHLY,
  // PADDLE_PRICE_ID_GROWTH_ANNUAL, etc. as plain (non-secret) env vars.
  const priceIdKey = `PADDLE_PRICE_ID_${body.plan.toUpperCase()}_${body.billing_cycle.toUpperCase()}`;
  const priceId = env[priceIdKey];
  if (!priceId) return jsonError(503, `No Paddle price configured for ${body.plan}/${body.billing_cycle} — set ${priceIdKey}.`);

  const resp = await fetch('https://api.paddle.com/transactions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.PADDLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      customer: body.customer_email ? { email: body.customer_email } : undefined,
      custom_data: { organization_id: body.organization_id, plan: body.plan, billing_cycle: body.billing_cycle },
      checkout: { url: body.success_url },
    }),
  });
  const data = await resp.json();
  if (!resp.ok) return jsonError(502, data?.error?.detail || 'Paddle checkout failed');
  // Paddle's hosted checkout is opened client-side via Paddle.js using this
  // transaction id, not a plain redirect URL like the other PSPs — the
  // frontend needs to branch on psp === 'paddle' and call
  // Paddle.Checkout.open({ transactionId }) instead of window.location.
  return jsonOk({ checkout_transaction_id: data.data?.id, reference: data.data?.id });
}

async function payunitCheckout(env, body) {
  if (!env.PAYUNIT_API_KEY || !env.PAYUNIT_API_SECRET) return jsonError(503, 'PayUnit is not connected — set PAYUNIT_API_KEY and PAYUNIT_API_SECRET.');
  const transaction_id = `hostera-${body.organization_id}-${Date.now()}`;
  const basicAuth = btoa(`${env.PAYUNIT_API_KEY}:${env.PAYUNIT_API_SECRET}`);
  const resp = await fetch(`https://gateway.payunit.net/api/gateway/initialize`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/json', mode: env.PAYUNIT_MODE || 'test' },
    body: JSON.stringify({
      total_amount: body.amount,
      currency: body.currency || 'XAF',
      transaction_id,
      return_url: body.success_url,
      notify_url: body.notify_url,
      name: body.organization_name,
      email: body.customer_email,
      description: `Hostera ${body.plan} plan (${body.billing_cycle})`,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) return jsonError(502, data?.message || 'PayUnit checkout failed — verify the endpoint against PayUnit\u2019s current API docs, this integration has not been tested against a live account.');
  return jsonOk({ checkout_url: data.data?.transaction_url || data.checkout_url, reference: transaction_id });
}

const HANDLERS = {
  stripe: stripeCheckout,
  flutterwave: flutterwaveCheckout,
  paystack: paystackCheckout,
  paddle: paddleCheckout,
  payunit: payunitCheckout,
};

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON body.');
  }

  const required = ['psp', 'plan', 'billing_cycle', 'amount', 'organization_id', 'success_url', 'cancel_url'];
  const missing = required.filter(k => body[k] === undefined || body[k] === null || body[k] === '');
  if (missing.length) return jsonError(400, `Missing required field(s): ${missing.join(', ')}`);

  const handler = HANDLERS[body.psp];
  if (!handler) return jsonError(400, `Unknown psp "${body.psp}". Supported: ${Object.keys(HANDLERS).join(', ')}.`);

  try {
    return await handler(env, body);
  } catch (err) {
    return jsonError(502, `${body.psp} checkout error: ${String(err)}`);
  }
}
