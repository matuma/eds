# AEM Architect na EDS — treść, kod i publikacja

Projekt odtwarza stronę główną AEM Architect w natywnym EDS. Zawiera też strony przeglądowe Services, Work, About, Insights i Contact, przygotowane z istniejących opisów. Pełne artykuły i case studies nie istniały w projekcie źródłowym: ich karty prowadzą teraz do opisów na stronach przeglądowych. Adres kontaktowy trzeba uzupełnić w dokumencie `contact`.

## 1. Gdzie co się znajduje

| Element | Miejsce | Jak zmienić |
| --- | --- | --- |
| Wygląd, zachowanie bloków | `blocks/`, `scripts/`, `styles/` w repo GitHub `matuma/eds` | Edycja plików, commit, push |
| Fonty i ikony interfejsu | `fonts/`, `icons/` w repo | Commit i push |
| Teksty, linki, kolejność sekcji, obrazy artykułów | [DA: matuma/eds](https://da.live/#/matuma/eds) | Edycja dokumentu, Preview, Publish |
| Początkowa kopia treści do nauki/importu | `content/*.plain.html` i `content/media/` lokalnie | Edytor kodu; import przez dołączone narzędzie |
| Połączenie kodu z treścią | [Configuration Service](https://tools.aem.live/) | Konfiguracja witryny `matuma/eds` |

EDS łączy kod z GitHuba i dokumenty z DA. Nie uruchamia tutaj serwera Next.js ani buildu React. Strona ma zwykły HTML, a pliki JS bloków dekorują dostarczony dokument. Każdy blok ładuje własny CSS i JS. [Opis architektury projektu](https://www.aem.live/developer/anatomy-of-a-project).

`content/` jest **zestawem startowym**, a nie automatyczną synchronizacją z DA. Po imporcie wybierz miejsce pracy: najlepiej edytować treść w DA. Kolejny import lokalnej kopii z `--replace` zastąpi późniejsze zmiany autora, choć wcześniej zapisze backup. Sam commit plików `content/` nie publikuje dokumentów — ten katalog jest wyłączony z Code Bus przez `.hlxignore`.

## 2. Najpierw uruchom lokalnie

W PowerShell:

```powershell
cd C:\projects\eds
npm.cmd ci
npm.cmd run dev
```

Otwórz [http://localhost:3000/](http://localhost:3000/). Ta komenda używa lokalnego kodu i lokalnych dokumentów z `content/`. Logowanie do Adobe nie jest potrzebne. `npm.cmd` omija problem z zablokowanym przez PowerShell skryptem `npm.ps1`.

Jeżeli port 3000 jest zajęty:

```powershell
npm.cmd run dev -- --port 3001
```

Wyłącz serwer przez `Ctrl+C`. Aby oglądać **lokalny kod z treścią już previewowaną w DA**, uruchom zamiast niego:

```powershell
npm.cmd run dev:da
```

Tryb `dev:da` pobiera dokumenty z `https://main--eds--matuma.aem.page`. Zmiany zapisane tylko w edytorze DA nie będą tam widoczne, dopóki nie wykonasz Preview. [Dokumentacja CLI](https://www.aem.live/developer/cli-reference).

## 3. Jak dokument staje się stroną

| Dokument w DA | URL strony |
| --- | --- |
| `index` | `/` |
| `services` | `/services` |
| `work` | `/work` |
| `about` | `/about` |
| `insights` | `/insights` |
| `contact` | `/contact` |
| `nav` | współdzielony nagłówek, pobierany jako `/nav.plain.html` |
| `footer` | współdzielona stopka, pobierana jako `/footer.plain.html` |

W edytorze widzisz dokument z nagłówkami, akapitami, linkami i tabelami. Tabela o pierwszym wierszu `Stats` tworzy blok `stats`, a pliki `blocks/stats/stats.js` i `stats.css` nadają mu układ kart. Nie trzeba wpisywać JS/CSS do DA.

Sekcje dokumentu oddziela się podziałem sekcji (poziomą linią w edytorze). W zapisanym HTML każda sekcja jest osobnym `<div>` wewnątrz `<main>`. Zwykłe nagłówki i akapity poza tabelami to **default content**.

`Hero (intro)` oznacza blok `hero` z wariantem `intro`. `Section Metadata` opisuje sekcję: `Style = dark` nadaje granatowe tło, `Anchor = work` ustawia odnośnik `#work`. `Metadata` na końcu dokumentu opisuje całą stronę: `title` i `description` trafiają do `<head>`.

## 4. Wgraj kod na gałąź testową

Obecny publiczny podgląd witryny odpowiada HTTP 200, więc podstawowe połączenie EDS już działa. Przed wgraniem nowej treści udostępnij kod jej bloków na gałęzi, np. `aem-architect`:

```powershell
git switch -c aem-architect
git diff
git add blocks scripts styles icons fonts head.html package.json package-lock.json README.md docs content tools test playwright.config.js .gitignore .hlxignore .eslintrc.js
git commit -m "feat: add AEM Architect site and DA learning workflow"
git push -u origin aem-architect
```

Jeżeli gałąź już istnieje, użyj `git switch aem-architect`. Przejrzyj przygotowany commit przed pushem, zwłaszcza jeżeli dodałeś własne zmiany.

Adres kodu tej gałęzi: **https://aem-architect--eds--matuma.aem.page/**. AEM Code Sync musi mieć dostęp do repozytorium. Jeśli adres nie działa, sprawdź instalację [AEM Code Sync](https://github.com/apps/aem-code-sync) i ustawienia witryny w [tools.aem.live](https://tools.aem.live/). Konfiguracja powinna wskazywać kod `matuma/eds` i źródło `https://content.da.live/matuma/eds/` typu `markup`. Ponieważ obecny podgląd działa, nie ma potrzeby tworzyć konfiguracji od nowa. Nie dodawaj `fstab.yaml`. [Configuration Service](https://www.aem.live/docs/config-service-setup).

## 5. Zaimportuj przygotowaną treść do DA

### Zaloguj się i pobierz kopię obecnych dokumentów

W drugim terminalu, w katalogu projektu:

```powershell
npm.cmd run content:login
```

Zaloguj się do Adobe w otwartej przeglądarce. Komenda korzysta z oficjalnego `aem content clone`, ale uruchamia go w osobnym katalogu `.local/da-sessions/<data>/`. Twoje obecne dokumenty są pobierane tam jako kopia. Lokalny katalog startowy `content/` pozostaje dostępny do podglądu. Token trafia do ignorowanego `.local/da-token.json`; nie trzeba go kopiować do czatu ani plików repozytorium.

### Sprawdź plan i wykonaj import

```powershell
npm.cmd run content:check
npm.cmd run content:upload
npm.cmd run content:upload -- --write --replace
```

Druga komenda tylko wypisuje plan; nie wywołuje API. Trzecia wgrywa 8 dokumentów i 5 ilustracji do `matuma/eds`. `--replace` jest potrzebne, ponieważ masz już `index`, `nav` i `footer`. Przed nadpisaniem narzędzie pobiera poprzednie wersje do `.local/da-backups/<data>/`, następnie zapisuje pliki i odczytuje je ponownie, sprawdzając zgodność. Zamknij edycję tych dokumentów na czas pierwszego importu, aby nie konkurować z automatycznym zapisem DA.

Import działa przez DA Source API: `PUT`, `multipart/form-data`, pole `data`. Obrazy są wgrywane najpierw, a adresy w dokumentach zamieniane na pełne adresy `content.da.live`, dostępne dla pipeline’u Adobe. [Kontrakt Source API](https://docs.da.live/developers/api/source).

Możesz też wyeksportować pliki bez logowania:

```powershell
npm.cmd run content:export
```

W `.local/da-export/` znajdziesz `index.html`, `nav.html`, pozostałe dokumenty oraz `media/`. Dokumenty to fragmenty `<body>` zgodne z DA, bez skryptów i stylów. Służą do importu API; wklejenie ich kodu do zwykłego akapitu edytora nie tworzy bloków.

### Wygeneruj preview

```powershell
npm.cmd run content:preview -- --write --branch=aem-architect
```

Otwórz **https://aem-architect--eds--matuma.aem.page/**. Sprawdź stronę główną, menu, podstrony oraz obrazy. Możesz też otworzyć [index w DA](https://da.live/edit#/matuma/eds/index), zmienić tekst i użyć Preview w interfejsie.

**Gałęzie izolują kod, nie kopie dokumentów.** W standardowej konfiguracji tego projektu wszystkie gałęzie korzystają z tego samego preview contentu. Po imporcie nowa treść może być widoczna również na podglądzie `main`, gdzie stare bloki nie są jeszcze wdrożone. Oceniaj ją na gałęzi `aem-architect`. Oddzielne wersje treści wymagają osobnych ścieżek w DA lub oddzielnej konfiguracji witryny.

## 6. Opublikuj gotową stronę

1. Utwórz PR z gałęzi `aem-architect` do `main`. W opisie koniecznie umieść `https://aem-architect--eds--matuma.aem.page/` oraz linki do zmienianych podstron.
2. Po sprawdzeniu połącz PR z `main`. AEM Code Sync dostarczy kod z `main`; merge może od razu zmienić wygląd już opublikowanych stron.
3. Sprawdź **https://main--eds--matuma.aem.page/** z nowym kodem.
4. Opublikuj treść:

```powershell
npm.cmd run content:publish -- --write
```

5. Otwórz **https://main--eds--matuma.aem.live/** i przejdź przez menu. Sprawdź też twarde odświeżenie podstrony, np. `/about`.

`content:publish` publikuje aktualną treść preview w Adobe, a nie pliki z dysku. Gdy zmienisz lokalny plik, najpierw wykonaj upload i preview. Gdy zmienisz dokument w DA, najpierw wykonaj Preview w DA. `nav` i `footer` również trzeba previewować i publikować. [Oficjalny tutorial wdrożenia](https://www.aem.live/developer/tutorial).

## 7. Codzienna edycja w DA

Otwórz [listę dokumentów](https://da.live/#/matuma/eds), a następnie `index`. Edytuj tekst w komórkach i zachowaj nazwy bloków w pierwszych wierszach tabel. Do dodania karty skopiuj cały wiersz danej tabeli, a następnie zmień jego treść.

W tym projekcie sam link pozostaje linkiem. Link będący jedyną zawartością akapitu i zapisany **pogrubieniem** staje się przyciskiem głównym; taki sam link zapisany *kursywą* staje się przyciskiem drugorzędnym. Ikonę wpisujesz jako `:experience:`, `:certifications:`, `:architecture:` itd. Nazwa odpowiada plikowi w `icons/`.

Przykład ręcznie tworzonego bloku:

| Stats |
| --- |
| **Nagłówek H2:** 13+; kolejny akapit: `:experience:` Years working with AEM |
| **Nagłówek H2:** 5; kolejny akapit: `:certifications:` Adobe certifications |

W rzeczywistej komórce DA wstaw nagłówek i osobny akapit, nie dosłowny tekst „Nagłówek H2”. Dla bloku dwukolumnowego scal komórki pierwszego wiersza i wpisz nazwę bloku.

| Blok | Co edytujesz |
| --- | --- |
| Hero (intro) | H1, specjalizacje kursywą, opis, dwa linki-przyciski |
| Stats | Jeden wiersz na statystykę; H2 z wartością, ikona i etykieta |
| Section intro | Opcjonalna etykieta kursywą, H2, opis i przycisk |
| Section intro (large) | Większy nagłówek sekcji Insights |
| Services | Pierwszy wiersz to wyróżniona karta enterprise; każdy następny to jedna usługa |
| Selected work | Pierwszy wiersz to wprowadzenie; następne to projekty. Opcjonalne zdjęcie w drugiej komórce zastępuje gradient |
| Profile | Etykieta, H2, biografia, lista kompetencji, link; opcjonalne zdjęcie |
| Insights | Obraz w pierwszej komórce; H3 z linkiem, opis, data `YYYY-MM-DD`, kategoria kursywą w drugiej. Pierwszy wiersz jest wyróżniony |
| Contact | H2, opis, link-przycisk |

Aby utworzyć nową stronę, użyj przycisku `+` w katalogu DA i utwórz dokument, np. `my-first-page`. Dodaj H1, akapit i blok Stats według przykładu. Użyj Preview. Strona będzie dostępna pod `/my-first-page`. Dodaj link do niej w dokumencie `nav`, a następnie previewuj również `nav`. [Instrukcje autora](https://www.aem.live/docs/ew/authoring).

Na stronie `contact` zastąp komunikat o brakujących danych adresem e-mail lub linkiem do umawiania spotkania. Dla e-maila użyj linku `mailto:twój-adres`. Tekst i cel przycisku możesz zmienić bez wdrożenia kodu.

### Krótkie ćwiczenie pokazujące podział odpowiedzialności

1. Zmień `13+` w DA i wykonaj Preview: zmieni się tekst, bez commita.
2. W `blocks/stats/stats.css` zmień `border-radius` i odśwież `npm run dev:da`: zmieni się wygląd, bez edycji dokumentu.
3. W DA dopisz czwarty wiersz Stats: powstanie czwarta karta, bez zmiany JS.
4. Otwórz `/index.plain.html`: zobaczysz HTML przed dekoracją. Porównaj go z DOM w DevTools.

## 8. Typowe problemy

| Objaw | Co sprawdzić |
| --- | --- |
| Lokalnie ciągle stara treść | Czy pracujesz w `dev` (lokalne pliki), czy `dev:da` (preview DA)? |
| Zmiana w DA nie pojawia się na `.aem.page` | Wykonaj Preview dokumentu |
| Preview działa, produkcja nie | Publish dokumentu, `nav` i `footer`; sprawdź kod na `main` |
| Nowe bloki są niesformatowane | Czy otwierasz gałąź z nowymi plikami `/blocks/...`? |
| API zwraca 401 | Ponów `npm run content:login`; token mógł wygasnąć |
| API zwraca 403 | Sprawdź konto Adobe i uprawnienia do witryny/preview/publish w `tools.aem.live` |
| Obraz się nie ładuje | Import wszystkich mediów przed Preview; sprawdź pełny URL i ewentualne `src="about:error"` w plain HTML |
| Nie działa wejście na podstronę z menu | Dokument musi istnieć i mieć Preview; na produkcji również Publish |
| Niepoprawny port przy testach | `npm test` oczekuje portu 3000; zatrzymaj inne aplikacje na tym porcie |

Pojedynczy dokument możesz obsłużyć przez `--only`, np.:

```powershell
npm.cmd run content:upload -- --only=contact --write --replace
npm.cmd run content:preview -- --only=contact --write
npm.cmd run content:publish -- --only=contact --write
```

Ten wariant nie wgrywa obrazów — nowo dodane media wgraj pełnym importem przed preview. Publikacja przez edytor DA jest wygodniejsza dla codziennych zmian.

## 9. Weryfikacja lokalna

```powershell
npm.cmd run lint
npm.cmd run content:check
npm.cmd run test:content
npx.cmd playwright install chromium
npm.cmd test
```

Testy sprawdzają układ, dostępność, nawigację, linki, brakujące komórki, przygotowanie dokumentów DA i kopie zapasowe importera. Zrzuty ekranu są zapisywane w `.local/`. Testy importera używają atrap API i nie zmieniają DA. Pierwszy rzeczywisty import oraz publikacja wymagają Twojego logowania i wykonania powyższych kroków.
