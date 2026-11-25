import { json, csrfOk, cookie, kvDel, sha256, wylogujCookies, cookiesResp } from '../../lib/serwer.js';
export async function onRequestPost({ request, env }) {
  if (!csrfOk(request)) return json({ blad: 'Odrzucono żądanie.' }, 403);
  try { const [tok] = cookie(request, 'np_sess').split('.'); if (tok) await kvDel(env, 'sess:' + (await sha256(tok))); } catch (e) {}
  return cookiesResp({ ok: true }, 200, wylogujCookies());
}
