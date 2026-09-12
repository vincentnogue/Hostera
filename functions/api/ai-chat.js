// Cloudflare Pages Function — POST /api/ai-chat
//
// This is the ONLY place any AI provider key ever exists. Keys live in
// Cloudflare's server-side environment (Settings > Environment variables,
// added as "Secret" type — Secrets are respected even on projects where
// wrangler.toml governs plain "Text" vars, unlike the Supabase anon key
// situation earlier). They never reach the browser bundle — unlike
// VITE_-prefixed variables, anything read here via `env.X` (no VITE_
// prefix) stays server-side.
//
// Gemini (env.GEMINI_API_KEY) is the default provider so every property
// on the platform shares one configured assistant. Anthropic
// (env.ANTHROPIC_API_KEY) still works as a fallback/alternative if ever
// set instead.
//
// The frontend (src/pages/HosteraAI.jsx) assembles the business-data
// context itself, using the normal db.entities.* calls that are already
// RLS-scoped to the logged-in user's organization — so by the time data
// reaches this function, tenant isolation has already been enforced. This
// function never queries Supabase directly; it only forwards what the
// authenticated frontend already legitimately has access to.
export async function onRequestPost({ request, env }) {
  const provider = env.GEMINI_API_KEY ? 'gemini' : env.ANTHROPIC_API_KEY ? 'anthropic' : null;

  if (!provider) {
    return new Response(
      JSON.stringify({ error: 'not_connected', message: 'Hostera AI is not connected yet. A platform administrator needs to set GEMINI_API_KEY (or ANTHROPIC_API_KEY).' }),
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
    if (provider === 'gemini') {
      const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return new Response(JSON.stringify({ error: 'upstream_error', message: errText }), { status: resp.status, headers: { 'Content-Type': 'application/json' } });
      }

      const data = await resp.json();
      const text = (data.candidates || [])
        .flatMap(c => (c.content?.parts || []).map(p => p.text))
        .filter(Boolean)
        .join('\n');
      return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Anthropic fallback
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

