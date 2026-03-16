# diBoaS Review Checklist — v3

Use on every PR. Mark: ✅ pass / ❌ fail / ⚠️ needs review / N/A

---

## Pre-review: Is this a net positive change?
If yes overall, do not block on minor imperfections. Address as P1/P2/Nit.

---

## DOMAIN A — FEE LOGIC

### P0 — Merge Blocking
- [ ] On-ramp rate = 0.0048 (0.48%)
- [ ] Buy/invest rate = 0.0039 (0.39%)
- [ ] Sell/close rate = 0.0039 (0.39%)
- [ ] P2P send fee = 0
- [ ] `Math.min(amount * rate, 25)` — cap applied
- [ ] $10,000 buy → $25.00 (not $39.00)
- [ ] 0.75% absent from all files
- [ ] 0.12% absent from all files

### P1 — Recommended
- [ ] Fee shown before transaction confirmation
- [ ] Cap stated on buy/sell display ("up to $25 maximum")
- [ ] P2P shows "Free"
- [ ] Financial arithmetic uses Decimal.js (not native JS `*`, `+`, `-` on money values)

---

## DOMAIN B — SECURITY & AUTHORIZATION

### P0 — Merge Blocking
- [ ] No role check removed from any endpoint
- [ ] No server-side transaction initiation without user action
- [ ] No private key material stored or logged server-side
- [ ] Turnkey API used through established wrapper
- [ ] Every financial operation has audit log entry with required fields
- [ ] No PII logged in plaintext (SSN, full account numbers, private keys)
- [ ] No SQL string concatenation (parameterized only)

### P1 — Recommended
- [ ] Rate limiting on transaction initiation
- [ ] Rate limiting on authentication endpoints
- [ ] Amount validation (positive, above minimum)
- [ ] Wallet address format validation
- [ ] Security headers on new endpoints
- [ ] Input validation schema on financial parameters
- [ ] No user IDs/amounts/account numbers in URL segments
- [ ] Sensitive financial fields in new DB models have field-level encryption
- [ ] No `Math.random()` for session tokens, nonces, OAuth state, or any security value (use `crypto.randomUUID()`)
- [ ] Third-party API responses (Onramper, Turnkey, protocols) validated against schema before use

---

## DOMAIN C — CLO COMPLIANCE

### P0 — Merge Blocking
- [ ] EU/MiCA verbatim block present verbatim on EU crypto/yield pages
- [ ] CVM warning 1 present in PT-BR (FGC guarantee)
- [ ] CVM warning 2 present in PT-BR (past returns)
- [ ] CVM warning 3 present in PT-BR (risk of loss)
- [ ] No prohibited terms in any user-facing string

### P1 — Recommended
- [ ] AI disclosure on Adelaide-generated content
- [ ] No Adelaide filter violations in consumer copy
- [ ] No anti-bank language violations

---

## DOMAIN D — FRONTEND & LOCALE

### P1 — Recommended
- [ ] EN changes → DE updated in same PR
- [ ] EN changes → ES updated in same PR
- [ ] EN changes → PT-BR updated in same PR
- [ ] PT-BR emphasizes international transfers
- [ ] DE uses "Sie" form throughout
- [ ] Strategy 2 = "Beat Inflation" (not "Steady Growth")
- [ ] New pages have meta tags (title, description, OG)
- [ ] New route bundle ≤ 300KB

---

## DOMAIN E — ARCHITECTURE & 12 PRINCIPLES

### P0
- [ ] Every financial operation has audit log entry (Principle 8)

### P1
- [ ] No domain service directly imports another domain (Principle 1)
- [ ] Error handling with try-catch on financial async ops (Principle 7)
- [ ] Circuit breaker on external service calls (Principle 7)
- [ ] Correlation ID in all error logs on financial paths (Principle 7)
- [ ] Idempotency key on all retryable financial operations (Principle 11)
- [ ] Optimistic locking (version check) on balance updates (Principle 11)
- [ ] New services have structured log output (Principle 12)
- [ ] Financial op logs include correlationId (Principle 12)
- [ ] New external integrations have health check (Principle 12)
- [ ] No direct external SDK import in domain logic (Principle 3)
- [ ] No PII in analytics event parameters (email, name, phone — Principle 10)

### P2
- [ ] Events have all required fields: eventId, eventType, timestamp, correlationId, domain, payload, metadata (Principle 2)
- [ ] Event names follow `[Domain][Entity][Action]Event` pattern (Principle 2)
- [ ] Service names follow `[Domain][Entity][Action]Service` (Principle 5)
- [ ] Function names follow `[verb][Entity][Condition]` (Principle 5)
- [ ] Constants follow `DOMAIN_CONTEXT_NAME` SCREAMING_SNAKE_CASE (Principle 5)
- [ ] API endpoints follow `/api/v{n}/{domain}/{resource}/{action}` (Principle 5)
- [ ] DB tables follow `domain_entity` plural snake_case (Principle 5)
- [ ] Service files ≤ 200 lines (Principle 6)
- [ ] Component files ≤ 150 lines (Principle 6)
- [ ] Utility files ≤ 100 lines (Principle 6)
- [ ] No significant code duplication (Principle 4)
- [ ] New significant interactions have analytics tracking (Principle 10)
- [ ] Analytics event names use constants (not hardcoded strings — Principle 10)
- [ ] Analytics events include `locale` and `timestamp` (Principle 10)
- [ ] No `console.log` instead of structured logger (Principle 12)
- [ ] No asset files duplicated outside `/public/assets/`
- [ ] No hardcoded content strings in components (use `@diboas/config/content`)

### Nit
- [ ] CSS design tokens named semantically (`--fs-color-title` not `--fs-color-blue`)

---

## SECURITY CONFIDENCE CHECK

Before reporting any security finding:
- [ ] Confidence ≥ 0.8?
- [ ] Concrete exploit scenario describable step by step?
- [ ] Does NOT fall under a hard exclusion (CLAUDE.md Part 7)?
- [ ] Does NOT match a precedent (React safe, env vars trusted, client auth expected)?

If any unchecked → do not report.

---

## Domain Coverage

| Domain | Files reviewed | P0 | P1 | P2 | Nit |
|---|---|---|---|---|---|
| A: Fee logic | | | | | |
| B: Security / auth | | | | | |
| C: CLO compliance | | | | | |
| D: Frontend / locale | | | | | |
| E: Architecture (12 principles) | | | | | |

---

## Final Verdict

**MERGE BLOCKED** — One or more P0s found.
**APPROVED WITH NOTES** — No P0s. P1s documented. Merge at discretion.
**CLEAN** — No P0s, no P1s. Minor P2s or Nits only.
