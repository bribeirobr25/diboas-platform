I would like to replace the entire marketing website for 2 landing pages. The b2c landing page and the b2b landing page.
The b2c landing page will load when accessing diboas.com and the b2b will load when accessing diboas.com/business

Attention:
- the current entire website should not be deleted. It will be used in the future as the main website.
- For now it should just not load when users are accessing diboas.com, instead the b2c landing page should load.
- Any changes needed for the routing should not delete the previous code, but comment it. This way it will be easier to revert it when needed.

b2c landing page structure mapping with current components and Sections
- Navigation = A new Navigation variant should be created that will render just the logo and the language switcher
- Hero = HerosSection variant HeroFullBackground
- Section 1: The problem = FeatureShowcase variant FeatureShowcaseDefault
- Section 2: How it works = ProductCarousel variant ProductCarouselDefault
- Section 3: Social Proof = BenefitsCards variant BenefitsCardsDefault
- Section 4: Demo Embed = a new Section sis needed. This should be able to embed a page that will have an interactive demo with mocked data
- Section 5: FAQ = FAQAccordion variant FAQAccordionDefault
- Section 6: Final CTA = BgHighlight variant BgHighlightDefault
- Footer = A new Footer variant should be created that will render just the current Footer bottomSection

P.S.:
- For image assets use the assets that could have their names similar to the text content
- For the text use the internationalization system we have build, adding the entire content into a new section. Do not replace any content inside the internationalization files.

# diBoaS B2C Landing Page Content
## Complete Copy for All 4 Locales

---

# ENGLISH (EN) VERSION
## Target: Investment-curious users who feel intimidated by finance

---

### HERO SECTION

**Headline:**
> Your savings are dying. Let's fix that.

**Subheadline:**
> diBoaS turns your idle money into real growth — starting with just €5.

**CTA Button:**
> See how your money could grow →

**Trust Line:**
> Your money stays yours. Withdraw anytime.

**Social Proof:**
> ⭐ Join [X] people on the waitlist

---

### SECTION 1: THE PROBLEM

**Header:**
> 💸 Here's what's happening right now

**Body Copy:**
> Your bank pays you 0.5% interest.
> Inflation is 4%.
> 
> That means your €1,000 savings?
> Worth €965 next year. You're losing €35 by doing nothing.
> 
> The banks make billions with your money.
> You get crumbs.

**CTA:**
> There's a better way →

---

### SECTION 2: HOW IT WORKS

**Header:**
> How diBoaS works — 3 simple steps

**Step 1:**
> **Add €**
> Deposit as little as €5. Takes 2 minutes.

**Step 2:**
> **Earn Yield**
> Your money earns 6-10% automatically.

**Step 3:**
> **Withdraw Anytime**
> Need it back? One tap. Same day. No lock-ups.

**Footer Note:**
> Monthly statements compatible with your accountant.

**CTA:**
> Try it in our demo →

---

### SECTION 3: SOCIAL PROOF

**Header:**
> Join the movement

**Stats:**
> 🚀 [X] people are already on the waitlist
> 📍 People from [X] countries are waiting

**Testimonial Placeholder:**
> "Finally, something that makes sense for people like me who aren't finance experts."
> — Early waitlist member

---

### SECTION 4: DEMO EMBED

**Header:**
> See it in action — try the demo

**Subtext:**
> No signup required. Takes 60 seconds.

[DEMO EMBED HERE]

---

### SECTION 5: FAQ

**Header:**
> Common questions

**Q: Is my money safe?**
> Your funds are held in your own non-custodial wallet. We never touch your money — we just show you where to put it. The protocols we use (Aave, Compound) have secured billions of dollars.

**Q: What are the risks?**
> DeFi yields are not bank deposits. Smart contract risk exists. We only use battle-tested protocols, but no investment is risk-free. Never invest more than you can afford to lose.

**Q: Can I withdraw anytime?**
> Yes. No lock-ups. Your money is always accessible. Withdrawals typically complete same day.

**Q: How do you make money?**
> We take a small fee (0.12%) when you earn. If you don't earn, we don't earn. We're aligned.

**Q: Do I need to understand crypto?**
> No. We handle all the complexity. You just see your money growing. No wallets, no seed phrases, no confusing charts.

---

### SECTION 6: FINAL CTA

**Header:**
> Ready to make your money work?

**Body:**
> Join thousands of people who are done watching their savings lose value.
> 
> Early access opens soon. Get your spot.

**CTA Button:**
> Join the waitlist — it's free →

**Footer:**
> ⏰ You're #[X] in line for early access

---

### RISK DISCLAIMER (Footer)

> *Projected yields shown are illustrative based on current DeFi market rates. Rates are variable and not guaranteed. Past performance does not indicate future results. Your capital is at risk. Start with what you won't miss.*

---

---

# GERMAN (DE) VERSION
## Target: Security-conscious users who need regulatory reassurance

---

### HERO SECTION

**Headline:**
> Ihre Ersparnisse verdienen mehr. Sicher und reguliert.

**Subheadline:**
> diBoaS verwandelt Ihr ungenutztes Geld in echtes Wachstum — ab nur 5 €.

**CTA Button:**
> Sehen Sie, wie Ihr Geld wachsen könnte →

**Trust Line:**
> Ihr Geld bleibt Ihres. Jederzeit abheben.

**Social Proof:**
> ⭐ Schließen Sie sich [X] Menschen auf der Warteliste an

**Regulatory Badge:**
> 🛡️ MiCA-konform | EU-reguliert

---

### SECTION 1: THE PROBLEM

**Header:**
> 💸 Das passiert gerade mit Ihrem Geld

**Body Copy:**
> Ihre Bank zahlt Ihnen 0,5% Zinsen.
> Die Inflation liegt bei 4%.
> 
> Das bedeutet: Ihre 1.000 € Ersparnisse?
> Nächstes Jahr nur noch 965 € wert. Sie verlieren 35 € — einfach so.
> 
> Die Banken verdienen Milliarden mit Ihrem Geld.
> Sie bekommen Krümel.

**CTA:**
> Es gibt einen besseren Weg →

---

### SECTION 2: HOW IT WORKS

**Header:**
> So funktioniert diBoaS — 3 einfache Schritte

**Step 1:**
> **Einzahlen**
> Schon ab 5 €. Dauert nur 2 Minuten.

**Step 2:**
> **Rendite verdienen**
> Ihr Geld verdient automatisch 6-10%.

**Step 3:**
> **Jederzeit abheben**
> Brauchen Sie es zurück? Ein Klick. Noch am selben Tag. Keine Sperrfristen.

**Security Note:**
> 🔒 Ihre Einlagen werden durch geprüfte DeFi-Protokolle gesichert. Vollständige Transparenz.

**CTA:**
> In der Demo ausprobieren →

---

### SECTION 3: TRUST & SECURITY

**Header:**
> Sicherheit, der Sie vertrauen können

**Trust Points:**
> ✓ **EU-Reguliert** — Betrieb unter MiCA-Rahmenwerk
> ✓ **Non-Custodial** — Wir halten nie Ihr Geld
> ✓ **Geprüfte Protokolle** — Nur battle-tested Protokolle mit Milliarden TVL
> ✓ **Transparente Berichterstattung** — Monatliche Auszüge für Ihre Unterlagen

---

### SECTION 4: SOCIAL PROOF

**Header:**
> Werden Sie Teil der Bewegung

**Stats:**
> 🚀 [X] Menschen warten bereits
> 📍 Menschen aus [X] Ländern

---

### SECTION 5: FAQ

**Header:**
> Häufige Fragen

**Q: Ist mein Geld sicher?**
> Ihre Mittel werden in Ihrer eigenen Non-Custodial Wallet gehalten. Wir berühren Ihr Geld nie — wir zeigen Ihnen nur, wo Sie es anlegen können. Die von uns verwendeten Protokolle (Aave, Compound) haben Milliarden von Dollar gesichert.

**Q: Welche Risiken gibt es?**
> DeFi-Renditen sind keine Bankeinlagen. Smart-Contract-Risiken existieren. Wir verwenden nur bewährte Protokolle, aber keine Anlage ist risikofrei. Investieren Sie nie mehr, als Sie sich leisten können zu verlieren.

**Q: Wie sieht es mit der Regulierung aus?**
> Wir operieren unter dem MiCA-Rahmenwerk der EU mit anhängiger CASP-Autorisierung. Volle Compliance-Dokumentation verfügbar.

**Q: Kann ich jederzeit abheben?**
> Ja. Keine Sperrfristen. Ihr Geld ist immer zugänglich. Auszahlungen werden in der Regel am selben Tag abgeschlossen.

**Q: Wie verdient diBoaS Geld?**
> Wir nehmen eine kleine Gebühr (0,12%) auf Ihre Erträge. Wenn Sie nichts verdienen, verdienen wir nichts.

---

### SECTION 6: FINAL CTA

**Header:**
> Bereit, Ihr Geld arbeiten zu lassen?

**Body:**
> Schließen Sie sich Tausenden an, die es satt haben zuzusehen, wie ihre Ersparnisse an Wert verlieren.
> 
> Der frühe Zugang öffnet bald. Sichern Sie sich Ihren Platz.

**CTA Button:**
> Zur Warteliste — kostenlos →

---

### RISK DISCLAIMER (Footer)

> *Dargestellte Renditen sind illustrativ und basieren auf aktuellen DeFi-Marktraten. Renditen sind variabel und nicht garantiert. Vergangene Performance ist kein Indikator für zukünftige Ergebnisse. Ihr Kapital ist gefährdet. Beginnen Sie mit einem Betrag, den Sie nicht vermissen werden.*

---

---

# PORTUGUESE-BRAZIL (PT-BR) VERSION
## Target: PIX users with R$5 — accessibility focus

---

### HERO SECTION

**Headline:**
> E se seu PIX pudesse multiplicar?

**Subheadline:**
> Recebeu um PIX? Faça ele crescer. Comece com apenas R$5.

**CTA Button:**
> Veja seu dinheiro crescer →

**Trust Line:**
> Seu dinheiro é seu. Saque quando quiser.

**Social Proof:**
> ⭐ Junte-se a [X] pessoas na lista de espera

---

### SECTION 1: THE PROBLEM

**Header:**
> 💸 Você sabia disso?

**Body Copy:**
> Seu banco paga 0,5% ao ano.
> A inflação está em 4%.
> 
> Isso significa que seus R$1.000 guardados?
> Valerão R$965 no ano que vem. Você perde R$35 sem fazer nada.
> 
> Os bancos ganham bilhões com seu dinheiro.
> Você recebe migalhas.

**CTA:**
> Existe um jeito melhor →

---

### SECTION 2: HOW IT WORKS

**Header:**
> Como o diBoaS funciona — 3 passos simples

**Step 1:**
> **Deposite via PIX**
> A partir de R$5. Leva 2 minutos.

**Step 2:**
> **Veja crescer**
> Seu dinheiro rende 6-10% ao ano, automaticamente.

**Step 3:**
> **Saque quando quiser**
> Precisa do dinheiro? Um clique. No mesmo dia. Sem carência.

**Highlight:**
> 💡 Até R$5 vira R$5,40 em um ano. Não é sobre o valor. É sobre o hábito.

**CTA:**
> Experimente na demo →

---

### SECTION 3: PIX-NATIVE EXPERIENCE

**Header:**
> Funciona com PIX

**Body:**
> Você já usa PIX todo dia. Agora seu PIX pode render.
> 
> Recebeu pagamento? Faça crescer.
> Recebeu presente? Faça crescer.
> Sobrou um trocado? Faça crescer.

**Visual: PIX logo integration**

---

### SECTION 4: SOCIAL PROOF

**Header:**
> Faça parte do movimento

**Stats:**
> 🚀 [X] pessoas já estão esperando
> 📍 Brasileiros de todos os estados

**Testimonial Placeholder:**
> "Finalmente algo que faz sentido pra quem não é expert em finanças."
> — Membro da lista de espera

---

### SECTION 5: FAQ

**Header:**
> Perguntas frequentes

**Q: Meu dinheiro está seguro?**
> Seus fundos ficam na sua própria carteira não-custodial. Nunca tocamos no seu dinheiro — apenas mostramos onde colocar. Os protocolos que usamos (Aave, Compound) já protegeram bilhões de dólares.

**Q: Quais são os riscos?**
> Rendimentos DeFi não são depósitos bancários. Existe risco de smart contract. Usamos apenas protocolos testados, mas nenhum investimento é livre de risco. Nunca invista mais do que pode perder.

**Q: Posso sacar quando quiser?**
> Sim. Sem carência. Seu dinheiro está sempre acessível. Saques geralmente são processados no mesmo dia.

**Q: Como vocês ganham dinheiro?**
> Cobramos uma pequena taxa (0,12%) sobre seus rendimentos. Se você não ganha, não ganhamos.

**Q: Preciso entender de cripto?**
> Não. Cuidamos de toda a complexidade. Você só vê seu dinheiro crescendo. Sem carteiras complicadas, sem seed phrases, sem gráficos confusos.

**Q: Funciona com PIX?**
> Sim! Depósitos e saques via PIX. Simples assim.

---

### SECTION 6: FINAL CTA

**Header:**
> Pronto pra fazer seu dinheiro trabalhar?

**Body:**
> Junte-se a milhares de pessoas que cansaram de ver suas economias perderem valor.
> 
> O acesso antecipado abre em breve. Garanta seu lugar.

**CTA Button:**
> Entrar na lista de espera — é grátis →

**Highlight:**
> Comece com o que não vai fazer falta. Até R$5. O importante é começar.

---

### RISK DISCLAIMER (Footer)

> *Os rendimentos mostrados são ilustrativos, baseados nas taxas atuais do mercado DeFi. Os rendimentos são variáveis e não garantidos. Desempenho passado não indica resultados futuros. Seu capital está em risco. Comece com um valor que não fará falta.*

---

---

# SPANISH (ES) VERSION
## Target: Aspiring users with small amounts — accessibility focus

---

### HERO SECTION

**Headline:**
> Tu dinero puede crecer. Empieza con €5.

**Subheadline:**
> diBoaS convierte tu dinero inactivo en crecimiento real — desde solo €5.

**CTA Button:**
> Mira cómo puede crecer tu dinero →

**Trust Line:**
> Tu dinero sigue siendo tuyo. Retira cuando quieras.

**Social Proof:**
> ⭐ Únete a [X] personas en la lista de espera

---

### SECTION 1: THE PROBLEM

**Header:**
> 💸 Esto es lo que está pasando ahora mismo

**Body Copy:**
> Tu banco te paga 0,5% de interés.
> La inflación está en 4%.
> 
> Eso significa que tus €1.000 ahorrados?
> Valdrán €965 el próximo año. Estás perdiendo €35 sin hacer nada.
> 
> Los bancos ganan miles de millones con tu dinero.
> Tú recibes migajas.

**CTA:**
> Hay una forma mejor →

---

### SECTION 2: HOW IT WORKS

**Header:**
> Cómo funciona diBoaS — 3 pasos simples

**Step 1:**
> **Deposita**
> Desde tan solo €5. Toma 2 minutos.

**Step 2:**
> **Gana rendimiento**
> Tu dinero gana 6-10% automáticamente.

**Step 3:**
> **Retira cuando quieras**
> ¿Lo necesitas? Un clic. El mismo día. Sin bloqueos.

**Highlight:**
> 💡 Incluso €5 se convierten en €5,40 en un año. No se trata de la cantidad. Se trata del hábito.

**CTA:**
> Pruébalo en la demo →

---

### SECTION 3: ACCESSIBILITY MESSAGE

**Header:**
> Hecho para todos

**Body:**
> No necesitas ser rico para hacer crecer tu dinero.
> No necesitas ser experto en finanzas.
> Solo necesitas empezar.
> 
> Incluso €5 es un comienzo. Lo importante es el primer paso.

---

### SECTION 4: SOCIAL PROOF

**Header:**
> Únete al movimiento

**Stats:**
> 🚀 [X] personas ya están esperando
> 📍 Personas de [X] países

**Testimonial Placeholder:**
> "Por fin algo que tiene sentido para gente como yo que no somos expertos en finanzas."
> — Miembro de la lista de espera

---

### SECTION 5: FAQ

**Header:**
> Preguntas frecuentes

**Q: ¿Mi dinero está seguro?**
> Tus fondos se mantienen en tu propia wallet no-custodial. Nunca tocamos tu dinero — solo te mostramos dónde ponerlo. Los protocolos que usamos (Aave, Compound) han asegurado miles de millones de dólares.

**Q: ¿Cuáles son los riesgos?**
> Los rendimientos DeFi no son depósitos bancarios. Existe riesgo de smart contract. Solo usamos protocolos probados, pero ninguna inversión está libre de riesgo. Nunca inviertas más de lo que puedas permitirte perder.

**Q: ¿Puedo retirar cuando quiera?**
> Sí. Sin bloqueos. Tu dinero siempre está accesible. Los retiros generalmente se completan el mismo día.

**Q: ¿Cómo ganan dinero ustedes?**
> Cobramos una pequeña comisión (0,12%) cuando tú ganas. Si no ganas, nosotros no ganamos. Estamos alineados.

**Q: ¿Necesito entender de cripto?**
> No. Nosotros manejamos toda la complejidad. Tú solo ves tu dinero crecer. Sin wallets, sin seed phrases, sin gráficos confusos.

---

### SECTION 6: FINAL CTA

**Header:**
> ¿Listo para poner tu dinero a trabajar?

**Body:**
> Únete a miles de personas que están cansadas de ver cómo sus ahorros pierden valor.
> 
> El acceso anticipado abre pronto. Reserva tu lugar.

**CTA Button:**
> Únete a la lista de espera — es gratis →

**Highlight:**
> Empieza con lo que no vayas a extrañar. Incluso €5. Lo importante es empezar.

---

### RISK DISCLAIMER (Footer)

> *Los rendimientos mostrados son ilustrativos basados en las tasas actuales del mercado DeFi. Los rendimientos son variables y no están garantizados. El rendimiento pasado no indica resultados futuros. Tu capital está en riesgo. Empieza con lo que no vayas a extrañar.*

---

---

# IMAGE REQUIREMENTS

## Hero Section Images (All Locales)

| Element | Description | Specifications |
|---------|-------------|----------------|
| Hero Background | Abstract gradient or subtle pattern | Light, non-distracting, brand colors |
| Hero Illustration | Person transforming from stressed to confident | Inclusive, diverse representation |

## Section Images

| Section | Image Description | Notes |
|---------|-------------------|-------|
| Problem Section | Visual showing money shrinking (inflation) | Simple, impactful graphic |
| How It Works | 3 simple icons (deposit, grow, withdraw) | Clean, minimalist style |
| Social Proof | User avatars (diverse) | Abstract/illustrated, not real photos |
| Demo Section | Device mockup showing the app | Shows demo in context |

## PT-BR Specific Images

| Element | Description |
|---------|-------------|
| PIX Logo Integration | Official PIX logo alongside diBoaS |
| PIX Notification Mockup | Phone showing PIX receipt notification |

## Trust Badges (DE Version Priority)

| Badge | Description |
|-------|-------------|
| EU Flag | European Union regulation badge |
| Shield Icon | Security certification visual |
| Audit Badge | "Audited Protocols" indicator |

---

# TECHNICAL IMPLEMENTATION NOTES

## i18n Keys Structure

```
hero.headline
hero.subheadline
hero.cta
hero.trust
hero.socialProof

problem.header
problem.body
problem.cta

howItWorks.header
howItWorks.step1.title
howItWorks.step1.description
howItWorks.step2.title
howItWorks.step2.description
howItWorks.step3.title
howItWorks.step3.description
howItWorks.cta

socialProof.header
socialProof.stats.waitlist
socialProof.stats.countries
socialProof.testimonial

demo.header
demo.subtext

faq.header
faq.q1.question
faq.q1.answer
[...continue for all FAQ items]

finalCta.header
finalCta.body
finalCta.button
finalCta.footer

disclaimer.text
```

## Dynamic Elements

| Element | Data Source | Update Frequency |
|---------|-------------|------------------|
| Waitlist Count | Database | Real-time |
| Country Count | Database | Daily |
| Waitlist Position | Session/User | Per signup |
| APY Rates | DeFi API | Daily |

---

# A/B TEST RECOMMENDATIONS

## Headlines to Test

**EN Version:**
- A: "Your savings are dying. Let's fix that." (fear-based)
- B: "What if your money actually worked for you?" (aspirational)

**PT-BR Version:**
- A: "E se seu PIX pudesse multiplicar?" (PIX-native)
- B: "Seu dinheiro parado pode crescer." (direct benefit)

## CTAs to Test

- A: "See how your money could grow →"
- B: "Join [X] people on the waitlist"
- C: "Start with €5 — no risk"

## Tracking Requirements

- Signup conversion rate by locale
- Demo completion rate by locale
- Referral rate by locale
- Time on page by locale
