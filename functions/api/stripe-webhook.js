// Cloudflare Pages Function — POST /api/stripe-webhook
//
// Listens for payment_intent.succeeded and records the platform's 8%
// commission for that booking. This is the only place SUPABASE_SERVICE_ROLE_KEY
// is used in this app — a webhook has no logged-in user/session, so it can't
// go through the normal RLS-scoped supabase-js client the rest of the app
// uses (src/lib/supabaseClient.js). The service role key bypasses RLS
// entirely, so this function must (a) never be reachable except via a
// signature-verified Stripe event, and (b) only ever write the two tables
// below, never act on arbitrary client input.
//
// Required Cloudflare "Secret" env vars: STRIPE_WEBHOOK_SECRET,
// SUPABASE_SERVICE_ROLE_KEY. Also reads VITE_SUPABASE_URL (already a plain
// var in wrangler.toml) to know which Supabase project to write to.
//
// Configure in the Stripe dashboard: Developers > Webhooks > add endpoint
// https://<your-domain>/api/stripe-webhook, event: payment_intent.succeeded.

const DEFAULT_COMMISSION_RATE = 0.08;

// Stripe's webhook signature scheme: header is
// "t=<timestamp>,v1=<hex hmac-sha256 of `${timestamp}.${rawBody}`>".
// No Stripe SDK is used anywhere in this codebase's Cloudflare Functions
// (see ai-chat.js / trigger-zapier.js) — this replicates the same check
// with the Web Crypto API already available in the Workers runtime.
async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=')));
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`)
  );
  const expected = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time-ish compare (length-checked first) — avoids leaking
  // timing information about how much of the signature matched.
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.SUPABASE_SERVICE_ROLE_KEY || !env.VITE_SUPABASE_URL) {
    return new Response('webhook not configured', { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  const valid = await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('invalid signature', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('invalid payload', { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    // Ack everything else so Stripe stops retrying; we just don't act on it.
    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  const intent = event.data?.object || {};
  const totalAmount = (intent.amount_received ?? intent.amount ?? 0) / 100;
  const platformFee = (intent.application_fee_amount ?? 0) / 100;
  const rate = Number(intent.metadata?.commission_rate) || DEFAULT_COMMISSION_RATE;
  const hotelPayout = totalAmount - platformFee;
  const bookingReference = intent.metadata?.booking_reference || null;
  const connectedAccountId = intent.transfer_data?.destination || intent.on_behalf_of || null;

  const supabaseHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  try {
    // 1. Record the commission ledger row (platform_commission is a
    //    platform-level table — see supabase/add-ads-commissions-platform-
    //    crosstenant.sql — normally readable/writable only by platform
    //    admins via RLS; the service role key bypasses that here).
    await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/platform_commission`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        data: {
          booking_id: bookingReference,
          stripe_payment_intent_id: intent.id,
          stripe_connected_account_id: connectedAccountId,
          total_amount: totalAmount,
          commission_rate: rate * 100,
          platform_fee: platformFee,
          hotel_payout: hotelPayout,
          currency: (intent.currency || 'usd').toUpperCase(),
          status: 'succeeded',
        },
      }),
    });

    // 2. Best-effort: mark the matching reservation paid, if the booking
    //    flow passed a reservation id as the payment reference. This keeps
    //    the hotel's own Reservations/Finance views in sync with the
    //    payment without needing a second round trip from the browser
    //    (whose session may already be gone by the time Stripe confirms).
    //    reservation.data is a single jsonb blob (see hosteraBackend.js) —
    //    a raw PATCH would overwrite sibling fields, so read-merge-write
    //    the same way the app's own update() does.
    if (bookingReference) {
      try {
        const existingResp = await fetch(
          `${env.VITE_SUPABASE_URL}/rest/v1/reservation?id=eq.${bookingReference}&select=data`,
          { headers: supabaseHeaders }
        );
        const existingRows = await existingResp.json();
        const existingData = existingRows?.[0]?.data || {};
        await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/reservation?id=eq.${bookingReference}`, {
          method: 'PATCH',
          headers: supabaseHeaders,
          body: JSON.stringify({
            data: { ...existingData, payment_status: 'paid', payment_intent_id: intent.id },
            updated_at: new Date().toISOString(),
          }),
        });
      } catch { /* best-effort — the commission record above already succeeded */ }
    }
  } catch (err) {
    // Returning 500 makes Stripe retry the webhook — appropriate here since
    // a failed write means the commission genuinely wasn't recorded yet.
    return new Response(JSON.stringify({ error: 'db_error', message: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
}
