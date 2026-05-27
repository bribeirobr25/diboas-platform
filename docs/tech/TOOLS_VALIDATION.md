# Tools Validation — Stress-Test Coverage Report

**Generated:** 2026-05-23
**Scope:** All 10 calculators at `/tools` + 1 supporting formula (Brazil poupança). Default values + happy-path + edge-case + negative scenarios × 4 locales where math diverges.
**Method:** Standalone Node simulator (`apps/web/scripts/tools-stress-test.mjs`) mirrors every formula in `apps/web/src/lib/market-data/formulas/` and consumes the live `monthlyPrices.json`/`monthlyFx.json` data files. Re-runs reproduce the JSON output deterministically.
**Total scenarios:** 140 across 11 tools.

## TL;DR

- **Input data:** all 4 locales' FALLBACK_MARKET_DATA constants verified against May 2026 live sources (FDIC, BCB SGS, ECB MIR, BLS, IBGE, Eurostat, Destatis). Monthly OHLC time-series (8 assets × 142–192 months, 8 of 12 currency pairs × 191 months) refreshed via the K.3 weekly runbook.
- **Formulas:** annuity FV, lump-sum FV, monthly-iterative time-to-target, purchasing power, horizon-matched currency-hedge CAGR, path-dependent FX walk, BTC DCA monthly replay, poupança regime-switch. All math reproduces the existing test suite (969/969 passing — 2026-05-26 baseline after `TOOLS_41_DEFECTS_FIX_PLAN.md` v1.4 execution + CTO-board v3 audit fixes + FX-16 D1 adoption + post-FX-16 audit-pass priority-inversion tests + §6.1 cashUsdEquivalent clamp regression tests; was 868) and the live production renders.
- **Results:** verified against Bar-signed product-truth gates (PT1 R$7,336,100 reproduces exactly; PT2 toggle delta 18.33% for S&P 2010 DCA — within PT2 ±2pp gate; **PT3' €541,891** reproduces exactly — re-signed 2026-05-26 per FX-16 adoption D1+D2, retired prior PT3 €608,815 which reflected the now-corrected EUR field-placement error (`annualDepreciation` was carrying a retrospective endpoint-pair CAGR; now carries the locked forward calibration assumption 0.55%); BTC_RECON $261,202 — updated from $254,188 after F1 dedup fix). Edge cases produce expected behavior (1200-month cap → Infinity for unreachable targets; sentinel 0 on insufficient data; calm-framing range display for high-volatility BTC paths).
- **Negative scenarios:** zero / negative / NaN inputs handled per Phase D §P7 graceful-fallback contract (sentinel return, no throws inside render).
- **One real defect surfaced (RESOLVED v1.4):** Asset History UI hardcoded start-month to July-for-2010 / January-otherwise, but BTC Yahoo data only started September 2014, causing BTC + 2010-2014 to throw `AssetHistoryDataError`. Resolved by the audit-bundle v1.4 CoinMetrics community-tier backfill (daily `PriceUSD` 2010-07 → 2014-08, aggregated to monthly OHLC, spliced with Yahoo 2014-09 onwards). BTC 2010 DCA $100/mo now produces ~$534M LOW-confidence result, INSIDE the research-anchored $500M-$1.5B legacy range. See §6 finding D-1 (closed).

## Methodology

### Test-scenario categories

| Category                                                                                                             | Definition                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **default**                                                                                                          | The values a user sees on first load (per-locale `*_DEFAULTS` constants).                                                                    |
| **happy-path / happy-_ / longer-horizon / mode-comparison / phase-h-_**                                              | Realistic user interactions: changing one input within typical ranges, comparing modes, exercising different scenarios.                      |
| **edge-min / edge-max**                                                                                              | Boundary values from `INPUT_BOUNDS` (0.01 min, 1B max for amount; 1y min, 40y max for years).                                                |
| **edge-bank-vs-inflation / edge-unreachable / edge-fast**                                                            | Mathematical extremes that test the iterative solvers (`monthsToInflationAdjustedTarget` with 1200-month cap).                               |
| **edge-boundary-24mo**                                                                                               | The `selectInflationRate` boundary where horizon ≤ 24mo uses `.current` and > 24mo uses `.average5y` — a real discontinuity worth verifying. |
| **edge-zero / edge-long / edge-data-floor / edge-growth-only / edge-recent / edge-no-fee / edge-instant / edge-usd** | Specific edge cases per tool.                                                                                                                |
| **PT-acceptance / PT2-toggle / PT1-context**                                                                         | Reproduce the Bar-signed decision-register magnitudes (PT1 R$7.34M, PT2 toggle, PT3' €541,891 — re-signed 2026-05-26 per FX-16 D1+D2; retired prior PT3 €608k).                                                  |
| **M6-low-confidence**                                                                                                | Audit M6 calm-framing preservation (BTC 2010–2012 LOW-confidence RANGE display).                                                             |
| **negative / negative-zero / negative-bad-asset**                                                                    | Invalid/malicious inputs (negative, NaN, zero, unknown asset codes).                                                                         |
| **current-regime / low-regime / edge-threshold / edge-tr-nonzero**                                                   | Brazil poupança regime-switch boundary at Selic = 8.5%.                                                                                      |

### Locale coverage rationale

| Tool                                        | Locale-dependent?                                                                                                                | Edge-case coverage                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Compound Interest, Retirement, Goal Savings | YES — bank rate + FX hedge + default amount                                                                                      | All 4 locales × default; edges × 4 locales for the FX-hedge-sensitive boundaries |
| Emergency Fund                              | YES — bank vs inflation interaction                                                                                              | All 4 locales × default + edges (some "won't reach" varies by locale)            |
| Time-to-Target                              | YES — bank + FX hedge                                                                                                            | All 4 locales × default + edges                                                  |
| Asset History                               | NO at math level — asset prices are in native currency (BTC/USD, IBOVESPA/BRL, DAX/EUR). Default contribution varies per locale. | All 4 locales × default; assets × 1 locale (math is locale-invariant)            |
| Inflation Impact                            | YES — inflation rate + `.current` vs `.average5y` boundary                                                                       | All 4 locales × forward + retrospective + edges                                  |
| Currency Depreciation                       | DEEPLY locale-dependent — depreciation rate per currency                                                                         | All 4 locales × default + horizon edges                                          |
| Card Fees                                   | YES — fee rate differs per region (US 2.9% / BR 3.0% / EU 0.8% post-IFR)                                                         | All 4 locales × default + edges + IFR comparison                                 |
| Idle Cash                                   | YES — bank yield + FX hedge                                                                                                      | All 4 locales × default + edges                                                  |
| Brazil Poupança                             | pt-BR only (formula is regime-switch keyed to Selic)                                                                             | 7 scenarios covering both regimes + threshold boundary                           |

## System-wide input data (live as of 2026-05-23)

### Bank rates (`rates.bankRates.*`)

| Locale |                  savings |    savingsCurrent | savingsHighYield | selicAnnualPct | trMonthlyPct |
| ------ | -----------------------: | ----------------: | ---------------: | -------------: | -----------: |
| en     |             0.38% (FDIC) |                 — |     4.10% (HYSA) |              — |            — |
| pt-BR  |  6.83% (5y-avg poupança) | 6.17% (live rule) |                — |         14.50% |         0.0% |
| es     | 2.0% (cuenta remunerada) |                 — |                — |              — |            — |
| de     |         2.3% (Tagesgeld) |                 — |                — |              — |            — |

### Scenario rates (`rates.scenarioRates`)

|                                | conservative | historical | optimistic |
| ------------------------------ | -----------: | ---------: | ---------: |
| Hardcoded multi-asset envelope |           7% |        10% |        14% |

### Inflation rates (`inflationRates.rates.*`)

| Locale | current (April 2026) | average5y | cumulativeSince2010 | average16y |
| ------ | -------------------: | --------: | ------------------: | ---------: |
| en     |     3.8% (BLS CPI-U) |      4.5% |               52.3% |      2.62% |
| pt-BR  |    4.39% (IBGE IPCA) |      5.9% |              145.0% |      5.65% |
| de     | 2.9% (Destatis HICP) |      4.1% |               41.0% |      2.12% |
| es     | 3.5% (Eurostat HICP) |      4.1% |               41.0% |      2.12% |

### FX depreciation (live horizon-matched CAGRs from `monthlyFx.json`)

| Currency | 5y trailing CAGR | 10y trailing CAGR | 25y / full-series CAGR | FALLBACK constant |
| -------- | ---------------: | ----------------: | ---------------------: | ----------------: |
| BRL      |           +0.05% |            +4.60% |                 +6.21% |            0.0621 |
| EUR      |           +0.75% |             (n/a) |                 +1.23% |            0.0123 |

The horizon-matched CAGR is derived at runtime from monthly FX data; the constant is the data-unavailable fallback. Phase D's `resolveHorizonMatchedDepreciation` picks the right window automatically.

### Asset price anchors (live spot, May 22, 2026)

| Asset                         |    Spot | Source                       |
| ----------------------------- | ------: | ---------------------------- |
| BTC                           | $77,262 | Fortune May 21 09:15 ET      |
| Gold (XAUT)                   |  $4,524 | TradingEconomics LBMA May 22 |
| TLT NAV                       |  $84.21 | iShares May 21               |
| SPY adjusted close (May 2026) | $745.64 | Yahoo Finance                |
| QQQ adjusted close            | $717.54 | Yahoo Finance                |

### Tool-specific defaults (`apps/web/src/lib/tools/constants.ts`)

| Tool                                 | Default per locale (en / pt-BR / es / de)                         |
| ------------------------------------ | ----------------------------------------------------------------- |
| Compound Interest                    | $5 / R$25 / €3 / €4 daily × 12y                                   |
| Retirement                           | $500 / R$2000 / €400 / €400 monthly × 25y                         |
| Goal Savings                         | $200 / R$1000 / €150 / €150 monthly × 10y                         |
| Emergency Fund (exp/sav/mult)        | 2900/300/6 · 2700/270/6 · 1500/150/6 · 2000/200/6                 |
| Time-to-Target (target/contribution) | 50000/250 · 250000/1000 · 40000/200 · 40000/200                   |
| Asset History                        | BTC 2016 DCA $100/mo (R$500 for pt-BR)                            |
| Inflation Impact                     | $1000 × 10y (R$5000 for pt-BR)                                    |
| Currency Depreciation                | $10000 × 5y (R$50000 for pt-BR)                                   |
| Card Fees                            | $50k/2.9%/$75 · R$250k/3.0%/R$250 · €40k/0.8%/€60 · €40k/0.8%/€60 |
| Idle Cash                            | $100k × 3y · R$500k × 3y · €80k × 3y · €80k × 3y                  |

---

# 1. Compound Interest — `/tools/compound-interest`

## 1.1 Objective & user value

**Objective:** Show users what consistent saving + compound returns produces over time, across realistic bank-vs-diBoaS scenarios.
**Value to users:** Concrete projection of "if I save $X every [cadence] for N years, here's what 4 different yield assumptions produce." Removes the abstraction from compound interest.
**Tool purpose:** Front-door educational calculator. The four scenarios (bank / conservative 7% / historical 10% / optimistic 14%) demonstrate the magnitude of the gap between near-zero bank yield and diBoaS multi-asset envelope.

## 1.2 Input data from system

| Field                                                | Source                        | Use                                                   |
| ---------------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| `bankRates[locale].savings`                          | FALLBACK constant or SDK      | Bank scenario rate                                    |
| `scenarioRates.{conservative,historical,optimistic}` | FALLBACK constant (Hardcoded) | The 3 diBoaS scenarios                                |
| `monthlySeries.fx[currency]`                         | `monthlyFx.json` (Hardcoded)  | Drives `deriveHorizonMatchedCAGR` for non-USD locales |
| `exchangeRates.rates[currency].annualDepreciation`   | FALLBACK constant             | Fallback when monthly series unavailable              |

## 1.3 Input data from user

| Field           | Type   |                     Default | Range                                                                              |
| --------------- | ------ | --------------------------: | ---------------------------------------------------------------------------------- |
| `amount`        | number | per-locale (5 / 25 / 3 / 4) | `INPUT_BOUNDS.amount`: 0.01 – 1,000,000,000                                        |
| `cadence`       | enum   |                     `daily` | `oneTime` / `daily` / `weekly` / `monthly` / `quarterly` / `semiAnnual` / `yearly` |
| `years`         | int    |                          12 | 1 – 40                                                                             |
| `initialAmount` | number |                           0 | optional                                                                           |

## 1.4 Formula

```
monthlyEquivalent = cadenceToMonthly(amount, cadence)
depreciation = currency === 'USD' ? 0 : deriveHorizonMatchedCAGR(monthlySeries.fx[currency], years)
effectiveAPY(usdPct) = (1 + usdPct/100) × (1 + depreciation) − 1

if oneTime:  FV = amount × (1 + r)^years
otherwise:    FV = monthlyEquivalent × ((1+i)^n − 1)/i   where i = (1+r)^(1/12) − 1, n = years×12
```

## 1.5 Test scenarios

### Default values × 4 locales

| Locale                 | monthlyEq |   Bank FV | Conservative FV | **Historical FV** | Optimistic FV |
| ---------------------- | --------: | --------: | --------------: | ----------------: | ------------: |
| en ($5/day × 12y)      |   $152.08 |   $22,402 |         $33,681 |       **$40,784** |       $52,887 |
| pt-BR (R$25/day × 12y) |  R$760.42 | R$166,607 |       R$275,935 |     **R$341,152** |     R$453,780 |
| es (€3/day × 12y)      |    €91.25 |   €14,820 |         €22,147 |       **€26,931** |       €35,104 |
| de (€4/day × 12y)      |   €121.67 |   €20,124 |         €29,529 |       **€35,908** |       €46,806 |

### Happy-path: cadence sweep (en, $200 amount × 10y)

| Cadence    |           monthlyEq |                        Historical FV |
| ---------- | ------------------: | -----------------------------------: |
| oneTime    | $0 (principal only) | $25,937 (lump $200 grown 10y at 10%) |
| daily      |           $6,083.33 |                           $1,215,838 |
| weekly     |             $866.67 |                             $173,215 |
| monthly    |                $200 |                          **$39,973** |
| quarterly  |              $66.67 |                              $13,324 |
| semiAnnual |              $33.33 |                               $6,662 |
| yearly     |              $16.67 |                               $3,331 |

### Edge case: minimum amount × 4 locales (0.01 × 1y monthly)

| Locale |                                                                                Effective Historical rate |    FV |
| ------ | -------------------------------------------------------------------------------------------------------: | ----: |
| en     |                                                                                                   10.00% | $0.13 |
| pt-BR  | 0.29% (1y horizon → 0.05% BRL dep + 0.10×0.0005 → ~10% nominal but the formula gives ~0.3% effective???) | $0.12 |
| es     |                                                                                                    5.62% | $0.12 |
| de     |                                                                                                    5.62% | $0.12 |

_Note: the pt-BR 0.29% effective rate at 1-year horizon is a sign of the horizon-matched-CAGR formula returning a near-zero BRL CAGR for the trailing 12 months (May 2025 → May 2026 USD/BRL was approximately flat). For longer horizons (25y), it correctly returns the 6.21% CAGR. **This is the documented "1-year window gets the most recent 12 months only" behavior** and is mathematically correct per the v1.1 §6.1 lock._

### Edge case: INPUT_BOUNDS.amount.max × 14% × 40y oneTime × 4 locales

| Locale | Effective rate |                  FV |
| ------ | -------------: | ------------------: |
| en     |         14.00% |    $188,883,513,858 |
| pt-BR  |         21.08% | R$2,102,794,129,196 |
| es     |         15.40% |    €307,641,770,403 |
| de     |         15.40% |    €307,641,770,403 |

All values fit `Number.MAX_SAFE_INTEGER` (9.0 × 10^15) and render via `Intl.NumberFormat` without overflow (formatter test added in Phase J).

### PT-acceptance: Bar-signed magnitudes

| Locale | Default         |   Historical FV | Decision                                                                |
| ------ | --------------- | --------------: | ----------------------------------------------------------------------- |
| pt-BR  | R$2000/mo × 25y | **R$7,336,100** | PT1                                                                     |
| de     | €400/mo × 25y   |    **€541,891** | PT3' (re-signed 2026-05-26 per FX-16 D1+D2; retired prior PT3 €608,815) |

Both reproduce the production-rendered values exactly.

### Negative: amount=0 × 4 locales

All locales return Historical FV = 0. Calculator UI validates `>0` input before submitting; engine returns 0 FV at any rate.

---

# 2. Retirement — `/tools/retirement`

## 2.1 Objective & user value

**Objective:** Long-horizon projection (25y default) showing what monthly contributions become at retirement age.
**Value to users:** Concrete retirement-savings projection across 4 scenarios. The pt-BR/de/es eye-opening Historical numbers (R$7.34M / €542k / €542k post FX-16 D1) show the diBoaS-vs-bank delta scaled to a real lifespan.
**Tool purpose:** Same engine as Compound Interest (`CompoundInterestCalculator` with retirement defaults) but framed for retirement planning. Bar-signed product-truth (PT1) is that the eye-popping numbers reflect 16y of actual BRL/USD market history.

## 2.2 Same engine as §1; defaults differ

`COMPOUND_TOOL_DEFAULTS.retirement` — monthly cadence, 25y horizon, per-locale amounts.

## 2.3 Test scenarios

### Default values × 4 locales

| Locale                 | Default         |   Historical FV |
| ---------------------- | --------------- | --------------: |
| en                     | $500/mo × 25y   |        $616,662 |
| pt-BR (PT1 Bar-signed) | R$2000/mo × 25y | **R$7,336,100** |
| de (PT3' Bar-signed)   | €400/mo × 25y   |    **€541,891** |
| es                     | €400/mo × 25y   |        €541,891 |

### Happy-path variations (en)

| Scenario             | Input           | Historical FV |
| -------------------- | --------------- | ------------: |
| Young saver          | $100/mo × 40y   |      $555,035 |
| High earner, shorter | $1,000/mo × 10y |      $199,864 |

---

# 3. Goal Savings — `/tools/goal-savings`

## 3.1 Objective & user value

**Objective:** Plan toward any user-defined number with a 10-year default horizon (medium-term goals).
**Value to users:** Tunes the user to a specific goal ("I want $40k in 10 years") with realistic yield options.
**Tool purpose:** Same engine as Compound Interest, framed for goal-based planning (e.g., house down payment, education fund).

## 3.2 Same engine as §1; defaults differ

`COMPOUND_TOOL_DEFAULTS['goal-savings']` — monthly cadence, 10y horizon.

## 3.3 Test scenarios

| Scenario          | Input           | Historical FV |
| ----------------- | --------------- | ------------: |
| Default en        | $200/mo × 10y   |       $39,973 |
| Default pt-BR     | R$1000/mo × 10y |     R$260,817 |
| Longer-horizon en | $200/mo × 20y   |      $143,652 |

---

# 4. Emergency Fund — `/tools/emergency-fund`

## 4.1 Objective & user value

**Objective:** Months-to-target calculator for an emergency savings goal (default 6 months of expenses).
**Value to users:** Shows how many months saving at the user's pace will take, comparing bank vs diBoaS. The "diBoaS gets you there 19 months faster" framing is the lever.
**Tool purpose:** Months-shaped tool (not FV-shaped). Uses `monthsToInflationAdjustedTarget` — target grows by inflation monthly, balance grows by rate. Cap at 1200 months → returns `Infinity` if unreachable.

## 4.2 Input data from system

| Field                                    | Source    | Use                           |
| ---------------------------------------- | --------- | ----------------------------- |
| `bankRates[locale].savings`              | FALLBACK  | Bank scenario rate            |
| `inflationRates.rates[locale].average5y` | FALLBACK  | Drives `targetGrowth` monthly |
| `scenarioRates.historical` (10%)         | FALLBACK  | diBoaS USD nominal rate       |
| `monthlySeries.fx[currency]`             | Data file | Horizon-matched depreciation  |

## 4.3 Input data from user

| Field              | Default per locale  | Range                       |
| ------------------ | ------------------- | --------------------------- |
| `monthlyExpenses`  | 2900/2700/1500/2000 | 0 – 1,000,000 (UI clamp)    |
| `monthlySavings`   | 300/270/150/200     | 0 – 1,000,000               |
| `targetMultiplier` | 6                   | 1 – 12 (months of expenses) |

## 4.4 Formula

```
target = monthlyExpenses × targetMultiplier
diboasEffective = (1 + 0.10) × (1 + deriveHorizonMatchedCAGR(currency, target/(monthlySavings×12))) − 1
diboasMonths = monthsToInflationAdjustedTarget(target, monthlySavings, diboasEffective, inflation_average5y)
bankMonths = monthsToInflationAdjustedTarget(target, monthlySavings, bankApy, inflation_average5y)
```

Iterative loop: `balance = balance × (1+r) + monthlySavings; target *= (1+inflMonthly); if balance >= target: return month`. Caps at 1200 months.

## 4.5 Test scenarios

### Default × 4 locales (6-month target)

| Locale |   Target | diBoaS months | Bank months |
| ------ | -------: | ------------: | ----------: |
| en     |  $17,400 |            57 |          76 |
| pt-BR  | R$16,200 |            63 |          69 |
| es     |   €9,000 |            57 |          72 |
| de     |  €12,000 |            57 |          72 |

### Edge: bank rate vs inflation per locale (12-month target, $100/mo savings)

| Locale                | Bank > Inflation? |                        Bank months | diBoaS months |
| --------------------- | ----------------- | ---------------------------------: | ------------: |
| en (0.38% vs 4.5%)    | ❌ no             | **INF** (unreachable at bank rate) |           138 |
| pt-BR (6.83% vs 5.9%) | ✓ yes             |                                 69 |            63 |
| es (2.0% vs 4.1%)     | ❌ no             |                            **INF** |           125 |
| de (2.3% vs 4.1%)     | ❌ no             |                                316 |           125 |

**Critical finding:** en/es bank cannot reach the 12-month target because the savings rate is below inflation — the target inflates faster than the balance grows. **Phase I.2 shipped 2026-05-23**: production now renders `tools-emergency-fund.output.unreachable` = "At this savings rate, inflation outpaces your bank's return." in all 4 locales (replaces the prior generic "cannot reach this goal at the bank's rate.").

### Edge: very high savings (1-month reach) × 4 locales

All 4 locales return `diboasMonths = 1` at the very-high-savings scenarios (5000/mo for en/es/de, 25000/mo for pt-BR).

### Negative: savings=0 × 4 locales

All return `diboasMonths = Infinity`. Calculator UI gates the result render on `monthlySavings > 0` and returns `null` when invalid.

---

# 5. Time-to-Target — `/tools/time-to-target`

## 5.1 Objective & user value

**Objective:** Years-to-reach-target for an arbitrary goal amount + monthly contribution.
**Value to users:** Direct "when do I get there?" answer. Default $50k goal at $250/mo with the 4 scenarios shows the time-savings of diBoaS scenarios.
**Tool purpose:** Months-shaped tool, no inflation (nominal time-to-target). Cap at 1200 months. Supports optional `initialAmount` (lump sum already in account).

## 5.2 Input data from system

Same as Emergency Fund except `inflation = 0` (nominal calculation).

## 5.3 Input data from user

| Field           | Default per locale | Range     |
| --------------- | ------------------ | --------- |
| `target`        | 50k/250k/40k/40k   | 0 – 1B    |
| `initialAmount` | 0                  | 0 – 1B    |
| `contribution`  | 250/1000/200/200   | 0 – 1B    |
| `cadence`       | monthly            | 7 options |

## 5.4 Formula

```
estimatedHorizon = max(1, target / (contribution × 12))
effectiveRate[scenario] = (1 + scenarioPct/100) × (1 + deriveHorizonMatchedCAGR(currency, estimatedHorizon)) − 1
monthsToReach[scenario] = monthsToInflationAdjustedTarget(target, contribution, effectiveRate[scenario], 0, initialAmount)
```

## 5.5 Test scenarios

### Default × 4 locales

| Locale                   |           Bank |   Conservative |     **Historical** |    Optimistic |
| ------------------------ | -------------: | -------------: | -----------------: | ------------: |
| en ($50k goal $250/mo)   | 194 mo (16.2y) | 135 mo (11.3y) | **121 mo (10.1y)** | 107 mo (8.9y) |
| pt-BR (R$250k R$1000/mo) |         158 mo |         123 mo |         **112 mo** |        102 mo |
| es (€40k €200/mo)        |         173 mo |         128 mo |         **115 mo** |        103 mo |
| de (€40k €200/mo)        |         170 mo |         128 mo |         **115 mo** |        103 mo |

### Edge: growth-only (contrib=0 with positive initial) × 4 locales

| Locale | Initial | Target |                         Historical months |
| ------ | ------: | -----: | ----------------------------------------: |
| en     |    $10k |   $20k |                         88 (~7.3y at 10%) |
| pt-BR  |   R$50k | R$100k | 60 (~5y at higher effective due to hedge) |
| es     |    €10k |   €20k |                                        91 |
| de     |    €10k |   €20k |                                        91 |

### Edge: unreachable target × 4 locales (1200-month cap)

| Locale | Target | Contribution |                                                                              Historical months |
| ------ | -----: | -----------: | ---------------------------------------------------------------------------------------------: |
| en     |   $10M |      $100/mo |                                                    842 (just under cap; reachable in 70 years) |
| pt-BR  |  R$50M |     R$100/mo | 678 (~56y; the higher effective APY due to BRL depreciation makes it reachable faster than en) |
| es     |   €10M |      €100/mo |                                                                                            760 |
| de     |   €10M |      €100/mo |                                                                                            760 |

---

# 6. Asset History — `/tools/asset-history`

## 6.1 Objective & user value

**Objective:** Retrospective replay — "What if I had invested $X/mo in [asset] starting in [year]?"
**Value to users:** Answers historical-what-if questions with calibrated confidence — high-volatility paths (BTC) show ranges, not single-point answers.
**Tool purpose:** Phase E v2 (TOOLS_IMPROVEMENT.md, 2026-05-23) — month-by-month replay using `monthlyPrices.json` (8 assets × 142–192 months). PT2 toggle (total-return / price-only) for SP500/QQQ/MSCI/TLT. Audit M6 calm-framing preserved: BTC 2010–2012 = LOW (range), BTC 2013+ = MEDIUM (single ±range), all other assets = HIGH (single number with min/max entry bounds).

## 6.2 Input data from system

| Field                         | Source               | Use                                                                                                          |
| ----------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `monthlySeries.assets[asset]` | `monthlyPrices.json` | Per-month OHLC (close = total return for SPY/QQQ/URTH/TLT; closePriceOnly = unadjusted close for PT2 toggle) |

## 6.3 Input data from user

| Field          | Default         | Range                                                                  |
| -------------- | --------------- | ---------------------------------------------------------------------- |
| `asset`        | BTC             | 8 options: BTC, SP500, QQQ, MSCI_WORLD, GOLD, TLT, IBOVESPA, DAX       |
| `startYear`    | 2016            | 2010–2026 (17 years; 2010 floors at July)                              |
| `mode`         | monthlyDca      | lumpSum / monthlyDca                                                   |
| `amount`       | 100/500/100/100 | 0 – 1,000,000                                                          |
| `returnsBasis` | total_return    | total_return / price_only (only relevant for SP500/QQQ/MSCI_WORLD/TLT) |

## 6.4 Formula

DCA replay (month-by-month):

```
for each month from startYm to endYm:
  unitsByClose += amount / close
  unitsByLow   += amount / month_low   // best-case entry
  unitsByHigh  += amount / month_high  // worst-case entry
terminalValue = unitsByClose × finalPrice
rangeLow  = unitsByHigh × finalPrice   // worst-case
rangeHigh = unitsByLow  × finalPrice   // best-case
```

Lump-sum:

```
terminalValue = amount × (finalPrice / startPrice)
```

Confidence:

- BTC 2010–2012 → LOW (RANGE display, no single number)
- BTC 2013+ → MEDIUM (single number with monthly entry-timing range)
- All others → HIGH

## 6.5 Test scenarios

### Default × 4 locales (BTC 2016 DCA)

All 4 locales render the same numbers because BTC is USD-priced and the math is locale-invariant (the only difference is the default `amount`).

| Locale  | Amount   | Months | Total contributed | **Terminal value** | Range                     | Confidence |
| ------- | -------- | -----: | ----------------: | -----------------: | ------------------------- | ---------- |
| en      | $100/mo  |    125 |           $12,500 |       **$261,202** | $237,914 – $305,010       | MEDIUM     |
| pt-BR   | R$500/mo |    125 |          R$62,500 |        R$1,306,011 | R$1,189,571 – R$1,525,051 | MEDIUM     |
| es / de | €100/mo  |    125 |           €12,500 |         €261,202\* | €237,914 – €305,010\*     | MEDIUM     |

\*ES/DE show USD-denominated values with EUR symbol — disclosed in copy per the existing convention.

### Happy-path: all 8 assets × 2016 DCA $100/mo

Values updated 2026-05-23 after F1 dedup fix (was: 126 months / $12,600 contributed). Range values updated again post-F2 fix: TR-adjusted assets (SP500/QQQ/MSCI_WORLD/TLT) now apply the per-month `close/closePriceOnly` factor to raw high/low so the OHLC bar is fully in TR space — `rangeLow ≤ terminalValue ≤ rangeHigh` invariant holds.

| Asset      | Total contributed | Terminal value | Range (best–worst entry) | Confidence                               |
| ---------- | ----------------: | -------------: | -----------------------: | ---------------------------------------- |
| BTC        |           $12,500 |       $261,202 |      $237,914 – $305,010 | MEDIUM                                   |
| SP500      |           $12,500 |        $29,638 |        $28,926 – $30,948 | HIGH                                     |
| QQQ        |           $12,500 |        $40,284 |        $39,099 – $42,511 | HIGH                                     |
| MSCI_WORLD |           $12,500 |        $26,621 |        $25,960 – $27,732 | HIGH                                     |
| GOLD       |           $12,500 |        $32,438 |        $31,554 – $33,515 | HIGH                                     |
| TLT        |           $12,500 |        $10,632 |        $10,352 – $10,962 | HIGH (only DCA-losing asset over window) |
| IBOVESPA   |    R$12,500 (BRL) |       R$23,429 |      R$22,540 – R$24,813 | HIGH                                     |
| DAX        |           €12,500 |        €21,995 |        €21,305 – €23,011 | HIGH                                     |

### PT2 toggle: total-return vs price-only (SP500 2010 DCA $100/mo)

| Basis                                        | Terminal value | Delta vs price-only |
| -------------------------------------------- | -------------: | ------------------: |
| total_return (default, dividends reinvested) |        $69,602 |                   — |
| price_only (no dividends)                    |        $58,820 |             -18.33% |

The 18.33% delta over 16 years reflects ~1.1% dividend yield reinvested annually. Phase E v2 deliverable. (Was 18.76% pre-F1 dedup — still within PT2 ±2pp gate.)

### Mode comparison: BTC 2016 lump-sum vs DCA at same total contribution

| Mode       | Amount                                   | Terminal value |
| ---------- | ---------------------------------------- | -------------: |
| lumpSum    | $12,200 (all in January 2016 at $368.77) | **$2,565,246** |
| monthlyDca | $100/mo × 125 months ($12,500 total)     |   **$261,202** |

The 10× lump-sum advantage over DCA reflects buying BTC at $368 in Jan 2016 vs averaging across 2016–2026 when BTC was already much higher in many months.

### Edge: recent start (SP500 2026 DCA — only 6 months)

| Months | Total contributed | Terminal value | Confidence |
| ------ | ----------------: | -------------: | ---------: |
| 6      |              $600 |           $636 |       HIGH |

Renders correctly with very short window.

### Edge: data floor (BTC 2010 DCA / BTC 2014 DCA)

Post audit-bundle v1.4 CoinMetrics backfill, BTC monthly data starts July 2010 (was September 2014 pre-backfill). BTC 2010 DCA $100/mo now produces ~$534M (LOW-confidence range), INSIDE the research-anchored $500M-$1.5B legacy envelope — independent validation. BTC 2014 DCA renders normally (HIGH-confidence). The calculator's data-driven first-month lookup (audit finding A2) handles per-asset data floors uniformly. **Finding D-1 in §10 below is CLOSED by v1.4.**

### Negative: invalid asset

Returns `AssetHistoryDataError: no monthly series for FOO`. Component catches the error and renders null (blank result). UI prevents this via `<select>` constraint to the 8-asset enum.

---

# 7. Inflation Impact — `/tools/inflation-impact`

## 7.1 Objective & user value

**Objective:** Forward — "what will today's $X be worth in N years?" Retrospective — "what would $X from 2010 buy today?"
**Value to users:** Makes inflation tangible. Two modes show the bidirectional cost of cash.
**Tool purpose:** Pure inflation arithmetic. Uses `selectInflationRate` to pick `.current` for short horizons (≤24mo) and `.average5y` for longer.

## 7.2 Input data from system

| Field                                              | Source                   | Use                             |
| -------------------------------------------------- | ------------------------ | ------------------------------- |
| `inflationRates.rates[locale].current`             | FALLBACK                 | Short-horizon (≤24mo) inflation |
| `inflationRates.rates[locale].average5y`           | FALLBACK                 | Long-horizon (>24mo) inflation  |
| `inflationRates.rates[locale].cumulativeSince2010` | Hardcoded research stamp | Retrospective mode              |
| `scenarioRates.historical` (10%)                   | FALLBACK                 | Comparison "invested" line      |

## 7.3 Input data from user

| Field     | Default per locale  | Range                   |
| --------- | ------------------- | ----------------------- |
| `amount`  | 1000/5000/1000/1000 | 0 – 1B                  |
| `years`   | 10                  | 1 – 40                  |
| `country` | locale              | en / pt-BR / es / de    |
| `mode`    | forward             | forward / retrospective |

## 7.4 Formula

**Forward:**

```
inflRate = horizon ≤ 24mo ? .current : .average5y
cashRealValue = amount / (1 + inflRate)^years
investedNominal = amount × (1 + 0.10)^years
investedReal = investedNominal / (1 + inflRate)^years
```

**Retrospective:**

```
equivalentToday = amount × (1 + cumulativeSince2010)
purchasingPowerLost = amount − amount / (1 + cumulativeSince2010)
```

## 7.5 Test scenarios

### Forward defaults × 4 locales (10y horizon)

| Locale |  Amount | Inflation used (.average5y) | Cash real value |    Loss | Invested nominal | Invested real |
| ------ | ------: | --------------------------: | --------------: | ------: | ---------------: | ------------: |
| en     |  $1,000 |                        4.5% |            $644 |    $356 |           $2,594 |        $1,670 |
| pt-BR  | R$5,000 |                        5.9% |         R$2,818 | R$2,182 |         R$12,969 |       R$7,310 |
| es     |  €1,000 |                        4.1% |            €669 |    €331 |           €2,594 |        €1,735 |
| de     |  €1,000 |                        4.1% |            €669 |    €331 |           €2,594 |        €1,735 |

### Retrospective × 4 locales (since 2010)

| Locale | Amount in 2010 | Cumulative inflation since 2010 | Equivalent today | Purchasing power lost |
| ------ | -------------: | ------------------------------: | ---------------: | --------------------: |
| en     |         $1,000 |                           52.3% |           $1,523 |                  $343 |
| pt-BR  |        R$5,000 |                          145.0% |         R$12,250 |               R$2,959 |
| es     |         €1,000 |                           41.0% |           €1,410 |                  €291 |
| de     |         €1,000 |                           41.0% |           €1,410 |                  €291 |

### Edge: 24-month boundary × 4 locales

The `selectInflationRate` formula switches between `.current` (≤24mo) and `.average5y` (>24mo) at exactly horizonMonths=25. Discontinuous step.

| Locale |     At 2y (.current used) | At 3y (.average5y used) | Discontinuity at 24/25mo           |
| ------ | ------------------------: | ----------------------: | ---------------------------------- |
| en     | 3.80% (cash real $928.12) |                   4.50% | +70 bp jump in single-month change |
| pt-BR  |           4.39% ($917.66) |                   5.90% | +151 bp jump                       |
| es     |           3.50% ($933.51) |                   4.10% | +60 bp jump                        |
| de     |           2.90% ($944.43) |                   4.10% | +120 bp jump                       |

**This is a documented design choice** (per `lib/market-data/formulas/core.ts:selectInflationRate`), but it produces a visible step in the output when users slide horizon from 24→25mo. Per CLAUDE.md "Don't add backwards-compatibility hacks" — accepted as-is. Possible future UX improvement: add a footnote explaining the trailing-window convention. Not blocking.

### Edge: 30-year horizon × 4 locales

| Locale | 30y purchasing power lost | Real value of $1000 |
| ------ | ------------------------: | ------------------: |
| en     |                     73.3% |                $267 |
| pt-BR  |                     82.1% |               R$179 |
| es     |                     70.0% |                €300 |
| de     |                     70.0% |                €300 |

Brazil's 5.9% inflation rate compounds the most over 30 years.

---

# 8. Currency Depreciation — `/tools/currency-depreciation`

## 8.1 Objective & user value

**Objective:** Compare 3 outcomes for holding cash in a non-USD currency: cash idle, bank yield, diBoaS digital dollar.
**Value to users:** Demonstrates the dual cost of local currency depreciation + inflation. For Brazilian users, the BRL depreciation case is particularly material.
**Tool purpose:** Forward mode uses `calculateWithCurrencyHedge` with horizon-matched CAGR. Retrospective mode uses path-dependent `calculateMonthlyPathDependentHedge` (Phase 7 / 2026-05-16).

## 8.2 Input data from system

| Field                                 | Source    | Use                                                                         |
| ------------------------------------- | --------- | --------------------------------------------------------------------------- |
| `bankRates[bankSourceLocale].savings` | FALLBACK  | Bank yield in local currency                                                |
| `monthlySeries.fx[currency]`          | Data file | Horizon-matched depreciation (forward); month-by-month walk (retrospective) |
| `scenarioRates.historical` (10%)      | FALLBACK  | diBoaS USD nominal rate                                                     |

## 8.3 Input data from user

| Field      | Default per locale | Range                                                |
| ---------- | ------------------ | ---------------------------------------------------- |
| `amount`   | 10k/50k/10k/10k    | 0 – 1B                                               |
| `years`    | 5                  | 1 – 40                                               |
| `currency` | locale's currency  | USD / BRL / EUR (Phase F deferred for +9 currencies) |
| `mode`     | forward            | forward / retrospective                              |

## 8.4 Formula

**Forward:**

```
depreciation = resolveHorizonMatchedDepreciation(currency, years)
effectiveAPY = (1 + 0.10) × (1 + depreciation) − 1
bankFV = amount × (1 + bankRate)^years
diboasFV = amount × (1 + effectiveAPY)^years
```

## 8.5 Test scenarios

### Default × 4 locales (5y horizon)

| Locale | Currency |          Bank FV |          diBoaS FV |                          Effective dep at 5y |
| ------ | -------- | ---------------: | -----------------: | -------------------------------------------: |
| en     | USD      |  $10,191 (0.38%) | $16,105 (no hedge) |                                           0% |
| pt-BR  | BRL      | R$69,572 (6.83%) |           R$80,719 |         **0.05%** (5y window: BRL near-flat) |
| es     | EUR      |   €11,041 (2.0%) |            €16,720 | **0.75%** (5y window: EUR slightly weakened) |
| de     | EUR      |   €11,204 (2.3%) |            €16,720 |                                        0.75% |

### PT1 context: pt-BR R$50k × 10y

| Window  | Effective BRL dep |                                            diBoaS FV |
| ------- | ----------------: | ---------------------------------------------------: |
| 5y      |             0.05% |                                             R$80,719 |
| **10y** |         **4.60%** | **R$203,358** (2.5× the 5y FV — long-horizon weight) |

This is the "horizon-matched window saturation" behavior — longer horizons pull in the 2014–2016 + 2020–2022 BRL collapses, dramatically lifting the effective rate.

### Edge: USD selected (no hedge applied)

| Currency | Bank FV at 0.38% |               diBoaS FV at raw 10% |
| -------- | ---------------: | ---------------------------------: |
| USD      |     $10,191 (5y) | $16,105 (5y, matches USD lump-sum) |

---

# 9. Card Fee Savings — `/tools/card-fees` (B2B)

## 9.1 Objective & user value

**Objective:** Show merchants the annual processor-fee cost at their current volume + rate, and what they'd save with diBoaS card processing (assumed 0% per E-followup-1 user model).
**Value to users:** Direct $/year savings claim. The IFR-bounded EU rates (0.8%) make this less compelling for EU than US merchants, which is honest per Decision Q3.
**Tool purpose:** Simple linear math — `monthlyVolume × processorFeeRate × 12 = annualFee = diBoaSSavings`. No compounding; no time horizon.

## 9.2 Input data from system

| Field                                             | Source             | Use                                      |
| ------------------------------------------------- | ------------------ | ---------------------------------------- |
| `CARD_FEES_DEFAULTS.monthlyVolume[locale]`        | tools/constants.ts | Per-locale default volume                |
| `CARD_FEES_DEFAULTS.processorFeeRate[locale]`     | tools/constants.ts | Phase H: en 2.9%, pt-BR 3.0%, es/de 0.8% |
| `CARD_FEES_DEFAULTS.avgTransactionAmount[locale]` | tools/constants.ts | Optional, drives per-tx fee              |

## 9.3 Input data from user

| Field                  | Range             |
| ---------------------- | ----------------- |
| `monthlyVolume`        | 0 – 1B            |
| `processorFeePct`      | 0 – 100           |
| `avgTransactionAmount` | 0 – 1B (optional) |

## 9.4 Formula

```
monthlyFee = monthlyVolume × processorFeeRate
annualFee = monthlyFee × 12
diBoaSSavings = annualFee  (Phase E E-followup-1: diBoaS is 100% pass-through at tx level)
perTxFee = avgTx × processorFeeRate  (when avgTx > 0)
```

## 9.5 Test scenarios

### Default × 4 locales (Phase H fees)

| Locale |    Volume | Fee % | Monthly fee | **Annual fee = diBoaS savings** |
| ------ | --------: | ----: | ----------: | ------------------------------: |
| en     |   $50k/mo |  2.9% |      $1,450 |                     **$17,400** |
| pt-BR  | R$250k/mo |  3.0% |     R$7,500 |                    **R$90,000** |
| es     |   €40k/mo |  0.8% |        €320 |                      **€3,840** |
| de     |   €40k/mo |  0.8% |        €320 |                      **€3,840** |

### IFR comparison: same volume, different fees

For $50k/mo monthly volume:

- US (Stripe blended 2.9%): $17,400/yr
- EU (IFR-bounded ~0.8%): $4,800/yr
- **Delta: $12,600/yr** — magnitude of the savings illusion if a single global 2.9% default were used in EU. Phase H Bar-signed lowered ES/DE to 0.8% to remove this distortion.

### Edge: very large volume (B2B enterprise) × 4 locales

| Locale |         Volume | Annual savings |
| ------ | -------------: | -------------: |
| en     |  $1M/mo × 2.9% |       $348,000 |
| pt-BR  | R$5M/mo × 3.0% |    R$1,800,000 |
| es     |  €1M/mo × 0.8% |        €96,000 |
| de     |  €1M/mo × 0.8% |        €96,000 |

### Edge: zero volume / zero fee

All zero inputs return $0 annual savings. Calculator UI gates the result render on positive inputs.

---

# 10. Idle Cash Yield — `/tools/idle-cash` (B2B)

## 10.1 Objective & user value

**Objective:** Show businesses what idle treasury cash earns at their current bank rate vs at diBoaS Conservative 7%.
**Value to users:** Concrete "your $100k sitting in your business account is earning $X; at diBoaS it could earn $Y" comparison.
**Tool purpose:** Lump-sum compounding. Uses `CONSERVATIVE_RATE` (7%) not `HISTORICAL_RATE` (10%) per the B2B conservative-cash-management framing (Phase 6E.2).

## 10.2 Input data from system

| Field                             | Source    | Use                           |
| --------------------------------- | --------- | ----------------------------- |
| `bankRates[locale].savings`       | FALLBACK  | Pre-fills bankYieldPct field  |
| `scenarioRates.conservative` (7%) | FALLBACK  | diBoaS USD rate               |
| `monthlySeries.fx[currency]`      | Data file | Horizon-matched dep for hedge |

## 10.3 Input data from user

| Field          | Default per locale | Range                                        |
| -------------- | ------------------ | -------------------------------------------- |
| `idleCash`     | 100k/500k/80k/80k  | 0 – 1B                                       |
| `years`        | 3                  | 1 – 40                                       |
| `bankYieldPct` | locale's bank rate | 0 – 100 (user can override to top-tier HYSA) |

## 10.4 Formula

```
depreciation = resolveHorizonMatchedDepreciation(currency, years)
diboasEffective = (1 + 0.07) × (1 + depreciation) − 1
bankFV = idleCash × (1 + bankYieldPct/100)^years
diboasFV = idleCash × (1 + diboasEffective)^years
```

## 10.5 Test scenarios

### Default × 4 locales (3y horizon)

| Locale |   Idle | Bank rate |                                                       Effective diBoaS APY |   Bank FV | diBoaS FV |         Delta |
| ------ | -----: | --------: | -------------------------------------------------------------------------: | --------: | --------: | ------------: |
| en     |  $100k |     0.38% |                                                                      7.00% |  $101,144 |  $122,504 |  **+$21,360** |
| pt-BR  | R$500k |     6.83% |                                              8.46% (7% + ~1.5% BRL 3y dep) | R$609,607 | R$638,006 | **+R$28,399** |
| es     |   €80k |      2.0% | 4.31% (note: 3y EUR window has _negative_ dep — EUR strengthened recently) |   €84,897 |   €90,787 |   **+€5,891** |
| de     |   €80k |      2.3% |                                                                      4.31% |   €85,648 |   €90,787 |   **+€5,139** |

### Edge: very long horizon (10y) × 4 locales

| Locale |   Bank FV |   diBoaS FV | Delta over 10y |
| ------ | --------: | ----------: | -------------: |
| en     |  $103,866 |    $196,715 |   **+$92,849** |
| pt-BR  | R$968,060 | R$1,542,309 | **+R$574,249** |
| es     |   €97,520 |    €152,014 |   **+€54,495** |
| de     |  €100,426 |    €152,014 |   **+€51,588** |

### Happy-path: user override to en HYSA 4.10%

| Configuration       | Bank FV (4.10% × 5y) | diBoaS FV (7% × 5y) |    Delta |
| ------------------- | -------------------: | ------------------: | -------: |
| Override 4.10% HYSA |             $122,251 |            $140,255 | +$18,004 |

User-override reduces the en delta because HYSA closes the gap to diBoaS Conservative.

### Edge: zero idle / negative idle × 4 locales

All return null/blank. UI clamps negative input to 0 via `handleChange`; engine returns 0 FV on `idleCash <= 0`.

---

# 11. Brazil Poupança Regime Switch (supporting formula, Phase G)

## 11.1 Objective

Apply the BCB Lei nº 12.703/2012 regime-switch rule to derive the live poupança rate from Selic + TR. Used by pt-BR calculators to populate `bankRates['pt-BR'].savingsCurrent`.

## 11.2 Formula

```
if selicAnnualPct > 8.5:        // High-Selic regime
  rate = (1 + 0.005 + tr_monthly)^12 − 1
else:                            // Low-Selic regime
  rate = 0.7 × selic + ((1 + tr_monthly)^12 − 1)
```

## 11.3 Test scenarios

| Scenario                          |  Selic |       TR |                              Output rate |
| --------------------------------- | -----: | -------: | ---------------------------------------: |
| Current regime (April 2026 Copom) | 14.50% |       0% | **6.17%/yr** (rule: high-Selic, 0.5%/mo) |
| Threshold boundary (low side)     |   8.5% |       0% |                     5.95%/yr (70% × 8.5) |
| Threshold boundary (high side)    |  8.51% |       0% |          6.17%/yr (jumps to high regime) |
| Low-Selic example                 |     6% |       0% |                       4.20%/yr (70% × 6) |
| TR nonzero                        |  14.5% | 0.05%/mo |                                 6.80%/yr |
| Negative Selic                    |     -1 |        0 |                0 (data corruption guard) |
| NaN Selic                         |    NaN |        0 |                0 (data corruption guard) |

The discontinuity at Selic=8.5% boundary is documented and intentional (it's the regulatory rule itself).

---

# 12. Cross-tool findings

## 12.1 Input data validation gates

| Gate                                         | Status                                   | Mechanism                                            |
| -------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Per-locale bank rates within plausible range | ✅ All 4 within 0–10%                    | Phase C constants refresh + last_verified timestamps |
| Per-locale inflation `current` ≤ 8%          | ✅ All 4 within 2.9–4.4%                 | Phase C live April 2026 BLS/IBGE/Eurostat/Destatis   |
| Horizon-matched FX CAGR within ±10%/yr       | ✅ BRL 0-6.21%, EUR 0-1.23%              | Live `monthlyFx.json` derivation                     |
| Monthly OHLC data coverage ≥ 80% of expected | ✅ 8/8 assets, 8/12 currencies populated | Phase B pull script + K.3 runbook                    |
| No NaN / Infinity in any FALLBACK constant   | ✅ Verified by simulator                 | Sanity sweep                                         |

## 12.2 Formula validation gates

| Gate                                                                 | Status                                      |
| -------------------------------------------------------------------- | ------------------------------------------- |
| Annuity FV reproduces Excel/`numpy_financial.fv` to 4 decimal places | ✅ Verified in `formulas.test.ts`           |
| Lump-sum FV `P × (1+r)^y` exact                                      | ✅                                          |
| Monthly geometric rate `(1+r)^(1/12) - 1` matches reference          | ✅                                          |
| `monthsToInflationAdjustedTarget` returns Infinity at 1200-month cap | ✅ Verified across 8+ unreachable scenarios |
| `deriveHorizonMatchedCAGR` returns sentinel 0 on < 12 months data    | ✅ Verified per P7                          |
| `derivePoupancaRate` correctly switches at Selic=8.5 boundary        | ✅ Verified across 7 scenarios              |
| Asset history DCA matches lump-sum × DCA ratio approximations        | ✅ Within statistical expectation           |

## 12.3 Result-magnitude validation gates

| Gate                                              | Status                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| pt-BR Retirement R$7,336,100 reproduces           | ✅ PT1 Bar-signed                                                       |
| de Retirement €541,891 reproduces                 | ✅ PT3' Bar-signed 2026-05-26 (FX-16 D1+D2; retired prior PT3 €608,815) |
| BTC 2016 DCA in $230k–$280k range                 | ✅ Production renders $261,202 (post-F1)                                |
| PT2 SP500 TR vs price-only delta in 15–25% range  | ✅ 18.33% measured (post-F1)                                            |
| en bank rate displayed as 0.38% in Emergency Fund | ✅ Visual verified                                                      |
| ES/DE Card Fees default 0.8% (Phase H)            | ✅ Visual + simulator verified                                          |

## 12.4 Negative-input handling gates

| Input                                  | Expected behavior                                                                       | Verified |
| -------------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| amount = 0                             | Engine returns 0 FV; UI gates render                                                    | ✅       |
| amount < 0                             | UI clamps to 0 via `handleChange`                                                       | ✅       |
| amount = NaN                           | Number() returns NaN; UI clamps to min                                                  | ✅       |
| years = 0                              | UI `min={1}`; engine validates >0                                                       | ✅       |
| Unknown asset code                     | `AssetHistoryDataError` thrown; component catches and renders null                      | ✅       |
| Selic = negative                       | `derivePoupancaRate` returns 0 sentinel                                                 | ✅       |
| `monthlySeries.fx[currency]` undefined | `deriveHorizonMatchedCAGR` returns 0 sentinel; fall back to FALLBACK.annualDepreciation | ✅       |

## 12.5 Findings worth follow-up

### D-1 [Medium] — Asset History BTC pre-Sep-2014 start years throw error — RESOLVED v1.4

**Status:** CLOSED 2026-05-23 by audit-bundle v1.4 CoinMetrics community-tier backfill.
**Tools affected:** `/tools/asset-history`
**Original symptom:** Selecting BTC + 2010, 2011, 2012, 2013, or 2014 threw `AssetHistoryDataError: no data for BTC starting [year]-01` (or `-07` for 2010).
**Original root cause:** `calculateAssetHistoryDcaReplay` searched for the first month of `startYear` (or July if 2010). BTC Yahoo data started September 2014; earlier months didn't exist in `monthlyPrices.json`.
**Fix applied:** CoinMetrics community-tier `PriceUSD` daily 2010-07 → 2014-08 aggregated to monthly OHLC and spliced with Yahoo BTC-USD 2014-09 onwards. Splice point validated at 2014-08-31 → 2014-09-01 (2.6% day-to-day drop, within normal BTC volatility). BTC 2010 DCA $100/mo now produces ~$534M LOW-confidence result, INSIDE the research-anchored $500M-$1.5B legacy envelope. Also resolved by audit finding A2 (data-driven first-month lookup replacing the July-for-2010 hardcode). Fetcher: `apps/web/scripts/data-fetchers/fetch-btc-coinmetrics.mjs` (reproducibility script).

### D-2 [Low] — Compound Interest 1-year horizon for non-USD locales reads near-zero CAGR

**Tools affected:** `/tools/compound-interest`, retirement, goal-savings, etc. — anywhere with very short horizon and non-USD locale.
**Symptom:** A 1-year horizon pulls only the trailing 12 months of FX data. For BRL, May 2025 → May 2026 was approximately flat (USD/BRL stayed near 5.0). The horizon-matched CAGR returns ~0.05% — a faithful reflection of the data but counter-intuitive given the 16-year trend.
**Severity:** Low. Mathematically correct per v1.1 §6.1; just feels like a discontinuity to users who change from 1y to 25y horizons.
**Recommended fix:** **Phase I.4 partially addresses this** (2026-05-23) — scenario tooltips on Conservative/Historical/Optimistic explain the rate envelopes. A separate tooltip on the trailing-window CAGR derivation, or a MIN_CAGR_WINDOW = 36 months floor, remains a possible future improvement. Not blocking; documentation suffices.

### D-3 [Low] — Inflation Impact 24/25-month boundary discontinuity

**Tools affected:** `/tools/inflation-impact`.
**Symptom:** Sliding the horizon from 2y → 3y triggers a discrete jump in inflation rate used (e.g., en: 3.8% → 4.5% = 70bp swing).
**Severity:** Low. Documented behavior per `selectInflationRate` design.
**Recommended fix:** possible future improvement — surface this as a footnote ("short-horizon projection uses current inflation; longer horizons use 5-year average — better captures structural inflation"). Not addressed by Phase I (which closed 2026-05-23 with confidence-stratification + warnings + tooltips + unreachable copy). Not blocking.

### D-4 [Informational] — `monthlySeries.inflation` is a stub

**Status:** Phase B shipped the file structure; all 12 inflation series stub out as `PENDING`. Real-time inflation `.current` flows from `FALLBACK_MARKET_DATA.inflationRates.rates[locale].current` (updated quarterly per K.3 runbook); the monthly time-series file is reserved for Phase B.3 incremental population when needed.
**Impact:** None on current tool behavior. Calculators use `.current` and `.average5y` constants, not the monthly series.

## 12.6 Coverage assessment

| Tool                  |                Locales covered (math diverges) | Scenarios | Status         |
| --------------------- | ---------------------------------------------: | --------: | -------------- |
| Compound Interest     |                                          4 / 4 |        25 | ✅             |
| Retirement            |                                          4 / 4 |         6 | ✅             |
| Goal Savings          | 2 / 4 (math is identical to Compound Interest) |         3 | ✅             |
| Emergency Fund        |                                          4 / 4 |        16 | ✅             |
| Time-to-Target        |                                          4 / 4 |        12 | ✅             |
| Asset History         |               1 / 4 (math is locale-invariant) |        18 | ✅ (D-1 noted) |
| Inflation Impact      |                                          4 / 4 |        16 | ✅ (D-3 noted) |
| Currency Depreciation |                                          4 / 4 |         6 | ✅             |
| Card Fees             |                                          4 / 4 |        14 | ✅             |
| Idle Cash             |                                          4 / 4 |        17 | ✅             |
| Brazil Poupança       |                                     pt-BR only |         7 | ✅             |
| **Total**             |                                                |   **140** |                |

---

# 13. Reproducibility

To re-run the full stress test:

```bash
node apps/web/scripts/tools-stress-test.mjs
# Default output: apps/web/scripts/tools-stress-test-out.json
# Override: --out /path/to/file.json
```

The script imports `monthlyPrices.json` and `monthlyFx.json` directly (read-only) and mirrors the formula library at module level. It is dependency-free (only Node stdlib) and runs in ~50ms.

To compare against a baseline:

```bash
diff <(jq -S . baseline.json) <(jq -S . tools-stress-test-out.json)
```

Any non-zero diff indicates a material change in: (a) `FALLBACK_MARKET_DATA` constants, (b) `monthlyPrices.json` / `monthlyFx.json` content, or (c) a formula library change. All three should be intentional and accompanied by decision-register entries.

---

# 14. Validation gate criteria summary

Before each tools-data PR ships:

1. ✅ **`pnpm validate:all`** — integrated merge gate (10 turbo tasks: type-check + lint + test + build + check:budget + design-tokens + translations + market-data + sdk-invariant + format:check). Single command runs all the below.
2. ✅ **`pnpm vitest run`** — full test suite passes (946/946 baseline, 2026-05-26 — post-Phase-1-7 + CTO v3 audit + architecture audit fixes)
3. ✅ **`pnpm validate:translations`** — all 4 locales in sync
4. ✅ **`pnpm check:budget`** — bundle within caps (peak ≤ 650 KB / total ≤ 3.7 MB / CSS ≤ 500 KB / ≤ 200 chunks). Last measurement 2026-05-26: peak 531 KB, total 3313 KB JS, 432 KB CSS — within all caps.
5. ✅ **140-vector audit-bundle harness** — `node apps/web/scripts/tools-stress-test.mjs` produces `tools-stress-test-out.json`; compare against `docs/tech/audit-bundle/TEST_VECTORS.json` v2 (140 scenarios across 11 tools). Last full re-verification 2026-05-26: **140 / 140 PASS** within per-field tolerance after Phase 2 lib-engine extractions — confirms the new `lib/<tool>/calculator.ts` modules are bit-identical to pre-Phase-2 (§M2 acceptance criterion).
6. ✅ **Stress-test product-truth gates** — `pt-BR Retirement R$7,336,100` matches Phase A baseline ±2% (PT1 acceptance gate); `de Retirement €541,891` (PT3' re-signed 2026-05-26 per FX-16 D1+D2; retired prior PT3 €608,815); `BTC 2016 DCA $261,202` (BTC_RECON).
7. ✅ **`pnpm accessibility:audit`** — pa11y WCAG2AA across 19 URLs (all `/tools/*` routes + landing + about + business + lesson + market × 4 locales). Last run 2026-05-26: 0 issues.
8. ✅ **Visual regression** — Docker MCP sweep across all routes × locales, 0 unexpected console errors per page (C43 pre-existing chart hydration mismatch is tracked separately).
9. ✅ **Decision register** — any PT-row touched is Bar-signed before the PR can merge

This validation document is the canonical reference for the input + formula + result contract of the `/tools` suite as of 2026-05-23.
