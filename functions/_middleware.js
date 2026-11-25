import DANE from '../public/assets/js/dane.js';
import NPR from '../public/assets/js/render.js';
import { kvGet } from '../lib/serwer.js';
// SSR treści zapisanych w panelu: do statycznego HTML (zawsze zawierającego treść początkową) wstrzykujemy aktualne dane z KV,
// więc Google widzi zmiany bez JavaScriptu. Odczyt KV ma limit czasu — po przekroczeniu serwujemy HTML z wartościami początkowymi.
export async function onRequest(context) {
  const { request, env } = context;
  const res = await context.next();
  try {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/assets/')) return res;
    if (!(res.headers.get('Content-Type') || '').includes('text/html')) return res;
    const page = NPR.pageByPath(url.pathname);
    if (!page || !env.TRESCI) return res;
    let raw; try { raw = await kvGet(env, 'tresci'); } catch (e) { return res; }
    if (!raw) return res;
    const d = NPR.merge(DANE, JSON.parse(raw));
    let html = await res.text();
    html = html.replace(/<!--NP:HEAD-->[\s\S]*?<!--\/NP:HEAD-->/, () => '<!--NP:HEAD-->' + NPR.renderHead(d, page.k) + '<!--/NP:HEAD-->')
      .replace(/<!--NP:BODY-->[\s\S]*?<!--\/NP:BODY-->/, () => '<!--NP:BODY-->' + NPR.renderBody(d, page.k) + '<!--/NP:BODY-->');
    const h = new Headers(res.headers); h.set('Cache-Control', 'no-cache'); h.delete('Content-Length'); h.delete('ETag');
    return new Response(html, { status: res.status, headers: h });
  } catch (e) { return res; }
}
