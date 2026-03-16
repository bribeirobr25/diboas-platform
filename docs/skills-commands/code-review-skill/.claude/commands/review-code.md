---
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git show:*), Bash(git remote show:*), Read, Glob, Grep, LS, Task
description: Comprehensive diBoaS code review. Covers fees, security, CLO compliance, frontend, locale, AND all 12 architecture principles and coding standards.
---

You are the Principal Engineer Reviewer for diBoaS. Enforce the invariants in CLAUDE.md
using the Pragmatic Quality framework: net positive over perfection, confidence ≥ 0.8 on
all findings, Nit prefix for optional suggestions.

---

## Step 0 — Read operating rules

CLAUDE.md is loaded. It covers:
- Part 1: Fee invariants (0.39%/0.48%/$25 cap/P2P free/never 0.75%/0.12%)
- Part 2: CLO compliance (MiCA, CVM, FTC, prohibited terms)
- Part 3: Consumer copy (Adelaide filter, anti-bank, locales, strategy names)
- Part 4: The 12 architecture principles (DDD, events, abstractions, naming, etc.)
- Part 5: Security invariants (auth, input validation, secure URLs, encryption)

---

## Step 1 — Gather diff context

```
git status
git diff --name-only origin/HEAD...
git log --no-decorate origin/HEAD...
git diff --merge-base origin/HEAD
```

Categorize changed files:
- **Financial logic**: fees, transactions, wallet ops, strategy routing
- **Authorization / security**: auth middleware, roles, permissions, Turnkey
- **Frontend / copy / locale**: pages, components, locale JSONs, strings
- **Backend services**: domain services, event handlers, provider adapters
- **Configuration**: env, constants, package dependencies
- **Tests**
- **Other**

---

## Step 2 — Determine scope

If the user's message already specifies scope, go to Step 3.

Otherwise use `ask_user_input`:

**"What should I review?"**
- type: single_select
- Options:
  - "Everything — review all changed files (full audit)"
  - "Fee logic — calculations, cap, display"
  - "Security & auth — authorization, wallet, non-custodial"
  - "Frontend & copy — CLO, Adelaide filter, locales"
  - "Architecture & standards — the 12 principles, naming, structure"

---

## Step 3 — Run review domains

### DOMAIN A — FINANCIAL LOGIC
*Triggers: fee calculation, transaction amounts, wallet ops, on-ramp, buy/sell, pricing.*

1. Find all fee references (search: fee, rate, 0.39, 0.48, 0.0039, 0.0048, 0.75, 0.12, 25, cap, MAX_FEE)
2. Validate each: on-ramp 0.0048, buy/sell 0.0039, P2P 0, cap $25. Wrong value → P0
3. Confirm `Math.min(amount * rate, 25)` present. Missing → P0
4. Trace: $100 buy → $0.39, $10,000 buy → $25.00, $4.99 buy → REJECT
5. Check display: fee shown before confirmation (P1 if missing), cap stated (P1 if missing)
6. Check constants: centralized? Same value in multiple files? Inconsistent → P0
7. **Financial precision:** Search for arithmetic on money values (`amount *`, `balance +`, `fee -`).
   Using native JS numbers instead of Decimal.js → P1.
   (`0.1 + 0.2 = 0.30000000000000004` — floating point is unsafe for money)

---

### DOMAIN B — SECURITY & AUTHORIZATION
*Triggers: auth, role, permission, wallet, key, sign, transaction, Turnkey, API endpoint.*

1. For every API endpoint/server function: role check present and server-side? Removed from before → P0
2. Non-custodial: no server-initiated transactions, no key material server-side. Violated → P0
3. Audit log: every financial operation logged with correlationId, userId, action, resourceId, timestamp. Missing → P0
4. PII in logs: SSN, full account numbers, private keys logged in plaintext → P0
5. SQL: parameterized queries only, no string concatenation → P0
6. Rate limiting on transaction/auth endpoints → P1 if missing
7. Security headers on new endpoints → P1 if missing
8. Input validation schema on financial parameters → P1 if missing
9. Secure URLs: no user IDs, amounts, or account numbers in URL segments → P1 if violated
10. Sensitive fields (SSN, account numbers) in new DB models: field-level encryption → P1 if missing
11. **Crypto randomness:** `Math.random()` used for session IDs, nonces, OAuth state, or any security
    value → P1. Must use `crypto.randomUUID()` or `crypto.getRandomValues()`.
12. **Provider response validation:** Third-party API response (Onramper, Turnkey, protocol) used
    without schema validation → P1.

Apply confidence filter (≥0.8) and all hard exclusions before reporting security findings.

---

### DOMAIN C — CLO COMPLIANCE
*Triggers: pages/, components/, locales/, i18n/, any user-facing strings.*

1. EU/MiCA verbatim block on EN+DE crypto/yield pages → P0 if missing or paraphrased
2. CVM 3-warning on PT-BR pages → P0 if any of the three missing
3. Prohibited terms in any user-facing string → P0
4. Adelaide filter on consumer pages (no DeFi jargon) → P1
5. Anti-bank language violations → P1
6. AI disclosure on Adelaide-generated content → P1

---

### DOMAIN D — FRONTEND & LOCALE
*Triggers: same as Domain C, plus new pages or routes.*

1. EN changed without DE/ES/PT-BR equivalent → P1 per missing locale
2. DE "du" form used → P1
3. Strategy 2 called "Steady Growth" not "Beat Inflation" → P1
4. New page missing meta tags (title, description, OG) → P1
5. New route bundle > 300KB → P1
6. Images not using Next.js `<Image>` → P2
7. Heavy below-fold component not lazy-loaded → P2

---

### DOMAIN E — ARCHITECTURE & CODING STANDARDS (12 PRINCIPLES)
*Triggers: any backend service, domain package, event handler, provider adapter, or new component.*

**E1 — Domain Separation (P1)**
Any domain service directly importing another domain's services?
- Banking imports from investing/defi packages → P1
- DeFi imports from banking packages → P1
Cross-domain must use events only.

**E2 — Event Structure (P1)**
Any new event object: does it have all required fields?
Required: eventId, eventType, timestamp, correlationId, domain, payload, metadata
Event name follows `[Domain][Entity][Action]Event` pattern?
- Wrong: `TransactionDone`, `FeeCharged` → P2
- Right: `BankingTransactionCompletedEvent` → correct

**E3 — Provider Abstraction (P1)**
Direct external SDK import in domain logic (not through interface layer)?
- `import Stripe from 'stripe'` in a domain service → P1
Must use provider interface. Factory pattern for instantiation.

**E4 — DRY (P2)**
Same function or component duplicated across files instead of extracted?

**E5 — Naming Conventions (P2)**
Services: `[Domain][Entity][Action]Service` pattern?
Functions: `[verb][Entity][Condition]` pattern?
Constants: `DOMAIN_CONTEXT_NAME` in SCREAMING_SNAKE_CASE?
API endpoints: `/api/v{n}/{domain}/{resource}/{action}`?
DB tables: `domain_entity` plural snake_case?

**E6 — File Size (P2 / Nit)**
Service > 200 lines? Component > 150 lines? Utility > 100 lines?
Multiple unrelated responsibilities in one file?

**E7 — Error Handling (P1 for financial paths, P2 for others)**
Async operation in financial path with no try-catch → P1
Error caught but not logged (missing correlationId) → P1
Provider call with no retry logic → P1
No circuit breaker on external service → P1
Stack trace leaking to user in error response → P1

**E8 — Audit Logging (P0 for financial ops)**
New financial operation without audit log entry → P0
Log entry has: correlationId, userId, action, resourceId, timestamp, ipAddress, success?
Missing any required field → P1

**E9 — Performance (P1 for new routes, P2 for optimizations)**
New route bundle > 300KB → P1
New page missing meta tags → P1
`SELECT *` instead of targeted columns → P2
Uncached API call on critical path → P2

**E10 — Analytics (P1 for PII, P2 for others)**
PII in analytics event parameters (email, name, phone) → P1
Significant new user interaction without tracking event → P2
Analytics event name hardcoded as string (should use constants file) → P2
Analytics event missing `locale` or `timestamp` → P2

**E11 — Concurrency (P1 for critical financial ops)**
Balance update without version field check → P1
Critical financial operation without distributed lock → P1
Retryable operation (webhook, transaction) without idempotency key → P1

**E12 — Observability (P1 for new services, P2 for logging)**
New service/critical function with no structured logs → P1
Financial operation log missing correlationId → P1
New external integration missing health check → P1
`console.log` instead of structured logger → P2

**E13 — Asset and Content Standards (P2)**
Physical asset file added anywhere other than `/public/assets/` → P2
Hardcoded content strings in component files (should be in `@diboas/config/content`) → P2
CSS design token named as implementation detail (`--fs-color-blue`) not semantic (`--fs-color-title`) → Nit

---

## Step 4 — Report

```
## diBoaS Code Review
**Scope:** [what was reviewed]
**Verdict:** [MERGE BLOCKED / APPROVED WITH P1s / CLEAN]

---

### P0 — MERGE BLOCKED
[finding | file:line | rule violated | exact fix]
[None found — no blocking issues.]

---

### P1 — Recommended Before Merge
[finding | file | recommendation]
[None found.]

---

### P2 — Quality Improvements
[Concise list or "None found."]

---

### Nits
[Optional suggestions or omit section]

---

### Domains reviewed
- [ ] Fee logic (Domain A)
- [ ] Security & authorization (Domain B)
- [ ] CLO compliance (Domain C)
- [ ] Frontend & locale (Domain D)
- [ ] Architecture & standards (Domain E — 12 principles)

### Confidence notes
[What couldn't be verified without running the code]

### Not covered
Smart contracts, Turnkey/Onramper vendor security, penetration testing, performance profiling.
```

---

## Step 5 — Offer next steps

Use `ask_user_input`:

**"How should we proceed?"**
- type: single_select
- Options:
  - "Fix all P0s now — make the required changes"
  - "Fix P0s and P1s — address everything blocking or recommended"
  - "Show me the changes needed — I'll apply them"
  - "Report only — I'll decide what to fix"
