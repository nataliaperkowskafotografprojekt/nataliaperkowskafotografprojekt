/* DANE POCZĄTKOWE strony — jedyne źródło treści (state). Panel nadpisuje je zapisem z KV.
   Format UMD: działa w przeglądarce (window.NP_DANE), w buildzie i w Cloudflare Functions.
   Brakujące informacje: [DO UZUPEŁNIENIA] / [DO POTWIERDZENIA PRZEZ KLIENTA]. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NP_DANE = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var IMG = '/assets/img/';
  // tło sekcji: typ zdjecie|wideo|kolor, ov = przyciemnienie 0–80 (%), txt = jasny|ciemny
  function B(img, alt, ov, txt) {
    return { typ: 'zdjecie', img: IMG + img + '.webp', alt: alt, wideo: '', plakat: '', kolor: '#F5F4F1', ov: ov == null ? 45 : ov, txt: txt || 'jasny' };
  }
  function K(kolor, txt) {
    return { typ: 'kolor', img: '', alt: '', wideo: '', plakat: '', kolor: kolor || '#F5F4F1', ov: 0, txt: txt || 'ciemny' };
  }
  var DO_UZ = '[DO UZUPEŁNIENIA]';

  return {
    _cms: 'np-fotografia',
    wersja: 1,
    domena: 'https://nataliaperkowska.pl', // proponowana domena z briefu (jeszcze niezakupiona) — zmiana tylko tutaj lub w panelu

    firma: {
      nazwa: 'Natalia Perkowska Fotografia',
      // logo dostarczone przez klientkę (bez przerysowywania; warianty tylko zmieniają kolor/tło)
      logoJasne: '/assets/img/logo-natalia-perkowska-jasne.png',   // na ciemnym tle (nagłówek, stopka)
      logoCiemne: '/assets/img/logo-natalia-perkowska-ciemne.png', // na jasnym tle (panel)
      logoPelne: '/assets/img/logo-natalia-perkowska-oryginal.jpg', // oryginał (dane strukturalne)
      osoba: 'Natalia Perkowska',
      specjalizacja: 'Fotograf lifestylowy',
      miasto: 'Łańcut',
      region: 'Podkarpackie',
      obszar: 'Rzeszów, Łańcut, Przeworsk, Leżajsk i okolice (dojazd do klienta w promieniu do 50 km)',
      miejscowosci: ['Łańcut', 'Rzeszów', 'Przeworsk', 'Leżajsk'],
      tel: '+48607099822',
      telTxt: '+48 607 099 822',
      email: 'nat.perkowska@gmail.com',
      ig: 'https://www.instagram.com/zaczarowane_sesje/',
      igNazwa: '@zaczarowane_sesje',
      fb: 'https://www.facebook.com/zaczarowanesesje',
      gbp: '', // link do Profilu Firmy w Google [LINK DO UZUPEŁNIENIA]
      mapaZapytanie: 'Łańcut',
      opisKrotki: 'Sesje zdjęciowe dla kobiet, par i rodzin z dziećmi — naturalne, ciepłe, reporterskie.'
    },

    rodo: {
      administrator: 'Natalia Perkowska, prowadząca działalność pod firmą Natalia Perkowska Fotografia',
      adres: '[DANE ADMINISTRATORA DO UZUPEŁNIENIA — adres]',
      nip: '[DANE ADMINISTRATORA DO UZUPEŁNIENIA — NIP]',
      klauzula:
        'Administratorem Twoich danych osobowych jest {administrator}, {adres}, NIP: {nip}. ' +
        'Dane z formularza (imię, e-mail oraz — jeśli je podasz — telefon i treść wiadomości) przetwarzamy w celu odpowiedzi na Twoje zapytanie i przygotowania oferty (art. 6 ust. 1 lit. b RODO — działania przed zawarciem umowy; w pozostałym zakresie lit. f — prawnie uzasadniony interes: odpowiedź na wiadomość). ' +
        'Dane przechowujemy do zakończenia korespondencji, najdłużej 12 miesięcy; jeśli zostanie zawarta umowa — przez okres wynikający z przepisów. ' +
        'Odbiorcami danych są dostawcy hostingu (Cloudflare) i poczty elektronicznej. ' +
        'Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu, przenoszenia oraz wniesienia skargi do Prezesa UODO. ' +
        'Podanie danych jest dobrowolne, ale niezbędne, by odpowiedzieć na zapytanie. Wysłanie formularza nie wymaga zgody.'
    },

    integracje: {
      fbPixelId: '',            // ID Piksela Facebooka (15–16 cyfr) — wpisuje się w panelu: Ustawienia → Piksel Facebooka
      fbPixelWlaczony: true,    // wyłącznik awaryjny; Piksel i tak ładuje się dopiero po zgodzie z banera
      fbWeryfikacjaDomeny: '',  // kod z meta facebook-domain-verification (opcjonalnie)
      turnstileSiteKey: '',     // klucz witryny Cloudflare Turnstile (antyspam) — opcjonalnie
      instagramWlaczony: true
    },

    wyglad: { kropki: true, animacje: true },

    jezyki: [{ kod: 'pl', nazwa: 'Polski', on: true }],

    menu: [
      { k: 'o-mnie', e: 'O mnie', on: true },
      { k: 'oferta', e: 'Oferta', on: true },
      { k: 'cennik', e: 'Cennik', on: true },
      { k: 'portfolio', e: 'Portfolio', on: true },
      { k: 'opinie', e: 'Opinie', on: true },
      { k: 'faq', e: 'FAQ', on: true },
      { k: 'aktualnosci', e: 'Aktualności', on: true },
      { k: 'bony', e: 'Bony', on: true },
      { k: 'regulamin', e: 'Regulamin', on: true },
      { k: 'kontakt', e: 'Kontakt', on: true }
    ],

    stopka: { haslo: 'Każda chwila ma swoje piękno.', autor: 'Strona: Strony AI Wrocław', autorUrl: 'https://stronyaiwroclaw.pl' },

    /* ---------- Pakiety (Oferta) ---------- */
    pakiety: [
      { nazwa: 'Pakiet Chwila', opis: 'Krótka, spokojna sesja na pojedyncze, ważne spotkanie z aparatem: portret, mała rodzina albo pamiątka z wyjątkowego dnia. Idealna na początek.', czas: 'ok. 1 godzina', zdjecia: '20 zdjęć w wersji cyfrowej', cena: '350 zł', img: IMG + 'pakiet-chwila.webp', alt: 'Dziecko idące po trawie — Pakiet Chwila', widoczna: true },
      { nazwa: 'Pakiet Pamiątka', opis: 'Pakiet na pamiątkowe zdjęcia z najbliższymi: rodzina, para, rodzeństwo. Czas na rozgrzewkę, spokojne pozowanie i swobodne, naturalne kadry.', czas: 'ok. 1,5 godziny', zdjecia: '40 zdjęć w wersji cyfrowej', cena: '550 zł', img: IMG + 'pakiet-pamiatka.webp', alt: 'Mama z dzieckiem — Pakiet Pamiątka', widoczna: true },
      { nazwa: 'Pakiet Opowieść', opis: 'Dłuższa, reporterska sesja opowiadająca całą historię dnia: kilka miejsc, zmiany stylizacji i emocje, których nie da się zaplanować.', czas: 'ok. 3 godziny', zdjecia: '80 zdjęć w wersji cyfrowej', cena: '950 zł', img: IMG + 'pakiet-opowiesc.webp', alt: 'Dziecko wśród traw w sadzie — Pakiet Opowieść', widoczna: true }
    ],

    strony: {
      /* ======================= START ======================= */
      home: {
        seo: {
          title: 'Fotograf Łańcut i Rzeszów | Natalia Perkowska Fotografia',
          desc: 'Naturalne sesje lifestylowe dla kobiet, par i rodzin z dziećmi. Łańcut, Rzeszów, Przeworsk, Leżajsk. Gotowe zdjęcia po 2 tygodniach — zapytaj o termin.'
        },
        hero: {
          bg: B('hero-sesja-lifestyle-lancut', 'Kobieta w profilu w ciepłym świetle zachodzącego słońca — sesja lifestylowa', 52),
          nad: 'Fotograf lifestylowy · Łańcut, Rzeszów i okolice',
          h1: 'Fotograf Łańcut i Rzeszów — naturalne sesje zdjęciowe',
          haslo: 'Każda chwila ma swoje piękno', // [HASŁO DO PODMIANY] po wyborze hasła przez klientkę
          btn: 'Zapytaj o termin'
        },
        intro: {
          bg: K('#F5F4F1'),
          h2: 'Naturalnie, ciepło, reportersko',
          tekst: 'Wykonuję sesje zdjęciowe dla kobiet, par i rodzin z dziećmi. Fotografuję w plenerze, w studio oraz w Twoim domu.',
          wiecej:
            'Każda chwila ma swoje piękno, a ja pomagam je zatrzymać w kadrze. Fotografuję z miłością, tworząc niepowtarzalne wspomnienia pełne emocji i ciepła.\n\nMoją misją jest uchwycenie Twojej historii — takiej, jaka jest: prawdziwej, naturalnej, pełnej uczuć.',
          btn: 'Poznaj mnie'
        },
        rodzaje: { bg: B('dlaczego-warto-tlo', 'Obiektyw aparatu trzymany w dłoni na tle jeziora', 55), h2: 'Rodzaje sesji', btn: 'Zobacz całą ofertę' },
        dlaczego: {
          bg: K('#E7E6E3'),
          h2: 'Dlaczego warto?',
          elementy: [
            { tytul: 'Personalizacja', tekst: 'Do każdej sesji podchodzę bardzo indywidualnie, gdyż usługi, które dla Was oferuję, są produktem premium. To Wy tego dnia jesteście w centrum mojej uwagi, więc pragnę, by dzień ten był pełen pozytywnych emocji, a otrzymane kadry sprawiły, że spojrzycie na siebie w sposób, który już na zawsze pozostanie w Waszej pamięci.' },
            { tytul: 'Komfortowa atmosfera', tekst: 'Podczas spotkania dbam o ciepłą atmosferę, we wszystkim pomagam oraz staram się o to, byście czuli się przy mnie jak najbardziej swobodnie. To przekłada się na naturalne i autentyczne ujęcia. Poza tym jestem osobą pełną spokoju, cierpliwości i pozytywnego nastawienia, co również sprzyja naszym relacjom.' },
            { tytul: 'Profesjonalizm', tekst: 'Podczas pracy korzystam z profesjonalnego sprzętu: aparat, obiektywy, dedykowany sprzęt komputerowy, oprogramowanie, dodatkowe akcesoria. Tutaj ważne jest każde ogniwo, którego jakość przekłada się na wygodę mojej pracy, wysoki poziom zdjęć i Wasze zadowolenie.' },
            { tytul: 'Magia postprodukcji', tekst: 'Retusz jest jednym z elementów, który wyróżnia moje prace i do którego przywiązuję wielką uwagę. To czasochłonny proces wymagający często wielu godzin spędzonych przed komputerem. Wykonuję go z wielką starannością, tak by mimo ingerencji w zdjęcia ciągle pozostawały one jak najbardziej naturalne.' }
          ]
        },
        insta: { bg: K('#F5F4F1'), h2: 'Najnowsze zdjęcia z Instagrama', tekst: 'Zajrzyj na mój profil i zobacz, co ostatnio fotografowałam.', btn: 'Odwiedź profil na Instagramie' },
        cta: {
          bg: B('kontakt-tlo-sesja-w-domu', 'Sylwetka kobiety w ciąży przy oknie z firanką — sesja w domu klienta', 55),
          h2: 'Umówmy się na Twoją sesję',
          tekst: 'Napisz lub zadzwoń — odpowiem i wspólnie wybierzemy termin oraz miejsce. Pracuję cały rok.',
          btn: 'Zapytaj o termin'
        }
      },

      /* ======================= O MNIE ======================= */
      'o-mnie': {
        seo: {
          title: 'Fotograf lifestylowy Łańcut | Natalia Perkowska Fotografia',
          desc: 'Poznaj Natalię Perkowską — fotografkę z Łańcuta. Naturalny, ciepły, reporterski styl i indywidualne podejście do kobiet, par i rodzin. Zapytaj o termin sesji.'
        },
        hero: { bg: B('o-mnie-portret-fotografki', 'Dłoń trzymająca aparat — fotograf lifestylowy w pracy', 45), nad: 'O mnie', h1: 'Natalia Perkowska — fotograf lifestylowy z Łańcuta', haslo: 'Naturalny. Ciepły. Reporterski.' },
        misja: { bg: K('#F5F4F1'), h2: 'Moja misja', tekst: 'Każda chwila ma swoje piękno, a ja pomagam je zatrzymać w kadrze. Fotografuję z miłością, tworząc niepowtarzalne wspomnienia pełne emocji i ciepła.\n\nMoją misją jest uchwycenie Twojej historii — takiej, jaka jest: prawdziwej, naturalnej, pełnej uczuć.' },
        styl: {
          bg: K('#E7E6E3'),
          h2: 'Jak pracuję',
          tekst: 'Mój styl to naturalność, ciepło i reportażowe spojrzenie. Pracuję z kobietami, parami i rodzinami z dziećmi — w plenerze, w studio i w domach klientów.',
          wartosci: [
            { tytul: 'Indywidualne podejście', opis: 'Do każdej sesji podchodzę bardzo indywidualnie.' },
            { tytul: 'Pasja', opis: 'Fotografuję z miłością.' },
            { tytul: 'Kreatywność', opis: '' }
          ]
        },
        dlaczego: { bg: B('dlaczego-warto-tlo', 'Obiektyw aparatu trzymany w dłoni na tle jeziora', 60), h2: 'Dlaczego klienci mnie wybierają', tekst: 'Oferuję przystępne cenowo pakiety, w których zawarta jest większa ilość zdjęć. Nowoczesne metody retuszu przyspieszają moją pracę, dzięki czemu czas od wykonania sesji do oddania zdjęć wynosi zaledwie 2 tygodnie.' },
        gdzie: { bg: K('#F5F4F1'), h2: 'Gdzie fotografuję', tekst: 'Pracuję na terenie gminy Łańcut, ale można się ze mną umówić także na sesje w Rzeszowie, Leżajsku, Przeworsku i okolicach (do ok. 50 km od Łańcuta). Fotografuję w plenerze, w studio oraz w domach klientów.', btn: 'Zapytaj o termin' }
      },

      /* ======================= OFERTA ======================= */
      oferta: {
        seo: {
          title: 'Sesje zdjęciowe Łańcut | Natalia Perkowska Fotografia',
          desc: 'Sesje portretowe, rodzinne, lifestylowe i studyjne w Łańcucie, Rzeszowie, Przeworsku i Leżajsku. Zobacz pakiety i zapytaj o wolny termin sesji.'
        },
        hero: { bg: B('oferta-tlo-sesje-zdjeciowe', 'Para idąca za rękę przez trawy w plenerze — sesja w plenerze', 54), nad: 'Oferta', h1: 'Sesje zdjęciowe w Łańcucie, Rzeszowie i okolicach', tekst: 'Wybierz rodzaj sesji, a potem pakiet, który najlepiej pasuje do Ciebie.' },
        kategorie: [
          { id: 'portretowe', nazwa: 'Sesje portretowe i wizerunkowe', opis: 'Naturalne portrety, na których wyglądasz jak Ty: do profilu zawodowego, na pamiątkę albo po prostu dla siebie. Bez sztywnego pozowania.', img: IMG + 'sesje-portretowe-wizerunkowe.webp', alt: 'Portret kobiety z zamkniętymi oczami w miękkim świetle', widoczna: true },
          { id: 'rodzinne', nazwa: 'Sesje rodzinne, noworodkowe i ciążowe', opis: 'Prawdziwe emocje rodziny w kadrze: oczekiwanie na dziecko, pierwsze dni noworodka i zwykłe niedziele. W domu lub w plenerze.', img: IMG + 'sesje-rodzinne-noworodkowe-ciazowe.webp', alt: 'Mama przytulająca dziecko w jesiennym świetle', widoczna: true },
          { id: 'lifestyle', nazwa: 'Sesje lifestyle w domu klienta', opis: 'Codzienne chwile opowiedziane reporterskim okiem: poranna kawa, wspólne gotowanie, zabawa. Przychodzę do Ciebie i fotografuję to, co dla Ciebie ważne.', img: IMG + 'sesje-lifestyle-w-domu-klienta.webp', alt: 'Mama z dziećmi na kanapie w domu — sesja lifestyle', widoczna: true },
          { id: 'studyjne', nazwa: 'Sesje studyjne', opis: 'Portrety w studiu na jasnym tle, bez rozpraszaczy. Dobry wybór, gdy pogoda jest kapryśna albo potrzebujesz zdjęć do CV i profilu.', img: IMG + 'sesje-studyjne.webp', alt: 'Portret kobiety na jasnym tle — sesja studyjna', widoczna: true }
        ],
        pakietyH2: 'Pakiety sesji',
        pakietyWstep: 'Przystępne cenowo pakiety z większą liczbą zdjęć. Gotowe, wyretuszowane zdjęcia otrzymasz po 2 tygodniach.',
        gdzie: { bg: K('#E7E6E3'), h2: 'Gdzie odbywają się sesje', tekst: 'Fotografuję w plenerze, w studio oraz w domach klientów — na terenie gminy Łańcut oraz w Rzeszowie, Leżajsku, Przeworsku i okolicach (do ok. 50 km od Łańcuta).', btn: 'Zapytaj o termin' }
      },

      /* ======================= CENNIK ======================= */
      cennik: {
        seo: {
          title: 'Cennik sesji zdjęciowych | Natalia Perkowska Fotografia',
          desc: 'Sprawdź cennik sesji zdjęciowych w Łańcucie i okolicach: pakiety Chwila, Pamiątka i Opowieść z cenami. Przystępne pakiety z większą liczbą zdjęć.',
        },
        hero: { bg: B('cennik-tlo-pakiety-sesji', 'Odbitki zdjęć przypięte do tablicy — cennik sesji', 64), nad: 'Cennik', h1: 'Cennik sesji zdjęciowych — pakiety Chwila, Pamiątka, Opowieść', tekst: 'Przejrzyste ceny pakietów — bez dopytywania i niespodzianek.' },
        tabele: { bg: K('#F5F4F1'), h2: 'Pakiety i ceny' },
        pozycje: [
          { kat: 'Pakiety sesji', nazwa: 'Pakiet Chwila', dopisek: '20 zdjęć w wersji cyfrowej, wyretuszowane i gotowe po 2 tygodniach', czas: 'ok. 1 godzina', cena: '350 zł' },
          { kat: 'Pakiety sesji', nazwa: 'Pakiet Pamiątka', dopisek: '40 zdjęć w wersji cyfrowej, wyretuszowane i gotowe po 2 tygodniach', czas: 'ok. 1,5 godziny', cena: '550 zł' },
          { kat: 'Pakiety sesji', nazwa: 'Pakiet Opowieść', dopisek: '80 zdjęć w wersji cyfrowej, wyretuszowane i gotowe po 2 tygodniach', czas: 'ok. 3 godziny', cena: '950 zł' }
        ],
        uwaga: 'Dojazd do klienta w promieniu do 50 km od Łańcuta. Dojazd do 20 km od Łańcuta jest wliczony w cenę, dalej doliczam 1,50 zł za każdy kilometr. Rezerwację potwierdza bezzwrotny zadatek 100 zł, a odbiór zdjęć w wersji elektronicznej w trybie EKSPRESS (do 7 dni roboczych) kosztuje dodatkowo 100 zł. Podany cennik ma charakter informacyjny — dokładną wycenę ustalimy po rozmowie.'
      },

      /* ======================= PORTFOLIO ======================= */
      portfolio: {
        seo: {
          title: 'Portfolio fotograf Łańcut | Natalia Perkowska Fotografia',
          desc: 'Zobacz portfolio sesji portretowych, rodzinnych, lifestylowych i studyjnych. Naturalne, ciepłe, reporterskie zdjęcia — fotograf Łańcut i Rzeszów.'
        },
        hero: { bg: B('portfolio-tlo-galerie', 'Para spacerująca jesienną aleją — portfolio sesji', 55), nad: 'Portfolio', h1: 'Portfolio — sesje kobiece, rodzinne i lifestylowe', tekst: 'Wybierz kategorię i przewijaj kadry na pełnym ekranie.' },
        galeria: { bg: K('#161616', 'jasny'), h2: 'Galeria zdjęć' },
        kategorie: [{ nazwa: 'Portretowe i wizerunkowe' }, { nazwa: 'Rodzinne, noworodkowe i ciążowe' }, { nazwa: 'Lifestyle' }, { nazwa: 'Studyjne' }],
        zdjecia: [
          { img: IMG + 'galeria-01-portret-kobiecy-plener.webp', alt: 'Portret kobiety w plenerze w świetle zachodzącego słońca', kat: 'Portretowe i wizerunkowe', podpis: 'Portret w plenerze', widoczna: true },
          { img: IMG + 'galeria-02-rodzina-w-domu.webp', alt: 'Mama z dwójką małych dzieci na kanapie w domu', kat: 'Rodzinne, noworodkowe i ciążowe', podpis: 'Rodzina w domu', widoczna: true },
          { img: IMG + 'galeria-03-para-spacer.webp', alt: 'Para trzymająca się za ręce w wysokich trawach', kat: 'Lifestyle', podpis: 'Spacer we dwoje', widoczna: true },
          { img: IMG + 'galeria-04-studio-portret.webp', alt: 'Portret kobiety na jasnym tle w ruchu — ujęcie studyjne', kat: 'Studyjne', podpis: 'Portret studyjny', widoczna: true },
          { img: IMG + 'galeria-05-dziecko-zabawa.webp', alt: 'Małe dziecko biegnące po trawie w parku', kat: 'Rodzinne, noworodkowe i ciążowe', podpis: 'Zabawa', widoczna: true },
          { img: IMG + 'galeria-06-ciaza-okno.webp', alt: 'Sesja ciążowa — sylwetka przy oknie z firanką', kat: 'Rodzinne, noworodkowe i ciążowe', podpis: 'Oczekiwanie', widoczna: true },
          { img: IMG + 'galeria-07-lifestyle-kawiarnia.webp', alt: 'Nastrojowy portret kobiety w świetle sceny', kat: 'Lifestyle', podpis: 'Światło i cień', widoczna: true },
          { img: IMG + 'galeria-08-detal-dlonie.webp', alt: 'Dłoń trzymająca obiektyw — detal z sesji', kat: 'Portretowe i wizerunkowe', podpis: 'Szczegół', widoczna: true }
        ]
      },

      /* ======================= OPINIE ======================= */
      opinie: {
        seo: {
          title: 'Opinie o fotografie Łańcut | Natalia Perkowska Fotografia',
          desc: 'Przeczytaj, co o sesjach zdjęciowych z Natalią Perkowską piszą kobiety, pary i rodziny. Opinie klientów fotografa z Łańcuta — zapytaj o termin swojej sesji.'
        },
        tlo: { bg: K('#F5F4F1'), h1: 'Opinie klientów', wstep: 'Co mówią osoby, które były na sesji.' },
        lista: [], // START PUSTA — wpisy dodaje klientka (autor, usługa, ocena 3–5, treść). Nie wymyślamy opinii.
        linkGoogle: ''
      },

      /* ======================= FAQ ======================= */
      faq: {
        seo: {
          title: 'Sesja zdjęciowa – FAQ | Natalia Perkowska Fotografia',
          desc: 'Gdzie odbywają się sesje, jak się przygotować i ile czeka się na zdjęcia? Odpowiedzi na najczęstsze pytania o sesję zdjęciową z fotografem z Łańcuta.'
        },
        tlo: { bg: K('#F5F4F1'), h1: 'Najczęstsze pytania o sesję zdjęciową', wstep: 'Wszystko, o co klienci pytają najczęściej, w jednym miejscu.' },
        // ok: true = odpowiedź pochodzi z briefu i trafia do danych strukturalnych FAQPage; false = propozycja / do uzupełnienia
        pytania: [
          { q: 'W jakim miejscu wykonywane są sesje?', a: 'Fotografuję w plenerze, w studio oraz w domach klientów. Pracuję na terenie gminy Łańcut, a także w Rzeszowie, Leżajsku, Przeworsku i okolicach — do ok. 50 km od Łańcuta.', ok: true, widoczna: true },
          { q: 'Jak przygotować się do sesji?', a: 'Najlepiej przyjść wypoczętą i w ubraniach, w których czujesz się dobrze. Postaw na proste ubrania w stonowanych kolorach i unikaj dużych napisów. Szczegółowe wskazówki dotyczące stylizacji ustalimy po umówieniu terminu.', ok: false, widoczna: true },
          { q: 'Jaki jest czas oczekiwania na gotowe zdjęcia?', a: 'Gotowe, wyretuszowane zdjęcia otrzymasz po zaledwie 2 tygodniach od sesji.', ok: true, widoczna: true },
          { q: 'Czy muszę mieć profesjonalny makijaż i ułożone włosy?', a: 'Nie. Wystarczy, że będziesz wyglądać tak, jak czujesz się najlepiej na co dzień. Jeśli chcesz, możesz skorzystać z makijażu, ale nie jest to wymagane — zależy mi na naturalności.', ok: false, widoczna: true },
          { q: 'Nie potrafię pozować. Obawiam się, że źle wyjdę na zdjęciach', a: 'Nie musisz umieć pozować. Podczas spotkania dbam o ciepłą atmosferę, we wszystkim pomagam i staram się, żebyś czuł(a) się swobodnie — dzięki temu ujęcia są naturalne i autentyczne.', ok: true, widoczna: true },
          { q: 'Czy posiadasz garderobę, z której mogę skorzystać?', a: 'Nie prowadzę garderoby, ale chętnie doradzę przy wyborze strojów. Najlepiej sprawdzają się proste, jednolite ubrania w stonowanych kolorach, w których dobrze się czujesz.', ok: false, widoczna: true },
          { q: 'Czy konieczna jest zgoda na publikację zdjęć?', a: 'Zgoda jest dobrowolna. Zdjęcia z sesji mogę pokazać na stronie, w mediach społecznościowych i w portfolio tylko za Twoją zgodą, a w sprawie zdjęć dzieci decydują rodzice. Szczegóły są w punkcie 18 regulaminu.', ok: false, widoczna: true },
          { q: 'Czy otrzymam surowe pliki?', a: 'Nie, surowych plików RAW nie przekazuję ani nie sprzedaję. Najpierw wybierasz zdjęcia z prywatnej galerii (pliki w mniejszej rozdzielczości, ze znakiem wodnym), a potem dostajesz je obrobione, zgodnie z wybranym pakietem.', ok: false, widoczna: true },
          { q: 'Czy jest możliwość zakupu vouchera prezentowego?', a: 'Tak — na stronie Voucher znajdziesz informacje o bonach podarunkowych na sesję zdjęciową.', ok: false, widoczna: true },
          { q: 'Czy można uzyskać rabat na sesje?', a: 'Czasem przygotowuję oferty specjalne, o których informuję na stronie i w mediach społecznościowych. Po rabat na kolejną sesję możesz zapytać również w wiadomości.', ok: false, widoczna: true }
        ]
      },

      /* ======================= AKTUALNOŚCI ======================= */
      aktualnosci: {
        seo: {
          title: 'Aktualności fotograf Łańcut | Natalia Perkowska Fotografia',
          desc: 'Nowości, wolne terminy i zapowiedzi sesji zdjęciowych od fotografa z Łańcuta, działającego też w Rzeszowie. Sprawdź, co nowego, i zapytaj o termin.'
        },
        tlo: { bg: K('#F5F4F1'), h1: 'Aktualności', wstep: 'Nowości, terminy i zapowiedzi.' },
        wpisy: [] // wpisy dodaje klientka w panelu: tytuł, treść, data, „pokazuj od/do”, „na górnym pasku”
      },

      /* ======================= BONY ======================= */
      bony: {
        seo: {
          title: 'Voucher na sesję zdjęciową | Natalia Perkowska Fotografia',
          desc: 'Podaruj sesję zdjęciową — voucher prezentowy na sesję w Łańcucie, Rzeszowie i okolicach. Pomysł na prezent dla mamy, pary lub rodziny. Zapytaj o szczegóły.'
        },
        hero: { bg: B('bony-tlo-prezent-sesja', 'Białe pudełko z czerwoną wstążką — voucher na sesję zdjęciową', 50), nad: 'Bony podarunkowe', h1: 'Voucher na sesję zdjęciową — pomysł na prezent', tekst: 'Podaruj bliskim chwilę, która zostanie na zdjęciach na lata.' },
        warunki: {
          bg: K('#F5F4F1'),
          h2: 'Jak działa voucher',
          wstep: 'Voucher możesz przeznaczyć na dowolny pakiet sesji. Obdarowana osoba sama wybiera termin i miejsce, a ja dopasowuję sesję do jej stylu.',
          punkty: [
            { tekst: 'Wartość vouchera: dowolna kwota lub wybrany pakiet (Chwila, Pamiątka, Opowieść)', widoczna: true },
            { tekst: 'Termin ważności: 12 miesięcy od daty zakupu; bonu nie można wymienić na gotówkę ani zwrócić', widoczna: true },
            { tekst: 'Zamówienie: napisz lub zadzwoń — na życzenie przygotuję ręcznie wykonany voucher w cenie zakupu', widoczna: true }
          ],
          btn: 'Zapytaj o voucher'
        }
      },

      /* ======================= REGULAMIN ======================= */
      regulamin: {
        seo: {
          title: 'Regulamin sesji zdjęciowej | Natalia Perkowska Fotografia',
          desc: 'Regulamin sesji zdjęciowej Natalii Perkowskiej: rezerwacja terminu, przebieg sesji, czas realizacji i prawa do zdjęć. Sprawdź zasady współpracy.'
        },
        tlo: { bg: K('#F5F4F1'), h1: 'Regulamin sesji zdjęciowej' },
        // TREŚĆ ROBOCZA — regulaminu ze starej strony nie udało się pobrać automatycznie; klientka wkleja właściwy tekst w panelu (Regulamin).
        // Regulamin dostarczony przez klientkę (oryginalny tekst; poprawiono tylko oczywiste literówki). Edycja: panel → Regulamin.
        tekst: 'Poniższy regulamin powstał w celu ułatwienia kontaktu i dobrej współpracy z Tobą – nazwanym/ą w regulaminie KLIENTEM, a mną czyli FOTOGRAFEM.\n\n**1.** Każdy Klient przed sesją otrzymuje link do tego regulaminu i ma obowiązek zapoznania się z nim. Umówienie się na sesję zdjęciową jest jednocześnie akceptacją warunków panujących w regulaminie.\n\n**2.** Niniejszy regulamin jest obowiązkowym dokumentem, z którym klient ma obowiązek zapoznać się przed wykonaniem sesji zdjęciowej. Zapisanie się na sesję jest równoznaczne z zapoznaniem się i akceptacją regulaminu. Nieprzeczytanie tego dokumentu nie zwalnia klienta z przestrzegania zasad w nim zawartych.\n\n**3.** Po rezerwacji terminu sesji klient ma 3 dni na dokonanie wpłaty bezzwrotnego zadatku w wysokości 100 zł. Brak dokonania wpłaty jest równoznaczne z rezygnacją z sesji, zaś w przypadku rezygnacji z sesji zadatek przepada.\n\n**4.** Jeśli z ważnych przyczyn losowych Klient lub Fotograf nie może pojawić się na sesji to należy odwołać ją min. 24 h przed terminem sesji. W przypadku takiej sytuacji ustalimy nowy termin sesji.\n\n**5.** W przypadku sesji plenerowych jedynie bardzo złe warunki pogodowe są wskazaniem do przełożenia terminu sesji, np. porywisty wiatr, burza, duży mróz. Zachmurzone niebo, mgła, przelotny deszcz nie są przeciwskazaniem do sesji. W przypadku plenerów to wręcz dodatkowe atuty, które dodadzą kadrom sporo magii.\n\n**6.** Płatność za sesję następuje w dniu sesji gotówką, a za dodatkowe kadry płatność przy odbiorze zdjęć. Istnieje możliwość płatności przelewem za sesję, ale przelew powinien być wykonany przed sesją tak, aby w dniu sesji wpłata była zaksięgowana na koncie.\n\n**7.** W przypadku sesji rodzinnej sesja dotyczy jednej konkretnej rodziny, która składa się z określonej liczby osób, o której muszę zostać poinformowana przed sesją. Nie ma możliwości by do sesji w trakcie jej trwania dołączyły dodatkowe osoby (np. znajomi, kuzynostwo).\n\n**8.** Klient otrzymuje jedynie obrobione pliki zgodnie z wybranym pakietem. Nie ma możliwości otrzymania/zakupu surowych zdjęć RAW.\n\n**9.** Po wykonanej sesji w terminie do 5 dni Klient otrzymuje zdjęcia do wyboru w prywatnej galerii. Fotografie w galeriach to surowe pliki niepoddane obróbce graficznej, w pomniejszonej rozdzielczości, zabezpieczone znakiem wodnym. Wydłużenie czasu wyboru zdjęć przez klienta może skutkować wydłużeniem terminu oddania gotowego materiału. Brak wyboru zdjęć przez klienta w przeciągu podanego czasu automatycznie skutkuje wyborem zdjęć przez fotografa.\n\n**10.** W terminie do 30 dni od wyboru zdjęć przez Klienta, Fotograf prześle na maila gotowe zdjęcia w wersji elektronicznej oraz powiadomi o terminie odbioru odbitek oraz domówionych fotoproduktach.\n\n**11.** Istnieje możliwość odbioru gotowej sesji w wersji elektronicznej w terminie do 7 dni roboczych od jej wykonania za dodatkową opłatą 100 zł, jest to tzw. usługa EKSPRESS.\n\n**12.** Fotograf przetrzymuje niewybrane zdjęcia na dysku do czasu oddania gotowych zdjęć czyli realizacji zamówienia. W tym czasie Klient może dokupić dodatkowe ujęcia. Po obróbce i oddaniu gotowych zdjęć klientowi, pozostałe zdjęcia są usuwane z dysku. Po realizacji zamówienia obrobione zdjęcia są przechowane 6 miesięcy - po tym czasie są nieodwracalnie usuwane z dysku.\n\n**13.** Zgodnie z prawem autorskim klient zobowiązuje się nie edytować gotowych zdjęć np. nakładać filtrów, edytować na własną rękę.\n\n**14.** Klient oświadcza, że zapoznał się z portfolio fotografa i akceptuje ustaloną estetykę bez późniejszych dodatkowych żądań w kwestii obróbki graficznej oraz retuszu. Nie ma możliwości reklamacji ujęć w oparciu o wyżej wymienione aspekty. Zastrzegam także, że każda z sesji różni się od siebie, a zmiany te wynikają z różnych warunków plenerowych (pora roku, pora dnia, miejsce, warunki oświetleniowe) oraz oczekiwań Klienta ustalonych z fotografem przed sesją.\n\n**15.** Zakres standardowej obróbki nie obejmuje przekopiowywania postaci na zdjęciach, otwierania zamkniętych oczu na zdjęciu, usuwanie zmarszczek, wykonywania makijażu w programie Photoshop, "prasowania" ubrań w programie, farbowania odrostów włosów i paznokci. Taki rodzaj obróbki jest dodatkowo płatny.\n\n**16.** Przed sesją Klient deklaruje wybrany pakiet zdjęciowy. Po sesji pakiet nie może zostać pomniejszony. Do każdego pakietu można dokupić dodatkowe, obrobione zdjęcia w wyznaczonej cenie. Szczegóły w zakładce Oferta.\n\n**17.** Istnieje możliwość wykupienia sesji w postaci bonu podarunkowego. Bon ma ważność 12 miesięcy od daty zakupu i w tym czasie należy wykonać sesję. Istnieje możliwość otrzymania ręcznie wykonanego vouchera w cenie zakupu. Bonu nie można wymienić na gotówkę jak również nie można go zwrócić. Po upływie 12 miesięcy bez żadnego kontaktu od Klienta, bon traci swoją ważność. Wskazane jest więc aby obdarowana osoba zgłosiła się jak najwcześniej do Fotografa w celu ustalenia terminu oraz szczegółów sesji. Zgłoszenie się do Fotografa kilka dni przed końcem ważności bonu nie daje gwarancji wykonania sesji.\n\n**18.** Klient może dobrowolnie wyrazić zgodę na przetwarzanie swoich danych osobowych w tym na wykorzystanie swojego wizerunku utrwalonego na wykonanych fotografiach w celach marketingowych i promocyjnych przez ich publikację na stronie internetowej (www), za pośrednictwem portali społecznościowych takich jak Facebook (Zaczarowane Sesje - Natalia Perkowska), Instagram (@zaczarowane_sesje) oraz w galeriach i wystawach, wykorzystywania w portfolio drukowanym (zdjęcia, fotoksiążki, fotoalbumy, fotoobrazy, ulotki, wizytówki, banery itp.) i udostępnianym klientom i potencjalnym klientom, oraz przekazanie danych osobowych w postaci wizerunku usługodawcom zewnętrznym z którymi wykonawca usługi współpracuje w obrębie działalności którą prowadzi.\n\n*Szanowny Kliencie - dla Fotografa zgoda na publikacje jest niezwykle ważna, bo to jedyna droga by móc promować swoją pracę. Jest mi bardzo miło kiedy mogę pochwalić się efektami sesji i gdy ktoś tak jak Ty trafi do mnie widząc Twoje zdjęcia.*\n\n**19.** Udostępnianie i rozpowszechnianie zdjęć w celach zarobkowych/komercyjnych bez mojej zgody jest zabronione.\n\n**20.** Moja praca jest również moją wielką pasją, co dla Was stanowi wspaniały bonus, ponieważ możecie mieć pewność, że oddam jej całe swoje serce i zaangażowanie. Wszyscy Klienci są dla mnie równie ważni, to dzięki Wam mogę się rozwijać i tworzyć piękne kadry. Każdy moment spędzony z Wami to dla mnie zaszczyt.',
        aktualizacja: '2026-11-25'
      },

      /* ======================= KONTAKT ======================= */
      kontakt: {
        seo: {
          title: 'Fotograf Łańcut — kontakt | Natalia Perkowska Fotografia',
          desc: 'Zapytaj o termin sesji zdjęciowej: zadzwoń, napisz e-mail lub wiadomość na Instagramie albo wyślij formularz. Fotograf Łańcut, Rzeszów, Przeworsk, Leżajsk.'
        },
        tlo: { bg: B('kontakt-tlo-sesja-w-domu', 'Sylwetka kobiety w ciąży przy oknie z firanką — sesja w domu klienta', 60), h1: 'Kontakt — zapytaj o termin sesji zdjęciowej', wstep: 'Zadzwoń, napisz lub wyślij formularz — odpowiem i wspólnie wybierzemy termin.' },
        tematy: [{ nazwa: 'Sesja portretowa / wizerunkowa' }, { nazwa: 'Sesja rodzinna, noworodkowa lub ciążowa' }, { nazwa: 'Sesja lifestyle w domu klienta' }, { nazwa: 'Sesja studyjna' }, { nazwa: 'Voucher na sesję' }, { nazwa: 'Inne pytanie' }]
      },

      /* ======================= POLITYKA ======================= */
      polityka: {
        seo: {
          title: 'Polityka prywatności | Natalia Perkowska Fotografia',
          desc: 'Polityka prywatności i cookies serwisu Natalia Perkowska Fotografia: administrator danych, cele przetwarzania, prawa osób oraz Piksel Facebooka po zgodzie.'
        },
        tlo: { bg: K('#F5F4F1'), h1: 'Polityka prywatności' },
        dodatek: '',
        aktualizacja: '25 listopada 2026'
      }
    }
  };

});
