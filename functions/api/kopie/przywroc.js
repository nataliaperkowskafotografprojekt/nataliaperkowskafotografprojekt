import { json, blad, wymagajAdmina, kvGet, zapiszZKopia } from '../../../lib/serwer.js';
export async function onRequestPost({ request, env }) {
  try {
    const odp = await wymagajAdmina(request, env); if (odp) return odp;
    let b = {}; try { b = await request.json(); } catch (e) {}
    const idx = (await kvGet(env, 'kopie', 'json')) || [];
    const k = idx.filter((x) => x.t === b.t)[0];
    if (!k) return json({ blad: 'Nie znaleziono takiej kopii.' }, 404);
    await zapiszZKopia(env, k.dane);
    return json({ ok: true, dane: JSON.parse(k.dane) });
  } catch (e) { return blad(e); }
}
