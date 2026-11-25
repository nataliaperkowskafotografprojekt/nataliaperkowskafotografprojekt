// Lokalny serwer testowy: statyczne pliki z public/ + /api/* z functions/ + atrapa KV w pamięci. Użycie: node narzedzia/dev-serwer.mjs [port]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), pub = path.join(root, 'public'), port = Number(process.argv[2] || 8766);
const store = new Map();
const KV = { async get(k, t) { const v = store.get(k); if (v == null) return null; return t === 'json' ? JSON.parse(v) : (t === 'arrayBuffer' ? v : String(v)); }, async put(k, v) { store.set(k, v); }, async delete(k) { store.delete(k); }, async list() { return { keys: [...store.keys()].map((name) => ({ name })) }; } };
const env = { TRESCI: KV, SESSION_SECRET: 'test-secret-test-secret-test-secret' };
const mw = (await import(pathToFileURL(path.join(root, 'functions/_middleware.js')))).onRequest;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
function route(p) {
  const parts = p.replace(/^\/api\//, '').replace(/\/$/, '').split('/'); let dir = path.join(root, 'functions/api'), params = {};
  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1, cand = path.join(dir, parts[i]);
    if (last) { if (fs.existsSync(cand + '.js')) return { f: cand + '.js', params }; if (fs.existsSync(path.join(cand, 'index.js'))) return { f: path.join(cand, 'index.js'), params }; const dyn = fs.existsSync(dir) && fs.readdirSync(dir).find((n) => /^\[.+\]\.js$/.test(n)); if (dyn) { params[dyn.slice(1, -4)] = parts[i]; return { f: path.join(dir, dyn), params }; } return null; }
    if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) dir = cand; else return null;
  }
}
async function staticRes(url) {
  let p = decodeURIComponent(url.pathname), f = path.join(pub, p);
  if (!f.startsWith(pub)) return new Response('x', { status: 403 });
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) return new Response(fs.readFileSync(path.join(pub, '404.html')), { status: 404, headers: { 'Content-Type': MIME['.html'] } });
  return new Response(fs.readFileSync(f), { headers: { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' } });
}
http.createServer(async (rq, rs) => {
  try {
    const chunks = []; for await (const c of rq) chunks.push(c); const body = Buffer.concat(chunks);
    const url = new URL(rq.url, 'http://localhost:' + port), init = { method: rq.method, headers: { ...rq.headers, 'cf-connecting-ip': '1.2.3.4' } };
    if (!['GET', 'HEAD'].includes(rq.method)) init.body = body;
    const request = new Request(url, init); let res;
    if (url.pathname.startsWith('/api/')) {
      const r = route(url.pathname);
      if (!r) res = new Response('{}', { status: 404 });
      else { const m = await import(pathToFileURL(r.f)); const h = m['onRequest' + rq.method[0] + rq.method.slice(1).toLowerCase()] || m.onRequest; res = h ? await h({ request, env, params: r.params, next: () => staticRes(url) }) : new Response('{}', { status: 405 }); }
    } else res = await mw({ request, env, next: () => staticRes(url) });
    const hd = {}; res.headers.forEach((v, k) => { hd[k] = v; }); const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : []; if (sc.length) hd['set-cookie'] = sc;
    rs.writeHead(res.status, hd); rs.end(Buffer.from(await res.arrayBuffer()));
  } catch (e) { console.error(e); rs.writeHead(500); rs.end(String(e)); }
}).listen(port, () => console.log('dev :' + port));
