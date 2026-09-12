// Cloudflare Pages Function — POST /api/send-telegram
//
// Actually calls Telegram's Bot API (server-side, so the bot token never
// appears in a client-side network request/CORS preflight). The bot token
// itself is still whatever the property staff entered in Integration Hub
// (stored in Supabase, not a Cloudflare secret like the AI keys) — this
// function's job is just to make the real call, not to solve the
// credential-storage security question noted elsewhere.
export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'Invalid JSON body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { bot_token, chat_id, text } = body || {};
  if (!bot_token || !chat_id || !text) {
    return new Response(
      JSON.stringify({ error: 'bad_request', message: 'bot_token, chat_id and text are all required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const resp = await fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      return new Response(
        JSON.stringify({ error: 'telegram_error', message: data.description || 'Telegram rejected the request.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error', message: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
