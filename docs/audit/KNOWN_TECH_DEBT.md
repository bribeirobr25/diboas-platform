# Known Tech Debt

## Fee Audit — Issue K: faq.json Legacy Fees
- **Status:** Blocked on CMO delivery
- **Severity:** CRITICAL
- **Files:** `packages/i18n/translations/{en,de,es,pt-BR}/faq.json`
- **Details:** ~60+ strings across 4 locales use ancient 0.09%/0.9% fee structure.
  Correct values: 0.39% (execution), 0.48% (ramp), FREE (send/receive).
  See `docs/new-copy/CTO_FEE_AUDIT_CLAUDE_CODE_HANDOFF.md` Issue K for full list.
- **Date flagged:** February 27, 2026
