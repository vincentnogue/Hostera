// Cloudflare Pages Function — POST /api/subscription-webhook?psp=<name>
//
// Each PSP (Stripe, Flutterwave, Paystack, Paddle, PayUnit) verifies
// payment differently, so this dispatches by the ?psp= query param — set
// a separate webhook URL per provider in each dashboard:
//   .../api/subscription-webhook?psp=stripe
//   .../api/subscription-webhook?psp=flutterwave
//   .../api/subscription-webhook?psp=paystack
//   .../api/subscription-webhook?psp=paddle
//   .../api/subscription-webhook?psp=payunit
//
// Like functions/api/stripe-webhook.js, this is the one place
// SUPABASE_SERVICE_ROLE_KEY is used for subscription billing — a webhook
// has no logged-in session, so it can't go through the normal RLS-scoped
// client the rest of the app uses. It must (a) only ever be reachable via
// a signature-verified event from the matching PSP, and (b) only ever
// write subscription_setting, nothing else.
//
// Required Cloudflare "Secret" env vars, per provider actually in use:
//   STRIPE_WEBHOOK_SECRET
//   FLUTTERWAVE_WEBHOOK_SECRET_HASH (the "secret hash" you set in Flutterwave's dashboard)
//   PAYSTACK_SECRET_KEY (Paystack signs with the same secret key used to initialize)
//   PADDLE_WEBHOOK_SECRET
//   PAYUNIT_WEBHOOK_SECRET (verification scheme not confirmed against a live
//     PayUnit account — check their current docs before relying on this in production)
// Plus SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL (already set for the
// booking webhook).

async function hmacHex(secret, message, algo = 'SHA-256') {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: algo }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns { ok, organization_id, plan, billing_cycle, reference } or { ok: false }
async function verifyAndParse(psp, rawBody, headers, env) {
  const json = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();

  if (psp === 'stripe') {
    if (!env.STRIPE_WEBHOOK_SECRET) return { ok: false, reason: 'not_configured' };
    const sigHeader = headers.get('stripe-signature');
    const parts = Object.fromEntries((sigHeader || '').split(',').map(p => p.split('=')));
    if (!parts.t || !parts.v1) return { ok: false, reason: 'bad_signature' };
    const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${rawBody}`);
    if (!timingSafeEqual(expected, parts.v1)) return { ok: false, reason: 'bad_signature' };
    if (json?.type !== 'checkout.session.completed') return { ok: false, reason: 'irrelevant_event' };
    const session = json.data?.object || {};
    return { ok: true, organization_id: session.metadata?.organization_id, plan: session.metadata?.plan, billing_cycle: session.metadata?.billing_cycle, reference: session.id, psp_customer_id: session.customer, psp_subscription_id: session.subscription };
  }

  if (psp === 'flutterwave') {
    if (!env.FLUTTERWAVE_WEBHOOK_SECRET_HASH) return { ok: false, reason: 'not_configured' };
    // Flutterwave doesn't HMAC-sign — it just echoes back a shared secret
    // you configured in their dashboard under this exact header.
    const hash = headers.get('verif-hash');
    if (!hash || !timingSafeEqual(hash, env.FLUTTERWAVE_WEBHOOK_SECRET_HASH)) return { ok: false, reason: 'bad_signature' };
    if (json?.event !== 'charge.completed' || json?.data?.status !== 'successful') return { ok: false, reason: 'irrelevant_event' };
    const meta = json.data?.meta || {};
    return { ok: true, organization_id: meta.organization_id, plan: meta.plan, billing_cycle: meta.billing_cycle, reference: json.data?.tx_ref };
  }

  if (psp === 'paystack') {
    if (!env.PAYSTACK_SECRET_KEY) return { ok: false, reason: 'not_configured' };
    const sig = headers.get('x-paystack-signature');
    const expected = await hmacHex(env.PAYSTACK_SECRET_KEY, rawBody, 'SHA-512');
    if (!sig || !timingSafeEqual(sig, expected)) return { ok: false, reason: 'bad_signature' };
    if (json?.event !== 'charge.success') return { ok: false, reason: 'irrelevant_event' };
    const meta = json.data?.metadata || {};
    return { ok: true, organization_id: meta.organization_id, plan: meta.plan, billing_cycle: meta.billing_cycle, reference: json.data?.reference };
  }

  if (psp === 'paddle') {
    if (!env.PADDLE_WEBHOOK_SECRET) return { ok: false, reason: 'not_configured' };
    // Paddle Billing header shape: "ts=<unix>;h1=<hex hmac>"
    const sigHeader = headers.get('paddle-signature') || '';
    const parts = Object.fromEntries(sigHeader.split(';').map(p => p.split('=')));
    if (!parts.ts || !parts.h1) return { ok: false, reason: 'bad_signature' };
    const expected = await hmacHex(env.PADDLE_WEBHOOK_SECRET, `${parts.ts}:${rawBody}`);
    if (!timingSafeEqual(expected, parts.h1)) return { ok: false, reason: 'bad_signature' };
    if (json?.event_type !== 'transaction.completed') return { ok: false, reason: 'irrelevant_event' };
    const custom = json.data?.custom_data || {};
    return { ok: true, organization_id: custom.organization_id, plan: custom.plan, billing_cycle: custom.billing_cycle, reference: json.data?.id };
  }

  if (psp === 'payunit') {
    // PayUnit's webhook signature scheme is not confirmed against a live
    // account — this checks a shared-secret header as a baseline; verify
    // against PayUnit's current documentation before relying on this in
    // production, and tighten it to their actual scheme if different.
    if (!env.PAYUNIT_WEBHOOK_SECRET) return { ok: false, reason: 'not_configured' };
    const sig = headers.get('x-payunit-signature') || headers.get('signature');
    if (!sig || !timingSafeEqual(sig, env.PAYUNIT_WEBHOOK_SECRET)) return { ok: false, reason: 'bad_signature' };
    if (!json || (json.status && json.status !== 'SUCCESS' && json.status !== 'success')) return { ok: false, reason: 'irrelevant_event' };
    const meta = json.data?.meta || json.meta || {};
    return { ok: true, organization_id: meta.organization_id, plan: meta.plan, billing_cycle: meta.billing_cycle, reference: json.transaction_id || json.data?.transaction_id };
  }

  return { ok: false, reason: 'unknown_psp' };
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const psp = url.searchParams.get('psp');
  if (!psp) return new Response('missing ?psp=', { status: 400 });

  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.VITE_SUPABASE_URL) {
    return new Response('webhook not configured', { status: 503 });
  }

  const rawBody = await request.text();
  const result = await verifyAndParse(psp, rawBody, request.headers, env);

  if (!result.ok) {
    if (result.reason === 'irrelevant_event') {
      // Ack so the PSP stops retrying; we just don't act on this event type.
      return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(`webhook rejected: ${result.reason}`, { status: 400 });
  }

  if (!result.organization_id) {
    return new Response('missing organization_id in payment metadata', { status: 400 });
  }

  const supabaseHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  try {
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + (result.billing_cycle === 'annual' ? 12 : 1));

    // subscription_setting.data is one jsonb blob (see hosteraBackend.js) —
    // read-merge-write so this never clobbers sibling fields, same pattern
    // as the booking webhook's reservation update.
    const existingResp = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/subscription_setting?organization_id=eq.${result.organization_id}&select=id,data`,
      { headers: supabaseHeaders }
    );
    const existingRows = await existingResp.json();
    const row = existingRows?.[0];
    const mergedData = {
      ...(row?.data || {}),
      status: 'active',
      plan: result.plan || row?.data?.plan,
      billing_cycle: result.billing_cycle || row?.data?.billing_cycle,
      current_psp: psp,
      last_payment_reference: result.reference,
      psp_customer_id: result.psp_customer_id || row?.data?.psp_customer_id,
      psp_subscription_id: result.psp_subscription_id || row?.data?.psp_subscription_id,
      next_billing_date: nextBilling.toISOString().slice(0, 10),
    };

    if (row) {
      await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/subscription_setting?id=eq.${row.id}`, {
        method: 'PATCH', headers: supabaseHeaders,
        body: JSON.stringify({ data: mergedData, updated_at: new Date().toISOString() }),
      });
    } else {
      await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/subscription_setting`, {
        method: 'POST', headers: supabaseHeaders,
        body: JSON.stringify({ organization_id: result.organization_id, data: mergedData }),
      });
    }

    // Best-effort in-app notification — mirrors the pattern in
    // stripe-webhook.js and PlatformVerifications.jsx.
    await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/notification`, {
      method: 'POST', headers: supabaseHeaders,
      body: JSON.stringify({
        organization_id: result.organization_id,
        data: { title: 'Subscription active', message: `Your ${result.plan || ''} plan is now active via ${psp}.`, type: 'system', read: false },
      }),
    }).catch(() => {});
  } catch (err) {
    return new Response(JSON.stringify({ error: 'db_error', message: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
}
