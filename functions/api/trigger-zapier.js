// Cloudflare Pages Function — POST /api/trigger-zapier
//
// Forwards an event payload to the property's configured Zapier "Catch
// Hook" webhook URL. Real outbound call, not a simulated success.
export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad_request', message: 'Invalid JSON body.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { webhook_url, payload } = body || {};
  if (!webhook_url || typeof webhook_url !== 'string' || !webhook_url.startsWith('https://hooks.zapier.com/')) {
    return new Response(
      JSON.stringify({ error: 'bad_request', message: 'webhook_url must be a real hooks.zapier.com URL.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const resp = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: 'zapier_error', message: `Zapier responded with ${resp.status}.` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error', message: String(err) }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
