# Natalia Perkowska Fotografia — wdrożenie i obsługa

Czysty HTML/CSS/JS (bez frameworków) + Cloudflare Pages Functions + KV (panel administratora). Treść strony jest w HTML-u (widoczna bez JS), a zmiany z panelu są wstrzykiwane po stronie serwera, więc Google widzi je od razu.

## 1. Wdrożenie (Cloudflare Pages)

1. **Repozytorium:** wgraj całą zawartość ZIP-a do GitHuba (bez `.wrangler`, `.dev.vars`).
2. **Domena:** proponowana `nataliaperkowska.pl` (jeszcze niezakupiona). Zmiana: `public/assets/js/dane.js` → `firma.domena` (albo w panelu: Dane firmy i RODO), potem `node narzedzia/zbuduj.mjs`.
3. **KV:** Cloudflare → Workers & Pages → KV → *Create namespace* (np. `np-tresci`). W projekcie Pages: *Settings → Bindings → KV namespace* → zmienna **`TRESCI`**. W repozytorium nie ma pliku `wrangler.toml` (jest `wrangler.toml.przyklad`): Cloudflare uznaje go za jedyne źródło konfiguracji i wywala wdrożenie przy nieprawdziwym ID KV. Wiązanie KV ustawiasz w panelu; w *Settings → Build* podaj *Build output directory* `public`, a *Build command* zostaw puste (strona jest już zbudowana). Jeśli wolisz konfigurację w pliku, zmień nazwę przykładu na `wrangler.toml` i wpisz prawdziwe ID namespace.
4. **Hasło do panelu:** startowe hasło to **`foto2026`** — działa od razu, bez żadnych ustawień w Cloudflare i GitHubie (potrzebna jest tylko baza KV `TRESCI`). Po pierwszym logowaniu wejdź w *Zmiana hasła* w panelu i ustaw własne (min. 8 znaków); zapisuje się w bazie i ma pierwszeństwo. Pulpit przypomina o zmianie, dopóki hasło jest startowe. Zapomniane hasło: usuń klucz `auth:hash` w KV (wraca `foto2026`). Opcjonalnie możesz ustawić `ADMIN_PASSWORD_HASH` i `SESSION_SECRET` (`node narzedzia/hash-hasla.mjs "hasło"`).
5. **Build:** *Framework preset: None*, *Build command:* puste (albo `node narzedzia/zbuduj.mjs`), *Build output directory:* `public`.
6. **Formularz (e-mail przez Resend):** `RESEND_API_KEY`, `MAIL_OD` (np. `Formularz <formularz@twojadomena.pl>`), `MAIL_DO` (adres odbiorcy). Bez zweryfikowanej domeny w Resend wiadomości dochodzą tylko na adres konta Resend.
7. **Opcjonalnie:** `TURNSTILE_SECRET` (+ klucz witryny w panelu) — antyspam; `INSTAGRAM_TOKEN` (konto profesjonalne) — najnowsze zdjęcia z Instagrama pobierane przez serwer strony (RODO), odświeżanie tokenu automatyczne.

> ⚠️ **„Przeciągnij i upuść” folder w Cloudflare NIE uruchamia katalogu `functions/`** — panel, formularz i SSR nie zadziałają. Wdrażaj przez Git (lub `wrangler pages deploy`).

Test lokalny: `node narzedzia/dev-serwer.mjs` (atrapa KV w pamięci, hasło testowe `testowe-haslo-123`, port 8766) lub `npx wrangler pages dev public --kv TRESCI` z `.dev.vars`.

## 2. Bezpieczeństwo

- Hasło: tylko hash PBKDF2-SHA256 (sól, 100 000 iteracji); w kodzie jest wyłącznie hash hasła startowego `foto2026` (jawne hasło startowe jest znane każdemu, kto czyta ten plik — dlatego zmień je od razu po wdrożeniu). Zmiana hasła w panelu unieważnia pozostałe sesje.
- Sesja 8 h: ciasteczko HttpOnly + Secure + SameSite=Strict, podpis HMAC, sesje w KV.
- 5 nieudanych logowań / 15 min z jednego IP → blokada.
- Zapis tylko z nagłówkiem `X-CMS: 1` i zgodnym `Origin` (CSRF).
- Kopia 10 ostatnich zapisów + przywracanie (Panel → Kopia zapasowa).
- CSP i nagłówki w `_headers` (dopuszcza wyłącznie: Piksel Facebooka, Turnstile, mapę Google po kliknięciu).
- Formularz: honeypot, min. czas wypełnienia, limit 5/h, walidacja serwerowa, zgoda RODO.

## 3. Co gdzie edytować (panel ↔ sekcja)

Panel: `/#panel` lub kłódka w lewym dolnym rogu. Każdy blok ma „Ta zmiana dotyczy sekcji” z podglądem na żywo i przyciskiem „Pokaż na stronie”.

| Panel | Strona / sekcja |
|---|---|
| Aktualności | `/aktualnosci/` + pasek komunikatów (daty od/do, wstrzymanie; podstrona ukryta, dopóki nie ma aktywnego wpisu) |
| Oferta i pakiety | `/oferta/` — CHWILA, PAMIĄTKA, OPOWIEŚĆ, rodzaje sesji |
| Cennik | `/cennik/` |
| Strona główna / O mnie | `/`, `/o-mnie/` (w tym „Dlaczego warto?”) |
| Galeria / portfolio | `/portfolio/` (pełnoekranowy slider) |
| Logo i wygląd | logo, kolory akcentu, animacje, kropki nawigacji |
| Opinie klientów | `/opinie/` (start pusta → strona ukryta i `noindex`) |
| Najczęstsze pytania | `/faq/` (JSON-LD `FAQPage` tylko dla odpowiedzi oznaczonych jako gotowe) |
| Bony / vouchery, Regulamin, Kontakt i formularz | `/bony/`, `/regulamin/`, `/kontakt/` |
| Dane firmy i RODO | stopka, polityka prywatności, klauzule |
| Piksel Facebooka | ID piksela, włączenie, opis zdarzeń |
| Sekcje strony i menu | włączanie/kolejność podstron, nazwy w menu |
| SEO, Wersje językowe, Zmiana hasła, Kopia zapasowa | ustawienia |

Klientka zwykle edytuje: **Teksty, Zdjęcia i galerię, Aktualności, Cennik, Regulamin**.

## 4. Uwagi projektowe (zmiany względem briefu)

- **Piksel Facebooka** dodany na prośbę klientki: ładuje się dopiero po zgodzie (baner z równorzędnymi „Akceptuję”/„Odrzuć”), zdarzenia PageView, ViewContent (oferta, cennik), Contact (tel./e-mail), Lead (formularz, bez danych osobowych); „Ustawienia cookies” w stopce; polityka prywatności opisuje Meta (współadministrowanie, transfer do USA).
- **Logo klientki** użyte bez przerysowywania; wersje ciemna/jasna to tylko przekolorowanie; favicony i ikony PWA z monogramu.
- **Zdjęcia:** 23 grafiki to zdjęcia z Unsplash (bezpłatna licencja Unsplash, bez obowiązku podawania autora; część ujęć kadrowana). Są to zdjęcia poglądowe — docelowo zastąp je realizacjami Natalii (panel → Galeria / Logo i wygląd; te same nazwy plików albo wgranie w panelu). Zdjęcia osób z banków nie mają zgód na wykorzystanie w reklamie konkretnej usługi, więc nie traktuj ich jako zdjęć „z sesji”. Identyfikatory zdjęć: `images.unsplash.com/photo-` + 1526835746352-0b9da4054862, 1476703993599-0035a21b17a9, 1739312023925-19eca8ca00aa, 1742624110229-a5e70b9722ba, 1608293937040-b41543161dba, 1762912913358-c39d7ff09ff8, 1763478986815-99cfdf2f7c79, 1543954616-be267def7835, 1453728013993-6d66e9c9123a, 1579348993795-2832fb0b453a, 1762314908181-42bbf3793da2, 1664817486438-2e802ad6ac5a, 1500051638674-ff996a0ec29e, 1545844568-98bb15133ec0, 1686604870397-d7e56c12b71c, 1746973486619-11183ddb1620.
- **Treści wymyślone przeze mnie (propozycje do akceptacji):** ceny i zawartość pakietów (Chwila 350 zł / 1 h / 20 zdjęć, Pamiątka 550 zł / 1,5 h / 40 zdjęć, Opowieść 950 zł / 3 h / 80 zdjęć), opisy rodzajów sesji, odpowiedzi FAQ 2, 4, 6, 7, 8, 10 (flagi `ok:false` — nie trafiają do danych strukturalnych, dopóki klientka ich nie zatwierdzi), zasady vouchera (6 miesięcy), zasady dojazdu (20 km wliczone, potem 1,50 zł/km) oraz szkic regulaminu (zadatek 30%, zmiana terminu 48 h, prawa autorskie). To nie są ustalenia klientki — trzeba je zatwierdzić albo zmienić w panelu.
- **Regulamin:** poprzednia strona nie była dostępna → własny szkic (patrz wyżej).
- **Hasło strony** (slogan): klientka nie ma — propozycja „Każda chwila ma swoje piękno” oznaczona `[HASŁO DO PODMIANY]`.
- Adres i NIP administratora (polityka prywatności) zostają jako `[DO UZUPEŁNIENIA]` — tych danych nie wymyślam.
- Podstrony bez treści (Opinie, Aktualności) chowają się automatycznie z menu i mapy strony.
- Wersja językowa: tylko PL (przełącznik pojawia się dopiero po włączeniu drugiego języka).

## 5. Lista kontrolna SEO

✅ unikalny title (≤60) i description (140–160) na każdej stronie · ✅ canonical, Open Graph, Twitter Card · ✅ JSON-LD: ProfessionalService, WebSite, WebPage, BreadcrumbList, FAQPage (warunkowo) · ✅ sitemap.xml, robots.txt, 404 · ✅ favicony, manifest, theme-color · ✅ `lang="pl"`, jedno H1 na stronę · ✅ alt, width/height, lazy · ✅ lokalne czcionki · ✅ SSR zmian z panelu
⏳ domena i `firma.domena` · ⏳ prawdziwe zdjęcia i alt-y · ⏳ uzupełnienie `[DO UZUPEŁNIENIA]` · ⏳ Google Search Console · ⏳ GA4 (zakomentowany w szablonie; włączać razem z banerem zgody) · ⏳ wizytówka Google (Profil Firmy) · ⏳ prawdziwe opinie · ⏳ przegląd prawnika (polityka, regulamin)

### Search Console — krok po kroku
1. search.google.com/search-console → *Dodaj usługę* → *Prefiks adresu URL* → `https://twojadomena.pl/`.
2. Weryfikacja: tag HTML — w `szablony/strona.html` odkomentuj linię `google-site-verification` i wklej swój kod, potem `node narzedzia/zbuduj.mjs` i wdróż (alternatywnie: weryfikacja przez DNS w Cloudflare).
3. *Mapy witryn* → wpisz `sitemap.xml` → Wyślij.
4. *Sprawdzanie adresu URL* → strona główna → *Poproś o zindeksowanie*.

## 6. Propozycje dodatkowe

Wersja EN/DE (blisko granicy to realny rynek), prawdziwe opinie z Google, kilka wpisów-porad w Aktualnościach (np. „Co ubrać na sesję”), podstrony lokalne (Rzeszów, Przeworsk, Leżajsk), prawnik do polityki i regulaminu.

## 7. Kolorystyka

Paleta zgodna z życzeniem klientki — stonowana, neutralna: złamana biel `#F5F4F1`, jasny szary `#E7E6E3` / linie `#D2D1CD`, grafit `#5C5B58` (tekst pomocniczy), czerń `#161616`. Akcent to ciemny grafit `#2E2E2C`; zdjęcia z banku są dodatkowo odsycone, żeby nie wprowadzać kolorów. Zmienne kolorów: `szablony/krytyczny.css` (`:root`), po zmianie `node narzedzia/zbuduj.mjs`.
