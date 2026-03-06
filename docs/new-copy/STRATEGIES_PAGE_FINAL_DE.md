# diBoaS Strategieseite — Finaler Copy (DE)

## Dokumentstatus

| Feld | Wert |
|------|------|
| Version | FINAL — Post-CLO + Post-Copywriter |
| Sprache | Deutsch (DE) |
| Datum | 27. Februar 2026 |
| Basis | STRATEGIES_PAGE_FINAL_EN.md |
| Kulturelle Anpassung | Vollstaendig (keine woertliche Uebersetzung) |
| CLO Review | Alle P0/P1-Fixes angewendet. P0-3 Gebuehren vom CEO bestaetigt (Fee Lab v3.3: Einstieg KOSTENLOS, Ausstieg 0,39%). |
| Copywriter Review | Alle 3 Fixes + 4 Polish angewendet. Freigegeben fuer Produktion. |
| Ausstehend | Nichts. Alle Freigaben abgeschlossen. |

## Implementierungshinweise fuer CTO / Claude Code

Dieses Dokument enthaelt den vollstaendigen deutschen Copy der Strategieseite von diBoaS. KULTURELLE ANPASSUNG fuer den deutschsprachigen Markt (Deutschland als Hauptmarkt), keine woertliche Uebersetzung.

### Kritische Unterschiede zum EN

| Punkt | EN | DE | Grund |
|-------|-----|-----|-------|
| Waehrung | $1,000 Beispiele | 1.000 EUR Beispiele | Europaeischer Markt |
| Minimum | $5 | 5 EUR | Mindestwert fuer EU |
| Szenarien | "trip, wedding, car" | "Reise, Hochzeit, Auto" | Gleiche Konzepte, natuerliche Sprache |
| Bankreferenz | "bank savings account" | "Tagesgeld" / "Festgeld" | Deutsche Sparprodukte |
| Dezimaltrennzeichen | 0.39% (Punkt) | 0,39% (Komma) | Europaeisches Zahlenformat |
| Tausendertrennzeichen | 1,000 (Komma) | 1.000 (Punkt) | Europaeisches Zahlenformat |
| Regulierung | MiCA auf Englisch | MiCA auf Deutsch (Art. 68 + Art. 7) | EU-Jurisdiktion |
| Anrede | "you" | "du" (informell) | Moderne Fintech-Anrede (wie N26, Trade Republic) |
| Ton | Warm, direct | Klar, direkt, gruendlich, trotzdem nahbar | Deutsche Fintech-Kultur |
| Einlagensicherung | FDIC | Einlagensicherung bis 100.000 EUR | EU-Gesetzgebung |
| Full Throttle Minimum | $1,000 | 1.000 EUR | Europaeisches Aequivalent |

### Globale Regeln

- KEIN Gedankenstrich auf der gesamten Seite. Kommas, Punkte, Doppelpunkte oder Zeilenumbrueche verwenden.
- KEINE Emojis im Fliesstext.
- Alle CTAs sind Buttons, sofern nicht anders angegeben.
- Adelaide-Filter gilt fuer alle verbraucherorientierten Texte.
- Version A/B Sektionen: bedingt. CTO waehlt beim Build.

### Sektionsablauf

| # | Sektion | Typ |
|---|---------|-----|
| 1 | Hero | Statisch |
| 2 | Strategiematrix | Interaktive Tabelle |
| 3 | Strategiekarten (x10) | Kartengrid |
| 4 | Wohin dein Geld geht | Protokolltabelle + aufklappbares Detail |
| 5 | Was es kostet | Gebuehrentabelle |
| 6 | Wie du waehlen kannst | Entscheidungshilfe |
| 7 | FAQ (x11) | Akkordeon |
| 8 | Warteliste / CTA | E-Mail-Erfassung |
| 9 | Footer | Rechtliche Hinweise |

---

## SEKTION 1: HERO

**H1:**

```
Der Zugang, den sie sich vorbehalten haben. Jetzt gehoert er dir.
```

**Sub-headline:**

```
10 Strategien. Verschiedene Ziele. Verschiedene Risikoniveaus. Keine ist "die beste." Die beste ist die, die zu dir und deinen Zielen passt.
```

**Vertrauenszeile (kleinerer Text):**

```
Getestet mit fast 4 Jahren realer Daten. Abstuerze, Erholungen, alles. Aufgebaut auf Systemen, die zusammen Milliarden an Vermoegenswerten gesichert haben (ueberpruefbar auf DeFiLlama).
```

**Ehrliche Einschraenkung (Micro-Text unter der Vertrauenszeile):**

```
Vergangene Wertentwicklungen garantieren keine zukuenftigen Ergebnisse. Alle Strategien sind mit Risiken verbunden.
```

---

**Ueberleitung:**

```
So findest du die richtige.
```

---

## SEKTION 2: STRATEGIEMATRIX

**H2:**

```
Waehle deine Strategie
```

**Anleitung:**

```
Dein Ziel links. Deine Risikobereitschaft rechts.
```

**Matrixtabelle:**

| Dein Ziel | Stabile Renditen | Wachstumspotenzial |
|-----------|------------------|--------------------|
| Notgroschen | Sicherer Hafen | |
| Inflation schlagen | | Stabiles Wachstum |
| Kurzfristig (< 2 Jahre) | Torhueter | Bestaendiger Fortschritt |
| Mittelfristig (2-5 Jahre) | Geduldiger Aufbauer | Ausgewogener Aufbauer |
| Langfristig (5-10 Jahre) | Stetige Komposition | Vermoegensturbo |
| Vermoegenaufbau (10+ Jahre) | Rendite-Maximierer | Volle Kraft |

**Unter der Tabelle:**

```
Nicht sicher? Starte mit dem Sicheren Hafen. Lerne zuerst. Wechsle jederzeit. Ohne Strafen.
```

---

**Ueberleitung:**

```
Das macht jede einzelne.
```

---

## SEKTION 3: ALLE 10 STRATEGIEKARTEN

Karten im Grid: 2 Spalten auf Desktop, 1 auf Mobil. Stabile Strategien mit teal-farbenem linken Rand. Wachstumsstrategien mit gruenem linken Rand.

---

### Karte 1: Sicherer Hafen

**Badge:** Stabile Renditen | Notgroschen

**Tagline:** Dein Sicherheitsnetz, das tatsaechlich waechst

**Beschreibung:**

```
Hier bewahrst du das Geld auf, das du morgen vielleicht brauchst. Es muss da sein, wenn du es brauchst. Ohne Ueberraschungen.

Sicherer Hafen nutzt ausschliesslich stabile digitale Dollar. Keine Abhaengigkeit von Krypto-Kursen. Deine 1.000 EUR sind darauf ausgelegt, nah an 1.000 EUR zu bleiben, waehrend sie Rendite erwirtschaften. Die verwendeten Stablecoins koennen jedoch im Wert schwanken.
```

**Allokation:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Allokationshinweis (Micro-Text):**

```
Dein Geld wird auf drei unabhaengige Verleihsysteme verteilt, um das Risiko zu reduzieren.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Weniger als 1% |
| Typische Jahresrendite | 6-10% pro Jahr |
| Wie unruhig ist die Fahrt? | Sehr ruhig. Dein Kontostand blieb waehrend unseres gesamten 4-Jahres-Tests stabil. |
| Risikoniveau | Minimal. Risiken umfassen moegliche technische Schwachstellen in den zugrunde liegenden Systemen und die Moeglichkeit, dass die verwendeten Stablecoins ihre Dollar-Bindung verlieren. Diese Systeme laufen seit Jahren sicher. |

**Typischer Anwendungsfall:**

```
Erster Notgroschen. Lernen, wie alles funktioniert, ohne Kursschwankungen.
```

---

### Karte 2: Stabiles Wachstum

**Badge:** Wachstumspotenzial (30%) | Inflation schlagen

**Tagline:** Schlage die Inflation mit kontrolliertem Risiko

**Beschreibung:**

```
Dein Geld wird aufgeteilt: 70% erwirtschaften stabile Renditen, 30% nehmen am Wachstum digitaler Vermoegenswerte teil. Du akzeptierst etwas Kursbewegung fuer potenziell hoehere Renditen.

Das ist kein Notgroschen. Das ist fuer Geld, das du schneller als die Inflation wachsen lassen willst, mit dem Verstaendnis, dass der Wachstumsanteil sich mit den Marktpreisen bewegt.
```

**Allokation:**

```
70% Sky SSR + 30% Sanctum INF
```

**Allokationshinweis (Micro-Text):**

```
Der Grossteil bleibt in stabilen digitalen Dollar. Der Sanctum-Anteil bewegt sich mit den Solana-Staking-Ertraegen.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Etwa 5% |
| Typische Jahresrendite | 7-12% pro Jahr |
| Wie unruhig ist die Fahrt? | Einige Wellen. Im schlechtesten Fall fiel dein Kontostand voruebergehend um 8%, bevor er sich erholte. |
| Risikoniveau | Niedrig. 30% deines Guthabens bewegen sich mit den Preisen digitaler Vermoegenswerte. |

**Typischer Anwendungsfall:**

```
Zweite Sparschicht. Hat bereits einen Notgroschen und will Wachstum ueber der Inflation.
```

**Hinweis (Micro-Text):**

```
Nicht als primaerer Notgroschen konzipiert.
```

---

### Karte 3: Torhueter

**Badge:** Stabile Renditen | Kurzfristig

**Tagline:** Schuetzt deine kurzfristigen Ziele

**Beschreibung:**

```
Sparst du fuer etwas in den naechsten 2 Jahren? Eine Reise, eine Hochzeit, ein Auto? Hier arbeitet jeder Euro fuer dein Ziel, ohne ihn zu riskieren.

Keine Abhaengigkeit von Krypto-Kursen. Berechenbares Wachstum.
```

**Allokation:**

```
60% Sky SSR + 25% Aave V3 + 15% Compound V3
```

**Allokationshinweis (Micro-Text):**

```
Verteilt auf bewaehrte Verleihsysteme, optimiert fuer Stabilitaet.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Weniger als 1% |
| Typische Jahresrendite | 6-9% pro Jahr |
| Wie unruhig ist die Fahrt? | Sehr ruhig. |
| Risikoniveau | Minimal. Auf Kapitalerhalt mit stabilen Renditen ausgelegt. Risiken umfassen moegliche technische Schwachstellen und die Moeglichkeit, dass die verwendeten Stablecoins ihre Dollar-Bindung verlieren. |

**Typischer Anwendungsfall:**

```
Konkretes Ziel innerhalb von 2 Jahren: Reise, Hochzeit, Auto.
```

---

### Karte 4: Bestaendiger Fortschritt

**Badge:** Wachstumspotenzial (35%) | Kurzfristig

**Tagline:** Kurzfristige Ziele mit Wachstumspotenzial

**Beschreibung:**

```
Du hast ein Ziel in den naechsten 2 Jahren, aber etwas Kursbewegung ist fuer dich in Ordnung, wenn es hoehere Renditen bedeutet. Der Grossteil bleibt stabil. Ein Teil nimmt am Wachstum digitaler Vermoegenswerte teil.
```

**Allokation:**

```
65% Sky SSR + 35% Sanctum INF
```

**Allokationshinweis (Micro-Text):**

```
Der Grossteil bleibt stabil. Der Sanctum-Anteil bewegt sich mit den Solana-Staking-Ertraegen.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Etwa 7% |
| Typische Jahresrendite | 7-11% pro Jahr |
| Wie unruhig ist die Fahrt? | Moderate Wellen. Im schlechtesten Fall fiel dein Kontostand voruebergehend um 11%, bevor er sich erholte. |
| Risikoniveau | Niedrig-Mittel. Dein Kontostand wird sich mit den Preisen digitaler Vermoegenswerte bewegen. |

**Typischer Anwendungsfall:**

```
Kurzfristiges Ziel, bei dem etwas Kursbewegung akzeptabel ist.
```

---

### Karte 5: Geduldiger Aufbauer

**Badge:** Stabile Renditen | Mittelfristig

**Tagline:** Bestaendiges Wachstum fuer geduldige Sparer

**Beschreibung:**

```
Du denkst in 2-5 Jahren. Vielleicht eine Anzahlung fuer eine Wohnung, vielleicht eine Selbstaendigkeit. Du brauchst kein aggressives Wachstum. Du brauchst, dass dein Geld da ist, etwas groesser, wenn du es brauchst.
```

**Allokation:**

```
50% Sky SSR + 30% Aave V3 + 20% Compound V3
```

**Allokationshinweis (Micro-Text):**

```
Gleiche stabile Systeme wie Sicherer Hafen, modelliert fuer mittelfristiges Halten. Die Renditen werden fuer den 2-5-Jahres-Horizont konservativer projiziert.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Weniger als 1% |
| Typische Jahresrendite | 5-8% pro Jahr |
| Wie unruhig ist die Fahrt? | Sehr ruhig. |
| Risikoniveau | Minimal. Gleiches stabiles Profil, optimiert fuer laengeres Halten. Risiken umfassen moegliche technische Schwachstellen und die Moeglichkeit, dass die verwendeten Stablecoins ihre Dollar-Bindung verlieren. |

**Typischer Anwendungsfall:**

```
Anzahlung fuer eine Wohnung. Startkapital fuer ein Unternehmen. Alles in 2-5 Jahren, wo Berechenbarkeit zaehlt.
```

---

### Karte 6: Ausgewogener Aufbauer

**Badge:** Wachstumspotenzial (40%) | Mittelfristig

**Tagline:** Stabilitaet und Wachstum in einer Strategie

**Beschreibung:**

```
Der Grossteil deines Geldes bleibt sicher. Ein Teil nutzt das Wachstum digitaler Vermoegenswerte. Diese Strategie ist fuer Menschen mit einem 3-5-Jahres-Horizont gedacht, die verstehen, dass Preise steigen und fallen.
```

**Allokation:**

```
60% Sky SSR + 25% Sanctum INF + 15% Jupiter JLP
```

**Allokationshinweis (Micro-Text):**

```
Ein ausgewogener Mix: Verleih-Ertraege plus Staking- und Handelsgebuehren-Einnahmen von zwei Solana-Systemen.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Etwa 12% |
| Typische Jahresrendite | 10-16% pro Jahr |
| Wie unruhig ist die Fahrt? | Moderate Wellen. Im schlechtesten Fall fiel dein Kontostand voruebergehend um 13%, bevor er sich erholte. |
| Risikoniveau | Mittel. 40% Wachstumsanteil bedeutet spuerbare Schwankungen in beide Richtungen. |

**Typischer Anwendungsfall:**

```
3-5-Jahres-Horizont mit Toleranz fuer voruebergehende Kursbewegungen.
```

---

### Karte 7: Stetige Komposition

**Badge:** Stabile Renditen | Langfristig

**Tagline:** Lass die Zeit die Arbeit machen

**Beschreibung:**

```
Du spielst das lange Spiel. 5-10 Jahre. Du musst keine grossen Risiken eingehen, weil die Zeit auf deiner Seite ist. Stabile Renditen, die sich Jahr fuer Jahr aufbauen.
```

**Allokation:**

```
55% Sky SSR + 30% Aave V3 + 15% Compound V3
```

**Allokationshinweis (Micro-Text):**

```
Optimiert fuer langfristigen Zinseszins-Effekt bei minimaler Volatilitaet.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Weniger als 1% |
| Typische Jahresrendite | 6-10% pro Jahr |
| Wie unruhig ist die Fahrt? | Sehr ruhig. |
| Risikoniveau | Minimal. Langsam und stetig. Risiken umfassen moegliche technische Schwachstellen und die Moeglichkeit, dass die verwendeten Stablecoins ihre Dollar-Bindung verlieren. |

**Typischer Anwendungsfall:**

```
5-10-Jahres-Horizont. Bevorzugt Bestaendigkeit gegenueber maximaler Rendite.
```

---

### Karte 8: Vermoegensturbo

**Badge:** Wachstumspotenzial (70%) | Langfristig

**Tagline:** Fuer Leute, die ihre Hausaufgaben gemacht haben

**Beschreibung:**

```
Das ist nicht fuer jeden. 70% Wachstumsanteil bedeutet, dass sich dein Kontostand erheblich mit den Preisen digitaler Vermoegenswerte bewegen wird.

Du musst zusehen koennen, wie dein Guthaben um 40% oder mehr faellt, ohne in Panik zu geraten. Wenn dich dieser Satz nervoes gemacht hat, ist das nicht die richtige Strategie fuer dich.
```

**Allokation:**

```
30% Sky SSR + 35% Sanctum INF + 35% Jupiter JLP
```

**Allokationshinweis (Micro-Text):**

```
Stark wachstumsorientiert. Staking-Ertraege plus Handelsgebuehren-Einnahmen von zwei Solana-Systemen.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Etwa 24% |
| Typische Jahresrendite | Sehr variabel. Kann negativ sein oder 50% uebersteigen. |
| Wie unruhig ist die Fahrt? | Grosse Schwankungen. Im schlechtesten Fall fiel dein Kontostand um 47%, bevor er sich erholte. |
| Risikoniveau | Hoch. Erhebliche Wahrscheinlichkeit bedeutender Verluste bei kuerzer Haltedauer. |

**Typischer Anwendungsfall:**

```
Langfristige Allokation mit hoher Volatilitaetstoleranz.
```

**Warnung (als Callout gestaltet):**

```
In tausenden Simulationen reichten die Ergebnisse von -60% bis +200%+. Die Verlustziffer (47%) ist der schlimmste voruebergehende Rueckgang waehrend unseres Tests. Die Spanne (-60% bis +200%+) ist die gesamte Bandbreite der Simulationen. Nur fuer Menschen, die erhebliche Verluste verkraften koennen.
```

---

### Karte 9: Rendite-Maximierer

**Badge:** Stabile Renditen | Vermoegensaufbau

**Tagline:** Maximale Rendite, minimale Volatilitaet

**Beschreibung:**

```
Du willst die hoechsten stabilen Renditen ueber 10+ Jahre ohne Abhaengigkeit von Krypto-Kursen. Kein Wachstumsanteil. Nur optimierte Renditen ueber alle drei stabilen Verleihsysteme.
```

**Allokation:**

```
45% Sky SSR + 35% Aave V3 + 20% Compound V3
```

**Allokationshinweis (Micro-Text):**

```
Unsere Konfiguration mit der hoechsten stabilen Rendite.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Weniger als 1% |
| Typische Jahresrendite | 7-11% pro Jahr |
| Wie unruhig ist die Fahrt? | Sehr ruhig. |
| Risikoniveau | Minimal. Unsere stabile Strategie mit der hoechsten Rendite. Risiken umfassen moegliche technische Schwachstellen und die Moeglichkeit, dass die verwendeten Stablecoins ihre Dollar-Bindung verlieren. |

**Typischer Anwendungsfall:**

```
10+-Jahres-Horizont. Maximale stabile Rendite, null Krypto-Exposure.
```

---

### Karte 10: Volle Kraft

**Badge:** Wachstumspotenzial (85%) | Vermoegensaufbau

**Tagline:** Maximales Risiko. Maximales Potenzial.

**Beschreibung:**

```
Das ist unsere aggressivste Strategie. 85% Wachstumsanteil. Konzipiert fuer einen kleinen Teil deines Portfolios, den du komplett verlieren kannst.

Die gute Seite? In seltenen simulierten Szenarien ueberstiegen die Renditen 1.000%. Die schlechte Seite? 27% Verlustwahrscheinlichkeit. Dein Kontostand fiel im schlimmsten Moment unseres Tests um 66%.
```

**Allokation:**

```
15% Sky SSR + 30% Sanctum INF + 35% Jupiter JLP + 20% Jito
```

**Allokationshinweis (Micro-Text):**

```
Maximale Wachstums-Exposure: Staking, Handelsgebuehren und MEV-Belohnungen ueber drei Solana-Systeme mit einem minimalen Stabilitaetspuffer.
```

**Statistiken:**

| Wahrscheinlichkeit, Geld zu verlieren | Etwa 27% |
| Typische Jahresrendite | Extrem variabel. Von grossen Verlusten bis zu aussergewoehnlichen Gewinnen. |
| Wie unruhig ist die Fahrt? | Achterbahn. Im schlechtesten Fall fiel dein Kontostand um 66%, bevor er sich erholte. |
| Risikoniveau | Sehr Hoch. Nahezu Totalverlust moeglich. Verwende nur Geld, das du komplett verlieren kannst. |

**Typischer Anwendungsfall:**

```
Kleiner Portfolio-Anteil mit vollem Verstaendnis des Verlustpotenzials.
```

**Zugangsvoraussetzungen (als Callout gestaltet):**

```
6+ Monate Kontoalter. Mindestguthaben von 1.000 EUR. Maximal 20% deines Gesamtportfolios. 24-Stunden-Wartezeit vor Aktivierung. Risikobestaetiung erforderlich.
```

**Warnung (als auffaelliger Callout gestaltet):**

```
In tausenden Simulationen reichten die Ergebnisse von -78% bis +400%+. Die Verlustziffer (66%) ist der schlimmste voruebergehende Rueckgang waehrend unseres Tests. Die Spanne (-78% bis +400%+) ist die gesamte Bandbreite der Simulationen. Investiere hier niemals Geld, das du brauchst.
```

---

**Unter allen Karten, ehrliche Einschraenkung:**

```
Alle Statistiken basieren auf historischer Analyse (Mai 2022 - Dezember 2025) und tausenden Monte-Carlo-Simulationen. Fuer neuere Protokolle werden Renditen frueherer Zeitraeume mithilfe validierter Proxy-Methoden auf Basis aehnlicher Systeme geschaetzt. Was in der Vergangenheit passiert ist, muss nicht wieder passieren. Diese Zahlen helfen dir, Strategien zu vergleichen, nicht die Zukunft vorherzusagen.
```

---

**Ueberleitung:**

```
Jetzt weisst du, was jede Strategie macht. Hier siehst du, wohin dein Geld tatsaechlich geht.
```

---

## SEKTION 4: WOHIN DEIN GELD GEHT

**H2:**

```
Wohin dein Geld geht
```

**Einleitung:**

```
Jede Strategie baut auf einer Kombination dieser Protokolle auf. Sie sind unabhaengig, quelloffen, und du kannst alles selbst ueberpruefen.
```

**Protokolltabelle:**

| Protokoll | Typ | Netzwerk | Vermoegenswert | Krypto-Exposure | In Betrieb seit |
|-----------|-----|----------|----------------|-----------------|-----------------|
| Sky SSR | Stablecoin-Rendite | Arbitrum | USDS | Keine | 2022 |
| Aave V3 | Verleih | Arbitrum | USDC | Keine | 2020 (V3: 2022) |
| Compound V3 | Verleih | Arbitrum | USDC | Keine | 2018 (V3: 2022) |
| Sanctum INF | Liquides Staking (LST-Korb) | Solana | SOL | Ja, bewegt sich mit dem SOL-Preis | 2024 |
| Jupiter JLP | Perpetuals-LP | Solana | 45% SOL / 27% ETH / 27% BTC / 1% andere | Ja, bewegt sich mit SOL-, ETH-, BTC-Preisen | 2024 |
| Jito | Liquides Staking + MEV | Solana | JitoSOL | Ja, bewegt sich mit dem SOL-Preis | 2022 |

**Unter der Tabelle (Micro-Text):**

```
Jito wird nur in Volle Kraft verwendet. Alle anderen Protokolle kommen in mehreren Strategien vor. Protokollnamen werden aus Transparenzgruenden verwendet. Ihre Einbeziehung bedeutet keine Unterstuetzung von diBoaS durch diese Protokolle. Fuer Protokolle, die weniger als 4 Jahre in Betrieb sind, werden Renditen frueherer Zeitraeume mithilfe validierter Proxy-Methoden auf Basis aehnlicher Systeme geschaetzt.
```

**Aufklappbares Detail (optionales Akkordeon pro Protokoll, standardmaessig eingeklappt):**

Jedes Protokoll erhaelt einen aufklappbaren Bereich mit:
- Einzeilige Zusammenfassung, wie Renditen generiert werden
- Auditstatus
- Link zur Protokoll-Website
- Link zur DeFiLlama-Seite mit Live-TVL

**Unter den Protokollen:**

```
Quelloffen und auditiert bedeutet nicht risikofrei. Code kann unentdeckte Schwachstellen haben. Wir reduzieren dieses Risiko, indem wir dein Geld auf mehrere unabhaengige Protokolle verteilen, aber wir koennen es nicht beseitigen.
```

---

**Ueberleitung:**

```
Du kennst die Strategien. Du kennst die Protokolle. Das kostet es.
```

---

## SEKTION 5: WAS ES KOSTET

**H2:**

```
Was es kostet
```

**Einleitung:**

```
Eine Gebuehr. Das war's.
```

**Gebuehrentabelle:**

| Aktion | Gebuehr | Beispiel |
|--------|---------|---------|
| Strategie starten (investieren) | KOSTENLOS | 1.000 EUR investieren: kostet 0 EUR |
| Strategie beenden (verkaufen) | 0,39% | 1.000 EUR verkaufen: kostet 3,90 EUR |

**Unter der Tabelle:**

```
Keine monatlichen Gebuehren. Keine Verwaltungsgebuehren. Keine Performancegebuehren. Keine versteckten Kosten.

Geld in eine Strategie zu stecken kostet nichts. Wir berechnen nur dann eine Gebuehr, wenn du dein Geld herausnimmst. Wenn dein Geld in einer Strategie Rendite erwirtschaftet, verdienen wir nichts, bis du aussteigst.
```

**Micro-Text:**

```
Netzwerkgebuehren Dritter koennen anfallen (in der Regel weniger als 0,01 EUR). Den vollstaendigen Gebuehrenkatalog einschliesslich Ueberweisungen und Auszahlungen findest du auf unserer Gebuehrenseite.
```

---

**Ueberleitung:**

```
Nicht sicher, welche du waehlen sollst? Fang hier an.
```

---

## SEKTION 6: WIE DU WAEHLEN KANNST

**H2:**

```
Fang hier an
```

### Wofuer ist dieses Geld?

```
Notgroschen: Sicherer Hafen. Geld, das du morgen brauchen koenntest, bleibt stabil.

Inflation schlagen: Stabiles Wachstum. Dein Geld arbeitet haerter, aber 30% bewegen sich mit dem Markt.

Etwas in den naechsten 2 Jahren: Torhueter (stabil) oder Bestaendiger Fortschritt (mit Wachstum). Kommt darauf an, wie du dich bei Kursschwankungen fuehlst.

Etwas in 2-5 Jahren: Geduldiger Aufbauer (stabil) oder Ausgewogener Aufbauer (mit Wachstum). Mehr Zeit bedeutet, du kannst mehr Wachstum in Betracht ziehen.

Langfristiger Vermoegensaufbau: Stetige Komposition, Vermoegensturbo, Rendite-Maximierer oder Volle Kraft. Dein Zeithorizont ist dein groesster Vorteil.
```

### Wie fuehlst du dich bei Kursschwankungen?

```
"Ich will keine." Bleib bei der Spalte Stabile Renditen. Fuenf Strategien, null Krypto-Exposure.

"Ich verstehe sie und kann Rueckgaenge aussitzen." Ziehe die Spalte Wachstumspotenzial in Betracht. Je laenger dein Zeithorizont, desto mehr Wachstums-Exposure kannst du erwaegen.

"Ich bin mir nicht sicher." Starte stabil. Lerne, wie alles funktioniert, mit Geld, das du riskieren kannst. Du kannst spaeter immer Wachstums-Exposure hinzufuegen.
```

### Was wuerdest du tun, wenn dein Guthaben um 20% faellt?

```
"Ich wuerde in Panik geraten und abheben." Nur Strategien mit stabilen Renditen. Das ist keine Schwaeche. Das ist Selbstkenntnis.

"Ich wuerde auf die Erholung warten." Strategien mit niedrigem bis mittlerem Wachstum koennten fuer dich passen.

"Ich wuerde nachkaufen." Du koenntest bereit fuer mehr Wachstums-Exposure sein. Das ist klug, wenn es geplant ist. Weniger klug, wenn es Panik ist und du versuchst, Verluste auszugleichen. Sei dir sicher, was davon du meinst.
```

**Markenversprechen + goldene Regel:**

```
Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.

Im Zweifel: Starte sicher. Du kannst spaeter immer wechseln. Ziehe in Betracht, einen zugelassenen Finanzberater zu konsultieren, wenn du dir nicht sicher bist, welcher Ansatz zu deiner Situation passt.
```

---

**Ueberleitung:**

```
Du hast Fragen? Gut.
```

---

## SEKTION 7: FAQ

**H2:**

```
Bevor du dich entscheidest
```

### Kann ich die Strategie wechseln?

```
Ja, jederzeit. Ohne Strafen. Ohne Fragen.

Etwas zum Beachten: Wenn du waehrend eines Markteinbruchs wechselst, koenntest du einen voruebergehenden Verlust realisieren. Der beste Zeitpunkt zum Wechseln ist, wenn sich deine Ziele aendern, nicht wenn sich der Markt bewegt.
```

### Kann ich mehrere Strategien gleichzeitig nutzen?

```
Ja. Viele Leute machen das.

Stell dir das wie verschiedene Konten fuer verschiedene Zwecke vor: Notgroschen im Sicheren Hafen, Urlaubssparen im Torhueter, langfristiger Vermoegensaufbau im Ausgewogenen Aufbauer.
```

### Wie funktioniert das Rebalancing?

```
Wenn Marktbewegungen deine Allokation vom Ziel abdriften lassen (mehr als 10% Abweichung), benachrichtigen wir dich. Zum Beispiel: Wenn dein Ziel 60% stabil und 40% Wachstum ist, und Marktbewegungen es auf etwa 55/45 oder weiter schieben, geben wir dir Bescheid.

Du siehst genau, was sich geaendert hat und warum. Dann entscheidest du: Rebalancing genehmigen oder so lassen.

Wir bewegen dein Geld nie ohne deine Zustimmung.
```

### Sind diese Renditen garantiert?

```
Nein. Und jeder, der dir Renditen garantiert, luegt dich an.

Was wir dir sagen koennen: Wir haben jede Strategie mit fast 4 Jahren realer Marktdaten getestet (Mai 2022 - Dezember 2025). Die Zahlen basieren auf dem, was tatsaechlich passiert ist, und tausenden Monte-Carlo-Simulationen.

Diese Zahlen helfen dir, Strategien zu vergleichen und die Bandbreite moeglicher Ergebnisse zu verstehen. Sie sagen nicht die Zukunft voraus. Starte mit dem, was du dir leisten kannst zu lernen.
```

### Was ist, wenn eines der Systeme ein Problem hat?

```
Das ist ein reales Risiko. Diese Systeme basieren auf Code, und Code kann Schwachstellen haben.

Wir reduzieren dieses Risiko, indem wir nur Systeme verwenden, die seit Jahren Milliarden von Euro gesichert haben, dein Geld auf mehrere unabhaengige Systeme verteilen und kontinuierlich auf ungewoehnliche Aktivitaeten ueberwachen.

Wir koennen dieses Risiko nicht beseitigen. Niemand kann das. Aber wir koennen ehrlich darueber sein.
```

### Wohin geht mein Geld wirklich?

```
Die Protokolle hinter jeder Strategie sind auf dieser Seite mit Namen, Netzwerken, Vermoegenswerttypen und Leistungshistorie aufgelistet. Ohne Registrierung. Ohne versteckte Informationen.

Sky SSR, Aave V3 und Compound V3 kuemmern sich um stabile Renditen. Sanctum INF, Jupiter JLP und Jito kuemmern sich um das Wachstum. Jede Strategie ist eine spezifische Kombination dieser Protokolle mit exakten Prozentsaetzen auf jeder Strategiekarte.

Wir haben diese Protokolle gewaehlt, weil sie transparent und kampferprobt sind und du alles selbst ueberpruefen kannst.
```

### Warum gibt es zusaetzliche Anforderungen fuer Volle Kraft?

```
Weil wir dich vor dir selbst schuetzen wollen.

Volle Kraft kann den Grossteil seines Wertes verlieren. Die Anforderungen sind nicht dazu da, dich auszuschliessen. Sie sind dazu da sicherzustellen, dass du es durchdacht hast: 6 Monate Erfahrung, ein Mindestguthaben, eine Obergrenze von 20% deines Portfolios und eine 24-Stunden-Abkuehlphase.
```

### Ist mein Geld sicher?

**Version A (Nicht-verwahrend):**

```
Dein Geld wird von dir gesichert. Deine Wallet, deine Schluessel. Niemand bei diBoaS kann ohne deine Genehmigung auf dein Guthaben zugreifen.

Allerdings: Das ist kein Bankkonto. Dein Geld arbeitet in automatisierten Systemen, die auf Code basieren. Der Wert kann schwanken, und du kannst einen Teil oder dein gesamtes Investment verlieren. Es gibt keine Einlagensicherung.

Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

**Version B (MPC):**

```
Dein Geld ist durch Multi-Party-Sicherheit geschuetzt. Deine Genehmigung ist fuer jede Transaktion erforderlich. DiBoaS haelt einen teilweisen Schluesselanteil fuer Wiederherstellungszwecke, kann dein Guthaben aber nicht einseitig bewegen.

Allerdings: Das ist kein Bankkonto. Dein Geld arbeitet in automatisierten Systemen, die auf Code basieren. Der Wert kann schwanken, und du kannst einen Teil oder dein gesamtes Investment verlieren. Es gibt keine Einlagensicherung.

Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

### Kann ich alles verlieren?

```
Bei den stabilen Strategien (Sicherer Hafen, Torhueter, Geduldiger Aufbauer, Stetige Komposition, Rendite-Maximierer): Die Wahrscheinlichkeit eines Totalverlusts ist aeusserst gering. In fast 4 Jahren Tests und tausenden Simulationen ist es nicht passiert. Aber "aeusserst gering" ist nicht null.

Bei den Wachstumsstrategien: Je hoeher der Wachstumsanteil, desto breiter die Bandbreite moeglicher Ergebnisse. Volle Kraft mit 85% Wachstums-Exposure hat simulierte Rueckgaenge von ueber 78% gezeigt.

Das Risiko ist real. Wir verharmlosen es nicht. Wir helfen dir, das Niveau zu waehlen, das zu dem passt, was du verkraften kannst.
```

### Was ist der Unterschied zu einem Tagesgeldkonto?

```
Ein Tagesgeldkonto ist durch die Einlagensicherung geschuetzt (bis zu 100.000 EUR pro Institut). Dein Geld verdient einen festen Zinssatz. Die Bank kontrolliert es.

Die Strategien von diBoaS nutzen automatisierte Verleih- und Staking-Systeme. Die Renditen sind variabel. Dein Geld ist nicht versichert. Du kontrollierst es ueber deine eigene Wallet.

Der Kompromiss: Potenziell hoehere Renditen, aber du akzeptierst das Risiko, das mit einer anderen Art von System einhergeht.
```

**Hinweis:** Fuer deutsche Nutzer ist "Tagesgeld" die natuerlichste Referenz (nicht "Sparbuch", das veraltet wirkt). Die Einlagensicherung von 100.000 EUR pro Institut ist EU-Standard.

---

**Ueberleitung:**

```
Immer noch hier nach all den Risikohinweisen? Gut. Du hast gruendlicher recherchiert als die meisten.
```

---

## SEKTION 8: WARTELISTE / CTA

**H2:**

```
Gefaellt dir, was du siehst?
```

**Body:**

```
Deine Strategie waehlst du, wenn wir starten. Fuer jetzt: Hinterlasse deine E-Mail und sichere dir deinen Platz.
```

**[E-Mail-Feld: Deine E-Mail-Adresse]**

**CTA-Button:**

```
Fruehzugang sichern
```

**Unter dem CTA:**

```
Kein Spam. Nur deine Einladung, wenn wir bereit sind.
```

**Checkbox:**

```
Ich stimme der Datenschutzerklaerung zu
```

**Unter der Checkbox (Micro-Text):**

```
Kostenlos. Unverbindlich. Waehle deine Strategie, wenn wir starten.
```

---

## SEKTION 9: FOOTER

**Haupthinweis:**

```
Alle Performancedaten basieren auf historischer Analyse (Mai 2022 - Dezember 2025) und tausenden Monte-Carlo-Simulationen. Vergangene Wertentwicklungen garantieren keine zukuenftigen Ergebnisse. Dein Geld wird in automatisierten Systemen angelegt, die technisches Risiko, Marktrisiko, Liquiditaetsrisiko und Stablecoin-Entkopplungsrisiko tragen. Wachstumsstrategien sind mit zusaetzlichem Kursvolatilitaetsrisiko verbunden. Wachstumsstrategien nutzen Protokolle auf der Solana-Blockchain; Ereignisse, die Solana spezifisch betreffen, koennten alle Wachstumsstrategien gleichzeitig beeintraechtigen. Verwende nur Geld, das du verlieren kannst. diBoaS ist keine Bank und deine Gelder sind nicht versichert.
```

**MiCA Artikel 68:**

```
Der Wert von Kryptowerten kann schwanken. Sie koennen Ihr gesamtes investiertes Geld oder einen Teil davon verlieren. Kryptowerte sind nicht durch Einlagensicherungssysteme gedeckt.
```

**MiCA Artikel 7:**

```
Diese Marketingmitteilung fuer Kryptowerte wurde von keiner zustaendigen Behoerde eines Mitgliedstaats der Europaeischen Union ueberprueft oder genehmigt. Der Anbieter des Kryptowertes ist allein fuer den Inhalt dieser Marketingmitteilung fuer Kryptowerte verantwortlich.
```

**KI-Offenlegung:**

```
Bestimmte Inhalte auf dieser Plattform, einschliesslich Marktanalysen und Bildungsmaterialien, werden durch kuenstliche Intelligenz generiert oder unterstuetzt. KI-generierte Inhalte koennen Fehler oder Einschraenkungen enthalten. Nutzer sollten Informationen unabhaengig ueberpruefen, bevor sie Finanzentscheidungen treffen.
```

**Fiktive-Ergebnisse-Offenlegung:**

```
Projizierte Renditen, Wahrscheinlichkeitsschaetzungen und Simulationsergebnisse auf dieser Seite sind illustrativ und stellen keine garantierten Ergebnisse dar. Rechner-Projektionen basieren auf hypothetischen Szenarien und historischen Durchschnittswerten. Tatsaechliche Ergebnisse werden abweichen.
```

**Professionelle-Beratung-Hinweis:**

```
Die Informationen auf dieser Seite dienen ausschliesslich Bildungs- und Informationszwecken. Sie stellen keine Anlageberatung, Finanzberatung oder sonstige professionelle Beratung dar. Ziehe in Betracht, einen zugelassenen Finanzberater zu konsultieren, bevor du Anlageentscheidungen triffst.
```

**(c) 2026 diBoaS. Alle Rechte vorbehalten.**

---

## LOKALISIERUNGSHINWEISE DE

### Anpassungsentscheidungen

1. **Strategienamen uebersetzt:** "Sicherer Hafen", "Torhueter", "Volle Kraft" usw. schaffen eine staerkere emotionale Verbindung als englische Namen. Protokollnamen bleiben technisch auf Englisch.

2. **"Tagesgeld" als Referenz:** In Deutschland ist das Tagesgeldkonto die natuerlichste Sparprodukt-Referenz. Einlagensicherung bis 100.000 EUR pro Institut (EU-Standard). "Sparbuch" waere veraltet.

3. **"Investieren/verkaufen":** Klare, direkte Finanzbegriffe, die im deutschen Fintech-Kontext etabliert sind.

4. **"Anzahlung fuer eine Wohnung":** In deutschen Grossstaedten ist der Wohnungskauf (Eigentumswohnung) die primaere Immobilienreferenz, nicht ein Haus.

5. **"Gebuehr" statt "Kosten":** "Gebuehr" ist der praezise Finanzbegriff und wird von deutschen Nutzern erwartet.

6. **Zahlenformat:** Komma als Dezimaltrennzeichen (0,39%), Punkt als Tausendertrennzeichen (1.000). Europaeischer Standard.

7. **MiCA auf Deutsch:** Artikel 68 und 7 im Footer mit formeller Anrede ("Sie") formuliert, da es regulatorische Pflichthinweise sind. Rest der Seite bleibt bei "du".

8. **Gruendlichkeit:** Deutsche Nutzer schaetzen detaillierte Informationen und transparente Risikohinweise besonders. Die FAQ-Sektion und Risikohinweise sind bewusst ausfuehrlich gehalten, was gut zur deutschen Finanzkultur passt.

9. **"Achterbahn" statt "Roller coaster":** Eingedeutscht, da der Begriff im Deutschen etabliert ist und die richtige emotionale Konnotation traegt.
