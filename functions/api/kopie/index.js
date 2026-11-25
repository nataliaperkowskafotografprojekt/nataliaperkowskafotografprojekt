import { json, blad, wymagajAdmina, kvGet } from '../../../lib/serwer.js';
export async function onRequestGet({ request, env }) {
  try {
    const odp = await wymagajAdmina(request, env); if (odp) return odp;
    const idx = (await kvGet(env, 'kopie', 'json')) || [];
    return json({ kopie: idx.map((k) => ({ t: k.t })) });
  } catch (e) { return blad(e); }
}
