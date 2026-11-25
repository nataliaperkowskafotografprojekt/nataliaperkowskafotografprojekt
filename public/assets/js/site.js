/* Zachowania strony publicznej: menu, kropki, pojawianie się treści, slider, dialogi, formularz, cookies + Piksel Facebooka, logowanie do panelu. */
(function () {
  'use strict';
  var D = document, W = window, $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var CK = 'np_zgoda', t0 = Date.now();
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- API z limitem czasu ---------- */
  function api(path, opt, ms) {
    opt = opt || {}; var c = new AbortController(), id = setTimeout(function () { c.abort(); }, ms || 9000);
    opt.signal = c.signal; opt.credentials = 'same-origin';
    opt.headers = Object.assign({ 'X-CMS': '1' }, opt.headers || {});
    return fetch(path, opt).then(function (r) { clearTimeout(id); return r; }, function (e) { clearTimeout(id); throw e; });
  }
  W.NP_API = api;

  /* ---------- wysokość nagłówka (--hdr) ---------- */
  function hdr() {
    var h = $('.np-hdr'); if (!h) return;
    var set = function () { D.documentElement.style.setProperty('--hdr', Math.round(h.getBoundingClientRect().bottom) + 'px'); };
    set(); if (W.ResizeObserver) new ResizeObserver(set).observe(h); else addEventListener('resize', set);
  }

  /* ---------- menu ---------- */
  function menu() {
    D.addEventListener('click', function (e) {
      var b = e.target.closest('.np-burger');
      var m = $('#np-menu'), bt = $('.np-burger');
      if (b) { toggle(!m.classList.contains('open')); return; }
      if (m && m.classList.contains('open') && e.target.closest('#np-menu a')) toggle(false);
    });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#np-menu.open')) { toggle(false); $('.np-burger').focus(); } });
    function toggle(open) {
      var m = $('#np-menu'), bt = $('.np-burger'); if (!m) return;
      m.classList.toggle('open', open); bt.setAttribute('aria-expanded', open ? 'true' : 'false');
      D.documentElement.classList.toggle('np-lockscroll', open);
      var main = $('#tresc'); if (main) main.inert = open;
      if (open) { var a = $('#np-menu a'); a && a.focus(); }
    }
  }

  /* ---------- pojawianie się treści, kropki nawigacji ---------- */
  function observe() {
    if (!W.IntersectionObserver) { $$('[data-rv]').forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('[data-rv]').forEach(function (e) { if (!e.classList.contains('in')) io.observe(e); });
    var links = $$('.np-dots a');
    if (links.length) {
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        });
      }, { threshold: 0.5 });
      $$('main > section[id]').forEach(function (s) { so.observe(s); });
    }
  }

  /* ---------- dialogi „czytaj więcej” ---------- */
  function dialogs() {
    D.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]');
      if (o) { var d = D.getElementById(o.getAttribute('data-open')); if (d && d.showModal) { d.showModal(); d._from = o; } return; }
      if (e.target.closest('[data-close]')) { var dd = e.target.closest('dialog'); dd && dd.close(); return; }
      if (e.target.matches && e.target.matches('dialog.np-dlg')) e.target.close();
    });
    D.addEventListener('close', function (e) { if (e.target._from) e.target._from.focus(); }, true);
  }

  /* ---------- slider galerii (nasłuch jednorazowy, elementy pobierane na bieżąco) ---------- */
  function sliderUpd() {
    var tr = $('.np-track'), cnt = $('[data-count]'); if (!tr || !cnt) return;
    var v = $$('.np-slide', tr).filter(function (s) { return !s.hidden; }), i = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth));
    cnt.textContent = (v.length ? Math.min(i + 1, v.length) : 0) + '/' + v.length;
  }
  function sliderGo(dir) { var tr = $('.np-track'); if (tr) tr.scrollBy({ left: dir * tr.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); }
  function slider() {
    if (slider._b) return; slider._b = 1;
    var raf;
    D.addEventListener('scroll', function (e) { if (e.target.classList && e.target.classList.contains('np-track')) { cancelAnimationFrame(raf); raf = requestAnimationFrame(sliderUpd); } }, true);
    D.addEventListener('click', function (e) {
      if (e.target.closest('[data-next]')) sliderGo(1); else if (e.target.closest('[data-prev]')) sliderGo(-1);
      var c = e.target.closest('.np-chip');
      if (c) {
        $$('.np-chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        var k = c.getAttribute('data-kat'), tr = $('.np-track');
        $$('.np-slide', tr).forEach(function (s) { s.hidden = !!k && s.getAttribute('data-kat') !== k; });
        tr.scrollLeft = 0; sliderUpd();
      }
    });
    D.addEventListener('keydown', function (e) {
      if (!e.target.closest || !e.target.closest('.np-slider')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); sliderGo(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); sliderGo(-1); }
    });
    sliderUpd();
  }

  /* ---------- wideo w tle (wyciszone, z pauzą; zdjęcie na telefonie i przy wolnym łączu) ---------- */
  function video() {
    var c = navigator.connection || {}, slow = c.saveData || /2g/.test(c.effectiveType || '');
    if (reduce || slow || matchMedia('(max-width:760px)').matches) return;
    $$('.np-vid').forEach(function (v) {
      v.src = v.getAttribute('data-src'); v.hidden = false;
      var p = v.parentNode.querySelector('.np-vpause');
      v.play().then(function () { if (p) { p.hidden = false; } }).catch(function () {});
      if (p) p.addEventListener('click', function () { if (v.paused) { v.play(); p.textContent = '❚❚'; p.setAttribute('aria-label', 'Zatrzymaj wideo w tle'); } else { v.pause(); p.textContent = '▶'; p.setAttribute('aria-label', 'Wznów wideo w tle'); } });
    });
  }

  /* ---------- pasek komunikatów ---------- */
  function topbar() {
    var t = $('[data-rot]'); if (!t) return; var it = $$('a', t); if (it.length < 2) return;
    var i = 0, c = $('.np-top-c', t);
    setInterval(function () { if (reduce) return; it[i].hidden = true; i = (i + 1) % it.length; it[i].hidden = false; if (c) c.textContent = (i + 1) + '/' + it.length; }, 5000);
  }

  /* ---------- Instagram (zdjęcia przez serwer strony) ---------- */
  function insta() {
    var box = $('[data-insta]'); if (!box || !W.IntersectionObserver) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      api('/api/instagram', {}, 8000).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (j) {
        if (!j.items || !j.items.length) throw 0;
        box.innerHTML = j.items.slice(0, 6).map(function (x) {
          return '<a class="np-ig-i" href="' + encodeURI(x.href) + '" rel="noopener" target="_blank"><img src="' + encodeURI(x.src) + '" alt="' + String(x.alt || 'Zdjęcie z Instagrama').replace(/"/g, '&quot;') + '" width="400" height="400" loading="lazy"></a>';
        }).join('');
      }).catch(function () { box.hidden = true; });
    }, { rootMargin: '200px' });
    io.observe(box);
  }

  /* ---------- mapa po kliknięciu ---------- */
  D.addEventListener('click', function (e) {
    var b = e.target.closest('[data-showmap]'); if (!b) return;
    var box = b.closest('[data-map]'); var f = D.createElement('iframe');
    f.src = box.getAttribute('data-map'); f.title = 'Mapa Google — obszar działania'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.className = 'np-mapf';
    box.appendChild(f); b.remove();
  });

  /* ---------- formularz ---------- */
  function form() {
    var f = $('#np-form'); if (!f) return;
    var p = new URLSearchParams(location.search).get('temat');
    if (p) {
      var s = f.temat, hit = [].slice.call(s.options).filter(function (o) { return o.text === p; })[0];
      if (hit) s.value = hit.value; else if (!f.wiadomosc.value) f.wiadomosc.value = 'Dotyczy: ' + p.slice(0, 80) + '. ';
    }
    var ts = $('meta[name="np:ts"]'), tsTok = '', tsInit = false;
    function initTs() {
      if (!ts || tsInit) return; tsInit = true;
      var s = D.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true;
      s.onload = function () { W.turnstile && W.turnstile.render('[data-turnstile]', { sitekey: ts.content, callback: function (t) { tsTok = t; } }); };
      D.head.appendChild(s);
    }
    f.addEventListener('focusin', initTs, { once: true });
    var TY = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.pl': 'gmail.com', 'wp.com': 'wp.pl', 'onet.com': 'onet.pl', 'o2.com': 'o2.pl', 'interia.com': 'interia.pl' };
    function err(n, m) { var e = $('[data-err="' + n + '"]', f); if (e) e.textContent = m || ''; var i = f.elements[n]; if (i) { m ? i.setAttribute('aria-invalid', 'true') : i.removeAttribute('aria-invalid'); } return !!m; }
    function validate() {
      var bad = null, v = function (n) { return (f.elements[n].value || '').trim(); };
      var chk = function (n, m) { if (err(n, m) && !bad) bad = f.elements[n]; };
      chk('imie', v('imie').length < 2 ? 'Podaj imię.' : '');
      var em = v('email'), re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, dom = em.split('@')[1] || '';
      chk('email', !re.test(em) ? 'Podaj poprawny adres e-mail.' : (TY[dom.toLowerCase()] ? 'Czy chodziło o ' + em.split('@')[0] + '@' + TY[dom.toLowerCase()] + '?' : ''));
      var tel = v('tel'), dg = tel.replace(/\D/g, '');
      chk('tel', tel && (dg.length < 9 || dg.length > 15 || (/^(\+?48)?/.test(tel) && !/^\+/.test(tel) && dg.length !== 9) ) ? 'Podaj numer telefonu (9 cyfr lub numer z prefiksem +).' : '');
      chk('wiadomosc', v('wiadomosc').length < 5 ? 'Napisz kilka słów wiadomości.' : '');
      return bad;
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = $('.np-fst', f), btn = $('button[type=submit]', f), bad = validate();
      if (bad) { st.textContent = 'Popraw zaznaczone pola.'; bad.focus(); return; }
      if (ts && !tsTok) { st.textContent = 'Potwierdź, że nie jesteś robotem (pole powyżej).'; return; }
      btn.disabled = true; st.textContent = 'Wysyłanie…';
      var body = { imie: f.imie.value.trim(), email: f.email.value.trim(), tel: f.tel.value.trim(), temat: f.temat.value, termin: f.termin.value.trim(), wiadomosc: f.wiadomosc.value.trim(), www: f.www.value, t: Date.now() - t0, ts: tsTok };
      api('/api/formularz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 15000)
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (x.ok) { f.reset(); st.textContent = 'Dziękuję! Wiadomość wysłana — odpiszę lub oddzwonię najszybciej, jak to możliwe.'; track('Lead'); }
          else st.textContent = x.j.blad || 'Nie udało się wysłać. Spróbuj ponownie lub zadzwoń.';
        })
        .catch(function () { st.textContent = 'Serwer chwilowo nie odpowiada — spróbuj ponownie lub zadzwoń.'; })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- zgoda na cookies + Piksel Facebooka ---------- */
  function pixelId() { var m = $('meta[name="np:fbpx"]'); return m ? m.content : ''; }
  function consent() { try { return localStorage.getItem(CK); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CK, v); } catch (e) {} }
  function loadPixel(id) {
    if (W.fbq) return;
    var n = W.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!W._fbq) W._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var s = D.createElement('script'); s.async = true; s.src = 'https://connect.facebook.net/en_US/fbevents.js'; D.head.appendChild(s);
    W.fbq('init', id); W.fbq('track', 'PageView');
    var ev = $('main[data-fb]'); if (ev) { var a = ev.getAttribute('data-fb').split(':'); W.fbq('track', a[0], { content_name: a[1] }); }
  }
  function track(name, params) { if (W.fbq && consent() === 'tak') W.fbq('track', name, params || {}); }
  function wipeFb() {
    ['_fbp', '_fbc'].forEach(function (n) {
      var h = location.hostname.split('.'); var doms = ['', location.hostname]; if (h.length > 2) doms.push('.' + h.slice(-2).join('.')); else doms.push('.' + location.hostname);
      doms.forEach(function (d) { D.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : ''); });
    });
  }
  function banner(force) {
    var id = pixelId(); if (!id) return;
    var c = consent();
    if (c === 'tak') loadPixel(id);
    if (c && !force) return;
    if ($('.np-cb')) return;
    var b = D.createElement('div'); b.className = 'np-cb'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-labelledby', 'np-cb-h'); b.setAttribute('aria-label', 'Ustawienia cookies');
    b.innerHTML = '<h2 id="np-cb-h">Cookies i Piksel Facebooka</h2><p>Strona używa niezbędnych zapisów w przeglądarce. Za Twoją zgodą załadujemy też Piksel Facebooka (Meta), który mierzy skuteczność reklam. Możesz odmówić — strona działa tak samo.</p>' +
      '<div class="np-cb-a"><button type="button" class="np-btn" data-cb="tak">Akceptuję</button><button type="button" class="np-btn" data-cb="nie">Odrzuć</button></div><p><a href="/polityka-prywatnosci/#start">Polityka prywatności</a></p>';
    D.body.appendChild(b);
    if (force) { var cur = b.querySelector('[data-cb="' + (c === 'tak' ? 'tak' : 'nie') + '"]'); cur && cur.focus(); }
    b.addEventListener('click', function (e) {
      var x = e.target.closest('[data-cb]'); if (!x) return;
      var v = x.getAttribute('data-cb'), prev = consent(); setConsent(v); b.remove();
      if (v === 'tak') loadPixel(id);
      else if (prev === 'tak') { wipeFb(); try { W.fbq && W.fbq('consent', 'revoke'); } catch (e2) {} location.reload(); }
    });
  }
  D.addEventListener('click', function (e) {
    if (e.target.closest('[data-cookies]')) banner(true);
    var a = e.target.closest('a[href^="tel:"],a[href^="mailto:"]');
    if (a) track('Contact', { content_name: a.getAttribute('href').split(':')[0] });
  });

  /* ---------- logowanie i panel ---------- */
  function adminMarker() { return /(?:^|;\s*)np_admin=1/.test(D.cookie); }
  function markLock() {
    if (!adminMarker()) return;
    var l = $('.np-lock'); if (l) { l.classList.add('np-lock-on'); l.setAttribute('aria-label', 'Otwórz panel'); l.innerHTML = '<span>Panel</span>'; }
  }
  function loadPanel() {
    if (W.NP_CMS) return W.NP_CMS.open();
    var css = D.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/css/cms.css'; D.head.appendChild(css);
    var q = ['/assets/js/dane.js', '/assets/js/render.js', '/assets/js/cms-schema.js', '/assets/js/cms.js'];
    (function next() {
      if (!q.length) return W.NP_CMS && W.NP_CMS.open();
      var s = D.createElement('script'); s.src = q.shift(); s.onload = next; s.onerror = function () { alert('Nie udało się wczytać panelu. Odśwież stronę.'); }; D.head.appendChild(s);
    })();
  }
  function loginDialog(from) {
    var d = D.createElement('dialog'); d.className = 'np-dlg np-login'; d.setAttribute('aria-labelledby', 'np-lg-h');
    d.innerHTML = '<form class="np-dlg-b" method="dialog" novalidate><h2 id="np-lg-h">Panel administratora</h2><div class="np-fld"><label for="np-lg-p">Hasło</label><input id="np-lg-p" type="password" autocomplete="current-password" required></div>' +
      '<p class="np-err" role="alert" data-lgerr></p><div class="np-actions"><button class="np-btn" type="submit">Zaloguj</button><button class="np-btn np-btn-line" type="button" data-cancel>Anuluj</button></div></form>';
    D.body.appendChild(d); d.showModal(); $('#np-lg-p', d).focus();
    var f = $('form', d), er = $('[data-lgerr]', d);
    function close() { d.close(); d.remove(); from && from.focus(); }
    d.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    $('[data-cancel]', d).addEventListener('click', close);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var pw = $('#np-lg-p', d).value; if (!pw) { er.textContent = 'Wpisz hasło.'; return; }
      er.textContent = 'Logowanie…';
      api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ haslo: pw }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { r: r, j: j }; }); })
        .then(function (x) {
          if (x.r.ok) { close(); markLock(); loadPanel(); }
          else if (x.r.status === 404 || x.r.status === 405) { close(); loadPanel(); } // brak API (np. plik z dysku) → tryb demonstracyjny
          else er.textContent = x.j.blad || 'Nie udało się zalogować.';
        })
        .catch(function () { close(); W.NP_DEMO = true; loadPanel(); }); // API nie odpowiada → tryb demonstracyjny
    });
  }
  function panelEntry(from) {
    if (adminMarker()) {
      api('/api/sesja', {}, 6000).then(function (r) { return r.ok ? loadPanel() : loginDialog(from); }).catch(function () { loginDialog(from); });
    } else loginDialog(from);
  }
  D.addEventListener('click', function (e) { var b = e.target.closest('[data-panel]'); if (b) panelEntry(b); });

  /* ---------- start ---------- */
  function init() {
    hdr(); menu(); observe(); dialogs(); slider(); video(); topbar(); insta(); form(); markLock(); banner(false);
    try { var fl = sessionStorage.getItem('np_flash'); if (fl !== null) { sessionStorage.removeItem('np_flash'); var fe = fl && D.getElementById(fl); if (fe) { fe.classList.add('cmsp-flash'); setTimeout(function () { fe.classList.remove('cmsp-flash'); }, 2800); } } } catch (e) {}
    if (location.hash === '#panel' || /[?&]panel\b/.test(location.search)) panelEntry($('.np-lock'));
  }
  // ponowne podpięcie po odświeżeniu treści z panelu
  W.NP_SITE = { observe: observe, upd: sliderUpd, track: track, markLock: markLock };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
