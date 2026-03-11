# diBoaS LIVE SITE — FIX PLAN

**Date:** March 11, 2026
**Created by:** Copywriter Board + CEO (Bar)
**CTO Review:** Incorporated — March 11, 2026
**Status:** Ready for tech team execution
**Note:** All copy changes include all 4 locales (EN, DE, ES, PT-BR), localized for economics, linguistics, and cultural context — not 1:1 translations.

**Changes after CTO review:**
- FIX-03 removed (no bug — inline confirmation is intended UX, per CEO + CTO)
- Phase 1 split into **1a** (quick string fixes, ~6-8h) and **1b** (page builds, ~5-6h)
- CTO notes added to FIX-07 (dry run requirement), FIX-08 (missing disclosure keys), FIX-10 (fee structure context), FIX-11 (CSS breakpoint check), FIX-12 (PT-BR maquininha rates)

---

## PHASE 1a: QUICK STRING FIXES (~3-4 hours)

> Ship fast. These are all i18n string changes and minor CSS verifications.

### FIX-01 | P0 | Missing i18n String — Goal Keeper Strategy Card

**What's wrong:** The Goal Keeper strategy card displays raw i18n key `marketing.pages.strategies.strategies.goalKeeper.description2` instead of actual text. Visible on ALL 4 locales on the Strategies page.

**Affected pages:** `/en/strategies`, `/de/strategies`, `/es/strategies`, `/pt-BR/strategies`

**Action:** Add the missing translation string to all four locale JSON files. Content should be the second paragraph of the Goal Keeper description from the approved Strategies copy document.

**Files to update:** `en/strategies.json`, `de/strategies.json`, `es/strategies.json`, `pt-BR/strategies.json`

**Copy:**

| Locale | Key | Value |
|--------|-----|-------|
| EN | `marketing.pages.strategies.strategies.goalKeeper.description2` | Saving for something in the next 2 years? A trip, a wedding, a car? This keeps every dollar working toward your deadline without risking it. |
| DE | `marketing.pages.strategies.strategies.goalKeeper.description2` | Sparst du für etwas in den nächsten 2 Jahren? Eine Reise, eine Hochzeit, ein Auto? Hier arbeitet jeder Euro auf dein Ziel hin, ohne ihn zu riskieren. |
| ES | `marketing.pages.strategies.strategies.goalKeeper.description2` | ¿Estás ahorrando para algo en los próximos 2 años? ¿Un viaje, una boda, un coche? Aquí cada euro trabaja hacia tu objetivo sin ponerlo en riesgo. |
| PT-BR | `marketing.pages.strategies.strategies.goalKeeper.description2` | Guardando pra algo nos próximos 2 anos? Uma viagem, um casamento, um carro? Aqui cada real trabalha pro seu objetivo sem colocar ele em risco. |

**Effort:** 15 min
**Priority:** P0 — users see broken copy

---

### FIX-02 | P0 | Terms of Use — Geographic Restriction Contradicts GTM

**What's wrong:** Terms of Use Section 4 states: "diBoaS services are not available to residents of: United States, Brazil." But all marketing pages target US, EU, and Brazil. The waitlist accepts signups from these regions. There is no geo-blocking.

**Affected pages:** `/en/legal/terms` (and all locale equivalents)

**Action:** Replace Section 4 geographic restriction with a pre-launch disclaimer. **CLO MUST REVIEW AND APPROVE before deployment.**

**Proposed replacement copy (CLO-pending):**

| Locale | Content |
|--------|---------|
| EN | **4. Geographic Availability** diBoaS is currently in pre-launch. When services become available, they will initially be offered to users in the United States, European Union, and Brazil. Availability in other regions will be announced as we expand. During the pre-launch period, the website and waitlist are accessible worldwide. Certain features or services may be restricted in jurisdictions where they are not permitted under local law, including countries subject to international sanctions. You are responsible for determining whether your use of this interface complies with applicable laws in your jurisdiction. |
| DE | **4. Geografische Verfügbarkeit** diBoaS befindet sich derzeit in der Pre-Launch-Phase. Wenn die Dienste verfügbar werden, werden sie zunächst Nutzern in den Vereinigten Staaten, der Europäischen Union und Brasilien angeboten. Die Verfügbarkeit in weiteren Regionen wird bekannt gegeben, sobald wir expandieren. Während der Pre-Launch-Phase sind die Website und die Warteliste weltweit zugänglich. Bestimmte Funktionen oder Dienste können in Ländern eingeschränkt sein, in denen sie nach geltendem Recht nicht zulässig sind, einschließlich Länder, die internationalen Sanktionen unterliegen. Du bist dafür verantwortlich, sicherzustellen, dass deine Nutzung dieser Plattform mit den geltenden Gesetzen deines Landes vereinbar ist. |
| ES | **4. Disponibilidad Geográfica** diBoaS se encuentra actualmente en fase de prelanzamiento. Cuando los servicios estén disponibles, se ofrecerán inicialmente a usuarios en Estados Unidos, la Unión Europea y Brasil. La disponibilidad en otras regiones se anunciará a medida que nos expandamos. Durante el periodo de prelanzamiento, el sitio web y la lista de espera son accesibles a nivel mundial. Ciertas funciones o servicios pueden estar restringidos en jurisdicciones donde no están permitidos por la legislación local, incluidos los países sujetos a sanciones internacionales. Eres responsable de determinar si tu uso de esta plataforma cumple con las leyes aplicables en tu jurisdicción. |
| PT-BR | **4. Disponibilidade Geográfica** O diBoaS está atualmente em fase de pré-lançamento. Quando os serviços estiverem disponíveis, serão oferecidos inicialmente para usuários nos Estados Unidos, União Europeia e Brasil. A disponibilidade em outras regiões será anunciada conforme expandirmos. Durante o período de pré-lançamento, o site e a lista de espera estão acessíveis mundialmente. Certas funcionalidades ou serviços podem ser restritos em jurisdições onde não são permitidos pela legislação local, incluindo países sujeitos a sanções internacionais. Você é responsável por determinar se o uso desta plataforma está em conformidade com as leis aplicáveis na sua jurisdição. |

**Effort:** 30 min (copy replacement) + CLO review time
**Priority:** P0 — legal contradiction
**Blocker:** CLO approval required before deployment

---

### ~~FIX-03~~ | REMOVED

> **CEO + CTO Decision:** No bug. The waitlist confirms inline via the WaitlistConfirmation component replacing the form — no redirect, no new page. Nothing in the codebase links to `/waitlist/success`. A 404 on a URL nobody visits is not a fix worth spending time on. Removed from plan.

---

### FIX-04 | P1 | "Expanding Worldwide" — All Pages, All Locales

**What's wrong:** B2C founder section says "Brazil and expanding Worldwide." B2B says "Brazil first." These need to match. CEO decision: all pages use "expanding Worldwide."

**Affected pages:** B2C founder section (all locales), B2B founder section (all locales)

**⚠️ CLO FLAG:** "Expanding Worldwide" is a forward-looking claim for a pre-launch platform. Flagged for CLO awareness. CEO approved.

**Copy changes:**

B2C founder section — no change needed (already says "expanding Worldwide").

B2B founder section — change "Brazil first" to "expanding Worldwide":

| Locale | Current | New |
|--------|---------|-----|
| EN | building for businesses in the US, EU, and Brazil first. | building for businesses in the US, EU, Brazil and expanding Worldwide. |
| DE | für Unternehmen in den USA, der EU und Brasilien baut. | für Unternehmen in den USA, der EU, Brasilien baut und weltweit expandiert. |
| ES | construyendo para negocios en EE.UU., la UE y Brasil primero. | construyendo para negocios en EE.UU., la UE, Brasil y expandiéndose a nivel mundial. |
| PT-BR | construindo para negócios nos EUA, UE e Brasil primeiro. | construindo para negócios nos EUA, UE, Brasil e expandindo mundialmente. |

**Tech note:** Verify all 4 B2C locales already have "expanding Worldwide" — if any are missing, add them using the same localized phrasing.

**Effort:** 15 min
**Priority:** P1

---

### FIX-05 | P1 | Buy and Hold Card — Update to Agreed Copy

**What's wrong:** Live card says "Buy crypto directly. Hold it in your own wallet. No middleman. No custody risk. Yours." Agreed version was different — includes specific assets and Stocks/Gold coming soon.

**Affected pages:** B2C landing page carousel (all locales)

**Copy — Subtitle:**

| Locale | New subtitle |
|--------|-------------|
| EN | Buy digital assets and hold them in your own wallet. Starting with BTC, ETH, and SOL. Stocks and Gold coming soon. |
| DE | Kaufe digitale Vermögenswerte und verwahre sie in deiner eigenen Wallet. Beginnend mit BTC, ETH und SOL. Aktien und Gold folgen bald. |
| ES | Compra activos digitales y guárdalos en tu propia billetera. Empezando con BTC, ETH y SOL. Acciones y Oro próximamente. |
| PT-BR | Compre ativos digitais e guarde na sua própria carteira. Começando com BTC, ETH e SOL. Ações e Ouro em breve. |

**Copy — Quote:**

| Locale | New quote |
|--------|-----------|
| EN | "Your assets. Your wallet. Your timing. Buy what you want, sell when you're ready." |
| DE | "Deine Vermögenswerte. Deine Wallet. Dein Timing. Kauf was du willst, verkauf wann du willst." |
| ES | "Tus activos. Tu billetera. Tu momento. Compra lo que quieras, vende cuando quieras." |
| PT-BR | "Seus ativos. Sua carteira. Seu tempo. Compre o que quiser, venda quando quiser." |

**Effort:** 20 min
**Priority:** P1

---

### FIX-06 | P1 | "← likely" Badge — Translate in DE/ES/PT-BR

**What's wrong:** B2B calculator scenario card badge shows "← likely" in English on all locales.

**Affected pages:** B2B landing page calculator (DE, ES, PT-BR)

**Copy:**

| Locale | Current | New |
|--------|---------|-----|
| EN | ← likely | ← likely (no change) |
| DE | ← likely | ← wahrscheinlich |
| ES | ← likely | ← probable |
| PT-BR | ← likely | ← provável |

**Effort:** 5 min
**Priority:** P1

---

### FIX-07 | P1 | Strategy Names — English Everywhere

**What's wrong:** Strategy names are fully translated in DE/ES/PT-BR (e.g., "Sicherer Hafen," "Puerto Seguro," "Porto Seguro"). CEO decision: use English names across all pages, all locales.

**Affected pages:** Strategies page, Protocols page ("Used in" labels), and any B2C/B2B/About references across DE, ES, PT-BR.

**Scope:** This is a large change. Every occurrence of a translated strategy name must revert to English. The 10 strategy names:

| English (use everywhere) | Current DE | Current ES | Current PT-BR |
|-------------------------|------------|------------|---------------|
| Safe Harbor | Sicherer Hafen | Puerto Seguro | Porto Seguro |
| Stable Growth | Stabiles Wachstum | Crecimiento Estable | Crescimento Estável |
| Goal Keeper | Torhüter | Portero | Goleiro |
| Steady Progress | Beständiger Fortschritt | Avance Firme | Progresso Firme |
| Patient Builder | Geduldiger Aufbauer | Constructor Paciente | Construtor Paciente |
| Balanced Builder | Ausgewogener Aufbauer | Constructor Equilibrado | Construtor Equilibrado |
| Steady Compounder | Stetige Komposition | Composición Constante | Composição Constante |
| Wealth Accelerator | Vermögensturbo | Acelerador de Patrimonio | Acelerador de Patrimônio |
| Yield Maximizer | Rendite-Maximierer | Maximizador de Retorno | Maximizador de Retorno |
| Full Throttle | Volle Kraft | A Toda Potencia | Potência Máxima |

**Action:**
1. **Dry run first (CTO requirement):** Global search for each translated name across ALL JSON and config files — not just strategies.json but also protocols, B2C/B2B carousel configs, and any hardcoded component config files. List every occurrence before changing anything.
2. Replace with English name in all found locations
3. Verify Strategies page grid, strategy cards, strategy detail sections, Protocols page "Used in" labels
4. Check B2C carousel if any strategy names appear there
5. **Second pass:** Verify no translated names remain by searching again

**Estimated string changes:** ~60-80 across 3 locales

**Effort:** 2-3 hours
**Priority:** P1

---

### FIX-08 | P1 | Shared Footer — All Pages Identical

**What's wrong:** About page footer is missing disclaimers that B2C/B2B have (MiCA Art. 68, educational disclaimer). Other pages may also have inconsistencies.

**Action:** Ensure ALL consumer-facing pages use the identical shared footer component with the full set of disclaimers.

**Pages to verify and fix:**
- `/about` (all locales) — confirmed missing disclaimers
- `/strategies` (all locales) — verify
- `/protocols` (all locales) — verify
- `/daily-market` (all locales) — verify
- `/help` (all locales) — verify
- `/security` (all locales) — verify

**Required footer content (all pages, all locales):**
1. Educational disclaimer ("This content is for educational purposes only...")
2. MiCA Art. 68 (EN/DE/ES only — NOT PT-BR)
3. MiCA Art. 7 (EN/DE/ES only — NOT PT-BR)
4. US Disclosure (EN only, or all locales if US users may see other locales)
5. AI Disclosure (all locales)
6. Testimonials disclaimer (pages with quotes/testimonials)
7. PT-BR: CVM 3-Warning INSTEAD of MiCA (see FIX-13)

**CTO note:** B2C has 10 disclosure keys (`general`, `crypto`, `stories`, `ai`, `closing`, `mica`, `micaArticle7`, `cvm`, `bcb`, `us`). About page only has 5 (`mica`, `micaArticle7`, `ai`, `cvm`, `us`) — missing `general`, `crypto`, `stories`, `closing`, `bcb`. Strategies already uses B2C_FOOTER_DISCLOSURES (confirmed). Also verify: protocols, help, security, and daily-market pages.

**Effort:** 30 min (if shared component exists and just needs wiring)
**Priority:** P1

---

### FIX-09 | P1 | "Real People" Personas — Migration Bug (DE/ES/PT-BR)

**What's wrong:** When the component was changed, locale-specific persona text was only migrated for EN. DE/ES/PT-BR show EN-style generic personas instead of their culturally localized versions (e.g., DE should show "Geld an deinen Bruder in der Türkei," PT-BR should show locale-appropriate scenarios). The correct text exists somewhere in the existing i18n files.

**Affected pages:** B2C landing page "Real People. Real Moments" section (DE, ES, PT-BR)

**Action:**
1. Find the correct persona text in the existing i18n files (it was in the previous component's strings)
2. Wire it into the current component's i18n keys
3. EN is the reference — it has the correct personas for its locale

**Effort:** 30 min (find + wire existing strings)
**Priority:** P1

---

### FIX-10 | P1 | Buy Fee Tooltip — Predemo Bug

**What's wrong:** In the predemo buy asset flow, the diBoaS fee correctly shows $0. But when expanding the fee explanation tooltip, it says: "diBoaS charges 0.39% to invest (minimum $0.25, maximum $25). Free for buying BTC and Gold." This contradicts the $0 fee shown. Should match the send money tooltip pattern.

**Affected pages:** Demo/Predemo buy asset flow (all locales)

**i18n key:** `preDemo.fees.tooltips.diboasFeeBuy`

**Copy:**

| Locale | Current | New |
|--------|---------|-----|
| EN | diBoaS charges 0.39% to invest (minimum $0.25, maximum $25). Free for buying BTC and Gold. | diBoaS does not charge for buying digital assets. |
| DE | (check current) | diBoaS berechnet keine Gebühren für den Kauf von digitalen Vermögenswerten. |
| ES | (check current) | diBoaS no cobra por la compra de activos digitales. |
| PT-BR | (check current) | O diBoaS não cobra pela compra de ativos digitais. |

**CTO note:** The 0.39% applies to *selling/closing*, not buying — confirmed per fee structure. Also verify the 0.39% text isn't appearing elsewhere in the PreDemo where it shouldn't (buying flows should show $0 only).

**Effort:** 10 min
**Priority:** P1

---

### FIX-11 | P1 | Double "Try Demo" Button in Nav

**What's wrong:** "Try Demo" appears twice in the navigation — once for mobile and once for desktop. On some viewports both may be visible.

**Action:** Tech team to verify and ensure only one CTA is visible at any viewport width.

**CTO note:** Checked the MinimalNavigation component — there are two buttons: one in `minimal-nav-mobile-center` (`flex md:hidden` — mobile only) and one in `minimal-nav-cta-desktop` (`hidden md:inline-flex` — desktop only). These *should* be mutually exclusive. If the copywriter saw both visible, it may be a specific viewport edge case or CSS loading delay. **Check at exactly 768px width** to verify the breakpoint transition is clean — there may be a 1px gap where both show.

**Effort:** 15 min
**Priority:** P1 (included per CEO)

---

### FIX-12 | P1 | B2B Fee Table — Add "Difference" Column

**What's wrong:** B2C fee table has a "Difference" column showing savings per action (e.g., "Save $60 to $180/year"). B2B fee table doesn't have this column, missing a key trust signal for business buyers.

**Action:** Add "Difference" column to B2B fee table matching the B2C pattern. All 4 locales.

**Copy — Difference column values (EN):**

| Action | Difference |
|--------|-----------|
| Business Account | Save $120 to $600/year |
| Receive Payments | Save $20 to $30 per $1,000 |
| Send / Pay | Save $1.50 to $50 per transfer |
| Add Money | Comparable to most providers |
| Invest / Grow | Save $50 to $200 per $10,000 |
| Sell / Close | Save $11 to $161 per $10,000 |
| Swap | Save $50 to $200 per $10,000 |
| Cash Out | Save $52 to $252 per $10,000 |

**Note:** DE/ES versions should use EUR. PT-BR should use R$ with Brazil-appropriate figures.

**CTO note:** For PT-BR, compare against *maquininha* rates (2-5%), NOT EU card processing rates (1.5-3%). The comparison must reflect local fee structures. Tech team: adapt the B2C difference column pattern to B2B-scale examples ($10,000 not $100).

**Effort:** 1 hour (copy + implementation across 4 locales)
**Priority:** P1 (included per CEO)

---

### FIX-13 | P1 | PT-BR CVM 3-Warning Verification

**What's wrong:** Need to verify that the CVM 3-warning appears in the footer on ALL PT-BR pages, and that MiCA text does NOT appear on PT-BR pages.

**CVM 3-Warning text (PT-BR only):**
1. Retornos passados não são garantia de retorno futuro
2. Investimentos envolvem riscos e podem ensejar perdas, inclusive da totalidade do capital investido
3. Percentuais prospectivos refletem apenas a opinião do autor, com base em informações disponíveis à época e consideradas confiáveis

**Action:** Check every PT-BR page footer. If CVM warnings are missing or MiCA text appears, fix it.

**Pages to verify:** B2C, B2B, About, Strategies, Protocols, Demo, Help, Security, Adelaide Daily

**Effort:** 20 min verification + fix time
**Priority:** P1

---

### FIX-14 | P1 | Protocols Page — Category Transition Hooks

**What's wrong:** 26 protocol cards across 7 categories with no transition text between categories. Creates scanning fatigue.

**Action:** Add one-line transition hooks before each category heading (except Category 1, which is the first and doesn't need one).

**Copy:**

| Before Category | EN | DE | ES | PT-BR |
|----------------|----|----|----|----|
| 2. Staking | Lending is one way your money earns. Here's another. | Verleihen ist eine Möglichkeit. Hier ist eine andere. | Prestar es una forma de generar rendimiento. Aquí hay otra. | Emprestar é uma forma de render. Aqui vai outra. |
| 3. Stablecoins | These systems create the stable assets that other protocols use. | Diese Systeme schaffen die stabilen Vermögenswerte, die andere Protokolle nutzen. | Estos sistemas crean los activos estables que otros protocolos utilizan. | Esses sistemas criam os ativos estáveis que outros protocolos usam. |
| 4. Yield/Trading | Systems that actively manage or trade your assets. | Systeme, die deine Vermögenswerte aktiv verwalten oder handeln. | Sistemas que gestionan o negocian activamente tus activos. | Sistemas que gerenciam ou negociam seus ativos ativamente. |
| 5. Perpetual | Higher risk, higher potential reward. Read carefully. | Höheres Risiko, höheres Renditepotenzial. Lies aufmerksam. | Mayor riesgo, mayor potencial de recompensa. Lee con atención. | Maior risco, maior potencial de retorno. Leia com atenção. |
| 6. DEX | Exchange protocols let assets move between systems. | Tauschprotokolle ermöglichen den Austausch von Vermögenswerten zwischen Systemen. | Los protocolos de intercambio permiten mover activos entre sistemas. | Protocolos de troca permitem que ativos se movam entre sistemas. |
| 7. Payment/RWA | The bridge between traditional finance and crypto. | Die Brücke zwischen traditionellem Finanzwesen und Krypto. | El puente entre las finanzas tradicionales y crypto. | A ponte entre o sistema financeiro tradicional e crypto. |

**Effort:** 30 min
**Priority:** P1

---

### FIX-15 | P1 | About Page Contact — Replace bar@ with hello@

**What's wrong:** About page contact section shows bar@diboas.com. CEO decision: replace with hello@diboas.com only.

**Action:** Change the mailto link and display text from bar@diboas.com to hello@diboas.com. Update the personal line accordingly.

**Copy:**

| Locale | Current | New |
|--------|---------|-----|
| EN | Questions? I read every email. bar@diboas.com | Questions? I read every email. hello@diboas.com |
| DE | Fragen? Ich lese jede E-Mail. bar@diboas.com | Fragen? Ich lese jede E-Mail. hello@diboas.com |
| ES | ¿Preguntas? Leo cada email. bar@diboas.com | ¿Preguntas? Leo cada email. hello@diboas.com |
| PT-BR | Perguntas? Eu leio cada email. bar@diboas.com | Perguntas? Eu leio cada email. hello@diboas.com |

**Effort:** 5 min
**Priority:** P1

---

### FIX-16 | P2 | Demo Page — Add noindex Meta Tag

**Action:** Add `<meta name="robots" content="noindex">` to the demo page so search engines don't index an empty/JS-dependent page.

**Effort:** 2 min
**Priority:** P2

---

## PHASE 1b: PAGE BUILDS (~5-6 hours)

> These are mini-features, not quick fixes. Ship Phase 1a first so quick wins are live, then tackle these.

### FIX-17 | P1 | Help Page — Aggregate FAQs by Topic

**What's wrong:** Help page shows "Coming soon" but is linked in the footer. Content already exists across B2C and B2B FAQ sections.

**Action:** Build Help page by aggregating existing FAQs, organized by topic. All 4 locales.

**Proposed topic structure:**

**1. Getting Started**
- What is diBoaS? (from B2C FAQ "Is diBoaS a bank?")
- Is diBoaS for everyone? (from B2C FAQ)
- What's the minimum amount to start? (from B2C FAQ)
- What happens after I sign up? (from B2C FAQ)

**2. Money & Safety**
- Is my money safe? (from B2C FAQ)
- Can I withdraw my money anytime? (from B2C FAQ)
- What happens to my money if diBoaS shuts down? (from B2C FAQ)
- What if something goes wrong? (from B2C FAQ)

**3. Fees & Costs**
- How is this possible without high fees? (from B2C FAQ)
- What's the catch? (from B2B FAQ — adapt for general audience)
- Can I just use diBoaS for transfers? (from B2C FAQ)

**4. Investing & Strategies**
- What if I don't understand investing? (from B2C FAQ)
- Has diBoaS been audited? (from B2C FAQ)

**5. For Businesses**
- Is this for small businesses or startups? (from B2B FAQ)
- How is this different for businesses? (from B2B FAQ)

**Tech note:** Content already exists in B2C and B2B i18n files. This is primarily a reorganization and page build, not a copywriting task. Some answers may need slight rewording to work in a general Help context rather than a page-specific context.

**Effort:** 2-3 hours (page build + content reorganization across 4 locales)
**Priority:** P1

---

### FIX-18 | P1 | Security Page — Aggregate Security Info

**What's wrong:** Security page shows "Coming soon" but is linked in the footer. Security information exists across multiple pages.

**Action:** Build Security page by aggregating security content from the Under the Hood section (B2C), FAQ answers about safety, and wallet architecture descriptions.

**Proposed sections:**

**1. Your Wallet, Your Keys**
- Source: B2C "Under the Hood" — wallet section
- Every user gets their own wallet with their own private key
- diBoaS never sees, holds, or has access to your key
- If diBoaS disappeared tomorrow, your money would still be yours

**2. How We Protect Your Funds**
- Source: B2C "Under the Hood" — security section
- No one, including diBoaS, can access your funds
- Only you can authorize transactions
- Transaction signing always requires your approval
- We monitor all positions 24/7

**3. The Technology**
- Source: B2C "Under the Hood" — architecture section
- Built on open-source and decentralized financial infrastructure
- Every transaction is verifiable, every system is auditable
- We only use audited and established protocols
- Every strategy is tested against historical market crashes

**4. What We Don't Do**
- We never hold your private keys
- We never make transactions without your approval
- We never store your funds on our servers
- We are not a bank and your funds are not insured

**5. Transparency**
- All fees disclosed upfront
- All risks stated plainly
- No hidden mechanics
- Link to Protocols page for full details

**Tech note:** Most content exists in B2C i18n files. Needs reorganization into a dedicated page. All 4 locales.

**Effort:** 2-3 hours (page build + content aggregation across 4 locales)
**Priority:** P1

---

## PHASE 2: FEATURE BUILD — Strategy & Protocol Sub-Pages

### FIX-19 | Strategies + Protocols Detail Pages

**What:** Build dedicated detail pages at `/strategies/[name]` and `/protocols/[name]`. Current Strategies and Protocols pages become overview/aggregator pages with summary cards linking to detail pages.

**Architecture:**
- `/strategies` → Overview grid with summary cards, links to detail pages
- `/strategies/safe-harbor` → Full detail page for Safe Harbor
- `/strategies/full-throttle` → Full detail page for Full Throttle
- (10 strategy detail pages total)
- `/protocols` → Overview grid with summary cards, links to detail pages
- `/protocols/aave-v3` → Full detail page for Aave V3
- `/protocols/ethena` → Full detail page for Ethena (solves the Ethena card visual weight problem — full BaFin disclosure lives on detail page)
- (26 protocol detail pages total)

**Scope:** 36 new pages × 4 locales = 144 locale-specific pages. This is a significant feature build.

**Benefits:**
- Solves Ethena card visual weight issue (detail page absorbs the long disclosure)
- Better SEO (individual URLs for each strategy/protocol)
- Cleaner overview pages
- Each detail page can have its own structured data (Schema.org)
- Future: Adelaide Daily can link to specific strategy/protocol pages

**Content source:** The approved STRATEGIES_PAGE_FINAL_EN.md and PROTOCOLS_PAGE_FINAL_EN.md already contain all the detailed content. The overview pages get the summary; the detail pages get the full content.

**This requires a separate technical spec.** Adding to fix plan as a defined Phase 2, not to be mixed with Phase 1 quick fixes.

**Effort:** 2-4 weeks (design + build + content migration + 4 locales)
**Priority:** Phase 2

---

## SUMMARY TABLE

| # | Fix | Priority | Phase | Effort | CLO? |
|---|-----|----------|-------|--------|------|
| 01 | Goal Keeper missing i18n string | P0 | 1a | 15 min | No |
| 02 | Terms of Use geographic restriction | P0 | 1a | 30 min | **YES** |
| ~~03~~ | ~~Waitlist success 404~~ | ~~REMOVED~~ | — | — | — |
| 04 | "Expanding Worldwide" on all pages | P1 | 1a | 15 min | Flag |
| 05 | Buy and Hold card copy | P1 | 1a | 20 min | No |
| 06 | "← likely" badge translation | P1 | 1a | 5 min | No |
| 07 | Strategy names → English everywhere | P1 | 1a | 2-3 hrs | No |
| 08 | Shared footer all pages | P1 | 1a | 30 min | No |
| 09 | "Real People" persona migration bug | P1 | 1a | 30 min | No |
| 10 | Buy fee tooltip | P1 | 1a | 10 min | No |
| 11 | Double "Try Demo" nav button | P1 | 1a | 15 min | No |
| 12 | B2B fee table "Difference" column | P1 | 1a | 1 hr | No |
| 13 | PT-BR CVM 3-Warning verification | P1 | 1a | 20 min | No |
| 14 | Protocols category transitions | P1 | 1a | 30 min | No |
| 15 | About contact → hello@ | P1 | 1a | 5 min | No |
| 16 | Demo page noindex | P2 | 1a | 2 min | No |
| 17 | Help page (aggregate FAQs) | P1 | 1b | 2-3 hrs | No |
| 18 | Security page (aggregate info) | P1 | 1b | 2-3 hrs | No |
| 19 | Strategy + Protocol sub-pages | Phase 2 | 2 | 2-4 weeks | No |

**Phase 1a total effort:** ~6-8 hours (string fixes, CSS checks, footer wiring)
**Phase 1b total effort:** ~5-6 hours (Help + Security page builds)
**Phase 2 total effort:** 2-4 weeks

**Blockers:**
- FIX-02 (Terms) requires CLO approval before deployment
- FIX-04 ("Expanding Worldwide") flagged for CLO awareness

---

## STANDING RULES FOR ALL CHANGES

1. **All copy changes must include all 4 locales** (EN, DE, ES, PT-BR)
2. **Localization is NOT 1:1 translation** — must consider economics, linguistics, and cultural context per market
3. **PT-BR uses CVM warnings, NOT MiCA** — verify on every page
4. **Adelaide Filter applies** — no jargon on consumer-facing pages (Protocols page has relaxed filter)
5. **Fee figures must match confirmed structure:** 0.39% sell/close, 0.48% on-ramp/cash-out, free P2P, min $0.25/max $25
6. **Brand promise maximum 2 appearances per page:** "We show you both sides, the opportunities and the risks, always."
