// Wspólne funkcje serwerowe (Cloudflare Pages Functions): hasła PBKDF2, sesje, CSRF, limity, KV z limitem czasu.
// UWAGA (niezawodność): brak współdzielonych między żądaniami obietnic w zmiennych modułu — każde żądanie czeka tylko na własne zapytania.
const enc = new TextEncoder();
export const SESJA_S = 8 * 3600;
export const ITER = 100000;
const KV_MS = 5000;

export function b64(buf) { let s = ''; new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b))); return btoa(s); }
export function unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
const b64u = (buf) => b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function withTimeout(p, ms, msg) {
  let t;
  const to = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg || 'timeout')), ms); });
  return Promise.race([p, to]).finally(() => clearTimeout(t));
}
export const kv = (env) => { if (!env || !env.TRESCI) { const e = new Error('brak KV'); e.kod = 'KV'; throw e; } return env.TRESCI; };
export const kvGet = (env, k, type) => withTimeout(kv(env).get(k, type || 'text'), KV_MS, 'kv-timeout');
export const kvPut = (env, k, v, opt) => withTimeout(kv(env).put(k, v, opt), KV_MS, 'kv-timeout');
export const kvDel = (env, k) => withTimeout(kv(env).delete(k), KV_MS, 'kv-timeout');

export function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}
export function blad(e) {
  if (e && (e.message === 'kv-timeout' || e.kod === 'KV')) {
    return json({ blad: e.kod === 'KV' ? 'Magazyn danych (KV) nie jest podłączony — sprawdź wdrożenie.' : 'Serwer chwilowo nie odpowiada — spróbuj ponownie.' }, 503);
  }
  return json({ blad: 'Wystąpił błąd serwera. Spróbuj ponownie.' }, 500);
}

export async function pbkdf2(pw, salt, iter = ITER) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
export async function hashuj(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await pbkdf2(pw, salt))}`;
}
function rowne(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; }
export async function sprawdzHaslo(pw, stored) {
  const p = String(stored || '').split('$');
  if (p.length !== 4 || p[0] !== 'pbkdf2') return false;
  const h = await pbkdf2(pw, unb64(p[2]), parseInt(p[1], 10) || ITER);
  return rowne(h, unb64(p[3]));
}
export async function hashAktualny(env) {
  const k = await kvGet(env, 'auth:hash');
  return k || env.ADMIN_PASSWORD_HASH || '';
}
export async function sha256(s) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))).map((b) => b.toString(16).padStart(2, '0')).join(''); }
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
export const ip = (req) => req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'lokalnie';
export function cookie(req, name) {
  const m = (req.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

// ---- sesje ----
export async function epoka(env) { return (await kvGet(env, 'auth:epoch')) || '0'; }
export async function nowaSesja(env) {
  if (!env.SESSION_SECRET) { const e = new Error('brak SESSION_SECRET'); e.kod = 'CFG'; throw e; }
  const tok = b64u(crypto.getRandomValues(new Uint8Array(32)));
  await kvPut(env, 'sess:' + (await sha256(tok)), JSON.stringify({ e: await epoka(env), t: Date.now() }), { expirationTtl: SESJA_S });
  const sig = await hmac(env.SESSION_SECRET, tok);
  return [
    `np_sess=${tok}.${sig}; Path=/; Max-Age=${SESJA_S}; HttpOnly; Secure; SameSite=Strict`,
    `np_admin=1; Path=/; Max-Age=${SESJA_S}; Secure; SameSite=Strict` // znacznik dla przycisku „Panel” (bez uprawnień)
  ];
}
export async function sesjaOk(req, env) {
  try {
    const c = cookie(req, 'np_sess'); if (!c || !env.SESSION_SECRET) return false;
    const [tok, sig] = c.split('.'); if (!tok || !sig) return false;
    const exp = await hmac(env.SESSION_SECRET, tok);
    if (!rowne(enc.encode(exp), enc.encode(sig))) return false;
    const v = await kvGet(env, 'sess:' + (await sha256(tok)), 'json');
    return !!v && v.e === (await epoka(env));
  } catch (e) { return false; }
}
export const wylogujCookies = () => ['np_sess=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict', 'np_admin=; Path=/; Max-Age=0; Secure; SameSite=Strict'];
export function cookiesResp(body, status, cookies) {
  const r = json(body, status); cookies.forEach((c) => r.headers.append('Set-Cookie', c)); return r;
}
// ochrona CSRF: nagłówek X-CMS + zgodny Origin
export function csrfOk(req) {
  if (req.headers.get('X-CMS') !== '1') return false;
  const o = req.headers.get('Origin');
  return !o || o === new URL(req.url).origin;
}
// wymagane do zapisu: sesja + CSRF; zwraca Response z błędem albo null
export async function wymagajAdmina(req, env) {
  if (!csrfOk(req)) return json({ blad: 'Odrzucono żądanie (CSRF).' }, 403);
  if (!(await sesjaOk(req, env))) return json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);
  return null;
}
// limit prób (okno w sekundach); zwraca true, gdy przekroczono
export async function limit(env, klucz, max, okno) {
  const k = 'rl:' + klucz; const n = parseInt((await kvGet(env, k)) || '0', 10);
  if (n >= max) return true;
  await kvPut(env, k, String(n + 1), { expirationTtl: Math.max(60, okno) });
  return false;
}

// ---- walidacja zapisu treści ----
export function walidujTresci(d) {
  if (!d || typeof d !== 'object' || d._cms !== 'np-fotografia' || typeof d.strony !== 'object' || typeof d.firma !== 'object') return 'To nie jest kopia z tego panelu.';
  const px = (d.integracje || {}).fbPixelId; if (px && !/^\d{15,16}$/.test(String(px))) return 'ID Piksela Facebooka musi mieć 15–16 cyfr.';
  if (d.domena && !/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(d.domena)) return 'Adres domeny musi mieć postać https://twojadomena.pl.';
  const s = JSON.stringify(d); if (s.length > 900000) return 'Dane są zbyt duże.';
  return '';
}
export async function zapiszZKopia(env, nowe) {
  const stare = await kvGet(env, 'tresci');
  if (stare) {
    const idx = (await kvGet(env, 'kopie', 'json')) || [];
    idx.unshift({ t: new Date().toISOString(), dane: stare });
    await kvPut(env, 'kopie', JSON.stringify(idx.slice(0, 10)));
  }
  await kvPut(env, 'tresci', typeof nowe === 'string' ? nowe : JSON.stringify(nowe));
}
