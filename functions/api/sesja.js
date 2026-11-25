import { json, sesjaOk } from '../../lib/serwer.js';
export async function onRequestGet({ request, env }) {
  return (await sesjaOk(request, env)) ? json({ ok: true }) : json({ ok: false }, 401);
}
