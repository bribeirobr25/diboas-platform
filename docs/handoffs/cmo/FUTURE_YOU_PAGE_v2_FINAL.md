# diBoaS Future You Calculator Page
## FINAL VERSION 2.0 — Jargon-Free, User-Focused

**Version:** 2.0  
**Date:** December 31, 2025  
**Status:** ✅ FINAL — Ready for Implementation  
**URL:** /future-you  
**Languages:** English (EN), German (DE), Portuguese-Brazil (PT-BR), Spanish (ES)

---

# VERSION 2.0 CHANGES

| Change | Details |
|--------|---------|
| Jargon removal | APY → Annual return, DeFi → (removed), Protocol → System |
| Terminology alignment | Matches Strategies page v2 language |
| Performance format | Uses target ranges (6-10%) not historical point estimates |
| Educational sections | Simplified "The Math Explained" with plain language |
| Removed | Technical implementation details from user-facing content |

---

# CALCULATOR PARAMETERS

## Technical Specifications

| Parameter | Value | Source |
|-----------|-------|--------|
| Bank Rate | 0.5% annual | ECB average savings rate |
| diBoaS Rate | 8% annual | Safe Harbor mid-range (conservative) |
| Compounding | Monthly | Standard |
| Min Amount | €5 / R$5 | Platform minimum |
| Max Amount | €500 / R$500 | Reasonable monthly savings |
| Time Options | 5, 10, 15, 20 years | Standard planning horizons |

**Note:** Using 8% (middle of 6-10% range) for projections rather than 9.5% to be conservative and align with CLO guidance.

## Example Calculations (€100/month at 8%)

| Years | Bank (0.5%) | diBoaS (8%) | Difference |
|-------|-------------|-------------|------------|
| 5 | €6,076 | €7,348 | €1,272 |
| 10 | €12,295 | €18,295 | €6,000 |
| 15 | €18,663 | €34,604 | €15,941 |
| 20 | €25,185 | €58,902 | €33,717 |

---

# ENGLISH (EN) VERSION

---

## SECTION 1: HERO

**Headline:**
> Meet your future self

**Subheadline:**
> Small amounts. Consistent effort. Time does the rest.
>
> See what your money could become if it worked as hard as you do.

**Context Line:**
> This isn't a promise. It's a projection based on historical data. But it shows you what's possible when the math is finally on your side.

---

## SECTION 2: CALCULATOR

**Header:**
> What could your money become?

**Instructions:**
> Slide to set your monthly amount. Pick your timeframe. Watch the math work.

---

### Input: Monthly Amount

**Label:**
> Monthly amount you could set aside

**Slider Range:**
> €5 ←――――――――――――――――→ €500

**Helper Text:**
> Start with what's comfortable. Even €20/month adds up over time.

---

### Input: Timeframe

**Label:**
> How long are you thinking?

**Buttons:**
> [ 5 years ] [ 10 years ] [ 15 years ] [ 20 years ]

**Helper Text:**
> The longer your timeframe, the more powerful the growth becomes.

---

### Output: Results Display

**Header:**
> In [X] years, your €[amount]/month could become:

| | With diBoaS | With Your Bank |
|--|-------------|----------------|
| **Future Value** | €[diboas_amount] | €[bank_amount] |
| **You Deposited** | €[total_deposited] | €[total_deposited] |
| **You Earned** | €[diboas_earnings] | €[bank_earnings] |

**Difference Highlight:**
> That's **€[difference] more** from the same monthly effort.
>
> Same sacrifice. Different outcome. That's what happens when your money actually works for you.

---

### Watermark/Disclaimer

**Embedded Watermark:**
> PROJECTION

**Disclaimer Text:**
> Based on historical performance (8% annual for diBoaS using our most conservative strategy, 0.5% for typical bank savings). This is a projection, not a guarantee. Actual results will vary based on the strategy you choose and market conditions.

---

### CTA

**Primary Button:**
> Join the waitlist to make this real →

**Secondary Link:**
> Want higher potential returns? [Explore all 10 strategies →](/strategies)

---

## SECTION 3: THE MATH EXPLAINED

**Header:**
> Why the difference is so big

**Intro:**
> It's not magic. It's math. Here's what's actually happening:

---

### Concept 1: The Bank Gap

**Headline:**
> Your bank earns more than they pay you

**Body:**
> Banks take your deposits and put them to work — lending, investing, earning real returns. But they only share a tiny fraction with you.
>
> A typical bank earns around 7% with your money. They pay you 0.5%. That 6.5% difference? That's their entire business model.
>
> With diBoaS, you access the same kinds of returns they do. The gap goes to you instead.

**Visual:**
```
How banks work:
├── They earn: ~7%
├── They pay you: 0.5%
└── They keep: 6.5%

How diBoaS works:
├── Systems earn: 6-10%
├── You receive: 6-10%
└── We charge: 0.9% when you withdraw
```

---

### Concept 2: Returns on Returns

**Headline:**
> Your earnings start earning too

**Body:**
> When you earn returns, and those returns earn more returns, growth accelerates over time. At 0.5%, this barely matters. At 8%, it transforms everything.

**Example:**
> €100/month for 20 years:
> - Total deposited: €24,000
> - Bank earnings: €1,185 (that's 5% of what you put in)
> - diBoaS earnings: €34,902 (that's 145% of what you put in)
>
> The difference isn't 16x the rate. It's 29x the earnings. That's what happens when returns compound.

---

### Concept 3: Time Is Your Weapon

**Headline:**
> The longer you wait to start, the more it costs you

**Body:**
> Starting 5 years earlier with €100/month means tens of thousands more at the end. Every year you delay costs you future growth you'll never get back.

**Visual:**
```
Starting at different ages (€100/month until age 45):

Start at 25: ~€59,000
Start at 30: ~€35,000  
Start at 35: ~€18,000

Cost of waiting 5 years: ~€24,000 less
Cost of waiting 10 years: ~€41,000 less
```

**Takeaway:**
> The best time to start was years ago. The second best time is now.

---

## SECTION 4: STRATEGY CONNECTION

**Header:**
> The 8% isn't random

**Body:**
> This projection uses our most conservative strategy, called Safe Harbor. It uses only stable systems with no exposure to price swings. In our 4-year test, it never lost money.
>
> If you're comfortable with some ups and downs, other strategies have delivered higher returns:

| Strategy | What could happen | Price swing exposure |
|----------|-------------------|---------------------|
| Safe Harbor | 6-10% per year | None |
| Balanced Builder | 10-16% per year | 40% |
| Wealth Accelerator | Variable (could be negative or 50%+) | 70% |

**Note:**
> Higher potential returns come with bumpier rides. This calculator uses Safe Harbor because it's what we'd recommend for someone just starting out.

**CTA:**
> Explore all 10 strategies →

---

## SECTION 5: FAQ

**Header:**
> Questions about the calculator

---

**Q: Is 8% realistic?**

> The 8% is in the middle of our Safe Harbor strategy's expected range (6-10% per year). We tested this strategy across 4 years of real market data, including the 2022 crash and multiple smaller drops.
>
> Is it guaranteed going forward? No. Could it be higher or lower? Yes. But it's grounded in real data, not wishful thinking.
>
> We use 8% instead of 10% to be conservative. We'd rather you be pleasantly surprised than disappointed.

---

**Q: Why do you use 0.5% for banks?**

> That's the average savings account rate in the EU. Some banks pay more during promotional periods (maybe 1-2%), most pay less or even nothing. We use the average because that's what most people actually get.
>
> If your bank pays more, great! But even at 2%, the gap between what you're earning and what's possible is still enormous.

---

**Q: What about inflation?**

> This calculator shows the actual numbers, not adjusted for inflation.
>
> Here's why that matters:
> - At 0.5%, you're almost certainly losing purchasing power every year. Inflation eats more than you earn.
> - At 8%, you're likely beating inflation and building real wealth.
>
> The exact impact depends on future inflation, which nobody can predict. But earning 8% puts you in a much stronger position than earning 0.5%.

---

**Q: Can I really start with €5/month?**

> Yes. diBoaS has no minimum beyond €5.
>
> We believe everyone should have access to real returns, not just people with thousands to invest.
>
> €5/month for 20 years at 8% = ~€2,945
> That's ~€1,745 in earnings on €1,200 deposited.
>
> Small? Maybe. But it's €1,745 more than you'd have doing nothing.

---

**Q: What if I can't save the same amount every month?**

> Life happens. You can adjust anytime.
>
> This calculator assumes consistent monthly amounts because that's the easiest way to project. But diBoaS doesn't require consistency.
>
> Some months you save €200. Some months €20. Some months €0. The math still works — just differently. What matters is that you start.

---

**Q: Which strategy should I actually use?**

> The calculator uses Safe Harbor as a baseline because it's:
> - Our most conservative strategy
> - Uses only stable systems (no price swing exposure)
> - Never lost money in our 4-year test
>
> If you're comfortable with occasional dips and have a longer timeframe, strategies with growth potential might suit you better.
>
> [See all 10 strategies →](/strategies)

---

**Q: How is this different from my bank's savings account?**

> Three main differences:
>
> **1. Returns:** Banks typically pay 0.5% or less. Our most conservative strategy targets 6-10%.
>
> **2. Where your money goes:** Banks lend your money out and keep most of the returns. With diBoaS, your money goes into systems that pay you directly.
>
> **3. Control:** Bank deposits become the bank's money (legally, they just owe you). With diBoaS, your money stays in your own wallet. We can't touch it.
>
> The tradeoff? Bank deposits are insured up to €100,000. diBoaS deposits are not insured, though the systems we use have secured billions safely for years.

---

## SECTION 6: FINAL CTA

**Header:**
> Ready to build your future?

**Body:**
> You've seen the math. You know what's possible.
>
> The only question left: when do you start?

**Primary CTA:**
> Join the waitlist — it's free →

**Secondary Text:**
> Every month you wait is growth you're missing.

**Footer:**
> ⏰ You're #[X] in line for early access

---

## SECTION 7: FOOTER DISCLAIMERS

**Full Disclaimer:**
> This calculator provides projections only. The 8% rate is based on Safe Harbor strategy's expected performance range and is not guaranteed. The 0.5% bank rate is based on ECB average savings rates. Actual results will vary based on the strategy you choose, market conditions, and timing of deposits. Past performance does not guarantee future results. Your money is placed in automated systems that carry technical risk, market risk, and liquidity risk. diBoaS is not a bank and your funds are not insured. This is not financial advice.

---

---

# GERMAN (DE) VERSION

---

## SECTION 1: HERO

**Headline:**
> Treffen Sie Ihr zukünftiges Ich

**Subheadline:**
> Kleine Beträge. Konsequenter Einsatz. Die Zeit erledigt den Rest.
>
> Sehen Sie, was aus Ihrem Geld werden könnte, wenn es so hart arbeitet wie Sie.

**Context Line:**
> Das ist kein Versprechen. Es ist eine Projektion basierend auf historischen Daten. Aber sie zeigt Ihnen, was möglich ist, wenn die Mathematik endlich auf Ihrer Seite ist.

---

## SECTION 2: CALCULATOR

**Header:**
> Was könnte aus Ihrem Geld werden?

**Instructions:**
> Schieben Sie den Regler, um Ihren monatlichen Betrag festzulegen. Wählen Sie Ihren Zeitrahmen. Beobachten Sie die Mathematik.

---

### Input: Monthly Amount

**Label:**
> Monatlicher Betrag, den Sie zurücklegen könnten

**Slider Range:**
> €5 ←――――――――――――――――→ €500

**Helper Text:**
> Beginnen Sie mit dem, was bequem ist. Selbst €20/Monat summiert sich über die Zeit.

---

### Input: Timeframe

**Label:**
> Wie lange denken Sie?

**Buttons:**
> [ 5 Jahre ] [ 10 Jahre ] [ 15 Jahre ] [ 20 Jahre ]

**Helper Text:**
> Je länger Ihr Zeitrahmen, desto kraftvoller wird das Wachstum.

---

### Output: Results Display

**Header:**
> In [X] Jahren könnten Ihre €[amount]/Monat werden:

| | Mit diBoaS | Mit Ihrer Bank |
|--|------------|----------------|
| **Endwert** | €[diboas_amount] | €[bank_amount] |
| **Sie haben eingezahlt** | €[total_deposited] | €[total_deposited] |
| **Sie haben verdient** | €[diboas_earnings] | €[bank_earnings] |

**Difference Highlight:**
> Das sind **€[difference] mehr** bei gleichem monatlichem Einsatz.
>
> Gleicher Verzicht. Unterschiedliches Ergebnis. Das passiert, wenn Ihr Geld tatsächlich für Sie arbeitet.

---

### Disclaimer

**Disclaimer Text:**
> Basierend auf historischer Performance (8% jährlich für diBoaS mit unserer konservativsten Strategie, 0,5% für typische Banksparzinsen). Dies ist eine Projektion, keine Garantie. Tatsächliche Ergebnisse variieren je nach gewählter Strategie und Marktbedingungen.

---

### CTA

**Primary Button:**
> Auf die Warteliste, um dies Realität werden zu lassen →

**Secondary Link:**
> Möchten Sie höheres Potenzial? [Alle 10 Strategien entdecken →](/strategies)

---

## SECTION 3: THE MATH EXPLAINED

**Header:**
> Warum der Unterschied so groß ist

**Intro:**
> Es ist keine Magie. Es ist Mathematik. Hier ist, was tatsächlich passiert:

---

### Concept 1: Die Banken-Lücke

**Headline:**
> Ihre Bank verdient mehr als sie Ihnen zahlt

**Body:**
> Banken nehmen Ihre Einlagen und setzen sie ein — verleihen, investieren, echte Renditen erzielen. Aber sie teilen nur einen winzigen Bruchteil mit Ihnen.
>
> Eine typische Bank verdient etwa 7% mit Ihrem Geld. Sie zahlen Ihnen 0,5%. Diese 6,5% Differenz? Das ist ihr gesamtes Geschäftsmodell.
>
> Mit diBoaS erhalten Sie Zugang zu den gleichen Arten von Renditen. Die Lücke geht stattdessen an Sie.

---

### Concept 2: Renditen auf Renditen

**Headline:**
> Ihre Erträge beginnen auch zu verdienen

**Body:**
> Wenn Sie Renditen erzielen und diese Renditen weitere Renditen erwirtschaften, beschleunigt sich das Wachstum im Laufe der Zeit. Bei 0,5% macht das kaum einen Unterschied. Bei 8% verändert es alles.

**Example:**
> €100/Monat für 20 Jahre:
> - Gesamteinzahlung: €24.000
> - Bankerträge: €1.185 (das sind 5% Ihrer Einzahlung)
> - diBoaS-Erträge: €34.902 (das sind 145% Ihrer Einzahlung)
>
> Der Unterschied ist nicht 16x der Zinssatz. Es sind 29x die Erträge. Das passiert, wenn Renditen sich vermehren.

---

### Concept 3: Zeit ist Ihre Waffe

**Headline:**
> Je länger Sie mit dem Start warten, desto mehr kostet es Sie

**Body:**
> 5 Jahre früher mit €100/Monat zu beginnen bedeutet Zehntausende mehr am Ende. Jedes Jahr Verzögerung kostet Sie zukünftiges Wachstum, das Sie nie zurückbekommen werden.

**Takeaway:**
> Der beste Zeitpunkt zum Starten war vor Jahren. Der zweitbeste ist jetzt.

---

## SECTION 4: STRATEGY CONNECTION

**Header:**
> Die 8% sind nicht zufällig

**Body:**
> Diese Projektion verwendet unsere konservativste Strategie namens Safe Harbor. Sie nutzt nur stabile Systeme ohne Exposition gegenüber Preisschwankungen. In unserem 4-Jahres-Test hat sie nie Geld verloren.
>
> Wenn Sie mit einigen Auf und Abs vertraut sind, haben andere Strategien höhere Renditen geliefert:

| Strategie | Was passieren könnte | Preisschwankungsexposition |
|-----------|---------------------|---------------------------|
| Safe Harbor | 6-10% pro Jahr | Keine |
| Balanced Builder | 10-16% pro Jahr | 40% |
| Wealth Accelerator | Variabel (könnte negativ oder 50%+ sein) | 70% |

**Note:**
> Höheres Renditepotenzial kommt mit unruhigeren Fahrten. Dieser Rechner verwendet Safe Harbor, weil es das ist, was wir jemandem empfehlen würden, der gerade anfängt.

**CTA:**
> Alle 10 Strategien entdecken →

---

## SECTION 5: FAQ

**Header:**
> Fragen zum Rechner

---

**Q: Sind 8% realistisch?**

> Die 8% liegen in der Mitte des erwarteten Bereichs unserer Safe-Harbor-Strategie (6-10% pro Jahr). Wir haben diese Strategie über 4 Jahre echter Marktdaten getestet, einschließlich des Crashs von 2022 und mehrerer kleinerer Einbrüche.
>
> Ist es für die Zukunft garantiert? Nein. Könnte es höher oder niedriger sein? Ja. Aber es basiert auf echten Daten, nicht auf Wunschdenken.
>
> Wir verwenden 8% statt 10%, um konservativ zu sein. Wir möchten lieber, dass Sie angenehm überrascht sind als enttäuscht.

---

**Q: Warum verwenden Sie 0,5% für Banken?**

> Das ist der durchschnittliche Sparzins in der EU. Einige Banken zahlen während Werbeaktionen mehr (vielleicht 1-2%), die meisten zahlen weniger oder gar nichts. Wir verwenden den Durchschnitt, weil das ist, was die meisten Menschen tatsächlich bekommen.
>
> Wenn Ihre Bank mehr zahlt, großartig! Aber selbst bei 2% ist die Lücke zwischen dem, was Sie verdienen, und dem, was möglich ist, immer noch enorm.

---

**Q: Was ist mit Inflation?**

> Dieser Rechner zeigt die tatsächlichen Zahlen, nicht inflationsbereinigt.
>
> Hier ist, warum das wichtig ist:
> - Bei 0,5% verlieren Sie fast sicher jedes Jahr an Kaufkraft. Die Inflation frisst mehr, als Sie verdienen.
> - Bei 8% schlagen Sie wahrscheinlich die Inflation und bauen echtes Vermögen auf.
>
> Die genaue Auswirkung hängt von der zukünftigen Inflation ab, die niemand vorhersagen kann. Aber 8% zu verdienen bringt Sie in eine viel stärkere Position als 0,5% zu verdienen.

---

**Q: Kann ich wirklich mit €5/Monat anfangen?**

> Ja. diBoaS hat kein Minimum über €5 hinaus.
>
> Wir glauben, dass jeder Zugang zu echten Renditen haben sollte, nicht nur Menschen mit Tausenden zum Investieren.
>
> €5/Monat für 20 Jahre bei 8% = ~€2.945
> Das sind ~€1.745 an Erträgen auf €1.200 eingezahlt.
>
> Wenig? Vielleicht. Aber es sind €1.745 mehr als Sie hätten, wenn Sie nichts tun.

---

**Q: Was ist der Unterschied zu meinem Banksparkonto?**

> Drei Hauptunterschiede:
>
> **1. Renditen:** Banken zahlen typischerweise 0,5% oder weniger. Unsere konservativste Strategie zielt auf 6-10%.
>
> **2. Wohin Ihr Geld geht:** Banken verleihen Ihr Geld und behalten die meisten Renditen. Bei diBoaS geht Ihr Geld in Systeme, die Sie direkt bezahlen.
>
> **3. Kontrolle:** Bankeinlagen werden rechtlich zum Geld der Bank (sie schulden Ihnen nur den Betrag). Bei diBoaS bleibt Ihr Geld in Ihrer eigenen Wallet. Wir können es nicht anfassen.
>
> Der Kompromiss? Bankeinlagen sind bis €100.000 versichert. diBoaS-Einlagen sind nicht versichert, obwohl die Systeme, die wir verwenden, seit Jahren Milliarden sicher gesichert haben.

---

## SECTION 6: FINAL CTA

**Header:**
> Bereit, Ihre Zukunft aufzubauen?

**Body:**
> Sie haben die Mathematik gesehen. Sie wissen, was möglich ist.
>
> Die einzige Frage, die bleibt: Wann fangen Sie an?

**Primary CTA:**
> Auf die Warteliste — kostenlos →

**Secondary Text:**
> Jeden Monat, den Sie warten, ist Wachstum, das Sie verpassen.

---

## SECTION 7: FOOTER DISCLAIMERS

**Full Disclaimer:**
> Dieser Rechner bietet nur Projektionen. Die 8%-Rate basiert auf dem erwarteten Performancebereich der Safe-Harbor-Strategie und ist nicht garantiert. Die 0,5%-Bankrate basiert auf EZB-Durchschnittssparzinsen. Tatsächliche Ergebnisse variieren je nach gewählter Strategie, Marktbedingungen und Zeitpunkt der Einzahlungen. Vergangene Wertentwicklung garantiert keine zukünftigen Ergebnisse. Ihr Geld wird in automatisierte Systeme platziert, die technisches Risiko, Marktrisiko und Liquiditätsrisiko tragen. diBoaS ist keine Bank und Ihre Mittel sind nicht versichert. Dies ist keine Finanzberatung.

---

---

# PORTUGUESE-BRAZIL (PT-BR) VERSION

---

## SECTION 1: HERO

**Headline:**
> Conheça seu eu do futuro

**Subheadline:**
> Valores pequenos. Esforço consistente. O tempo faz o resto.
>
> Veja no que seu dinheiro poderia se transformar se trabalhasse tão duro quanto você.

**Context Line:**
> Isso não é uma promessa. É uma projeção baseada em dados históricos. Mas mostra o que é possível quando a matemática finalmente tá do seu lado.

---

## SECTION 2: CALCULATOR

**Header:**
> No que seu dinheiro poderia se transformar?

**Instructions:**
> Arrasta pra definir seu valor mensal. Escolhe o prazo. Vê a matemática funcionar.

---

### Input: Monthly Amount

**Label:**
> Valor mensal que você poderia guardar

**Slider Range:**
> R$5 ←――――――――――――――――→ R$500

**Helper Text:**
> Começa com o que for confortável. Até R$20/mês faz diferença ao longo do tempo.

---

### Input: Timeframe

**Label:**
> Quanto tempo você tá pensando?

**Buttons:**
> [ 5 anos ] [ 10 anos ] [ 15 anos ] [ 20 anos ]

**Helper Text:**
> Quanto maior o prazo, mais poderoso fica o crescimento.

---

### Output: Results Display

**Header:**
> Em [X] anos, seus R$[amount]/mês poderiam virar:

| | Com diBoaS | Com seu banco |
|--|------------|---------------|
| **Valor Final** | R$[diboas_amount] | R$[bank_amount] |
| **Você depositou** | R$[total_deposited] | R$[total_deposited] |
| **Você ganhou** | R$[diboas_earnings] | R$[bank_earnings] |

**Difference Highlight:**
> Isso é **R$[difference] a mais** com o mesmo esforço mensal.
>
> Mesmo sacrifício. Resultado diferente. É isso que acontece quando seu dinheiro trabalha de verdade pra você.

---

### Disclaimer

**Disclaimer Text:**
> Baseado em performance histórica (8% ao ano para diBoaS usando nossa estratégia mais conservadora, 0,5% para poupança típica). Isso é uma projeção, não uma garantia. Resultados reais variam de acordo com a estratégia escolhida e condições de mercado.

---

### CTA

**Primary Button:**
> Entrar na lista pra fazer isso virar realidade →

**Secondary Link:**
> Quer potencial maior? [Conhece todas as 10 estratégias →](/strategies)

---

## SECTION 3: THE MATH EXPLAINED

**Header:**
> Por que a diferença é tão grande

**Intro:**
> Não é mágica. É matemática. Olha o que tá acontecendo de verdade:

---

### Concept 1: A Lacuna do Banco

**Headline:**
> Seu banco ganha mais do que te paga

**Body:**
> Bancos pegam seus depósitos e colocam pra trabalhar — emprestando, investindo, ganhando retornos de verdade. Mas eles só dividem uma fração minúscula com você.
>
> Um banco típico ganha cerca de 7% com seu dinheiro. Te paga 0,5%. Essa diferença de 6,5%? É o modelo de negócio inteiro deles.
>
> Com o diBoaS, você acessa os mesmos tipos de retornos que eles. A lacuna vai pra você.

---

### Concept 2: Rendimentos sobre Rendimentos

**Headline:**
> Seus ganhos começam a ganhar também

**Body:**
> Quando você ganha rendimentos, e esses rendimentos ganham mais rendimentos, o crescimento acelera com o tempo. A 0,5%, isso quase não importa. A 8%, transforma tudo.

**Example:**
> R$100/mês por 20 anos:
> - Total depositado: R$24.000
> - Rendimento no banco: R$1.185 (isso é 5% do que você colocou)
> - Rendimento no diBoaS: R$34.902 (isso é 145% do que você colocou)
>
> A diferença não é 16x a taxa. É 29x o rendimento. É isso que acontece quando rendimentos se multiplicam.

---

### Concept 3: Tempo É Sua Arma

**Headline:**
> Quanto mais você demora pra começar, mais custa

**Body:**
> Começar 5 anos antes com R$100/mês significa dezenas de milhares a mais no final. Cada ano que você atrasa custa crescimento futuro que você nunca vai recuperar.

**Takeaway:**
> O melhor momento pra começar foi anos atrás. O segundo melhor é agora.

---

## SECTION 4: STRATEGY CONNECTION

**Header:**
> Os 8% não são aleatórios

**Body:**
> Essa projeção usa nossa estratégia mais conservadora, chamada Safe Harbor. Ela usa só sistemas estáveis sem exposição a oscilações de preço. No nosso teste de 4 anos, ela nunca perdeu dinheiro.
>
> Se você topa alguns altos e baixos, outras estratégias entregaram retornos maiores:

| Estratégia | O que pode acontecer | Exposição a oscilação de preço |
|------------|---------------------|-------------------------------|
| Safe Harbor | 6-10% ao ano | Nenhuma |
| Balanced Builder | 10-16% ao ano | 40% |
| Wealth Accelerator | Variável (pode ser negativo ou 50%+) | 70% |

**Note:**
> Potencial de retorno maior vem com caminhos mais turbulentos. Esse calculador usa Safe Harbor porque é o que a gente recomendaria pra alguém começando.

**CTA:**
> Conhecer todas as 10 estratégias →

---

## SECTION 5: FAQ

**Header:**
> Perguntas sobre o calculador

---

**Q: 8% é realista?**

> Os 8% estão no meio da faixa esperada da nossa estratégia Safe Harbor (6-10% ao ano). A gente testou essa estratégia em 4 anos de dados reais do mercado, incluindo o crash de 2022 e várias quedas menores.
>
> É garantido pro futuro? Não. Pode ser maior ou menor? Pode. Mas é baseado em dados reais, não em pensamento positivo.
>
> A gente usa 8% em vez de 10% pra ser conservador. A gente prefere que você seja surpreendido positivamente do que decepcionado.

---

**Q: Por que vocês usam 0,5% pra poupança?**

> Esse é o rendimento médio da poupança no Brasil. Alguns bancos pagam mais em CDBs promocionais (talvez 1-2%), a maioria paga poupança mesmo ou menos. A gente usa a média porque é o que a maioria das pessoas realmente recebe.
>
> Se seu banco paga mais, ótimo! Mas mesmo a 2%, a lacuna entre o que você tá ganhando e o que é possível ainda é enorme.

---

**Q: E a inflação?**

> Esse calculador mostra os números reais, não ajustados pela inflação.
>
> Por que isso importa:
> - A 0,5%, você quase certamente tá perdendo poder de compra todo ano. A inflação come mais do que você ganha.
> - A 8%, você provavelmente tá batendo a inflação e construindo patrimônio real.
>
> O impacto exato depende da inflação futura, que ninguém consegue prever. Mas ganhar 8% te coloca numa posição muito mais forte do que ganhar 0,5%.

---

**Q: Dá pra começar mesmo com R$5/mês?**

> Dá. O diBoaS não tem mínimo além de R$5.
>
> A gente acredita que todo mundo deveria ter acesso a rendimentos de verdade, não só quem tem milhares pra investir.
>
> R$5/mês por 20 anos a 8% = ~R$2.945
> Isso é ~R$1.745 de rendimento em R$1.200 depositados.
>
> Pouco? Talvez. Mas é R$1.745 a mais do que você teria sem fazer nada.

---

**Q: Qual a diferença pra minha poupança no banco?**

> Três diferenças principais:
>
> **1. Rendimentos:** Poupança paga tipicamente 0,5% ou menos. Nossa estratégia mais conservadora mira 6-10%.
>
> **2. Pra onde seu dinheiro vai:** Bancos emprestam seu dinheiro e ficam com a maioria dos retornos. No diBoaS, seu dinheiro vai pra sistemas que te pagam diretamente.
>
> **3. Controle:** Depósitos no banco viram dinheiro do banco (legalmente, eles só te devem). No diBoaS, seu dinheiro fica na sua própria carteira. A gente não consegue mexer nele.
>
> O trade-off? Depósitos bancários são segurados até R$250.000 pelo FGC. Depósitos no diBoaS não são segurados, embora os sistemas que a gente usa tenham guardado bilhões com segurança por anos.

---

## SECTION 6: FINAL CTA

**Header:**
> Pronto pra construir seu futuro?

**Body:**
> Você viu a matemática. Sabe o que é possível.
>
> A única pergunta que sobra: quando você começa?

**Primary CTA:**
> Entrar na lista — é grátis →

**Secondary Text:**
> Cada mês que você espera é crescimento que você tá perdendo.

---

## SECTION 7: FOOTER DISCLAIMERS

**Full Disclaimer:**
> Este calculador fornece apenas projeções. A taxa de 8% é baseada na faixa de performance esperada da estratégia Safe Harbor e não é garantida. A taxa de 0,5% é baseada no rendimento médio da poupança brasileira. Resultados reais variam de acordo com a estratégia escolhida, condições de mercado e momento dos depósitos. Resultados passados não garantem resultados futuros. Seu dinheiro é colocado em sistemas automatizados que carregam risco técnico, risco de mercado e risco de liquidez. O diBoaS não é um banco e seus fundos não são segurados. Isto não é conselho financeiro.

**BCB Disclaimer:**
> O diBoaS NÃO é uma instituição financeira autorizada pelo Banco Central do Brasil.

---

---

# SPANISH (ES) VERSION

---

## SECTION 1: HERO

**Headline:**
> Conoce tu yo del futuro

**Subheadline:**
> Cantidades pequeñas. Esfuerzo constante. El tiempo hace el resto.
>
> Mira en qué podría convertirse tu dinero si trabajara tan duro como tú.

**Context Line:**
> Esto no es una promesa. Es una proyección basada en datos históricos. Pero te muestra lo que es posible cuando las matemáticas finalmente están de tu lado.

---

## SECTION 2: CALCULATOR

**Header:**
> ¿En qué podría convertirse tu dinero?

**Instructions:**
> Desliza para establecer tu cantidad mensual. Elige tu plazo. Observa cómo funcionan las matemáticas.

---

### Input: Monthly Amount

**Label:**
> Cantidad mensual que podrías apartar

**Slider Range:**
> €5 ←――――――――――――――――→ €500

**Helper Text:**
> Empieza con lo que te resulte cómodo. Incluso €20/mes suma con el tiempo.

---

### Input: Timeframe

**Label:**
> ¿Cuánto tiempo estás pensando?

**Buttons:**
> [ 5 años ] [ 10 años ] [ 15 años ] [ 20 años ]

**Helper Text:**
> Cuanto más largo sea tu plazo, más poderoso se vuelve el crecimiento.

---

### Output: Results Display

**Header:**
> En [X] años, tus €[amount]/mes podrían convertirse en:

| | Con diBoaS | Con tu banco |
|--|------------|--------------|
| **Valor Final** | €[diboas_amount] | €[bank_amount] |
| **Depositaste** | €[total_deposited] | €[total_deposited] |
| **Ganaste** | €[diboas_earnings] | €[bank_earnings] |

**Difference Highlight:**
> Eso es **€[difference] más** con el mismo esfuerzo mensual.
>
> Mismo sacrificio. Resultado diferente. Eso pasa cuando tu dinero realmente trabaja para ti.

---

### Disclaimer

**Disclaimer Text:**
> Basado en rendimiento histórico (8% anual para diBoaS usando nuestra estrategia más conservadora, 0,5% para ahorro bancario típico). Esto es una proyección, no una garantía. Los resultados reales varían según la estrategia elegida y las condiciones del mercado.

---

### CTA

**Primary Button:**
> Únete a la lista de espera para hacer esto realidad →

**Secondary Link:**
> ¿Quieres mayor potencial? [Explora las 10 estrategias →](/strategies)

---

## SECTION 3: THE MATH EXPLAINED

**Header:**
> Por qué la diferencia es tan grande

**Intro:**
> No es magia. Son matemáticas. Esto es lo que realmente está pasando:

---

### Concept 1: La Brecha Bancaria

**Headline:**
> Tu banco gana más de lo que te paga

**Body:**
> Los bancos toman tus depósitos y los ponen a trabajar — prestando, invirtiendo, obteniendo rendimientos reales. Pero solo comparten una fracción diminuta contigo.
>
> Un banco típico gana alrededor del 7% con tu dinero. Te paga 0,5%. ¿Esa diferencia del 6,5%? Es todo su modelo de negocio.
>
> Con diBoaS, accedes a los mismos tipos de rendimientos que ellos. La brecha va para ti.

---

### Concept 2: Rendimientos sobre Rendimientos

**Headline:**
> Tus ganancias empiezan a ganar también

**Body:**
> Cuando obtienes rendimientos, y esos rendimientos obtienen más rendimientos, el crecimiento se acelera con el tiempo. Al 0,5%, esto apenas importa. Al 8%, lo transforma todo.

**Example:**
> €100/mes durante 20 años:
> - Total depositado: €24.000
> - Ganancias en banco: €1.185 (eso es 5% de lo que pusiste)
> - Ganancias en diBoaS: €34.902 (eso es 145% de lo que pusiste)
>
> La diferencia no es 16x la tasa. Son 29x las ganancias. Eso pasa cuando los rendimientos se multiplican.

---

### Concept 3: El Tiempo Es Tu Arma

**Headline:**
> Cuanto más esperes para empezar, más te costará

**Body:**
> Empezar 5 años antes con €100/mes significa decenas de miles más al final. Cada año que retrasas te cuesta crecimiento futuro que nunca recuperarás.

**Takeaway:**
> El mejor momento para empezar fue hace años. El segundo mejor es ahora.

---

## SECTION 4: STRATEGY CONNECTION

**Header:**
> El 8% no es aleatorio

**Body:**
> Esta proyección usa nuestra estrategia más conservadora, llamada Safe Harbor. Usa solo sistemas estables sin exposición a oscilaciones de precio. En nuestra prueba de 4 años, nunca perdió dinero.
>
> Si te sientes cómodo con algunos altibajos, otras estrategias han entregado rendimientos más altos:

| Estrategia | Lo que podría pasar | Exposición a oscilación de precio |
|------------|--------------------|---------------------------------|
| Safe Harbor | 6-10% por año | Ninguna |
| Balanced Builder | 10-16% por año | 40% |
| Wealth Accelerator | Variable (podría ser negativo o 50%+) | 70% |

**Note:**
> Mayor potencial de rendimiento viene con caminos más turbulentos. Esta calculadora usa Safe Harbor porque es lo que recomendaríamos a alguien que está empezando.

**CTA:**
> Explorar las 10 estrategias →

---

## SECTION 5: FAQ

**Header:**
> Preguntas sobre la calculadora

---

**Q: ¿Es realista el 8%?**

> El 8% está en el medio del rango esperado de nuestra estrategia Safe Harbor (6-10% por año). Probamos esta estrategia en 4 años de datos reales del mercado, incluyendo el crash de 2022 y varias caídas menores.
>
> ¿Está garantizado para el futuro? No. ¿Podría ser mayor o menor? Sí. Pero está basado en datos reales, no en ilusiones.
>
> Usamos 8% en lugar de 10% para ser conservadores. Preferimos que te sorprendas gratamente a que te decepciones.

---

**Q: ¿Por qué usan 0,5% para bancos?**

> Esa es la tasa promedio de ahorro en la UE. Algunos bancos pagan más durante períodos promocionales (quizás 1-2%), la mayoría paga menos o nada. Usamos el promedio porque es lo que la mayoría de la gente realmente recibe.
>
> Si tu banco paga más, ¡genial! Pero incluso al 2%, la brecha entre lo que estás ganando y lo que es posible sigue siendo enorme.

---

**Q: ¿Y la inflación?**

> Esta calculadora muestra los números reales, no ajustados por inflación.
>
> Por qué importa esto:
> - Al 0,5%, casi seguramente estás perdiendo poder adquisitivo cada año. La inflación come más de lo que ganas.
> - Al 8%, probablemente estás superando la inflación y construyendo riqueza real.
>
> El impacto exacto depende de la inflación futura, que nadie puede predecir. Pero ganar 8% te pone en una posición mucho más fuerte que ganar 0,5%.

---

**Q: ¿Puedo empezar realmente con €5/mes?**

> Sí. diBoaS no tiene mínimo más allá de €5.
>
> Creemos que todos deberían tener acceso a rendimientos reales, no solo personas con miles para invertir.
>
> €5/mes durante 20 años al 8% = ~€2.945
> Eso es ~€1.745 en ganancias sobre €1.200 depositados.
>
> ¿Poco? Quizás. Pero son €1.745 más de lo que tendrías sin hacer nada.

---

**Q: ¿Cuál es la diferencia con mi cuenta de ahorro del banco?**

> Tres diferencias principales:
>
> **1. Rendimientos:** Los bancos típicamente pagan 0,5% o menos. Nuestra estrategia más conservadora apunta a 6-10%.
>
> **2. Adónde va tu dinero:** Los bancos prestan tu dinero y se quedan con la mayoría de los rendimientos. Con diBoaS, tu dinero va a sistemas que te pagan directamente.
>
> **3. Control:** Los depósitos bancarios se convierten legalmente en dinero del banco (solo te deben el monto). Con diBoaS, tu dinero permanece en tu propia billetera. No podemos tocarlo.
>
> ¿El trade-off? Los depósitos bancarios están asegurados hasta €100.000. Los depósitos en diBoaS no están asegurados, aunque los sistemas que usamos han asegurado miles de millones de forma segura durante años.

---

## SECTION 6: FINAL CTA

**Header:**
> ¿Listo para construir tu futuro?

**Body:**
> Has visto las matemáticas. Sabes lo que es posible.
>
> La única pregunta que queda: ¿cuándo empiezas?

**Primary CTA:**
> Únete a la lista de espera — es gratis →

**Secondary Text:**
> Cada mes que esperas es crecimiento que estás perdiendo.

---

## SECTION 7: FOOTER DISCLAIMERS

**Full Disclaimer:**
> Esta calculadora proporciona solo proyecciones. La tasa del 8% se basa en el rango de rendimiento esperado de la estrategia Safe Harbor y no está garantizada. La tasa bancaria del 0,5% se basa en las tasas de ahorro promedio del BCE. Los resultados reales varían según la estrategia elegida, las condiciones del mercado y el momento de los depósitos. El rendimiento pasado no garantiza resultados futuros. Tu dinero se coloca en sistemas automatizados que conllevan riesgo técnico, riesgo de mercado y riesgo de liquidez. diBoaS no es un banco y tus fondos no están asegurados. Esto no es asesoramiento financiero.

---

---

# IMPLEMENTATION NOTES

## Calculator Rate Adjustment
- Changed from 9.5% to 8% (middle of Safe Harbor range)
- More conservative projection aligns with CLO guidance
- Users will be pleasantly surprised rather than disappointed

## Terminology Alignment
- Matches Strategies page v2 language
- No jargon: "digital assets," "systems," "annual return"
- Educational tone consistent across pages

## Key Changes from v1
1. Rate lowered to 8% (conservative mid-range)
2. "APY" → "annual return" throughout
3. "Protocol" → "system" throughout  
4. "DeFi" removed entirely
5. "Compound interest" → "returns on returns"
6. Added FGC reference for PT-BR (R$250,000 insurance)
7. Simplified "The Math Explained" section
8. Removed technical implementation details

---

**END OF DOCUMENT**

*CMO Board — diBoaS*
*"Teach first, sell never."*
