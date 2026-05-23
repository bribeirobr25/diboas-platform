# Financial Calculations — Formulas, Model & Reference Values

**Last updated:** 2026-05-23 (added §"Asset-history monthly-precision FX path — design notes" documenting the `buildFxLookup` + `ASSET_NATIVE_CURRENCY` + forward-fill pattern landed alongside the v1.5 Asset History cross-currency work)

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

Updated 2026-05-23 (TOOLS_IMPROVEMENT.md Phase C, Decisions PT1/PT3 Bar-signed): bank rates refreshed to Phase A live values; depreciation rates refreshed to live BCB PTAX / ECB EXR full-series CAGRs. For the Strategies product surface (Safety APY 7%, Balance 12%, Growth 18%):

| Locale | diBoaS Safety | Bank | Advantage |
|--------|:----------:|:----:|:---------:|
| US | 7.00% | 0.38% (FDIC live) | +6.62 pp |
| Brazil | 13.65% (7% + 6.21% BRL dep.) | 6.83% (5y avg poupança) / 6.17% (live) | +6.82 to +7.48 pp |
| Spain | 8.32% (7% + 1.23% EUR dep.) | 2.00% (cuenta remunerada typical) | +6.32 pp |
| Germany | 8.32% (7% + 1.23% EUR dep.) | 2.30% (Tagesgeld typical) | +6.02 pp |

For the educational tools (Conservative 7% / Historical 10% / Optimistic 14% in USD), the same effective-rate model applies — multiply `(1 + 0.07)(1 + dep) − 1`, `(1 + 0.10)(1 + dep) − 1`, `(1 + 0.14)(1 + dep) − 1` to get the per-locale effective APY shown in tool surfaces.

**Implementation (Phase C+D updated 2026-05-23):** `calculateMonthlyWithCurrencyHedge()` and `calculateWithCurrencyHedge()` in `lib/market-data/formulas/currencyHedge.ts`. Forward projections now route through `resolveHorizonMatchedDepreciation()` (lib/market-data/formulas/horizonMatchedCagr.ts) which prefers a horizon-matched CAGR from `monthlySeries.fx[currency]` when available; falls back to the static constant when monthly data is absent. The constant values above are the data-unavailable fallback.

### Horizon-Matched Forward Projection (Added 2026-05-23, Phase D)

Per TOOLS_IMPROVEMENT.md plan v1.1 §6.1 (CTO Review H1): forward-projection FX depreciation is derived from `monthlySeries.fx[currency]` using a CONTINUOUS trailing-N-year window:

```
windowMonths = min(horizonYears × 12, totalAvailableMonths)
CAGR = (endCloseLocalPerUsd / startCloseLocalPerUsd)^(1/years) − 1
```

A 5y horizon uses the trailing 60 months; a 7y horizon uses the trailing 84 months; a 16y+ horizon saturates at the full available series. **No step-function discontinuity** at any horizon boundary. Sentinel `0` returned when series has < 12 months (P7 graceful fallback; calculator degrades to non-hedged).

For pt-BR Retirement at 25y horizon: window saturates at 197 months → full-series BRL CAGR = 6.21%/yr → effective Historical APY = 16.83% → R$7.34M FV at R$2,000/mo (Phase A authoritative, Bar-signed PT1).

For DE/ES Retirement at 25y horizon: window saturates at 196 months → full-series EUR CAGR = 1.23%/yr → effective Historical APY = 11.35% → €608,815 FV at €400/mo (Bar-signed PT3).

---

## Path-Dependent FX Hedge (Added 2026-05-16)

Forward-projection calculators (`/tools/compound-interest`, `/tools/retirement`, `/tools/goal-savings`) use the smoothed `calculateCompoundProjectionHedged()` with `effectiveLocalAPY = (1 + usdYield)(1 + localDepreciation) − 1`. This is correct for FORWARD projections — you cannot bucket-walk a future you do not have data for.

For RETROSPECTIVE contexts (the asset-history tool plus retrospective modes in `/tools/inflation-impact`, `/tools/currency-depreciation`, and `/tools/goal-savings`), the smoothed CAGR model under-estimates outcomes over multi-year DCA windows when the FX path is non-uniform. Each monthly DCA contribution sees a different FX rate in reality; the smoothed CAGR treats them uniformly. For BRL 2010→2026 (CAGR ~6.7% over 16 yr with extended weak-BRL stretches in 2014-2016 and 2020-2022), the smoothed model under-counts DCA terminal value by ~10-15% vs bucket-walked. EUR's smoother path makes the gap ~2-3%.

### When to use which

- **Forward projection:** `calculateMonthlyWithCurrencyHedge()` (smoothed annuity) plus `calculateCompoundProjectionHedged()`. Smoothed CAGR is correct.
- **Retrospective DCA, compound-interest family** (Goal Savings retrospective): `calculateMonthlyPathDependentHedge()` (Phase B, 2026-05-16). Walks 5-year `FxBucket` averages from `historicalAnchors.fxBuckets[CURRENCY]`. Coarser granularity is acceptable here because compound-interest's contribution stream is uniform (same monthly amount; bucket-average FX captures the macro path).
- **Retrospective DCA, asset-history** (`/tools/asset-history` for cross-currency cases): monthly-precision FX via `buildFxLookup()` in `lib/asset-history/calculator.ts` (added 2026-05-23). Each month's contribution is converted to asset-native currency at THAT month's close-of-month FX rate from `monthlySeries.fx[CURRENCY]`; the unit math runs in asset-native; terminal is converted back at the end-month's FX rate. Finer granularity than the bucket walk — necessary because asset-history's DCA buys real units at real prices and any FX smoothing biases the unit count.

### Asset-history monthly-precision FX path — design notes (2026-05-23)

The `buildFxLookup(fx, fromCcy, toCcy, asset)` helper composes single-leg lookups via USD:
- `from === to`: identity (factor = 1).
- One side is USD: read `closeLocalPerUsd` from the non-USD currency's monthly FX series; multiply (USD → local) or invert (local → USD).
- Neither side is USD: cross-rate = `fromCcy → USD × USD → toCcy`.

**Asset native currency map** (`ASSET_NATIVE_CURRENCY` in `lib/asset-history/calculator.ts`):
- USD: BTC, SP500, QQQ, MSCI_WORLD, GOLD, TLT
- BRL: IBOVESPA
- EUR: DAX

**Forward-fill for end-of-window gaps:** when the requested month is not in the FX series (e.g., ECB EUR data lags the asset price series by 1 month), the lookup returns the latest available month with `ym ≤ requested` via binary search. Standard end-of-window handling; throws only if no earlier month exists either.

**`displayCurrency` arg** (USD / BRL / EUR; defaults to USD): when set and ≠ asset native, triggers the FX path. When omitted or equal to asset native, the calculator runs in single-currency mode (no FX conversion) — preserves backwards compatibility with the pre-2026-05-23 USD-only tests.

### R1 discipline at the methodology axis

The retrospective and forward variants ship as **separate named functions** — there is no `pathDependent: boolean` flag on the smoothed function. This is the same R1 discipline applied earlier to the lesson-vs-tools split (`calculateCompoundProjection` vs `calculateCompoundProjectionHedged`). Two named functions, never a flag.

### Validation

Cross-validated against `docs/researches/btc-vs-assets-inflation-fx-final-analysis.md` Part 5 (Brazilian R$100/mo × 196 months Jan 2010 → May 2026) for the three USD-yield scenarios:

| Scenario | Research target | Tolerance |
|---|---|---|
| 5% USD | R$57,400 | ±5% |
| 7% USD | R$69,160 | ±5% |
| 10% USD | R$94,765 | ±5% |

All three pass within tolerance. Scenario A (15% BRL nominal) is BRL-native and uses the existing `calculateMonthlyContributions()` — not in path-dependent scope.

**Implementation:** `calculateMonthlyPathDependentHedge()` in `lib/market-data/formulas/currencyHedge.ts`. Bucket type: `FxBucket` in `lib/market-data/types.ts` (date-range shape supports coarse 5-year and annual buckets without schema change).

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
