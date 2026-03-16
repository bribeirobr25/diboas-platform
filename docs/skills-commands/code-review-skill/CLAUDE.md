# diBoaS Code Review — Operating Rules v3

These rules are loaded into every review session. Every judgment must be made against
these invariants. Covers: financial correctness, non-custodial guarantee, CLO compliance,
AND all 12 diBoaS architecture principles and coding standards.

---

## Review Philosophy

**Net Positive > Perfection.** Determine if the change is a net improvement. Do not
block on imperfections if the change improves code health overall.

**Confidence threshold ≥ 0.8.** If you cannot articulate a concrete failure mode or
exploit scenario, do not report.

**Nit prefix.** Optional polish. Does not block merge.

**Explain the why.** State which invariant or principle is violated.

---

## THE THREE CORE QUESTIONS (answer first)

1. **Does this code handle money correctly?** Fee math, cap, display.
2. **Does this code maintain the non-custodial guarantee?** No diBoaS access to funds.
3. **Does this code comply with CLO-approved language?** Right terms per jurisdiction.

Any "no" = P0. Merge blocked.

---

## PART 1 — FINANCIAL INVARIANTS

### Fee Structure

| Operation | Rate | Cap |
|---|---|---|
| On-ramp | 0.0048 (0.48%) | None |
| Buy / Invest | 0.0039 (0.39%) | $25 maximum |
| Sell / Close | 0.0039 (0.39%) | $25 maximum |
| P2P Send | 0 (Free) | — |
| Minimum EN | — | $5 USD |
| Minimum ES/DE | — | €5 EUR |
| Minimum PT-BR | — | R$10 BRL |

**Legacy values — instant P0 anywhere:** 0.75% and 0.12%
**Required cap formula:** `Math.min(amount * rate, 25)`
**Three mandatory test cases:** $100→$0.39, $10,000→$25.00 (cap), $4.99→REJECT

### Financial Calculation Precision

**P1:** Any financial calculation using native JavaScript numbers instead of Decimal.js.

JavaScript floating-point arithmetic is unsafe for money:
`0.1 + 0.2 = 0.30000000000000004` — real production bug, unacceptable for financial ops.

```typescript
// WRONG — never do this with money
const fee = amount * 0.0039;              // floating point error
const total = balance + 10.50;            // unsafe

// CORRECT — Decimal.js for all financial math
import Decimal from 'decimal.js';
const fee = new Decimal(amount).mul(new Decimal('0.0039')).toNumber();
const total = new Decimal(balance).add(new Decimal('10.50')).toNumber();
const cappedFee = Decimal.min(new Decimal(amount).mul(rate), new Decimal(25)).toNumber();
```

Scope: fee calculations, balance operations, yield calculations, any arithmetic on money values.

### Non-Custodial Guarantee (P0 violations)
- Server initiates transaction without explicit user action
- Private keys/seed phrases stored or logged server-side
- Turnkey API bypassed (diBoaS holds zero key shares)
- Authorization checks removed from wallet operations
- Any code path where a diBoaS employee could move user funds

---

## PART 2 — CLO COMPLIANCE

### EU / MiCA verbatim (EN + DE pages — no paraphrase)
> Crypto assets are highly volatile. The value of your investment can go up or down.
> You may lose some or all of your investment. Past performance is not indicative of
> future results.

### Brazil / CVM (PT-BR — all three required)
1. Este produto não é garantido pelo Fundo Garantidor de Créditos (FGC)
2. Rentabilidade passada não representa garantia de rentabilidade futura
3. Investimentos envolvem riscos, incluindo perda do valor investido

### US / FTC
- Hypothetical performance labeled as hypothetical
- Risk disclosures prominent, not buried

### Prohibited terms (all locales — P0)
guaranteed returns, guaranteed yield, risk-free, FDIC insured, deposit insured,
bank account, "we are regulated", any custody claim

### AI disclosure
Adelaide-generated content requires a visible AI disclosure.

---

## PART 3 — CONSUMER COPY INVARIANTS

### Adelaide Filter (consumer pages only)
Fail: DeFi, stablecoin, APY, on-chain, protocol, smart contract, TVL, DEX, liquidity,
non-custodial (consumer context), USDC (consumer context), Solana, yield-generating.

### Anti-Bank Rule
Never mention banks positively or as partners. Never position as bank supplement.

### Strategy Names
Strategy 2 = "Beat Inflation" (never "Steady Growth").

### Locale Coverage
EN change → DE + ES + PT-BR must update in same PR. DE: "Sie" form only.

---

## PART 4 — THE 12 ARCHITECTURE PRINCIPLES

From `docs/tech/coding-standards.md` and `docs/tech/architecture.md`.

---

### Principle 1: Domain-Driven Design

Three domains: **Banking, Investing, DeFi**. Each self-contained. Cross-domain only via events.

**P1:** One domain service directly importing or calling another domain service.
```typescript
// WRONG (in banking file):
import { portfolioService } from '@/packages/investing';

// CORRECT: emit an event
eventBus.emit(new BankingTransferCompletedEvent({ correlationId, ... }));
```

---

### Principle 2: Event-Driven Architecture

Cross-domain communication must use events with required fields.

**P1:** Cross-domain direct call (see P1 above).
**P1:** Event object missing required fields.

Required event structure:
```typescript
interface DomainEvent {
  eventId: string;           // required
  eventType: string;         // [Domain][Entity][Action]Event
  timestamp: Date;           // required
  correlationId: string;     // required — must propagate through call chain
  domain: string;            // required
  payload: unknown;          // required
  metadata: Record<string, unknown>; // required
}
```

**P2:** correlationId not propagated through the full call chain.

---

### Principle 3: Service Agnostic Abstraction Layer

Never depend directly on external service SDKs in domain logic. Use interface-based abstractions.

**P1:** Direct provider SDK import in domain logic without going through interface.
```typescript
// WRONG:
import Onramper from '@onramper/widget'; // in domain logic
// CORRECT: use provider interface
const provider = ProviderFactory.create('onramper');
```

**P2:** Factory pattern not used for provider instantiation.

---

### Principle 4: Code Reusability & DRY

**P2:** Identical utility function defined in more than one file, or component duplicated
instead of extracted to the appropriate package level.

**Nit:** Minor duplication that could be extracted but doesn't affect correctness.

---

### Principle 5: Semantic Naming Conventions

**P2** for all of these:

Services/Classes → `[Domain][Entity][Action/Purpose]Service`
- Wrong: `FeeService`, `TransactionHandler`
- Right: `BankingTransactionFeeService`, `InvestingOrderExecutionService`

Functions → `[verb][Entity][Condition]`
- Wrong: `calculateFee()`, `getBalance()`
- Right: `calculateBankingTransactionFee()`, `aggregateInvestingPortfolioBalance()`

Constants → `SCREAMING_SNAKE_CASE` with domain context
- Wrong: `MAX_FEE`, `TIMEOUT`
- Right: `MAX_BANKING_DAILY_WITHDRAWAL_LIMIT`, `INVESTING_ORDER_EXPIRY_MINUTES`

API Endpoints → `/api/v{version}/{domain}/{resource}/{action}`
- Wrong: `/api/fees`, `/api/transaction`
- Right: `/api/v1/banking/transactions/deposit`

Database tables → `domain_entity` (plural, snake_case)
- Wrong: `Transaction`, `fee_record`
- Right: `banking_transactions`, `investing_portfolios`

---

### Principle 6: File Decoupling & Organization

**P2:** Service file > 200 lines, component > 150 lines, utility > 100 lines.
**P2:** File with multiple unrelated responsibilities (single responsibility violated).
**Nit:** File slightly over limit but well-organized.

---

### Principle 7: Error Handling & System Recovery

For financial-critical paths (transactions, fee calculation, wallet ops, provider calls):

**P1 violations:**
- Async operation in a financial path with no try-catch
- Error thrown or caught without logging (no correlationId, no context)
- Provider call with no retry logic on transient failures
- No circuit breaker on external service integration
- Error response that leaks internal stack traces to user

**P2:** Retry logic without exponential backoff. Error logged without correlationId.

Required pattern for financial ops:
```typescript
try {
  const result = await executeWithRetry(operation, {
    maxRetries: 3,
    backoff: 'exponential',
    baseDelay: 1000,
    maxDelay: 10000,
  });
} catch (error) {
  logger.error('Operation failed', {
    correlationId,  // required
    domain,         // required
    error: error.message,
    // NEVER log: privateKey, seedPhrase, password, fullCardNumber
  });
}
```

---

### Principle 8: Security & Audit Standards

**P0 violations:**
- Financial operation (transaction, fee charge, wallet action) with no audit log entry
- PII logged in plaintext (SSN, full account numbers, private keys, passwords)
- SQL query built by string concatenation (not parameterized)

**P1 violations:**
- Authentication missing on endpoint accessing financial data
- Rate limiting absent on user-facing transaction endpoints
- Input validation missing on a transaction-related parameter
- Sensitive financial field added to DB model without field-level encryption
- Security headers missing on new endpoints

Required audit log fields for financial operations:
```typescript
auditLog.write({
  correlationId,          // required
  userId,                 // required
  action,                 // required: 'TRANSACTION_INITIATED', etc.
  domain,                 // required
  resourceId,             // required: transaction ID, wallet ID, etc.
  timestamp,              // required
  ipAddress,              // required, masked: 192.168.x.x
  success: boolean,       // required
  // OMIT: passwords, private keys, full card numbers
});
```

PII masking in logs: SSN → `XXX-XX-####`, Account → `****####`, Card → `****-****-****-####`

Security headers required on new endpoints:
`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`,
`Content-Security-Policy`, `Referrer-Policy`

---

### Principle 9: Performance & SEO Optimization

**P1:** New route bundle exceeds 300KB (check with bundle analyzer).
**P1:** New page missing meta tags (title, description, OG tags).
**P2:** Images not using Next.js `<Image>`. Heavy component not lazy-loaded below fold.
**P2:** `SELECT *` query when only subset of columns needed. API call uncached.

Performance targets: LCP < 2.5s, FID < 100ms, CLS < 0.1, Bundle < 300KB per route.

---

### Principle 10: Product KPIs & Analytics

**P1:** PII included in analytics events (email, name, full account numbers, SSN). Analytics
data is sent to third-party providers and must never contain personal data.

**P2:** New significant user interaction added without analytics tracking event.
**P2:** Analytics event missing required context fields (`locale`, `timestamp`).
**P2:** Analytics event name hardcoded as a string instead of using constants file.
**Nit:** Minor UI interaction without tracking.

**Required analytics event shape:**
```typescript
// Event names must come from constants, never hardcoded
import { MY_FEATURE_EVENTS } from '@/lib/my-feature/constants';

analyticsService.track({
  name: MY_FEATURE_EVENTS.ACTION_COMPLETED,  // constant, not 'my_feature_action_completed'
  parameters: {
    locale: string,      // required — always include
    timestamp: number,   // required — always include (Date.now())
    // NEVER include: email, name, SSN, account numbers, phone numbers
  }
});
```

**Event naming convention:** `{feature}_{action}` snake_case, past tense for completed actions.
- Wrong: `'DreamMode'`, `'dream-mode-started'`, `'startDream'`
- Right: `'dream_mode_started'`, `'dream_simulation_completed'`

---

### Principle 11: Concurrency & Race Condition Prevention

For any operation that reads-then-writes financial data:

**P1 violations:**
- Balance update without optimistic locking (missing `version` field check)
- Critical financial operation without distributed lock (using Redis)
- Retryable operation (webhook, transaction) without idempotency key

**P2:** DB transaction missing SERIALIZABLE isolation for financial writes.

Required patterns:
```typescript
// Idempotency key on retryable financial operations
await provider.charge({
  idempotencyKey: `${userId}-${txId}-${attemptNumber}`,  // required
  amount,
});

// Optimistic locking on balance updates
await db.balance.update({
  where: { id: balanceId, version: currentVersion },  // version check required
  data: { amount: newAmount, version: { increment: 1 } }
});
```

---

### Principle 12: Monitoring & Observability

**P1 violations:**
- New service or critical function with no structured log output
- Financial operation log entry missing correlationId
- New external service integration without health check endpoint

**P2:** `console.log` instead of structured logger. Critical path without timing.
New business metric not tracked.

Required structured log format:
```typescript
logger.info('Transaction processed', {
  correlationId,   // required
  domain,          // required
  userId,          // required (masked if PII)
  transactionId,   // required
  duration_ms,     // required for financial ops
  success: boolean,
});
```

### Asset and Config Standards

**P2:** Physical asset files duplicated outside `/public/assets/` (only one copy should exist;
use TypeScript path helpers from `@diboas/shared/assets` to reference them).

**P2:** Hardcoded content strings in components (titles, descriptions, CTAs). Content must
live in config packages (`@diboas/config/content`), not inline in component files.

**Nit:** CSS design token named after implementation detail rather than semantic purpose.
- Wrong: `--fs-color-blue`, `--fs-gap-12px`, `--fs-transition-200ms`
- Right: `--fs-color-title`, `--fs-gap-sm`, `--fs-transition-duration-fast`

---

### Cryptographically Secure Randomness (P1)

Never use `Math.random()` for any security-sensitive value:

**P1:** `Math.random()` used for session tokens, nonces, OAuth state params, request IDs, or
any value that must be unpredictable.

```typescript
// WRONG
const sessionId = Math.random().toString(36);
const state = Math.random().toString();

// CORRECT
const sessionId = crypto.randomUUID();
const nonce = crypto.getRandomValues(new Uint8Array(32));
const state = crypto.randomUUID();  // OAuth state parameter
```

### API Response Validation (P1)

All responses from third-party providers (Onramper, Turnkey, Sky, Aave, etc.) must be
validated against a schema before being used.

**P1:** Provider response used directly without schema validation.
```typescript
// WRONG
const balance = providerResponse.data.balance;

// CORRECT
const validated = providerResponseSchema.parse(providerResponse);
const balance = validated.data.balance;
```

This prevents malicious or malformed provider responses from corrupting application state.

---

## PART 5 — SECURITY INVARIANTS (from security.md)

### Authorization
- Zero-trust: every request validated
- Role checks server-side only (not just client-side)
- Consumer: 100 req/min per user; strict on financial endpoints

### Input Validation (P1 if missing on financial endpoints)
All user inputs: schema validation → sanitization → business rules → security check.
Security checks: SQL injection (parameterized only), XSS (output encoding), path traversal,
command injection.

### Secure URL Patterns (P1 if violated)
Never expose in URLs: user IDs, transaction amounts, account numbers, internal IDs.
Use opaque references: `?ref=tx_secure_abc123` not `/transaction/12345/view`.

### Sensitive Data Encryption (P1 if missing)
PII/Financial fields (SSN, account numbers, private keys) → AES-256-GCM
Sensitive (session tokens, API keys) → AES-256-CBC

---

## PART 6 — SEVERITY SUMMARY

**P0 — Merge blocked:** Wrong fees, legacy fees (0.75%/0.12%), non-custodial violations,
auth removed, CLO prohibited terms, missing mandatory disclosures, financial op without
audit log, PII logged in plaintext, SQL string concatenation.

**P1 — Recommended before merge:** Missing locale updates, Adelaide violations, anti-bank
violations, fee not shown pre-confirmation, domain separation violations, missing
circuit breakers, missing idempotency keys, missing rate limiting, bundle > 300KB,
missing security headers, missing input validation on financial endpoints,
native JS numbers for financial math (use Decimal.js), `Math.random()` for security
values (use `crypto.randomUUID()`), provider API response used without schema validation,
PII in analytics events.

**P2 — Quality (can merge):** Naming conventions, file size limits, DRY violations,
missing analytics tracking, missing structured logging, missing optimistic locking,
analytics event names hardcoded (use constants), analytics missing locale/timestamp,
asset files duplicated outside `/public/assets/`, hardcoded content strings in components.

**Nit — Optional:** CSS token names as implementation details. Minor style. Does not block.

---

## PART 7 — SECURITY FALSE POSITIVE RULES

Confidence ≥ 0.8 to report. Hard exclusions:
- DoS/resource exhaustion
- React/Next.js XSS (safe unless `dangerouslySetInnerHTML`)
- Client-side missing auth (backend validates — expected)
- Theoretical race conditions without concrete attack path
- Env vars as attack vectors
- Log spoofing, regex injection, regex DoS
- Findings in markdown documentation
- Secrets managed by HashiCorp Vault (not raw disk)

Security precedents:
- UUIDs are unguessable — no need to validate as security measure
- Shell scripts don't get untrusted input — only flag with concrete path
- Non-PII logging is fine — only flag if secrets or PII exposed

---

## PART 8 — WHAT THIS REVIEW DOES NOT REPLACE

- Smart contract audit (separate scope, separate firm)
- Onramper/Turnkey vendor security review
- Full penetration testing (pre-launch requirement)
- Human architectural judgment
