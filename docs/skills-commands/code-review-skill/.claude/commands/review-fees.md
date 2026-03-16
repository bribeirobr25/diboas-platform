---
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Read, Glob, Grep, LS
description: Targeted fee logic audit. Validates all fee figures, cap enforcement, display requirements, and minimum transactions.
---

Targeted audit of fee calculation and display. Net positive over perfection — focus on
correctness first, architecture second.

---

## The invariants (from CLAUDE.md)

| Operation | Correct rate | Cap |
|---|---|---|
| On-ramp | 0.0048 (0.48%) | none |
| Buy / Invest | 0.0039 (0.39%) | $25 maximum |
| Sell / Close | 0.0039 (0.39%) | $25 maximum |
| P2P Send | 0 | — |

**Instant P0:** 0.75%, 0.12% anywhere.
**Required formula:** `Math.min(amount * rate, 25)`

---

## Review process

**Step 1 — Find every fee reference in changed files**

```
git diff --merge-base origin/HEAD
```

Search for: `fee`, `rate`, `0.39`, `0.48`, `0.0039`, `0.0048`, `0.75`, `0.12`,
`25`, `cap`, `maximum`, `MAX_FEE`, `FEE_`, `commission`, `onramp`, `offramp`

For each occurrence note: constant definition / calculation / display / test.

**Step 2 — Validate each figure**
- On-ramp ≠ 0.0048 → P0
- Buy/sell/invest ≠ 0.0039 → P0
- P2P with any non-zero fee → P0
- 0.75% or 0.12% anywhere → P0

**Step 3 — Trace three test cases through the actual code logic**

Trace the fee calculation function for:

| Input | Operation | Expected output | If wrong |
|---|---|---|---|
| $100 | Buy | $0.39 | P0 |
| $10,000 | Buy | $25.00 (cap) | P0 if $39.00 |
| $4.99 | Buy (EN) | REJECTED | P1 if processed |

Do not assume the formula is correct — trace it.

**Step 4 — Check cap logic**
Is `Math.min()` or equivalent present?
- Missing → P0
- Cap value ≠ 25 → P0
- Could any code path bypass the cap? → P0

**Step 5 — Check minimums**
- EN: $5.00 minimum enforced?
- ES/DE: €5.00 minimum enforced?
- PT-BR: R$10.00 minimum enforced?
- Below-minimum transactions rejected, not processed at $0 → P1 if not enforced

**Step 6 — Check constants architecture**
- Fees defined once in central constants file → good
- Same fee hardcoded in multiple places → Nit
- Different values in different places → P0 if amounts differ

**Step 7 — Check fee display**
Any UI component displaying fees:
- Fee shown before user confirms transaction? → P1 if missing
- Cap stated ("up to $25 maximum") for buy/sell? → P1 if missing
- P2P shows "Free"? → P1 if missing
- Displayed amount matches calculated amount?

---

## Report format

```
## Fee Audit — [scope]
**Verdict:** [MERGE BLOCKED / CLEAN]

### P0 — Merge Blocked
[findings or "None found."]

### P1 — Recommended Before Merge
[findings or "None found."]

### P2 — Quality
[findings or "None found."]

### Nits
[optional minor suggestions or omit]

### Test results
| Test | Expected | Actual | Status |
|---|---|---|---|
| $100 buy | $0.39 | $[X] | PASS/FAIL |
| $10,000 buy | $25.00 | $[X] | PASS/FAIL |
| $4.99 buy (EN) | REJECTED | [handled/not enforced] | PASS/FAIL |

### Constants architecture
[One line: centralized vs scattered]
```
