# B2C Landing Page — Visual Audit Report
## All Locales: EN, DE, ES, pt-BR

**Date:** February 23, 2026  
**Auditor:** CLO Board (AI-Assisted via Docker MCP Playwright)  
**Environment:** localhost:3000 (Next.js dev server)  
**Scope:** Full B2C landing page — all 12 sections, all 4 locales  
**URLs Tested:** `/en`, `/de`, `/es`, `/pt-BR`

---

## EXECUTIVE SUMMARY

All 4 locales render the complete 11-section landing page plus footer. The language switcher works correctly across all locales. Geographic localization (cities, currencies, payment methods, disclaimers) is properly implemented. However, 1 critical bug, 3 high-priority compliance issues, and 5 medium-priority content/UX issues were identified.

**Verdict: ⛔ NOT CLEARED FOR LAUNCH** — P0 and P1 items must be resolved first.

---

## P0 — CRITICAL BUG

### P0-1: Recurring JavaScript Error — `crypto.randomUUID is not a function`

**Affects:** All locales (EN, DE, ES, pt-BR)  
**Severity:** Runtime error, potential data loss  
**Reproduction:** Automatic — fires every 5 seconds on every page load  

**Console output (repeating):**
```
TypeError: crypto.randomUUID is not a function
  at apps_web_src_a25b88ff._.js:2392:32
```

Each cycle produces 3 console errors: "Failed to emit", "Error reported", and the TypeError itself. Over a 3-minute page session, this generates 100+ console errors.

**Impact:** The `crypto.randomUUID()` API requires a secure context (HTTPS) or a modern browser. In the Playwright/Docker test environment it fails continuously. This likely affects the analytics/event tracking system. In production over HTTPS this may self-resolve, but the code has no fallback — any user on an older browser or non-secure context will experience the same failure loop.

**Action:** CTO must add a polyfill or fallback (e.g., `crypto.randomUUID?.() || self.crypto.getRandomValues(...)` pattern). This is a pre-launch blocker regardless of whether production uses HTTPS, because the code should degrade gracefully.

---

## P1 — HIGH PRIORITY (Must Fix Before Launch)

### P1-1: FAQ 3 "Is my money safe?" — Missing Risk Disclosure (All Locales)

**Affects:** EN, DE, ES, pt-BR  
**Severity:** Regulatory compliance failure  

The FAQ answer across all locales focuses exclusively on user control and security technology, but contains **zero mention** of:
- Crypto-assets not being covered by deposit guarantee schemes
- The possibility of losing some or all of your investment
- Value fluctuation risk

**Live FAQ 3 answers observed:**

| Locale | Answer (summary) |
|--------|-----------------|
| EN | "Your money is secured by you. We use security technology, with industry-leading partners, but ultimately you're in control." |
| DE | "Ihr Geld wird von Ihnen gesichert. Wir setzen Sicherheitstechnologie mit branchenführenden Partnern ein, aber letztlich haben Sie die Kontrolle." |
| ES | "Tu dinero está protegido por ti. Usamos tecnología de seguridad, con socios líderes del sector, pero en última instancia, tú tienes el control." |
| pt-BR | "Seu dinheiro é protegido por você. A gente usa tecnologia de segurança, com parceiros líderes da indústria, mas no final das contas, você tá no controle." |

**Assessment:** Answering "Is my money safe?" without mentioning that crypto-assets lack deposit guarantee protection is a compliance failure under both MiCA (EU) and general consumer protection principles. The footer contains this disclosure, but users who only read the FAQ answer could be materially misled.

**Action:** CTO must add deposit guarantee/risk language to FAQ 3 across all 4 locales.

---

### P1-2: MiCA EU Marketing Communication on pt-BR Page (Jurisdiction Mismatch)

**Affects:** pt-BR only  
**Severity:** Regulatory confusion  

The pt-BR footer includes EU-specific MiCA marketing communication language:

> "Este comunicado de marketing de criptoativos não foi revisado ou aprovado por nenhuma autoridade competente em qualquer Estado-Membro da União Europeia. O ofertante do criptoativo é o único responsável pelo conteúdo deste comunicado de marketing."

MiCA is a European Union regulation. Brazil is governed by CVM and Banco Central do Brasil. Including EU-specific regulatory disclaimers on a Brazilian-facing page creates confusion about which jurisdiction applies and is not legally required for Brazilian users.

The generic crypto-asset risk warning (value can fluctuate, may lose money, not covered by deposit guarantee) is fine to keep as it's universally applicable.

**Action:** Remove the EU marketing communication paragraph from pt-BR footer. Keep: generic crypto warning, CVM disclaimer, and Bacen disclaimer (both of which are correctly present).

---

### P1-3: MiCA Article 68 Duplication in DE and ES Footers

**Affects:** DE and ES  
**Severity:** Content quality / regulatory confusion  

Both the DE and ES footers contain two separate paragraphs with overlapping MiCA Article 68 content:

- **Paragraph 2:** Generic crypto risk warning (value fluctuation, loss risk, no deposit guarantee)
- **Paragraph 3:** Same crypto risk warning PLUS the full MiCA marketing communication clause

Paragraph 2 is redundant since paragraph 3 already includes all of its content plus the required marketing communication attribution.

**Action:** Remove paragraph 2 from DE and ES footers; keep paragraph 3 (which includes the full MiCA language with marketing communication clause).

---

## P2 — MEDIUM PRIORITY (Should Fix Before Launch)

### P2-1: pt-BR Footer Grammar Error

**Affects:** pt-BR only  
**Severity:** Content quality  

Footer tagline reads: **"Acesso aberto e Oportunidades justa para todos!"**

Issues:
1. `justa` should be `justas` (plural adjective agreement with `Oportunidades`)
2. `Oportunidades` should not be capitalized mid-sentence

**Correct:** "Acesso aberto e oportunidades justas para todos!"

**Action:** CTO fix grammar in pt-BR footer tagline.

---

### P2-2: Non-Custodial Terminology Gap (All Locales)

**Affects:** EN, DE, ES, pt-BR  
**Severity:** Partial compliance  

FAQ 1 "Is diBoaS a bank?" answers across all locales describe non-custodial behavior ("We don't touch, hold, access, or manage your money") but do NOT use the explicit legal term "non-custodial."

**Mitigating factor:** The EN footer DOES include "non-custodial" explicitly: "diBoaS is a non-custodial interface providing access to decentralized finance protocols." The substance is effectively communicated.

**Action:** Low urgency. Add "non-custodial" (or locale equivalent) to FAQ 1 answers in next copy update cycle.

---

### P2-3: Origin Story — Minor Copy Discrepancy (EN)

**Affects:** EN  
**Severity:** Content accuracy  

The EN origin story ends with: **"This is diBoaS."**

The CLO-approved copy version ends with: **"I called it Adelaide."**

This is a narrative choice difference, not a compliance issue. The current version works but diverges from the approved copy.

**Action:** Verify with CEO whether "This is diBoaS." or "I called it Adelaide." is the intended final line. Apply consistently across all locales.

---

### P2-4: Case-Sensitive Routing for pt-BR Locale

**Affects:** pt-BR  
**Severity:** UX / accessibility  

| URL | Result |
|-----|--------|
| `/pt-BR` | ✅ Working |
| `/pt-br` | ❌ 404 |
| `/pt` | ❌ 404 |

The language switcher works correctly, but users typing the URL directly with lowercase will get a 404. This may also cause issues with SEO crawlers or case-insensitive systems.

**Action:** Consider adding case-insensitive routing middleware to redirect `/pt-br` → `/pt-BR`.

---

### P2-5: Fee Table Values Need CLO Re-Review

**Affects:** All locales  
**Severity:** Compliance process  

The live fee table shows values that differ from the last CLO-reviewed version (Feb 17, 2026). Key differences observed:

| Row | CLO-Reviewed (Feb 17) | Live Implementation |
|-----|----------------------|---------------------|
| Add money | "deposit" | "Add money" (label change) |
| Buy/Sell | 0.12% sell / 0.75% off-ramp | 0.39% buy / 0.39% sell / 0.48% cash out |
| Strategies | Not in fee table | "Free to start, 0.39% when you stop" |
| Swap | Not in fee table | "FREE" |

The fee values themselves may be correct and intentionally updated, but the CLO has not re-certified them.

**Action:** CEO/CTO must submit current fee structure for CLO re-review. All 4 locale fee tables must be re-certified.

---

## SECTION-BY-SECTION VERIFICATION MATRIX

All sections verified via Playwright accessibility snapshots and screenshots across all 4 locales.

| # | Section | EN | DE | ES | pt-BR | Notes |
|---|---------|----|----|----|----|-------|
| 1 | Navigation | ✅ | ✅ | ✅ | ✅ | Logo, Try Demo CTA, hamburger menu |
| 2 | Hero | ✅ | ✅ | ✅ | ✅ | H1 headline, subheadline, CTA |
| 3 | Origin Story | ✅ | ✅ | ✅ | ✅ | 5 paragraphs, Adelaide narrative, image |
| 4 | Product Carousel | ✅ | ✅ | ✅ | ✅ | 3 slides, tab navigation, blockquotes |
| 5 | Real-Life Scenarios | ✅ | ✅ | ✅ | ✅ | 3 localized scenario cards |
| 6 | Feature Carousel | ✅ | ✅ | ✅ | ✅ | 3 slides, prev/next buttons |
| 7 | Fee Table | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Renders correctly but needs CLO re-review |
| 8 | What's the Catch | ✅ | ✅ | ✅ | ✅ | Prose section with image |
| 9 | Interactive Demo | ✅ | ✅ | ✅ | ✅ | Dual CTA (Try Full Demo + Future You) |
| 10 | Social Proof | ✅ | ✅ | ✅ | ✅ | 847 people, 12 countries |
| 11 | Waitlist | ✅ | ✅ | ✅ | ✅ | Email input, privacy checkbox |
| 12 | FAQ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 5 items expand/collapse correctly; Q3 missing risk disclosure |
| 13 | Footer | ⚠️ | ⚠️ | ⚠️ | ⚠️ | See P1-2, P1-3, P2-1 |

---

## LOCALE-SPECIFIC VERIFICATION

### Currency & Payment Localization ✅

| Locale | Currency | Fee Example | Minimum |
|--------|----------|------------|---------|
| EN | $ (USD) | "$100 → $0.39" | $5 |
| DE | € (EUR) | "€100 → €0,39" | 5 € |
| ES | € (EUR) | "€100 → €0,39" | 5 € |
| pt-BR | R$ (BRL) | "R$100 → R$0,39" | R$ 10 |

### Geographic Localization ✅

| Locale | Scenario 1 City | Scenario 2 Context | Deposit Method |
|--------|----------------|-------------------|----------------|
| EN | San Francisco | "You're in America" | ACH or debit/credit |
| DE | München | "Sie sind in Deutschland" | SEPA or debit/credit |
| ES | Madrid | "Tú estás en España" | Transferencia bancaria or tarjeta |
| pt-BR | São Paulo | "Você no Brasil" | PIX or crédito/débito |

### Footer Disclaimer Matrix

| Disclaimer | EN | DE | ES | pt-BR |
|-----------|----|----|----|----|
| Educational/Not Advice | ✅ | ✅ | ✅ | ✅ |
| MiCA Art. 68 (generic) | ✅ | ✅ (dup) | ✅ (dup) | ✅ |
| MiCA Marketing Comm. | ❌ (correct—US) | ✅ | ✅ | ⚠️ (should remove) |
| Non-custodial | ✅ | ✅ | ✅ | ✅ |
| User stories disclaimer | ✅ | ✅ | ✅ | ✅ |
| AI disclosure | ✅ | ✅ | ✅ | ✅ |
| CVM (Brazil) | N/A | N/A | N/A | ✅ |
| Bacen (Brazil) | N/A | N/A | N/A | ✅ |
| SEC/CFTC/FinCEN (US) | ✅ | N/A | N/A | N/A |

### FAQ Answers Verified (EN — all 5 expanded)

| # | Question | Answer Summary | Issues |
|---|----------|---------------|--------|
| 1 | Is diBoaS a bank? | "No. Platform that helps you connect... We don't touch, hold, access, or manage your money." | Missing "non-custodial" term (P2-2) |
| 2 | How is this possible without high fees? | "By removing the middlemen... modern technology (Blockchain) that costs a fraction." | ✅ Clean |
| 3 | Is my money safe? | "Secured by you. Security technology. You're in control." | **Missing risk disclosure (P1-1)** |
| 4 | What if I don't understand investing? | "That's exactly who we built this for. Simple. No jargon." | ✅ Clean |
| 5 | What's the minimum amount to start? | "Start with as little as $5. No minimum balance." | ✅ Clean (locale-specific amounts verified) |

---

## FUNCTIONAL TESTING

### Language Switcher ✅
All 4 locales accessible via the language switcher component. Switching between locales preserves page position and correctly re-renders all content.

### Carousel Navigation ✅
Both carousels (Product and Feature) respond to tab/dot navigation and prev/next buttons across all locales.

### FAQ Accordion ✅
All 5 FAQ items expand and collapse correctly. Only one item open at a time (accordion behavior). Tested across all locales.

### Waitlist Form
Email input field renders with correct placeholder text per locale. "Join Waitlist" button and privacy checkbox present. Form submission not tested (would require real email).

### External Links ✅
Social media links verified:
- Instagram → `https://www.instagram.com/diboasfi/`
- X (Twitter) → `https://x.com/diBoaSFi`
- YouTube → `https://www.youtube.com/@diBoaSFi`
- LinkedIn → `https://www.linkedin.com/company/diboasfi/`

### Internal Navigation ✅
Footer nav links (For You, For Business, Adelaide Daily, About, Help, Legal) all point to correct locale-prefixed URLs.

---

## ACTION ITEMS SUMMARY

### Must Fix (P0)
1. **CTO:** Add `crypto.randomUUID` polyfill/fallback for non-secure contexts

### Must Fix Before Launch (P1)
2. **CTO:** Add deposit guarantee/risk disclosure to FAQ 3 across all 4 locales
3. **CTO:** Remove MiCA EU marketing communication paragraph from pt-BR footer
4. **CTO:** Remove duplicate MiCA paragraph in DE and ES footers (keep full version with marketing comm. clause)

### Should Fix Before Launch (P2)
5. **CTO:** Fix pt-BR footer grammar: "Oportunidades justa" → "oportunidades justas"
6. **CTO:** Submit current fee table for CLO re-review
7. **CEO:** Confirm origin story final line ("This is diBoaS." vs "I called it Adelaide.")
8. **CTO:** Consider case-insensitive routing for `/pt-br` → `/pt-BR`
9. **CTO:** Add explicit "non-custodial" term to FAQ 1 across all locales (next copy cycle)

---

*End of audit. Document generated from Playwright automated testing across all 4 locales on February 23, 2026.*
