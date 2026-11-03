# AEM Architect na Edge Delivery Services

Strona do nauki EDS, odtwarzająca wygląd projektu `C:\projects\aemarchitect`: kremowe tło, granatowa nawigacja, karty usług, realizacje, profil, artykuły i kontakt. Działa bez Reacta i bez etapu budowania aplikacji.

**Zacznij od [instrukcji: treść, kod i publikacja](docs/EDS-DA-GUIDE.pl.md).** Wyjaśnia połączenie z DA, pierwszy import, edycję tabel bloków, Preview, Publish oraz wdrażanie kodu przez GitHub.

## Uruchom lokalnie

Wymagany Node.js 22.14+ lub nowszy LTS. W PowerShell:

```powershell
cd C:\projects\eds
npm.cmd ci
npm.cmd run dev
```

Otwórz **[localhost:3000](http://localhost:3000/)**. Ten tryb korzysta z lokalnego kodu i gotowej treści w `content/`, bez logowania do Adobe. Zatrzymaj go przez `Ctrl+C`.

Po imporcie i wykonaniu Preview w DA użyj `npm.cmd run dev:da`, aby pracować z lokalnym kodem i treścią z Adobe.

## Kod i treść

| Katalog | Zawartość |
| --- | --- |
| `blocks/` | Bloki EDS: HTML z dokumentu dekorowany przez JS i CSS |
| `scripts/`, `styles/` | Wspólne zachowanie i wygląd strony |
| `fonts/`, `icons/` | Inter i ikony interfejsu |
| `content/` | 8 dokumentów startowych i 5 ilustracji do podglądu oraz importu |
| `tools/` | Walidacja, eksport, import do DA i wywołania Preview/Publish |
| `docs/` | Instrukcja i modele treści |
| `test/` | Testy przeglądarkowe oraz testy importera |

Na EDS treść pochodzi z [DA: matuma/eds](https://da.live/#/matuma/eds), a kod z repozytorium `matuma/eds`. Commit katalogu `content/` **nie publikuje treści**. Po pierwszym imporcie edytuj dokumenty w DA; lokalne pliki pozostają kopią startową. Katalogi narzędzi, dokumentacji, testów i treści są wyłączone z serwowania przez `.hlxignore`.

Przygotowane dokumenty: `index`, `nav`, `footer`, `services`, `work`, `about`, `insights`, `contact`. Podstrony zawierają istniejące opisy ze źródłowego projektu. Dane kontaktowe należy uzupełnić w dokumencie `contact`.

## Pierwszy import i deployment

Wykonaj [kroki 4–6 instrukcji](docs/EDS-DA-GUIDE.pl.md#4-wgraj-kod-na-gałąź-testową):

1. Wgraj kod na gałąź `aem-architect` w GitHub.
2. Zaloguj się przez `npm.cmd run content:login`.
3. Sprawdź plan importu: `npm.cmd run content:upload`.
4. Zaimportuj dokumenty: `npm.cmd run content:upload -- --write --replace`. Istniejące dokumenty zostaną najpierw zapisane w lokalnym backupie.
5. Wykonaj Preview: `npm.cmd run content:preview -- --write --branch=aem-architect`.
6. Sprawdź stronę na gałęzi, połącz PR z `main`, potem opublikuj treść: `npm.cmd run content:publish -- --write`.

Import, Preview i Publish bez `--write` wyświetlają tylko plan. Aktualna implementacja została sprawdzona lokalnie; dokumenty w DA i publiczna witryna wymagają powyższych kroków.

## Adresy

- [Edytor treści DA](https://da.live/#/matuma/eds)
- [Podgląd main](https://main--eds--matuma.aem.page/)
- [Podgląd gałęzi aem-architect](https://aem-architect--eds--matuma.aem.page/) — po wypchnięciu kodu
- [Produkcja](https://main--eds--matuma.aem.live/) — po publikacji
- [Konfiguracja EDS](https://tools.aem.live/)

Gałęzie mają osobny kod, ale domyślnie współdzielą treść preview. W opisie PR umieść link do podglądu swojej gałęzi.

## Sprawdzenie zmian

```powershell
npm.cmd run lint
npm.cmd run content:check
npm.cmd run test:content
npx.cmd playwright install chromium
npm.cmd test
```

Testy obejmują widoki 375/768/1440 px, dostępność, menu mobilne, linki, metadane, brakujące komórki oraz konwersję dokumentów przez pipeline Adobe. Testy importera używają atrap API. Zrzuty ekranu trafiają do `.local/`.

[Modele bloków](docs/implementation-plan.md) · [Pochodzenie grafik i fontów](docs/assets.md) · [Oficjalny tutorial EDS](https://www.aem.live/developer/tutorial)
