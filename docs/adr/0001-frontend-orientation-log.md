# ADR 0001: Frontend Orientation Log

## Status

Accepted

## Context

Frontend se průběžně upravuje podle změn backend kontraktů generovaných přes Orval. Pro rychlou orientaci v kódu je potřeba mít na jednom místě stručný přehled důležitých rozhodnutí a nedávných změn, které ovlivňují chování aplikace.

## Decision

Tento ADR slouží jako stručný orientační log pro aktuální frontendová rozhodnutí. Při dalších změnách, které mění tok dat, názvosloví nebo vazbu na API kontrakty, se má tento soubor průběžně doplňovat.

## Current State

### Faktury

- Backend kontrakty pro směr faktur používají `RECEIVED` a `ISSUED` místo původních `INCOMING` a `OUTGOING`.
- Stránka vydaných faktur používá `ISSUED`.
- Stránka přijatých faktur používá `RECEIVED`.
- Vytváření nové faktury nastavuje výchozí typ na `ISSUED`.

### Zjednodušené doklady

- Stránka zjednodušených dokladů je v češtině s diakritikou.
- Seznam zjednodušených dokladů je napojený na reálný endpoint `simpleInvoiceListByUser`.
- Vytvoření zjednodušeného dokladu je napojené na `simpleInvoiceCreate`.
- Výběr firmy ve formuláři používá `companyListByUser`.
- Formulář nepoužívá Zod; je navázaný přímo na DTO `CreateSimpleInvoiceDto`.

### Přehled DPH

- Stránka `Přehled DPH` nepoužívá fake data.
- Souhrn běžných faktur se načítá z `invoiceGetVatByMonth`.
- Souhrn zjednodušených dokladů se načítá z `simpleInvoiceGetVatByMonth`.
- Tlačítko `Vygenerovat KH a DPH` volá endpoint `vatExport`.
- Zjednodušené doklady jsou považované za přijaté nákladové doklady.
- DPH ze zjednodušených dokladů se započítává do vstupní DPH, ne do výstupní.

### Profil uživatele

- Stránka `Profil` používá reálné endpointy `useUserProfileGet`, `useUserProfileCreate` a `useUserProfileUpdate`.
- Pole finančního úřadu a územního pracoviště používají oficiální číselníky MOJE daně (`UFO`, `PRACUFO`) stažené z veřejného rozhraní číselníků.
- Pro `Specializovaný finanční úřad` se automaticky nastavuje `c_pracufo = 4000` podle dokumentace EPO.

### Lokalizace UI

- Sidebar obsahuje položky `Přehled DPH` a `Zjednodušené doklady`.
- Nově upravené stránky se drží češtiny s diakritikou.
- Stránka `Profil` a položka sidebaru `Profil` jsou v češtině.

## Consequences

- Při změně OpenAPI kontraktů je potřeba zkontrolovat stránky faktur, zjednodušených dokladů a přehledu DPH jako první.
- Pokud se změní význam zjednodušených dokladů v účetní logice, je nutné upravit i výpočty na stránce přehledu DPH.
- Pokud se ve formulářích používají DTO přímo z API, je potřeba držet výchozí hodnoty i typy polí v souladu s kontrakty.

## Update Rule

Při každé změně, která:

- mění mapování frontend -> backend kontrakt,
- mění význam účetních kategorií,
- mění názvosloví v UI,
- nebo přesouvá stránku z mock dat na reálné endpointy,

se má tento ADR doplnit o krátkou poznámku do příslušné sekce.