import { json, sesjaOk, haslaStartowe } from '../../lib/serwer.js';
export async function onRequestGet({ request, env }) {
  if (!(await sesjaOk(request, env))) return json({ ok: false }, 401);
  let startowe = false; try { startowe = await haslaStartowe(env); } catch (e) {}
  return json({ ok: true, startowe });
}
