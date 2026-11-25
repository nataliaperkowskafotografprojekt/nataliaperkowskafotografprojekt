// Buduje statyczne pliki HTML (treść widoczna dla Google bez JavaScriptu) z danych początkowych: node narzedzia/zbuduj.mjs
import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), PUB = join(ROOT, 'public');
const DANE = require(join(PUB, 'assets/js/dane.js')), R = require(join(PUB, 'assets/js/render.js'));
const tpl = readFileSync(join(ROOT, 'szablony/strona.html'), 'utf8'), crit = readFileSync(join(ROOT, 'szablony/krytyczny.css'), 'utf8').trim();
const today = new Date().toISOString().slice(0, 10);
const w = (rel, txt) => { const p = join(PUB, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, txt); };

function preload(body) {
  const m = body.match(/<img class="np-img" src="([^"]+)"(?: srcset="([^"]+)")?/);
  if (!m) return '';
  return '<link rel="preload" as="image" href="' + m[1] + '"' + (m[2] ? ' imagesrcset="' + m[2] + '" imagesizes="100vw"' : '') + ' fetchpriority="high">\n';
}
R.PAGES.forEach((p) => {
  const body = R.renderBody(DANE, p.k);
  const html = tpl.replace('{{HEAD}}', () => R.renderHead(DANE, p.k)).replace('{{BODY}}', () => body).replace('{{KEY}}', p.k)
    .replace('{{KRYTYCZNY}}', () => crit).replace('{{PRELOAD_IMG}}', () => preload(body));
  w(p.file, html);
});
// 404 — z linkiem do strony głównej
{
  const body = R.renderBody(DANE, 'polityka').replace(/<main id="tresc">[\s\S]*<\/main>/, '<main id="tresc"><section class="np-sec np-t-ciemny np-hero" aria-labelledby="b404"><div class="np-bg" style="background:#F4F1EC"></div><div class="np-in"><div class="np-narrow"><h1 id="b404" class="np-h1">Nie znaleziono strony</h1><p class="np-lead">Takiej strony nie ma lub została przeniesiona.</p><div class="np-actions"><a class="np-btn" href="/">Wróć na stronę główną</a><a class="np-btn np-btn-line" href="/kontakt/">Kontakt</a></div></div></div></section></main>');
  const head = '<title>Nie znaleziono strony | ' + DANE.firma.nazwa + '</title>\n<meta name="robots" content="noindex">\n<meta name="np:fbpx" content="' + R.pixelId(DANE) + '">\n';
  const html = tpl.replace(/<!--NP:HEAD-->[\s\S]*?<!--\/NP:HEAD-->/, head).replace(/<!--NP:BODY-->[\s\S]*?<!--\/NP:BODY-->/, body).replace('{{KEY}}', '404').replace('{{KRYTYCZNY}}', () => crit).replace('{{PRELOAD_IMG}}', '');
  w('404.html', html);
}
w('assets/css/krytyczny.css', crit + '\n'); // używany przez podgląd w panelu
w('sitemap.xml', R.sitemap(DANE, undefined, today));
w('robots.txt', R.robots(DANE));
w('site.webmanifest', JSON.stringify({ name: DANE.firma.nazwa, short_name: 'N. Perkowska', lang: 'pl', start_url: '/', display: 'standalone', background_color: '#F4F1EC', theme_color: '#F4F1EC',
  icons: [{ src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2));
w('_routes.json', JSON.stringify({ version: 1, include: ['/*'], exclude: ['/assets/*', '/favicon*', '/apple-touch-icon.png', '/robots.txt', '/sitemap.xml', '/site.webmanifest'] }, null, 2));
w('_headers', `/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; script-src 'self' https://connect.facebook.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.facebook.com https://*.facebook.net; font-src 'self'; connect-src 'self' https://*.facebook.com https://*.facebook.net https://challenges.cloudflare.com; frame-src 'self' https://www.google.com https://challenges.cloudflare.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/assets/img/*
  Cache-Control: public, max-age=2592000
/assets/js/*
  Cache-Control: public, max-age=3600
/assets/css/*
  Cache-Control: public, max-age=3600
`);
console.log('Zbudowano', R.PAGES.length, 'stron + 404, sitemap.xml, robots.txt, manifest, _headers, _routes.json');
