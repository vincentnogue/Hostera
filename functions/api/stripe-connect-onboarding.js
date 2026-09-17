// Cloudflare Pages Function — POST /api/stripe-connect-onboarding
//
// Creates (if needed) a Stripe Connect Express account for a hotel and
// returns a fresh onboarding link. STRIPE_SECRET_KEY lives only here
// (Settings > Environment variables, "Secret" type — same pattern as
// GEMINI_API_KEY in ai-chat.js) and never reaches the browser bundle.
//
// This function never touches Supabase directly — it's a thin, stateless
// wrapper around the Stripe API. The caller (PropertySettings.jsx, already
// authenticated and RLS-scoped) is responsible for persisting the returned
// `account_id` onto its own property row via the normal db.entities.Property
// .update() call. That keeps tenant-data writes going through the same RLS
// path every other write in this app already goes through, instead of this
// function needing a service-role key it doesn't otherwise need.
//
// Body: { existing_account_id?: string, return_url: string, refresh_url: string,
//         email?: string, country?: string, business_name?: string }
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

  const { existing_account_id, return_url, refresh_url, email, country, business_name } = body || {};
  if (!return_url || !refresh_url) {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'return_url and refresh_url are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const stripeForm = (obj) => {
    const params = new URLSearchParams();
    const flatten = (prefix, value) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object' && !Array.isArray(value)) {
        for (const [k, v] of Object.entries(value)) flatten(prefix ? `${prefix}[${k}]` : k, v);
      } else {
        params.append(prefix, String(value));
      }
    };
    Object.entries(obj).forEach(([k, v]) => flatten(k, v));
    return params;
  };

  const stripeFetch = (path, form) => fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    },
    body: stripeForm(form),
  });

  try {
    let accountId = existing_account_id;

    if (!accountId) {
      const acctResp = await stripeFetch('accounts', {
        type: 'express',
        country: country || 'AE',
        email: email || undefined,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_type: 'company',
        business_profile: business_name ? { name: business_name } : undefined,
      });
      const acct = await acctResp.json();
      if (!acctResp.ok) {
        return new Response(JSON.stringify({ error: 'stripe_error', message: acct?.error?.message || 'Could not create Stripe account.' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
      }
      accountId = acct.id;
    }

    const linkResp = await stripeFetch('account_links', {
      account: accountId,
      refresh_url,
      return_url,
      type: 'account_onboarding',
    });
    const link = await linkResp.json();
    if (!linkResp.ok) {
      return new Response(JSON.stringify({ error: 'stripe_error', message: link?.error?.message || 'Could not create onboarding link.' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ account_id: accountId, onboarding_url: link.url }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error', message: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}

// GET /api/stripe-connect-onboarding?account_id=acct_xxx
// Lets PropertySettings.jsx show real status (charges_enabled / payouts_enabled)
// instead of just "we generated a link once" — Stripe onboarding can be
// abandoned partway through, so this is the only source of truth for whether
// the hotel can actually receive a split payment yet.
export async function onRequestGet({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'not_connected' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
  const url = new URL(request.url);
  const accountId = url.searchParams.get('account_id');
  if (!accountId) {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'account_id is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const resp = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Stripe-Version': '2024-06-20' },
    });
    const acct = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'stripe_error', message: acct?.error?.message }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({
      charges_enabled: !!acct.charges_enabled,
      payouts_enabled: !!acct.payouts_enabled,
      details_submitted: !!acct.details_submitted,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error', message: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
