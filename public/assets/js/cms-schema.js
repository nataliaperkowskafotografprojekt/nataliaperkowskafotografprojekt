/* Opis podstron panelu (schemat). Panel pokazuje wyłącznie sekcje, które są na stronie. */
(function () {
  var BG = function (p, l) { return { t: 'bg', p: p, l: l || 'Tło sekcji' }; };
  var X = function (p, l, t, o) { var f = { p: p, l: l, t: t || 'text' }; if (o) for (var k in o) f[k] = o[k]; return f; };
  var AREA = function (p, l, o) { return X(p, l, 'area', o); };
  var today = function () { return new Date().toISOString().slice(0, 10); };
  var plus = function (n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  var slug = function (s) { return String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sekcja'; };
  var IMGALT = function (img, alt) { return [X(img, 'Zdjęcie', 'img'), X(alt, 'Opis zdjęcia (alt) — co przedstawia, dla czytników ekranu i Google', 'text', { max: 140 })]; };
  var FMT = 'Formatowanie: *kursywa* (kolor akcentu), **pogrubienie**, pusta linia = nowy akapit.';

  window.NP_SCHEMA = {
    nav: [
      { g: 'Przegląd', items: [['pulpit', 'Pulpit']] },
      { g: 'Treści czasowe', items: [['aktualnosci', 'Aktualności']] },
      { g: 'Oferta', items: [['oferta', 'Oferta i pakiety'], ['cennik', 'Cennik']] },
      { g: 'Wizerunek', items: [['home', 'Strona główna'], ['o-mnie', 'O mnie'], ['portfolio', 'Galeria / portfolio'], ['wyglad', 'Logo i wygląd']] },
      { g: 'Zaufanie', items: [['opinie', 'Opinie klientów'], ['faq', 'Najczęstsze pytania']] },
      { g: 'Firma', items: [['bony', 'Bony / vouchery'], ['regulamin', 'Regulamin'], ['kontakt', 'Kontakt i formularz'], ['dane', 'Dane firmy i RODO']] },
      { g: 'Ustawienia', items: [['sekcje', 'Sekcje strony i menu'], ['seo', 'SEO (tytuły i opisy)'], ['piksel', 'Piksel Facebooka i integracje'], ['jezyki', 'Wersje językowe'], ['haslo', 'Zmiana hasła'], ['kopia', 'Kopia zapasowa']] }
    ],
    pages: {
      aktualnosci: {
        t: 'Aktualności', d: 'Wpisy z datami „pokazuj od / do”. Na stronie widać tylko aktywne; po terminie znikają same i zostają tu jako archiwum.', page: 'aktualnosci',
        blocks: [{ t: 'Nagłówek podstrony', sec: 'start', fields: [X('strony.aktualnosci.tlo.h1', 'Nagłówek (H1)'), X('strony.aktualnosci.tlo.wstep', 'Krótkie wprowadzenie')] }, {
          t: 'Wpisy', sec: 'start', lists: [{
            p: 'strony.aktualnosci.wpisy', l: 'Aktualności', add: '+ Dodaj aktualność', name: 'aktualność', title: 'tytul', thumb: 'img', status: true, newTop: true, filters: true,
            make: function () { return { tytul: '', tresc: '', data: today(), od: today(), 'do': plus(14), wstrzymaj: false, pasek: false, img: '', alt: '' }; }, req: ['tytul', 'tresc'],
            fields: [X('tytul', 'Tytuł', 'text', { req: 1 }), AREA('tresc', 'Treść', { hint: FMT, req: 1 }), X('data', 'Data wpisu', 'date'), X('od', 'Pokazuj od', 'date'), X('do', 'Pokazuj do (puste = bez końca)', 'date'), X('wstrzymaj', 'Wstrzymaj (ukryj na stronie)', 'check'), X('pasek', 'Pokaż też na górnym pasku komunikatów', 'check')].concat(IMGALT('img', 'alt'))
          }]
        }]
      },
      oferta: {
        t: 'Oferta i pakiety', d: 'Rodzaje sesji i pakiety ze zdjęciami. Ceny pakietów edytujesz w Cenniku.', page: 'oferta',
        blocks: [
          { t: 'Pierwszy ekran', sec: 'start', fields: [X('strony.oferta.hero.nad', 'Nadtytuł'), X('strony.oferta.hero.h1', 'Nagłówek (H1)'), AREA('strony.oferta.hero.tekst', 'Wprowadzenie', { rows: 2 }), BG('strony.oferta.hero.bg')] },
          {
            t: 'Rodzaje sesji', sec: 'portretowe', lists: [{
              p: 'strony.oferta.kategorie', l: 'Rodzaje sesji', add: '+ Dodaj rodzaj sesji', name: 'rodzaj sesji', title: 'nazwa', thumb: 'img', hide: 'widoczna', secOf: function (it) { return it.id; },
              make: function () { return { id: '', nazwa: '', opis: '', img: '', alt: '', widoczna: true }; }, req: ['nazwa', 'img'], before: function (it, all) { if (!it.id) { var b = slug(it.nazwa), id = b, n = 2; while (all.some(function (x) { return x.id === id; })) id = b + '-' + n++; it.id = id; } },
              fields: [X('nazwa', 'Nazwa', 'text', { req: 1 }), AREA('opis', 'Krótki opis'), X('widoczna', 'Pokazuj na stronie', 'check')].concat(IMGALT('img', 'alt'))
            }]
          },
          {
            t: 'Pakiety (karty ze zdjęciem)', sec: 'pakiety', fields: [X('strony.oferta.pakietyH2', 'Tytuł sekcji'), AREA('strony.oferta.pakietyWstep', 'Wprowadzenie', { rows: 2 })], lists: [{
              p: 'pakiety', l: 'Pakiety', add: '+ Dodaj pakiet', name: 'pakiet', title: 'nazwa', thumb: 'img', hide: 'widoczna', sumf: ['czas', 'cena'],
              make: function () { return { nazwa: '', opis: '', czas: '[DO UZUPEŁNIENIA]', zdjecia: '[DO UZUPEŁNIENIA]', cena: '[DO UZUPEŁNIENIA]', img: '', alt: '', widoczna: true }; }, req: ['nazwa'],
              fields: [X('nazwa', 'Nazwa pakietu', 'text', { req: 1 }), AREA('opis', 'Opis'), X('czas', 'Czas sesji'), X('zdjecia', 'Liczba zdjęć'), X('cena', 'Cena (np. 450 zł)'), X('widoczna', 'Pokazuj na stronie', 'check')].concat(IMGALT('img', 'alt'))
            }]
          },
          { t: 'Gdzie odbywają się sesje', sec: 'gdzie', fields: [X('strony.oferta.gdzie.h2', 'Tytuł'), AREA('strony.oferta.gdzie.tekst', 'Tekst'), X('strony.oferta.gdzie.btn', 'Tekst przycisku'), BG('strony.oferta.gdzie.bg')] }
        ]
      },
      cennik: {
        t: 'Cennik', d: 'Każda kategoria to osobna tabela na stronie. Klienci mają od razu znaleźć ceny.', page: 'cennik',
        blocks: [
          { t: 'Pierwszy ekran', sec: 'start', fields: [X('strony.cennik.hero.nad', 'Nadtytuł'), X('strony.cennik.hero.h1', 'Nagłówek (H1)'), AREA('strony.cennik.hero.tekst', 'Wprowadzenie', { rows: 2 }), BG('strony.cennik.hero.bg')] },
          {
            t: 'Tabele cen', sec: 'ceny', fields: [X('strony.cennik.tabele.h2', 'Tytuł sekcji'), AREA('strony.cennik.uwaga', 'Uwaga pod cennikiem')], lists: [{
              p: 'strony.cennik.pozycje', l: 'Pozycje cennika', add: '+ Dodaj pozycję', name: 'pozycję', title: 'nazwa', hide: 'widoczna', sumf: ['kat', 'czas', 'cena'],
              make: function () { return { kat: 'Pakiety sesji', nazwa: '', dopisek: '', czas: '', cena: '', widoczna: true }; }, req: ['nazwa'],
              fields: [X('kat', 'Kategoria (każda = osobna tabela)', 'text', { req: 1, datalist: 'kat' }), X('nazwa', 'Nazwa', 'text', { req: 1 }), X('dopisek', 'Dopisek (co zawiera)'), X('czas', 'Czas'), X('cena', 'Cena (np. od 450 zł)'), X('widoczna', 'Pokazuj na stronie', 'check')]
            }]
          }
        ]
      },
      home: {
        t: 'Strona główna', d: 'Wszystkie ekrany strony głównej: teksty, zdjęcia w tle i punkty „Dlaczego warto?”.', page: 'home',
        blocks: [
          { t: 'Pierwszy ekran', sec: 'start', fields: [X('strony.home.hero.nad', 'Nadtytuł'), X('strony.home.hero.h1', 'Nagłówek główny (H1)'), X('strony.home.hero.haslo', 'Hasło'), X('strony.home.hero.btn', 'Tekst przycisku'), BG('strony.home.hero.bg')] },
          { t: 'O mnie (skrót)', sec: 'o-mnie', fields: [X('strony.home.intro.h2', 'Tytuł'), AREA('strony.home.intro.tekst', 'Krótki tekst'), AREA('strony.home.intro.wiecej', 'Tekst w oknie „Czytaj więcej”', { hint: FMT }), X('strony.home.intro.btn', 'Tekst przycisku'), BG('strony.home.intro.bg')] },
          { t: 'Rodzaje sesji (kafelki)', sec: 'sesje', fields: [X('strony.home.rodzaje.h2', 'Tytuł'), X('strony.home.rodzaje.btn', 'Tekst przycisku'), BG('strony.home.rodzaje.bg')], note: 'Kafelki biorą nazwy i zdjęcia z podstrony „Oferta i pakiety”.' },
          {
            t: 'Dlaczego warto?', sec: 'dlaczego-warto', fields: [X('strony.home.dlaczego.h2', 'Tytuł sekcji'), BG('strony.home.dlaczego.bg')], lists: [{
              p: 'strony.home.dlaczego.elementy', l: 'Punkty', add: '+ Dodaj punkt', name: 'punkt', title: 'tytul', make: function () { return { tytul: '', tekst: '' }; }, req: ['tytul', 'tekst'],
              fields: [X('tytul', 'Tytuł', 'text', { req: 1 }), AREA('tekst', 'Opis (pierwsze zdanie widać na karcie, całość w oknie)', { req: 1, rows: 6 })]
            }]
          },
          { t: 'Instagram', sec: 'instagram', fields: [X('strony.home.insta.h2', 'Tytuł'), AREA('strony.home.insta.tekst', 'Tekst', { rows: 2 }), X('strony.home.insta.btn', 'Tekst przycisku'), BG('strony.home.insta.bg')], note: 'Najnowsze zdjęcia pojawiają się automatycznie, gdy na serwerze ustawiony jest token Instagrama (instrukcja w README).' },
          { t: 'Zaproszenie do kontaktu', sec: 'kontakt', fields: [X('strony.home.cta.h2', 'Tytuł'), AREA('strony.home.cta.tekst', 'Tekst', { rows: 2 }), X('strony.home.cta.btn', 'Tekst przycisku'), BG('strony.home.cta.bg')] }
        ]
      },
      'o-mnie': {
        t: 'O mnie', d: 'Teksty i zdjęcia podstrony „O mnie”.', page: 'o-mnie',
        blocks: [
          { t: 'Pierwszy ekran', sec: 'start', fields: [X('strony.o-mnie.hero.nad', 'Nadtytuł'), X('strony.o-mnie.hero.h1', 'Nagłówek (H1)'), X('strony.o-mnie.hero.haslo', 'Podpis'), BG('strony.o-mnie.hero.bg')] },
          { t: 'Moja misja', sec: 'misja', fields: [X('strony.o-mnie.misja.h2', 'Tytuł'), AREA('strony.o-mnie.misja.tekst', 'Tekst', { hint: FMT, rows: 6 }), BG('strony.o-mnie.misja.bg')] },
          {
            t: 'Jak pracuję (wartości)', sec: 'jak-pracuje', fields: [X('strony.o-mnie.styl.h2', 'Tytuł'), AREA('strony.o-mnie.styl.tekst', 'Wprowadzenie', { rows: 3 }), BG('strony.o-mnie.styl.bg')], lists: [{
              p: 'strony.o-mnie.styl.wartosci', l: 'Wartości', add: '+ Dodaj wartość', name: 'wartość', title: 'tytul', make: function () { return { tytul: '', opis: '' }; }, req: ['tytul'],
              fields: [X('tytul', 'Tytuł', 'text', { req: 1 }), AREA('opis', 'Opis (opcjonalnie)', { rows: 3 })]
            }]
          },
          { t: 'Dlaczego klienci mnie wybierają', sec: 'dlaczego-ja', fields: [X('strony.o-mnie.dlaczego.h2', 'Tytuł'), AREA('strony.o-mnie.dlaczego.tekst', 'Tekst', { rows: 4 }), BG('strony.o-mnie.dlaczego.bg')] },
          { t: 'Gdzie fotografuję', sec: 'gdzie', fields: [X('strony.o-mnie.gdzie.h2', 'Tytuł'), AREA('strony.o-mnie.gdzie.tekst', 'Tekst', { rows: 4 }), X('strony.o-mnie.gdzie.btn', 'Tekst przycisku'), BG('strony.o-mnie.gdzie.bg')] }
        ]
      },
      portfolio: {
        t: 'Galeria / portfolio', d: 'Zdjęcia w pełnoekranowym sliderze. Kategorie tworzą filtry nad galerią.', page: 'portfolio',
        blocks: [
          { t: 'Pierwszy ekran', sec: 'start', fields: [X('strony.portfolio.hero.nad', 'Nadtytuł'), X('strony.portfolio.hero.h1', 'Nagłówek (H1)'), AREA('strony.portfolio.hero.tekst', 'Wprowadzenie', { rows: 2 }), BG('strony.portfolio.hero.bg')] },
          {
            t: 'Kategorie galerii', sec: 'galeria', lists: [{
              p: 'strony.portfolio.kategorie', l: 'Kategorie', add: '+ Dodaj kategorię', name: 'kategorię', title: 'nazwa', make: function () { return { nazwa: '' }; }, req: ['nazwa'], renameKey: 'nazwa',
              after: function (st, old, nw) { if (old && old.nazwa && nw.nazwa !== old.nazwa) (st.strony.portfolio.zdjecia || []).forEach(function (z) { if (z.kat === old.nazwa) z.kat = nw.nazwa; }); },
              fields: [X('nazwa', 'Nazwa kategorii', 'text', { req: 1 })]
            }]
          },
          {
            t: 'Zdjęcia w galerii', sec: 'galeria', fields: [X('strony.portfolio.galeria.h2', 'Tytuł galerii')], lists: [{
              p: 'strony.portfolio.zdjecia', l: 'Zdjęcia', add: '+ Dodaj zdjęcie', name: 'zdjęcie', title: 'podpis', thumb: 'img', hide: 'widoczna', sumf: ['kat'], newTop: true,
              make: function () { return { img: '', alt: '', kat: '', podpis: '', widoczna: true }; }, req: ['img'],
              fields: IMGALT('img', 'alt').map(function (f) { if (f.t === 'img') f.req = 1; return f; }).concat([X('kat', 'Kategoria', 'sel', { opts: 'kategorie' }), X('podpis', 'Podpis (opcjonalnie)'), X('widoczna', 'Pokazuj na stronie', 'check')])
            }]
          }
        ]
      },
      opinie: {
        t: 'Opinie klientów', d: 'Lista startuje pusta — dodawaj wyłącznie prawdziwe opinie. Gdy dodasz pierwszą, strona „Opinie” pojawi się w menu.', page: 'opinie',
        blocks: [{ t: 'Nagłówek podstrony', sec: 'start', fields: [X('strony.opinie.tlo.h1', 'Nagłówek (H1)'), X('strony.opinie.tlo.wstep', 'Wprowadzenie'), X('strony.opinie.linkGoogle', 'Link do opinii w Google (opcjonalnie)', 'url')] }, {
          t: 'Opinie', sec: 'start', lists: [{
            p: 'strony.opinie.lista', l: 'Opinie', add: '+ Dodaj opinię', name: 'opinię', title: 'autor', hide: 'widoczna', sumf: ['usluga'], make: function () { return { autor: '', usluga: '', ocena: 5, tresc: '', widoczna: true }; }, req: ['autor', 'tresc'],
            fields: [X('autor', 'Autor (np. imię)', 'text', { req: 1 }), X('usluga', 'Rodzaj sesji (opcjonalnie)'), X('ocena', 'Ocena (gwiazdki)', 'sel', { opts: [[5, '5 gwiazdek'], [4, '4 gwiazdki'], [3, '3 gwiazdki']], num: 1 }), AREA('tresc', 'Treść opinii', { req: 1, rows: 5 }), X('widoczna', 'Pokazuj na stronie', 'check')]
          }]
        }]
      },
      faq: {
        t: 'Najczęstsze pytania', d: 'Pytania i odpowiedzi. Zaznacz „Odpowiedź potwierdzona”, gdy tekst jest ostateczny — tylko takie trafią do danych strukturalnych dla Google.', page: 'faq',
        blocks: [{ t: 'Nagłówek podstrony', sec: 'start', fields: [X('strony.faq.tlo.h1', 'Nagłówek (H1)'), X('strony.faq.tlo.wstep', 'Wprowadzenie')] }, {
          t: 'Pytania i odpowiedzi', sec: 'start', lists: [{
            p: 'strony.faq.pytania', l: 'Pytania', add: '+ Dodaj pytanie', name: 'pytanie', title: 'q', hide: 'widoczna', make: function () { return { q: '', a: '', ok: false, widoczna: true }; }, req: ['q', 'a'],
            fields: [X('q', 'Pytanie', 'text', { req: 1 }), AREA('a', 'Odpowiedź', { req: 1, rows: 6, hint: FMT }), X('ok', 'Odpowiedź potwierdzona (uwzględnij w danych strukturalnych FAQPage)', 'check'), X('widoczna', 'Pokazuj na stronie', 'check')]
          }]
        }]
      },
      bony: {
        t: 'Bony / vouchery', d: 'Informacje o voucherach podarunkowych.', page: 'bony',
        blocks: [
          { t: 'Pierwszy ekran', sec: 'start', fields: [X('strony.bony.hero.nad', 'Nadtytuł'), X('strony.bony.hero.h1', 'Nagłówek (H1)'), AREA('strony.bony.hero.tekst', 'Wprowadzenie', { rows: 2 }), BG('strony.bony.hero.bg')] },
          {
            t: 'Jak działa voucher', sec: 'warunki', fields: [X('strony.bony.warunki.h2', 'Tytuł'), AREA('strony.bony.warunki.wstep', 'Wprowadzenie', { rows: 2 }), X('strony.bony.warunki.btn', 'Tekst przycisku'), BG('strony.bony.warunki.bg')], lists: [{
              p: 'strony.bony.warunki.punkty', l: 'Warunki vouchera', add: '+ Dodaj punkt', name: 'punkt', title: 'tekst', hide: 'widoczna', make: function () { return { tekst: '', widoczna: true }; }, req: ['tekst'], fields: [AREA('tekst', 'Treść punktu', { req: 1, rows: 3 }), X('widoczna', 'Pokazuj na stronie', 'check')]
            }]
          }
        ]
      },
      regulamin: {
        t: 'Regulamin', d: 'Regulamin sesji zdjęciowej. Wklej tutaj tekst ze starej strony. Śródtytuł: wiersz zaczynający się od „## ”.', page: 'regulamin',
        blocks: [{ t: 'Treść regulaminu', sec: 'start', fields: [X('strony.regulamin.tlo.h1', 'Nagłówek (H1)'), AREA('strony.regulamin.tekst', 'Treść regulaminu', { rows: 20, hint: FMT + ' Śródtytuł: „## 1. Tytuł”.' }), X('strony.regulamin.aktualizacja', 'Data ostatniej aktualizacji (opcjonalnie)')] }]
      },
      kontakt: {
        t: 'Kontakt i formularz', d: 'Dane kontaktowe i opcje wyboru w formularzu. Zmiana telefonu lub e-maila aktualizuje wszystkie przyciski, stopkę i dane dla Google.', page: 'kontakt',
        blocks: [
          { t: 'Nagłówek podstrony', sec: 'start', fields: [X('strony.kontakt.tlo.h1', 'Nagłówek (H1)'), AREA('strony.kontakt.tlo.wstep', 'Wprowadzenie', { rows: 2 }), BG('strony.kontakt.tlo.bg')] },
          { t: 'Dane kontaktowe', sec: 'start', fields: [X('firma.tel', 'Telefon (format +48600100200, bez spacji)', 'text', { pattern: '^\\+?\\d{9,15}$' }), X('firma.telTxt', 'Telefon — jak wyświetlać (np. +48 600 100 200)'), X('firma.email', 'E-mail (tu trafiają też wiadomości z formularza)', 'email'), X('firma.ig', 'Instagram — link', 'url'), X('firma.igNazwa', 'Instagram — nazwa (np. @nazwa)'), X('firma.fb', 'Facebook — link', 'url'), X('firma.gbp', 'Profil Firmy w Google — link (opcjonalnie)', 'url'), X('firma.miasto', 'Miasto'), AREA('firma.obszar', 'Obszar działania', { rows: 2 }), X('firma.mapaZapytanie', 'Miejsce na mapie Google (np. samo miasto)')] },
          { t: 'Opcje „Rodzaj sesji” w formularzu', sec: 'formularz', lists: [{ p: 'strony.kontakt.tematy', l: 'Rodzaje sesji w formularzu', add: '+ Dodaj opcję', name: 'opcję', title: 'nazwa', make: function () { return { nazwa: '' }; }, req: ['nazwa'], fields: [X('nazwa', 'Nazwa', 'text', { req: 1 })] }] }
        ]
      },
      wyglad: {
        t: 'Logo i wygląd', d: 'Logo klientki oraz efekty strony.', page: 'home',
        blocks: [
          { t: 'Logo', sec: 'start', note: 'Logo bez przerysowywania. Wgraj wersję jasną (na ciemne tło — nagłówek i stopka) i ciemną (na jasne tło — panel). Najlepiej plik PNG z przezroczystym tłem, min. 600 px szerokości.', fields: [X('firma.logoJasne', 'Logo — wersja jasna (na ciemne tło)', 'img'), X('firma.logoCiemne', 'Logo — wersja ciemna (na jasne tło)', 'img')] },
          { t: 'Efekty', sec: 'start', fields: [X('wyglad.kropki', 'Kropki nawigacji z boku (włącz / wyłącz)', 'check'), X('wyglad.animacje', 'Animacje przy przewijaniu i gradient (włącz / wyłącz)', 'check')], note: 'Przejścia między podstronami (obrót karty 3D) wyłączają się automatycznie u osób z ustawieniem „ogranicz ruch”.' }
        ]
      },
      dane: {
        t: 'Dane firmy i RODO', d: 'Dane administratora i klauzula informacyjna pod formularzem. Wpisz brakujące dane: adres i NIP.', page: 'kontakt',
        blocks: [
          { t: 'Firma', sec: 'start', fields: [X('firma.nazwa', 'Nazwa firmy'), X('firma.osoba', 'Imię i nazwisko'), X('firma.specjalizacja', 'Specjalizacja'), X('firma.region', 'Województwo / region'), AREA('firma.opisKrotki', 'Krótki opis firmy (Google)', { rows: 2 }), X('domena', 'Adres strony (https://domena.pl)', 'url')] },
          { t: 'Administrator danych (RODO)', sec: 'formularz', fields: [AREA('rodo.administrator', 'Administrator danych', { rows: 2 }), X('rodo.adres', 'Adres administratora'), X('rodo.nip', 'NIP'), AREA('rodo.klauzula', 'Treść klauzuli informacyjnej pod formularzem', { rows: 10, hint: 'Znaczniki {administrator}, {adres}, {nip} zastępowane są danymi powyżej. Nie dodawaj obowiązkowej zgody — wysłanie zapytania jej nie wymaga.' }), AREA('strony.polityka.dodatek', 'Dodatkowy tekst na końcu Polityki prywatności (opcjonalnie)', { rows: 4 })] }
        ]
      },
      piksel: {
        t: 'Piksel Facebooka i integracje', d: 'Piksel Meta ładuje się wyłącznie po zgodzie odwiedzającego z banera cookies.', page: 'home',
        blocks: [
          { t: 'Piksel Facebooka (Meta)', sec: 'start', fields: [X('integracje.fbPixelId', 'ID Piksela (15–16 cyfr)', 'text', { pattern: '^\\d{15,16}$', ph: 'np. 123456789012345', hint: 'Znajdziesz go w Meta Events Manager → Źródła danych → Twój Piksel → Ustawienia. Puste = Piksel wyłączony, baner cookies się nie pojawia.' }), X('integracje.fbPixelWlaczony', 'Piksel włączony', 'check'), X('integracje.fbWeryfikacjaDomeny', 'Kod weryfikacji domeny Meta (opcjonalnie)', 'text', { hint: 'Sama wartość meta „facebook-domain-verification” z Business Managera.' })], custom: 'pikselInfo' },
          { t: 'Antyspam formularza (Cloudflare Turnstile)', sec: 'formularz', fields: [X('integracje.turnstileSiteKey', 'Klucz witryny Turnstile (opcjonalnie)', 'text', { hint: 'Sekret ustaw na serwerze jako TURNSTILE_SECRET. Bez klucza działa pole-pułapka i limit wysyłek.' })] },
          { t: 'Instagram', sec: 'instagram', fields: [X('integracje.instagramWlaczony', 'Pokazuj najnowsze zdjęcia z Instagrama', 'check')] }
        ]
      }
    },
    slug: slug, today: today, plus: plus
  };
})();
