# Financial Calculations — Formulas, Model & Reference Values

**Last updated:** 2026-05-13

This document describes the financial calculation model used across the diBoaS platform (comparison table, goal cards, PreDream, 9-tool calculator suite, lesson). All formulas are implemented in `lib/market-data/formulas/` (split into `core.ts` and `currencyHedge.ts`). The canonical specification is `docs/audit/PREPARING_FOR_ANALYTICS_DATA.md` (Sections 14-17).

---

## Core Formula

All financial calculations use the standard compound interest + annuity formula:

```
FV = S × (1+r)^n + PMT × ((1+r)^n - 1) / r
```

Where:
- **S** = initial lump sum
- **PMT** = monthly contribution
- **r** = monthly interest rate (converted from APY via geometric conversion, never `r/12`)
- **n** = total months

**Implementation:** `futureValue()` in `lib/utils/financialMath.ts` and `calculateMonthlyContributions()` in `lib/market-data/formulas.ts`.

**Rate conversion:** `annualToMonthlyRate(r) = (1 + r)^(1/12) - 1` — takes decimal (0.07 for 7%).

---

## Data Source

All market rates come from `MarketDataService` (`lib/market-data/service.ts`), which reads from `FALLBACK_MARKET_DATA` in `lib/market-data/constants.ts`. All rates are **5-year averages (2021-2025)** per Strategy Board decision. Full year-by-year breakdown with sources in `docs/audit/YIELD_INFLATION_FX.md`.

### Bank / Savings Rates

| Locale | Product | Rate | Source |
|--------|---------|:----:|--------|
| US | FDIC Avg Savings | 0.32% | FRED SNDR |
| Brazil | Poupanca | 6.83% | BCB |
| Spain | Bank Savings | 0.14% | ECB MFI |
| Germany | Tagesgeld | 1.22% | Bundesbank |

Brazil rates are **NET** (after 22.5% IR tax). diBoaS rates are **gross** (before platform fees and user-specific tax). See `docs/audit/PREPARING_FOR_ANALYTICS_DATA.md` Section 13 for rationale.

### diBoaS Strategy Rates (product surfaces — Strategies / Dream-mode)

| Path | APY |
|------|:---:|
| Safety | 7% |
| Balance | 12% |
| Growth | 18% |

### diBoaS Scenario Rates (educational tools + lesson — Phase 6/7)

`FALLBACK_MARKET_DATA.rates.scenarioRates` — these are SEPARATE from strategyApys and used only by the educational `/tools/*` calculators + `/learn/compound-interest` lesson per GTM Playbook §6.7. Updated 2026-05-12 from 4/7/10 → 7/10/14 to reflect realistic digital-dollar yields across Solana DeFi (Sky / Aave / Compound / Kamino / Jupiter).

| Scenario | Rate | Used by |
|----------|:---:|---|
| Conservative | 7% | All 6 hedged calculators + lesson Beat 2 + chart |
| Historical | 10% | Default highlighted scenario; lesson vignettes (computed dynamically) |
| Optimistic | 14% | Upper bound on charts |

Substantiation: `docs/researches/Stablecoins as Digital Dollar Infrastructure — Regulation, Reserves, Yield, and DeFi Liquidity.md`.

---

## Currency Hedge Model (Non-US Locales)

diBoaS earns yield in USD. For non-US locales, users benefit from local currency depreciation when converting back. The **effective rate model** computes:

```
effectiveLocalAPY = (1 + usdYield) × (1 + localDepreciation) - 1
```

Then standard annuity formula applies at the effective rate. This is simpler and more conservative than the old explicit conversion model (which assumed all future deposits convert at today's spot rate).

### Exchange Rate Config

| Currency | Depreciation | Cap | Basis |
|----------|:----------:|:---:|-------|
| BRL/USD | 3.00% | Uncapped | 20-year historical avg (6-8%), adjusted conservative |
| EUR/USD | 0.90% | Uncapped | 5-year average |

**All non-US locales use the currency hedge** — not just PT-BR. Germany and Spain also benefit from EUR depreciation vs USD.

### Effective APYs by Locale

For the Strategies product surface (Safety APY 7%, Balance 12%, Growth 18%):

| Locale | diBoaS Safety | Bank | Advantage |
|--------|:----------:|:----:|:---------:|
| US | 7.00% | 0.32% | +6.68 pp |
| Brazil | 10.21% (7% + 3% BRL dep.) | 6.83% | +3.38 pp |
| Spain | 7.96% (7% + 0.9% EUR dep.) | 0.14% | +7.82 pp |
| Germany | 7.96% (7% + 0.9% EUR dep.) | 1.22% | +6.74 pp |

For the educational tools (Conservative 7% / Historical 10% / Optimistic 14% in USD), the same effective-rate model applies — multiply `(1 + 0.07)(1 + dep) − 1`, `(1 + 0.10)(1 + dep) − 1`, `(1 + 0.14)(1 + dep) − 1` to get the per-locale effective APY shown in tool surfaces.

**Implementation:** `calculateMonthlyWithCurrencyHedge()` and `calculateWithCurrencyHedge()` in `lib/market-data/formulas/currencyHedge.ts`.

---

## Inflation Model

| Locale | Current (2025) | 5-Year Avg | Rule |
|--------|:-----------:|:----------:|------|
| US | 2.60% | 4.50% | Goals ≤24 months → current; >24 months → 5yr avg |
| Brazil | 4.26% | 5.90% | Same rule |
| Spain | 2.70% | 4.10% | Same rule |
| Germany | 2.20% | 4.10% | Same rule |

**Implementation:** `selectInflationRate()` in `lib/market-data/formulas.ts`. Never hand-pick inflation in callers.

---

## Consumers

All financial display surfaces read from the same `MarketDataService`:

| Component | What it computes | Bank rate used |
|-----------|------------------|----------------|
| **ComparisonTable** | 1-year lump-sum returns for 4 products | `bankRates[locale].savings` |
| **GoalExampleCards** | Monthly contribution scenarios (retirement, emergency, christmas, 10% rule) | `bankRates[locale].savings` |
| **PreDream** | Interactive simulation with user-configurable inputs | `bankRates[locale].savings` |
| **CompoundInterestCalculator (lesson)** | `/learn/compound-interest` Beat 3 — non-hedged scenario rates per Q7(a) | `bankRates[locale].savings` |
| **CompoundInterestCalculator (tools)** | `/tools/{compound-interest,retirement,goal-savings}` — currency-hedged for non-USD locales per Phase 7 Q7(a) | same + `calculateCompoundProjectionHedged()` |
| **EmergencyFundCalculator** | `/tools/emergency-fund` — months-to-target with inflation + currency-hedge | same + `monthsToInflationAdjustedTarget()` + effective-rate APY |
| **TimeToTargetCalculator** | `/tools/time-to-target` — 4 scenarios, hedge applied per non-USD locale | same |
| **IdleCashCalculator** | `/tools/idle-cash` — B2B lump-sum with `calculateWithCurrencyHedge()` for non-USD | user-overridable + canonical default |
| **InflationImpactCalculator** | `/tools/inflation-impact` — inflation-only (no hedge per Q3a) | n/a |
| **CurrencyDepreciationCalculator** | `/tools/currency-depreciation` — already FV-shaped with hedge | n/a |
| **CardFeesCalculator** | `/tools/card-fees` — processor fee projection, locale-aware | n/a (fee not rate) |
| **CalculatorVignettes** | Lesson Beat 2 — dynamic 12-year FV via `calculateMonthlyContributions(yearlyAmount/12, 0.10, 0, 144)` | non-hedged per Q7(a) |
| **B2B landing-b2b.json cards** | Payment Fees + Idle Cash — values derived once via `scripts/derive-b2b-card-numbers.mjs` | canonical per locale |

The `ComparisonTable` uses `calculateLumpSum()` and `calculateWithCurrencyHedge()`. The `GoalExampleCards` uses `calculateMonthlyContributions()` and `calculateMonthlyWithCurrencyHedge()` via the `useGoalCardData` hook (the canonical hedge precedent for months-shaped tools — see `useGoalCardData.ts:57-61`). The 6 hedged Phase-7 tools follow either the `ComparisonTable` precedent (FV-shaped) or the `useGoalCardData` precedent (months-shaped) per `docs/audit/PRE_PHASE_7_TOOLS_POLISH.md` §5.1 — the two patterns are intentionally distinct.

---

## Bug History

### The Lump-Sum Multiplier Bug (Fixed 2026-03-20)

Multiple components used `totalInvestment × (1 + APY)` — a lump-sum formula — for monthly contribution scenarios. This overstated returns by up to 38%.

**Root cause:** AI-generated copy applied lump-sum formula to monthly scenarios.

**Fix:** All calculations now use `futureValue()` with proper monthly compounding.

### The Explicit Conversion Model (Replaced 2026-04-02)

The old `futureValueWithCurrencyHedge()` in `financialMath.ts` converted each payment BRL→USD at today's rate, compounded in USD, then reconverted at a projected rate. This produced ~7% higher results on 5-year horizons and ~32% higher on 30-year horizons compared to the effective rate model.

**Why replaced:** The old model implicitly assumed future deposits convert at today's spot rate — unrealistic. The effective rate model is more conservative and mathematically cleaner.

**Old functions removed:** `projectedExchangeRate()` and `futureValueWithCurrencyHedge()` from `financialMath.ts`. Replaced by `calculateMonthlyWithCurrencyHedge()` and `calculateWithCurrencyHedge()` in `lib/market-data/formulas/currencyHedge.ts`.

### Inflation/100 Double-Conversion Bug (Fixed 2026-05-13)

`EmergencyFundCalculator` was reading `snapshot.inflationRates.rates[locale].average5y` (already a decimal like `0.045`) and dividing it by 100 again before passing to `monthsToInflationAdjustedTarget()` — effectively making inflation impact 100× too small. Bug pre-existed Phase 7; caught and fixed inline during the Phase-7 Emergency Fund hedge rewrite (CC2).

**Convention** (now CLAUDE.md "Already in place"):
- `inflationRates.*` and `exchangeRates.*.annualDepreciation` are **decimals** (0.045 = 4.5%; 0.03 = 3%). Pass directly to formulas, never `/100`.
- `bankRates.*.savings` and `scenarioRates.*` are **percent** (0.32 = 0.32%; 7 = 7%). Divide by 100 before passing to formulas.

### Compound Interest Engine Split (Phase 7 Q7a, 2026-05-13)

Phase 7 introduced `calculateCompoundProjectionHedged()` in `lib/compound-interest/calculatorHedged.ts` alongside the existing `calculateCompoundProjection()`. Both wrap canonical formulas. The lesson at `/learn/compound-interest` uses `calculateCompoundProjection` (no hedge — pure educational math). The 3 tool pages `/tools/{compound-interest, retirement, goal-savings}` use `calculateCompoundProjectionHedged()`, which applies `effectiveLocalAPY = (1 + usdYield)(1 + localDepreciation) − 1` to scenario rates for non-USD locales. **NEVER consolidate** the two functions with a `hedge: boolean` flag — discipline documented as R1 in `docs/audit/AUDIT_PRE_PHASE_7.md`.

---

## Prevention Rules

1. **All calculations use `lib/market-data/formulas.ts`** — never inline a formula.
2. **All rates come from `MarketDataService`** — never hardcode rates in components or translations.
3. **Never apply a lump-sum multiplier** to monthly contribution scenarios.
4. **Bank rates are locale-aware** — read from `marketData.rates.bankRates[locale]`.
5. **Non-US locales use currency hedge** — `calculateMonthlyWithCurrencyHedge()` for monthly, `calculateWithCurrencyHedge()` for lump sum.
6. **Inflation uses `selectInflationRate()`** — never pick ad hoc in callers.
7. **Emergency fund uses `monthsToInflationAdjustedTarget()`** — not the static target function.
8. **All displayed rate text must match the rates used in formulas** — bankSource strings must reference the same rate as `marketData.rates.bankRates[locale].savings`.
