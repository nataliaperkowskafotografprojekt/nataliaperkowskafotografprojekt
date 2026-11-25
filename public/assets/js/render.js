/* RENDEROWANIE strony z danych (state). Jeden plik dla: builda (node), Cloudflare Functions (SSR) i przeglądarki (panel, podgląd).
   Zero zależności od DOM — zwraca teksty HTML. UMD: window.NPR. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NPR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PAGES = [
    { k: 'home', url: '/', file: 'index.html', crumb: 'Strona główna' },
    { k: 'o-mnie', url: '/o-mnie/', file: 'o-mnie/index.html', crumb: 'O mnie' },
    { k: 'oferta', url: '/oferta/', file: 'oferta/index.html', crumb: 'Oferta' },
    { k: 'cennik', url: '/cennik/', file: 'cennik/index.html', crumb: 'Cennik' },
    { k: 'portfolio', url: '/portfolio/', file: 'portfolio/index.html', crumb: 'Portfolio' },
    { k: 'opinie', url: '/opinie/', file: 'opinie/index.html', crumb: 'Opinie' },
    { k: 'faq', url: '/faq/', file: 'faq/index.html', crumb: 'FAQ' },
    { k: 'aktualnosci', url: '/aktualnosci/', file: 'aktualnosci/index.html', crumb: 'Aktualności' },
    { k: 'bony', url: '/bony/', file: 'bony/index.html', crumb: 'Bony' },
    { k: 'regulamin', url: '/regulamin/', file: 'regulamin/index.html', crumb: 'Regulamin' },
    { k: 'kontakt', url: '/kontakt/', file: 'kontakt/index.html', crumb: 'Kontakt' },
    { k: 'polityka', url: '/polityka-prywatnosci/', file: 'polityka-prywatnosci/index.html', crumb: 'Polityka prywatności' }
  ];

  /* ---------- narzędzia ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var TODO_RE = /\[((?:DO |DANE |LOGO |HASŁO |LINK )[^\]]*)\]/g;
  function todo(h) { return h.replace(TODO_RE, '<mark class="np-todo">[$1]</mark>'); }
  function clean(s) { return String(s == null ? '' : s).replace(TODO_RE, '').replace(/\s{2,}/g, ' ').trim(); }
  function inline(h) {
    return todo(h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em class="np-it">$1</em>'));
  }
  // *kursywa* (kolor akcentu), **pogrubienie**, pusta linia = akapit, „## ” = śródtytuł
  function fmt(s) {
    return esc(s).split(/\n{2,}/).map(function (b) {
      return b.split('\n').map(function (l) {
        return /^## /.test(l) ? '<h3>' + inline(l.slice(3)) + '</h3>' : '<p>' + inline(l) + '</p>';
      }).join('');
    }).join('');
  }
  function plain(s) { return todo(esc(s)); }
  function safeUrl(u) {
    u = String(u || '').trim();
    return /^(https?:\/\/|\/(?!\/)|mailto:|tel:|#)/i.test(u) ? u : '';
  }
  function safeColor(c) { return /^#[0-9a-fA-F]{3,8}$/.test(c || '') ? c : '#F4F1EC'; }
  function clamp(n, a, b) { n = Number(n); if (isNaN(n)) n = 0; return Math.max(a, Math.min(b, n)); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function get(o, path) { return String(path).split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function set(o, path, v) {
    var p = String(path).split('.'), l = p.pop();
    p.reduce(function (a, k) { if (a[k] == null || typeof a[k] !== 'object') a[k] = {}; return a[k]; }, o)[l] = v;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(def, saved) {
    if (saved === undefined || saved === null) return clone(def);
    if (Array.isArray(def) || Array.isArray(saved)) return clone(saved);
    if (def && typeof def === 'object' && saved && typeof saved === 'object') {
      var out = {};
      Object.keys(def).forEach(function (k) { out[k] = merge(def[k], saved[k]); });
      Object.keys(saved).forEach(function (k) { if (!(k in def)) out[k] = clone(saved[k]); });
      return out;
    }
    return saved;
  }
  function skrot(t) {
    t = String(t || '').replace(/\*\*?/g, '').replace(/\n+/g, ' ');
    var m = t.match(/^(.{40,170}?[.!?])(\s|$)/);
    return m ? m[1] : (t.length > 150 ? t.slice(0, 147).replace(/\s+\S*$/, '') + '…' : t);
  }
  function pageByKey(k) { return PAGES.filter(function (p) { return p.k === k; })[0]; }
  function pageByPath(path) {
    path = String(path || '/').replace(/index\.html$/, '').replace(/\/?$/, '/');
    if (path === '//') path = '/';
    return PAGES.filter(function (p) { return p.url === path; })[0];
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    var mn = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
    return Number(m[3]) + ' ' + mn[Number(m[2]) - 1] + ' ' + m[1];
  }

  /* ---------- stany treści czasowych ---------- */
  function status(w, now) {
    now = now || today();
    if (w.wstrzymaj) return 'wstrzymana';
    if (w.od && w.od > now) return 'zaplanowana';
    if (w['do'] && w['do'] < now) return 'zakonczona';
    return 'aktywna';
  }
  function aktywneWpisy(d, now) {
    return (d.strony.aktualnosci.wpisy || []).filter(function (w) { return status(w, now) === 'aktywna'; })
      .sort(function (a, b) { return String(b.data || b.od || '').localeCompare(String(a.data || a.od || '')); });
  }
  function opinieWidoczne(d) { return (d.strony.opinie.lista || []).filter(function (o) { return o.widoczna !== false && o.tresc; }); }
  function pageVisible(d, k, now) {
    if (k === 'home' || k === 'polityka') return true;
    var m = (d.menu || []).filter(function (x) { return x.k === k; })[0];
    if (m && m.on === false) return false;
    if (k === 'opinie') return opinieWidoczne(d).length > 0;
    if (k === 'aktualnosci') return aktywneWpisy(d, now).length > 0;
    return true;
  }
  function menuItems(d, now) {
    return (d.menu || []).filter(function (m) { return m.on !== false && pageByKey(m.k) && pageVisible(d, m.k, now); });
  }
  function pixelId(d) {
    var i = d.integracje || {};
    return i.fbPixelWlaczony !== false && /^\d{15,16}$/.test(String(i.fbPixelId || '').trim()) ? String(i.fbPixelId).trim() : '';
  }

  /* ---------- obrazy i tło ---------- */
  function imgTag(src, alt, o) {
    o = o || {};
    src = safeUrl(src);
    if (!src) return '';
    var srcset = /^\/assets\/img\/.+\.webp$/.test(src) && !/-800\.webp$/.test(src)
      ? ' srcset="' + esc(src.replace('.webp', '-800.webp')) + ' 800w, ' + esc(src) + ' 1600w" sizes="' + (o.sizes || '100vw') + '"' : '';
    return '<img' + (o.cls ? ' class="' + o.cls + '"' : '') + ' src="' + esc(src) + '"' + srcset + ' width="1600" height="1000" alt="' + esc(alt || '') + '"' +
      (o.first ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') + '>';
  }
  function bgHtml(bg, first) {
    bg = bg || {};
    var src = bg.typ === 'wideo' ? (bg.plakat || bg.img) : bg.img;
    if (bg.typ === 'kolor' || !safeUrl(src)) return '<div class="np-bg" style="background:' + safeColor(bg.kolor) + '"></div>';
    var h = '<div class="np-bg">' + imgTag(src, bg.alt, { first: first, cls: 'np-img' });
    if (bg.typ === 'wideo' && safeUrl(bg.wideo)) {
      h += '<video class="np-vid" muted loop playsinline preload="none" data-src="' + esc(safeUrl(bg.wideo)) + '" poster="' + esc(safeUrl(src)) + '" aria-hidden="true" tabindex="-1"></video>' +
        '<button type="button" class="np-vpause" hidden aria-label="Zatrzymaj wideo w tle">❚❚</button>';
    }
    return h + '<div class="np-ov" style="opacity:' + clamp(bg.ov, 0, 80) / 100 + '"></div></div>';
  }
  function icon(n) {
    var p = {
      ig: '<path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-1.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>',
      fb: '<path d="M14 8V6.5c0-.7.3-1 1-1h2V2h-3a4 4 0 0 0-4 4v2H7v3.5h3V22h4v-10.5h3L17.5 8z"/>',
      lock: '<path d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h8V8a4 4 0 1 0-8 0z"/>'
    };
    return '<svg class="np-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="currentColor">' + p[n] + '</svg>';
  }

  /* ---------- dane strukturalne ---------- */
  function abs(d, url) { return (d.domena || '').replace(/\/$/, '') + url; }
  function jsonld(d, k) {
    var f = d.firma, pg = pageByKey(k), s = d.strony[k === 'polityka' ? 'polityka' : k], seo = s.seo || {};
    var base = (d.domena || '').replace(/\/$/, '');
    var same = [f.ig, f.fb, f.gbp].filter(function (u) { return /^https?:/.test(u || ''); });
    var biz = {
      '@type': 'ProfessionalService', '@id': base + '/#firma', name: f.nazwa, url: base + '/',
      description: f.opisKrotki, telephone: f.tel, email: f.email,
      image: base + '/assets/img/og-image.jpg', logo: base + (f.logoPelne || '/assets/img/logo-natalia-perkowska-oryginal.jpg'),
      address: { '@type': 'PostalAddress', addressLocality: f.miasto, addressRegion: f.region, addressCountry: 'PL' },
      areaServed: (f.miejscowosci || []).map(function (c) { return { '@type': 'City', name: c }; }),
      founder: { '@type': 'Person', name: f.osoba, jobTitle: f.specjalizacja },
      sameAs: same, knowsAbout: ['sesje zdjęciowe', 'fotografia lifestylowa', 'sesje rodzinne', 'sesje kobiece']
    };
    var g = [biz,
      { '@type': 'WebSite', '@id': base + '/#www', url: base + '/', name: f.nazwa, inLanguage: 'pl-PL', publisher: { '@id': base + '/#firma' } },
      { '@type': 'WebPage', '@id': base + pg.url + '#strona', url: base + pg.url, name: clean(seo.title), description: clean(seo.desc), inLanguage: 'pl-PL', isPartOf: { '@id': base + '/#www' }, about: { '@id': base + '/#firma' } }];
    if (k !== 'home') {
      g.push({ '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Strona główna', item: base + '/' },
        { '@type': 'ListItem', position: 2, name: pg.crumb, item: base + pg.url }] });
    }
    if (k === 'faq') {
      var qa = (d.strony.faq.pytania || []).filter(function (x) { return x.widoczna !== false && x.ok && x.q && x.a && clean(x.a) === String(x.a).trim(); });
      if (qa.length) g.push({ '@type': 'FAQPage', mainEntity: qa.map(function (x) { return { '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } }; }) });
    }
    // celowo bez ocen, liczby opinii i recenzji (zasada: tylko prawdziwe dane)
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c');
  }

  /* ---------- HEAD ---------- */
  function renderHead(d, k, now) {
    var pg = pageByKey(k), seo = d.strony[k].seo, f = d.firma;
    var url = abs(d, pg.url), img = abs(d, '/assets/img/og-image.jpg'), noidx = !pageVisible(d, k, now);
    var px = pixelId(d), i = d.integracje || {};
    var h = '<title>' + esc(clean(seo.title)) + '</title>\n' +
      '<meta name="description" content="' + esc(clean(seo.desc)) + '">\n' +
      '<meta name="robots" content="' + (noidx ? 'noindex,follow' : 'index,follow,max-image-preview:large') + '">\n' +
      '<link rel="canonical" href="' + esc(url) + '">\n' +
      '<meta property="og:type" content="' + (k === 'home' ? 'website' : 'article') + '">\n' +
      '<meta property="og:locale" content="pl_PL">\n<meta property="og:site_name" content="' + esc(f.nazwa) + '">\n' +
      '<meta property="og:title" content="' + esc(clean(seo.title)) + '">\n<meta property="og:description" content="' + esc(clean(seo.desc)) + '">\n' +
      '<meta property="og:url" content="' + esc(url) + '">\n<meta property="og:image" content="' + esc(img) + '">\n' +
      '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">\n' +
      '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(clean(seo.title)) + '">\n' +
      '<meta name="twitter:description" content="' + esc(clean(seo.desc)) + '">\n<meta name="twitter:image" content="' + esc(img) + '">\n' +
      '<meta name="np:fbpx" content="' + esc(px) + '">\n' +
      ((d.wyglad || {}).animacje === false ? '<meta name="np:anim" content="0">\n' : '') +
      (/^[0-9A-Za-z_-]{10,60}$/.test(i.turnstileSiteKey || '') ? '<meta name="np:ts" content="' + esc(i.turnstileSiteKey) + '">\n' : '') +
      (/^[0-9A-Za-z]{10,60}$/.test(i.fbWeryfikacjaDomeny || '') ? '<meta name="facebook-domain-verification" content="' + esc(i.fbWeryfikacjaDomeny) + '">\n' : '') +
      '<script type="application/ld+json" id="np-ld">' + jsonld(d, k) + '</script>\n';
    return h;
  }
  function headPatch(d, k, now) {
    var seo = d.strony[k].seo;
    return { title: clean(seo.title), desc: clean(seo.desc), ld: jsonld(d, k), px: pixelId(d), noindex: !pageVisible(d, k, now) };
  }

  /* ---------- BODY ---------- */
  function renderBody(d, k, opt) {
    opt = opt || {};
    var prev = !!opt.preview, now = opt.now, f = d.firma, S = d.strony, P = S[k];
    var secs = [], dlgs = [], uid = 0, igOn = (d.integracje || {}).instagramWlaczony !== false;
    function fa(p) { return prev ? ' data-f="' + p + '"' : ''; }
    function rv(i) { return ' data-rv style="--d:' + ((i || 0) * 0.08).toFixed(2) + 's"'; }
    function sec(id, label, bg, inner, cls, first) {
      secs.push({ id: id, label: label });
      return '<section id="' + id + '" class="np-sec np-t-' + (bg && bg.txt === 'jasny' ? 'jasny' : 'ciemny') + (cls ? ' ' + cls : '') + '" aria-labelledby="' + id + '-h">' +
        bgHtml(bg, first) + (first ? '<div class="np-grad" aria-hidden="true"></div>' : '') + '<div class="np-in">' + inner + '</div></section>';
    }
    function h(level, id, text, path, cls, extra) {
      return '<h' + level + ' id="' + id + '-h"' + (cls ? ' class="' + cls + '"' : '') + fa(path) + (extra || '') + '>' + plain(text) + '</h' + level + '>';
    }
    function btn(href, text, cls, extra) { return '<a class="np-btn ' + (cls || '') + '" href="' + esc(safeUrl(href) || '#') + '"' + (extra || '') + '>' + plain(text) + '</a>'; }
    function dlg(title, html) {
      var id = 'dlg-' + (++uid);
      dlgs.push('<dialog id="' + id + '" class="np-dlg" aria-labelledby="' + id + '-h"><div class="np-dlg-b"><button type="button" class="np-dlg-x" data-close aria-label="Zamknij okno">×</button>' +
        '<h2 id="' + id + '-h">' + plain(title) + '</h2><div class="np-prose">' + html + '</div></div></dialog>');
      return id;
    }
    var temat = function (t) { return '/kontakt/?temat=' + encodeURIComponent(t) + '#formularz'; };
    var out = '';

    /* ----- strony ----- */
    if (k === 'home') {
      var H = P.hero, first = '<div class="np-hero-in">' +
        '<p class="np-eyebrow"' + fa('strony.home.hero.nad') + '>' + plain(H.nad) + '</p>' +
        h(1, 'start', H.h1, 'strony.home.hero.h1', 'np-h1') +
        '<p class="np-lead"' + fa('strony.home.hero.haslo') + '>' + plain(H.haslo) + '</p>' +
        btn('/kontakt/#formularz', H.btn, '', fa('strony.home.hero.btn')) + '</div>';
      out += sec('start', 'Start', H.bg, first, 'np-hero', true);
      var I = P.intro, did = dlg(I.h2, fmt(I.wiecej));
      out += sec('o-mnie', 'O mnie', I.bg,
        '<div class="np-narrow">' + h(2, 'o-mnie', I.h2, 'strony.home.intro.h2', 'np-h2" data-rv="1') + '<p class="np-lead"' + rv(1) + fa('strony.home.intro.tekst') + '>' + plain(I.tekst) + '</p>' +
        '<div class="np-actions"' + rv(2) + '><button type="button" class="np-btn np-btn-line" data-open="' + did + '">Czytaj więcej</button>' + btn('/o-mnie/', I.btn) + '</div></div>');
      var R = P.rodzaje, tiles = (S.oferta.kategorie || []).filter(function (c) { return c.widoczna !== false; }).map(function (c, i) {
        return '<a class="np-tile" href="/oferta/#' + esc(c.id) + '"' + rv(i + 1) + '>' + imgTag(c.img, c.alt, { sizes: '(max-width:700px) 100vw, 25vw', cls: 'np-tile-img' }) +
          '<span class="np-tile-t"><span class="np-h3">' + plain(c.nazwa) + '</span></span></a>';
      }).join('');
      out += sec('sesje', 'Rodzaje sesji', R.bg, '<div class="np-wide">' + h(2, 'sesje', R.h2, 'strony.home.rodzaje.h2', 'np-h2') +
        '<div class="np-tiles">' + tiles + '</div><div class="np-actions">' + btn('/oferta/', R.btn, 'np-btn-line') + '</div></div>');
      var D = P.dlaczego, cards = (D.elementy || []).map(function (e, i) {
        var id = dlg(e.tytul, fmt(e.tekst));
        return '<article class="np-card"' + rv(i + 1) + '><h3>' + plain(e.tytul) + '</h3><p>' + plain(skrot(e.tekst)) + '</p><button type="button" class="np-link" data-open="' + id + '" aria-label="Czytaj więcej: ' + esc(e.tytul) + '">Czytaj więcej</button></article>';
      }).join('');
      out += sec('dlaczego-warto', 'Dlaczego warto?', D.bg, '<div class="np-wide">' + h(2, 'dlaczego-warto', D.h2, 'strony.home.dlaczego.h2', 'np-h2') + '<div class="np-cards4">' + cards + '</div></div>');
      if (igOn) {
        var N = P.insta;
        out += sec('instagram', 'Instagram', N.bg, '<div class="np-wide">' + h(2, 'instagram', N.h2, 'strony.home.insta.h2', 'np-h2') + '<p class="np-lead"' + fa('strony.home.insta.tekst') + '>' + plain(N.tekst) + '</p>' +
          '<div class="np-insta" data-insta aria-live="polite">' + new Array(7).join('<span class="np-ig-ph"></span>') + '</div>' +
          '<div class="np-actions">' + btn(f.ig, N.btn + ' ' + f.igNazwa, 'np-btn-line', ' rel="noopener" target="_blank"') + '</div></div>');
      }
      var C = P.cta;
      out += sec('kontakt', 'Kontakt', C.bg, '<div class="np-narrow">' + h(2, 'kontakt', C.h2, 'strony.home.cta.h2', 'np-h2') + '<p class="np-lead"' + fa('strony.home.cta.tekst') + '>' + plain(C.tekst) + '</p>' +
        '<div class="np-actions">' + btn('/kontakt/#formularz', C.btn) + btn('tel:' + f.tel, 'Zadzwoń: ' + f.telTxt, 'np-btn-line') + '</div></div>');
    }

    else if (k === 'o-mnie') {
      var H1 = P.hero;
      out += sec('start', 'O mnie', H1.bg, '<div class="np-hero-in"><p class="np-eyebrow"' + fa('strony.o-mnie.hero.nad') + '>' + plain(H1.nad) + '</p>' + h(1, 'start', H1.h1, 'strony.o-mnie.hero.h1', 'np-h1') + '<p class="np-lead">' + plain(H1.haslo) + '</p></div>', 'np-hero', true);
      out += sec('misja', 'Misja', P.misja.bg, '<div class="np-narrow">' + h(2, 'misja', P.misja.h2, 'strony.o-mnie.misja.h2', 'np-h2') + '<div class="np-prose np-big"' + rv(1) + fa('strony.o-mnie.misja.tekst') + '>' + fmt(P.misja.tekst) + '</div></div>');
      var Y = P.styl, wl = (Y.wartosci || []).map(function (w, i) { return '<li class="np-card"' + rv(i + 1) + '><h3>' + plain(w.tytul) + '</h3>' + (w.opis ? '<p>' + plain(w.opis) + '</p>' : '') + '</li>'; }).join('');
      out += sec('jak-pracuje', 'Jak pracuję', Y.bg, '<div class="np-wide">' + h(2, 'jak-pracuje', Y.h2, 'strony.o-mnie.styl.h2', 'np-h2') + '<p class="np-lead"' + rv(1) + fa('strony.o-mnie.styl.tekst') + '>' + plain(Y.tekst) + '</p><ul class="np-cards3">' + wl + '</ul></div>');
      out += sec('dlaczego-ja', 'Dlaczego ja', P.dlaczego.bg, '<div class="np-narrow">' + h(2, 'dlaczego-ja', P.dlaczego.h2, 'strony.o-mnie.dlaczego.h2', 'np-h2') + '<p class="np-lead"' + rv(1) + fa('strony.o-mnie.dlaczego.tekst') + '>' + plain(P.dlaczego.tekst) + '</p></div>');
      out += sec('gdzie', 'Gdzie fotografuję', P.gdzie.bg, '<div class="np-narrow">' + h(2, 'gdzie', P.gdzie.h2, 'strony.o-mnie.gdzie.h2', 'np-h2') + '<p class="np-lead"' + rv(1) + fa('strony.o-mnie.gdzie.tekst') + '>' + plain(P.gdzie.tekst) + '</p><div class="np-actions"' + rv(2) + '>' + btn('/kontakt/#formularz', P.gdzie.btn) + '</div></div>');
    }

    else if (k === 'oferta') {
      var H2 = P.hero;
      out += sec('start', 'Oferta', H2.bg, '<div class="np-hero-in"><p class="np-eyebrow">' + plain(H2.nad) + '</p>' + h(1, 'start', H2.h1, 'strony.oferta.hero.h1', 'np-h1') + '<p class="np-lead"' + fa('strony.oferta.hero.tekst') + '>' + plain(H2.tekst) + '</p></div>', 'np-hero', true);
      (P.kategorie || []).filter(function (c) { return c.widoczna !== false; }).forEach(function (c, i) {
        var bg = { typ: 'zdjecie', img: c.img, alt: c.alt, ov: 55, txt: 'jasny', kolor: '#141414' };
        out += sec(c.id, c.nazwa, bg, '<div class="np-narrow">' + h(2, c.id, c.nazwa, 'strony.oferta.kategorie.' + i + '.nazwa', 'np-h2') + '<p class="np-lead"' + rv(1) + fa('strony.oferta.kategorie.' + i + '.opis') + '>' + plain(c.opis) + '</p>' +
          '<div class="np-actions"' + rv(2) + '>' + btn(temat(c.nazwa), 'Zapytaj o termin') + btn('/portfolio/', 'Zobacz portfolio', 'np-btn-line') + '</div></div>', 'np-cat');
      });
      var pk = (d.pakiety || []).filter(function (p) { return p.widoczna !== false; }).map(function (p, i) {
        var idx = (d.pakiety || []).indexOf(p);
        return '<article class="np-pk"' + rv(i + 1) + '>' + imgTag(p.img, p.alt, { sizes: '(max-width:700px) 100vw, 33vw', cls: 'np-pk-img' }) +
          '<div class="np-pk-b"><h3' + fa('pakiety.' + idx + '.nazwa') + '>' + plain(p.nazwa) + '</h3><p>' + plain(p.opis) + '</p>' +
          '<dl class="np-dl"><div><dt>Czas sesji</dt><dd>' + plain(p.czas) + '</dd></div><div><dt>Liczba zdjęć</dt><dd>' + plain(p.zdjecia) + '</dd></div><div><dt>Cena</dt><dd>' + plain(p.cena) + '</dd></div></dl>' +
          btn(temat(p.nazwa), 'Zapytaj o termin', 'np-btn-line') + '</div></article>';
      }).join('');
      out += sec('pakiety', 'Pakiety', { typ: 'kolor', kolor: '#F4F1EC', txt: 'ciemny' }, '<div class="np-wide">' + h(2, 'pakiety', P.pakietyH2, 'strony.oferta.pakietyH2', 'np-h2') + '<p class="np-lead"' + fa('strony.oferta.pakietyWstep') + '>' + plain(P.pakietyWstep) + '</p><div class="np-cards3 np-pks">' + pk + '</div><p class="np-note">Zobacz też <a href="/cennik/">cennik sesji zdjęciowych</a>.</p></div>');
      out += sec('gdzie', 'Gdzie sesje', P.gdzie.bg, '<div class="np-narrow">' + h(2, 'gdzie', P.gdzie.h2, 'strony.oferta.gdzie.h2', 'np-h2') + '<p class="np-lead"' + rv(1) + fa('strony.oferta.gdzie.tekst') + '>' + plain(P.gdzie.tekst) + '</p><div class="np-actions"' + rv(2) + '>' + btn('/kontakt/#formularz', P.gdzie.btn) + '</div></div>');
    }

    else if (k === 'cennik') {
      var H3 = P.hero;
      out += sec('start', 'Cennik', H3.bg, '<div class="np-hero-in"><p class="np-eyebrow">' + plain(H3.nad) + '</p>' + h(1, 'start', H3.h1, 'strony.cennik.hero.h1', 'np-h1') + '<p class="np-lead"' + fa('strony.cennik.hero.tekst') + '>' + plain(H3.tekst) + '</p></div>', 'np-hero', true);
      var grupy = [], mapG = {};
      (P.pozycje || []).forEach(function (r, idx) {
        if (r.widoczna === false) return;
        var kt = r.kat || 'Cennik';
        if (!mapG[kt]) { mapG[kt] = { kat: kt, rows: [] }; grupy.push(mapG[kt]); }
        mapG[kt].rows.push({ r: r, idx: idx });
      });
      var tabs = grupy.map(function (g, gi) {
        return '<div class="np-tblw"' + rv(gi + 1) + '><h3>' + plain(g.kat) + '</h3><table class="np-tbl"><caption class="np-sr">' + esc(g.kat) + ' — cennik</caption>' +
          '<thead><tr><th scope="col">Pozycja</th><th scope="col">Czas</th><th scope="col">Cena</th></tr></thead><tbody>' +
          g.rows.map(function (x) {
            return '<tr><th scope="row"' + fa('strony.cennik.pozycje.' + x.idx + '.nazwa') + '><span class="np-tn">' + plain(x.r.nazwa) + '</span>' + (x.r.dopisek ? '<span class="np-td">' + plain(x.r.dopisek) + '</span>' : '') + '</th>' +
              '<td data-l="Czas">' + plain(x.r.czas) + '</td><td data-l="Cena" class="np-price">' + plain(x.r.cena) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }).join('');
      out += sec('ceny', 'Pakiety i ceny', P.tabele.bg, '<div class="np-wide">' + h(2, 'ceny', P.tabele.h2, 'strony.cennik.tabele.h2', 'np-h2') + tabs +
        '<p class="np-note"' + rv(5) + fa('strony.cennik.uwaga') + '>' + plain(P.uwaga) + '</p><div class="np-actions"' + rv(6) + '>' + btn('/kontakt/#formularz', 'Zapytaj o termin') + btn('/bony/', 'Voucher na sesję', 'np-btn-line') + '</div></div>');
    }

    else if (k === 'portfolio') {
      var H4 = P.hero;
      out += sec('start', 'Portfolio', H4.bg, '<div class="np-hero-in"><p class="np-eyebrow">' + plain(H4.nad) + '</p>' + h(1, 'start', H4.h1, 'strony.portfolio.hero.h1', 'np-h1') + '<p class="np-lead"' + fa('strony.portfolio.hero.tekst') + '>' + plain(H4.tekst) + '</p></div>', 'np-hero', true);
      var zd = (P.zdjecia || []).filter(function (z) { return z.widoczna !== false && z.img; });
      var kats = (P.kategorie || []).map(function (x) { return x.nazwa; }).filter(function (n) { return zd.some(function (z) { return z.kat === n; }); });
      var chips = '<button type="button" class="np-chip" aria-pressed="true" data-kat="">Wszystkie</button>' + kats.map(function (n) { return '<button type="button" class="np-chip" aria-pressed="false" data-kat="' + esc(n) + '">' + plain(n) + '</button>'; }).join('');
      var slides = zd.map(function (z, i) {
        return '<li class="np-slide" data-kat="' + esc(z.kat || '') + '" aria-roledescription="slajd" aria-label="Zdjęcie ' + (i + 1) + ' z ' + zd.length + '"><figure>' + imgTag(z.img, z.alt, { cls: 'np-slide-img' }) +
          (z.podpis ? '<figcaption>' + plain(z.podpis) + (z.kat ? ' · <span>' + plain(z.kat) + '</span>' : '') + '</figcaption>' : '') + '</figure></li>';
      }).join('');
      out += sec('galeria', 'Galeria', P.galeria.bg, '<div class="np-gal"><div class="np-gal-top">' + h(2, 'galeria', P.galeria.h2, 'strony.portfolio.galeria.h2', 'np-h3like') + '<div class="np-chips" role="group" aria-label="Kategorie zdjęć">' + chips + '</div></div>' +
        '<div class="np-slider" role="region" aria-roledescription="karuzela" aria-label="Galeria zdjęć" tabindex="0"><ul class="np-track">' + slides + '</ul></div>' +
        '<div class="np-gal-ctl"><button type="button" class="np-arrow" data-prev aria-label="Poprzednie zdjęcie">‹</button><span class="np-count" data-count aria-live="polite">1/' + zd.length + '</span><button type="button" class="np-arrow" data-next aria-label="Następne zdjęcie">›</button></div></div>', 'np-galsec');
      out += sec('kontakt', 'Kontakt', { typ: 'kolor', kolor: '#F4F1EC', txt: 'ciemny' }, '<div class="np-narrow"><h2 id="kontakt-h" class="np-h2">Podoba Ci się ten styl?</h2><p class="np-lead">Napisz, a wybierzemy termin Twojej sesji.</p><div class="np-actions">' + btn('/kontakt/#formularz', 'Zapytaj o termin') + '</div></div>');
    }

    else if (k === 'opinie' || k === 'faq' || k === 'aktualnosci' || k === 'regulamin' || k === 'polityka') {
      var T = P.tlo, body = '', lead = T.wstep ? '<p class="np-lead"' + fa('strony.' + k + '.tlo.wstep') + '>' + plain(T.wstep) + '</p>' : '';
      if (k === 'opinie') {
        var op = opinieWidoczne(d);
        body = op.length ? '<ul class="np-cards3 np-ops">' + op.map(function (o, i) {
          var n = clamp(o.ocena || 5, 3, 5);
          return '<li class="np-card"' + rv(i + 1) + '><span class="np-stars" role="img" aria-label="Ocena: ' + n + ' na 5">' + new Array(n + 1).join('★') + new Array(6 - n).join('☆') + '</span>' +
            '<blockquote>' + fmt(o.tresc) + '</blockquote><p class="np-who"><strong>' + plain(o.autor) + '</strong>' + (o.usluga ? ' · ' + plain(o.usluga) : '') + '</p></li>';
        }).join('') + '</ul>' + (safeUrl(P.linkGoogle) ? '<p class="np-note"><a href="' + esc(safeUrl(P.linkGoogle)) + '" rel="noopener" target="_blank">Zobacz opinie w Google</a></p>' : '')
          : '<p class="np-lead">Opinie klientów pojawią się tu wkrótce.</p>';
      } else if (k === 'faq') {
        var qs = (P.pytania || []).filter(function (x) { return x.widoczna !== false; });
        body = '<div class="np-faqs">' + qs.map(function (x, i) {
          return '<details class="np-faq"' + rv(Math.min(i, 5)) + '><summary>' + plain(x.q) + '</summary><div class="np-prose">' + fmt(x.a) + '</div></details>';
        }).join('') + '</div><div class="np-actions">' + btn('/kontakt/#formularz', 'Nie znalazłaś odpowiedzi? Zapytaj mnie') + '</div>';
      } else if (k === 'aktualnosci') {
        var wp = aktywneWpisy(d, now);
        body = wp.length ? '<div class="np-cards3 np-posts">' + wp.map(function (w, i) {
          var id = dlg(w.tytul, (w.img ? imgTag(w.img, w.alt, { cls: 'np-post-img' }) : '') + fmt(w.tresc));
          return '<article class="np-card" id="wpis-' + (i + 1) + '"' + rv(i + 1) + '>' + (w.img ? imgTag(w.img, w.alt, { sizes: '(max-width:700px) 100vw, 33vw', cls: 'np-post-img' }) : '') +
            '<p class="np-date">' + esc(fmtDate(w.data || w.od)) + '</p><h2 class="np-h3like">' + plain(w.tytul) + '</h2><p>' + plain(skrot(w.tresc)) + '</p><button type="button" class="np-link" data-open="' + id + '" aria-label="Czytaj więcej: ' + esc(w.tytul) + '">Czytaj więcej</button></article>';
        }).join('') + '</div>' : '<p class="np-lead">Wkrótce pojawią się tu nowości.</p>';
      } else if (k === 'regulamin') {
        body = '<div class="np-prose np-legal"' + fa('strony.regulamin.tekst') + '>' + fmt(P.tekst) + '</div>' + (P.aktualizacja ? '<p class="np-note">Ostatnia aktualizacja: ' + plain(P.aktualizacja) + '</p>' : '') +
          '<div class="np-actions">' + btn('/kontakt/#formularz', 'Zapytaj o termin') + '</div>';
      } else {
        body = '<div class="np-prose np-legal">' + polityka(d) + (P.dodatek ? fmt(P.dodatek) : '') + '</div>';
      }
      out += sec('start', T.h1, T.bg, '<div class="np-page">' + h(1, 'start', T.h1, 'strony.' + k + '.tlo.h1', 'np-h1 np-h1-sm') + lead + '<div class="np-pbody">' + body + '</div></div>', 'np-textsec np-hero', true);
    }

    else if (k === 'bony') {
      var H5 = P.hero;
      out += sec('start', 'Bony', H5.bg, '<div class="np-hero-in"><p class="np-eyebrow">' + plain(H5.nad) + '</p>' + h(1, 'start', H5.h1, 'strony.bony.hero.h1', 'np-h1') + '<p class="np-lead"' + fa('strony.bony.hero.tekst') + '>' + plain(H5.tekst) + '</p></div>', 'np-hero', true);
      var W = P.warunki, li = (W.punkty || []).filter(function (x) { return x.widoczna !== false; }).map(function (x, i) { return '<li' + rv(i + 1) + '>' + plain(x.tekst) + '</li>'; }).join('');
      out += sec('warunki', 'Jak działa voucher', W.bg, '<div class="np-narrow">' + h(2, 'warunki', W.h2, 'strony.bony.warunki.h2', 'np-h2') + '<p class="np-lead"' + fa('strony.bony.warunki.wstep') + '>' + plain(W.wstep) + '</p><ul class="np-list">' + li + '</ul><div class="np-actions"' + rv(5) + '>' + btn(temat('Voucher na sesję'), W.btn) + '</div></div>');
    }

    else if (k === 'kontakt') {
      var T2 = P.tlo, mapq = encodeURIComponent(f.mapaZapytanie || f.miasto);
      var tel = '<a class="np-ct" href="tel:' + esc(f.tel) + '"><span>Zadzwoń</span><strong>' + plain(f.telTxt) + '</strong></a>';
      var mail = '<a class="np-ct" href="mailto:' + esc(f.email) + '"><span>Napisz e-mail</span><strong>' + plain(f.email) + '</strong></a>';
      var ig = '<a class="np-ct" href="' + esc(safeUrl(f.ig)) + '" rel="noopener" target="_blank"><span>Wiadomość na Instagramie</span><strong>' + plain(f.igNazwa) + '</strong></a>';
      var fb = safeUrl(f.fb) ? '<a class="np-ct" href="' + esc(safeUrl(f.fb)) + '" rel="noopener" target="_blank"><span>Facebook</span><strong>Natalia Perkowska Fotografia</strong></a>' : '';
      var gb = safeUrl(f.gbp) ? '<a class="np-ct" href="' + esc(safeUrl(f.gbp)) + '" rel="noopener" target="_blank"><span>Profil Firmy w Google</span><strong>Zobacz opinie i mapę</strong></a>' : '';
      out += sec('start', 'Kontakt', T2.bg, '<div class="np-page np-contact">' + h(1, 'start', T2.h1, 'strony.kontakt.tlo.h1', 'np-h1 np-h1-sm') + '<p class="np-lead"' + fa('strony.kontakt.tlo.wstep') + '>' + plain(T2.wstep) + '</p>' +
        '<div class="np-cts">' + tel + mail + ig + fb + gb + '</div>' +
        '<p class="np-note">' + plain(f.specjalizacja) + ' · ' + plain(f.miasto) + '. Obszar działania: ' + plain(f.obszar) + '.</p>' +
        '<div class="np-map" data-map="https://www.google.com/maps?q=' + mapq + '&amp;output=embed"><a class="np-btn np-btn-line" href="https://www.google.com/maps/search/?api=1&amp;query=' + mapq + '" rel="noopener" target="_blank">Otwórz ' + esc(f.miasto) + ' w Mapach Google</a> <button type="button" class="np-btn np-btn-line" data-showmap>Pokaż mapę</button></div></div>', 'np-hero np-ctsec', true);
      var tm = (P.tematy || []).map(function (t) { return '<option>' + esc(t.nazwa) + '</option>'; }).join('');
      var kl = esc(d.rodo.klauzula).replace(/\{(\w+)\}/g, function (m, n) { return plain(d.rodo[n] || ''); });
      out += sec('formularz', 'Formularz', { typ: 'kolor', kolor: '#F4F1EC', txt: 'ciemny' }, '<div class="np-narrow">' + h(2, 'formularz', 'Poproś o termin', 'strony.kontakt.formularz', 'np-h2') +
        '<p class="np-lead">Napisz, jaką sesją jesteś zainteresowana — odpowiem lub oddzwonię. Pola bez dopisku są wymagane.</p>' +
        '<form class="np-form" id="np-form" action="/api/formularz" method="post" novalidate>' +
        '<p class="np-hp" aria-hidden="true"><label>Nie wypełniaj tego pola<input type="text" name="www" tabindex="-1" autocomplete="off"></label></p>' +
        '<div class="np-fld"><label for="f-imie">Imię</label><input id="f-imie" name="imie" type="text" autocomplete="given-name" required maxlength="80"><span class="np-err" data-err="imie"></span></div>' +
        '<div class="np-fld"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="120" inputmode="email"><span class="np-err" data-err="email"></span></div>' +
        '<div class="np-fld"><label for="f-tel">Telefon (opcjonalnie)</label><input id="f-tel" name="tel" type="tel" autocomplete="tel" maxlength="24" inputmode="tel"><span class="np-err" data-err="tel"></span></div>' +
        '<div class="np-fld"><label for="f-temat">Rodzaj sesji (opcjonalnie)</label><select id="f-temat" name="temat"><option value="">— wybierz —</option>' + tm + '</select></div>' +
        '<div class="np-fld"><label for="f-termin">Preferowany termin lub miesiąc (opcjonalnie)</label><input id="f-termin" name="termin" type="text" maxlength="80"></div>' +
        '<div class="np-fld np-fld-w"><label for="f-wiad">Wiadomość</label><textarea id="f-wiad" name="wiadomosc" rows="5" required maxlength="2000"></textarea><span class="np-err" data-err="wiadomosc"></span></div>' +
        '<div class="np-fld np-fld-w" data-turnstile></div>' +
        '<div class="np-fld np-fld-w"><button class="np-btn" type="submit">Wyślij zapytanie</button><p class="np-fst" role="status" aria-live="polite"></p></div></form>' +
        '<p class="np-rodo"' + fa('rodo.klauzula') + '>' + kl + ' <a href="/polityka-prywatnosci/">Polityka prywatności</a>.</p></div>');
    }

    /* ----- górny pasek, nagłówek, menu, stopka ----- */
    var mi = menuItems(d, now), cur = pageByKey(k).url;
    var bar = aktywneWpisy(d, now).filter(function (w) { return w.pasek; });
    var topbar = bar.length ? '<div class="np-top" data-rot role="region" aria-label="Komunikaty"><div class="np-top-i">' + bar.map(function (w, i) {
      return '<a href="/aktualnosci/"' + (i ? ' hidden' : '') + '>' + plain(w.tytul) + '</a>'; }).join('') + '</div>' + (bar.length > 1 ? '<span class="np-top-c" aria-hidden="true">1/' + bar.length + '</span>' : '') + '</div>' : '';
    var logoImg = function (src, cls) { return '<img class="' + cls + '" src="' + esc(safeUrl(src)) + '" width="233" height="89" alt="' + esc(f.nazwa) + '" decoding="async">'; };
    var header = '<header class="np-hdr"><a class="np-logo" href="/" aria-label="' + esc(f.nazwa) + ' — strona główna">' + logoImg(f.logoJasne, 'np-logo-img') + '</a>' +
      '<button type="button" class="np-burger" aria-expanded="false" aria-controls="np-menu"><span class="np-burger-t">Menu</span><span class="np-burger-i" aria-hidden="true"></span></button></header>';
    var menu = '<div id="np-menu" class="np-menu"><nav aria-label="Menu główne"><ul>' +
      '<li><a href="/"' + (cur === '/' ? ' aria-current="page"' : '') + '>Strona główna</a></li>' +
      mi.map(function (m) { var p = pageByKey(m.k); return '<li><a href="' + p.url + '"' + (cur === p.url ? ' aria-current="page"' : '') + '>' + esc(m.e) + '</a></li>'; }).join('') +
      '</ul></nav><p class="np-menu-ct"><a href="tel:' + esc(f.tel) + '">' + esc(f.telTxt) + '</a> · <a href="mailto:' + esc(f.email) + '">' + esc(f.email) + '</a></p></div>';
    var dots = (d.wyglad || {}).kropki !== false && secs.length > 1 ? '<nav class="np-dots" aria-label="Sekcje strony"><ul>' + secs.map(function (s) {
      return '<li><a href="#' + s.id + '" aria-label="' + esc(s.label) + '"><span></span></a></li>'; }).join('') + '</ul></nav>' : '';
    var fbOn = !!pixelId(d);
    var foot = '<footer class="np-ftr"><div class="np-ftr-g"><div><p class="np-ftr-b">' + logoImg(f.logoJasne, 'np-ftr-logo') + '</p><p>' + plain(d.stopka.haslo) + '</p><p>' + plain(f.specjalizacja) + ' · ' + plain(f.miasto) + '</p><p class="np-ftr-s">Obszar działania: ' + plain(f.obszar) + '.</p></div>' +
      '<nav aria-label="Menu w stopce"><ul>' + mi.map(function (m) { return '<li><a href="' + pageByKey(m.k).url + '">' + esc(m.e) + '</a></li>'; }).join('') + '</ul></nav>' +
      '<div><ul><li><a href="tel:' + esc(f.tel) + '">' + esc(f.telTxt) + '</a></li><li><a href="mailto:' + esc(f.email) + '">' + esc(f.email) + '</a></li>' +
      '<li class="np-soc"><a href="' + esc(safeUrl(f.ig)) + '" rel="noopener" target="_blank" aria-label="Instagram — ' + esc(f.igNazwa) + '">' + icon('ig') + '</a><a href="' + esc(safeUrl(f.fb)) + '" rel="noopener" target="_blank" aria-label="Facebook — ' + esc(f.nazwa) + '">' + icon('fb') + '</a></li>' +
      (safeUrl(f.gbp) ? '<li><a href="' + esc(safeUrl(f.gbp)) + '" rel="noopener" target="_blank">Profil Firmy w Google</a></li>' : '<!-- Profil Firmy w Google: [LINK DO UZUPEŁNIENIA] -->') + '</ul></div></div>' +
      '<p class="np-ftr-l">© ' + new Date().getFullYear() + ' ' + esc(f.nazwa) + ' · <a href="/polityka-prywatnosci/">Polityka prywatności</a> · <a href="/regulamin/">Regulamin</a>' +
      (fbOn ? ' · <button type="button" class="np-link" data-cookies>Ustawienia cookies</button>' : '') +
      ' · <button type="button" class="np-link" data-panel>Panel administratora</button> · <a href="' + esc(d.stopka.autorUrl) + '" rel="noopener">' + esc(d.stopka.autor) + '</a></p></footer>';
    var mbar = '<div class="np-mbar"><a class="np-btn" href="tel:' + esc(f.tel) + '">Zadzwoń</a><a class="np-btn np-btn-line" href="/kontakt/#formularz">Zapytaj o termin</a></div>';
    var lock = '<button type="button" class="np-lock" data-panel aria-label="Panel administratora — zaloguj się">' + icon('lock') + '</button>';
    var fbev = k === 'oferta' ? 'ViewContent:Oferta' : k === 'cennik' ? 'ViewContent:Cennik' : '';
    return topbar + header + menu + dots + '<main id="tresc"' + (fbev ? ' data-fb="' + fbev + '"' : '') + '>' + out + '</main>' + foot + mbar + lock + dlgs.join('');
  }

  /* ---------- polityka prywatności ---------- */
  function polityka(d) {
    var f = d.firma, r = d.rodo, px = pixelId(d), ig = (d.integracje || {}).instagramWlaczony !== false;
    var P = function (t) { return '<p>' + plain(t) + '</p>'; };
    var h = '<h2>1. Administrator danych</h2>' + P('Administratorem danych osobowych jest ' + r.administrator + ', ' + r.adres + ', NIP: ' + r.nip + '. Kontakt w sprawach danych: ' + f.email + ', tel. ' + f.telTxt + '.') +
      '<h2>2. Formularz kontaktowy i korespondencja</h2>' + P('Dane podane w formularzu (imię, e-mail, opcjonalnie telefon, rodzaj sesji, preferowany termin i treść wiadomości) przetwarzamy w celu odpowiedzi na zapytanie, przygotowania oferty i umówienia sesji — na podstawie art. 6 ust. 1 lit. b RODO (działania przed zawarciem umowy) oraz lit. f RODO (prawnie uzasadniony interes: odpowiedź na wiadomość). Dane przechowujemy do zakończenia korespondencji, najdłużej 12 miesięcy; w razie zawarcia umowy — przez czas wynikający z przepisów (np. rachunkowych i podatkowych). Wysłanie formularza nie wymaga zgody, a podanie danych jest dobrowolne, lecz niezbędne do odpowiedzi.') +
      '<h2>3. Odbiorcy danych i przekazywanie poza EOG</h2>' + P('Odbiorcami danych są dostawcy usług, z których korzystamy: Cloudflare, Inc. (hosting strony, USA), dostawca poczty elektronicznej obsługujący wiadomości z formularza [DO UZUPEŁNIENIA przy wdrożeniu — np. Resend / Google Gmail]. Przekazanie danych do USA odbywa się na podstawie standardowych klauzul umownych lub certyfikacji w ramach EU-US Data Privacy Framework.') +
      (ig ? '<h2>4. Instagram na stronie</h2>' + P('Najnowsze zdjęcia z Instagrama pobiera serwer strony, a nie Twoja przeglądarka — odwiedzając stronę, nie łączysz się z serwerami Meta z powodu tej sekcji. Kliknięcie linku do profilu przenosi Cię na Instagram, którego zasady określa jego regulamin.') : '') +
      '<h2>5. Pliki cookies i podobne technologie</h2>' + P('Niezbędne: zapamiętanie Twojego wyboru w banerze cookies (wpis np_zgoda w pamięci przeglądarki) oraz — wyłącznie dla zalogowanej osoby zarządzającej stroną — ciasteczko sesji panelu administracyjnego (HttpOnly, Secure, SameSite=Strict, do 8 godzin).') +
      (px ? P('Opcjonalne — Piksel Facebooka (Meta): jeśli klikniesz „Akceptuję”, załadujemy Piksel Meta Platforms Ireland Ltd. Piksel zapisuje identyfikatory w ciasteczkach (_fbp — do ok. 90 dni, _fbc) i przesyła do Meta adres IP, dane przeglądarki oraz informacje o odwiedzanych podstronach i zdarzeniach: wyświetlenie strony (PageView), wyświetlenie oferty lub cennika (ViewContent), kliknięcie w telefon lub e-mail (Contact) oraz wysłanie formularza (Lead — bez treści Twojej wiadomości i danych osobowych). Cel: mierzenie skuteczności reklam i dopasowywanie reklam do osób zainteresowanych ofertą. Podstawa: Twoja zgoda (art. 6 ust. 1 lit. a RODO oraz przepisy o komunikacji elektronicznej). W zakresie zbierania danych przez Piksel administrator i Meta Platforms Ireland Ltd. są współadministratorami (art. 26 RODO); dane mogą być przekazywane do USA na podstawie DPF lub standardowych klauzul umownych. Zgodę możesz w każdej chwili wycofać przyciskiem „Ustawienia cookies” w stopce — wycofanie nie wpływa na zgodność z prawem wcześniejszego przetwarzania. Odmowa nie ogranicza korzystania ze strony.') :
        P('Strona nie używa obecnie cookies analitycznych ani marketingowych. Jeśli w przyszłości włączymy narzędzia takie jak Piksel Facebooka, pojawi się baner z równorzędnymi przyciskami „Akceptuję” i „Odrzuć”, a narzędzia załadują się dopiero po Twojej zgodzie.')) +
      '<h2>6. Twoje prawa</h2>' + P('Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie, przenoszenia danych oraz wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa). Aby skorzystać z praw, napisz na ' + f.email + '.') +
      '<h2>7. Bezpieczeństwo</h2>' + P('Strona działa wyłącznie przez HTTPS. Formularz jest chroniony przed spamem bez śledzenia (pole-pułapka, limit wysyłek, opcjonalnie Cloudflare Turnstile). Dane z formularza nie są zapisywane w pamięci przeglądarki ani w adresie URL.') +
      (d.strony.polityka.aktualizacja ? '<p class="np-note">Aktualizacja polityki: ' + plain(d.strony.polityka.aktualizacja) + '</p>' : '');
    return h;
  }

  /* ---------- sitemap / robots ---------- */
  function sitemap(d, now, lastmod) {
    var base = (d.domena || '').replace(/\/$/, '');
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      PAGES.filter(function (p) { return pageVisible(d, p.k, now); }).map(function (p) {
        return '  <url><loc>' + base + p.url + '</loc>' + (lastmod ? '<lastmod>' + lastmod + '</lastmod>' : '') + '<changefreq>' + (p.k === 'home' ? 'weekly' : 'monthly') + '</changefreq><priority>' + (p.k === 'home' ? '1.0' : p.k === 'polityka' || p.k === 'regulamin' ? '0.3' : '0.8') + '</priority></url>';
      }).join('\n') + '\n</urlset>\n';
  }
  function robots(d) {
    return 'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ' + (d.domena || '').replace(/\/$/, '') + '/sitemap.xml\n';
  }

  return { PAGES: PAGES, esc: esc, fmt: fmt, plain: plain, clean: clean, safeUrl: safeUrl, merge: merge, clone: clone, get: get, set: set, today: today, status: status,
    aktywneWpisy: aktywneWpisy, opinieWidoczne: opinieWidoczne, pageVisible: pageVisible, menuItems: menuItems, pixelId: pixelId, pageByKey: pageByKey, pageByPath: pageByPath,
    renderHead: renderHead, renderBody: renderBody, headPatch: headPatch, jsonld: jsonld, sitemap: sitemap, robots: robots, fmtDate: fmtDate, polityka: polityka, imgTag: imgTag };
});
