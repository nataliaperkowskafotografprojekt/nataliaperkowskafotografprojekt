import { kv, withTimeout } from '../../../lib/serwer.js';
export async function onRequestGet({ params, env }) {
  try {
    if (!/^[A-Za-z0-9]{12}$/.test(params.id)) return new Response('Nie znaleziono', { status: 404 });
    const r = await withTimeout(kv(env).getWithMetadata('img:' + params.id, 'arrayBuffer'), 6000, 'kv-timeout');
    if (!r.value) return new Response('Nie znaleziono', { status: 404 });
    return new Response(r.value, { headers: { 'Content-Type': (r.metadata && r.metadata.ct) || 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
  } catch (e) { return new Response('Serwer chwilowo nie odpowiada', { status: 503 }); }
}
