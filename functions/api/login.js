import { json, blad, csrfOk, hashAktualny, sprawdzHaslo, nowaSesja, cookiesResp, limit, kvDel, sha256, ip } from '../../lib/serwer.js';
export async function onRequestPost({ request, env }) {
  try {
    if (!csrfOk(request)) return json({ blad: 'Odrzucono żądanie.' }, 403);
    let b = {}; try { b = await request.json(); } catch (e) {}
    const klucz = 'l:' + (await sha256(ip(request)));
    if (await limit(env, klucz, 5, 900)) return json({ blad: 'Zbyt wiele nieudanych prób. Spróbuj za 15 minut.' }, 429);
    const h = await hashAktualny(env);
        if (!(await sprawdzHaslo(String(b.haslo || ''), h))) return json({ blad: 'Nieprawidłowe hasło.' }, 401);
    await kvDel(env, 'rl:' + klucz);
    return cookiesResp({ ok: true }, 200, await nowaSesja(env));
  } catch (e) { return blad(e); }
}
