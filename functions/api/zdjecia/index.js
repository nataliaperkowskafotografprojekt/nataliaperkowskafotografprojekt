import { json, blad, wymagajAdmina, kv, withTimeout, b64 } from '../../../lib/serwer.js';
// POST /api/zdjecia — zdjęcie zmniejszone w przeglądarce (do ok. 1600 px), zapis w KV
export async function onRequestPost({ request, env }) {
  try {
    const odp = await wymagajAdmina(request, env); if (odp) return odp;
    const ct = (request.headers.get('Content-Type') || '').split(';')[0];
    if (!/^image\/(webp|jpeg|png)$/.test(ct)) return json({ blad: 'Dozwolone formaty: WebP, JPEG, PNG.' }, 415);
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 3 * 1024 * 1024) return json({ blad: 'Plik jest za duży (limit 3 MB po zmniejszeniu).' }, 413);
    const id = b64(crypto.getRandomValues(new Uint8Array(9))).replace(/[+/=]/g, 'x');
    await withTimeout(kv(env).put('img:' + id, buf, { metadata: { ct } }), 8000, 'kv-timeout');
    return json({ ok: true, url: '/api/zdjecia/' + id });
  } catch (e) { return blad(e); }
}
