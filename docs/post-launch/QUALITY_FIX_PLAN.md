# Quality & Audit Fix Plan

**Date:** March 14, 2026
**Updated:** March 14, 2026 (CTO board review incorporated)
**Triggered by:** Full quality/validation/audit run per CLAUDE.md
**Status:** Ready for execution
**Scope:** All issues found by `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm validate:all`, `pnpm check:dead-code`, `pnpm audit:full`, `pnpm security:audit`, `pnpm performance:audit`, `pnpm accessibility:audit`

**Relationship to existing plans:**
- Complements `diboas_fix_plan.md` (content/copy fixes) — no overlap
- Aligns with `PLAN.md` Phase 1 hardening — extends it with code quality items
- Does NOT touch Phases 2–7 (deferred per CEO decision)

---

## Issue Inventory

| # | Category | Issue | Severity | Principle |
|---|----------|-------|----------|-----------|
| Q-01 | Tooling | ESLint crash — minimatch v10 override breaks @eslint/eslintrc | **P0** | #12 Monitoring |
| Q-02 | Security | 18 npm vulnerabilities (1 critical, 8 high, 7 moderate, 2 low) | **P0** | #8 Security |
| Q-03 | Security | 2 API routes missing rate limiting (`/api/health/ready`, `/api/health/live`) | **P1** | #8 Security |
| Q-04 | Code Quality | 1 `any` type in `metricCollectors.ts` | **P1** | Strict TypeScript |
| Q-05 | Code Quality | 1 TODO comment in `assets.ts` | **P2** | #6 File Decoupling |
| Q-06 | Documentation | 3 env vars missing from `.env.example` | **P1** | #8 Security |
| Q-07 | Dead Code | 64 unused files, 348 unused exports, 1 unused dep (critters), 6 unused devDeps | **P2** | #4 DRY |
| Q-08 | Tooling | Lighthouse CI needs running dev server — no CI integration | **P2** | #9 Performance |
| Q-09 | Tooling | pa11y needs running dev server — no CI integration | **P2** | Accessibility |
| Q-10 | Code Quality | GoalCalculator.tsx is ~425 lines (standard: ≤150 for components) | **P2** | #6 File Decoupling |

---

## Phase QA-1: Critical Fixes (~2–3 hours)

### Q-01 | P0 | ESLint Crash — minimatch Override

**Root cause:** `pnpm.overrides` in root `package.json` forces `minimatch@^10.2.0`. The `@eslint/eslintrc@3.3.4` package uses `import minimatch from "minimatch"` (default import), but minimatch v10 only exports named exports (`{ minimatch }`). This crashes ESLint on startup.

**Principle:** #12 Monitoring — CI/CD quality gates require working linters.

**Verified:** `pnpm audit` confirms **2 active high-severity minimatch CVEs** (ReDoS in `matchOne()` and nested `*()` extglobs). The override was added to address these. Therefore Option 1 (remove) is not safe — **use Option 2 (pin to v9).**

**Fix:**

```json
// package.json pnpm.overrides — change:
"minimatch": ">=9.0.5 <10.0.0"
```

minimatch v9.x includes the ReDoS fixes while retaining the default export that `@eslint/eslintrc` requires. Then run `pnpm install` and verify.

**Files:** `package.json` (root)
**Verification:** `pnpm lint` completes without crash AND `pnpm audit | grep minimatch` shows no vulnerabilities

---

### Q-02 | P0 | 18 npm Security Vulnerabilities

**Principle:** #8 Security — "Input validation, output encoding, rate limiting, encryption."

#### Step 1: DOMPurify — DO FIRST, INDEPENDENTLY

**DOMPurify has a bypass vulnerability and is a production runtime dependency used for XSS prevention.** This is the one item in the entire list that could be exploited against live users. Update it before touching anything else.

```bash
pnpm update dompurify
pnpm build  # verify no breaking changes
```

**Verification:** `pnpm audit | grep -i dompurify` shows no vulnerabilities. Test XSS sanitization still works.

#### Step 2: Remaining vulnerabilities by severity

##### Critical (1)
| Package | Vulnerability | Action |
|---------|--------------|--------|
| basic-ftp (via @sentry/cli) | Server-side security flaw | Update `@sentry/cli` to latest; if still present, this is a transitive dev dependency only used during build — assess if exploitable in our context |

##### High (8)
| Package | Vulnerability | Action |
|---------|--------------|--------|
| rollup | Multiple CVEs | `pnpm update rollup` — used by Vite/build tooling |
| minimatch | ReDoS | Resolves with Q-01 fix (pin to v9) |
| serialize-javascript | Prototype pollution | `pnpm update serialize-javascript` |
| flatted | Prototype pollution | `pnpm update flatted` |
| lodash | Prototype pollution | Check if direct dependency; if transitive, update parent package |

##### Moderate (6, after DOMPurify fix)
| Package | Vulnerability | Action |
|---------|--------------|--------|
| yauzl | Path traversal | Transitive (likely Playwright/test tooling); update parent |
| undici | Multiple | `pnpm update undici` — used by Node.js fetch |

##### Low (2)
| Package | Action |
|---------|--------|
| (dev tooling) | Update as part of general dependency refresh |

**Approach (for Step 2):**
1. Run `pnpm update --latest` for direct dependencies with known fixes
2. For transitive dependencies, use `pnpm.overrides` in `package.json` (ironic given Q-01, but necessary)
3. For unfixable transitive deps (no upstream fix), document in a `SECURITY_EXCEPTIONS.md` with risk assessment

**Verification:** `pnpm audit` shows 0 critical, 0 high

---

## Phase QA-2: Code Quality (~1–2 hours)

### Q-03 | P1 | Health Routes Missing Rate Limiting

**Principle:** #8 Security — "Rate limiting on all API routes."

**Current state:** `/api/health/ready` and `/api/health/live` have no rate limiting. All other API routes have it.

**Reference pattern:** Copy the exact pattern from `/api/health/route.ts`, which uses:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitPresets, getClientIP, createRateLimitHeaders } from '@/lib/security/rateLimiter';
```

**Note on `/api/health/live`:** The liveness probe is intentionally minimal (`GET()` returns `{ status: 'alive' }`). Adding rate limiting changes the function signature from `GET()` to `GET(request: NextRequest)` and adds the full rate limit import chain. Still worth doing for consistency, but be aware of the signature change.

**Fix for `/api/health/ready/route.ts`:**
- Add `NextRequest` to the import (already has `NextResponse`)
- Import `checkRateLimit, RateLimitPresets, getClientIP, createRateLimitHeaders` from `@/lib/security/rateLimiter`
- Change `GET()` to `GET(request: NextRequest)`
- Add rate limit check at top of handler using `RateLimitPresets.lenient`
- Return 429 with rate limit headers if limit exceeded

**Fix for `/api/health/live/route.ts`:**
- Import `NextRequest` and rate limiter utilities from `@/lib/security/rateLimiter`
- Change `GET()` to `GET(request: NextRequest)`
- Add rate limit check before returning `{ status: 'alive' }`

**Files:**
- `apps/web/src/app/api/health/ready/route.ts`
- `apps/web/src/app/api/health/live/route.ts`

**Verification:** `pnpm audit:full` no longer flags missing rate limiting

---

### Q-04 | P1 | `any` Type in metricCollectors.ts

**Principle:** Strict TypeScript — "No implicit any, strict null checks."

**Fix:** Replace the `any` with a proper type. Inspect the usage context to determine the correct type (likely `Record<string, unknown>` or a specific metrics interface).

**File:** `apps/web/src/lib/monitoring/metricCollectors.ts`
**Verification:** `pnpm type-check` clean

---

### Q-06 | P1 | Missing env vars in .env.example

**Verified missing vars** (diffed `process.env.*` references in source against `.env.example`):

| Env Var | Used In | Purpose | Suggested Default |
|---------|---------|---------|-------------------|
| `NEXT_PUBLIC_FOUNDING_MEMBER_CAP` | `config/waitlist-stats.ts` | Client-side B2C founding member cap display | `1200` |
| `NEXT_PUBLIC_FOUNDING_MEMBER_CAP_B2B` | `config/waitlist-stats.ts` | Client-side B2B founding member cap display | `24` |
| `NEXT_PHASE` | `config/env.ts` | Next.js build phase detection (skips env validation during `next build`) | _(no default — set automatically by Next.js)_ |

**Note:** `FOUNDING_MEMBER_CAP=1200` and `FOUNDING_MEMBER_CAP_B2B=24` are already in `.env.example` (server-side caps). The missing vars are the `NEXT_PUBLIC_*` client-side equivalents and the build-phase flag.

**Fix:** Add to `.env.example` under the existing Waitlist Storage section:

```env
# Client-side founding member cap (mirrors server-side FOUNDING_MEMBER_CAP for UI display)
NEXT_PUBLIC_FOUNDING_MEMBER_CAP=1200
# Client-side B2B founding member cap (mirrors FOUNDING_MEMBER_CAP_B2B for UI display)
NEXT_PUBLIC_FOUNDING_MEMBER_CAP_B2B=24

# Note: NEXT_PHASE is set automatically by Next.js during builds — do not set manually
```

**File:** `apps/web/.env.example`
**Verification:** `pnpm audit:full` passes env var check

---

## Phase QA-3: Cleanup (~2–4 hours)

### Q-05 | P2 | TODO Comment in assets.ts

**Fix:** Resolve the TODO or convert it to a tracked issue. If the TODO describes future work, remove the comment and create a GitHub issue instead.

**File:** `apps/web/src/config/assets.ts` (or similar — locate exact file)
**Verification:** `pnpm audit:full` no longer flags TODO

---

### Q-07 | P2 | Dead Code Cleanup

**Principle:** #4 DRY — "Write once, shared packages, no duplication."

**Scope:** 64 unused files, 348 unused exports, 1 unused dep, 6 unused devDeps.

**Approach — incremental, NOT a single bulk deletion:**

1. **Unused dependencies (do first):**
   - Remove `critters` from dependencies
   - Remove 6 unused devDependencies (identify with `pnpm check:dead-code`)
   - Run `pnpm install` to update lockfile

2. **Unused exports (high-signal, low-risk):**
   - Focus on exports in `lib/`, `hooks/`, `config/` first — these are most likely to be genuinely unused
   - **Skip** component exports — many may be used dynamically or via barrel re-exports
   - **Skip** type exports — these may be used in declaration files or by downstream consumers
   - Remove in batches of ~20, running `pnpm type-check && pnpm build` after each batch

3. **Unused files (highest risk — do last):**
   - Cross-reference with git blame to check if recently added (may be WIP)
   - Focus on files in `lib/`, `hooks/`, `utils/` — these are safest to remove
   - **Do NOT delete** Storybook stories, test files, or config files without verification
   - **Do NOT delete** files referenced in docs or PLAN.md

**Critical safeguard: Do NOT delete any file created or modified in the last 2 weeks.** The GoalCalculator and many other files were recently implemented and knip may flag them as unused before they're fully wired into the import graph. Before starting cleanup, generate the safe-to-ignore list:

```bash
git log --since="2 weeks ago" --name-only --format="" | sort -u > /tmp/recently-modified.txt
```

Cross-reference every knip-flagged file against this list. If a file appears in both, skip it.

**Important:** knip may report false positives for:
- Dynamic imports (`import()`)
- Config files loaded by tools (vitest.config, next.config, etc.)
- Files used by Storybook stories
- Type-only exports consumed by declaration files

**Verification:** `pnpm check:dead-code` shows significantly reduced count; `pnpm build` still succeeds

---

### Q-08 & Q-09 | P2 | Lighthouse & pa11y CI Integration

**Principle:** #9 Performance, Accessibility standards.

**Current state:** Both tools require a running dev server. No CI integration exists yet (see PLAN.md §1.5).

**Fix:** Integrate into CI pipeline (when §1.5 is implemented):

```yaml
# .github/workflows/ci.yml (addition to PLAN.md §1.5)
lighthouse:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: pnpm install
    - run: pnpm build
    - run: pnpm start &  # Start production server
    - run: npx wait-on http://localhost:3000
    - run: pnpm performance:audit

accessibility:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: pnpm install
    - run: pnpm build
    - run: pnpm start &
    - run: npx wait-on http://localhost:3000
    - run: pnpm accessibility:audit
```

**Dependency:** Blocked by PLAN.md §1.5 (CI/CD Pipeline). Add to that task when executed.

---

### Q-10 | P2 | GoalCalculator.tsx Size (425 Lines)

**Principle:** #6 File Decoupling — "Components ≤150 lines" (target, not hard limit).

**Context:** The implementation plan estimated ~180 lines but the final component landed at ~425. The gap is partly because the plan underestimated the amount of derived state computation and event handler boilerplate needed, and partly because the component handles 3 tab variants with distinct logic paths.

**CTO guidance:** The 150-line standard is a target, not a hard limit. Extracting into 4 separate hook files for a single component can create worse readability than a well-structured 250-line file. The sweet spot is **2 extractions**, not 4.

**Recommended extractions:**
1. **State + handlers** → `useGoalCalculatorState.ts` custom hook (~120 lines) — consolidates all `useState`, `useCallback` handlers, and the analytics `trackEvent` helper
2. **Shared input fields** (initial deposit, monthly deposit, risk tier) → `GoalCalculatorSharedFields.tsx` sub-component (~80 lines) — the fields that appear regardless of active tab

This would bring `GoalCalculator.tsx` down to ~220–250 lines (tab bar + tab-specific logic + layout + result card rendering). Derived computations (target, months, scenarios) stay inline in the main component since they're tightly coupled to the render output and splitting them into a separate hook adds indirection without improving readability.

**Risk:** Low — pure extractions with no behavioral change.
**Priority:** P2 — functional correctness is not affected; refactor when convenient.

---

## Execution Order

```
Phase QA-1 (do now — blocks CI and protects live users):
  Q-02 Step 1 (DOMPurify — first, independently, protects live users)
  → Q-01 (ESLint minimatch — unblocks linting)
  → Q-02 Step 2 (remaining security deps)

Phase QA-2 (do next — code quality):
  Q-03, Q-04, Q-06 (parallel: independent fixes)

Phase QA-3 (do when time permits):
  Q-05, Q-07, Q-08, Q-09, Q-10 (incremental cleanup)
```

## Summary Table

| # | Fix | Priority | Phase | Effort | Blocked By |
|---|-----|----------|-------|--------|-----------|
| Q-01 | ESLint minimatch crash | P0 | QA-1 | 30 min | — |
| Q-02 | 18 security vulnerabilities | P0 | QA-1 | 1–2 hrs | Q-01 (for minimatch) |
| Q-03 | Health routes rate limiting | P1 | QA-2 | 20 min | — |
| Q-04 | `any` type in metricCollectors | P1 | QA-2 | 10 min | — |
| Q-05 | TODO in assets.ts | P2 | QA-3 | 10 min | — |
| Q-06 | Missing env vars in .env.example | P1 | QA-2 | 5 min | — |
| Q-07 | Dead code cleanup | P2 | QA-3 | 2–3 hrs | — |
| Q-08 | Lighthouse CI integration | P2 | QA-3 | 30 min | PLAN.md §1.5 |
| Q-09 | pa11y CI integration | P2 | QA-3 | 30 min | PLAN.md §1.5 |
| Q-10 | GoalCalculator refactor | P2 | QA-3 | 1 hr | — |

**Phase QA-1 total:** ~2–3 hours
**Phase QA-2 total:** ~35 min
**Phase QA-3 total:** ~4–5 hours

---

## Non-Issues (Investigated, No Action Required)

| Finding | Reason |
|---------|--------|
| `console.log` in `migrate.ts` | Acceptable — CLI utility script, not production runtime |
| Build budget warnings (5.2MB entrypoints) | Known — caused by i18n bundle (2.8MB). Addressed in PLAN.md §1.4 |
| `validate:translations` flagging missing DE/ES/PT-BR keys | Expected — GoalCalculator translations were just added; other new keys may still be EN-only |
| `pnpm type-check` passing | Confirmed clean — no action needed |
| `pnpm test` passing (29/29) | Confirmed clean — formula tests at 100% coverage |
| `pnpm build` succeeding | Confirmed — production build works |
