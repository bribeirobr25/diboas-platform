# diBoaS Interactive Demo
## Flow, Content & Scripts for All Locales

---

# DEMO OVERVIEW

## Purpose
Transform visitors into waitlist signups by letting them *experience* the emotional journey of growing money — before they commit.

## Demo Tool
Implementation following diBoaS guidance and best practices from all documentation inside docs/*

## Duration
60-90 seconds

## Emotional Arc
1. **Pain** — Show what they have now (money losing value)
2. **Hope** — Show what's possible (money growing)
3. **Action** — Show how easy it is (simple deposit)
4. **Reward** — Show the feeling of success (real-time growth)
5. **Invitation** — Convert to waitlist signup

---

# ENGLISH (EN) VERSION

---

## SCREEN 1: THE PAIN
*Emotion: Recognition of problem*

### Visual
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   Your savings today                        │
│                                                             │
│                      €247.52                                │
│                                                             │
│              Interest earned this year: €1.24               │
│                                                             │
│    That's not even a coffee. Your bank keeps the rest.      │
│                                                             │
│                   [ What if...? → ]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Copy
**Header:** Your savings today
**Balance Display:** €247.52
**Subtext:** Interest earned this year: €1.24
**Emotional Hook:** That's not even a coffee. Your bank keeps the rest.
**CTA Button:** What if...? →

### Supademo Hotspot
- Click target: "What if...?" button
- Animation: Subtle pulse on button
- Tooltip: None (let the copy speak)

---

## SCREEN 2: THE HOPE
*Emotion: Curiosity, possibility*

### Visual
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│               What if that money grew?                      │
│                                                             │
│                      €247.52                                │
│                         ↓                                   │
│               In 1 year at 8% APY:                          │
│                      €267.32                                │
│                                                             │
│              That's €19.80 instead of €1.24.                │
│                                                             │
│       Same money. Smarter place. 16x more growth.           │
│                                                             │
│                  [ Show me how → ]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Copy
**Header:** What if that money grew?
**Starting Balance:** €247.52
**Arrow/Transition:** ↓
**Projection Label:** In 1 year at 8% APY:
**Projected Balance:** €267.32
**Comparison:** That's €19.80 instead of €1.24.
**Impact Statement:** Same money. Smarter place. 16x more growth.
**CTA Button:** Show me how →

### Supademo Hotspot
- Click target: "Show me how" button
- Animation: Number transition animation (€247.52 → €267.32)

---

## SCREEN 3: THE ACTION
*Emotion: Empowerment, low barrier*

### Visual
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│             It starts with one deposit                      │
│                                                             │
│               How much do you want to grow?                 │
│                                                             │
│    ┌─────────────────────────────────────────────────┐     │
│    │                    €50                          │     │
│    └─────────────────────────────────────────────────┘     │
│                                                             │
│         [ €5 ]  [ €20 ]  [ €50 ]  [ €100 ]                 │
│                                                             │
│              Select any amount. Start small.                │
│                    No minimums. No judgment.                │
│                                                             │
│                   [ Deposit → ]                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Copy
**Header:** It starts with one deposit
**Prompt:** How much do you want to grow?
**Amount Buttons:** €5 | €20 | €50 | €100
**Reassurance Line 1:** Select any amount. Start small.
**Reassurance Line 2:** No minimums. No judgment.
**CTA Button:** Deposit →

### Supademo Hotspot
- Click target: €50 button (or any amount button)
- Secondary click: "Deposit" button
- Animation: Button selection state change

### Key Design Note
€5 is listed FIRST intentionally — signals accessibility

---

## SCREEN 4: THE REWARD
*Emotion: Delight, success, shareability*

### Visual
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│               🎉 Your money is growing!                     │
│                                                             │
│                      €50.00                                 │
│                        ↓                                    │
│                    €50.0003                                 │
│                        ↓                                    │
│                    €50.0007                                 │
│                        ↓                                    │
│                    €50.0012                                 │
│                                                             │
│      You just earned €0.0012 while reading this.            │
│      Imagine what happens while you sleep.                  │
│                                                             │
│              ─────────────────────────────                  │
│                                                             │
│                "Pretty cool, right? 👀"                     │
│              [ Share this with a friend ]                   │
│                                                             │
│                   [ Continue → ]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Copy
**Header:** 🎉 Your money is growing!
**Animated Counter:** €50.00 → €50.0003 → €50.0007 → €50.0012 (ticking up)
**Delight Line:** You just earned €0.0012 while reading this.
**Vision Line:** Imagine what happens while you sleep.
**Share Prompt:** "Pretty cool, right? 👀"
**Share CTA:** Share this with a friend
**Continue CTA:** Continue →

### Supademo Hotspot
- Primary click target: "Continue" button
- Optional click target: "Share" button
- Animation: Real-time counter ticking up (key emotional moment)

### Share Mechanic (If Clicked)
Pre-populated message options:
- Twitter: "Just tried the @diBoaS demo — watching money grow in real-time is oddly satisfying 👀 [link]"
- WhatsApp: "Check this out — I just watched €50 turn into €50.0012 in like 10 seconds 😂 [link]"
- Copy Link: [demo link with referral code]

---

## SCREEN 5: THE INVITATION
*Emotion: Commitment, anticipation*

### Visual
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          That was a demo. Imagine the real thing.           │
│                                                             │
│     Real money. Real growth. Real control.                  │
│                                                             │
│     We're launching soon. Get early access.                 │
│                                                             │
│     ┌─────────────────────────────────────────────────┐    │
│     │           Enter your email                      │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│              [ Get my spot on the waitlist ]                │
│                                                             │
│                                                             │
│   ✓ No spam, ever                                           │
│   ✓ Early access when we launch                             │
│   ✓ Invite friends = skip the line                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Copy
**Header:** That was a demo. Imagine the real thing.
**Subheader:** Real money. Real growth. Real control.
**Call to Action:** We're launching soon. Get early access.
**Email Placeholder:** Enter your email
**Submit Button:** Get my spot on the waitlist
**Trust Point 1:** ✓ No spam, ever
**Trust Point 2:** ✓ Early access when we launch
**Trust Point 3:** ✓ Invite friends = skip the line

### Supademo Hotspot
- Click target: Email field (simulated input)
- Click target: Submit button
- Animation: Form submission state

---

## POST-SIGNUP: THANK YOU + SHARE
*Emotion: Belonging, motivation to share*

### Visual
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  🎉 You're in!                              │
│                                                             │
│            You're #1,847 on the waitlist                    │
│                                                             │
│                Want to skip the line?                       │
│                                                             │
│   Every friend who joins = you move up 10 spots.            │
│                                                             │
│   ┌─────────────────────────────────────────────────┐      │
│   │  📋 Copy your invite link                       │      │
│   │  diboas.com/invite/ABC123                       │      │
│   └─────────────────────────────────────────────────┘      │
│                                                             │
│   Or share directly:                                        │
│                                                             │
│   [ Twitter ] [ WhatsApp ] [ LinkedIn ] [ Copy Link ]       │
│                                                             │
│   ─────────────────────────────────────────────────────    │
│                                                             │
│   Pre-written message:                                      │
│   "Just signed up for diBoaS — finally a way to make       │
│    my savings actually grow. 8% vs my bank's 0.5%.         │
│    Check it out 👀 [link]"                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Copy
**Header:** 🎉 You're in!
**Position:** You're #[X] on the waitlist
**Incentive Header:** Want to skip the line?
**Incentive Mechanic:** Every friend who joins = you move up 10 spots.
**Link Box Label:** 📋 Copy your invite link
**Link Display:** diboas.com/invite/[CODE]
**Share Label:** Or share directly:
**Share Buttons:** Twitter | WhatsApp | LinkedIn | Copy Link
**Pre-written Message:** "Just signed up for diBoaS — finally a way to make my savings actually grow. 8% vs my bank's 0.5%. Check it out 👀 [link]"

---

---

# GERMAN (DE) VERSION

---

## SCREEN 1: THE PAIN

**Header:** Ihre Ersparnisse heute
**Balance Display:** 247,52 €
**Subtext:** Zinsen dieses Jahr: 1,24 €
**Emotional Hook:** Das reicht nicht mal für einen Kaffee. Den Rest behält Ihre Bank.
**CTA Button:** Was wäre wenn...? →

---

## SCREEN 2: THE HOPE

**Header:** Was wäre, wenn Ihr Geld wachsen würde?
**Starting Balance:** 247,52 €
**Projection Label:** In 1 Jahr bei 8% APY:
**Projected Balance:** 267,32 €
**Comparison:** Das sind 19,80 € statt 1,24 €.
**Impact Statement:** Gleiches Geld. Klügerer Ort. 16x mehr Wachstum.
**CTA Button:** Zeigen Sie mir wie →

---

## SCREEN 3: THE ACTION

**Header:** Es beginnt mit einer Einzahlung
**Prompt:** Wie viel möchten Sie wachsen lassen?
**Amount Buttons:** 5 € | 20 € | 50 € | 100 €
**Reassurance Line 1:** Wählen Sie einen beliebigen Betrag. Fangen Sie klein an.
**Reassurance Line 2:** Kein Mindestbetrag. Keine Bewertung.
**CTA Button:** Einzahlen →

---

## SCREEN 4: THE REWARD

**Header:** 🎉 Ihr Geld wächst!
**Animated Counter:** 50,00 € → 50,0003 € → 50,0007 € → 50,0012 €
**Delight Line:** Sie haben gerade 0,0012 € verdient, während Sie das lesen.
**Vision Line:** Stellen Sie sich vor, was passiert, während Sie schlafen.
**Share Prompt:** "Ziemlich cool, oder? 👀"
**Share CTA:** Mit Freunden teilen
**Continue CTA:** Weiter →

---

## SCREEN 5: THE INVITATION

**Header:** Das war eine Demo. Stellen Sie sich die Realität vor.
**Subheader:** Echtes Geld. Echtes Wachstum. Echte Kontrolle.
**Call to Action:** Wir starten bald. Sichern Sie sich frühen Zugang.
**Email Placeholder:** E-Mail eingeben
**Submit Button:** Meinen Platz auf der Warteliste sichern
**Trust Point 1:** ✓ Kein Spam, niemals
**Trust Point 2:** ✓ Früher Zugang beim Start
**Trust Point 3:** ✓ Freunde einladen = Warteschlange überspringen

---

## POST-SIGNUP

**Header:** 🎉 Sie sind dabei!
**Position:** Sie sind #[X] auf der Warteliste
**Incentive Header:** Möchten Sie vorspringen?
**Incentive Mechanic:** Jeder Freund, der beitritt = Sie rücken 10 Plätze vor.
**Pre-written Message:** "Gerade bei diBoaS angemeldet — endlich eine Möglichkeit, meine Ersparnisse wachsen zu lassen. 8% statt 0,5% bei meiner Bank. Schau mal 👀 [link]"

---

---

# PORTUGUESE-BRAZIL (PT-BR) VERSION
## PIX-Native Experience

---

## SCREEN 1: THE PIX MOMENT
*Unique to Brazil — starts with PIX notification*

### Visual
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              📱 Você recebeu um PIX                         │
│                                                             │
│                      R$ 150,00                              │
│                   de: Maria Silva                           │
│                                                             │
│   Esse dinheiro vai ficar parado na sua conta.              │
│   Ou... pode começar a crescer.                             │
│                                                             │
│              [ Fazer esse PIX crescer → ]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Copy
**Header:** 📱 Você recebeu um PIX
**Amount:** R$ 150,00
**Sender:** de: Maria Silva
**Emotional Hook Line 1:** Esse dinheiro vai ficar parado na sua conta.
**Emotional Hook Line 2:** Ou... pode começar a crescer.
**CTA Button:** Fazer esse PIX crescer →

---

## SCREEN 2: THE HOPE

**Header:** E se esse PIX pudesse multiplicar?
**Starting Balance:** R$ 150,00
**Projection Label:** Em 1 ano com 8% ao ano:
**Projected Balance:** R$ 162,00
**Comparison:** São R$12,00 ao invés de R$0,75 do banco.
**Impact Statement:** Mesmo dinheiro. Lugar mais inteligente. 16x mais rendimento.
**CTA Button:** Me mostra como →

---

## SCREEN 3: THE ACTION

**Header:** Começa com um depósito
**Prompt:** Quanto você quer fazer crescer?
**Amount Buttons:** R$5 | R$20 | R$50 | R$100
**Reassurance Line 1:** Escolha qualquer valor. Comece pequeno.
**Reassurance Line 2:** Sem mínimo. Sem julgamento.
**CTA Button:** Depositar →

### Key Note
Include PIX logo next to deposit button

---

## SCREEN 4: THE REWARD

**Header:** 🎉 Seu dinheiro está crescendo!
**Animated Counter:** R$50,00 → R$50,0003 → R$50,0007 → R$50,0012
**Delight Line:** Você acabou de ganhar R$0,0012 enquanto lia isso.
**Vision Line:** Imagina o que acontece enquanto você dorme.
**Share Prompt:** "Bem legal, né? 👀"
**Share CTA:** Compartilha com um amigo
**Continue CTA:** Continuar →

---

## SCREEN 5: THE INVITATION

**Header:** Isso foi uma demo. Imagina de verdade.
**Subheader:** Dinheiro de verdade. Crescimento de verdade. Controle de verdade.
**Call to Action:** Vamos lançar em breve. Garanta seu acesso antecipado.
**Email Placeholder:** Digite seu email
**Submit Button:** Garantir meu lugar na fila
**Trust Point 1:** ✓ Sem spam, nunca
**Trust Point 2:** ✓ Acesso antecipado no lançamento
**Trust Point 3:** ✓ Convide amigos = pule a fila

---

## POST-SIGNUP

**Header:** 🎉 Você está dentro!
**Position:** Você é o #[X] na lista de espera
**Incentive Header:** Quer pular a fila?
**Incentive Mechanic:** Cada amigo que entrar = você sobe 10 posições.
**Pre-written Message:** "Acabei de entrar na lista do diBoaS — finalmente um jeito de fazer meu dinheiro render de verdade. 8% ao ano vs 0,5% do banco. Dá uma olhada 👀 [link]"

### WhatsApp Share (Primary for Brazil)
"Mano, olha isso — coloquei R$50 e já tá rendendo mais que a poupança 😂 [link]"

---

---

# SPANISH (ES) VERSION

---

## SCREEN 1: THE PAIN

**Header:** Tus ahorros hoy
**Balance Display:** €247,52
**Subtext:** Intereses ganados este año: €1,24
**Emotional Hook:** Eso no alcanza ni para un café. Tu banco se queda con el resto.
**CTA Button:** ¿Y si...? →

---

## SCREEN 2: THE HOPE

**Header:** ¿Y si ese dinero creciera?
**Starting Balance:** €247,52
**Projection Label:** En 1 año al 8% APY:
**Projected Balance:** €267,32
**Comparison:** Son €19,80 en lugar de €1,24.
**Impact Statement:** Mismo dinero. Lugar más inteligente. 16x más crecimiento.
**CTA Button:** Muéstrame cómo →

---

## SCREEN 3: THE ACTION

**Header:** Empieza con un depósito
**Prompt:** ¿Cuánto quieres hacer crecer?
**Amount Buttons:** €5 | €20 | €50 | €100
**Reassurance Line 1:** Elige cualquier cantidad. Empieza pequeño.
**Reassurance Line 2:** Sin mínimos. Sin juicios.
**Highlight:** 💡 Incluso €5 se convierten en €5,40 en un año. No es la cantidad. Es el hábito.
**CTA Button:** Depositar →

---

## SCREEN 4: THE REWARD

**Header:** 🎉 ¡Tu dinero está creciendo!
**Animated Counter:** €50,00 → €50,0003 → €50,0007 → €50,0012
**Delight Line:** Acabas de ganar €0,0012 mientras leías esto.
**Vision Line:** Imagina lo que pasa mientras duermes.
**Share Prompt:** "Bastante genial, ¿no? 👀"
**Share CTA:** Comparte con un amigo
**Continue CTA:** Continuar →

---

## SCREEN 5: THE INVITATION

**Header:** Eso fue una demo. Imagina lo real.
**Subheader:** Dinero real. Crecimiento real. Control real.
**Call to Action:** Lanzamos pronto. Consigue acceso anticipado.
**Email Placeholder:** Ingresa tu email
**Submit Button:** Reservar mi lugar en la lista
**Trust Point 1:** ✓ Sin spam, nunca
**Trust Point 2:** ✓ Acceso anticipado en el lanzamiento
**Trust Point 3:** ✓ Invita amigos = salta la fila

---

## POST-SIGNUP

**Header:** 🎉 ¡Estás dentro!
**Position:** Eres el #[X] en la lista de espera
**Incentive Header:** ¿Quieres adelantarte?
**Incentive Mechanic:** Cada amigo que se una = avanzas 10 lugares.
**Pre-written Message:** "Acabo de registrarme en diBoaS — por fin una forma de hacer crecer mis ahorros de verdad. 8% vs el 0,5% del banco. Échale un vistazo 👀 [link]"

---

---

# TECHNICAL IMPLEMENTATION

## Demo Configuration

### Demo Settings
- **Duration Target:** 60-90 seconds
- **Auto-advance:** Off (user-controlled)
- **Progress Bar:** Subtle, bottom of screen
- **Branding:** diBoaS logo, top-left
- **Exit Option:** Small X, top-right

### Hotspot Styling
- **Click Targets:** Subtle pulse animation
- **Tooltips:** Minimal, only where needed
- **Transitions:** Smooth fade (300ms)

### Counter Animation (Screen 4)
- **Type:** Incrementing number
- **Speed:** Increment every 2-3 seconds
- **Format:** 4 decimal places
- **Effect:** Creates "real-time" feeling

## Analytics Events

| Event | Screen | Trigger |
|-------|--------|---------|
| demo_start | 1 | Demo loaded |
| demo_screen_2 | 2 | Clicked "What if?" |
| demo_screen_3 | 3 | Clicked "Show me how" |
| demo_amount_select | 3 | Clicked amount button |
| demo_deposit_click | 3 | Clicked "Deposit" |
| demo_screen_4 | 4 | Reached reward screen |
| demo_share_click | 4 | Clicked share option |
| demo_screen_5 | 5 | Reached signup screen |
| demo_signup_start | 5 | Clicked email field |
| demo_signup_complete | 5 | Form submitted |
| demo_exit | Any | Closed demo early |

## Exit Points & Recovery

| Exit Point | Recovery Action |
|------------|-----------------|
| Screen 1-2 | Show tooltip: "Wait! See how your money could grow →" |
| Screen 3 | Show tooltip: "You're almost there!" |
| Screen 4 | No recovery (they've seen the magic) |
| Screen 5 | Exit intent popup with simplified signup |

## A/B Test Variants

### Screen 1 Variants
- **A:** Bank balance (current)
- **B:** "Your €247 last year → Your €247 today" (inflation visual)

### Screen 4 Variants
- **A:** Share prompt at bottom
- **B:** Share prompt as overlay after 5 seconds

### Screen 5 Variants
- **A:** Email only
- **B:** Email + name
- **C:** Email + "What's your savings goal?" dropdown
