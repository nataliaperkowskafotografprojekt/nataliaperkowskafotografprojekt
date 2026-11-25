import { json, blad, kvGet, wymagajAdmina, walidujTresci, zapiszZKopia } from '../../lib/serwer.js';
// GET — publiczny odczyt zapisanych treści; PUT — zapis (tylko po zalogowaniu, z nagłówkiem X-CMS)
export async function onRequestGet({ env }) {
  try { const v = await kvGet(env, 'tresci'); return new Response(v || '{}', { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' } }); }
  catch (e) { return blad(e); }
}
export async function onRequestPut({ request, env }) {
  try {
    const odp = await wymagajAdmina(request, env); if (odp) return odp;
    let d; try { d = await request.json(); } catch (e) { return json({ blad: 'Nieprawidłowe dane.' }, 400); }
    const b = walidujTresci(d); if (b) return json({ blad: b }, 400);
    await zapiszZKopia(env, d);
    return json({ ok: true, zapisano: new Date().toISOString() });
  } catch (e) { return blad(e); }
}
