import { json, blad, wymagajAdmina, hashAktualny, sprawdzHaslo, hashuj, kvPut, kvGet, nowaSesja, cookiesResp, limit, sha256, ip } from '../../lib/serwer.js';
// Zmiana hasła: obecne + nowe (min. 8 znaków). Zapis nowego hasha w KV; epoka sesji +1 → inne sesje wygasają.
export async function onRequestPost({ request, env }) {
  try {
    const odp = await wymagajAdmina(request, env); if (odp) return odp;
    if (await limit(env, 'h:' + (await sha256(ip(request))), 8, 900)) return json({ blad: 'Zbyt wiele prób. Spróbuj za 15 minut.' }, 429);
    let b = {}; try { b = await request.json(); } catch (e) {}
    const stare = String(b.stare || ''), nowe = String(b.nowe || '');
    if (nowe.length < 8) return json({ blad: 'Nowe hasło musi mieć co najmniej 8 znaków.' }, 400);
    if (!(await sprawdzHaslo(stare, await hashAktualny(env)))) return json({ blad: 'Obecne hasło jest nieprawidłowe.' }, 403);
    await kvPut(env, 'auth:hash', await hashuj(nowe));
    await kvPut(env, 'auth:epoch', String(parseInt((await kvGet(env, 'auth:epoch')) || '0', 10) + 1));
    return cookiesResp({ ok: true }, 200, await nowaSesja(env));
  } catch (e) { return blad(e); }
}
