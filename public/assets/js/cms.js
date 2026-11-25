/* Panel administracyjny (CMS) — ładowany dopiero po kliknięciu kłódki / #panel. Interfejs po polsku. Klasy z prefiksem .cmsp- */
(function () {
  'use strict';
  var W = window, D = document, NPR = W.NPR, DANE = W.NP_DANE, SC = W.NP_SCHEMA, api = W.NP_API;
  var $ = function (s, r) { return (r || D).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || D).querySelectorAll(s)); };
  var esc = NPR.esc, get = NPR.get, set = NPR.set, clone = NPR.clone;
  var S = { st: null, demo: false, page: 'pulpit', saving: false, pending: false, dirty: false, timer: 0, previews: [], lists: {}, filt: {}, px0: '', t: 0 };
  var UID = 0, root, main;

  /* ---------- tryb demonstracyjny: IndexedDB ---------- */
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('np-cms', 1); r.onupgradeneeded = function () { r.result.createObjectStore('k'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function idbGet() { return idb().then(function (db) { return new Promise(function (res) { var q = db.transaction('k').objectStore('k').get('state'); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }).catch(function () { return null; }); }
  function idbPut(v) { return idb().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction('k', 'readwrite'); tx.objectStore('k').put(v, 'state'); tx.oncomplete = res; tx.onerror = function () { rej(tx.error); }; }); }); }

  /* ---------- wczytanie i zapis ---------- */
  function load() {
    if (W.NP_DEMO) { S.demo = true; return idbGet().then(function (v) { S.st = NPR.merge(DANE, v || {}); }); }
    return api('/api/tresci', {}, 8000).then(function (r) {
      var ct = r.headers.get('Content-Type') || '';
      if (r.status === 404 || r.status === 405 || r.status === 501 || (r.ok && ct.indexOf('json') < 0)) throw { demo: 1 };
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw { msg: j.blad || 'Serwer chwilowo nie odpowiada — spróbuj ponownie.' }; });
      return r.json().then(function (j) { S.st = NPR.merge(DANE, j); S.demo = false; });
    }).catch(function (e) {
      if (e && e.msg) throw e;
      if (e && e.name === 'AbortError') throw { msg: 'Serwer chwilowo nie odpowiada — spróbuj ponownie.' };
      S.demo = true; return idbGet().then(function (v) { S.st = NPR.merge(DANE, v || {}); });
    });
  }
  function indicate(mode, e) {
    var b = $('.cmsp-save', root); if (!b) return;
    var t = { ok: ['Zapisano ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }), 'ok'], wait: ['Niezapisane zmiany…', 'wait'], save: ['Zapisywanie…', 'wait'] }[mode];
    if (mode === 'err') {
      var m = e && e.status === 401 ? 'Sesja wygasła — zaloguj się ponownie' : (e && e.msg) || 'Serwer chwilowo nie odpowiada — spróbuj ponownie';
      b.className = 'cmsp-save cmsp-err'; b.innerHTML = '<i class="cmsp-dot"></i><b>' + esc(m) + '</b> <button type="button" class="cmsp-b2" data-act="' + (e && e.status === 401 ? 'reload' : 'retry') + '">' + (e && e.status === 401 ? 'Zaloguj' : 'Ponów') + '</button>'; return;
    }
    b.className = 'cmsp-save cmsp-' + t[1]; b.innerHTML = '<i class="cmsp-dot"></i><b>' + t[0] + '</b>';
  }
  function save() {
    if (S.saving) { S.pending = true; return Promise.resolve(); }
    clearTimeout(S.timer); S.saving = true; indicate('save');
    var p = S.demo ? idbPut(S.st) : api('/api/tresci', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S.st) }, 10000)
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw { msg: j.blad, status: r.status }; }); });
    return p.then(function () { S.saving = false; S.dirty = false; indicate('ok'); if (S.pending) { S.pending = false; return save(); } })
      .catch(function (e) { S.saving = false; if (e && e.name === 'AbortError') e = { msg: 'Serwer chwilowo nie odpowiada — spróbuj ponownie.' }; indicate('err', e); throw e; });
  }
  function touched() { S.dirty = true; indicate('wait'); clearTimeout(S.timer); S.timer = setTimeout(function () { save().catch(function () {}); }, 1200); updatePreviews(); }
  function flush() { return S.dirty ? save() : Promise.resolve(); }
  function toast(m) { var t = $('.cmsp-toast', root); t.textContent = m; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 3200); }

  /* ---------- podgląd sekcji (miniatura na żywo) ---------- */
  var PREV_CSS = '.np-prev .np-hdr,.np-prev .np-mbar,.np-prev .np-lock,.np-prev .np-dots,.np-prev .np-top{display:none!important}html.np-prev{scroll-snap-type:none;scroll-behavior:auto;--hdr:0px}.np-prev body{overflow:hidden;padding:0}.np-prev [data-rv]{opacity:1!important;transform:none!important}.np-prev .np-sec{--pad:2.5rem;min-height:720px}.np-hl{outline:4px solid #ff4d00!important;outline-offset:6px;background-color:rgba(255,77,0,.1)}.np-prev *{animation:none!important}';
  function Preview(box, pageKey, sec, getSt, now) {
    var self = this, fr = D.createElement('iframe'), ready = false, hlEl = null;
    fr.className = 'cmsp-if'; fr.setAttribute('title', 'Podgląd sekcji'); fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1; fr.width = 1280; fr.height = 720;
    function body() { try { return NPR.renderBody(getSt(), pageKey, { preview: true }); } catch (e) { return '<p>Błąd podglądu</p>'; } }
    fr.srcdoc = '<!doctype html><html lang="pl" class="js np-prev"><head><meta charset="utf-8"><base href="/"><link rel="stylesheet" href="/assets/css/krytyczny.css"><link rel="stylesheet" href="/assets/css/site.css"><style>' + PREV_CSS + '</style></head><body>' + body() + '</body></html>';
    function scroll() { try { var d = fr.contentDocument, el = sec && d.getElementById(sec); d.documentElement.scrollTop = el ? el.offsetTop : 0; d.body.scrollTop = el ? el.offsetTop : 0; } catch (e) {} }
    fr.addEventListener('load', function () { ready = true; scroll(); });
    function fit() { var s = box.clientWidth / 1280 || 0.3; fr.style.transform = 'scale(' + s + ')'; box.style.height = Math.round(720 * s) + 'px'; }
    box.innerHTML = ''; box.appendChild(fr); fit();
    var ro = W.ResizeObserver ? new ResizeObserver(fit) : null; ro && ro.observe(box);
    this.update = function () { if (!ready) return; try { fr.contentDocument.body.innerHTML = body(); hlEl = null; scroll(); } catch (e) {} };
    this.hl = function (path) {
      try {
        var d = fr.contentDocument; if (hlEl) hlEl.classList.remove('np-hl'); hlEl = path ? d.querySelector('[data-f="' + path + '"]') : null;
        if (hlEl) { hlEl.classList.add('np-hl'); hlEl.scrollIntoView({ block: 'center' }); }
      } catch (e) {}
    };
    this.destroy = function () { ro && ro.disconnect(); };
  }
  function mountPreviews(scope, pageKey) {
    var mk = function (box) {
      var bi = box.getAttribute('data-bi'), pg = SC.pages[S.page], bl = pg.blocks[bi];
      var p = new Preview(box, pg.page, box.getAttribute('data-sec') || bl.sec, function () { return S.st; });
      S.previews.push(p); box._p = p;
    };
    var boxes = $$('.cmsp-prev[data-bi]', scope);
    if (!W.IntersectionObserver) return boxes.forEach(mk);
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !e.target._p) { mk(e.target); io.unobserve(e.target); } }); }, { rootMargin: '300px' });
    boxes.forEach(function (b) { io.observe(b); });
    S.io = io;
  }
  function updatePreviews() { clearTimeout(updatePreviews._t); updatePreviews._t = setTimeout(function () { S.previews.forEach(function (p) { p.update(); }); }, 150); }
  function killPreviews() { S.previews.forEach(function (p) { p.destroy(); }); S.previews = []; S.io && S.io.disconnect(); }

  /* ---------- pola formularzy ---------- */
  var BGT = [['zdjecie', 'Zdjęcie'], ['wideo', 'Wideo'], ['kolor', 'Kolor']];
  function optList(f) {
    if (f.opts === 'kategorie') return [''].concat((S.st.strony.portfolio.kategorie || []).map(function (k) { return k.nazwa; })).map(function (n) { return [n, n || '— brak —']; });
    return (f.opts || []).map(function (o) { return Array.isArray(o) ? o : [o, o]; });
  }
  function fld(f, rootObj, pre) {
    var id = 'cmsp-f' + (++UID), v = get(rootObj, f.p), hp = (pre || '') + f.p, at = ' id="' + id + '" data-p="' + esc(f.p) + '" data-hp="' + esc(hp) + '"';
    var lab = '<label for="' + id + '">' + esc(f.l) + (f.req ? ' <span aria-hidden="true">*</span>' : '') + '</label>', hint = f.hint ? '<small class="cmsp-hint">' + esc(f.hint) + '</small>' : '';
    if (f.t === 'check') return '<div class="cmsp-fld cmsp-chk"><label><input type="checkbox"' + at + ' data-t="check"' + (v ? ' checked' : '') + '> ' + esc(f.l) + '</label>' + hint + '</div>';
    if (f.t === 'area') return '<div class="cmsp-fld">' + lab + '<textarea' + at + ' rows="' + (f.rows || 4) + '"' + (f.max ? ' maxlength="' + f.max + '"' : '') + '>' + esc(v == null ? '' : v) + '</textarea>' + hint + '</div>';
    if (f.t === 'sel') return '<div class="cmsp-fld">' + lab + '<select' + at + (f.num ? ' data-num="1"' : '') + '>' + optList(f).map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v == null ? '' : v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>' + hint + '</div>';
    if (f.t === 'range') return '<div class="cmsp-fld">' + lab + '<div class="cmsp-rng"><input type="range" min="0" max="80" step="5"' + at + ' data-num="1" value="' + (v || 0) + '"><output>' + (v || 0) + '%</output></div>' + hint + '</div>';
    if (f.t === 'color') return '<div class="cmsp-fld">' + lab + '<input type="color"' + at + ' value="' + esc(/^#[0-9a-fA-F]{6}$/.test(v) ? v : '#F4F1EC') + '"></div>';
    if (f.t === 'img') {
      return '<div class="cmsp-fld cmsp-img">' + '<span class="cmsp-lab">' + esc(f.l) + (f.req ? ' <span aria-hidden="true">*</span>' : '') + '</span><div class="cmsp-imgrow"><div class="cmsp-thumb">' + (v ? '<img src="' + esc(v) + '" alt="">' : '<span>brak</span>') + '</div>' +
        '<div class="cmsp-imgb"><button type="button" class="cmsp-b2" data-upl>Wgraj z dysku</button> <button type="button" class="cmsp-b2" data-rmimg>Usuń zdjęcie</button><input type="file" accept="image/*" hidden></div></div>' +
        '<label class="cmsp-sub" for="' + id + '">lub adres URL zdjęcia</label><input type="text"' + at + ' value="' + esc(v || '') + '" placeholder="/assets/img/… lub https://…">' + hint + '</div>';
    }
    if (f.t === 'bg') {
      var bg = v || {}, p = f.p + '.', t = bg.typ || 'zdjecie';
      return '<fieldset class="cmsp-bg" data-typ="' + esc(t) + '"><legend>' + esc(f.l) + '</legend>' +
        fld({ p: p + 'typ', l: 'Rodzaj tła', t: 'sel', opts: BGT, bgtyp: 1 }, rootObj, pre) +
        '<div class="cmsp-bg-img">' + fld({ p: p + 'img', l: 'Zdjęcie w tle', t: 'img' }, rootObj, pre) + fld({ p: p + 'alt', l: 'Opis zdjęcia (alt)', t: 'text' }, rootObj, pre) + '</div>' +
        '<div class="cmsp-bg-vid">' + fld({ p: p + 'wideo', l: 'Adres pliku wideo MP4 (wyciszone, z przyciskiem pauzy; na telefonie i przy wolnym łączu pokazuje się plakat)', t: 'text' }, rootObj, pre) + fld({ p: p + 'plakat', l: 'Plakat (poster) wideo', t: 'img' }, rootObj, pre) + '</div>' +
        '<div class="cmsp-bg-col">' + fld({ p: p + 'kolor', l: 'Kolor tła', t: 'color' }, rootObj, pre) + '</div>' +
        '<div class="cmsp-bg-ov">' + fld({ p: p + 'ov', l: 'Przyciemnienie tła', t: 'range' }, rootObj, pre) + '</div>' +
        fld({ p: p + 'txt', l: 'Kolor tekstu na tym tle', t: 'sel', opts: [['jasny', 'Jasny (na ciemnym tle)'], ['ciemny', 'Ciemny (na jasnym tle)']] }, rootObj, pre) + '</fieldset>';
    }
    return '<div class="cmsp-fld">' + lab + '<input type="' + (f.t || 'text') + '"' + at + ' value="' + esc(v == null ? '' : v) + '"' + (f.max ? ' maxlength="' + f.max + '"' : '') + (f.pattern ? ' pattern="' + esc(f.pattern) + '"' : '') + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + (f.datalist ? ' list="cmsp-dl-' + f.datalist + '"' : '') + '>' + hint + '</div>';
  }
  function readVal(el) {
    if (el.type === 'checkbox') return el.checked;
    if (el.getAttribute('data-num')) return Number(el.value);
    return el.value;
  }
  function afterEdit(el, scopeRoot) {
    if (el.type === 'range') { var o = el.parentNode.querySelector('output'); if (o) o.textContent = el.value + '%'; }
    var th = el.closest('.cmsp-img'); if (th) { var box = $('.cmsp-thumb', th); box.innerHTML = el.value ? '<img src="' + esc(el.value) + '" alt="">' : '<span>brak</span>'; }
    var bg = el.closest('.cmsp-bg'); if (bg && /\.typ$/.test(el.getAttribute('data-p'))) bg.setAttribute('data-typ', el.value);
    var c = el.getAttribute('data-cnt'); if (c) { var n = $('[data-cn="' + c + '"]', scopeRoot); if (n) n.textContent = el.value.length; }
  }
  /* wgrywanie zdjęcia: zmniejszenie do ok. 1600 px w przeglądarce, zapis na serwerze (KV) albo data: w trybie demonstracyjnym */
  function resize(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, 1600 / Math.max(im.width, im.height)), c = D.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('Nie udało się przetworzyć zdjęcia.')); }, 'image/webp', 0.82);
      };
      im.onerror = function () { rej(new Error('Nie udało się odczytać pliku — wybierz zdjęcie JPG, PNG lub WebP.')); }; im.src = u;
    });
  }
  function upload(file) {
    return resize(file).then(function (blob) {
      if (S.demo) return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(blob); });
      return api('/api/zdjecia', { method: 'POST', headers: { 'Content-Type': blob.type || 'image/webp' }, body: blob }, 30000).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.blad || 'Nie udało się wgrać zdjęcia.'); return j.url; }); });
    });
  }
  // wspólna obsługa zdarzeń pól w kontenerze; obj() zwraca obiekt, do którego zapisujemy, onChange — reakcja
  function bindFields(box, obj, onChange, previewRef) {
    box.addEventListener('input', function (e) { var el = e.target.closest('[data-p]'); if (!el) return; set(obj(), el.getAttribute('data-p'), readVal(el)); afterEdit(el, box); onChange(el); });
    box.addEventListener('change', function (e) { var el = e.target.closest('[data-p]'); if (!el || el.type === 'text' || el.tagName === 'TEXTAREA') return; set(obj(), el.getAttribute('data-p'), readVal(el)); afterEdit(el, box); onChange(el); });
    box.addEventListener('click', function (e) {
      var up = e.target.closest('[data-upl]'), rm = e.target.closest('[data-rmimg]');
      if (up) { var f = $('input[type=file]', up.parentNode); f.value = ''; f.click(); }
      if (rm) { var inp = $('[data-p]', rm.closest('.cmsp-img')); inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    box.addEventListener('change', function (e) {
      if (e.target.type !== 'file') return; var f = e.target.files[0]; if (!f) return; var inp = $('[data-p]', e.target.closest('.cmsp-img')), th = $('.cmsp-thumb', e.target.closest('.cmsp-img'));
      th.innerHTML = '<span>Wgrywanie…</span>';
      upload(f).then(function (url) { inp.value = url; inp.dispatchEvent(new Event('input', { bubbles: true })); toast('Zdjęcie wgrane.'); }).catch(function (er) { th.innerHTML = '<span>błąd</span>'; toast(er.message || 'Nie udało się wgrać zdjęcia.'); });
    });
    var hl = function (e) { var el = e.target.closest && e.target.closest('[data-hp]'); if (el && previewRef()) previewRef().hl(el.getAttribute('data-hp')); };
    box.addEventListener('focusin', hl); box.addEventListener('mouseover', hl);
  }

  /* ---------- listy (kolekcje) ---------- */
  var BADGE = { aktywna: ['Aktywna', 'g'], zaplanowana: ['Zaplanowana', 'y'], zakonczona: ['Zakończona', 'x'], wstrzymana: ['Wstrzymana', 'x'] };
  function titleOf(L, it) { return it[L.title] || '(bez tytułu)'; }
  function sumOf(L, it) {
    if (L.status) { return [it.od ? 'od ' + NPR.fmtDate(it.od) : '', it['do'] ? 'do ' + NPR.fmtDate(it['do']) : 'bez końca'].filter(Boolean).join(' ') ; }
    return (L.sumf || []).map(function (k) { return NPR.clean(it[k]) ? it[k] : ''; }).filter(Boolean).join(' · ');
  }
  function listHtml(L) {
    var arr = get(S.st, L.p) || [], f = S.filt[L.p] || 'all';
    var cnt = { all: arr.length, aktywna: 0, zaplanowana: 0, zakonczona: 0, wstrzymana: 0 };
    if (L.status) arr.forEach(function (it) { cnt[NPR.status(it)]++; });
    var h = '<div class="cmsp-list" data-lp="' + esc(L.p) + '"><div class="cmsp-lh"><h3>' + esc(L.l) + ' <span class="cmsp-n">' + arr.length + '</span>' + (L.status && cnt.aktywna ? ' <span class="cmsp-n cmsp-ng">' + cnt.aktywna + ' aktywne</span>' : '') + '</h3><button type="button" class="cmsp-b" data-a="add">' + esc(L.add) + '</button></div>';
    if (L.filters) h += '<div class="cmsp-flt" role="group" aria-label="Filtr">' + [['all', 'Wszystkie'], ['aktywna', 'Aktywne'], ['zaplanowana', 'Zaplanowane'], ['zakonczona', 'Zakończone'], ['wstrzymana', 'Wstrzymane']].map(function (x) { return '<button type="button" class="cmsp-chip" aria-pressed="' + (f === x[0]) + '" data-flt="' + x[0] + '">' + x[1] + ' (' + cnt[x[0]] + ')</button>'; }).join('') + '</div>';
    var rows = arr.map(function (it, i) {
      var st = L.status ? NPR.status(it) : '', hid = L.hide && it[L.hide] === false;
      if (f !== 'all' && st !== f) return '';
      var th = L.thumb && it[L.thumb] ? '<img src="' + esc(it[L.thumb]) + '" alt="">' : '<span>' + (i + 1) + '</span>';
      return '<li class="cmsp-row' + (hid ? ' cmsp-off' : '') + '" data-i="' + i + '"><span class="cmsp-ord"><button type="button" data-a="up" aria-label="Przesuń w górę"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" data-a="down" aria-label="Przesuń w dół"' + (i === arr.length - 1 ? ' disabled' : '') + '>▼</button></span>' +
        '<span class="cmsp-th">' + th + '</span><span class="cmsp-rt"><strong>' + esc(NPR.clean(titleOf(L, it)).slice(0, 90) || titleOf(L, it)) + '</strong><small>' + esc(sumOf(L, it)) + '</small></span>' +
        (L.status ? '<span class="cmsp-bd cmsp-' + BADGE[st][1] + '">' + BADGE[st][0] + '</span>' : '') + (hid ? '<span class="cmsp-bd cmsp-x">Ukryta</span>' : '') +
        '<span class="cmsp-ra">' + (L.hide ? '<button type="button" class="cmsp-b2" data-a="hide">' + (hid ? 'Pokaż' : 'Ukryj') + '</button>' : '') + '<button type="button" class="cmsp-b2" data-a="dup">Duplikuj</button><button type="button" class="cmsp-b2" data-a="edit">Edytuj</button><button type="button" class="cmsp-b2 cmsp-danger" data-a="del">Usuń</button></span></li>';
    }).join('');
    h += rows ? '<ul class="cmsp-rows">' + rows + '</ul>' : '<p class="cmsp-empty">Brak pozycji. Kliknij „' + esc(L.add) + '”.</p>';
    return h + '</div>';
  }
  function refreshList(L) { var c = $('[data-lp="' + L.p + '"]', main); if (c) c.outerHTML = listHtml(L); refreshNavCounts(); }
  function confirmBtn(btn, fn) {
    if (btn.getAttribute('data-c')) { clearTimeout(btn._t); fn(); return; }
    var old = btn.textContent; btn.setAttribute('data-c', '1'); btn.textContent = 'Na pewno?';
    btn._t = setTimeout(function () { btn.removeAttribute('data-c'); btn.textContent = old; }, 3500);
  }
  function listClick(e) {
    var box = e.target.closest('[data-lp]'); if (!box) return;
    var L = S.lists[box.getAttribute('data-lp')], arr = get(S.st, L.p), a = e.target.closest('[data-a]'), fl = e.target.closest('[data-flt]');
    if (fl) { S.filt[L.p] = fl.getAttribute('data-flt'); return refreshList(L); }
    if (!a) return; var act = a.getAttribute('data-a'), row = a.closest('.cmsp-row'), i = row ? Number(row.getAttribute('data-i')) : -1;
    if (act === 'add') return openModal(L, -1);
    if (act === 'edit') return openModal(L, i);
    if (act === 'up' || act === 'down') { var j = act === 'up' ? i - 1 : i + 1; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; touched(); return refreshList(L); }
    if (act === 'hide') { arr[i][L.hide] = arr[i][L.hide] === false; touched(); return refreshList(L); }
    if (act === 'dup') { var c = clone(arr[i]); if (L.title && c[L.title]) c[L.title] += ' (kopia)'; if (c.id) c.id = ''; if (L.before) L.before(c, arr); arr.splice(i + 1, 0, c); touched(); toast('Zduplikowano.'); return refreshList(L); }
    if (act === 'del') return confirmBtn(a, function () { arr.splice(i, 1); touched(); toast('Usunięto.'); refreshList(L); });
  }

  /* ---------- okno edycji elementu listy (dwie kolumny: formularz + podgląd na żywo) ---------- */
  function openModal(L, i) {
    var arr = get(S.st, L.p), edit = i >= 0, orig = edit ? clone(arr[i]) : null, draft = edit ? clone(arr[i]) : L.make(), prev;
    var pg = SC.pages[S.page], idx = edit ? i : (L.newTop ? 0 : arr.length), pre = L.p + '.' + idx + '.';
    var d = D.createElement('dialog'); d.className = 'cmsp-mdl'; d.setAttribute('aria-labelledby', 'cmsp-mt');
    d.innerHTML = '<div class="cmsp-mc"><form class="cmsp-mf" novalidate><h2 id="cmsp-mt">' + (edit ? 'Edytuj: ' : 'Dodaj: ') + esc(L.name) + '</h2>' + L.fields.map(function (f) { return fld(f, draft, pre).replace(/data-hp="[^"]*"/, function (m) { return m; }); }).join('') +
      '<p class="cmsp-merr" role="alert"></p><div class="cmsp-mb"><button type="submit" class="cmsp-b">' + (edit ? 'Zapisz zmiany' : 'Dodaj') + '</button><button type="button" class="cmsp-b2" data-cancel>Anuluj</button>' + (edit ? '<button type="button" class="cmsp-b2 cmsp-danger" data-del>Usuń</button>' : '') + '</div></form>' +
      '<aside class="cmsp-mp"><details open><summary>Podgląd tej sekcji na żywo</summary><div class="cmsp-prev"></div></details></aside></div>';
    root.appendChild(d); d.showModal();
    // modalne pola mają ścieżki względne do elementu (draft), a do podświetlenia — bezwzględne
    $$('[data-hp]', d).forEach(function (el) { el.setAttribute('data-hp', pre + el.getAttribute('data-p')); });
    function getSt() { var t = clone(S.st), a = get(t, L.p); if (edit) a[i] = draft; else if (L.newTop) a.unshift(draft); else a.push(draft); return t; }
    var pbox = $('.cmsp-prev', d); prev = new Preview(pbox, pg.page, (L.secOf ? L.secOf(draft) : null) || (pg.blocks.filter(function (b) { return (b.lists || []).indexOf(L) >= 0; })[0] || {}).sec, getSt);
    var upd = function () { clearTimeout(upd._t); upd._t = setTimeout(function () { prev.update(); }, 120); };
    bindFields(d, function () { return draft; }, upd, function () { return prev; });
    var form = $('form', d), er = $('.cmsp-merr', d);
    function close() { prev.destroy(); d.close(); d.remove(); }
    d.addEventListener('cancel', function (ev) { ev.preventDefault(); close(); });
    $('[data-cancel]', d).addEventListener('click', close);
    var del = $('[data-del]', d); if (del) del.addEventListener('click', function () { confirmBtn(del, function () { arr.splice(i, 1); touched(); close(); toast('Usunięto.'); render(S.page); }); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var miss = L.fields.filter(function (f) { return f.req && !String(get(draft, f.p) || '').trim(); })[0];
      if (miss) { er.textContent = 'Uzupełnij pole: ' + miss.l.replace(/\s*—.*$/, '') + '.'; var inp = $('[data-p="' + miss.p + '"]', d); inp && inp.focus(); return; }
      (L.req || []).forEach(function () {});
      if (draft.od && draft['do'] && draft['do'] < draft.od) { er.textContent = 'Data końca nie może być wcześniejsza niż data startu.'; return; }
      if (L.before) L.before(draft, arr);
      if (edit) arr[i] = draft; else if (L.newTop) arr.unshift(draft); else arr.push(draft);
      if (L.after) L.after(S.st, orig, draft);
      S.dirty = true; close(); save().then(function () { toast(edit ? 'Zapisano zmiany.' : 'Dodano. Zmiana jest już na stronie.'); }).catch(function () {}); render(S.page);
    });
    var first = $('input:not([type=file]):not([type=hidden]),textarea,select', form); first && first.focus();
  }

  /* ---------- nawigacja i strony panelu ---------- */
  function count(id) {
    var st = S.st, n = {
      aktualnosci: NPR.aktywneWpisy(st).length, oferta: (st.pakiety || []).length, cennik: (st.strony.cennik.pozycje || []).length, portfolio: (st.strony.portfolio.zdjecia || []).length,
      opinie: NPR.opinieWidoczne(st).length, faq: (st.strony.faq.pytania || []).length
    }[id];
    return n == null ? '' : n;
  }
  function navHtml() {
    return SC.nav.map(function (g) {
      return '<div class="cmsp-ng"><h2>' + esc(g.g) + '</h2>' + g.items.map(function (it) {
        var n = count(it[0]);
        return '<button type="button" data-go="' + it[0] + '"' + (S.page === it[0] ? ' aria-current="page"' : '') + '>' + esc(it[1]) + (n !== '' ? ' <span class="cmsp-n' + (it[0] === 'aktualnosci' && n ? ' cmsp-ng2' : '') + '">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    }).join('');
  }
  function refreshNavCounts() { var n = $('.cmsp-nav', root); if (n) n.innerHTML = navHtml(); }
  function pageHead(id, t, d, pk, sec) {
    return '<div class="cmsp-ph"><div><h1 id="cmsp-h1" tabindex="-1">' + esc(t) + '</h1><p>' + esc(d || '') + '</p></div>' + (pk ? '<button type="button" class="cmsp-b2" data-act="show" data-pg="' + pk + '" data-sec="' + (sec || '') + '">Zobacz na stronie</button>' : '') + '</div>';
  }
  function secLabel(b) { return b.t; }
  function renderSchemaPage(id) {
    var pg = SC.pages[id], h = pageHead(id, pg.t, pg.d, pg.page, (pg.blocks[0] || {}).sec) + '<datalist id="cmsp-dl-kat">' + uniq((S.st.strony.cennik.pozycje || []).map(function (x) { return x.kat; })).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('') + '</datalist>';
    pg.blocks.forEach(function (b, bi) {
      h += '<section class="cmsp-blk" data-bi="' + bi + '"><div class="cmsp-bh"><h2>' + esc(b.t) + '</h2><button type="button" class="cmsp-b2" data-act="show" data-pg="' + pg.page + '" data-sec="' + (b.sec || '') + '">Pokaż na stronie</button></div>' +
        '<div class="cmsp-pcard"><p>Ta zmiana dotyczy sekcji: <strong>' + esc(secLabel(b)) + '</strong></p><div class="cmsp-prev" data-bi="' + bi + '" data-sec="' + (b.sec || '') + '"></div></div>' +
        (b.note ? '<p class="cmsp-note">' + esc(b.note) + '</p>' : '') + '<div class="cmsp-fields" data-bi="' + bi + '">' + (b.fields || []).map(function (f) { return fld(f, S.st); }).join('') + '</div>' + (b.custom ? CUSTOM[b.custom]() : '');
      (b.lists || []).forEach(function (L) { S.lists[L.p] = L; h += listHtml(L); });
      h += '</section>';
    });
    return h;
  }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }); }
  function render(id) {
    killPreviews(); S.page = id; S.lists = {};
    var fn = CUSTOM_PAGES[id]; main.innerHTML = fn ? fn() : renderSchemaPage(id);
    refreshNavCounts();
    if (!fn) mountPreviews(main);
    if (CUSTOM_PAGES_AFTER[id]) CUSTOM_PAGES_AFTER[id]();
    main.scrollTop = 0; var h1 = $('#cmsp-h1', main); h1 && h1.focus({ preventScroll: true });
  }

  /* ---------- strony własne ---------- */
  var CUSTOM = {
    pikselInfo: function () {
      var px = NPR.pixelId(S.st);
      return '<div class="cmsp-card"><p><strong>Stan:</strong> ' + (px ? '<span class="cmsp-bd cmsp-g">Aktywny — ID ' + esc(px) + '</span>' : '<span class="cmsp-bd cmsp-x">Wyłączony (brak poprawnego ID)</span>') + '</p>' +
        '<h3>Jak to działa</h3><ul><li>Piksel ładuje się <strong>dopiero po kliknięciu „Akceptuję”</strong> w banerze cookies. Przycisk „Odrzuć” jest równie widoczny, a odmowa nie blokuje strony.</li>' +
        '<li>Odwiedzający może zmienić decyzję przyciskiem „Ustawienia cookies” w stopce (wycofanie zgody usuwa ciasteczka _fbp i _fbc).</li>' +
        '<li>Zdarzenia: <strong>PageView</strong> (każda podstrona), <strong>ViewContent</strong> (Oferta, Cennik), <strong>Contact</strong> (kliknięcie telefonu lub e-maila), <strong>Lead</strong> (wysłanie formularza — bez treści wiadomości i danych osobowych).</li>' +
        '<li>Polityka prywatności uzupełnia się sama o informację o Meta, wspólnym administrowaniu i transferze do USA.</li></ul>' +
        '<h3>Test po wdrożeniu</h3><ol><li>Wpisz ID, poczekaj na „Zapisano”, otwórz stronę w oknie incognito i kliknij „Akceptuję”.</li><li>W Meta Events Manager → Test Events wpisz adres strony — pojawi się PageView.</li><li>Wyślij testowe zapytanie z formularza — pojawi się Lead.</li></ol></div>';
    }
  };
  var CUSTOM_PAGES = {}, CUSTOM_PAGES_AFTER = {};

  CUSTOM_PAGES.pulpit = function () {
    var st = S.st, now = NPR.today(), wp = st.strony.aktualnosci.wpisy || [], akt = wp.filter(function (w) { return NPR.status(w) === 'aktywna'; }).length, zap = wp.filter(function (w) { return NPR.status(w) === 'zaplanowana'; }).length;
    var px = NPR.pixelId(st), tile = function (go, n, l, s) { return '<button type="button" class="cmsp-tile" data-go="' + go + '"><strong>' + n + '</strong><span>' + l + '</span>' + (s ? '<small>' + s + '</small>' : '') + '</button>'; };
    var h = '<div class="cmsp-ph"><div><h1 id="cmsp-h1" tabindex="-1">Dzień dobry!</h1><p>Co chcesz dziś zmienić na stronie?</p></div></div><div class="cmsp-quick"><button type="button" class="cmsp-b" data-q="akt">+ Aktualność</button><button type="button" class="cmsp-b" data-q="zdj">+ Zdjęcie do galerii</button><button type="button" class="cmsp-b2" data-go="cennik">Cennik</button><button type="button" class="cmsp-b2" data-go="regulamin">Regulamin</button></div>' +
      '<div class="cmsp-tiles">' + tile('aktualnosci', akt, 'aktualności na stronie', zap ? '+ ' + zap + ' zaplanowane' : '') + tile('oferta', (st.pakiety || []).length, 'pakiety w ofercie') + tile('portfolio', (st.strony.portfolio.zdjecia || []).length, 'zdjęcia w galerii') + tile('opinie', NPR.opinieWidoczne(st).length, 'opinie klientów', 'lista startuje pusta') + tile('faq', (st.strony.faq.pytania || []).length, 'pytań w FAQ') + tile('piksel', px ? 'włączony' : 'wyłączony', 'Piksel Facebooka', px ? 'ID ' + px : 'wpisz ID w ustawieniach') + '</div>';
    // harmonogram (Gantt): 30 dni wstecz, 90 naprzód
    var base = new Date(now + 'T00:00:00'), a0 = -30, span = 120, day = function (iso) { return Math.round((new Date(iso + 'T00:00:00') - base) / 864e5); };
    var bars = wp.filter(function (w) { return w.od || w['do']; }).map(function (w) {
      var s = Math.max(a0, w.od ? day(w.od) : a0), e = Math.min(a0 + span, w['do'] ? day(w['do']) : a0 + span), stt = NPR.status(w);
      if (e < a0 || s > a0 + span) return '';
      return '<div class="cmsp-gr"><span class="cmsp-gl">' + esc(w.tytul || '(bez tytułu)') + '</span><div class="cmsp-gt"><i class="cmsp-gb cmsp-' + BADGE[stt][1] + '" style="left:' + ((s - a0) / span * 100) + '%;width:' + Math.max(1.5, (e - s + 1) / span * 100) + '%"></i></div></div>';
    }).join('');
    h += '<section class="cmsp-blk"><h2>Harmonogram aktualności</h2>' + (bars ? '<div class="cmsp-gantt"><i class="cmsp-today" style="left:' + ((0 - a0) / span * 100) + '%"><b>dzisiaj</b></i>' + bars + '</div><p class="cmsp-leg"><span class="cmsp-bd cmsp-g">aktywne</span> <span class="cmsp-bd cmsp-y">zaplanowane</span> <span class="cmsp-bd cmsp-x">zakończone / wstrzymane</span></p>' : '<p class="cmsp-empty">Brak aktualności z terminem. Dodaj pierwszą, a pojawi się tutaj.</p>') + '</section>';
    var ev = []; wp.forEach(function (w) { if (NPR.status(w) === 'wstrzymana') return; if (w.od && w.od >= now && day(w.od) <= 45) ev.push([w.od, 'pojawi się na stronie: ' + w.tytul]); if (w['do'] && w['do'] >= now && day(w['do']) <= 45) ev.push([w['do'], 'zniknie ze strony (ostatni dzień): ' + w.tytul]); });
    ev.sort(function (a, b) { return a[0] < b[0] ? -1 : 1; });
    h += '<section class="cmsp-blk"><h2>Najbliższe 45 dni</h2>' + (ev.length ? '<ul class="cmsp-ev">' + ev.map(function (x) { return '<li><strong>' + esc(NPR.fmtDate(x[0])) + '</strong> — ' + esc(x[1]) + '</li>'; }).join('') + '</ul>' : '<p class="cmsp-empty">Nic się nie zmienia w najbliższych dniach.</p>') + '</section>';
    return h;
  };
  CUSTOM_PAGES.sekcje = function () {
    var h = pageHead('sekcje', 'Sekcje strony i menu', 'Włączaj i wyłączaj podstrony oraz zmieniaj ich kolejność w menu. Strona główna i Polityka prywatności są zawsze włączone.', 'home', '') + '<ul class="cmsp-rows" id="cmsp-menu">';
    S.st.menu.forEach(function (m, i) {
      var vis = NPR.pageVisible(S.st, m.k), auto = m.on !== false && !vis;
      h += '<li class="cmsp-row' + (m.on === false ? ' cmsp-off' : '') + '" data-i="' + i + '"><span class="cmsp-ord"><button type="button" data-a="up" aria-label="Przesuń w górę"' + (i === 0 ? ' disabled' : '') + '>▲</button><button type="button" data-a="down" aria-label="Przesuń w dół"' + (i === S.st.menu.length - 1 ? ' disabled' : '') + '>▼</button></span>' +
        '<span class="cmsp-rt"><label class="cmsp-sub" for="cmsp-mn' + i + '">Nazwa w menu</label><input id="cmsp-mn' + i + '" type="text" value="' + esc(m.e) + '" data-mn="' + i + '"><small>' + NPR.pageByKey(m.k).url + (auto ? ' — chowa się automatycznie, dopóki nie ma treści' : '') + '</small></span>' +
        '<label class="cmsp-sw"><input type="checkbox" data-on="' + i + '"' + (m.on !== false ? ' checked' : '') + '> ' + (m.on !== false ? 'Widoczna' : 'Ukryta') + '</label><button type="button" class="cmsp-b2" data-go="' + (SC.pages[m.k] ? m.k : 'pulpit') + '">Edytuj tę sekcję</button></li>';
    });
    return h + '</ul>';
  };
  CUSTOM_PAGES_AFTER.sekcje = function () {
    var ul = $('#cmsp-menu', main);
    ul.addEventListener('click', function (e) { var a = e.target.closest('[data-a]'); if (!a) return; var i = Number(a.closest('.cmsp-row').getAttribute('data-i')), j = a.getAttribute('data-a') === 'up' ? i - 1 : i + 1, m = S.st.menu; if (j < 0 || j >= m.length) return; var t = m[i]; m[i] = m[j]; m[j] = t; touched(); render('sekcje'); });
    ul.addEventListener('input', function (e) { if (e.target.hasAttribute('data-mn')) { S.st.menu[e.target.getAttribute('data-mn')].e = e.target.value; touched(); } });
    ul.addEventListener('change', function (e) { if (e.target.hasAttribute('data-on')) { S.st.menu[e.target.getAttribute('data-on')].on = e.target.checked; touched(); render('sekcje'); } });
  };
  CUSTOM_PAGES.seo = function () {
    var h = pageHead('seo', 'SEO — tytuły i opisy stron', 'Tytuł do ok. 60 znaków, opis 140–160 znaków. Zmiana aktualizuje też dane dla Google i podgląd w wynikach wyszukiwania.', '', '');
    NPR.PAGES.forEach(function (p) {
      var s = S.st.strony[p.k].seo, id = p.k;
      h += '<section class="cmsp-blk"><h2>' + esc(p.crumb) + ' <small>' + esc(p.url) + '</small></h2><div class="cmsp-fld"><label for="seo-t-' + id + '">Tytuł strony (title) <span class="cmsp-cnt"><b data-cn="t' + id + '">' + s.title.length + '</b>/60</span></label><input id="seo-t-' + id + '" type="text" data-p="strony.' + p.k + '.seo.title" data-cnt="t' + id + '" value="' + esc(s.title) + '"></div>' +
        '<div class="cmsp-fld"><label for="seo-d-' + id + '">Opis (meta description) <span class="cmsp-cnt"><b data-cn="d' + id + '">' + s.desc.length + '</b> (zalecane 140–160)</span></label><textarea id="seo-d-' + id + '" rows="3" data-p="strony.' + p.k + '.seo.desc" data-cnt="d' + id + '">' + esc(s.desc) + '</textarea></div></section>';
    });
    return h;
  };
  CUSTOM_PAGES.jezyki = function () {
    var h = pageHead('jezyki', 'Wersje językowe', 'Polski jest zawsze włączony. Wyłączona wersja znika ze strony (przełącznik języka, menu, hreflang, sitemap), ale jej treści zostają w panelu.', '', '') + '<ul class="cmsp-rows" id="cmsp-lang">';
    S.st.jezyki.forEach(function (j, i) {
      h += '<li class="cmsp-row"><span class="cmsp-rt"><strong>' + esc(j.nazwa) + '</strong> <small>(' + esc(j.kod) + ')</small></span>' + (j.kod === 'pl' ? '<span class="cmsp-bd cmsp-g">Zawsze włączony</span>' : '<label class="cmsp-sw"><input type="checkbox" data-lg="' + i + '"' + (j.on ? ' checked' : '') + '> ' + (j.on ? 'Włączona' : 'Wyłączona') + '</label><button type="button" class="cmsp-b2 cmsp-danger" data-lgdel="' + i + '">Usuń</button>') + '</li>';
    });
    return h + '</ul><div class="cmsp-card"><h3>Dodaj język</h3><div class="cmsp-inl"><div class="cmsp-fld"><label for="lg-k">Kod (np. en)</label><input id="lg-k" maxlength="5"></div><div class="cmsp-fld"><label for="lg-n">Nazwa (np. English)</label><input id="lg-n"></div><button type="button" class="cmsp-b" data-lgadd>+ Dodaj język</button></div><p class="cmsp-note">Dodany język jest wyłączony. Przełącznik języka pojawia się dopiero, gdy włączone są co najmniej dwa języki, a treści w nowym języku muszą zostać przetłumaczone (osobny krok).</p></div>';
  };
  CUSTOM_PAGES_AFTER.jezyki = function () {
    main.addEventListener('change', langH = function (e) { if (e.target.hasAttribute('data-lg')) { S.st.jezyki[e.target.getAttribute('data-lg')].on = e.target.checked; touched(); render('jezyki'); } });
    main.onclick = function (e) {
      if (e.target.hasAttribute('data-lgdel')) { S.st.jezyki.splice(Number(e.target.getAttribute('data-lgdel')), 1); touched(); render('jezyki'); }
      if (e.target.hasAttribute('data-lgadd')) { var k = $('#lg-k').value.trim().toLowerCase(), n = $('#lg-n').value.trim(); if (!/^[a-z]{2,5}$/.test(k) || !n) return toast('Podaj kod (2–5 liter) i nazwę języka.'); if (S.st.jezyki.some(function (j) { return j.kod === k; })) return toast('Taki język już jest.'); S.st.jezyki.push({ kod: k, nazwa: n, on: false }); touched(); render('jezyki'); }
    };
  };
  var langH;
  CUSTOM_PAGES.haslo = function () {
    return pageHead('haslo', 'Zmiana hasła do panelu', 'Nowe hasło obowiązuje od razu; pozostałe zalogowane przeglądarki zostaną wylogowane. Hasło przechowywane jest wyłącznie jako hash na serwerze.', '', '') +
      (S.demo ? '<p class="cmsp-note">W trybie demonstracyjnym zmiana hasła jest niedostępna.</p>' : '') +
      '<form class="cmsp-card cmsp-pw" id="cmsp-pw" novalidate><div class="cmsp-fld"><label for="pw0">Obecne hasło</label><input id="pw0" type="password" autocomplete="current-password"></div><div class="cmsp-fld"><label for="pw1">Nowe hasło (min. 10 znaków)</label><input id="pw1" type="password" autocomplete="new-password"><div class="cmsp-meter" aria-hidden="true"><i></i></div><small id="pw-s" class="cmsp-hint">Siła hasła: —</small></div><div class="cmsp-fld"><label for="pw2">Powtórz nowe hasło</label><input id="pw2" type="password" autocomplete="new-password"></div><p class="cmsp-merr" role="alert" id="pw-e"></p><button type="submit" class="cmsp-b"' + (S.demo ? ' disabled' : '') + '>Zmień hasło</button></form>';
  };
  CUSTOM_PAGES_AFTER.haslo = function () {
    var f = $('#cmsp-pw'), p1 = $('#pw1'), er = $('#pw-e');
    p1.addEventListener('input', function () {
      var v = p1.value, sc = (v.length >= 10) + (v.length >= 14) + (/[a-z]/.test(v) && /[A-Z]/.test(v)) + /\d/.test(v) + /[^\w\s]/.test(v), t = ['bardzo słabe', 'słabe', 'średnie', 'dobre', 'mocne', 'bardzo mocne'][sc];
      $('.cmsp-meter i', f).style.width = (sc * 20) + '%'; $('#pw-s').textContent = 'Siła hasła: ' + (v ? t : '—');
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (S.demo) return;
      if ($('#pw1').value.length < 10) { er.textContent = 'Nowe hasło musi mieć co najmniej 10 znaków.'; return; }
      if ($('#pw1').value !== $('#pw2').value) { er.textContent = 'Nowe hasła nie są takie same.'; return; }
      er.textContent = 'Zapisywanie…';
      api('/api/haslo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stare: $('#pw0').value, nowe: $('#pw1').value }) }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.blad || 'Nie udało się zmienić hasła.'); }); })
        .then(function () { er.textContent = ''; f.reset(); toast('Hasło zmienione. Obowiązuje od teraz.'); }).catch(function (x) { er.textContent = x.name === 'AbortError' ? 'Serwer chwilowo nie odpowiada — spróbuj ponownie.' : x.message; });
    });
  };
  CUSTOM_PAGES.kopia = function () {
    return pageHead('kopia', 'Kopia zapasowa', 'Eksportuj wszystkie treści do pliku, wczytaj je z powrotem albo wróć do jednego z 10 ostatnich zapisów.', '', '') +
      '<section class="cmsp-blk"><h2>Eksport</h2><div class="cmsp-fld"><label for="kp-e">Dane (JSON)</label><textarea id="kp-e" rows="6" readonly>' + esc(JSON.stringify(S.st, null, 2)) + '</textarea></div><div class="cmsp-inl"><button type="button" class="cmsp-b" data-kp="copy">Kopiuj do schowka</button><button type="button" class="cmsp-b2" data-kp="dl">Pobierz plik .json</button></div></section>' +
      '<section class="cmsp-blk"><h2>Import</h2><div class="cmsp-fld"><label for="kp-i">Wklej dane z kopii</label><textarea id="kp-i" rows="5"></textarea></div><div class="cmsp-inl"><button type="button" class="cmsp-b" data-kp="imp">Wczytaj wklejone dane</button><label class="cmsp-b2 cmsp-file">Wybierz plik<input type="file" accept=".json,application/json" hidden data-kp-file></label></div><p class="cmsp-merr" id="kp-err" role="alert"></p></section>' +
      '<section class="cmsp-blk"><h2>Ostatnie zapisy na serwerze</h2><div id="kp-list">' + (S.demo ? '<p class="cmsp-empty">W trybie demonstracyjnym kopie serwera są niedostępne.</p>' : '<p class="cmsp-empty">Ładowanie…</p>') + '</div></section>' +
      '<section class="cmsp-blk"><h2>Przywróć treści początkowe</h2><p>Wraca wszystkie teksty, zdjęcia i listy do wersji z dnia wdrożenia strony. Poprzedni stan zostaje w kopii zapisów.</p><button type="button" class="cmsp-b2 cmsp-danger" data-kp="reset">Przywróć treści początkowe</button></section>';
  };
  function applyImport(txt) {
    var er = $('#kp-err'), o; er.textContent = '';
    try { o = JSON.parse(txt); } catch (e) { er.textContent = 'To nie jest poprawny plik JSON.'; return; }
    if (!o || o._cms !== 'np-fotografia' || !o.strony || !o.firma) { er.textContent = 'To nie jest kopia z tego panelu.'; return; }
    S.st = NPR.merge(DANE, o); S.dirty = true; save().then(function () { toast('Kopia wczytana.'); render('kopia'); }).catch(function () {});
  }
  CUSTOM_PAGES_AFTER.kopia = function () {
    var kp = function (e) {
      var b = e.target.closest('[data-kp]'); if (!b) return; var a = b.getAttribute('data-kp');
      if (a === 'copy') { var t = $('#kp-e'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(function () { toast('Skopiowano do schowka.'); }, function () { D.execCommand('copy'); toast('Skopiowano.'); }); }
      if (a === 'dl') { var bl = new Blob([JSON.stringify(S.st, null, 2)], { type: 'application/json' }), l = D.createElement('a'); l.href = URL.createObjectURL(bl); l.download = 'kopia-strony-' + NPR.today() + '.json'; l.click(); }
      if (a === 'imp') applyImport($('#kp-i').value);
      if (a === 'reset') confirmBtn(b, function () { b.textContent = 'Ostatnie potwierdzenie — kliknij ponownie'; b.setAttribute('data-c2', '1'); b.onclick = function (ev) { ev.stopPropagation(); S.st = clone(DANE); S.dirty = true; save().then(function () { toast('Przywrócono treści początkowe.'); render('kopia'); }).catch(function () {}); }; setTimeout(function () { b.onclick = null; b.textContent = 'Przywróć treści początkowe'; }, 4000); });
      if (a === 'restore') confirmBtn(b, function () { api('/api/kopie/przywroc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: b.getAttribute('data-t') }) }, 12000).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.blad); S.st = NPR.merge(DANE, j.dane); toast('Przywrócono zapis.'); render('kopia'); }); }).catch(function (x) { toast(x.message || 'Nie udało się przywrócić.'); }); });
    };
    main.onclick = kp;
    main.onchange = function (e) { if (e.target.hasAttribute('data-kp-file')) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { applyImport(String(r.result)); }; r.readAsText(f); } };
    if (!S.demo) api('/api/kopie', {}, 8000).then(function (r) { return r.json(); }).then(function (j) {
      var l = $('#kp-list'); if (!l) return;
      l.innerHTML = (j.kopie && j.kopie.length) ? '<ul class="cmsp-rows">' + j.kopie.map(function (k) { return '<li class="cmsp-row"><span class="cmsp-rt"><strong>' + esc(new Date(k.t).toLocaleString('pl-PL')) + '</strong><small>zapis sprzed zmiany</small></span><button type="button" class="cmsp-b2" data-kp="restore" data-t="' + esc(k.t) + '">Przywróć</button></li>'; }).join('') + '</ul>' : '<p class="cmsp-empty">Brak zapisów. Pojawią się po pierwszej zmianie.</p>';
    }).catch(function () { var l = $('#kp-list'); if (l) l.innerHTML = '<p class="cmsp-empty">Serwer chwilowo nie odpowiada.</p>'; });
  };

  /* ---------- szkielet panelu ---------- */
  function shell() {
    root = D.createElement('div'); root.id = 'cmsp'; root.className = 'cmsp-ov'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'cmsp-t');
    root.innerHTML = '<header class="cmsp-top"><div class="cmsp-brand"><img src="' + esc(S.st.firma.logoCiemne) + '" alt="" width="233" height="89"><div><strong id="cmsp-t">' + esc(S.st.firma.nazwa) + '</strong><span>Panel administratora</span></div></div>' +
      '<span class="cmsp-save cmsp-ok" role="status" aria-live="polite"><i class="cmsp-dot"></i><b>Zapisano</b></span><div class="cmsp-ta"><button type="button" class="cmsp-b2" data-act="view">Zobacz stronę</button><button type="button" class="cmsp-b2" data-act="logout">Wyloguj</button></div></header>' +
      (S.demo ? '<div class="cmsp-demo" role="status">Tryb demonstracyjny — zmiany zapisują się tylko na tym komputerze</div>' : '') +
      '<div class="cmsp-body"><nav class="cmsp-nav" aria-label="Menu panelu">' + navHtml() + '</nav><main class="cmsp-main" id="cmsp-main"></main></div><div class="cmsp-toast" role="status" aria-live="polite"></div>';
    D.body.appendChild(root); main = $('#cmsp-main', root);
    // pola stron
    bindFields(main, function () { return S.st; }, function (el) { touched(); if (el.hasAttribute('data-cnt')) return; var b = el.closest('.cmsp-blk'); }, function () { var b = D.activeElement && D.activeElement.closest && D.activeElement.closest('.cmsp-blk'); var pb = b && $('.cmsp-prev', b); return pb && pb._p; });
    main.addEventListener('click', listClick);
    root.addEventListener('click', function (e) {
      var g = e.target.closest('[data-go]'); if (g) { render(g.getAttribute('data-go')); return; }
      var q = e.target.closest('[data-q]'); if (q) { render(q.getAttribute('data-q') === 'akt' ? 'aktualnosci' : 'portfolio'); setTimeout(function () { var L = S.lists[q.getAttribute('data-q') === 'akt' ? 'strony.aktualnosci.wpisy' : 'strony.portfolio.zdjecia']; L && openModal(L, -1); }, 60); return; }
      var a = e.target.closest('[data-act]'); if (!a) return; var act = a.getAttribute('data-act');
      if (act === 'view') close(); if (act === 'retry') save().catch(function () {}); if (act === 'reload') location.reload();
      if (act === 'logout') { flush().catch(function () {}).then(function () { return api('/api/logout', { method: 'POST' }).catch(function () {}); }).then(function () { location.reload(); }); }
      if (act === 'show') showOnSite(a.getAttribute('data-pg'), a.getAttribute('data-sec'));
    });
    root.addEventListener('input', function (e) { var c = e.target.closest('[data-cnt]'); if (c) { afterEdit(c, root); touched(); S.st && set(S.st, c.getAttribute('data-p'), c.value); } });
    return root;
  }
  function refreshSite() {
    var key = (D.body.className.match(/np-p-([\w-]+)/) || [])[1], rt = D.getElementById('np-root');
    if (!rt || !NPR.pageByKey(key)) return;
    rt.innerHTML = NPR.renderBody(S.st, key);
    var hp = NPR.headPatch(S.st, key); D.title = hp.title;
    var m = $('meta[name="description"]'); m && m.setAttribute('content', hp.desc);
    var ld = $('#np-ld'); ld && (ld.textContent = hp.ld);
    W.NP_SITE && (W.NP_SITE.observe(), W.NP_SITE.upd(), W.NP_SITE.markLock());
  }
  function teardown() { killPreviews(); root && root.remove(); root = null; D.body.classList.remove('cmsp-open'); var r = D.getElementById('np-root'); r && (r.inert = false); }
  function close() {
    flush().catch(function () {}).then(function () {
      var px = NPR.pixelId(S.st); teardown(); refreshSite(); var l = $('.np-lock'); l && l.focus();
      if (px !== S.px0) location.reload();
    });
  }
  function showOnSite(pk, sec) {
    flush().catch(function () {}).then(function () {
      var key = (D.body.className.match(/np-p-([\w-]+)/) || [])[1];
      if (key === pk || (pk === 'home' && key === 'home')) { teardown(); refreshSite(); flash(sec); }
      else { try { sessionStorage.setItem('np_flash', sec || ''); } catch (e) {} location.href = NPR.pageByKey(pk).url + (sec ? '#' + sec : ''); }
    });
  }
  function flash(sec) {
    var el = sec && D.getElementById(sec); if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('cmsp-flash'); setTimeout(function () { el.classList.remove('cmsp-flash'); }, 2800);
  }
  function open() {
    if (root || S.opening) return; S.opening = true;
    load().then(function () {
      S.px0 = NPR.pixelId(S.st); shell(); D.body.classList.add('cmsp-open'); var r = D.getElementById('np-root'); r && (r.inert = true);
      S.opening = false; render(S.page || 'pulpit');
    }).catch(function (e) {
      S.opening = false; var d = D.createElement('div'); d.className = 'cmsp-ov cmsp-fail'; d.setAttribute('role', 'alertdialog');
      d.innerHTML = '<div class="cmsp-card"><h1>Panel administratora</h1><p>' + esc((e && e.msg) || 'Serwer chwilowo nie odpowiada — spróbuj ponownie.') + '</p><button type="button" class="cmsp-b" data-r>Spróbuj ponownie</button> <button type="button" class="cmsp-b2" data-x>Zamknij</button></div>';
      D.body.appendChild(d); $('[data-r]', d).focus();
      $('[data-r]', d).onclick = function () { d.remove(); open(); }; $('[data-x]', d).onclick = function () { d.remove(); };
    });
  }
  W.NP_CMS = { open: open, flash: flash };
})();
