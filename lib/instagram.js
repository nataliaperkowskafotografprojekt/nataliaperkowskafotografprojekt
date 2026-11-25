import { kvGet, kvPut, withTimeout } from './serwer.js';
// Najnowsze zdjęcia z Instagrama pobiera SERWER (RODO: odwiedzający nie łączy się z Meta). Cache w KV 1 h; token długoterminowy odświeżany co ~30 dni.
const OK_HOST = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/;
export async function pobierz(env) {
  const c = await kvGet(env, 'ig:cache', 'json').catch(() => null);
  if (c && Date.now() - c.t < 3600e3) return c;
  let token = (await kvGet(env, 'ig:token').catch(() => null)) || env.INSTAGRAM_TOKEN;
  if (!token) return c || null;
  try {
    const meta = await kvGet(env, 'ig:tokenmeta', 'json').catch(() => null);
    if (!meta || Date.now() - meta.t > 30 * 864e5) {
      const rr = await withTimeout(fetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(token)), 6000);
      if (rr.ok) { const j = await rr.json(); if (j.access_token) { token = j.access_token; await kvPut(env, 'ig:token', token); } }
      await kvPut(env, 'ig:tokenmeta', JSON.stringify({ t: Date.now() }));
    }
    const r = await withTimeout(fetch('https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,caption&limit=12&access_token=' + encodeURIComponent(token)), 8000);
    if (!r.ok) throw new Error('ig');
    const j = await r.json();
    const items = (j.data || []).filter((x) => x.media_type === 'IMAGE' || x.media_type === 'CAROUSEL_ALBUM').slice(0, 6)
      .map((x) => ({ url: x.media_url, href: x.permalink, alt: String(x.caption || 'Zdjęcie z Instagrama').replace(/\s+/g, ' ').slice(0, 110) }));
    const out = { t: Date.now(), items };
    await kvPut(env, 'ig:cache', JSON.stringify(out));
    return out;
  } catch (e) { return c || null; }
}
export const hostOk = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && OK_HOST.test(x.hostname); } catch (e) { return false; } };
