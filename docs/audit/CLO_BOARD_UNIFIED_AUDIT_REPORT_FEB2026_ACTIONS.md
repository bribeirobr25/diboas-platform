# CLO BOARD SESSION 020 — CTO HANDOFF ACTION LIST

**Date:** February 10, 2026  
**From:** CLO Board  
**To:** CTO Board  
**Priority:** 🔴 LAUNCH BLOCKING  
**Deadline:** February 11, 2026 EOD

---

## 🔴 P0 ACTIONS — MUST COMPLETE BEFORE LAUNCH

### ACTION 1: Add AI Disclosure (2-4 hours)

**Files to modify:**

```
/packages/i18n/translations/en/landing-b2c.json
/packages/i18n/translations/pt-BR/landing-b2c.json
/packages/i18n/translations/en/landing-b2b.json
/packages/i18n/translations/pt-BR/landing-b2b.json
/apps/web/src/components/Layout/Footer/MinimalFooter.tsx
```

**Add to translations:**

```json
{
  "footer": {
    "aiDisclosure": "This content was created with the assistance of artificial intelligence. All data, analysis, and market commentary are reviewed for accuracy, but AI-generated content may contain errors. You are encouraged to verify important information independently."
  }
}
```

**PT-BR:**
```json
{
  "footer": {
    "aiDisclosure": "Este conteúdo foi elaborado com o auxílio de inteligência artificial. Todas as informações, análises e comentários de mercado são revisados para garantir precisão, mas conteúdos gerados por IA podem conter imprecisões. Recomendamos que você verifique informações importantes de forma independente antes de tomar decisões."
  }
}
```

**Render in MinimalFooter.tsx BEFORE other disclaimers.**

---

### ACTION 2: Add CVM 3-Warning for PT-BR (2 hours)

**Add to PT-BR translations:**

```json
{
  "footer": {
    "cvmWarning": "⚠️ AVISO CVM: Criptoativos não são protegidos por garantias governamentais. Você pode perder todo o capital investido. Consulte um profissional habilitado antes de investir."
  }
}
```

**Render conditionally when `locale === 'pt-BR'`.**

---

### ACTION 3: Add MiCA Article 68 Verbatim (1 hour)

**Update EN/DE translations:**

**Current:**
```json
"regulatoryNote": "diBoaS operates under the EU MiCA framework. CASP authorization pending."
```

**Change to:**
```json
"regulatoryNote": "The value of crypto-assets may fluctuate. You may lose some or all of your money. Crypto-assets are not covered by deposit guarantee schemes. diBoaS operates under the EU MiCA framework. CASP authorization pending."
```

---

### ACTION 4: Add BCB Notice to PT-BR Landing Footer (1 hour)

**Add to PT-BR footer:**

```json
{
  "footer": {
    "bcbNotice": "diBoaS não é uma instituição financeira autorizada pelo Banco Central do Brasil (BCB)."
  }
}
```

---

### ACTION 5: Fix Fee Inconsistency (2 hours)

**REQUIRES CEO DECISION FIRST.**

Once confirmed, update ALL locations:
- `/packages/i18n/translations/en/landing-b2c.json` (FAQ)
- `/packages/i18n/translations/en/landing-b2b.json` (FAQ)
- `/docs/fees.md`

---

### ACTION 6: Geo-Blocking Decision (CEO + CLO)

**Option A: Implement geo-blocking (8-12 hours)**

Files:
```
/packages/i18n/src/middleware.ts — Add geo-IP check
/apps/web/src/app/api/waitlist/signup/route.ts — Add country validation
```

**Option B: Update ToS (2 hours)**

Remove claims about US/Brazil blocking if not enforcing.

---

## 📋 QUICK VERIFICATION CHECKLIST

After implementation, verify each page:

| Page | AI Disclosure | CVM (PT-BR) | MiCA | BCB (PT-BR) |
|------|---------------|-------------|------|-------------|
| `/en` (B2C) | ⬜ | N/A | ⬜ | N/A |
| `/pt-BR` (B2C) | ⬜ | ⬜ | N/A | ⬜ |
| `/en/business` (B2B) | ⬜ | N/A | ⬜ | N/A |
| `/pt-BR/business` (B2B) | ⬜ | ⬜ | N/A | ⬜ |
| `/en/strategies` | ⬜ | N/A | ⬜ | N/A |
| `/pt-BR/strategies` | ⬜ | ⬜ | N/A | ⬜ |
| `/en/future-you` | ⬜ | N/A | ⬜ | N/A |
| `/pt-BR/future-you` | ⬜ | ⬜ | N/A | ⬜ |

---

## ⏰ TIMELINE

| Time | Action |
|------|--------|
| Feb 10 PM | CEO confirms fee structure |
| Feb 10-11 | CTO implements Actions 1-5 |
| Feb 11 PM | CLO Board verifies |
| Feb 12 AM | Final sign-off |
| Feb 12 | 🚀 LAUNCH |

---

**Questions?** Tag CLO Board in Slack #diboas-legal

---

*CLO Board Session 020 — February 10, 2026*
