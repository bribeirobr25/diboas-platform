---
name: diboas-code-review
version: 3.0
description: >
  diBoaS-specific code review skill covering five domains: fee correctness, security &
  authorization, CLO compliance, frontend & locale, and all 12 architecture principles
  plus diBoaS-specific coding standards. Includes: Decimal.js enforcement for financial
  math, crypto.randomUUID() for security values, provider API response validation,
  analytics PII rules, asset/config organization standards. Pragmatic Quality framework:
  net positive over perfection, 80% confidence threshold, parallel false-positive
  filtering for security findings. Includes GitHub Actions YAMLs for automated outer-loop
  PR review.
---

# diBoaS Code Review Skill v3

Specialized code review for the diBoaS platform. Catches what generic linters miss.
Built from the 12 architecture principles, full tech documentation stack, and the
Pragmatic Quality framework from OneRedOak/claude-code-workflows.

## Coverage

### Financial Correctness
- Fee figures: 0.39% buy/sell, 0.48% on-ramp, $25 cap, P2P free
- Legacy value detection: 0.75% / 0.12% anywhere = instant P0
- Cap formula validation: `Math.min(amount * rate, 25)` — missing cap blocks merge
- Three test cases traced: $100, $10,000 (cap), below minimum (reject)
- **Decimal.js enforcement**: native JS floating-point arithmetic on money = P1

### Security & Authorization
- Non-custodial guarantee: no server-initiated transactions, no key material server-side
- Authorization checks: server-side role verification, nothing removed
- Audit logging: every financial operation with correlationId, userId, action, resourceId
- **`crypto.randomUUID()` not `Math.random()`** for all security-sensitive values
- **Provider API response schema validation** before using any third-party data
- PII in logs, SQL string concatenation, secure URL patterns

### CLO Compliance
- EU/MiCA verbatim block (exact text, no paraphrase) on EN+DE pages
- CVM 3-warning (all three) on PT-BR pages
- Full prohibited terms list across all locales
- AI disclosure on Adelaide-generated content

### Frontend & Locale
- All four locales updated when any EN string changes
- DE Sie/du form, PT-BR international transfer framing
- Strategy 2 = "Beat Inflation" (never "Steady Growth")
- Bundle ≤ 300KB, meta tags on new pages

### Architecture & 12 Coding Principles
- E1: DDD — no cross-domain direct imports
- E2: Event structure — all required fields present
- E3: Provider abstraction — no direct SDK in domain logic
- E4: DRY — no significant duplication
- E5: Naming — services, functions, constants, endpoints, tables
- E6: File size — services ≤200, components ≤150, utilities ≤100 lines
- E7: Error handling — try-catch, retry, circuit breaker on financial paths
- E8: Audit logging — financial ops logged with required fields (P0)
- E9: Performance — bundle budget, meta tags, no SELECT *
- E10: Analytics — no PII in events (P1), constants not strings (P2)
- E11: Concurrency — optimistic locking, idempotency keys
- E12: Observability — structured logs, correlationId, health checks
- E13: Asset/config — no asset duplication, no hardcoded content strings

## Structure

```
diboas-code-review-skill/
├── SKILL.md                              ← this file
├── CLAUDE.md                             ← all operating rules (8 parts)
├── README.md                             ← installation guide
├── .claude/
│   ├── commands/
│   │   ├── review-code.md               ← /review-code — unified entry point (5 domains)
│   │   ├── review-fees.md               ← /review-fees — fee logic only
│   │   └── review-security.md           ← /review-security — parallel false-positive filtering
│   └── agents/
│       └── code-reviewer.md             ← @agent code-reviewer — full PR subagent
├── .github/
│   └── workflows/
│       ├── claude-code-review.yml       ← automated PR review
│       └── claude-security-review.yml  ← automated security review
└── docs/
    ├── diboas-review-rules.md            ← quick reference, test matrix, term lists
    └── review-checklist.md              ← P0/P1/P2/Nit checklist (5 domains)
```

## What it was built from

- `docs/tech/coding-standards.md` — 12 principles
- `docs/tech/architecture.md` — DDD, monorepo, transaction flow
- `docs/tech/backend.md` — orchestration, circuit breakers, fee engine
- `docs/tech/frontend.md` — component hierarchy, performance targets
- `docs/tech/security.md` — zero-trust, encryption, audit requirements
- `docs/tech/database.md` — optimistic locking, outbox/inbox, partitioning
- `docs/tech/integrations.md` — provider abstraction, webhook security
- `docs/tech/internationalization.md` — locale architecture, DRY i18n
- `docs/tech/analytics-integration.md` — event naming, PII rules, constants
- `docs/tech/api.md` — secure URL patterns, rate limits, error codes
- `docs/tech/component-architecture-pattern.md` — CSS token naming
- `docs/tech/project-structure.md` — asset management, config-driven content
- `docs/tech/security-risk-assessment-condensed.md` — Decimal.js, crypto randomness
- OneRedOak/claude-code-workflows — Pragmatic Quality, confidence threshold,
  false-positive filtering, GitHub Actions patterns
