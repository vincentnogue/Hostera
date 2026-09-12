// Cloudflare Pages Function — POST /api/ai-chat
//
// This is the ONLY place the Anthropic API key ever exists. It lives in
// Cloudflare's server-side environment variable (Settings > Environment
// variables > ANTHROPIC_API_KEY, or wrangler.toml [vars] for a non-secret
// value — but this one genuinely IS a secret, unlike the Supabase anon
// key, so it belongs in the dashboard as a "Secret" type, or as a
// Wrangler secret via `wrangler pages secret put ANTHROPIC_API_KEY`).
// It never reaches the browser bundle — unlike VITE_-prefixed variables,
// anything read here via `env.X` (no VITE_ prefix) stays server-side.
//
// The frontend (src/pages/HosteraAI.jsx) assembles the business-data
// context itself, using the normal db.entities.* calls that are already
// RLS-scoped to the logged-in user's organization — so by the time data
// reaches this function, tenant isolation has already been enforced. This
// function never queries Supabase directly; it only forwards what the
// authenticated frontend already legitimately has access to.
export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'not_connected', message: 'Hostera AI is not connected yet. A platform administrator needs to set ANTHROPIC_API_KEY.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'Invalid JSON body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { messages, context } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'messages[] is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const systemPrompt = [
    'You are Hostera AI, a hospitality operations copilot built into the Hostera platform.',
    'You help hotel staff understand their own property\'s performance — occupancy, revenue, ',
    'upcoming arrivals/departures, guest feedback, and operational issues.',
    'You ONLY ever see the data explicitly included below in CONTEXT, which the app has already',
    'scoped to this user\'s own organization and property — never claim to know anything beyond it,',
    'and never speculate about other hotels, tenants, or data you were not given.',
    'Be concise, concrete, and specific to the numbers given. Suggest actions when relevant',
    '(e.g. rate adjustments, follow-ups with guests, staffing).',
    context ? `\n\nCONTEXT (this property, right now):\n${JSON.stringify(context, null, 2)}` : '\n\nCONTEXT: none provided.',
  ].join(' ');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: 'upstream_error', message: errText }), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error', message: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
