# Van Dinther Woninginrichting, nieuwe website

Woninginrichting in 's-Hertogenbosch: vloeren, raambekleding, zonwering, wand- en plafondafwerking en projectstoffering. Showroom aan De Vutter 23a, uitsluitend op afspraak.

## Concept: de stalenwaaier

Een woninginrichter kies je met stalen in je hand. Dat idee draagt de hele site:

- **Hero**: grote lichte interieurfoto met een donker verloop alleen aan de tekstkant. Vier gouden staalkaartjes (Vloeren, Raambekleding, Zonwering, Wand & plafond) wisselen het beeld met een zachte crossfade en lichte zoom. Ze lopen ook rustig vanzelf door (6,5 s, met een gouden voortgangslijn), pauzeren bij hover en focus, en staan stil bij "minder beweging". Gewone knoppen met pijltjestoetsen, geen tik-gimmick.
- **Signatuur (scroll-gekoppeld)**: direct onder de hero staan de vijf diensten als genummerde stalen (01-05, ponsgat, gouden verlooprand). Op desktop liggen ze gestapeld en gedraaid als een dichte waaier en waaieren ze open terwijl de sectie in beeld schuift. Alleen met muis, vanaf 1021 px en zonder "minder beweging"; mobiel is het een carrousel. Zonder JavaScript liggen ze gewoon recht.
- Doorgevoerd in: prijslabels met ponsgat aan een gouden rail (PVC-prijzen), legpatronen als eigen tekeningen (plank, tegel, visgraat, Hongaarse punt, Weense punt, dubbele visgraat), merklabels met ponsgat, staalnummers bij producten, stappen en projecten.

## Keuzes

**Kleur** (wens: donker met gouden accenten, maar fris en niet te donker)

| Token | Waarde | Rol |
|---|---|---|
| `--papier` | #f6f6f3 | koel-neutraal gebroken wit als basis (bewust geen standaard creme) |
| `--papier-2` | #ecebe6 | tweede vlak voor sectieritme |
| `--inkt` | #1f1d1a | tekst en donkere banden; familie van het logo-bruin #302C28 |
| `--merk` | #c99a3c | edel goud voor lijnen, omlijning en vlakken (was het felle #e9af23) |
| `--cta` | #d0a449 | knopvlak, met inkt-tekst erop (7:1) |
| `--tweede` | #d6ad55 | goud als tekst op donker |
| `--merk-diep` | #5f4614 | brons-goud voor labels op licht; haalt 7:1 op papier-2 |
| `--dim` / `--dim-op-donker` | #45413a / #d2ccc0 | zachte tekst, beide ruim boven 7:1 |

Ritme: veel lichte secties, donker alleen als ritmebreker (merkenband, reviews, slot-CTA, footer).

**Typografie**: Marcellus (koppen; klassiek, ingetogen luxe, spatiëring +0,01em) en Manrope (body; rustig en goed leesbaar). Zelf gehost als woff2 in `assets/fonts/`.

**Vorm**: radius 2px op kaarten, beeld en knoppen. Strak, als een staalkaart.

**Aanspreekvorm**: "u", zoals de klant op de eigen site en in de briefing gebruikt.

**Logo**: het bestaande logo (blauw #4783C6 + donkerbruin) botst met donker en goud. Er zijn twee varianten gemaakt met exact dezelfde vorm, alleen andere kleuren: `assets/logo-goud-inkt.svg` (header) en `assets/logo-goud-wit.svg` (mobiel menu, footer). De originelen staan in `_bouw/logo-origineel/`. Vervangen = die twee bestanden overschrijven. Favicon: het huisje in goud/inkt (`favicon.svg`, plus PNG's).

## Pagina's

`index.html`, `vloeren.html` (soorten vloer, PVC met voordelen, prijzen, click/verlijmd, legpatronen met visgraat-uitleg, merken, FAQ), `raambekleding.html` (gordijnen, DUO rolgordijnen, houten jaloezieën), `zonwering.html` (screens, uitvalschermen, rolluiken, keuzehulp uit de blog), `wand-en-plafond.html`, `projectstoffering.html`, `projecten.html` (10 projecten met de echte foto's), `showroom.html` (over ons, werkwijze, openingstijden, adres, merken), `contact.html` (aanvraagformulier en FAQ), `privacy.html`.

De inhoud van alle oude dienstpagina's en de vier blogs (PVC in Den Bosch, visgraat PVC, woonwinkel Den Bosch, zonwering kiezen) is verwerkt als kennisblokken op de dienstpagina's.

## Techniek

- Platte HTML, CSS en JS. Geen build nodig om de site te draaien.
- De pagina's worden gegenereerd uit `_bouw/genereer/` (gedeelde header, footer, reviews, prijzen). Na een tekstwijziging: `node _bouw/genereer/genereer.mjs` vanuit de projectmap. Dat schrijft ook `sitemap.xml`, `robots.txt` en de legpatroon-tekeningen. Je kunt de HTML ook direct aanpassen, maar dan wordt die bij een volgende generatie overschreven.
- Motion: `js/main.js` bevat de motion-laag (fail-open reveals, stagger, hero-opening) plus de stalenwaaier, de signatuur, de live status ("Vandaag op afspraak tot 21.00"), carrouselknoppen en het formulier.
- Formulier: bouwt een net bericht op en opent het mailprogramma naar s.vandinther@home.nl (keuze showroomafspraak / advies en inmeten thuis / offerte, plus interesse). Links met `?type=` en `?onderwerp=` vullen de keuze vooraf in.
- SEO: eigen title en description per pagina met lokale termen, HomeAndConstructionBusiness-JSON-LD met adres, openingstijden en aggregateRating 5,0 / 13, Service-, FAQPage- en BreadcrumbList-JSON-LD, sitemap, robots, OG-beeld.

## Draaien en uitrollen

```bash
node server.js            # http://localhost:8198
```

Uitrollen: de map zoals hij is op Vercel (of elke statische host). `vercel.json` zet nette URL's aan; interne links gebruiken `.html`, dus het werkt ook zonder.

Publieke voorbeeldlink (GitHub Pages): https://tinasheplmn-dev.github.io/vandinther-woninginrichting/ — bijwerken met `bash tools/publiceer.sh` (kopieert de site naar de repo `vandinther-woninginrichting` en pusht; `_bouw/`, `server.js` en `tools/` gaan niet mee).

## Beeld

- **Sfeerbeeld (oktober 2026 vervangen)**: alle korrelige en kleine sfeer- en productbeelden zijn vervangen door hoogwaardige Unsplash-foto's (Unsplash License, vrij te gebruiken). Keuze: lichte, warme interieurs met natuurlijk licht, hout en linnen, rustige neutrale tinten. Alleen echte foto's, geen 3D-renders. Bewerkt naar webp in de maten waarin ze getoond worden (hero 1920 en 900 breed, paginakoppen 1600 en 800, kaarten 640 tot 800). Herkomst per bestand met fotograaf en link: `_bouw/stock/bronnen.md`. De vervangen beelden staan in `_bouw/oud-beeld/`.
- **Echte projectfoto's** (2021, klein: 800x600 en kleiner) blijven op de projectenpagina, de home en bij Screens. Ze staan op maximaal hun eigen formaat.
- Pand, bedrijfsbus, merklogo's en de stalenwaaier (showroom, slot) komen van de huidige site, aangeleverd in `_bouw/bron-beeld/`.
- Merklogo's zijn uitgesneden uit de logostrook van de oude site en vergroot; scherper aanleveren is een verbetering.

## Reviews

Eigen sectie op de home, in de stalenwaaier-stijl: een staalkaart met gouden verlooprand en ponsgat met de score 5,0 groot in Marcellus en vijf gouden sterren (geen aantal, wel de knop naar het Google-profiel). Daarnaast een uitgelichte review met een grote gouden aanhalingsglyph, die rustig wisselt tussen drie reviews (gouden voortgangslijn, pauze bij hover en focus, stil bij "minder beweging", initialen-knoppen om zelf te kiezen; zonder JavaScript staan ze onder elkaar). De andere vier reviews staan als kaarten met gouden verlooprand, initialen-avatar in goud, naam en sterren; ze komen met stagger in beeld en zweven zacht (alleen op desktop met muis). Op mobiel zijn de kaarten een carrousel met scroll-snap en knoppen. Op de dienstpagina's en de showroom staat een losse review als kleine staalkaart met gouden rand, avatar en een link naar Google. Alleen de 7 echte reviews uit `_bouw/Reviews van dinther.docx`, geen stockbeeld.

## Open punten (eigenaar)

1. **Openingstijden**: de eigen site zegt op afspraak ma t/m do 09.00-21.00, vr 09.00-18.00, za 10.00-17.00. Google en Bottin zeggen ma t/m vr 09.00-17.00. De site toont nu de tijden van de eigen site. Welke klopt? Google-profiel gelijktrekken.
2. **"Sinds 1990"**: staat op de eigen site en is overgenomen (topbalk, footer, showroom). De KvK-inschrijving is van 2 juli 2001. Bevestigen of er een voorloper was.
3. **Adres en telefoon**: 23a (eigen site) tegenover 23 (Google). Vast nummer 073-8510785 staat als hoofdnummer; het mobiele nummer 06-51547596 (Google, oude PVC-pagina) staat alleen op de contactpagina. Bevestigen welke de hoofdactie is.
4. **Prijzen PVC** (€ 34,95 zelf leggen, € 59,95 gelegd, € 79,95 visgraat gelegd per m²) komen van de oude site. Graag bevestigen voor livegang.
5. **Logo in goud**: kleurvariant van het bestaande logo, vorm ongewijzigd. Akkoord van de eigenaar nodig; originelen bewaard.
6. **Projectfoto's**: de echte foto's zijn uit 2021 en klein. De sfeerbeelden zijn nu stock (Unsplash); eigen foto's van recent werk in dezelfde lichte stijl zijn sterker en kunnen ze één op één vervangen. Nieuwe, grotere projectfoto's (liefst met soort werk en plaats) maken de projectenpagina en de home sterker. Plek voor een nieuwe foto staat klaar.
7. **Projectstoffering**: de oude pagina was leeg. De nieuwe pagina beschrijft alleen wat elders op de site staat (PVC in projectstoffering, zakelijke panden). Graag aanvullen: voor welke klanten, welke materialen, advies op locatie ja of nee.
8. **Inmeten thuis**: de site zegt "vrijblijvend advies en inmeten bij u thuis" (zoals de oude site). Bevestigen of dit kosteloos is en tot welke afstand ("Den Bosch en omstreken").
9. **Reviews**: de 7 reviews uit het aangeleverde bestand zijn licht gepolijst. Bevestigen dat ze zo gebruikt mogen worden. De score 5,0 staat zonder aantal (13 is te weinig om mee te pronken); het aantal staat wel in de structured data.
10. **Merken**: de site noemt Gelasta, Balterio, Parador en Bodiax (oude site). Een Facebook-actie van oktober 2026 noemt ook Belakos, Sense en Liberty. Lijst bevestigen.
11. **Facebook**: er bestaat een tweede, oudere pagina (Rosmalen). De site linkt naar facebook.com/vandintherwoninginrichting.
12. **Privacyverklaring**: nieuw en kort geschreven, past bij deze site (geen tracking, formulier via mail). Laten nalezen.
13. **Coördinaten** (geo) staan niet in de JSON-LD omdat ze niet in de bron stonden.

## Keuring

`node ~/.claude/skills/website-bouwen/scripts/keuring.mjs websites/vandinther-website websites,$HOME/sites-deploy/repo` vanuit `~/Downloads/files1`. Contrast en ontwerpmaten zijn in de browser gemeten op 1440 en 375 breed op alle pagina's.
