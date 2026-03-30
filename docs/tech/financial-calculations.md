# Financial Calculations — Bug History & Reference Values

**Last updated:** 2026-03-30

This document records financial calculation bugs found and fixed in the diBoaS platform, the correct formulas, and verified reference values. It exists to prevent the same class of error from being reintroduced.

---

## The Lump-Sum Multiplier Bug

### What went wrong

Multiple components used an incorrect formula that treats all monthly contributions as if they were invested on day 1:

```typescript
// WRONG — lump-sum multiplier applied to total contributions
const balance = totalInvestment * Math.pow(1 + apy / 100, years);
// Example: $100/mo × 12 months = $1,200, then $1,200 × 1.07 = $1,284
```

The correct formula accounts for the fact that each monthly payment compounds only for its remaining duration:

```
FV = S × (1+r)^n + PMT × ((1+r)^n - 1) / r
```

Where:
- **S** = initial lump sum
- **PMT** = monthly contribution
- **r** = monthly interest rate (converted from APY via geometric conversion)
- **n** = total months

```typescript
// CORRECT — shared utility at lib/utils/financialMath.ts
export function futureValue(
  initialAmount: number,
  monthlyPayment: number,
  monthlyRate: number,
  months: number
): number {
  if (months <= 0) return initialAmount;
  if (monthlyRate === 0) return initialAmount + monthlyPayment * months;
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  return initialAmount * compoundFactor + monthlyPayment * ((compoundFactor - 1) / monthlyRate);
}

export function apyToMonthlyRate(apyPercent: number): number {
  return Math.pow(1 + apyPercent / 100, 1 / 12) - 1;
}
```

### Where it appeared

| Location | Impact | Fix Date |
|----------|--------|----------|
| **PreDream simulation** (`lib/pre-dream/calculations.ts`) | Overstated returns by up to 38% (diBoaS 7% APY, $100/mo, 10yr: showed $23,606 instead of correct $17,105) | 2026-03-20 |
| **Goal card 2: Emergency Fund** (CMO copy) | Off by $140 ($7,259.84 shown vs $7,119.59 correct) | 2026-03-24 |
| **Goal card 3: Christmas Bonus** (CMO copy) | Advantage overstated 2.2× ($78.60 shown vs $35.56 correct). Used `$1,200 × 1.07 = $1,284` instead of monthly compounding → $1,238.03 | 2026-03-24 |
| **CashFlow calculator** | Same formula class — 3.7% overstatement | 2026-03-20 |

### Root cause

AI-generated copy applied `total × (1 + APY)` — a lump-sum formula — to scenarios with monthly contributions. This was not caught because the numbers "looked reasonable" without cross-checking against the compound interest formula.

---

## Verified Reference Values

All values computed with `futureValue()` from `lib/utils/financialMath.ts`. These are the canonical values for translation files and marketing copy.

### PreDream Simulation (Safety 7% APY, $0 initial, $100/month)

| Duration | diBoaS 7% | US Bank 0.45% | Difference |
|----------|-----------|---------------|------------|
| 1 year | $1,238.03 | $1,202.47 | $35.56 |
| 5 years | $7,119.59 | $6,135.75 | $983.84 |
| 10 years | $17,105.17 | $12,271.18 | $4,833.99 |
| 30 years | $116,945.26 | $38,529.97 | $78,415.29 |

### Goal Cards (used in B2C landing page)

**Card 1: Retirement** ($100/mo, 30 years)
- diBoaS 7%: **$116,945.26**
- Bank 0.45%: **$38,529.97**
- Difference: **$78,415.29**

**Card 2: Emergency Fund** ($100/mo, target ~$7,200)
- diBoaS 7% in 5yr: **$7,119.59**
- Bank 0.45% in 6yr: **$7,296.49**
- Framing: 1 year less with diBoaS

**Card 3: Christmas Bonus** ($100/mo, 1 year)
- diBoaS 7%: **$1,238.03**
- Bank 0.45%: **$1,202.47**
- Difference: **$35.56**

### Bank Rates by Locale

| Locale | Benchmark | Rate | Source |
|--------|-----------|:----:|--------|
| en (US) | FDIC National Average Savings | 0.45% | FDIC |
| pt-BR (Brazil) | Poupança (Selic-linked) | 7.50% | Banco Central do Brasil |
| es (Spain/LatAm) | ECB Deposit Facility Rate | 3.25% | European Central Bank |
| de (Germany) | ECB Deposit Facility Rate | 3.25% | European Central Bank |

**Important:** At 7.50%, Brazilian Poupança outperforms the Safety strategy (7% APY) in nominal BRL terms. The PT-BR comparison uses the currency hedge model (below) to show the BRL→USD→yield→BRL advantage.

---

## Currency Hedge Model (PT-BR and future locales)

### Problem
diBoaS converts local currency (BRL) to USDC, earns yield in USD, then reconverts. A simple comparison of nominal BRL interest vs USD interest is misleading because it ignores exchange rate depreciation.

### Solution: `futureValueWithCurrencyHedge()`

Located in `lib/utils/financialMath.ts`. Currency-agnostic — accepts exchange rate config as a parameter, never references BRL specifically.

**Flow:**
1. Convert local currency → yield currency at current exchange rate
2. Apply `futureValue()` in yield currency at strategy APY
3. Convert yield currency → local currency at **projected** exchange rate

**Capped depreciation formula:**
```
effectiveYears = min(investmentYears, maxDepreciationYears)
projectedRate = currentRate × (1 + annualDepreciation)^effectiveYears
```

With 12% annual depreciation and 3-year cap:
- 1yr → rate × 1.12¹ = rate × 1.12
- 3yr → rate × 1.12³ = rate × 1.4049
- 5yr → rate × 1.12³ = rate × 1.4049 (capped)
- 30yr → rate × 1.12³ = rate × 1.4049 (capped)

**Why cap at 3 years?** Without a cap, 30yr at 12% → rate × 29.96, producing a projected rate of ~157 BRL/USD — absurd and misleading. The 3-year cap keeps short-term projections honest while preventing speculative long-term projections.

### Exchange Rate Config

Stored in `BANK_RATE_SOURCES` (`lib/dream-mode/constants.ts`) as an optional `exchangeRate` field:

```typescript
exchangeRate: {
  localCurrency: 'BRL',
  yieldCurrency: 'USD',
  currentRate: 5.2546,       // 1 USD = 5.2546 BRL (BCB, 2026-03-15)
  annualDepreciation: 0.12,  // 12% — 2-year BRL/USD average
  maxDepreciationYears: 3,   // Cap depreciation projection
  rateDate: '2026-03-15',
  depreciationBasis: '2-year average BRL/USD',
}
```

EN, DE, ES locales have no `exchangeRate` — their yield currency matches local currency, so standard `futureValue()` is used.

### Monthly contributions simplification
All monthly BRL contributions convert at the current exchange rate. This is conservative (later months would convert at a slightly worse rate), transparent, and avoids false precision. Footnotes state "Câmbio ilustrativo."

### PT-BR Reference Values (computed with `futureValueWithCurrencyHedge()`)

Parameters: rate=5.2546, depreciation=12%, cap=3yr, APY=7%, bank=7.5% (Poupança)

| Scenario | Params | USD FV | Proj. Rate | BRL (diBoaS) | BRL (Bank) | Advantage |
|----------|--------|--------|------------|-------------|------------|-----------|
| Comparison table | R$1,000 lump, 1yr | $203.63 | 5.8852 | R$1,198 | R$1,075 | ~+R$198 |
| Christmas | R$200/mo, 12mo | $471.22 | 5.8852 | R$2,773 | R$2,481 | ~R$290 |
| Wealthy | R$400/mo, 60mo | $5,420 | 7.3823 | R$40,010 | R$28,826 | ~R$11k |
| Retirement | R$100/mo, 360mo | $22,256 | 7.3823 | R$164,300 | R$128,289 | ~R$36k |
| Emergency | R$300/mo, 60mo | $4,065 | 7.3823 | R$30,008 | R$21,620 | time-based |

### Future expansion (JPY, MXN, ARS)
Add a new locale entry in `BANK_RATE_SOURCES` with its own `exchangeRate` config. The calculation functions are currency-agnostic.

---

## Prevention Rules

1. **All financial calculations must use `futureValue()` from `lib/utils/financialMath.ts`** — never inline a formula.
2. **Any marketing copy containing dollar amounts must be cross-checked** against `futureValue()` (or `futureValueWithCurrencyHedge()` for hedge locales) before publishing.
3. **Never apply a lump-sum multiplier** (`total × (1 + rate)`) to monthly contribution scenarios.
4. **Bank rates must be locale-aware** — use `BANK_RATE_SOURCES` constant, not a hardcoded global rate.
5. **Test edge cases:** 0 months, 0 rate, 0 initial amount, 0 monthly payment — all must return sensible values.
6. **Currency hedge locales (PT-BR etc.) must use `futureValueWithCurrencyHedge()`** — never apply depreciation to bank interest or compute yield in local currency directly.
7. **PT-BR translation values must be generated by running the actual function** — zero tolerance for pre-calculated estimates.
