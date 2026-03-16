# diBoaS Code Review Skill v3

Specialized code review for diBoaS. Built from the full tech documentation stack and
the Pragmatic Quality framework. Covers five domains across every PR.

---

## What's new in v3 vs v2

**From diBoaS tech docs (`docs/tech/`):**
- All 12 architecture principles now enforced as Domain E
- Decimal.js required for all financial arithmetic (floating-point is unsafe for money)
- `crypto.randomUUID()` required for all security-sensitive random values
- Third-party API responses must be schema-validated before use
- PII in analytics events is a P1 violation
- Analytics event names must use constants, never hardcoded strings
- Required analytics fields: `locale` + `timestamp` always present
- Asset files must only exist in `/public/assets/` — no duplication
- Content strings must live in config packages, not hardcoded in components
- CSS design tokens must be semantic, not implementation-detail names

**Carried from v2:**
- Net Positive > Perfection philosophy
- Confidence threshold ≥ 0.8 on all findings
- 17 hard security exclusions (DoS, React XSS, client auth, etc.)
- 12 security precedents (React safe, env vars trusted, etc.)
- Exploit scenario required per security finding
- Parallel false-positive filtering sub-tasks
- "Nit:" prefix for optional suggestions
- GitHub Actions YAMLs with `track_progress: true`

---

## Installation

### Option A — As a skill folder

Copy `diboas-code-review-skill/` into your project root:

```
diboas-platform/
├── apps/
├── packages/
├── diboas-code-review-skill/     ← here
└── ...
```

### Option B — Commands only

Copy `.claude/commands/*.md` into your project's `.claude/commands/` directory.
Copy `.claude/agents/*.md` into your project's `.claude/agents/` directory.

### Option C — GitHub Actions automation

Copy the two YAML files into `.github/workflows/`:
- `claude-code-review.yml` — runs on every PR
- `claude-security-review.yml` — security-focused, runs on every PR

Add `CLAUDE_CODE_OAUTH_TOKEN` to your GitHub repository secrets.

---

## Usage

### Unified entry point (recommended)
```
/review-code
/review-code review the checkout fee calculation
/review-code full audit on this PR before merge
```
Routes to fee, security, frontend, or architecture review based on what changed.
If scope is unclear, presents clickable options.

### Targeted commands
```
/review-fees                           — fee logic only
/review-fees src/lib/fees.ts           — specific file
/review-security                       — auth + non-custodial
/review-security check the wallet API  — specific scope
```

### Comprehensive PR subagent
```
@agent code-reviewer
@agent code-reviewer review everything before merge
```
Runs all five domains, parallel false-positive filtering for security.

---

## File reference

| File | Role | Update when |
|---|---|---|
| `CLAUDE.md` | All operating rules — 8 parts covering every invariant | Fee changes, new CLO rules, new prohibited terms |
| `SKILL.md` | Package descriptor | Version bumps only |
| `/commands/review-code.md` | Unified entry point (5 domains + routing) | Never |
| `/commands/review-fees.md` | Targeted fee audit with 3 test cases | Never |
| `/commands/review-security.md` | Auth + non-custodial + parallel FP filtering | Never |
| `/agents/code-reviewer.md` | Full PR subagent, all 5 domains, Opus model | Never |
| `/.github/workflows/claude-code-review.yml` | Automated PR review | Model upgrades |
| `/.github/workflows/claude-security-review.yml` | Automated security review | Model upgrades |
| `/docs/diboas-review-rules.md` | Quick reference, test matrix, approved/rejected terms | When invariants change |
| `/docs/review-checklist.md` | P0/P1/P2/Nit checklist for every PR | Add Nits as discovered |

---

## Fee structure enforced

| Operation | Rate | Cap |
|---|---|---|
| On-ramp | 0.48% | — |
| Buy / Invest | 0.39% | $25 maximum |
| Sell / Close | 0.39% | $25 maximum |
| P2P Send | Free | — |

**Legacy values (instant P0):** 0.75% and 0.12%
**Minimums:** $5 EN / €5 ES+DE / R$10 PT-BR
**All arithmetic must use Decimal.js — never native JS on money values**

---

## Domain overview

| Domain | Scope | Hardest finding |
|---|---|---|
| A — Fee Logic | Calculations, cap, display | Missing $25 cap → P0 |
| B — Security | Auth, non-custodial, encryption | Server-initiated transaction → P0 |
| C — CLO | MiCA, CVM, prohibited terms | Paraphrased MiCA block → P0 |
| D — Frontend | Locales, copy, performance | Missing locale → P1 |
| E — Architecture | 12 principles, coding standards | Cross-domain import → P1 |

---

## What this skill does NOT replace

- Smart contract audit (separate firm, separate scope)
- Onramper/Turnkey vendor security review
- Full penetration testing (required before real-money launch)
- Human architectural judgment at the design level

This is an application-layer correctness floor.

---

## One source of truth rule

All invariants live in `CLAUDE.md`. When something changes:
- Fee structure → update `CLAUDE.md` Part 1 + `docs/diboas-review-rules.md` fee table
- New CLO requirement → update `CLAUDE.md` Part 2
- New prohibited term → update `CLAUDE.md` Part 2 + `docs/diboas-review-rules.md`
- New security false-positive pattern → add to `CLAUDE.md` Part 7 hard exclusions

Never update values in individual command files — they read from `CLAUDE.md`.
