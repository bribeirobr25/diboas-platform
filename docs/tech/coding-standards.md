# Coding Standards & Best Practices

> **Enforcement:** every principle below maps to its LIVE enforcement (CI job, lint rule, drift-guard test, or mandatory review checklist) in `docs/tech/engineering-gates.md`; resilience rows to cite in PRs live in `docs/tech/robustness-checklist.md`.

> **The 12 Principles of Excellence for building robust, maintainable fintech applications**

**Note:** These principles apply across all phases. Examples use Phase 2+ domain names (Banking, Investing, DeFi) for illustration. In Phase 1 (pre-launch), apply the same patterns to the waitlist, marketing, and i18n domains. See CLAUDE.md for the canonical Phase 1 implementation reference.

## Core Principles

### 1. Domain-Driven Design (DDD)

- Organize code around business domains (Banking, Investing, DeFi)
- Each domain is self-contained with clear boundaries
- Domain services don't directly call other domains
- Use events for cross-domain communication

### 2. Event-Driven Architecture

- All significant state changes emit events
- Events include: `eventId`, `eventType`, `timestamp`, `correlationId`, `domain`, `payload`, `metadata`
- Event naming: `[Domain][Entity][Action]Event`
- Example: `BankingTransactionCompletedEvent`, `InvestingOrderExecutedEvent`

### 3. Service Agnostic Abstraction Layer

- Never depend directly on external services
- Always use interface-based abstractions
- Provider implementations are swappable
- Factory pattern for provider instantiation

### 4. Code Reusability & DRY

- Write code once, use everywhere
- Create shared utilities and components
- Extract common patterns to packages
- Avoid duplication across domains

### 5. Semantic Naming Conventions

**Services & Classes**:

- Pattern: `[Domain][Entity][Action/Purpose]Service`
- Examples: `BankingTransactionValidationService`, `InvestingPortfolioCalculationService`

**Functions**:

- Pattern: `[verb][Entity][Condition]`
- Examples: `validateBankingTransactionAmount`, `calculateInvestingPortfolioValue`

**Constants**:

- Pattern: `SCREAMING_SNAKE_CASE` with context
- Examples: `MAX_BANKING_DAILY_WITHDRAWAL_LIMIT`, `INVESTING_ORDER_EXPIRY_MINUTES`

**API Endpoints**:

- Pattern: `/api/v{version}/{domain}/{resource}/{action}`
- Examples: `/api/v1/banking/transactions/deposit`, `/api/v1/investing/portfolio/summary`

> **Phase 1 deviation (intentional, 2026-05-08):**
> Pre-launch routes use `/api/{domain}/{action}` (no version prefix) because there
> are zero external API consumers. The migration to `/api/v1/{domain}/{action}`
> is a hard prerequisite before onboarding any external integrator (Phase 2
> banking, DeFi, or partner APIs). Tracking: `docs/audit/PENDING_ALL.md` → MIG-7.
>
> Health endpoints (`/api/health/*`) remain intentionally unversioned per
> Kubernetes/Vercel/load-balancer convention.

**Database**:

- Tables: `domain_entity` (plural)
- Columns: `snake_case`
- Examples: `banking_transactions`, `investing_portfolios`

### 6. File Decoupling & Organization

- Single responsibility per file
- Recommended sizes: Services ~200 lines, Components ~150, Utilities ~100
- These are guidelines to encourage DRY and reusability, not hard limits
- **Consistency is the priority** — a larger file that stays consistent and respects DRY is better than a forced split that creates duplication or breaks cohesion
- Split when it genuinely improves clarity or reuse; don't split just to meet a line count
- Break large files into focused modules only when natural domain boundaries exist

### 7. Error Handling & System Recovery

- Never let the system crash
- Implement retry logic with exponential backoff
- Use circuit breakers for external services
- Provide fallback strategies
- Queue operations for later retry when both primary and fallback fail
- Log all errors with correlation IDs
- Return degraded responses when appropriate

**Key Strategies**:

- Try-catch for all async operations
- Retry transient failures (network, timeout, rate limit)
- Fallback to secondary providers
- Graceful degradation with user feedback

### 8. Security & Audit Standards

- Input validation on all endpoints
- Parameterized queries (prevent SQL injection)
- Output encoding (prevent XSS)
- Rate limiting per user
- Authentication & authorization on all operations
- Encryption at rest and in transit
- Audit logging for all sensitive operations
- PII masking in logs
- Fraud detection integration

**Security Checklist**:

- ✓ Validate all inputs
- ✓ Sanitize all outputs
- ✓ Enforce rate limits
- ✓ Check authorization
- ✓ Encrypt sensitive data
- ✓ Log all financial operations
- ✓ Mask PII in logs

### 9. Performance & SEO Optimization

- Code splitting for large bundles
- Lazy loading for below-the-fold content
- Image optimization with Next.js Image
- Font optimization with next/font
- API response caching
- Database query optimization (select only needed fields)
- Preload critical resources
- Proper meta tags and structured data

**Performance Targets**:

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle size < 300KB per route

### 10. Product KPIs & Analytics

- Track all meaningful user interactions
- Enrich events with context (session, device, location)
- Multiple analytics providers
- Impression tracking with Intersection Observer
- Conversion funnel tracking

**Key Metrics**:

- User acquisition (signups, activations)
- Engagement (DAU, MAU, session duration)
- Transactions (volume, count, average size)
- Revenue (total, ARPU, LTV)
- Performance (latency, error rates, uptime)

### 11. Concurrency & Race Condition Prevention

- Use distributed locks for critical operations
- Database transactions with proper isolation levels
- Optimistic locking with version fields
- Queue-based processing for high-load operations
- Idempotency keys for retryable operations

**Patterns**:

- Pessimistic locking (lock before access)
- Optimistic locking (check version before update)
- Queue-based serialization
- Idempotent operations

### 12. Monitoring & Observability

- Distributed tracing (OpenTelemetry)
- Structured logging with correlation IDs
- Custom business metrics
- Health checks for all services
- Real-time alerting
- Error tracking (Sentry)

**What to Monitor**:

- Transaction success rates
- API latencies (p50, p95, p99)
- Error rates by type
- Provider availability
- Database performance
- Queue depths

## Additional Standards

### Git Commits

Format: `<type>(<scope>): <subject>`

Examples:

- `feat(banking): add deposit flow`
- `fix(investing): resolve calculation error`
- `docs(api): update authentication guide`

### Testing

- Unit tests for business logic
- Integration tests for workflows
- E2E tests for critical paths
- Minimum 80% code coverage
- Test naming: `should [expected behavior] when [condition]`

#### A test asserts a REQUIREMENT, never observed output

_(Standing rule, 2026-08-21 — founder-directed after PENDING_ALL `5.114`.)_

A test written by running the code and recording what came out does the opposite
of its job: it converts a defect into a regression barrier, and the next person
to fix the bug is told by CI that they broke something.

**The worked example.** A sandbox test supplied a **fixture** gas quote to a
screen and then asserted the screen said `Live from DeFiLlama`. It passed for as
long as it existed. Fixing the provenance predicate made it fail — the test had
been *protecting* a surface that claimed live data over a month-old figure, on
the screen where a user decides whether to spend money.

**Three distinct defects hide under this label, and they need different
detection:**

| | Defect | What it looks like | How it is found |
| --- | --- | --- | --- |
| 1 | **Vacuous** | The assertion never really runs — an empty result set, an unreachable branch, a typo'd ID that produced no events | Sabotage / mutation testing |
| 2 | **Weak** | Runs, but would pass under wrong implementations too (`expect(x).toBeGreaterThanOrEqual(0)`, two hard-coded figures standing in for a relationship) | Sabotage / mutation testing |
| 3 | **Wrong** | Runs, is strong, is precise — and pins the **wrong behaviour** | **Only by tracing to a stated requirement.** No tool can find this: a mutation score rates how well the suite notices change, not whether the pinned behaviour is correct |

**The rules:**

1. **Every assertion on a money path or an honesty surface cites its
   requirement** — a ruling ID, a spec section, a documented invariant
   (`FE-1`, `C-P0`, `D-e §4`, `board §3.3`, `R-4`). Money paths = fees, accrual,
   reconcile, allocation, exit composition, balances. Honesty surfaces =
   provenance stamps, disclosures, "would have" framing, the play-money label.
2. **The comment says WHY the behaviour is required, not WHAT the code does.**
   A comment that narrates the implementation is the tell for a recorded-output
   test — it proves the author read the code, not the requirement.
3. **Prove a load-bearing test by sabotage.** Break the implementation and
   confirm the test fails *for the right reason*. A test that still passes is
   vacuous; a test that fails with the wrong message is testing the wrong thing.
4. **Never write the assertion by running the code first.** Derive the expected
   value from the requirement, then run. If they disagree, one of them is a bug —
   and it is not automatically the expectation.
5. **A test changed to make a failing build green needs its requirement
   restated in the diff.** This is the moment class 3 is created.

**Honest limitation:** rules 1–2 are review-time, not mechanically enforced —
recorded in `engineering-gates.md` as such rather than claimed as a live gate.

### Documentation

- JSDoc for public APIs
- Inline comments for complex logic
- README per package
- Architecture decision records (ADRs)

## Summary

Good code is:

- **Understandable** - Clear naming and structure
- **Maintainable** - Modular and well-organized
- **Secure** - Defense in depth
- **Performant** - Optimized and cached
- **Observable** - Instrumented and logged
- **Reliable** - Error-handled and tested
- **Trustworthy** - Handles people's money safely

---

**Remember**: These standards exist to ensure we build software worthy of user trust and suitable for handling financial operations.
