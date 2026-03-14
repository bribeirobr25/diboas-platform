# GOAL CALCULATOR — LOCALIZED COPY (DE / ES / PT-BR)
**Version:** 2.0
**Date:** March 14, 2026
**Base:** GOAL_CALCULATOR_SPEC_v2.0.md (EN)
**Rules:**
- Cultural adaptation, NOT literal translation
- Adelaide Filter: no jargon in any language
- No positive bank mentions, no financial advice
- Currency/number formats per locale
- Goal names adapted to local traditions

---

# 🇩🇪 GERMAN (DE) — Market: Germany

## Headline

**Was baust du auf?**

## Goal tabs

**Weihnachtsgeld | Notgroschen | Urlaubskasse**

*(Default: Weihnachtsgeld)*

---

## Inputs

### Field 1: Goal-specific input

**For Weihnachtsgeld:**
- Label: Was verdienst du im Jahr?
- Helper: Brutto ist okay. Wir speichern das nicht.
- Target = Field 1 / 12

**For Notgroschen:**
- Label: Was gibst du im Monat aus?
- Helper: Miete, Essen, Rechnungen — eine grobe Zahl reicht.
- Target = Field 1 × Monate
- Coverage selector: 3 Monate | 4 Monate | 6 Monate (default: 3 Monate)

**For Urlaubskasse:**
- Label: Wie viel willst du sparen?
- Helper: Denk an eine richtige Reise, nicht nur ein Wochenende.
- Target = user-entered amount
- Date selector: user picks target month/year (default: 6 months from today)

---

### Field 2: Wie viel kannst du sofort einzahlen?

**Helper:** Du kannst das jederzeit ändern.

- Default: **0**

---

### Field 3: Wie viel kannst du jeden Monat dazugeben?

**Helper:** Wir schlagen einen Betrag vor, der zu deinem Ziel passt.

---

### Field 4: Wie viel Bewegung ist okay für dich?

Options:

| Option | Label |
|--------|-------|
| 1 | Lieber vorsichtig |
| 2 | Ein bisschen mehr Chance |
| 3 | Ich kann Schwankungen vertragen |

**Default:** Lieber vorsichtig

---

## Timeline Logic

### Weihnachtsgeld
**Target Date = 1. Dezember des laufenden Jahres**

If today is after December 1:
**Target Date = 1. Dezember nächstes Jahr**

Display: "Dein nächstes Weihnachtsgeld: 1. Dezember [Jahr]."

### Notgroschen
**Target Date = heute + 12 Monate** (default)
Selector: 6 Monate | 9 Monate | 12 Monate | 18 Monate

### Urlaubskasse
**Target Date = user-selected**
Minimum: 3 Monate ab heute.
Message if too short: "Wähl ein Datum, das mindestens 3 Monate entfernt ist, damit dein Geld Zeit hat zu arbeiten."

### Edge case: n = 0
Weihnachtsgeld: roll to next year.
Notgroschen: minimum n = 1.
Urlaubskasse: "Wähl ein Datum, das mindestens 3 Monate entfernt ist."

### Edge case: n = 1
Auto-select "Lieber vorsichtig." Disable other options.
Show: "Bei nur 1 Monat empfehlen wir die vorsichtige Variante."

---

## CTA

**[Zeig mir meinen Plan]**

---

## RESULT CARD

### Weihnachtsgeld result headline:
**Dein Weihnachtsgeld: [BETRAG] EUR bis 1. Dezember.**

### Notgroschen result headline:
**Dein Notgroschen: [BETRAG] EUR — [X] Monate Sicherheit.**

### Urlaubskasse result headline:
**Deine Urlaubskasse: [BETRAG] EUR bis [Datum].**

---

### Plan line
**Leg jeden Monat [BETRAG] EUR zur Seite. Dein Geld arbeitet, während du wartest.**

---

### Scenario Table

| Szenario | Was du haben wirst |
|----------|--------------------|
| Wenn es gut läuft | [BETRAG] EUR |
| Erwartet | [BETRAG] EUR |
| In einem schlechten Jahr | [BETRAG] EUR |

---

### Bad-year microcopy (aggressive tier, if RETURN-3 < total deposits):
**In einem schlechten Jahr könntest du einen Teil deiner Einzahlung verlieren. Das ist der Preis für mehr Wachstumschance.**

---

### Risk disclaimer
**Wir zeigen dir eine Spanne, kein Versprechen.**

---

### Primary CTA
**[Dieses Ziel starten]**

### Secondary links
**Wie funktioniert das? | Was sind die Risiken?**

---

### Start Smaller Toggle
**[BETRAG] EUR pro Monat ist zu viel? [Schau, was mit 50 EUR pro Monat passiert]**

If final value is below target:
**Mit 50 EUR pro Monat erreichst du etwa [BETRAG] EUR bis [Datum]. Das sind [X]% deines Ziels. Du kannst später jederzeit erhöhen.**

---

### Demo Link
**Willst du es erst ausprobieren? [Demo mit Spielgeld →]**

---

### Microcopy
**Ab 5 EUR. Jederzeit änderbar.**

---

### Helper: M exceeds 50% of monthly income
**Das ist ein großer Betrag. Du kannst kleiner anfangen und später anpassen.**

---

# 🇪🇸 SPANISH (ES) — Market: Spain

## Headline

**¿Qué estás construyendo?**

## Goal tabs

**Paga Extra de Navidad | Fondo de Emergencia | Dinero para Vacaciones**

*(Default: Paga Extra de Navidad)*

**Note:** In Spain, workers typically receive two extra payments: June (paga extra de verano) and December (paga extra de Navidad). The calculator defaults to the December bonus. A future version could add the June paga extra as a fourth goal tab.

---

## Inputs

### Field 1: Goal-specific input

**For Paga Extra de Navidad:**
- Label: ¿Cuánto ganas al año?
- Helper: Antes de impuestos está bien. No guardamos este dato.
- Target = Field 1 / 12

**For Fondo de Emergencia:**
- Label: ¿Cuánto gastas al mes?
- Helper: Alquiler, comida, facturas — un número aproximado vale.
- Target = Field 1 × meses
- Coverage selector: 3 meses | 4 meses | 6 meses (default: 3 meses)

**For Dinero para Vacaciones:**
- Label: ¿Cuánto quieres ahorrar?
- Helper: Piensa en un viaje de verdad, no solo un fin de semana.
- Target = user-entered amount
- Date selector: user picks target month/year (default: 6 months from today)

---

### Field 2: ¿Con cuánto puedes empezar?

**Helper:** Puedes cambiar esto después.

- Default: **0**

---

### Field 3: ¿Cuánto puedes añadir cada mes?

**Helper:** Te sugerimos una cantidad basada en tu objetivo.

---

### Field 4: ¿Cuánto movimiento te parece bien?

Options:

| Option | Label |
|--------|-------|
| 1 | Prefiero ir con cuidado |
| 2 | Un poco más de oportunidad |
| 3 | Aguanto los altibajos |

**Default:** Prefiero ir con cuidado

---

## Timeline Logic

### Paga Extra de Navidad
**Target Date = 1 de diciembre del año en curso**

If today is after December 1:
**Target Date = 1 de diciembre del año que viene**

Display: "Tu próxima paga extra: 1 de diciembre de [año]."

### Fondo de Emergencia
**Target Date = hoy + 12 meses** (default)
Selector: 6 meses | 9 meses | 12 meses | 18 meses

### Dinero para Vacaciones
**Target Date = user-selected**
Minimum: 3 meses desde hoy.
Message if too short: "Elige una fecha que esté al menos a 3 meses para que tu dinero tenga tiempo de trabajar."

### Edge case: n = 0
Paga Extra: roll to next year.
Fondo de Emergencia: minimum n = 1.
Vacaciones: "Elige una fecha que esté al menos a 3 meses."

### Edge case: n = 1
Auto-select "Prefiero ir con cuidado." Disable other options.
Show: "Con solo 1 mes, recomendamos la opción más cuidadosa."

---

## CTA

**[Enséñame mi plan]**

---

## RESULT CARD

### Paga Extra result headline:
**Tu Paga Extra de Navidad: [CANTIDAD] EUR para el 1 de diciembre.**

### Fondo de Emergencia result headline:
**Tu Fondo de Emergencia: [CANTIDAD] EUR — [X] meses de tranquilidad.**

### Vacaciones result headline:
**Tu Fondo de Vacaciones: [CANTIDAD] EUR para [Fecha].**

---

### Plan line
**Aparta [CANTIDAD] EUR al mes a partir de hoy. Tu dinero trabaja mientras esperas.**

---

### Scenario Table

| Escenario | Lo que tendrás |
|-----------|----------------|
| Si las cosas van bien | [CANTIDAD] EUR |
| Esperado | [CANTIDAD] EUR |
| En un mal año | [CANTIDAD] EUR |

---

### Bad-year microcopy (aggressive tier, if RETURN-3 < total deposits):
**En un mal año, podrías perder parte de lo que pusiste. Ese es el precio de buscar más crecimiento.**

---

### Risk disclaimer
**Te mostramos un rango, no una promesa.**

---

### Primary CTA
**[Empezar este objetivo]**

### Secondary links
**¿Cómo funciona? | ¿Cuáles son los riesgos?**

---

### Start Smaller Toggle
**¿[CANTIDAD] EUR al mes es mucho? [Mira qué pasa con 50 EUR al mes]**

If final value is below target:
**Con 50 EUR al mes, llegarías a unos [CANTIDAD] EUR para [Fecha]. Eso es el [X]% de tu objetivo. Puedes aumentar después cuando quieras.**

---

### Demo Link
**¿Quieres probarlo antes? [Demo con dinero de práctica →]**

---

### Microcopy
**Desde 5 EUR. Cambia tu plan cuando quieras.**

---

### Helper: M exceeds 50% of monthly income
**Es un compromiso grande. Puedes empezar con menos y ajustar después.**

---

# 🇧🇷 PORTUGUESE-BR (PT-BR) — Market: Brazil

## Headline

**O que você tá construindo?**

## Goal tabs

**13º Salário | Reserva de Emergência | Dinheiro pra Viagem**

*(Default: 13º Salário)*

**Note:** The 13º salário is mandatory by Brazilian law (paid in two installments: first by November 30, second by December 20). The calculator targets November 30 for the full amount. The cultural framing for Brazil is NOT "earn more yield" (CDI beats DeFi in BRL terms) but "save in digital dollars to protect against BRL depreciation."

---

## Inputs

### Field 1: Goal-specific input

**For 13º Salário:**
- Label: Quanto você ganha por ano?
- Helper: Bruto tá ótimo. A gente não guarda esse dado.
- Target = Field 1 / 12

**For Reserva de Emergência:**
- Label: Quanto você gasta por mês?
- Helper: Aluguel, comida, contas — um número aproximado tá bom.
- Target = Field 1 × meses
- Coverage selector: 3 meses | 4 meses | 6 meses (default: 3 meses)

**For Dinheiro pra Viagem:**
- Label: Quanto você quer guardar?
- Helper: Pensa numa viagem de verdade, não só um feriado prolongado.
- Target = user-entered amount
- Date selector: user picks target month/year (default: 6 months from today)

---

### Field 2: Com quanto você pode começar?

**Helper:** Você pode mudar isso depois.

- Default: **0**

---

### Field 3: Quanto você pode colocar todo mês?

**Helper:** A gente sugere um valor baseado no seu objetivo.

---

### Field 4: Quanta movimentação tá ok pra você?

Options:

| Option | Label |
|--------|-------|
| 1 | Prefiro ir com cuidado |
| 2 | Um pouco mais de chance |
| 3 | Aguento as oscilações |

**Default:** Prefiro ir com cuidado

---

## Timeline Logic

### 13º Salário
**Target Date = 30 de novembro do ano corrente**

If today is after November 30:
**Target Date = 30 de novembro do ano que vem**

Display: "Seu próximo 13º: 30 de novembro de [ano]."

**Brazil-specific note:** The legal deadline for the first installment of the 13º is November 30. The second installment deadline is December 20. The calculator uses November 30 as the target because the user is building their OWN 13º equivalent, not waiting for the employer payment.

### Reserva de Emergência
**Target Date = hoje + 12 meses** (default)
Selector: 6 meses | 9 meses | 12 meses | 18 meses

### Dinheiro pra Viagem
**Target Date = user-selected**
Minimum: 3 meses a partir de hoje.
Message if too short: "Escolhe uma data com pelo menos 3 meses pra frente, pra seu dinheiro ter tempo de trabalhar."

### Edge case: n = 0
13º: roll to next year.
Reserva: minimum n = 1.
Viagem: "Escolhe uma data com pelo menos 3 meses pra frente."

### Edge case: n = 1
Auto-select "Prefiro ir com cuidado." Disable other options.
Show: "Com só 1 mês, a gente recomenda a opção mais cuidadosa."

---

## CTA

**[Me mostra o plano]**

---

## RESULT CARD

### 13º Salário result headline:
**Seu 13º Salário: R$ [VALOR] até 30 de novembro.**

### Brazil-specific value line (appears below result for 13º):
**Guardado em dólares digitais. Mesmo se o Real cair, seu 13º mantém o valor.**

**Note:** This line is the core Brazilian value proposition. It does NOT appear in EN/DE/ES. In Brazil, the story is not "earn more yield" — it's "protect against BRL depreciation." The calculator shows the result in BRL but the underlying message is dollar-denominated savings.

### Reserva de Emergência result headline:
**Sua Reserva de Emergência: R$ [VALOR] — [X] meses de tranquilidade.**

### Viagem result headline:
**Seu Fundo de Viagem: R$ [VALOR] até [Data].**

---

### Plan line
**Guarde R$ [VALOR] por mês a partir de hoje. Seu dinheiro trabalha enquanto você espera.**

---

### Scenario Table

| Cenário | O que você vai ter |
|---------|--------------------|
| Se as coisas forem bem | R$ [VALOR] |
| Esperado | R$ [VALOR] |
| Num ano ruim | R$ [VALOR] |

---

### Bad-year microcopy (aggressive tier, if RETURN-3 < total deposits):
**Num ano ruim, você pode perder parte do que colocou. Esse é o preço de buscar mais crescimento.**

---

### Risk disclaimer
**A gente tá te mostrando uma faixa, não uma promessa.**

---

### Primary CTA
**[Começar esse objetivo]**

### Secondary links
**Como funciona? | Quais são os riscos?**

---

### Start Smaller Toggle
**R$ [VALOR] por mês é muito? [Vê o que acontece com R$ 100 por mês]**

If final value is below target:
**Com R$ 100 por mês, você chega a uns R$ [VALOR] até [Data]. Isso é [X]% do seu objetivo. Você pode aumentar depois quando quiser.**

**Note:** PT-BR "start smaller" amount is R$100 (not R$50). R$50 is too low to feel like a meaningful savings commitment in Brazil. R$100 maps better to the cultural equivalent of "a small amount I can try."

---

### Demo Link
**Quer experimentar antes? [Demo com dinheiro de mentira →]**

---

### Microcopy
**A partir de R$ 10. Mude seu plano quando quiser.**

---

### Helper: M exceeds 50% of monthly income
**Esse é um valor alto. Você pode começar menor e ajustar depois.**

---

# CROSS-LOCALE REFERENCE TABLE

| Element | EN (US) | DE | ES | PT-BR |
|---------|---------|----|----|-------|
| Headline | What are you building? | Was baust du auf? | ¿Qué estás construyendo? | O que você tá construindo? |
| Goal 1 | Christmas Bonus | Weihnachtsgeld | Paga Extra de Navidad | 13º Salário |
| Goal 2 | Emergency Fund | Notgroschen | Fondo de Emergencia | Reserva de Emergência |
| Goal 3 | Vacation Money | Urlaubskasse | Dinero para Vacaciones | Dinheiro pra Viagem |
| Goal 1 target date | December 1 | 1. Dezember | 1 de diciembre | 30 de novembro |
| Field 1 label (Goal 1) | What do you earn per year? | Was verdienst du im Jahr? | ¿Cuánto ganas al año? | Quanto você ganha por ano? |
| Field 2 label | How much can you start with? | Wie viel kannst du sofort einzahlen? | ¿Con cuánto puedes empezar? | Com quanto você pode começar? |
| Field 3 label | How much can you add each month? | Wie viel kannst du jeden Monat dazugeben? | ¿Cuánto puedes añadir cada mes? | Quanto você pode colocar todo mês? |
| Risk option 1 | Keep it careful | Lieber vorsichtig | Prefiero ir con cuidado | Prefiro ir com cuidado |
| Risk option 2 | A little more upside | Ein bisschen mehr Chance | Un poco más de oportunidad | Um pouco mais de chance |
| Risk option 3 | I can handle more movement | Ich kann Schwankungen vertragen | Aguanto los altibajos | Aguento as oscilações |
| CTA (calculate) | Show me my plan | Zeig mir meinen Plan | Enséñame mi plan | Me mostra o plano |
| CTA (start) | Start this goal | Dieses Ziel starten | Empezar este objetivo | Começar esse objetivo |
| Disclaimer | A range, not a promise | Eine Spanne, kein Versprechen | Un rango, no una promesa | Uma faixa, não uma promessa |
| Start smaller | $50/month | 50 EUR/Monat | 50 EUR/mes | R$ 100/mês |
| Minimum | $5 | 5 EUR | 5 EUR | R$ 10 |
| Demo link | Demo with practice money | Demo mit Spielgeld | Demo con dinero de práctica | Demo com dinheiro de mentira |
| Good scenario | If things go well | Wenn es gut läuft | Si las cosas van bien | Se as coisas forem bem |
| Expected | Expected | Erwartet | Esperado | Esperado |
| Bad scenario | In a bad year | In einem schlechten Jahr | En un mal año | Num ano ruim |

---

# BRAZIL-SPECIFIC NOTES

1. **The 13º target date is November 30, NOT December 1.** The first installment is legally due by November 30 in Brazil. This is different from the Christmas Bonus in other markets.

2. **The core Brazilian value proposition is currency protection, not yield.** The line "Guardado em dólares digitais. Mesmo se o Real cair, seu 13º mantém o valor." appears ONLY in PT-BR. Other markets don't need this because EUR and USD are relatively stable.

3. **PT-BR tone is warmer and more informal than other locales.** "Tá," "pra," "a gente" are all correct and expected in Brazilian digital products (Nubank uses this register). This is NOT incorrect Portuguese — it's the appropriate register for the market.

4. **R$ 100 is the "start smaller" amount, not R$ 50.** In Brazil, R$ 50 (~$10 USD) feels trivially small for a savings commitment. R$ 100 (~$20 USD) is the cultural sweet spot for "I'm trying something new but I'm not going crazy."

5. **CVM regulatory warnings are NOT included in the calculator.** They appear on strategy-specific pages and in the footer, per CLO Board guidance. The calculator is a simulator, not an investment product page.

---

# GERMANY-SPECIFIC NOTES

1. **"Weihnachtsgeld" is a cultural expectation, not a legal requirement.** Unlike Brazil's 13º, German employers are not legally required to pay Christmas bonuses. However, ~86% of companies covered by collective agreements pay it. The calculator frames it as "building your own Weihnachtsgeld" — money you create for yourself regardless of your employer.

2. **"Notgroschen" is the culturally correct term for emergency fund.** Literal translation: "emergency penny." Every German knows this word. Using "Notfall-Fonds" or "Notfall-Rücklage" would sound corporate. "Notgroschen" sounds like grandmother's advice — which is exactly the Adelaide Filter.

3. **"du" form throughout.** Consistent with the rest of the DE site. No "Sie" anywhere in the calculator.

4. **MiCA disclaimer is NOT included in the calculator.** It appears in the footer per CLO Board guidance.

---

# SPAIN-SPECIFIC NOTES

1. **"Paga Extra de Navidad" is the culturally correct term.** Spanish workers receive 14 monthly payments: 12 regular + 2 "pagas extras" (June and December). The December one is "paga extra de Navidad." Some companies prorate it across 12 months instead.

2. **Future consideration:** Add "Paga Extra de Verano" (June) as a fourth goal tab. This would make diBoaS the only financial product that specifically helps Spanish workers plan for both extra payments.

3. **"tú" form throughout.** Consistent with the rest of the ES site.

4. **MiCA disclaimer is NOT included in the calculator.** It appears in the footer per CLO Board guidance.
