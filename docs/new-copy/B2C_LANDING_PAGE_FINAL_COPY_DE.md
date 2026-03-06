# diBoaS B2C Landing Page - Finaler Copy (DE)

## Dokumentstatus

| Feld | Wert |
|------|------|
| Version | FINAL - Produktionsbereit |
| Sprache | Deutsch (DE) |
| Basis | EN Final Champion Copy (Sessions 015-018) |
| Kulturelle Anpassung | Vollstaendig (keine woertliche Uebersetzung) |
| Datum | 26. Februar 2026 |
| Blockaden | 0 |

## Implementierungshinweise fuer CTO / Claude Code

Dieses Dokument enthaelt den vollstaendigen deutschen Copy der B2C-Landingpage von diBoaS. Dies ist eine KULTURELLE ANPASSUNG fuer den deutschsprachigen Markt (Deutschland als Hauptmarkt), keine woertliche Uebersetzung.

### Kritische Unterschiede zum EN

| Punkt | EN | DE | Grund |
|-------|-----|-----|-------|
| Waehrung | $5 Minimum | 5 EUR Minimum | Europaeischer Markt |
| Ueberweisungen | Schmerz: hohe Gebuehren | Schmerz: Kontofuehrungsgebuehren + Ueberweisungen ausserhalb EU | Deutscher Bankkontext |
| Szenarien | San Francisco, Dubai, Mom | Familie im Ausland, Freelancer, Mama | Deutsche Realitaet |
| Regulierung | MiCA auf Englisch | MiCA auf Deutsch (Art. 68 + Art. 7) | EU-Jurisdiktion |
| Anrede | "you" | "du" (informell) | Moderne Fintech-Anrede (wie N26, Trade Republic) |
| Gebuehrentabelle | $ Referenzen | EUR Referenzen + deutscher Kontext | Lokale Kosten |

### Globale Regeln (wie EN)

- KEIN Gedankenstrich-Zeichen auf der gesamten Seite. Kommas, Punkte, Doppelpunkte oder Zeilenumbrueche verwenden.
- KEINE Emojis im Fliesstext.
- Alle CTAs sind Buttons, sofern nicht anders angegeben.
- Der Adelaide-Filter gilt: kein Fachjargon auf der Hauptseite.

### Sektionsablauf (Finale Reihenfolge)

| Sektion | Name | Typ |
|---------|------|-----|
| 1 | Hero | Statisch |
| 2 | Entstehungsgeschichte | Statisch |
| 2.5 | Persona-Karussell | Rotierendes Karussell (3 Slides) |
| 3 | Szenarien aus dem echten Leben | Karten (3) |
| 4 | Produkt-Karussell | Rotierendes Karussell (3 Slides) |
| 5 | Gebuehrentransparenz-Tabelle | Statische Tabelle |
| 6 | Wo ist der Haken? | Statisch |
| 6.5 | So funktioniert es unter der Haube | Auf-/zuklappbar (standardmaessig geschlossen) |
| 7 | Interaktive Demo | Interaktive Komponente |
| 8 | Social Proof | Dynamischer Zaehler |
| 8.5 | Ueber den Gruender | Statisch mit Foto |
| 9 | Warteliste | Formular (zwei Versionen) |
| 10 | FAQ | Akkordeon (13 Punkte) |
| 11 | Footer | Statisch mit rechtlichen Hinweisen |

---

## SEKTION 1: HERO

### Inhalt

**H1:**

```
Das System ist nicht kaputt. Es funktioniert genau so, wie es gedacht war. Nur nicht fuer dich.
```

**Sub-headline:**

```
Sende Geld ueberall hin in Sekunden. Kostenlos. Und dann lass es wachsen, waehrend du schlaefst.
```

**CTA Button:**

```
Sieh dein Geld in Aktion
```

### Hinweise

- H1 ist unantastbar. Nicht aendern.
- Kein Friktionsreduzierer-Text unter dem CTA.
- CTA verlinkt auf Sektion 7 (Interaktive Demo).

---

## SEKTION 2: ENTSTEHUNGSGESCHICHTE

### Inhalt

**Transition Hook (vom Hero):**

```
Deshalb baue ich das hier.
```

**H2:**

```
Ihr Name war Adelaide.
```

**Body:**

```
Meine Grossmutter hatte nie Zugang zu den Finanzinstrumenten, die ihr Leben haetten veraendern koennen.

Das System war nicht kaputt. Es funktionierte genau so, wie es gedacht war.
Nur nicht fuer Menschen wie sie. Wie mich. Wie dich.

Der Zugang war versperrt hinter hohen Mindestbetraegen, komplizierten Woertern und grossen Finanzinstituten, denen Menschen mit kleinen Ersparnissen egal waren.

10.000 EUR, um ein Investmentkonto zu eroeffnen. 15 EUR im Monat nur fuer die Kontofuehrung. Das war der Preis des Zugangs.

Neue Technologie machte es moeglich, die Torwaechter zu umgehen.
Ich musste nur die Tuer bauen.

Ich habe sie nach ihr benannt.
```

### Hinweise

- Die Betraege (10.000 EUR und 15 EUR) spiegeln die deutsche Bankrealitaet wider.
- Kontofuehrungsgebuehren sind ein bekannter Schmerzpunkt in Deutschland.
- Die letzte Zeile "Ich habe sie nach ihr benannt." braucht einen Abstand darueber fuer eine Pause.

---

## SEKTION 2.5: PERSONA-KARUSSELL

### Inhalt

**Transition Hook (von der Entstehungsgeschichte):**

```
Ich habe es fuer dich gebaut.
```

#### Slide 1: Der Sender

**Hintergrund-Richtung:** Warm, menschlich. Jemand spaet nachts am Handy, weiches Licht.

**Headline:**

```
Deine Mama braucht es jetzt. Nicht waehrend der Geschaeftszeiten.
```

**Sub-text:**

```
Sende Geld an jeden auf diBoaS. Ueberall auf der Welt. In Sekunden. Kostenlos.
```

**CTA Button:**

```
Sieh dein Geld in Aktion
```

#### Slide 2: Der Sparer

**Hintergrund-Richtung:** Klar, praktisch. Jemand, der auf eine Rechnung oder einen Laptop mit Zahlen schaut.

**Headline:**

```
Du zahlst Hunderte Euro im Jahr an Gebuehren, die du nicht einmal siehst.
```

**Sub-text:**

```
Keine monatlichen Gebuehren. Keine versteckten Kosten. Kein Kleingedrucktes. Nur dein Geld, das fuer dich arbeitet.
```

**CTA Button:**

```
Sieh dein Geld in Aktion
```

#### Slide 3: Der Wachser

**Hintergrund-Richtung:** Aufstrebend, ruhig. Sonnenaufgang, jemand entspannt, nach vorne blickend.

**Headline:**

```
Dein Sparkonto bringt dir fast nichts. Das weisst du.
```

**Sub-text:**

```
Waehle, was zu deinem Leben passt, vorsichtig oder abenteuerlustig. Ab 5 EUR. Adelaide passt auf dein Geld auf, damit du es nicht tun musst.
```

**CTA Button:**

```
Sieh dein Geld in Aktion
```

**Transition Hook (Ausgang, zu Szenarien):**

```
Und so sieht das in der Praxis aus.
```

---

## SEKTION 3: SZENARIEN AUS DEM ECHTEN LEBEN

### Inhalt

**H2:**

```
Echte Menschen. Echte Momente.
```

#### Karte 1: Geld an deinen Bruder in der Tuerkei senden

```
Er ist Tausende Kilometer entfernt. Du schickst es. Es kommt an, bevor du dein Handy weglegst.
```

**Kostenvergleich (kleiner/hervorgehobener Text):**

```
Internationale Ueberweisungen: 25 bis 50 EUR plus 2 bis 3 Werktage. diBoaS: kostenlos und sofort.
```

#### Karte 2: Einen Designer in Lissabon bezahlen

```
Er ist in Portugal. Du bist in Deutschland. Das Geld kommt an, bevor das Meeting vorbei ist.
```

**Kostenvergleich (kleiner/hervorgehobener Text):**

```
Bankueberweisung ausserhalb SEPA: 15 bis 45 EUR plus Wechselkursaufschlag. diBoaS: kostenlos und sofort.
```

#### Karte 3: Notfall-Geld fuer Mama

```
3 Uhr morgens. Sie braucht es jetzt. Nicht am "naechsten Werktag".
```

**Kostenvergleich (kleiner/hervorgehobener Text):**

```
Traditionelle Geldtransferdienste: 9,99 EUR+ und Zustellung am naechsten Tag. diBoaS: kostenlos, kommt sofort an.
```

**Klarstellungszeile (unter den Karten):**

```
Nutze diBoaS einfach fuer kostenlose Ueberweisungen. Sonst nichts noetig. Wenn du mehr willst, ist es da.
```

**Fussnote (kleiner Text):**

```
Preisvergleiche basieren auf oeffentlich verfuegbaren Tarifen, Stand Februar 2026.
```

### Hinweise

- Szenarien spiegeln die deutsche Realitaet wider: viele Deutsche haben Familie in der Tuerkei, auf dem Balkan oder in Suedeuropa. Ausserdem internationale Freelancer-Zahlungen.
- Keine namentlich genannten Wettbewerber. Nur generische Kategorien.
- SEPA-Kontext ist wichtig: innerhalb SEPA sind Ueberweisungen guenstig, der Schmerz liegt bei Non-SEPA.

---

## SEKTION 4: PRODUKT-KARUSSELL

### Inhalt

**Transition Hook (von den Szenarien):**

```
So funktioniert es.
```

**H2:**

```
Geld, das sich bewegt wie Nachrichten.
```

#### Slide 1: Senden und Empfangen

**Zitat:**

```
"Ich habe 200 EUR an meinen Bruder geschickt. Es kam an, bevor ich mein Handy weggelegt habe."
```

**Beschreibung:**

```
Sende Geld an jeden auf diBoaS. Ueberall auf der Welt. In Sekunden. Von 5 EUR bis 5.000 EUR. Kostenlos. Dein Geld wird als digitaler Dollar gespeichert, der so konzipiert ist, dass er immer 1 USD wert ist. Auszahlung auf dein Bankkonto jederzeit.
```

#### Slide 2: Investieren und Wachsen

**Zitat:**

```
"Ich hatte 200 EUR auf dem Konto rumliegen, die nichts gebracht haben. Jetzt bringen sie mehr als das, was mir meine Bank in 5 Jahren geboten hat."
```

**Beschreibung:**

```
Waehle aus 10 Moeglichkeiten, dein Geld wachsen zu lassen. Von der sichersten Option bis zur abenteuerlichsten. Ab 5 EUR. Dein Geld arbeitet, waehrend du schlaefst.
```

#### Slide 3: Verfolgen und Lernen

**Zitat:**

```
"Adelaide passt auf mein Geld auf, damit ich es nicht tun muss. Einmal am Tag nachschauen. Weniger Stress. Mehr Leben."
```

**Beschreibung:**

```
Was sich bewegt. Was es bedeutet. Was du tun koenntest. Klare Sprache, kein Fachjargon.
```

**Micro-Disclosure (unter dem Karussell, kleiner Text):**

```
Die gezeigten Beispiele sind illustrativ und stellen keine echten Nutzer dar.
```

---

## SEKTION 5: GEBUEHRENTRANSPARENZ-TABELLE

### Inhalt

**Transition Hook (vom Produkt-Karussell):**

```
Jetzt reden wir ueber Geld.
```

**H2:**

```
Was es kostet. Alles.
```

**Intro zur Schmerzquantifizierung:**

```
Der Durchschnittsdeutsche zahlt Hunderte Euro im Jahr an Bankgebuehren, Ueberweisungskosten und versteckten Aufschlaegen. So sieht es bei uns aus.
```

#### Gebuehrentabelle

| Aktion | diBoaS | Uebliche Apps | Unterschied | Beispiel |
|--------|--------|---------------|-------------|---------|
| Konto | Fuer immer kostenlos | 5 bis 15 EUR/Monat | Spare 60 bis 180 EUR/Jahr | Dein Konto: 0 EUR. Immer. |
| Geld einzahlen | 0,48% | 0 bis 1,5% | Guenstiger als die meisten Apps fuer Einzahlungen berechnen | 100 EUR einzahlen: kostet dich 48 Cent |
| Geld senden | KOSTENLOS* | 1,50 bis 50 EUR | Spare 5 bis 50 EUR pro Ueberweisung | 50 EUR an Mama senden: 0 EUR |
| Kaufen / Investieren | KOSTENLOS | 1,5 bis 2,5% (Broker) | Spare 1,50 bis 2,50 EUR pro 100 EUR | 100 EUR investieren: kostet 0 EUR |
| Verkaufen / Schliessen | 0,39% | 1,5 bis 2,5% (Broker) | Spare 1,11 bis 2,11 EUR pro 100 EUR | 100 EUR verkaufen: kostet dich 39 Cent |
| Tauschen | KOSTENLOS* | 0,5 bis 2% Spread | Spare 0,50 bis 2 EUR pro 100 EUR | 100 EUR tauschen: 0 EUR |
| Wachsen (Strategien) | Kostenlos starten, 0,39% beim Ausstieg | N/A | Wachstumsoptionen, die deine Bank nicht bietet | Starte mit 100 EUR: kostenlos. Aussteigen mit 100 EUR: kostet 39 Cent |
| Auszahlen | 0,48% | 1 bis 3% plus Verzoegerungen | Spare bis zu 2,52 EUR pro 100 EUR | 100 EUR auszahlen: kostet dich 48 Cent |

**Fussnote (unter der Tabelle, kleiner Text):**

```
*diBoaS-Gebuehr angegeben. Netzwerkgebuehren Dritter koennen anfallen (in der Regel weniger als 0,01 EUR).
```

**Zusammenfassendes Beispiel:**

```
Eine Investition von 100 EUR kostet 0 EUR bei diBoaS. Der Verkauf kostet 39 Cent.
```

**Abschlusszeile:**

```
Jede Gebuehr. Auf dem Tisch. Sonst nichts.
```

---

## SEKTION 6: WO IST DER HAKEN?

### Inhalt

**H2:**

```
Wo ist der Haken?
```

**Body:**

```
Berechtigte Frage. Hier ist die ehrliche Antwort:

Investieren ist kostenlos. Wenn du verkaufst, berechnen wir 0,39%. Wenn du 100 EUR verkaufst, verdienen wir 39 Cent. Wir verdienen nur mehr, wenn dein Geld waechst. Unsere Anreize sind auf deine abgestimmt.

Keine monatlichen Gebuehren. Keine ueberraschenden Kosten. Keine Strafgebuehren bei Auszahlung.

Wie geht das? Neue Technologie hat die Filialen, die Manager und die alten Kostenstrukturen ueberfluessig gemacht. Wir geben diese Ersparnis an dich weiter.

Gibt es Risiken? Ja. Dein Geld liegt nicht bei einer Bank. Es arbeitet mit neuer Technologie. Das bedeutet, es kann staerker wachsen, aber es gibt auch echtes Risiko. Wir ueberwachen rund um die Uhr und testen jede Strategie gegen vergangene Krisen (COVID, FTX, Terra), aber wir koennen keine Rendite garantieren, und wer das behauptet, luegt.

Wir gewinnen, wenn du gewinnst. Wir zeigen dir beide Seiten, die Chancen UND die Risiken, immer.
```

---

## SEKTION 6.5: SO FUNKTIONIERT ES UNTER DER HAUBE

### Inhalt

**Toggle-Label (immer sichtbar):**

```
Willst du die technischen Details?
```

**Aufgeklappter Inhalt:**

```
Architektur: diBoaS basiert auf quelloffener Finanzinfrastruktur. Deine Wallet ist so gesichert, dass niemand, einschliesslich diBoaS, auf deine Mittel zugreifen kann. Nur du kannst Transaktionen autorisieren.

Deine Wallet: Jeder Nutzer erhaelt seine eigene persoenliche Wallet mit eigenem privaten Schluessel. diBoaS sieht, speichert oder hat niemals Zugriff auf deinen Schluessel. Wenn diBoaS morgen verschwinden wuerde, waere dein Geld immer noch deins.

Sicherheit: Jede Strategie wird gegen historische Marktkrisen getestet, bevor sie Nutzern angeboten wird. Wir ueberwachen alle Positionen rund um die Uhr. Die Transaktionssignierung erfolgt in Millisekunden.

Transparenz: Alle Gebuehren werden im Voraus offengelegt. Alle Risiken werden klar benannt. Keine versteckten Mechanismen.
```

**Link (am Ende des aufgeklappten Inhalts):**

```
Vollstaendige technische Dokumentation ansehen
```

Link: /strategies

---

## SEKTION 7: INTERAKTIVE DEMO

### Inhalt

**Transition Hook (von Unter der Haube):**

```
Glaub uns nicht einfach.
```

**H2:**

```
Was wuerden deine 100 EUR hier machen?
```

**Sub:**

```
Keine Anmeldung. Kein echtes Geld. Nur der Beweis.
```

**CTA 1 (Primaerer Button):**

```
Probier es mit 100 EUR (Uebungsgeld)
```

**CTA 2 (Sekundaerer/kleinerer Button):**

```
Kleiner anfangen? Sieh, was aus 5 EUR werden kann.
```

---

## SEKTION 8: SOCIAL PROOF

### Inhalt

**H2:**

```
Die ersten 1.200.
```

**Zaehler (dynamisch, Echtzeit):**

```
[X] Gruendungsmitglieder. [Y] Laender. [Z] Plaetze uebrig.
```

**Sub:**

```
Wir fangen klein an, damit wir uns um jede Person kuemmern koennen, die beitritt.
```

**CTA Button:**

```
Fruehen Zugang sichern
```

---

## SEKTION 8.5: UEBER DEN GRUENDER

### Inhalt

**Foto:** Bild aus `apps/web/public/assets/images/` verwenden (Bars Foto).

**Text:**

```
Gebaut von Bar.

Ich bin aufgewachsen und habe zugesehen, wie meine Grossmutter Adelaide ein Finanzsystem navigierte, das nicht fuer sie gemacht war. Sie verdiente bessere Werkzeuge. Alle, die so sind wie sie, verdienen das auch.

diBoaS wird in Berlin, Deutschland gegruendet, gebaut fuer Menschen in den USA, der EU und Brasilien. Ich habe ueber 20 Jahre in Produktmanagement und IT in Brasilien, den USA, Japan und Deutschland gearbeitet. Jetzt baue ich das Finanzwerkzeug, das ich mir fuer meine Grossmutter gewuenscht haette.

Fragen? Ich lese jede E-Mail. bar@diboas.com
```

---

## SEKTION 9: WARTELISTE

### Version A: Bevor 1.200 erreicht sind

**H2:**

```
Sei einer der ersten 1.200.
```

**Sub:**

```
Wir fangen klein an, damit wir uns um jede Person kuemmern koennen, die beitritt.
```

**Vorteile-Liste:**

```
Permanentes Gruendungsmitglied-Abzeichen (#47 von 1.200)
Dein Name auf der Gruenderwand
5 persoenliche Einladungen
Zukuenftige exklusive Vorteile nur fuer Gruendungsmitglieder
```

**Zaehler:**

```
[Z] Plaetze uebrig
```

**E-Mail-Eingabefeld** (Platzhalter: "Deine E-Mail-Adresse")

**CTA Button:**

```
Fruehen Zugang sichern
```

**Unter dem CTA (kleiner Text):**

```
Kein Spam. Nur deine Einladung, wenn wir bereit sind.
```

**Datenschutz-Checkbox:**

```
Ich stimme der Datenschutzerklaerung zu
```

(Link "Datenschutzerklaerung" auf /legal/privacy)

### Version B: Nachdem 1.200 erreicht sind

**H2:**

```
Die Gruendungsplaetze sind voll.
```

**Sub:**

```
Hast du einen Einladungscode? Du bist als Fruehes Mitglied dabei, mit eigenem Abzeichen und 5 Einladungen.
Kein Code? Tritt der Prioritaetsliste bei. Wir oeffnen bald mehr Plaetze.
```

#### Pfad 1: Einladungscode-Eingabe

**Code-Eingabefeld** (Platzhalter: "Gib deinen Einladungscode ein")

**CTA Button:**

```
Mit meiner Einladung beitreten
```

#### Pfad 2: Prioritaets-Warteliste

**E-Mail-Eingabefeld** (Platzhalter: "Deine E-Mail-Adresse")

**CTA Button:**

```
Der Prioritaetsliste beitreten
```

**Unter dem CTA (kleiner Text):**

```
Kein Spam. Nur deine Einladung, wenn wir bereit sind.
```

---

## SEKTION 10: FAQ

### Inhalt

**H2:**

```
Bevor du dich entscheidest.
```

#### FAQ 1: Ist diBoaS eine Bank?

**Frage:**

```
Ist diBoaS eine Bank?
```

**Antwort:**

```
Nein. diBoaS ist eine Plattform, die dir hilft, dich mit finanziellen Moeglichkeiten zu verbinden. Wir verwalten dein Geld nicht und treffen keine Entscheidungen ueber deine Mittel. Deine Wallet ist so gesichert, dass nur DU Transaktionen autorisieren kannst. Wir liefern die Werkzeuge, du triffst die Entscheidungen.
```

#### FAQ 2: Ist diBoaS fuer jeden?

**Frage:**

```
Ist diBoaS fuer jeden?
```

**Antwort:**

```
Nein. Wenn du willst, dass jemand anderes finanzielle Entscheidungen fuer dich trifft, sind wir nicht die Richtigen. Wenn du eine traditionelle Bank mit Filialen und Papierauszuegen willst, auch nicht.

diBoaS ist fuer Menschen, die Kontrolle ueber ihr eigenes Geld wollen, Transparenz bei den Kosten und Zugang zu Moeglichkeiten, die frueher 10.000 EUR Mindestanlage erforderten. Du musst nicht alles jetzt verstehen, dafuer sind wir da. Du musst nur bereit sein zu lernen.
```

#### FAQ 3: Kann ich mein Geld jederzeit abheben?

**Frage:**

```
Kann ich mein Geld jederzeit abheben?
```

**Antwort:**

```
Ja. Dein Geld gehoert dir. Hebe auf dein Bankkonto ab, wann immer du willst. Die Gebuehr betraegt 0,48%, also kostet eine Auszahlung von 100 EUR dich 48 Cent. Es gibt keine Sperrfristen und keine Strafgebuehren. Wir verarbeiten deine Auszahlung sofort. Bankueberweisungszeiten koennen variieren.
```

#### FAQ 4: Ist mein Geld sicher?

**Frage:**

```
Ist mein Geld sicher?
```

**Antwort:**

```
Dein Geld wird von dir gesichert. Nur du hast die Schluessel. Niemand sonst kann ohne deine Erlaubnis auf deine Mittel zugreifen.

Das gesagt, das ist kein Bankkonto. Kryptoassets sind nicht durch Einlagensicherungssysteme gedeckt. Der Wert deiner Anlagen kann schwanken, und du koenntest einen Teil oder deine gesamte Investition verlieren.

Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

#### FAQ 5: Wie ist das ohne hohe Gebuehren moeglich?

**Frage:**

```
Wie ist das ohne hohe Gebuehren moeglich?
```

**Antwort:**

```
Indem wir die Mittelmaenner eliminieren, die Filialen, die Manager, die alten Kostenstrukturen. Neue Technologie erledigt die gleiche Arbeit fuer einen Bruchteil des Preises. Wir geben diese Ersparnis an dich weiter. Das ist das gesamte Modell.
```

#### FAQ 6: Was ist der Mindestbetrag zum Anfangen?

**Frage:**

```
Was ist der Mindestbetrag zum Anfangen?
```

**Antwort:**

```
5 EUR. Der Preis eines Kaffees. Die meisten Investmentplattformen verlangen 500 bis 10.000 EUR, nur um die Tuer zu oeffnen. Wir finden, das ist Teil des Problems.
```

#### FAQ 7: Kann ich diBoaS nur fuer Ueberweisungen nutzen?

**Frage:**

```
Kann ich diBoaS nur fuer Ueberweisungen nutzen?
```

**Antwort:**

```
Ja. Absolut. Du kannst diBoaS nur zum Senden und Empfangen von Geld nutzen, kostenlos, sofort, weltweit. Die Investitions- und Wachstumsfunktionen sind da, wenn und falls du sie jemals nutzen moechtest. Kein Druck. Kein Paketverkauf.
```

#### FAQ 8: Was, wenn ich nichts von Investitionen verstehe?

**Frage:**

```
Was, wenn ich nichts von Investitionen verstehe?
```

**Antwort:**

```
Genau dafuer haben wir es gebaut. Unser Ziel ist es, es so einfach zu machen, dass es jeder kann. Kein Fachjargon. Keine komplizierten Entscheidungen. Nur klare Optionen und transparente Informationen. Fang mit 5 EUR an. Entdecke. Lerne. Wir sind bei jedem Schritt dabei.
```

#### FAQ 9: Was, wenn etwas schiefgeht?

**Frage:**

```
Was, wenn etwas schiefgeht?
```

**Antwort:**

```
Die Technologie, die wir nutzen, birgt echtes Risiko. Renditen koennen steigen oder fallen. Die Systeme sind nicht perfekt, kein System ist das. Wir ueberwachen rund um die Uhr und testen jede Strategie gegen vergangene Krisen (COVID, FTX, Terra), bevor wir sie anbieten. Wir werden dir immer sagen, was passiert. Aber wir koennen nicht jedes Risiko eliminieren, und wer das behauptet, luegt.
```

#### FAQ 10: Was passiert mit meinem Geld, wenn diBoaS schliesst?

**Frage:**

```
Was passiert mit meinem Geld, wenn diBoaS schliesst?
```

**Antwort:**

```
Dein Geld ist in DEINER Wallet. Nicht in unserer. Wenn diBoaS morgen verschwinden wuerde, haettest du immer noch deine Mittel, zugaenglich ueber deine Wallet-Schluessel. Wir halten dein Geld nie. Wir koennen es nie. Das ist keine Funktion, die wir hinzugefuegt haben. So wurde das gesamte System gebaut.
```

#### FAQ 11: Wurde diBoaS auditiert?

**Frage:**

```
Wurde diBoaS auditiert?
```

**Antwort:**

```
Wir sind eine Plattform vor dem Launch. Unsere Strategien werden gegen historische Krisen und reale Szenarien getestet, und wir nutzen auditierte, etablierte Protokolle. Wenn wir wachsen, planen wir unabhaengige Drittanbieter-Audits. Fuer vollstaendige Details zu den Protokollen und der Technologie hinter jeder Strategie besuche unsere Strategien- und Protokoll-Seiten.
```

Links: "Strategien" verlinkt auf /strategies, "Protokolle" verlinkt auf /protocols.

#### FAQ 12: Was passiert nach der Anmeldung?

**Frage:**

```
Was passiert nach der Anmeldung?
```

**Antwort:**

```
Du erhaeltst eine E-Mail mit deinem Gruendungsmitglied-Abzeichen und deiner Nummer, deinem persoenlichen Einladungslink (5 Einladungen zum Teilen) und Anweisungen zum Starten.

Von dort aus richtest du deine Wallet ein, zahlst Geld ein und bist dabei.
```

---

## SEKTION 11: FOOTER

### Pflichthinweise

#### MiCA Artikel 68: Risikowarnung

**Gilt fuer:** EN, DE, ES. NICHT fuer pt-BR.

**Text (vollstaendig, nicht aendern):**

```
Der Wert von Kryptowerten kann schwanken. Sie koennen Ihr gesamtes investiertes Geld oder einen Teil davon verlieren. Kryptowerte sind nicht durch Einlagensicherungssysteme gedeckt.
```

#### MiCA Artikel 7: Hinweis zur Marketingmitteilung

**Gilt fuer:** EN, DE, ES. NICHT fuer pt-BR.

**Text (vollstaendig, nicht aendern):**

```
Diese Marketingmitteilung fuer Kryptowerte wurde von keiner zustaendigen Behoerde eines Mitgliedstaats der Europaeischen Union ueberprueft oder genehmigt. Der Anbieter der Kryptowerte ist allein fuer den Inhalt dieser Marketingmitteilung fuer Kryptowerte verantwortlich.
```

#### KI-Offenlegung

**Gilt fuer:** ALLE Sprachen.

**Text (vollstaendig, nicht aendern):**

```
Bestimmte Inhalte auf dieser Plattform, einschliesslich Marktanalysen und Bildungsmaterialien, werden durch kuenstliche Intelligenz generiert oder unterstuetzt. KI-generierte Inhalte koennen Fehler oder Einschraenkungen enthalten. Nutzer sollten Informationen unabhaengig ueberpruefen, bevor sie finanzielle Entscheidungen treffen.
```

### Zusaetzliche Footer-Elemente

- Nicht-verwahrender / Nutzerautonomie-Hinweis (eine kurze Zeile)
- Offenlegung fiktiver Testimonials: "Die Erfahrungsberichte auf dieser Seite sind illustrative Beispiele und stellen keine echten Nutzer dar."
- Social Links: Instagram, X, YouTube, LinkedIn
- Navigationslinks: Ueber uns, Rechtliches, Datenschutzerklaerung, Nutzungsbedingungen, Cookie-Richtlinie, Hilfe, Sicherheit
- Copyright: (c) 2026 diBoaS. Alle Rechte vorbehalten.

### Implementierungshinweise fuer DE

- MiCA Artikel 68 + Artikel 7 AUF DEUTSCH einbinden (obige Texte).
- Doppelten MiCA-Absatz entfernen, falls vorhanden.
- Sicherstellen, dass beide Artikel vorhanden sind.

---

## TRANSITION HOOKS: VOLLSTAENDIGE KARTE

| Nach Sektion | Hook-Text | Fuehrt Zu |
|--------------|-----------|-----------|
| 1. Hero | Deshalb baue ich das hier. | Entstehungsgeschichte |
| 2. Entstehungsgeschichte | Ich habe es fuer dich gebaut. | Persona-Karussell |
| 2.5. Persona-Karussell | Und so sieht das in der Praxis aus. | Szenarien |
| 3. Szenarien | So funktioniert es. | Produkt-Karussell |
| 4. Produkt-Karussell | Jetzt reden wir ueber Geld. | Gebuehrentabelle |
| 5. Gebuehrentabelle | (natuerlicher Fluss) | Wo ist der Haken |
| 6. Wo ist der Haken | (natuerlicher Fluss) | Unter der Haube |
| 6.5. Unter der Haube | Glaub uns nicht einfach. | Demo |
| 7. Demo | (natuerlicher Fluss) | Social Proof |
| 8. Social Proof | (natuerlicher Fluss) | Ueber den Gruender |
| 8.5. Ueber den Gruender | (natuerlicher Fluss) | Warteliste |
| 9. Warteliste | (natuerlicher Fluss) | FAQ |
| 10. FAQ | (natuerlicher Fluss) | Footer |

---

## MARKENREGELN (DE)

### Adelaide-Filter

Jedes Wort auf dieser Seite muss den Grossmutter-Test bestehen: Wuerde Bars Grossmutter Adelaide es verstehen? Wenn nicht, umschreiben.

### Verbotene Woerter auf der Hauptseite

- Blockchain
- DeFi
- Protokoll(e) (ausser Sektion 6.5)
- Stablecoin(s)
- Pegged / Gekoppelt
- On-Ramp / Off-Ramp
- Smart Contract(s) / Intelligenter Vertrag
- Yield (stattdessen "Rendite" oder "Wachstum" verwenden)
- Non-Custodial / Nicht-verwahrend (stattdessen "du hast die Schluessel" oder "du kontrollierst deine Mittel" verwenden)

### Markenversprechen

```
Wir zeigen dir beide Seiten, die Chancen und die Risiken, immer.
```

Maximal 2 Vorkommen auf der Seite:
1. Sektion 6: Wo ist der Haken (letzte Zeile)
2. FAQ 4: Ist mein Geld sicher? (letzte Zeile)

### Stimmregeln (DE)

- Informelle Anrede (du). Der Leser ist immer das Subjekt.
- Warm aber direkt. Nie foermlich-unternehmensmaessig, nie verkaeuferhaft.
- Ehrlich ueber Einschraenkungen. Risikooffenlegung ist ein Markenmerkmal.
- Einfache Saetze.
- Null Emojis im Fliesstext.
- Deutsche Fintechs wie N26 und Trade Republic verwenden "du". Wir folgen diesem Standard.

---

## HINWEISE ZUR KULTURELLEN ANPASSUNG

| Aspekt | EN | DE | Grund |
|--------|-----|-----|-------|
| Waehrung | $ (USD) | EUR | Europaeischer Markt |
| Minimum | $5 | 5 EUR | Lokale Aequivalenz |
| Kaffee | "$5 coffee" | "5 EUR Kaffee" | Kulturelle Referenz |
| Ueberweisungen | Allgemeiner Schmerz | Schmerz: Nicht-SEPA + Familie im Ausland | Deutschland hat grosse tuerkische, suedeuropaeische Diaspora |
| Kontofuehrung | $25/month | 15 EUR/Monat | Deutsche Bankrealitaet (Kontofuehrungsgebuehren) |
| Mindestinvestition | $10,000 | 10.000 EUR | Europaeische Realitaet |
| Sparkonto | "savings account" | "Sparkonto / Tagesgeld" | Deutsche kennen beide Begriffe, Tagesgeld-Zinsen sind historisch niedrig |
| Zahlenformat | 1,000.00 | 1.000,00 | Europaeischer Standard |
| Anrede | "you" | "du" | Informell wie N26/Trade Republic, passt zur warmen Markenstimme |
| Sicherheit | General | Besonders wichtig | Deutsche legen grossen Wert auf Sicherheit und Datenschutz |

### Besondere kulturelle Hinweise fuer DE

- Deutsche sind traditionell konservativere Anleger (Sparbuch-Mentalitaet). Die ehrliche Risikooffenlegung wird hier besonders gut ankommen.
- Kontofuehrungsgebuehren (account maintenance fees) sind ein starker Schmerzpunkt. Sparkassen und traditionelle Banken erheben 5 bis 15 EUR/Monat.
- Das Thema Datenschutz und Sicherheit hat in Deutschland ein besonderes Gewicht. Sektion 6.5 (Unter der Haube) wird von deutschen Nutzern haeufiger geoeffnet werden als in anderen Maerkten.
- Die Gebuehrentabelle spricht Deutsche besonders an, weil sie Transparenz und Vergleichbarkeit schaetzen.

**Ende des Dokuments DE.**
