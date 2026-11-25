import { pobierz, hostOk } from '../../../lib/instagram.js';
import { withTimeout } from '../../../lib/serwer.js';
export async function onRequestGet({ params, env }) {
  try {
    const c = await pobierz(env); const it = c && c.items[parseInt(params.i, 10)];
    if (!it || !hostOk(it.url)) return new Response('Nie znaleziono', { status: 404 });
    const r = await withTimeout(fetch(it.url), 8000);
    if (!r.ok) return new Response('Błąd', { status: 502 });
    return new Response(r.body, { headers: { 'Content-Type': r.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=3600' } });
  } catch (e) { return new Response('Serwer chwilowo nie odpowiada', { status: 503 }); }
}
