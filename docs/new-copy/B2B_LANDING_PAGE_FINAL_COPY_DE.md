# diBoaS B2B Landing Page — Finaler Copy (DE)

## Dokumentstatus

| Feld | Wert |
|------|------|
| Version | FINAL — Produktionsbereit |
| Sprache | Deutsch (DE) |
| Basis | EN B2B Final Champion Copy (Sessions 019-020) |
| Kulturelle Anpassung | Vollstaendig (keine woertliche Uebersetzung) |
| Genehmigt von | CMO Board, CLO Board, Copywriter |
| Datum | 26. Februar 2026 |
| Blockaden | 0 |

## Implementierungshinweise fuer CTO / Claude Code

Vollstaendiger, genehmigter deutscher Copy der B2B-Landingpage von diBoaS. KULTURELLE ANPASSUNG fuer den deutschsprachigen Markt (Deutschland als Hauptmarkt), keine woertliche Uebersetzung. Bedient ZWEI Zielgruppen auf EINER Seite: KMU (kleine und mittlere Unternehmen) und Startups/groessere Unternehmen.

### Kritische Unterschiede zum EN

| Punkt | EN | DE | Grund |
|-------|-----|-----|-------|
| Waehrung | $5 Minimum, $ Beispiele | 5 EUR Minimum, EUR Beispiele | Europaeischer Markt |
| Kartengebuehren | 2-3% (generisch) | 1,5-3% (Kartenzahlungsgebuehren, EC/Kredit) | Deutsche Haendlergebuehren oft niedriger als US, aber Gesamtkosten hoch |
| Ueberweisungen | $25-$50 wire fees | 15-50 EUR SWIFT-Gebuehren | SEPA ist guenstig/gratis, Ausland ist teuer |
| Szenarien | Coffee shop, startup | Cafe in Berlin, Startup in Muenchen | Deutsche Realitaet |
| Regulierung | MiCA auf Englisch | MiCA auf Deutsch (Art. 68 + Art. 7) | EU-Jurisdiktion |
| Anrede | "you" | "du" (informell) | Wie N26, Trade Republic, moderne Fintechs |
| Schmerz KMU | Card processing fees | Kartenzahlungsgebuehren + Kontofuehrungsgebuehren | Deutsche hassen versteckte Bankgebuehren |
| Schmerz Startup | Idle cash earning 0.5% | Geld das auf dem Konto schlaeft | Gleiches Konzept, deutscher Kontext |
| Ton | Warm but direct | Direkt, sachlich, vertrauenswuerdig | Deutsche schaetzen Klarheit und Sicherheit |
| Freelancer | Buenos Aires | Lissabon / Buenos Aires | EU-nahes Beispiel + LATAM-Verbindung |

### Globale Regeln (wie EN)

- KEIN Gedankenstrich. Kommas, Punkte, Doppelpunkte oder Zeilenumbrueche verwenden.
- KEINE Emojis im Fliesstext.
- Alle CTAs sind Buttons, sofern nicht anders angegeben.
- Der Adelaide-Filter gilt: kein Fachjargon auf der Hauptseite.
- Version A/B: bedingt. CTO waehlt beim Build.

### Sektionsablauf

| # | Sektion | Typ | Zielgruppe |
|---|---------|-----|------------|
| 1 | Hero | Statisch | Beide |
| 2 | Zwei Welten | Zwei Karten | Selbstauswahl |
| 3 | Cashflow-Rechner | Interaktiv (NEU) | KMU zuerst |
| 4 | Treasury-Rechner | Interaktiv (verfeinert) | Startup zuerst |
| 5 | Entstehungsgeschichte | Statisch | Beide |
| 6 | So funktioniert's | 4 Schritte | Beide |
| 7 | Drei Vorteile | 3 Karten | Beide |
| 8 | Cashflow-Investieren | Erklaerung (NEU) | KMU zuerst |
| 9 | Gebuehrentransparenz | Tabelle | Beide |
| 10 | Passt es? | Zwei Spalten | Beide |
| 11 | Ueber den Gruender | Statisch mit Foto | Beide |
| 12 | Social Proof + Doppel-CTA | Zaehler + zwei Wege | Beide |
| 13 | FAQ | Akkordeon (10 Punkte) | Beide |
| 14 | Footer | Rechtliche Hinweise | Beide |

---

## SEKTION 1: HERO

**H1:**

```
Das System ist nicht kaputt. Es ist so gebaut, dass es sich an allem bedient, was du verdienst.
```

**Sub-headline:**

```
Du verlierst 1,5 bis 3% bei jeder Kartenzahlung. Und das Geld auf deinem Geschaeftskonto? Es erwirtschaftet Rendite fuer alle ausser fuer dich. Das aendert sich jetzt.
```

**CTA Button:**

```
Sieh, was du verlierst
```

CTA scrollt zu: Sektion 2

**Trust badges:**

```
Dein Geld, deine Kontrolle | Berichte fuer den Vorstand | Gebaut auf auditierten Systemen
```

---

## SEKTION 2: ZWEI WELTEN

Zwei Karten nebeneinander auf Desktop. Gestapelt auf Mobil (Karte A zuerst).

**H2:**

```
Zwei Wege, wie das System dich Geld kostet.
```

### Karte A: Wenn du Kartenzahlungen akzeptierst

```
Jedes Mal, wenn ein Kunde mit Karte zahlt, verlierst du 1,5 bis 3%.

Bei 1.000 EUR Tagesumsatz sind das 450 bis 900 EUR im Monat. Weg. Und dann dauert es 1 bis 5 Werktage, bis das Geld auf deinem Konto ist. Dein Geld, in der Tasche eines anderen, wo es fuer die arbeitet.

Was waere, wenn du alles behalten koenntest? Wenn deine Kunden ueber diBoaS bezahlen, behaltst du 100% jeder Transaktion. Kein Zahlungsdienstleister dazwischen.
```

**CTA Button:**

```
Berechne, was du verlierst
```

CTA scrollt zu: Sektion 3

### Karte B: Wenn dein Unternehmen Geld auf dem Konto liegen hat

```
Du hast Kapital aufgenommen. Du gibst es bedacht aus. Aber das Geld, das du gerade nicht brauchst? Deine Bank legt es an, erwirtschaftet Rendite und zahlt dir fast nichts davon.

Bei 500.000 EUR, die auf dem Konto liegen, koennte die Differenz zwischen dem, was deine Bank dir zahlt, und dem, was moeglich waere, Zehntausende Euro pro Jahr betragen.

Was waere, wenn dieses Geld fuer dich arbeiten wuerde?
```

**CTA Button:**

```
Berechne, was deine Bank behaelt
```

CTA scrollt zu: Sektion 4

---

## SEKTION 3: CASHFLOW-RECHNER

**H2:**

```
Was waere, wenn du die 3% behalten koenntest?
```

**Eingabefelder:**

| Feld | Bezeichnung | Standardwert |
|------|-------------|--------------|
| Taegliche Kartenumsaetze | Deine taeglichen Kartenumsaetze | 1.000 EUR |
| Aktuelle Gebuehr | Deine aktuelle Verarbeitungsgebuehr | 2,5% |

Hinweis: 2,5% als Standard, da dies die durchschnittliche Haendlergebuehr in Deutschland besser widerspiegelt.

**Toggle:** 1 Monat | 6 Monate | 1 Jahr

**Hinweis (UEBER den Ergebnissen):**

```
Diese Projektionen sind illustrativ. Die tatsaechlichen Ergebnisse koennen hoeher oder niedriger ausfallen. Vergangene Wertentwicklung ist kein zuverlaessiger Indikator fuer kuenftige Ergebnisse.
```

**Ergebnisse (3-Szenario-Bereich, fuer Standardwerte: 1.000 EUR/Tag, 2,5%, 1 Jahr):**

| Szenario | Verlust durch Gebuehren | Mit diBoaS (KOSTENLOS) | Du sparst | Wenn du die Ersparnisse investierst |
|----------|------------------------|---------------------|-----------|--------------------------------------|
| Konservativ (4%) | 9.000 EUR | 0 EUR | 9.000 EUR | 9.360 EUR |
| Historischer Durchschnitt (7%) | 9.000 EUR | 0 EUR | 9.000 EUR | 9.630 EUR |
| Optimistisch (10%) | 9.000 EUR | 0 EUR | 9.000 EUR | 9.900 EUR |

**Einstellbarer Regler:** Erwartete Jahresrendite (historischer Durchschnitt: 7%). Bereich: 1% bis 15%.

**Unter den Ergebnissen:**

```
Die letzte Spalte? Das ist der Cashflow-Investitions-Effekt. Du sparst bei den Gebuehren. Dann laesst du die Ersparnisse wachsen. Zwei Vorteile durch eine einzige Veraenderung.

Renditen sind nicht garantiert. Aber die Gebuehrenersparnis ist ab dem ersten Tag real.
```

**CTA Button:**

```
Entdecke den Doppeleffekt
```

CTA scrollt zu: Sektion 8

---

**Ueberleitung:**

```
Das war fuer Unternehmen, die Zahlungen empfangen. Aber was ist mit dem Geld, das einfach auf dem Konto liegt?
```

---

## SEKTION 4: TREASURY-RECHNER

**H2:**

```
Was waere, wenn dein Geld fuer dich arbeiten wuerde?
```

**Eingabefelder:**

| Feld | Bezeichnung | Standardwert |
|------|-------------|--------------|
| Verfuegbares Kapital | Verfuegbares Kapital | 500.000 EUR |
| Aktueller Zinssatz | Aktueller Zinssatz | 0,5% |

**Hinweis (UEBER den Ergebnissen):**

```
Diese Projektionen sind illustrativ. Die tatsaechlichen Ergebnisse koennen hoeher oder niedriger ausfallen. Vergangene Wertentwicklung ist kein zuverlaessiger Indikator fuer kuenftige Ergebnisse. Dein Kapital ist einem Risiko ausgesetzt.
```

**Ergebnisse (3-Szenario-Bereich):**

| Szenario | Rendite | Jahresertrag | Deine Bank (0,5%) | Die Differenz |
|----------|---------|--------------|--------------------|---------------|
| Konservativ | 4% | 20.000 EUR/Jahr | 2.500 EUR/Jahr | 17.500 EUR/Jahr |
| Historischer Durchschnitt | 7% | 35.000 EUR/Jahr | 2.500 EUR/Jahr | 32.500 EUR/Jahr |
| Optimistisch | 10% | 50.000 EUR/Jahr | 2.500 EUR/Jahr | 47.500 EUR/Jahr |

**Einstellbarer Regler:** Erwartete Jahresrendite (historischer Durchschnitt: 7%). Bereich: 1% bis 15%.

**Unter den Ergebnissen:**

```
Das sind Projektionen, keine Versprechen. Aber die Differenz zwischen dem, was deine Bank dir zahlt, und dem, was moeglich waere? Die ist real.
```

**CTA Button:**

```
Entdecke, was moeglich ist
```

CTA scrollt zu: Sektion 12

---

**Ueberleitung:**

```
Hier ist, warum mir das so wichtig ist.
```

---

## SEKTION 5: ENTSTEHUNGSGESCHICHTE

**H2:**

```
Ihr Name war Adelaide.
```

**Text:**

```
Meine Grossmutter hat ihr ganzes Leben lang gespart. Die Haelfte von allem, was sie verdient hat. Alles richtig gemacht.

Es hat trotzdem nicht gereicht.

Die Bank hat ihre Ersparnisse angelegt, Rendite erwirtschaftet und ihr fast nichts davon zurueckgegeben. Kommt dir das bekannt vor?

Ich habe gesehen, wie Cafes 8.000 EUR im Jahr an Kartengebuehren verlieren. Ich habe gesehen, wie Startups mit einer halben Million auf dem Konto weniger als 200 EUR im Monat an Zinsen bekommen. Das System nimmt von allen.

Es war nicht fuer Menschen wie sie gebaut. Es war auch nicht fuer Unternehmen wie deines gebaut, egal ob du ein Cafe oder ein Startup fuehrst.

Aber jetzt? Die Technologie hat es moeglich gemacht, die Mittelsmanner auszuschalten. Ich musste nur die Tuer bauen.

Ich habe sie nach ihr benannt.
```

**Signatur:**

```
Bar, Gruender
```

---

**Ueberleitung:**

```
So funktioniert es.
```

---

## SEKTION 6: SO FUNKTIONIERT'S

**H2:**

```
Vier Schritte. Zwei Minuten.
```

**Schritt 1: Verbinde dein Unternehmen**

```
Verknuepfe dein Geschaeftskonto. Zwei Minuten Einrichtung. Keine technische Integration noetig. Kein Entwickler. Keine Ausfallzeit. Das machst du beim Morgenkaffee.
```

**Schritt 2: Du bestimmst die Regeln**

```
Sag uns deine Untergrenze. "Immer 50.000 EUR verfuegbar halten." Alles darueber? An die Arbeit. Du bestimmst die Regeln. Du aenderst sie jederzeit.
```

**Schritt 3: Dein Geld arbeitet**

```
Dein ungenutztes Kapital beginnt zu verdienen. Zahlungen kommen in Sekunden an, nicht in Tagen. Deine Verarbeitungsgebuehren sinken von 2,5% auf null. Und du musstest an nichts davon denken.
```

**Schritt 4: Jederzeit Zugriff**

```
Du brauchst Bargeld? Ein Tipp. Keine Sperrfristen. Keine Strafen. Sofort verarbeitet. Banktransferzeiten koennen variieren.
```

---

**Ueberleitung:**

```
Das ist der Prozess. Jetzt kommt das, was du wirklich bekommst.
```

---

## SEKTION 7: DREI VORTEILE

**H2:**

```
Was dein Unternehmen bekommt.
```

### Werde bezahlt, ohne dass jemand sich bedient

```
Wenn deine Kunden ueber diBoaS bezahlen, erhaeltst du den vollen Betrag. Kein Abzug. Kein Zahlungsdienstleister, der 1,5 bis 3% abzieht. Kein Warten von 1 bis 5 Werktagen. Geld auf deinem Konto, sofort.

Die 2,5%, die du bisher verloren hast? Bleiben jetzt auf deinem Konto.
```

### Bezahle jeden, ueberall, sofort

```
Lieferanten, Freiberufler, Dienstleister. Ueberall auf der Welt. Echter Wechselkurs. Kostenlos. Keine SWIFT-Gebuehren von 15 bis 50 EUR. Kein Warten von 2 bis 3 Tagen.

Dein Designer in Lissabon wird bezahlt, bevor das Meeting vorbei ist. Zum echten Kurs.
```

### Adelaide ueberwacht dein Geld

```
Marktintelligenz fuer Unternehmer, nicht fuer die Wall Street. Was mit deinem Geld passiert. Was es bedeutet. Was du tun koenntest. Klare Sprache, Berichte fuer den Vorstand, kein Fachjargon.

Finanzintelligenz, die Klartext spricht. Ohne Berater zu 500 EUR die Stunde.
```

---

**Ueberleitung:**

```
Aber jetzt kommt der Teil, den sonst niemand macht.
```

---

## SEKTION 8: CASHFLOW-INVESTIEREN

**H2:**

```
Cashflow-Investieren. Zwei Vorteile durch eine Veraenderung.
```

### Spare es.

```
Heute kostet dich jeder 100 EUR Umsatz 1,50 bis 3 EUR an Verarbeitungsgebuehren. Mit diBoaS kostet Zahlungsempfang nichts.

Der Unterschied summiert sich. Schnell.

Ein Cafe mit 1.000 EUR Tagesumsatz per Karte? Das sind ueber 9.000 EUR im Jahr zurueck in deiner Tasche.
```

### Lass es wachsen.

```
Das gesparte Geld muss nicht einfach daliegen. Aber es kann. Die Gebuehrenersparnis gehoert dir, egal ob du investierst oder nicht.

Wenn du es arbeiten lassen moechtest: ab 5 EUR. Waehle deinen Ansatz, vom sichersten bis zum abenteuerlichsten. Adelaide passt auf.
```

**Micro-Beispiel:**

```
Spare 9.000 EUR an Gebuehren. Investiere es. Beende das Jahr mit zwischen 9.360 und 9.900 EUR, abhaengig von den Marktbedingungen. Das ist keine Kostensenkung. Das ist eine neue Einnahmequelle.
```

**Ehrliche Einschraenkung + Markenversprechen:**

```
Die Ersparnisse sind sicher. Das Wachstum nicht. Das ist die ehrliche Rechnung. Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

**CTA Button:**

```
Rechne es durch
```

CTA scrollt zu: Sektion 3

**Micro-Hinweis (kleiner Text):**

```
Beispiel basierend auf 1.000 EUR/Tag Kartenumsatz bei 2,5% Verarbeitungsgebuehr, mit Ersparnissen investiert zu einer Bandbreite von 4% bis 10% Jahresrendite. Projizierte Renditen sind illustrativ. Die tatsaechlichen Ergebnisse koennen abweichen.
```

---

## SEKTION 9: GEBUEHRENTRANSPARENZ

**H2:**

```
Was es kostet. Alles.
```

**Intro:**

```
Keine versteckten Gebuehren. Keine Mindestguthaben. Keine monatlichen Kosten. Hier ist jede Gebuehr, auf dem Tisch.
```

| Aktion | diBoaS | Uebliche Anbieter | Beispiel |
|--------|--------|--------------------|----------|
| Geschaeftskonto | Fuer immer kostenlos | 10 bis 50 EUR/Monat | Dein Konto: 0 EUR. Immer. |
| Zahlungen empfangen | KOSTENLOS | 1,5 bis 3% (Kartenterminal) | 1.000 EUR empfangen: kostet 0 EUR (nicht 15 bis 30 EUR) |
| Senden / Bezahlen | KOSTENLOS* | 1,50 bis 50 EUR (SWIFT) | Lieferant 500 EUR bezahlen: 0 EUR |
| Geld einzahlen | 0,48% | 0 bis 1,5% | 10.000 EUR einzahlen: kostet 48 EUR |
| Investieren / Wachsen | KOSTENLOS | 0,5 bis 2% (Berater, Plattformen) | 10.000 EUR investieren: 0 EUR. Kostenlos starten. |
| Verkaufen / Schliessen | 0,39% | 0,5 bis 2% | 10.000 EUR verkaufen: kostet 39 EUR |
| Tauschen | KOSTENLOS* | 0,5 bis 2% Spread | 10.000 EUR tauschen: 0 EUR |
| Auszahlen | 0,48% | 1 bis 3% + Verzoegerungen | 10.000 EUR auszahlen: kostet 48 EUR |

```
*Angezeigte diBoaS-Gebuehr. Netzwerkgebuehren Dritter koennen anfallen (typischerweise unter 0,01 EUR).
```

```
Preisvergleiche basieren auf oeffentlich verfuegbaren Tarifen, Stand Februar 2026. Die Spannen spiegeln gaengige Preise bei grossen Anbietern wider. Die tatsaechlichen Preise variieren je nach Anbieter, Volumen und Vertragsbedingungen.
```

**Zusammenfassung:**

```
Du empfaengst 1.000 EUR an Zahlungen: Du behaltst 1.000 EUR in deinem diBoaS-Konto. Auszahlung auf dein Bankkonto: 995,20 EUR (nach 0,48% Auszahlungsgebuehr). Immer noch guenstiger als die 970 bis 980 EUR, die ein Kartenzahlungsdienstleister uebrig laesst.
```

**Schlusszeile:**

```
Jede Gebuehr. Auf dem Tisch. Sonst nichts.
```

---

**Ueberleitung:**

```
Du liest noch? Gut. Schauen wir, ob es zu deinem Unternehmen passt.
```

---

## SEKTION 10: PASST ES?

**H2:**

```
Ist das das Richtige fuer dein Unternehmen?
```

### Gute Passung

```
Dein Unternehmen akzeptiert Kartenzahlungen und du hast die 1,5 bis 3% Gebuehr satt.

Dein Unternehmen hat Kapital auf dem Konto, das fast nichts verdient.

Du willst volle Kontrolle ueber dein Geld.

Du bist bereit, ein anderes Risikoprofil fuer bessere Renditen in Kauf zu nehmen.
```

### Keine Passung

```
Du brauchst eine staatliche Einlagensicherung ueber alles andere.

Du hast null Toleranz fuer jegliches Risiko.

Du bevorzugst traditionelle Banken, auch wenn sie mehr kosten.

Du brauchst jemanden, der dein Geld fuer dich verwaltet.
```

---

## SEKTION 11: UEBER DEN GRUENDER

*(Foto von Bar)*

### Version A: Unternehmen registriert

```
Gebaut von Bar.

Ich bin aufgewachsen und habe zugesehen, wie meine Grossmutter Adelaide ein Finanzsystem navigierte, das nicht fuer sie gemacht war. Sie verdiente bessere Werkzeuge. Genau wie jeder Unternehmer wie du.

diBoaS hat seinen Sitz in Berlin und baut fuer Unternehmen in den USA, der EU und Brasilien. Ich habe ueber 20 Jahre in Produkt und IT in Brasilien, den USA, Japan und Deutschland gearbeitet. Jetzt baue ich das Finanzwerkzeug, das ich mir fuer jedes kleine Unternehmen und jedes Startup gewuenscht haette.

Fragen? Ich lese jede E-Mail. bar@diboas.com
```

### Version B: Unternehmen in Gruendung

```
Gebaut von Bar.

Ich bin aufgewachsen und habe zugesehen, wie meine Grossmutter Adelaide ein Finanzsystem navigierte, das nicht fuer sie gemacht war. Sie verdiente bessere Werkzeuge. Genau wie jeder Unternehmer wie du.

diBoaS wird derzeit in Berlin gegruendet und baut fuer Unternehmen in den USA, der EU und Brasilien. Ich habe ueber 20 Jahre in Produkt und IT in Brasilien, den USA, Japan und Deutschland gearbeitet. Jetzt baue ich das Finanzwerkzeug, das ich mir fuer jedes kleine Unternehmen und jedes Startup gewuenscht haette.

Fragen? Ich lese jede E-Mail. bar@diboas.com
```

### Version C: Vor Registrierung

```
Gebaut von Bar.

Ich bin aufgewachsen und habe zugesehen, wie meine Grossmutter Adelaide ein Finanzsystem navigierte, das nicht fuer sie gemacht war. Sie verdiente bessere Werkzeuge. Genau wie jeder Unternehmer wie du.

Wir bauen diBoaS von Berlin aus, fuer Unternehmen in den USA, der EU und Brasilien. Ich habe ueber 20 Jahre in Produkt und IT in Brasilien, den USA, Japan und Deutschland gearbeitet. Jetzt baue ich das Finanzwerkzeug, das ich mir fuer jedes kleine Unternehmen und jedes Startup gewuenscht haette.

Fragen? Ich lese jede E-Mail. bar@diboas.com
```

**CEO: Version bestaetigen (A, B oder C). Standard: Version B.**

---

## SEKTION 12: SOCIAL PROOF + DOPPEL-CTA

**H2:**

```
Werde Teil der Unternehmen, die aufgehoert haben, zu viel zu bezahlen.
```

**Zaehler:**

```
[X] Unternehmen erkunden diBoaS. [Y] Laender.
```

### Weg A: Frueher Zugang sichern.

```
Hinterlasse deine E-Mail. Wir melden uns, wenn dein Unternehmen anfangen kann zu sparen.
```

**E-Mail-Eingabe:** "Deine geschaeftliche E-Mail"

**CTA Button:**

```
Frueher Zugang sichern
```

```
Kein Spam. Nur deine Einladung, wenn wir bereit sind.
```

**Datenschutz-Checkbox:** Ich stimme der Datenschutzerklaerung zu (/legal/privacy)

### Weg B: Schauen wir uns deine Zahlen an.

*Fuer Unternehmen mit signifikantem Cashflow oder Reserven.*

```
15 Minuten. Keine Verpflichtung. Kein Pitch Deck. Nur Zahlen.
```

**CTA Button:**

```
Gespraech buchen
```

Link: https://cal.com/diboas/treasury-conversation (neuer Tab)

```
Oder schreib an bar@diboas.com
```

---

## SEKTION 13: FAQ

**H2:**

```
Bevor du dich entscheidest.
```

### FAQ 1: Wo ist der Haken?

```
Wir berechnen kleine Gebuehren, wenn Geld bewegt wird. Zahlungsempfang ist kostenlos. Investieren ist kostenlos. 0,39% wenn du eine Position schliesst oder verkaufst. 0,48% wenn du auszahlst.

Wenn du 10.000 EUR an Zahlungen empfaengst, behalten wir nichts. Wenn du 10.000 EUR investierst, behalten wir nichts. Wenn du 10.000 EUR verkaufst, behalten wir 39 EUR. Wenn du nichts verdienst und nichts sendest, verdienen wir nichts.

Keine versteckten Gebuehren. Keine Mindestguthaben. Keine monatlichen Kosten. Kein Haken.
```

### FAQ 2: Ist das fuer kleine Unternehmen oder Startups?

```
Fuer beide. Wenn du ein Cafe fuehrst und 2,5% bei jeder Kartenzahlung verlierst, helfen wir dir, das Geld zu behalten. Wenn du ein Startup bist mit 500.000 EUR auf dem Konto, die 0,5% verdienen, helfen wir, mehr daraus zu machen.

Die Werkzeuge sind die gleichen. Nur die Zahlen sehen anders aus.
```

### FAQ 3: Ist mein Geld sicher?

#### Version A (Nicht-Verwahrung)

```
Dein Geld wird von dir gesichert. Dein Wallet, deine Schluessel. Niemand bei diBoaS kann ohne deine Genehmigung auf dein Geld zugreifen.

Das gesagt: Das ist kein Bankkonto. Dein Geld arbeitet ueber neue Technologie. Der Wert kann schwanken, und du koenntest einen Teil oder dein gesamtes Investment verlieren. Es gibt keine Einlagensicherung.

Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

#### Version B (MPC)

```
Dein Geld ist durch Multi-Party-Sicherheit geschuetzt. Deine Genehmigung ist fuer jede Transaktion erforderlich. DiBoaS haelt einen teilweisen Schluesselanteil fuer Wiederherstellungszwecke, kann dein Geld aber nicht einseitig bewegen.

Das gesagt: Das ist kein Bankkonto. Dein Geld arbeitet ueber neue Technologie. Der Wert kann schwanken, und du koenntest einen Teil oder dein gesamtes Investment verlieren. Es gibt keine Einlagensicherung.

Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

### FAQ 4: Kann ich jederzeit auf mein Geld zugreifen?

```
Ja. Keine Sperrfristen. Du legst die Untergrenze fest: "Immer 50.000 EUR liquide halten." Wir setzen nur ein, was darueber liegt.

Du brauchst Bargeld? Ein Tipp. Wir verarbeiten es sofort. Banktransferzeiten koennen variieren. Keine Strafen. Keine Fragen.
```

### FAQ 5: Wie funktionieren sofortige Zahlungen?

```
Traditionelle Ueberweisungen laufen ueber Korrespondenzbanken. Deine Bank, deren Bank, vielleicht noch eine Bank, dann die Bank des Empfaengers. Jeder Schritt kostet Zeit und Gebuehren.

Mit diBoaS gehen Zahlungen direkt. Dein Wallet zu deren Wallet. Fertig.

Dein Freelancer in Lissabon wird in Sekunden bezahlt, zum echten Wechselkurs, kostenlos. Nicht 15 bis 50 EUR und 3 Werktage.
```

### FAQ 6: Was ist mit Compliance und Steuern?

```
Wir haben diBoaS fuer echte Unternehmen mit echten Compliance-Anforderungen gebaut.

Monatliche Auszuege, formatiert fuer deine Buchhaltungssoftware. Transaktionsverlauf mit vollstaendigem Audit-Trail. Steuerunterlagen zum Jahresende. Berichte fuer den Vorstand, die dein CFO wirklich versteht.

Wir wissen, dass du irgendwann geprueft wirst. Wir sorgen dafuer, dass du vorbereitet bist.
```

### FAQ 7: Wo geht mein Geld genau hin?

```
Dein Geld wird in etablierte Finanzsysteme platziert, die seit ueber 3 Jahren in Betrieb sind, mehrere Markteinbrueche ueberstanden haben und unabhaengig auf Sicherheit geprueft werden.

Alle Details, einschliesslich Namen, Erfolgsbilanzen und unserer Auswahlkriterien, sind auf unserer Strategien-Seite veroeffentlicht. Ohne Anmeldung einsehbar.

Wir haben diese Systeme gewaehlt, weil sie transparent und kampferprobt sind, und du jederzeit genau sehen kannst, wo dein Geld ist.
```

"Strategien-Seite" verlinkt auf /strategies

### FAQ 8: Warum kann diBoaS mein Geld nicht anfassen?

#### Version A (Nicht-Verwahrung)

```
Genau das ist der Sinn unserer Architektur.

Traditionelle Finanzen: Du zahlst Geld ein, es wird das Geld der Bank, und sie schulden dir einen Kontostand.

diBoaS: Dein Geld bleibt in deinem eigenen Wallet. Wir liefern die Software, die dir hilft, es in renditeerzeugende Systeme einzusetzen. Aber wir haben niemals Zugriff, es selbst zu bewegen.

Wenn diBoaS bankrott geht, ist dein Geld immer noch deins. Niemand bei diBoaS kann dein Geld bewegen. Jede Transaktion erfordert deine Genehmigung.

Mehr Kontrolle fuer dich. Weniger Risiko durch uns.
```

#### Version B (MPC)

```
Das ist ein Kernbestandteil unserer Architektur.

Traditionelle Finanzen: Du zahlst Geld ein, es wird das Geld der Bank, und sie schulden dir einen Kontostand.

diBoaS: Dein Geld ist durch Multi-Party-Sicherheit geschuetzt. Wir halten einen teilweisen Schluesselanteil fuer die Kontowiederherstellung, aber jede Transaktion erfordert deine ausdrueckliche Genehmigung. Wir koennen dein Geld nicht einseitig bewegen.

Wenn diBoaS Probleme hat, bleiben deine Gelder durch das Multi-Party-Sicherheitssystem geschuetzt. Jede Transaktion erfordert deine Autorisierung.

Mehr Schutz fuer dich. Weniger Risiko durch uns.
```

### FAQ 9: Was ist das tatsaechliche Risiko?

```
Seien wir ehrlich.

Die Systeme, in die dein Geld fliesst, basieren auf Code. Code kann Schwachstellen haben. Wir reduzieren das, indem wir nur Systeme verwenden mit signifikantem Gesamtwert unter Verwaltung, mehreren unabhaengigen Sicherheitspruefungen, Jahren an Erfolgsgeschichte durch Marktereignisse hindurch, und indem wir dein Geld auf mehrere unabhaengige Systeme verteilen.

Null Risiko? Nein. Das gibt es nirgendwo, auch nicht bei deiner Bank.

Die eigentliche Frage: Sind bessere Renditen ein anderes Risikoprofil wert? Fuer manche Unternehmen ja. Fuer andere nein. Beides ist valide.
```

### FAQ 10: Wurde diBoaS auditiert?

```
Wir sind eine Plattform vor dem Launch. Unsere Strategien sind gegen historische Einbrueche und reale Szenarien getestet, und wir nutzen auditierte, etablierte Systeme. Mit unserem Wachstum planen wir unabhaengige Pruefungen durch Dritte.

Fuer alle Details ueber die Systeme und Technologie hinter jeder Strategie, besuche unsere Strategien- und Protokoll-Seiten.
```

"Strategien" verlinkt auf /strategies, "Protokoll" verlinkt auf /protocols.

---

## SEKTION 14: FOOTER

### Risikohinweis (ALLE Sprachen)

```
diBoaS verbindet dich mit dezentralen Finanzsystemen. Renditen sind nicht garantiert. Vergangene Wertentwicklung sagt keine kuenftigen Ergebnisse voraus. Es bestehen Risiken, darunter Code-Schwachstellen, Marktschwankungen und Zugangsherausforderungen. Verwende nur Mittel, deren Verlust du dir leisten kannst. diBoaS ist keine Bank. Es gilt keine Einlagensicherung.
```

### MiCA Artikel 68: Risikowarnung

```
Der Wert von Kryptowerten kann schwanken. Sie koennen Ihr gesamtes investiertes Geld oder einen Teil davon verlieren. Kryptowerte sind nicht durch Einlagensicherungssysteme gedeckt.
```

### MiCA Artikel 7: Hinweis zur Marketingmitteilung

```
Diese Marketingmitteilung zu Kryptowerten wurde von keiner zustaendigen Behoerde eines Mitgliedstaats der Europaeischen Union ueberprueft oder genehmigt. Der Anbieter des Kryptowerts ist allein fuer den Inhalt dieser Marketingmitteilung zu Kryptowerten verantwortlich.
```

### KI-Hinweis

```
Bestimmte Inhalte auf dieser Plattform, einschliesslich Marktanalysen und Bildungsmaterialien, werden durch kuenstliche Intelligenz generiert oder unterstuetzt. KI-generierte Inhalte koennen Fehler oder Einschraenkungen enthalten. Nutzer sollten Informationen unabhaengig ueberpruefen, bevor sie finanzielle Entscheidungen treffen.
```

### Hinweis zu fiktiven Ergebnissen

```
Die Beispiele auf dieser Seite sind illustrativ und stellen keine realen Unternehmen oder tatsaechlichen Ergebnisse dar. Rechner-Projektionen basieren auf hypothetischen Szenarien und historischen Durchschnitten. Die tatsaechlichen Ergebnisse werden abweichen.
```

### Zusaetzliche Footer-Elemente

- Social Links: Instagram, X, YouTube, LinkedIn
- Navigation: Ueber uns, Rechtliches, Datenschutzerklaerung, Nutzungsbedingungen, Cookie-Richtlinie, Hilfe, Sicherheit
- Copyright: (c) 2026 diBoaS. Alle Rechte vorbehalten.

---

## UEBERLEITUNG-KARTE

| Nach | Text | Zu |
|------|------|----|
| 1. Hero | (CTA scrollt) | Zwei Welten |
| 2. Zwei Welten | (CTAs scrollen zu Rechnern) | Rechner |
| 3. Cashflow-Rechner | "Das war fuer Unternehmen, die Zahlungen empfangen. Aber was ist mit dem Geld, das einfach auf dem Konto liegt?" | Treasury-Rechner |
| 4. Treasury-Rechner | "Hier ist, warum mir das so wichtig ist." | Entstehungsgeschichte |
| 5. Geschichte | "So funktioniert es." | So funktioniert's |
| 6. So funktioniert's | "Das ist der Prozess. Jetzt kommt das, was du wirklich bekommst." | Drei Vorteile |
| 7. Vorteile | "Aber jetzt kommt der Teil, den sonst niemand macht." | Cashflow-Investieren |
| 8. Cashflow-Inv. | (natuerlicher Fluss) | Gebuehren |
| 9. Gebuehren | "Du liest noch? Gut. Schauen wir, ob es zu deinem Unternehmen passt." | Passt es? |
| 10-14 | (natuerlicher Fluss) | Sequenziell |

---

## MARKENREGELN

### Adelaide-Filter — Verbotene Woerter

Blockchain, DeFi, Protokoll(e) (ausser FAQ 10 Link), Stablecoin(s), Pegged, On-ramp/Off-ramp, Smart Contract(s), Rendite/Yield (im Fachjargon-Sinn), Nicht-Verwahrung (nutze "dein Wallet, deine Schluessel"), TVL, APY/APR

### Markenversprechen (max 2 Verwendungen)

```
Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

1. FAQ 3
2. Sektion 8

### Stimme

- Zweite Person ("du")
- Direkt, sachlich, vertrauenswuerdig
- Ehrlich bei Einschraenkungen
- Kein Gedankenstrich, keine Emojis
- Spricht den Cafebesitzer UND den Startup-CFO an
