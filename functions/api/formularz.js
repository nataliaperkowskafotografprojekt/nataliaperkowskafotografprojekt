import { json, kvGet, limit, sha256, ip, withTimeout, csrfOk } from '../../lib/serwer.js';
import DANE from '../../public/assets/js/dane.js';
// Formularz „poproś o termin”. Walidacja po stronie serwera, antyspam bez śledzenia: honeypot, minimalny czas, limit wysyłek, opcjonalnie Cloudflare Turnstile.
// Dane formularza NIE trafiają do logów ani do KV — tylko do wiadomości e-mail.
const TY = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com' };
const s = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
export async function onRequestPost({ request, env }) {
  try {
    if (!csrfOk(request)) return json({ blad: 'Odrzucono żądanie.' }, 403);
    let b; try { b = await request.json(); } catch (e) { return json({ blad: 'Nieprawidłowe dane.' }, 400); }
    if (b.www) return json({ ok: true }); // honeypot — udajemy sukces
    if (Number(b.t) < 2500) return json({ blad: 'Formularz wysłano zbyt szybko. Spróbuj ponownie.' }, 400);
    const d = { imie: s(b.imie, 80), email: s(b.email, 120), tel: s(b.tel, 24), temat: s(b.temat, 80), termin: s(b.termin, 80), wiadomosc: s(b.wiadomosc, 2000) };
    if (d.imie.length < 2) return json({ blad: 'Podaj imię.' }, 400);
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/.test(d.email) || TY[d.email.split('@')[1].toLowerCase()]) return json({ blad: 'Podaj poprawny adres e-mail.' }, 400);
    const dg = d.tel.replace(/\D/g, '');
    if (d.tel && (dg.length < 9 || dg.length > 15 || (!/^\+/.test(d.tel) && dg.length !== 9))) return json({ blad: 'Podaj poprawny numer telefonu.' }, 400);
    if (d.wiadomosc.length < 5) return json({ blad: 'Napisz kilka słów wiadomości.' }, 400);
    if (env.TURNSTILE_SECRET) {
      const fd = new FormData(); fd.append('secret', env.TURNSTILE_SECRET); fd.append('response', String(b.ts || '')); fd.append('remoteip', ip(request));
      const r = await withTimeout(fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd }), 6000).then((x) => x.json()).catch(() => ({}));
      if (!r.success) return json({ blad: 'Nie udało się potwierdzić, że nie jesteś robotem. Spróbuj ponownie.' }, 400);
    }
    if (await limit(env, 'f:' + (await sha256(ip(request))), 5, 3600)) return json({ blad: 'Wysłano zbyt wiele wiadomości. Spróbuj później lub zadzwoń.' }, 429);
    if (!env.RESEND_API_KEY) return json({ blad: 'Formularz jest chwilowo niedostępny. Napisz e-mail lub zadzwoń.' }, 503);
    let saved = {}; try { saved = JSON.parse((await kvGet(env, 'tresci')) || '{}'); } catch (e) {}
    const odbiorca = env.MAIL_DO || (saved.firma && saved.firma.email) || DANE.firma.email;
    const tekst = `Nowe zapytanie ze strony\n\nImię: ${d.imie}\nE-mail: ${d.email}\nTelefon: ${d.tel || '—'}\nRodzaj sesji: ${d.temat || '—'}\nPreferowany termin: ${d.termin || '—'}\n\nWiadomość:\n${d.wiadomosc}\n`;
    const r = await withTimeout(fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_OD || 'Formularz strony <onboarding@resend.dev>', to: [odbiorca], reply_to: d.email, subject: 'Zapytanie ze strony: ' + d.imie, text: tekst })
    }), 9000);
    if (!r.ok) return json({ blad: 'Nie udało się wysłać wiadomości. Spróbuj ponownie lub zadzwoń.' }, 502);
    return json({ ok: true });
  } catch (e) { return json({ blad: 'Serwer chwilowo nie odpowiada — spróbuj ponownie lub zadzwoń.' }, 503); }
}
