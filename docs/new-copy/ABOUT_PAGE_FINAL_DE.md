# Ueber diBoaS — Finaler Copy (DE)

## Dokumentstatus

| Feld | Wert |
|------|------|
| Version | FINAL — Post-CLO + Post-Copywriter |
| Sprache | Deutsch (DE) |
| Datum | 28. Februar 2026 |
| Basis | ABOUT_PAGE_FINAL_EN.md |
| Kulturelle Anpassung | Vollstaendig (keine woertliche Uebersetzung) |
| CLO Review | Alle P0/P1-Fixes aus EN uebernommen. |
| Copywriter Review | Alle Fixes (FIX-1 Mission, FIX-2 Transition Hooks) uebernommen. |
| Ausstehend | CEO Sign-off (Routine) |

## Implementierungshinweise fuer CTO / Claude Code

Dieses Dokument enthaelt den vollstaendigen deutschen Copy der About-Seite von diBoaS. KULTURELLE ANPASSUNG fuer den deutschsprachigen Markt (Deutschland als Hauptmarkt), keine woertliche Uebersetzung.

### Kritische Unterschiede zum EN

| Punkt | EN | DE | Grund |
|-------|-----|-----|-------|
| Waehrung | $5 | 5 EUR | Europaeischer Markt |
| Minimum Karte 3 | $10,000 | 10.000 EUR | Deutsche Bankrealitaet |
| Bankschmerz | "almost nothing" | "Tagesgeld-Zinsen" | Deutsches Sparprodukt als Referenz |
| Kontofuehrung | Nicht erwaehnt | Implizit (bekannter Schmerzpunkt) | Kontofuehrungsgebuehren kennt jeder |
| Anrede | "you" | "du" (informell) | Moderne Fintech-Anrede (N26, Trade Republic) |
| Dezimaltrennzeichen | 0.39% (Punkt) | 0,39% (Komma) | Europaeisches Zahlenformat |
| Tausendertrennzeichen | 1,000 (Komma) | 1.000 (Punkt) | Europaeisches Zahlenformat |
| Regulierung | MiCA auf Englisch | MiCA auf Deutsch (Art. 68 + Art. 7) | EU-Jurisdiktion |
| Ton | Warm, direct | Klar, direkt, gruendlich, trotzdem nahbar | Deutsche Fintech-Kultur |
| Standort Berlin | Neutral | Lokaler Vorteil ("Hier in Berlin") | Naeher am Leser |

### Globale Regeln

- KEIN Gedankenstrich auf der gesamten Seite. Kommas, Punkte, Doppelpunkte oder Zeilenumbrueche verwenden.
- KEINE Emojis im Fliesstext.
- Adelaide-Filter gilt: kein Fachjargon. Kein "Stablecoins," "Protokolle," "DeFi," "Yield," "APY."
- Transition Hooks als dezente Ueberleitungstexte gestalten.
- Footer verwendet die gemeinsame Disclaimer-Komponente (wie B2C, Strategien, Protokolle).

### Sektionsablauf

| # | Sektion | Komponente | Aenderungen |
|---|---------|------------|-------------|
| 1 | Hero | `PageHeroSection` | Untertitel angepasst |
| t1 | Ueberleitung | Dezenter Ueberleitungstext | **NEU** |
| 2 | Die Geschichte | `SectionContainer` + Prosa | H2 + Body angepasst |
| t2 | Ueberleitung | Dezenter Ueberleitungstext | **NEU** |
| 3 | Was diBoaS macht | `SectionContainer` + Prosa | Komplett neu. Kostenlose Ueberweisungen zuerst. |
| 4 | Woran wir glauben | `ContentCard` x 3 | Alle 3 Karten angepasst |
| 5 | Die Mission | `SectionContainer` | Adelaide-Callback mit konkreten Details |
| t3 | Ueberleitung | Dezenter Ueberleitungstext | **NEU** |
| 6 | Fuer Unternehmen | `SectionContainer` + CTA | Erweitert mit deutschen Schmerzpunkten |
| t4 | Ueberleitung | Dezenter Ueberleitungstext | **NEU** |
| 7 | Kontakt | `SectionContainer` | "Bar" + persoenliche E-Mail |
| 8 | Warteliste | `WaitlistSection` | Keine Aenderungen |
| — | Footer | Gemeinsame Footer-Komponente | **NEU: muss von CTO eingebunden werden** |

### Transition Hooks

| Hook | Text | Position |
|------|------|----------|
| t1 | "Lass mich dir eine Geschichte erzaehlen." | Nach Hero, vor Sektion 2 |
| t2 | "Das hier habe ich gebaut." | Nach Sektion 2, vor Sektion 3 |
| t3 | "Und das gilt nicht nur fuer Privatpersonen." | Nach Sektion 5, vor Sektion 6 |
| t4 | "Du willst reden? Ich bin hier." | Nach Sektion 6, vor Sektion 7 |

---

## SEKTION 1: HERO

**H1:**

```
Ueber diBoaS
```

**Untertitel:**

```
Eine Grossmutter. Ein Problem. Eine Plattform.
```

---

## SEKTION 2: DIE GESCHICHTE

**H2:**

```
Ihr Name war Adelaide.
```

**Body:**

```
Meine Grossmutter hat ihr ganzes Leben in Rio de Janeiro gelebt. Sie hat mir beigebracht zu sparen. Sie sagte, ich solle versuchen, die Haelfte von allem zu sparen, was ich verdiene. Sie selbst hat das auch versucht. Ihr ganzes Leben lang.
```

**Body (medium-weight):**

```
Hart arbeiten. Nur das Noetigste kaufen. Versuchen zu sparen.
```

**Body (bold):**

```
Es hat trotzdem nicht gereicht.
```

**Body:**

```
Was ihr niemand gesagt hat: Ihre Bank hat ihr fast nichts gezahlt, waehrend sie mit ihrem Geld echte Renditen erwirtschaftet hat. Diese Luecke, zwischen dem, was Banken verdienen, und dem, was sie weitergeben, ist kein Fehler im System. Das System funktioniert genau so. Nur nicht fuer Menschen wie sie.
```

**Body:**

```
Der Zugang war versperrt hinter hohen Mindestbetraegen, komplizierten Woertern und Institutionen, denen Menschen mit kleinen Ersparnissen egal waren.
```

**Body:**

```
2024 habe ich meinen Job verloren und beschlossen, etwas an diesem Problem zu aendern. Neue Technologie machte es moeglich, die Torwaechter zu umgehen. Ich musste nur die Tuer bauen.
```

**Body (medium-weight):**

```
Ich habe sie nach ihr benannt.
```

### Hinweise

- "Ihr Name war Adelaide." muss exakt mit B2C Sektion 2 H2 uebereinstimmen.
- "Ich habe sie nach ihr benannt." ist der emotionale Abschluss. Leichten Abstand darueber einfuegen.
- Rio de Janeiro bleibt unveraendert. Die Geschichte ist international, das ist Teil ihrer Kraft.
- Keine spezifischen Bankzinsen-Angaben (CLO-sicher). "Fast nichts" + "echte Renditen" traegt das gleiche emotionale Gewicht.
- "Es hat trotzdem nicht gereicht." ist staerker als "Es hat nicht funktioniert." weil es die Anstrengung anerkennt.

---

## SEKTION 3: WAS diBoaS MACHT

**H2:**

```
Was diBoaS macht
```

**Body (Absatz 1 — kostenlose Ueberweisungen):**

```
Zuerst das Wichtigste. Sende Geld an jeden auf diBoaS. Ueberall auf der Welt. In Sekunden. Kostenlos. Keine Formulare, keine Gebuehren, kein Warten auf drei Bankarbeitstage. Geld sollte sich wie eine Nachricht bewegen. Jetzt tut es das.
```

**Micro-Disclaimer (kleiner Text, unter Absatz 1):**

```
Kostenlose Ueberweisungen zwischen diBoaS-Nutzern. Ueberweisungszeiten sind typisch und koennen variieren. Vorbehaltlich geltender Sanktionen und Compliance-Anforderungen.
```

**Body (Absatz 2 — Wachstum):**

```
Dann Wachstum. Waehle aus 10 Moeglichkeiten, dein Geld wachsen zu lassen, von der sichersten Option bis zur abenteuerlichsten. Ab 5 EUR. Dein Geld arbeitet ueber vertrauenswuerdige Finanzsysteme, die zusammen Milliarden an Vermoegenswerten gesichert haben. Die gleiche Art von Systemen, die Institutionen nutzen, jetzt offen fuer dich.
```

**Body (Absatz 3 — Adelaide AI, medium-weight):**

```
Und Adelaide ueberwacht das Ganze. Benannt nach der Grossmutter, die das hier inspiriert hat, ist Adelaide deine persoenliche Finanzintelligenz. Was sich bewegt. Was es bedeutet. Was du tun koenntest. Klare Sprache, kein Fachjargon.
```

### Hinweise

- Kostenlose Ueberweisungen kommen ZUERST (CEO-Prioritaet).
- "Geld sollte sich wie eine Nachricht bewegen" ist die OneFi-Positionierung.
- 5 EUR Minimum (statt $5).
- "Drei Bankarbeitstage" ist ein bekannter deutscher Schmerzpunkt fuer internationale Ueberweisungen.
- "Vertrauenswuerdige Finanzsysteme" statt "Protokolle" (Adelaide-Filter).

---

## SEKTION 4: WORAN WIR GLAUBEN

**H2:**

```
Woran wir glauben
```

### Karte 1

**Titel:**

```
Dein Geld sollte fuer dich arbeiten.
```

**Beschreibung:**

```
Nicht fuer deine Bank. Nicht fuer einen Mittelsmann. Fuer dich. Die Luecke zwischen dem, was Banken mit deinem Geld verdienen, und dem, was sie dir davon zurueckgeben, ist real. Wir schliessen diese Luecke.
```

### Karte 2

**Titel:**

```
Ehrlichkeit statt Hype.
```

**Beschreibung:**

```
Wir versprechen keine garantierten Renditen, denn das kann niemand. Was wir bieten: echte Daten aus fast 4 Jahren historischer Analyse, klare Erklaerungen, wie jede Option funktioniert, und ein Lernzentrum, damit du verstehst, was du tust, bevor du es tust. Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

### Karte 3

**Titel:**

```
Starte mit 5 EUR. Lerne dabei.
```

**Beschreibung:**

```
Du brauchst keine 10.000 EUR, um anzufangen. Starte mit dem, was sich fuer dich gut anfuehlt. Schau, wie es funktioniert. Dann entscheide, ob es zu dir passt. Kein Druck, keine Paketangebote, keine langfristigen Bindungen.
```

### Hinweise

- Karte 2 enthaelt das Markenversprechen (1 von max. 2 Vorkommen): "Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer." Muss woertlich beibehalten werden.
- "Fast 4 Jahre" — nicht "4 Jahre" (CLO-Vorgabe).
- 10.000 EUR statt $10,000 — spiegelt die Mindestbetraege deutscher Fondsanbieter wider.
- "Kein Druck, keine Paketangebote, keine langfristigen Bindungen" — natuerlicher im Deutschen als eine woertliche Uebersetzung von "locked-in commitments."

---

## SEKTION 5: DIE MISSION

**H2:**

```
Die Mission
```

**Body:**

```
Adelaide hatte nie eine Wahl. Hohe Mindestbetraege, versteckte Gebuehren und komplizierte Woerter hielten die Tuer verschlossen.
```

**Statement (medium-weight):**

```
Wir bauen die Tuer, die sie nie bekommen hat.
```

**Sauelen:**

```
Kostenloser Geldtransfer. Echte Wachstumsoptionen. Volle Transparenz. Ab 5 EUR. In vier Sprachen. Fuer alle.
```

### Hinweise

- "Adelaide hatte nie eine Wahl" ruft Sektion 2 zurueck.
- "Die Tuer, die sie nie bekommen hat" spiegelt "Ich musste nur die Tuer bauen" aus Sektion 2 wider.
- "Ab 5 EUR. In vier Sprachen. Fuer alle." — konkret und ueberpruefbar.

---

## SEKTION 6: FUER UNTERNEHMEN

**H2:**

```
Fuer Unternehmen
```

**Body (Absatz 1):**

```
Wenn du Kartenzahlungen akzeptierst, fressen Bearbeitungsgebuehren an jeder Transaktion. Wenn Geld auf deinem Geschaeftskonto liegt, verdient deine Bank damit, waehrend du fast nichts davon siehst. Das gleiche System, das meiner Grossmutter nicht geholfen hat, sitzt auf den Ruecklagen deines Unternehmens.
```

**Body (Absatz 2):**

```
diBoaS for Business hilft Unternehmen, mehr von dem zu behalten, was sie verdienen, mit taggleicher Liquiditaet, Berichten fuer die Geschaeftsfuehrung und Zugang zu den gleichen vertrauenswuerdigen Systemen, die unsere Plattform fuer Privatkunden antreiben.
```

**CTA:**

```
Mehr erfahren ueber diBoaS for Business
```

CTA verlinkt auf: `/business`

### Hinweise

- "Geschaeftskonto" statt "idle cash" — natuerlichere deutsche Formulierung.
- "Berichte fuer die Geschaeftsfuehrung" statt "board-ready reporting" — deutsche Unternehmensrealitaet.
- Grossmutter-Callback funktioniert auch im B2B-Kontext: "Das gleiche System, das meiner Grossmutter nicht geholfen hat..."

---

## SEKTION 7: KONTAKT

**H2:**

```
Kontakt
```

**Kontaktdaten:**

```
Gruender: Bar
Standort: Berlin, Deutschland
E-Mail: hello@diboas.com
```

**Persoenliche Zeile:**

```
Fragen? Ich lese jede E-Mail. bar@diboas.com
```

### Hinweise

- "Bar" (nicht "Breno"). Uebereinstimmung mit B2C Sektion 8.5.
- "Berlin, Deutschland" ist fuer deutsche Leser lokal — das schafft Vertrauen.
- "Ich lese jede E-Mail." — direkt und persoenlich, passt zum Fintech-Ton.

---

## SEKTION 8: WARTELISTE

Keine Copy-Aenderungen. Verwendet die gemeinsame `WaitlistSection`-Komponente.

---

## FOOTER

### Erforderliche Hinweise

#### MiCA Art. 68 + Art. 7 (auf Deutsch)

```
Kryptowerte sind nicht durch gesetzliche Einlagensicherung geschuetzt. Vergangene Wertentwicklungen garantieren keine zukuenftigen Ergebnisse. Sie sollten Ihre eigene unabhaengige Bewertung vornehmen, bevor Sie eine Investitionsentscheidung treffen.
```

#### KI-Offenlegung (auf Deutsch)

```
Teile der Inhalte auf dieser Plattform, einschliesslich Marktanalysen und Lehrmaterialien, werden von kuenstlicher Intelligenz generiert oder unterstuetzt. KI-generierte Inhalte koennen Fehler oder Einschraenkungen enthalten. Nutzer sollten Informationen unabhaengig ueberpruefen, bevor sie finanzielle Entscheidungen treffen.
```

Verwendet die gleiche gemeinsame Komponente wie B2C, Strategien und Protokolle.

---

## SEO

```json
{
  "seo.title": "Ueber diBoaS | Gebaut fuer die, die Banken vergessen haben",
  "seo.description": "diBoaS wurde gebaut, weil eine Grossmutter etwas Besseres verdient hat. Jetzt alle. Kostenlose Ueberweisungen, echte Wachstumsoptionen, ab 5 EUR.",
  "seo.ogTitle": "Ueber diBoaS | Gebaut fuer die, die Banken vergessen haben",
  "seo.ogDescription": "diBoaS wurde gebaut, weil eine Grossmutter etwas Besseres verdient hat. Jetzt alle. Kostenlose Ueberweisungen, echte Wachstumsoptionen, ab 5 EUR."
}
```

---

## CROSS-PAGE-KONSISTENZPRUEFUNG

| Element | Andere Seiten | About-Seite | Uebereinstimmung |
|---------|---------------|-------------|------------------|
| "Ihr Name war Adelaide" | B2C Sektion 2 | Sektion 2 H2 | ✅ |
| "Bar" (nicht "Breno") | B2C + B2B | Sektionen 2, 7 | ✅ |
| 5 EUR Minimum | B2C FAQ, Strategien | Sektionen 3, 4, 5 | ✅ |
| "fast 4 Jahre" | Strategien Hero | Sektion 4 Karte 2 | ✅ |
| Markenversprechen woertlich | B2C (2x) | Sektion 4 Karte 2 | ✅ |
| Adelaide-Filter | Alle Seiten | Sauber (0 Verstoesse) | ✅ |
| 10 Strategien | B2C Sektion 4 | Sektion 3 | ✅ |
| "Ich habe sie nach ihr benannt" | B2C Sektion 2 | Sektion 2 Abschluss | ✅ |
| Kostenlose Ueberweisungen = Hauptprop | B2C Hero | Sektion 3 Absatz 1 | ✅ |
| Transition Hooks | B2C (7), Protokolle (5) | About (4) | ✅ |
| MiCA Footer | Alle DE-Seiten | Footer | ✅ |

---

## KULTURELLE ANPASSUNGSNOTIZEN

| Aspekt | EN | DE | Grund |
|--------|-----|-----|-------|
| "It still didn't work" | Direkt | "Es hat trotzdem nicht gereicht" | Anerkennt die Anstrengung, staerker auf Deutsch |
| Bankschmerz | Generisch "high fees" | Kontofuehrungsgebuehren implizit | Jeder Deutsche kennt diesen Schmerz |
| Mindestbetrag | $10,000 | 10.000 EUR | Deutsche Fondsanbieter-Realitaet |
| B2B-Sprache | "board-ready" | "Geschaeftsfuehrung" | Deutsche Unternehmensstruktur |
| Standort | Neutral | Lokal (Berlin schafft Vertrauen) | Deutscher Leser = naeher |
| "Three business days" | US-Kontext | "Drei Bankarbeitstage" | Gleicher Schmerz, lokaler Begriff |
| "Locked-in commitments" | US-Vertrag | "Langfristige Bindungen" | Natuerlicher im Deutschen |

**Ende des DE-Dokuments.**
