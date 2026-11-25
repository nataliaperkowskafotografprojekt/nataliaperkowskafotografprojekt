import { json } from '../../../lib/serwer.js';
import { pobierz } from '../../../lib/instagram.js';
export async function onRequestGet({ env }) {
  try {
    const c = await pobierz(env);
    if (!c || !c.items.length) return json({ items: [] }, 200, { 'Cache-Control': 'public, max-age=300' });
    return json({ items: c.items.map((x, i) => ({ src: '/api/instagram/' + i, href: x.href, alt: x.alt })) }, 200, { 'Cache-Control': 'public, max-age=600' });
  } catch (e) { return json({ items: [] }, 200); }
}
