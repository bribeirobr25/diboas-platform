# diBoaS Protokollseite — Finaler Copy (DE)

## Dokumentstatus

| Feld | Wert |
|------|------|
| Version | v1.3 — Copywriter-Fixes angewendet |
| Sprache | Deutsch (DE) |
| Datum | 28. Februar 2026 |
| Basis | PROTOCOLS_PAGE_FINAL_EN.md v1.3 |
| Kulturelle Anpassung | Vollstaendig (keine woertliche Uebersetzung) |
| CLO Review | Alle P0/P1-Fixes aus EN uebernommen. MiCA Art. 68 + Art. 7 auf Deutsch. |
| Copywriter Review | Alle 6 Fixes + 4 Polish aus EN uebernommen. |
| Ausstehend | CEO-Bestaetigung zu Balancer (CLO-Position: vertretbar). |

## Implementierungshinweise fuer CTO / Claude Code

Dieses Dokument enthaelt den vollstaendigen deutschen Copy der Protokollseite. KULTURELLE ANPASSUNG fuer den deutschsprachigen Markt, keine woertliche Uebersetzung.

### Kritische Unterschiede zum EN

| Punkt | EN | DE | Grund |
|-------|-----|-----|-------|
| Waehrung | $1,000 | 1.000 EUR | Europaeischer Markt |
| Minimum | $5 | 5 EUR | EU-Mindestwert |
| Dezimaltrennzeichen | 0.39% (Punkt) | 0,39% (Komma) | Europaeisches Format |
| Tausendertrennzeichen | 1,000 (Komma) | 1.000 (Punkt) | Europaeisches Format |
| Regulierung | MiCA auf Englisch | MiCA auf Deutsch (Art. 68 + Art. 7) | EU-Jurisdiktion |
| Anrede | "you" | "du" (informell) | Moderne Fintech-Anrede (N26, Trade Republic) |
| Ton | Warm, direct | Klar, direkt, gruendlich, trotzdem nahbar | Deutsche Fintech-Kultur |
| Bankreferenz | "bank savings" | "Tagesgeld" / "Festgeld" | Deutsche Sparprodukte |
| Regulatorische Texte | "you" | "Sie" (formell) fuer MiCA-Hinweise | Pflichthinweise erfordern formelle Anrede |

### Globale Regeln

- KEIN Gedankenstrich. Kommas, Punkte, Doppelpunkte oder Zeilenumbrueche verwenden.
- KEINE Emojis im Fliesstext.
- Alle CTAs sind Buttons, sofern nicht anders angegeben.
- Adelaide-Filter ist GELOCKERT fuer diese Seite. Fachbegriffe (DeFi, Protokoll, TVL, Staking, Stablecoin) sind erlaubt und notwendig. Beschreibungen sollen trotzdem Klarheit vor Fachjargon priorisieren.
- Protokollbeschreibungen sollen beantworten: "Was bedeutet das fuer mein Geld?"

### Sektionsablauf

| # | Sektion | Typ |
|---|---------|-----|
| 1 | Hero | Statisch |
| 2 | Warum es diese Seite gibt | Statisch (3 Absaetze + Hinweisbox) |
| 3 | Protokollraster | Kartengrid nach Kategorie (7 Kategorien, 26 Protokolle) |
| 4 | Wie wir auswaehlen | Kriterien mit Erklaerung |
| 5 | Gesamtes TVL | Statistik-Highlight |
| 6 | Was diese Seite nicht ist | Risiko-/Einschraenkungsrahmen |
| 7 | FAQ | Akkordeon (8 Eintraege) |
| 8 | Warteliste / CTA | E-Mail-Erfassung |
| 9 | Footer | Rechtliche Hinweise + Datenquellen |

---

## SEKTION 1: HERO

**H1:**

```
Wo dein Geld arbeitet
```

**Untertitel:**

```
Jedes System. Jeder Name. Nichts versteckt.
```

**Vertrauenszeile (kleinerer Text):**

```
26 Protokolle. 7 Kategorien. Volle Transparenz ueber jedes System, das dein Geld beruehrt.
```

### Hinweise

- Klar, selbstbewusst. Kein "Vertrauen"-Vokabular im Untertitel.
- "Nichts versteckt" spiegelt das Transparenzversprechen der B2C-Seite wider.

---

**Ueberleitung:**

```
Warum wir diese Seite gebaut haben.
```

---

## SEKTION 2: WARUM ES DIESE SEITE GIBT

**H2:**

```
Warum es diese Seite gibt
```

**Text:**

```
Frag deine Bank, wohin dein Erspartes fliesst. Sie werden es dir nicht sagen.

Wir schon. Jedes System auf dieser Seite ist eines, das dein Geld beruehren kann, wenn du eine diBoaS-Strategie nutzt. Wir veroeffentlichen die Namen, die Erfolgsbilanz, die Sicherheitspruefungen und die Dinge, die schiefgelaufen sind. Weil du es wissen solltest.

Jedes Protokoll auf dieser Seite hat seinen Platz verdient. Wir haben geprueft, wie lange es laeuft, wer den Code auditiert hat, wie es mit Problemen umgegangen ist und ob echte Menschen ihm echtes Geld anvertrauen. Was nicht bestanden hat, steht nicht hier.

Wir listen hier 26 Protokolle. Unsere Strategien nutzen aktuell 6 davon. Die uebrigen sind Protokolle, die wir recherchiert und freigegeben haben. Sie koennen in zukuenftige Strategien aufgenommen werden, wenn wir expandieren.
```

**Hinweisbox (bernsteinfarbener Hintergrund, linker Rand):**

```
Wichtig: Auf dieser Seite gelistet zu sein bedeutet nicht null Risiko. Es bedeutet, dass wir unsere Hausaufgaben gemacht haben und ehrlich darueber sind, was wir gefunden haben. Jedes System auf dieser Seite traegt technisches Risiko, Marktrisiko und die Moeglichkeit von Verlusten.
```

### Hinweise

- Erster Satz ("Frag deine Bank...") ist der Aufhänger. Kurz, direkt, erzeugt Kontrast.
- Deutsche Nutzer schaetzen Gruendlichkeit. Die Hinweisbox ist bewusst ausfuehrlich.

---

## SEKTION 3: PROTOKOLLRASTER

**H2:**

```
Die 26 Protokolle
```

**Unterueberschrift:**

```
Sortiert nach Funktion. Klicke auf eine Karte fuer Details.
```

**TVL-Aktualitaetshinweis (Micro-Text unter Unterueberschrift):**

```
Alle TVL-Zahlen sind Naehrungswerte, stammen von DeFiLlama und sind aktuell per Februar 2026. Die Werte schwanken taeglich.
```

---

### Kategorie 1: Kreditvergabe

**Titel:** Kreditprotokolle

**Beschreibung:**

```
Du legst Vermoegenswerte an. Kreditnehmer zahlen Zinsen, um sie zu nutzen. Du verdienst die Zinsen.
```

---

#### Protokollkarte: Aave V3

**Name:** Aave V3

**Beschreibung:**

```
Das groesste Kreditsystem im dezentralen Finanzwesen. Du legst Vermoegenswerte an, verdienst Zinsen von Kreditnehmern und kannst jederzeit abheben. Genutzt von Institutionen und Privatpersonen auf 18 Blockchains.
```

**Details:**

| Gegruendet | 2017 (V3: 2022) |
| Total Value Locked | ~35 Milliarden USD |
| Blockchains | Ethereum, Arbitrum, Polygon, + 15 weitere |
| Sicherheitspruefungen | 30+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | SEC hat ihre 4-jaehrige Untersuchung ohne Auflagen eingestellt (Dezember 2025). Quelle: SEC-Einstellungsschreiben, bestaetigt durch Aave-Gruender; berichtet von Yahoo Finance, CoinDesk, Unchained. |

**Links:** Website: aave.com | X: @AaveAave

**Verwendet in diBoaS-Strategien:** Sicherer Hafen, Torhueter, Geduldiger Aufbauer, Stetiger Vermehrer, Rendite-Maximierer

---

#### Protokollkarte: Compound V3

**Name:** Compound V3

**Beschreibung:**

```
Eines der aeltesten Kreditsysteme in DeFi. Du verdienst Zinsen, indem du Vermoegenswerte bereitstellst, die andere leihen. Einfach, kampferprobt und seit 2018 in Betrieb.
```

**Details:**

| Gegruendet | 2018 (V3: 2022) |
| Total Value Locked | ~2 Milliarden USD |
| Blockchains | Ethereum, Arbitrum, Base, Polygon |
| Sicherheitspruefungen | 4+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Vollstaendig dezentralisiert. Keine spezifischen Lizenzen erforderlich. |

**Links:** Website: compound.finance | X: @compoundfinance

**Verwendet in diBoaS-Strategien:** Sicherer Hafen, Torhueter, Geduldiger Aufbauer, Stetiger Vermehrer, Rendite-Maximierer

---

#### Protokollkarte: Kamino

**Name:** Kamino

**Beschreibung:**

```
Solanas All-in-One-Plattform fuer Kreditvergabe und Liquiditaet. Kombiniert Kreditvergabe, automatisiertes Liquiditaetsmanagement und Hebel in einem System. Du verdienst Zinsen, indem du Vermoegenswerte an Kreditnehmer verleihst, aehnlich wie bei Aave und Compound.
```

**Details:**

| Gegruendet | 2022 |
| Total Value Locked | ~2,5 Milliarden USD |
| Blockchains | Solana |
| Sicherheitspruefungen | Mehrere Audits von OtterSec |
| Regulatorisch / Erfolgsbilanz | Dezentrales Protokoll. Keine groesseren Vorfaelle. |

**Links:** Website: kamino.finance | X: @KaminoFinance

---

#### Protokollkarte: Morpho

**Name:** Morpho

**Beschreibung:**

```
Vermittelt Kreditgeber direkt mit Kreditnehmern fuer bessere Konditionen als herkoemmliche Kreditpools. Coinbase hat Morpho auf Base fuer Bitcoin-besicherte USDC-Kredite integriert (Januar 2025) und bis Ende 2025 ueber 1,2 Milliarden USD an Krediten vergeben.
```

**Details:**

| Gegruendet | 2022 |
| Total Value Locked | ~7 Milliarden USD |
| Blockchains | Ethereum, Base, Arbitrum |
| Sicherheitspruefungen | 23+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Integriert von Coinbase (Jan. 2025) und Crypto.com (Okt. 2025) fuer DeFi-gestuetzte Kreditvergabe. Quelle: Coinbase-Blog, morpho.org/stories/coinbase, DL News. |

**Links:** Website: morpho.org | X: @MorphoLabs

---

#### Protokollkarte: Spark Protocol

**Name:** Spark Protocol

**Beschreibung:**

```
Kreditsystem auf Basis des bewehrten Aave-Codes, verbunden mit der tiefen Liquiditaet von Sky/MakerDAO. Profitiert von der laengsten Betriebsgeschichte in DeFi (seit 2014).
```

**Details:**

| Gegruendet | 2023 |
| Total Value Locked | ~4 Milliarden USD |
| Blockchains | Ethereum, Base, Arbitrum |
| Sicherheitspruefungen | 7+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Profitiert von MakerDAOs 10+ Jahren Compliance-Erfahrung |

**Links:** Website: spark.fi | X: @sparkdotfi

---

#### Protokollkarte: Fluid

**Name:** Fluid

**Beschreibung:**

```
Kreditvergabe der naechsten Generation, die Funktionen mehrerer etablierter Systeme kombiniert. Sehr niedrige Liquidationsstrafen fuer Kreditnehmer. Du verdienst Zinsen von Kreditnehmern, aehnlich wie bei anderen Kreditprotokollen.
```

**Details:**

| Gegruendet | 2024 |
| Total Value Locked | ~2 Milliarden USD |
| Blockchains | Ethereum, Arbitrum, Base |
| Sicherheitspruefungen | 3+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Entwickelt vom Instadapp-Team (6+ Jahre Erfahrung im Aufbau von DeFi-Infrastruktur) |

**Ausnahmehinweis (Micro-Text unter der Karte):**

```
Ausnahme zu unserem 1-Jahres-Minimum: Fluid wurde 2024 gestartet, ist aber vom Instadapp-Team entwickelt, das 6+ Jahre Erfahrung im Aufbau von DeFi-Infrastruktur hat.
```

**Links:** Website: fluid.io | X: @0xFluid

---

### Kategorie 2: Staking

**Titel:** Staking-Protokolle

**Beschreibung:**

```
Du hilfst, ein Blockchain-Netzwerk zu sichern. Das Netzwerk zahlt dir dafuer Belohnungen.
```

---

#### Protokollkarte: Lido Finance

**Name:** Lido Finance

**Beschreibung:**

```
Stake dein ETH und erhalte einen Token (stETH), den du anderswo nutzen kannst, waehrend du weiterhin Staking-Belohnungen verdienst. Der groesste Staking-Dienst in der Kryptowelt.
```

**Details:**

| Gegruendet | 2020 |
| Total Value Locked | ~27 Milliarden USD |
| Blockchains | Ethereum, Polygon |
| Sicherheitspruefungen | 20+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | SEC Division of Corporation Finance Stellungnahme (5. August 2025): Liquid-Staking-Empfangstoken einschliesslich stETH sind keine Wertpapiere im Sinne des Securities Act von 1933 oder des Exchange Act von 1934. Teil der "Project Crypto"-Initiative von SEC-Chairman Atkins. Quelle: SEC.gov Stellungnahme; berichtet von CoinDesk, Decrypt, CCN. |

**Links:** Website: lido.fi | X: @LidoFinance

---

#### Protokollkarte: Rocket Pool

**Name:** Rocket Pool

**Beschreibung:**

```
Dezentrales Ethereum-Staking. Du kannst bereits ab 0,01 ETH staken. Kein zentraler Betreiber kontrolliert das Netzwerk.
```

**Details:**

| Gegruendet | 2016 (Mainnet 2021) |
| Total Value Locked | ~2 Milliarden USD |
| Blockchains | Ethereum |
| Sicherheitspruefungen | 5+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | SEC Division of Corporation Finance Stellungnahme (5. August 2025): Liquid-Staking-Empfangstoken einschliesslich rETH sind keine Wertpapiere. Gleiche Stellungnahme wie fuer Lido stETH und Jito JitoSOL. Quelle: SEC.gov Stellungnahme. |

**Links:** Website: rocketpool.net | X: @Rocket_Pool

---

#### Protokollkarte: Jito

**Name:** Jito

**Beschreibung:**

```
Solana Liquid Staking, das sowohl Standard-Staking-Belohnungen als auch zusaetzliche MEV-Belohnungen (Handelsarbitrage) verdient. Wird in diBoaS-Wachstumsstrategien eingesetzt.
```

**Details:**

| Gegruendet | 2022 |
| Total Value Locked | ~2,8 Milliarden USD |
| Blockchains | Solana |
| Sicherheitspruefungen | Mehrere Audits von Certora, OtterSec |
| Regulatorisch / Erfolgsbilanz | SEC Division of Corporation Finance Stellungnahme (August 2025): Liquid-Staking-Empfangstoken einschliesslich JitoSOL sind keine Wertpapiere. Quelle: SEC.gov Stellungnahme; berichtet von CoinDesk, CCN, Blockchain Magazine. |

**Links:** Website: jito.network | X: @jikitonetwork

**Verwendet in diBoaS-Strategien:** Volle Kraft

---

#### Protokollkarte: Marinade Finance

**Name:** Marinade Finance

**Beschreibung:**

```
Solana-Staking verteilt auf 100+ Validatoren fuer bessere Dezentralisierung und Belohnungen. Eines der wenigen DeFi-Protokolle mit institutioneller Compliance-Zertifizierung.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~550 Millionen USD |
| Blockchains | Solana |
| Sicherheitspruefungen | 5+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | SOC 2 Typ I und II zertifiziert. Institutionelle Compliance. |

**Badge:** ✓ (gruener Erfolgsindikator)

**Links:** Website: marinade.finance | X: @MarinadeFinance

---

#### Protokollkarte: Sanctum (INF)

**Name:** Sanctum (INF)

**Beschreibung:**

```
Vereinheitlichte Liquiditaetsschicht fuer alle Solana-Staking-Token. Ermoeglicht sofortigen Tausch zwischen verschiedenen gestaketen Vermoegenswerten ohne Wartezeiten fuer Unstaking.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~1,7 Milliarden USD |
| Blockchains | Solana |
| Sicherheitspruefungen | Auditiert von Accretion |
| Regulatorisch / Erfolgsbilanz | Sitz in Singapur. Betreibt Staking fuer Binance und Bybit. |

**Links:** Website: sanctum.so | X: @sanctumso

**Verwendet in diBoaS-Strategien:** Stabiles Wachstum, Stetige Fortschritte, Ausgewogener Aufbauer, Vermoegensturbo, Volle Kraft

---

#### Protokollkarte: EigenLayer

**Name:** EigenLayer

**Beschreibung:**

```
Restaking: Nutze dein bereits gestaketes ETH, um weitere auf Ethereum aufgebaute Dienste zu unterstuetzen und zusaetzliche Belohnungen auf deine Basis-Staking-Rendite zu verdienen. Du verdienst Staking-Belohnungen plus Bonusbelohnungen von den Diensten, die du absicherst.
```

**Details:**

| Gegruendet | 2023 |
| Total Value Locked | ~12 Milliarden USD |
| Blockchains | Ethereum |
| Sicherheitspruefungen | Mehrere unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | 2 Mio. USD Bug-Bounty-Programm auf Immunefi |

**Links:** Website: eigenlayer.xyz | X: @eigenlayer

---

### Kategorie 3: Stablecoins und synthetische Vermoegenswerte

**Titel:** Stablecoins und synthetische Vermoegenswerte

**Beschreibung:**

```
Diese Systeme erzeugen digitale Vermoegenswerte, die einen stabilen Wert halten sollen, meist an den US-Dollar gebunden. Stablecoins koennen ihre Bindung verlieren.
```

---

#### Protokollkarte: Sky Protocol / SSR (ehemals MakerDAO)

**Name:** Sky Protocol / SSR (ehemals MakerDAO)

**Beschreibung:**

```
Das originale DeFi-System. In Betrieb seit 2014. Hinterlege Krypto als Sicherheit, generiere Stablecoins, verdiene den Sparkurs. Hat jeden groesseren Marktabsturz seit 2017 ueberstanden.
```

**Details:**

| Gegruendet | 2014 |
| Total Value Locked | ~6 Milliarden USD |
| Blockchains | Ethereum (diBoaS-Strategien nutzen das Arbitrum-Deployment) |
| Sicherheitspruefungen | 10+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | 10+ Jahre ununterbrochener Betrieb durch mehrere Marktzyklen |

**Links:** Website: sky.money | X: @SkyEcosystem

**Verwendet in diBoaS-Strategien:** Alle 10 Strategien (Sicherer Hafen, Stabiles Wachstum, Torhueter, Stetige Fortschritte, Geduldiger Aufbauer, Ausgewogener Aufbauer, Stetiger Vermehrer, Vermoegensturbo, Rendite-Maximierer, Volle Kraft)

---

#### Protokollkarte: Ethena

**Name:** Ethena

**Beschreibung:**

```
Erzeugt einen synthetischen Dollar (USDe) durch abgesicherte Positionen. Bietet hoehere Renditen als traditionelle Stablecoins, aber mit einem komplexeren Mechanismus und hoeherem Risikoprofil.
```

**Details:**

| Gegruendet | 2023 |
| Total Value Locked | ~6,5 Milliarden USD |
| Blockchains | Ethereum + 23 Chains |
| Sicherheitspruefungen | 7+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | BaFin hat den MiCA-Zulassungsantrag im Maerz 2025 abgelehnt und dabei "erhebliche Maengel" in der Organisationsstruktur und der Einhaltung der Reservevorschriften angefuehrt. BaFin ordnete den Stopp der USDe-Praegung/-Einloesung an und fror Reserven ein. Ethena GmbH stimmte der Abwicklung des Deutschland-Geschaefts zu (April 2025). Alle Aktivitaeten laufen nun ueber Ethena (BVI) Limited, eine Gesellschaft der Britischen Jungferninseln. BaFin aeusserte auch Bedenken, dass sUSDe ein nicht registriertes Wertpapier nach deutschem Recht darstellen koennte. Quellen: BaFin-Bescheid (21. Maerz 2025); Decrypt, The Block, CoinTelegraph, Ledger Insights. |

**Badge:** ⚠ (bernsteinfarbener Warnindikator)

**Links:** Website: ethena.fi | X: @ethena_labs

---

#### Protokollkarte: Ondo Finance

**Name:** Ondo Finance

**Beschreibung:**

```
Bringt traditionelle Finanzwerte auf die Blockchain. US-Staatsanleihen, Anleihen und Aktien als digitale Token. Hat SEC-registrierte Broker-Dealer- und Transfer-Agent-Lizenzen durch die Uebernahme von Oasis Pro erworben (abgeschlossen Oktober 2025).
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~1,7 Milliarden USD |
| Blockchains | Ethereum, Solana, Arbitrum |
| Sicherheitspruefungen | 4+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | SEC-registrierter Broker-Dealer, Alternatives Handelssystem (ATS) und Transfer-Agent-Lizenzen erworben ueber Oasis Pro (FINRA-Mitglied seit 2020). Uebernahme abgeschlossen Oktober 2025. 1,6 Mrd. USD+ an tokenisierten Vermoegenswerten unter Verwaltung. Quellen: Ondo Finance Blog, Blockworks, CoinDesk, FINRA BrokerCheck (Oasis Pro Markets LLC). |

**Badge:** ✓ (gruener Erfolgsindikator)

**Links:** Website: ondo.finance | X: @ondofinance

---

### Kategorie 4: Rendite- und Handelsprotokolle

**Titel:** Rendite- und Handelsprotokolle

**Beschreibung:**

```
Diese Systeme generieren Ertraege durch Handelsgebuehren, Renditeoptimierung oder strukturierte Produkte.
```

---

#### Protokollkarte: Pendle Finance

**Name:** Pendle Finance

**Beschreibung:**

```
Trennt Rendite vom Kapital, sodass du zukuenftige Ertraege handeln, festschreiben oder darauf spekulieren kannst. Du kannst einen festen Zinssatz sichern oder darauf wetten, dass die Zinsen steigen.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~4,5 Milliarden USD |
| Blockchains | Ethereum, Arbitrum, BNB Chain |
| Sicherheitspruefungen | 6+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | 250.000 USD Bug Bounty. Safe-Harbor-Vereinbarung vorhanden. |

**Links:** Website: pendle.finance | X: @pendle_fi

---

#### Protokollkarte: Yearn Finance

**Name:** Yearn Finance

**Beschreibung:**

```
Automatisiertes Yield Farming. Verschiebt dein Geld zwischen Systemen, um die beste verfuegbare Rendite zu erzielen. Ein Pionier, der seit 2020 laeuft.
```

**Details:**

| Gegruendet | 2020 |
| Total Value Locked | ~500 Millionen USD |
| Blockchains | Ethereum, Arbitrum, Fantom |
| Sicherheitspruefungen | 6+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Pionier der Renditeaggregation. 5+ Jahre ununterbrochener Betrieb. |

**Links:** Website: yearn.fi | X: @yearnfinance

---

#### Protokollkarte: Curve Finance

**Name:** Curve Finance

**Beschreibung:**

```
Spezialisierte Boerse fuer Stablecoins und aehnliche Vermoegenswerte. Konzipiert fuer minimale Preisauswirkungen beim Tausch zwischen Vermoegenswerten mit aehnlichem Wert.
```

**Details:**

| Gegruendet | 2020 |
| Total Value Locked | ~2,2 Milliarden USD |
| Blockchains | Ethereum + 20 Chains |
| Sicherheitspruefungen | 15+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Juli 2023: 70 Mio. USD Exploit. 73% der Mittel wiederhergestellt. Ursache war ein Compiler-Bug (Vyper), nicht Curves eigener Code. |

**Badge:** ⚠ (bernsteinfarbener Warnindikator)

**Links:** Website: curve.finance | X: @CurveFinance

---

#### Protokollkarte: Convex Finance

**Name:** Convex Finance

**Beschreibung:**

```
Erhoeht deine Curve-Belohnungen, ohne dass du Token jahrelang sperren musst. Vereinfacht die Teilnahme an Curve.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~1,5 Milliarden USD |
| Blockchains | Ethereum, Arbitrum |
| Sicherheitspruefungen | 7 unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Keine Exploits in 4 Jahren. Eine kritische Schwachstelle wurde 2022 gefunden und behoben, bevor Gelder verloren gingen. |

**Links:** Website: convexfinance.com | X: @ConvexFinance

---

### Kategorie 5: Perpetual- und Handelsboersen

**Titel:** Perpetual- und Handelsboersen

**Beschreibung:**

```
Haendler nutzen diese Systeme, um auf Preisbewegungen zu wetten. Du verdienst Ertraege, indem du die Liquiditaet bereitstellst, gegen die sie handeln.
```

---

#### Protokollkarte: GMX V2

**Name:** GMX V2

**Beschreibung:**

```
Dezentrale Perpetual-Boerse. Du stellst Liquiditaet in einen gemeinsamen Pool. Haendler zahlen Gebuehren an den Pool. Du verdienst einen Anteil an jedem Handel.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~400 Millionen USD |
| Blockchains | Arbitrum, Avalanche, Solana |
| Sicherheitspruefungen | 10+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | 5 Mio. USD Bug Bounty auf Immunefi (eines der groessten in DeFi) |

**Links:** Website: gmx.io | X: @GMX_IO

---

#### Protokollkarte: Jupiter JLP

**Name:** Jupiter JLP

**Beschreibung:**

```
Solanas fuehrende Perpetual-Boerse. Stelle Liquiditaet bereit und verdiene 70% aller Handelsgebuehren. Wird in mehreren diBoaS-Wachstumsstrategien eingesetzt.
```

**Details:**

| Gegruendet | 2021 (Perpetuals: 2023) |
| Total Value Locked | ~1,6 Milliarden USD |
| Blockchains | Solana |
| Sicherheitspruefungen | 6+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Ueber 137 Mio. USD an Liquiditaetsanbieter ausgezahlt von Januar bis Oktober 2024, basierend auf Dune-Analytics-Gebuehrendaten (75% von 183 Mio. USD Gesamtgebuehren). Quelle: SolanaFloor / Dune Analytics (Oktober 2024). Die Zahl ist zum Zeitpunkt der Veroeffentlichung wahrscheinlich deutlich hoeher. |

**Links:** Website: jup.ag | X: @JupiterExchange

**Verwendet in diBoaS-Strategien:** Ausgewogener Aufbauer, Vermoegensturbo, Volle Kraft

---

#### Protokollkarte: Drift Protocol

**Name:** Drift Protocol

**Beschreibung:**

```
Umfassende Handelsplattform auf Solana. Perpetuals, Spothandel und Kreditvergabe in einem System. Das Echtzeit-Risikomonitoring-Dashboard ist oeffentlich einsehbar.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~850 Millionen USD |
| Blockchains | Solana |
| Sicherheitspruefungen | 3+ Audits von Trail of Bits, OtterSec |
| Regulatorisch / Erfolgsbilanz | Open-Source-Code. Oeffentliches Risikomonitoring. |

**Links:** Website: drift.trade | X: @DriftProtocol

---

### Kategorie 6: Dezentrale Boersen (DEX)

**Titel:** Dezentrale Boersen

**Beschreibung:**

```
Tausche einen Token gegen einen anderen ohne zentrale Boerse. Du kannst auch Gebuehren verdienen, indem du Liquiditaet bereitstellst, gegen die andere handeln.
```

---

#### Protokollkarte: Raydium

**Name:** Raydium

**Beschreibung:**

```
Solanas wichtigste dezentrale Boerse. Automatisiertes Market Making, konzentrierte Liquiditaet und Token-Launches.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~2 Milliarden USD |
| Blockchains | Solana |
| Sicherheitspruefungen | 4+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | November 2022: 4,4 Mio. USD Exploit durch kompromittierten Admin-Schluessel. Alle betroffenen Nutzer wurden entschaedigt. |

**Badge:** ⚠ (bernsteinfarbener Warnindikator)

**Links:** Website: raydium.io | X: @RaydiumProtocol

---

#### Protokollkarte: Orca

**Name:** Orca

**Beschreibung:**

```
Nutzerfreundliche Solana-Boerse, bekannt fuer klares Design, effiziente Swaps und eine der besten Sicherheitsbilanzen im Oekosystem. Du kannst Liquiditaet bereitstellen und Gebuehren aus Handelsgeschaeften auf der Plattform verdienen.
```

**Details:**

| Gegruendet | 2021 |
| Total Value Locked | ~400 Millionen USD |
| Blockchains | Solana |
| Sicherheitspruefungen | 6+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Keine Exploits in 4+ Jahren. Von unabhaengigen Pruefern fuer Codequalitaet gelobt. |

**Links:** Website: orca.so | X: @orca_so

---

#### Protokollkarte: Balancer

**Name:** Balancer

**Beschreibung:**

```
Programmierbare Liquiditaetspools, die mehrere Token in benutzerdefinierten Verhaeltnissen halten koennen. Flexibler als Standard-Boersenpools. Du stellst Token im Pool bereit und verdienst einen Anteil an den Handelsgebuehren.
```

**Details:**

| Gegruendet | 2020 |
| Total Value Locked | ~258 Millionen USD (nach Exploit; vorher ~775 Mio. USD vor November 2025) |
| Blockchains | Ethereum, Arbitrum, Polygon |
| Sicherheitspruefungen | 11+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | 3. November 2025: 128 Mio. USD Exploit, der V2-Pools auf Ethereum, Polygon, Base, Arbitrum und anderen Chains betraf. Rundungsfehler-Schwachstelle in ComposableStablePool-Vertraegen. Etwa 28 Mio. USD durch Whitehat-Operationen und Protokollinterventionen wiederhergestellt. Der Grossteil der Mittel (~100 Mio. USD) bleibt per Februar 2026 unwiederbringlich verloren. Balancer DAO genehmigte 10% Recovery-Bounty (BIP-908, Februar 2026). V3 (aktuelle Version) war von diesem Exploit NICHT betroffen. diBoaS-Strategien nutzen ausschliesslich V3. Quellen: Check Point Research, CoinJournal, The Defiant, DL News, Halborn. |

**Badge:** ⚠ (bernsteinfarbener Warnindikator)

**Links:** Website: balancer.fi | X: @Balancer

---

### Kategorie 7: Zahlungs- und Real-World-Asset-Infrastruktur

**Titel:** Zahlungs- und Real-World-Asset-Infrastruktur

**Beschreibung:**

```
Diese Systeme verbinden traditionelle Finanzwelt und Krypto. Grenzueberschreitende Zahlungen, Handelsfinanzierung und reale Vermoegenswerte auf der Blockchain.
```

---

#### Protokollkarte: Huma Finance

**Name:** Huma Finance

**Beschreibung:**

```
Sofortige grenzueberschreitende Zahlungen und Handelsfinanzierung mit Krypto-Infrastruktur. Partner von Circle und der Stellar Development Foundation. Ertraege stammen aus Gebuehren fuer die Abwicklung grenzueberschreitender Zahlungen.
```

**Details:**

| Gegruendet | 2022 |
| Total Value Locked | ~100 Millionen USD |
| Blockchains | Solana, Stellar, Polygon |
| Sicherheitspruefungen | 6+ unabhaengige Audits |
| Regulatorisch / Erfolgsbilanz | Strategische Partnerschaften mit Circle und Stellar Development Foundation |

**Links:** Website: huma.finance | X: @humafinance

---

### Implementierungshinweise fuer Protokollkarten

**Fuer CTO / Claude Code:**

- Jede Protokollkarte wird als weisse Karte mit Schatten gerendert, passend zur bestehenden `ProtocolCard.tsx`-Komponente.
- Bernsteinfarbenes Warnbadge (⚠) nutzt das bestehende `hasWarning`-Flag mit `AlertTriangle`-Icon in amber-600.
- Gruenes Erfolgsbadge (✓) nutzt das bestehende `hasSuccess`-Flag mit `CheckCircle`-Icon in teal-600.
- Externe Links oeffnen in neuen Tabs mit `rel="noopener noreferrer"`.

**Badge-Kriterien:**

| Badge | Kriterien | Protokolle |
|-------|----------|-----------|
| ⚠ Bernstein | Hat einen bedeutenden Exploit, regulatorisches Problem oder erhoehtes Risikoprofil | Ethena, Curve, Raydium, Balancer |
| ✓ Gruen | Hat aussergewoehnliche Compliance-Nachweise (SOC2, SEC-Lizenz usw.) | Marinade, Ondo |
| Keines | Standardmaessige Erfolgsbilanz, keine aussergewoehnlichen Markierungen | Alle uebrigen |

---

## SEKTION 4: WIE WIR AUSWAEHLEN

**Ueberleitung:**

```
Wie haben es diese 26 auf die Liste geschafft?
```

**H2:**

```
Unser Auswahlprozess
```

**Text:**

```
Wir listen Protokolle nicht, weil sie populaer sind. Wir listen sie, weil sie unsere Checkliste bestanden haben.
```

**Kriterien (als Haekchenliste gerendert):**

```
✓ Mindestens 1 Jahr ununterbrochener Betrieb. Wir machen Ausnahmen fuer Protokolle, die von Teams mit langer Erfolgsgeschichte entwickelt wurden, aber wir kennzeichnen das klar.

✓ Professionelle Sicherheitsaudits von anerkannten Firmen. Nicht nur eines. Wir suchen nach mehreren unabhaengigen Audits.

✓ Keine ungeloesten Exploits in der von uns genutzten Version, bei denen Nutzergelder dauerhaft verloren gingen. Vergangene Vorfaelle und versionsspezifische Exploits werden auf jeder Karte mit einem Warnbadge offengelegt.

✓ Transparenter Betrieb. Wir koennen ueberpruefen, wie das Protokoll funktioniert. Open-Source-Code wird bevorzugt.

✓ Echte Nutzung. Tatsaechliche Nutzer, die echtes Geld einzahlen. Nicht nur Hype, nicht nur ein Token-Preis.
```

**Unter den Kriterien:**

```
Wenn Protokolle Sicherheitsvorfaelle hatten, vermerken wir das auf der Karte mit einer bernsteinfarbenen Warnung. Transparenz funktioniert in beide Richtungen. Wir zeigen das Gute und das Schlechte.
```

---

**Ueberleitung:**

```
Wie viel echtes Geld steckt also in diesen Systemen?
```

---

## SEKTION 5: GESAMTES TVL

**H2:**

```
Gemeinsam gesicherter Wert
```

**Text:**

```
Die Protokolle auf dieser Seite halten zusammen ueber
```

**Grosse Zahl (gestylt als Hero-Statistik, teal-700, fett):**

```
120 Milliarden USD
```

**Fortfuehrung:**

```
an Nutzereinlagen ueber alle ihre Deployments. Das ist mehr als die meisten Regionalbanken an Gesamteinlagen halten.
```

**Kontext (kleinerer Text darunter):**

```
Das bedeutet nicht, dass dein Geld in allen steckt. Jede diBoaS-Strategie nutzt bestimmte Protokolle, die zu ihrem Risikoniveau und ihren Zielen passen. Auf der Strategieseite siehst du, welche Protokolle in welcher Strategie eingesetzt werden.
```

**Quellenangabe (Micro-Text):**

```
Gesamt-TVL von DeFiLlama. Letzte Ueberpruefung: Januar 2026. Die Werte schwanken taeglich.
```

---

**Ueberleitung:**

```
Bevor du weiter gehst, etwas Wichtiges.
```

---

## SEKTION 6: WAS DIESE SEITE NICHT IST

**H2:**

```
Was diese Seite nicht ist
```

**Text:**

```
Dies ist keine Empfehlung, eines dieser Protokolle direkt zu nutzen.

diBoaS-Strategien bauen auf diesen Systemen auf, und unser Team handhabt die Komplexitaet. Du musst mit keinem Protokoll selbst interagieren. Diese Seite existiert, damit du genau sehen kannst, wohin dein Geld geht, und alles ueberpruefen kannst, was wir sagen.

Jedes Protokoll hier traegt Risiko. Smart Contracts koennen Fehler haben. Maerkte koennen abstuerzen. Stablecoins koennen ihre Bindung verlieren. Systeme, die seit Jahren sicher laufen, koennen morgen trotzdem Probleme bekommen. Wir ueberwachen diese Systeme kontinuierlich, aber wir koennen das Risiko nicht eliminieren. Niemand kann das.

Diese Seite existiert, weil wir glauben, dass du es verdienst, es zu wissen. Nicht weil du etwas tun musst.

Wenn du unsicher bist, ob das Richtige fuer dich dabei ist, konsultiere einen zugelassenen Finanzberater, bevor du Anlageentscheidungen triffst.
```

---

**Ueberleitung:**

```
Du hast wahrscheinlich noch Fragen. Gut so.
```

---

## SEKTION 7: FAQ

**H2:**

```
Fragen zu unseren Protokollen
```

---

**F1: Warum listet ihr nicht jedes DeFi-Protokoll?**

```
Es gibt Tausende von DeFi-Protokollen. Wir listen lieber 26, die wir gruendlich recherchiert haben, als 200, die wir nicht kennen.
```

---

**F2: Wie oft aktualisiert ihr diese Liste?**

```
Wir ueberwachen alle gelisteten Protokolle fortlaufend. Wenn ein Protokoll einen Sicherheitsvorfall, eine regulatorische Aenderung oder ein bedeutendes betriebliches Problem hat, aktualisieren wir diese Seite. Ausserdem ueberpruefen wir die gesamte Liste vierteljährlich, um zu entscheiden, ob Protokolle hinzugefuegt oder entfernt werden.
```

---

**F3: Kann ich ein Protokoll zur Aufnahme vorschlagen?**

```
Ja. Schreib an hello@diboas.com mit deinem Vorschlag und warum du denkst, es sollte aufgenommen werden. Wir pruefen jeden Vorschlag anhand unserer Auswahlkriterien.
```

---

**F4: Bedeutet die Listung hier, dass diBoaS diese Protokolle empfiehlt?**

```
Nein. Gelistet zu sein bedeutet, dass wir sie recherchiert haben, sie unsere Kriterien erfuellen und wir sie in unseren Strategien nutzen. Wir sind mit keinem Protokoll verbunden. Ihre Aufnahme impliziert weder, dass sie diBoaS unterstuetzen, noch stellt unsere Listung eine Empfehlung dar, sie direkt zu nutzen.
```

---

**F5: Was passiert, wenn ein Protokoll gehackt wird?**

```
Das haengt von der Schwere ab. Bei kleineren Vorfaellen, die schnell behoben werden, behalten wir das Protokoll moeglicherweise mit einem aktualisierten Warnhinweis gelistet. Bei schwerwiegenden Exploits, bei denen Nutzergelder dauerhaft verloren gehen, entfernen wir das Protokoll von unserer Liste und passen betroffene Strategien an. Wenn der Exploit eine aeltere Version betraf, die wir nicht nutzen, behalten wir das Protokoll moeglicherweise mit einer klaren Warnung gelistet. Siehe unsere Auswahlkriterien oben fuer Details. Wir werden Aenderungen immer an unsere Nutzer kommunizieren.
```

---

**F6: Warum haben manche Protokolle Warnbadges?**

```
Das bernsteinfarbene Warnbadge bedeutet, dass das Protokoll einen bemerkenswerten Sicherheitsvorfall, ein regulatorisches Problem oder ein erhoehtes Risikoprofil im Vergleich zu Mitbewerbern hat. Wir nehmen diese Protokolle auf, weil sie unsere Gesamtkriterien weiterhin erfuellen, aber wir moechten, dass du das vollstaendige Bild siehst. Die Details stehen auf jeder Karte.
```

---

**F7: Was ist TVL und warum ist es wichtig?**

```
TVL steht fuer Total Value Locked (gesperrter Gesamtwert). Es ist der Gesamtbetrag, den alle Nutzer weltweit in einem Protokoll eingezahlt haben. Hoeheres TVL bedeutet im Allgemeinen, dass mehr Menschen dem System echtes Geld anvertrauen. Es ist keine Garantie fuer Sicherheit, aber es ist ein Signal, das wir beruecksichtigen.
```

---

**F8: Muss ich mit diesen Protokollen selbst interagieren?**

```
Nein. diBoaS uebernimmt alle Protokoll-Interaktionen in deinem Namen, wenn du eine Strategie waehlst. Du musst bei keinem Protokoll ein Konto erstellen, Wallets auf verschiedenen Blockchains verwalten oder die technischen Details verstehen. Diese Seite dient der Transparenz, nicht weil du etwas damit tun musst.
```

---

## SEKTION 8: WARTELISTE / CTA

**Ueberleitung:**

```
Zufrieden mit dem, was du siehst? Trag dich in die Warteliste ein.
```

**CTA:**

Nutzt die gemeinsame `WaitlistSection`-Komponente. Kein eigener Copy noetig.

---

## SEKTION 9: FOOTER

**Letzte Aktualisierung:**

```
Zuletzt aktualisiert: Februar 2026
```

**Datenquellen:**

```
Datenquellen: DeFiLlama (TVL), offizielle Protokolldokumentation, veroeffentlichte Sicherheitsauditberichte, SEC EDGAR (regulatorische Eingaben), CoinGecko und direkte Protokollkommunikation.
```

**Haupthinweis:**

```
Die Informationen auf dieser Seite dienen ausschliesslich Bildungs- und Transparenzzwecken. Sie stellen keine Anlageberatung, Finanzberatung oder Empfehlung dar, ein gelistetes Protokoll zu nutzen. Die Aufnahme von Protokollen spiegelt unsere Recherche wider und impliziert keine Unterstuetzung durch oder Zugehoerigkeit zu einem gelisteten Protokoll. Alle DeFi-Protokolle tragen technisches Risiko, Smart-Contract-Risiko, Marktrisiko, Liquiditaetsrisiko und Stablecoin-Entkopplungsrisiko. Performance, TVL und regulatorischer Status von Protokollen koennen sich jederzeit aendern. Verwende nur Geld, das du verlieren kannst. diBoaS ist keine Bank und deine Gelder sind nicht versichert.
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

**US-Offenlegung:**

```
diBoaS ist eine nicht-verwahrende Schnittstelle, die Zugang zu dezentralen Finanzprotokollen bietet. diBoaS ist nicht bei der SEC, CFTC, FinCEN oder einer staatlichen Regulierungsbehoerde registriert. Die US-amerikanische regulatorische Behandlung von DeFi entwickelt sich weiter. Du bist dafuer verantwortlich, festzustellen, ob deine Nutzung dieser Schnittstelle mit den geltenden Gesetzen uebereinstimmt.
```

**Externe Links:**

```
Externe Links auf dieser Seite fuehren zu Webseiten Dritter, die nicht von diBoaS kontrolliert werden. Wir sind nicht fuer deren Inhalt, Datenschutzpraktiken oder Verfuegbarkeit verantwortlich.
```

**Professionelle Beratung:**

```
Ziehe in Betracht, einen zugelassenen Finanzberater zu konsultieren, bevor du Anlageentscheidungen triffst.
```

**(c) 2026 diBoaS. Alle Rechte vorbehalten.**

---

## LOKALISIERUNGSHINWEISE DE

### Anpassungsentscheidungen

1. **"du" als Anrede:** Wie bei N26, Trade Republic und modernen deutschen Fintechs. Nur MiCA-Hinweise nutzen formelles "Sie" (regulatorische Pflicht).

2. **"Tagesgeld" als mentale Referenz:** Deutsche Nutzer vergleichen Renditen mit ihrem Tagesgeldkonto. Der Eingangshaken "Frag deine Bank" trifft den Nerv besonders gut, da deutsche Bankentransparenz traditionell gering ist.

3. **Gruendlichkeit:** Deutsche Nutzer schaetzen detaillierte Informationen besonders. Die ausfuehrlichen Protokollkarten, Quellenangaben und Risikohinweise passen zur deutschen Finanzkultur besser als zum US-Markt.

4. **BaFin-Kontext bei Ethena:** Fuer den deutschen Markt besonders relevant, da BaFin die zustaendige Behoerde ist. Deutsche Nutzer erkennen BaFin-Massnahmen sofort als schwerwiegend.

5. **Zahlenformat:** Komma als Dezimaltrennzeichen (0,39%), Punkt als Tausendertrennzeichen (1.000). Europaeischer Standard.

6. **Protokollnamen bleiben Englisch:** Technische Protokollnamen werden nicht uebersetzt. "Sicherer Hafen" usw. sind die Strategienamen, nicht die Protokollnamen.

7. **Einlagensicherung:** EU-Einlagensicherung bis 100.000 EUR pro Institut als Vergleichsrahmen (nicht FDIC).
