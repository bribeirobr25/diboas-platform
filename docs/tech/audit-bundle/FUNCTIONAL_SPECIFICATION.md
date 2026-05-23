# Tools Suite — Functional Specification

**Document version:** 1.0 (2026-05-23)
**Audit purpose:** Specify *what* each tool computes (outcome contract) without prescribing *how* (algorithm). An auditor implementing each tool from first principles, using any reasonable formula choice, should converge on the same numeric results documented in `TEST_VECTORS.json`.
**This document deliberately does NOT include pseudo-code or formula-implementation prescriptions.** Each section gives:
1. The semantic objective (what real-world question is being answered)
2. The mathematical outcome (precisely defined without specifying algorithm)
3. The conventions that pin down a unique answer (timing, rounding, sign, edge cases)
4. The input data (paths to the bundled raw files)
5. The user-facing output contract (what must be displayed; tolerance for match)

---

## 0. Universal conventions (apply to every tool)

The auditor must implement these conventions exactly to converge on test-vector outputs.

### 0.1 Compounding & period conventions

| Convention | Specification |
|---|---|
| **Annual rate interpretation** | Every rate `r` in this document is the effective annual rate, expressed as a decimal (e.g., 0.10 = 10% per year). Compounding is monthly with geometric conversion (i.e., the monthly rate is the value `m` such that `(1+m)^12 = (1+r)`). Auditors using `r/12` instead of `(1+r)^(1/12)−1` will diverge by ~0.4% on outputs at 10% annual / 25 years. |
| **Contribution timing** | All monthly DCA / annuity contributions occur at the **end** of each month. The first contribution is at end of month 1; the last contribution is at end of month N. |
| **Initial principal timing** | When present, the initial principal is invested at the **start** of month 1 and compounds for the full horizon. |
| **Lump-sum timing** | Single-investment lump-sum is invested at the start of the horizon and valued at the end. |
| **Horizon expressed in years** | Number of months in horizon = `years × 12` (no day-count conventions used). |

### 0.2 Rounding & precision

| Convention | Specification |
|---|---|
| **Internal computation** | Maintain full IEEE-754 double precision throughout all intermediate computations. No intermediate rounding. |
| **Output rounding for display** | Currency values: round to nearest cent ($0.01) for display; tolerance for matching is ±$0.01 per output field. Percentages: round to 2 decimal places (e.g., 13.30%). Months/years: integer months (no fractional months in test vectors). |
| **Years → months conversion (F4)** | When a tool input is `years` (e.g., Compound Interest, Retirement) and the formula needs months, use `months = Math.round(years × 12)`. Bankers'-rounding is NOT applied — JavaScript's `Math.round` (round-half-up) is the reference. Fractional inputs are nominally not permitted by `INPUT_BOUNDS` (year sliders are integer-stepped in the UI), but the formula tolerates them deterministically: `years = 5.5 → months = 66`, `years = 5.49 → months = 66`, `years = 5.51 → months = 66`. This rule applies symmetrically to `deriveHorizonMatchedCAGR` (`desiredMonths = Math.round(horizonYears × 12)` clamped to ≥12). |
| **Tolerance for audit comparison** | See `TEST_VECTORS.json` per-field `tolerance` declarations. Default: ±$1.00 absolute on currency amounts ≥ $1000; ±0.01% absolute on percentages; ±0 on integer month counts. |

### 0.3 Sign conventions

| Convention | Specification |
|---|---|
| **FX depreciation sign** | "Local currency depreciation rate" is **positive** when the local currency loses value against USD over time. A depreciation rate of 0.0621 means BRL is worth 6.21% less in USD terms per year, on average. |
| **Inflation sign** | "Inflation rate" is **positive** when prices rise over time (the standard convention). |
| **Return / yield sign** | Returns are **positive** when the investor's wealth increases. |

### 0.4 Edge cases (sentinel returns)

| Input condition | Required behavior |
|---|---|
| `amount = 0` or negative | Tool must return 0 (currency) or null (months-shape) — never throw a render-blocking error. UI is permitted to gate output rendering on positive input. |
| Horizon = 0 or negative | Return 0 (currency) or 0 months. |
| Iterative monthly solver cannot reach target within 1200 months | Return `Infinity` (the integer sentinel); UI displays "won't reach at this rate" or equivalent. |
| Time-series data unavailable for currency / asset / locale | Return sentinel 0 for derived rate (so calculator degrades gracefully); UI may surface a message. Do not throw. |
| `NaN` / non-finite input | Treat as invalid; return 0 / null per type. |

### 0.5 Data sources (audit bundle)

All input data the tools consume is bundled in `docs/tech/audit-bundle/data/`:

| File | Contents | Used by |
|---|---|---|
| `FALLBACK_MARKET_DATA.json` | All point-in-time constants: bank rates, scenario rates, inflation rates, FX depreciation rates, asset spot prices, platform fees | Every tool |
| `FALLBACK_MARKET_DATA_METADATA.json` | Per-field `last_verified` ISO timestamp + source attribution string | Provenance audit only |
| `monthlyPrices.json` | 8 assets × ~142–192 months of OHLC + `closePriceOnly` overlay for 4 assets (SP500/QQQ/MSCI_WORLD/TLT) | Asset History |
| `monthlyFx.json` | 8 currency pairs × ~191 months: `closeLocalPerUsd` and `closeUsdPerLocal` | All FX-hedge tools (forward + retrospective) |
| `monthlyInflation.json` | Stub — pending Phase B.3; calculators use the constants in `FALLBACK_MARKET_DATA.inflationRates` rather than this monthly series | (Reserved) |

The auditor must use these exact files. Re-pulling from upstream sources (Yahoo / BCB / ECB) will introduce timing-and-aggregation differences that prevent precise comparison.

---

## 1. Compound Interest — `/tools/compound-interest`

### 1.1 Objective (semantic)

Answer: *"If I save a small amount on a regular schedule for several years, what would my money become at different investment-return assumptions?"*

### 1.2 Purpose (operational)

Produce four side-by-side future-value projections at four annual return rates (bank, conservative, historical, optimistic), given:
- a recurring contribution amount and cadence
- a horizon in years
- the user's locale (which selects bank rate and FX-hedge context)

### 1.3 User benefit

Concrete projection of "compounding's effect over years on small contributions" without requiring the user to understand the math.

### 1.4 Outcome contract

For each of four rate scenarios `S ∈ {bank, conservative, historical, optimistic}`:

> **Output**: the value of an investment account at the end of year `N`, given:
> - Recurring contributions of `monthlyEquivalent` dollars made at the end of each month for `12N` months;
> - The account balance compounds monthly at the effective annual rate `r_S`;
> - No fees, taxes, or withdrawals during the horizon.

Where:
- `monthlyEquivalent` is computed from the user's chosen `amount` + `cadence`:
  - `daily` → `amount × 365/12` (treats year as 365 days uniformly distributed across 12 months)
  - `weekly` → `amount × 52/12`
  - `monthly` → `amount`
  - `quarterly` → `amount / 3`
  - `semiAnnual` → `amount / 6`
  - `yearly` → `amount / 12`
  - `oneTime` → 0 (no recurring; see lump-sum treatment below)
- `r_S` is the **locale-effective annual rate** for scenario S:
  - For USD locales (en): `r_S = nominalRate_S` (no FX hedge)
  - For non-USD locales (pt-BR / es / de): `r_S = (1 + nominalRate_S) × (1 + d_locale) − 1`, where `d_locale` is the horizon-matched depreciation rate (see §1.6)
  - For the `bank` scenario: `r_bank = bankRates[locale].savings / 100` (no FX hedge applied — local bank deposits pay in local currency)
- `nominalRate_S` is the published scenario rate in `FALLBACK_MARKET_DATA.rates.scenarioRates`:
  - conservative: 0.07
  - historical: 0.10
  - optimistic: 0.14

When `cadence = oneTime`: instead of recurring contributions, the user's `amount` is invested at start of month 1 and grows for the full horizon at rate `r_S`; `monthlyEquivalent = 0`.

### 1.5 Input contract

| Field | Type | Default per locale | Range |
|---|---|---|---|
| `amount` | positive real | en:5, pt-BR:25, es:3, de:4 | [0.01, 1,000,000,000] |
| `cadence` | enum | daily (all locales) | {oneTime, daily, weekly, monthly, quarterly, semiAnnual, yearly} |
| `years` | positive integer | 12 (all locales) | [1, 40] |
| `locale` | enum | from URL `/{locale}/...` | {en, pt-BR, es, de} |

### 1.6 Horizon-matched depreciation rate `d_locale`

For non-USD locales, the `d_locale` value used in the effective-rate formula is derived from `monthlyFx.json` (NOT from `FALLBACK_MARKET_DATA.exchangeRates.rates[currency].annualDepreciation`, except as a data-unavailable fallback).

> **Derivation contract**: Given a monthly FX time-series of length `M`, `d_locale` at horizon `years` is computed as the compound annual growth rate of the `closeLocalPerUsd` series over a window of `min(years × 12, M)` months ending at the most recent month.

Specifically:
- If `M < 12`: return sentinel 0.
- Otherwise, take the last `windowMonths = min(Math.round(years × 12), M)` entries from the series, clamped to a minimum of 12 (matches §0.2 universal years→months rounding rule; fractional inputs round half-up).
- The window has `windowMonths − 1` month-to-month intervals, spanning `(windowMonths − 1)/12` years.
- `d_locale = (endClose / startClose)^(12 / (windowMonths − 1)) − 1`, where `startClose` = `closeLocalPerUsd` of the first entry in the window and `endClose` = `closeLocalPerUsd` of the last entry.

**Note**: the "5y horizon" → "use last 60 months → divide by 59/12" convention is the established Phase D rule per `TOOLS_IMPROVEMENT.md` v1.1 §6.1. An auditor using a 61-month slice or dividing by 60/12 will diverge ~0.05–0.5% on the rate depending on FX-path curvature in the window.

### 1.7 User-facing output

| Field | Type | Tolerance |
|---|---|---|
| `monthlyEquivalent` (displayed as "your monthly $X") | currency, 2 decimals | ±$0.01 |
| `bankFV` | currency, integer display | ±$1 |
| `conservativeFV` | currency, integer display | ±$1 |
| `historicalFV` | currency, integer display | ±$1 |
| `optimisticFV` | currency, integer display | ±$1 |

### 1.8 Edge cases

- `amount = 0` → all four FVs return 0.
- `years = 0` → all four FVs return the initial principal (0 if no oneTime amount, otherwise the lump-sum amount). The UI gates rendering on `years ≥ 1`.

---

## 2. Retirement — `/tools/retirement`

### 2.1 Objective

Answer: *"If I contribute every month for 25 years, what would I have at retirement?"*

### 2.2 Purpose

Identical to Compound Interest with different defaults: cadence is fixed at `monthly`, horizon is fixed at 25 years (user-adjustable to 1–40), and the per-locale default amounts are larger to reflect retirement-relevant contributions.

### 2.3 User benefit

Long-horizon projection of consistent retirement savings, showing the magnitude of the bank-vs-diBoaS gap at retirement age.

### 2.4 Outcome contract

Identical to Compound Interest §1.4 with these specializations:
- `cadence` is forced to `monthly`; `monthlyEquivalent = amount`.
- Defaults: en $500/mo × 25y; pt-BR R$2000/mo × 25y; es €400/mo × 25y; de €400/mo × 25y.

### 2.5 Input + output contracts

Same shape as Compound Interest. See `TEST_VECTORS.json` "retirement" section.

### 2.6 Specific verifiable outputs

The pt-BR Retirement default (R$2000/mo × 25y) must produce a Historical FV of **R$7,336,100 ± R$200**. This is a product-truth gate (PT1) requiring exact reproduction.

The de Retirement default (€400/mo × 25y) must produce a Historical FV of **€608,815 ± €20** (PT3).

---

## 3. Goal Savings — `/tools/goal-savings`

### 3.1 Objective

*"How much would I have if I saved $X/month for Y years toward a goal?"*

### 3.2 Purpose

Same engine as Compound Interest with default 10-year horizon and monthly cadence.

### 3.3 Outcome contract

Identical to Compound Interest §1.4. Defaults: en $200/mo × 10y; pt-BR R$1000/mo × 10y; es/de €150/mo × 10y.

---

## 4. Emergency Fund — `/tools/emergency-fund`

### 4.1 Objective

*"How many months will it take me to save up an emergency fund of N months of expenses, given my monthly savings rate?"*

### 4.2 Purpose

Produce two parallel projections (diBoaS Historical scenario vs locale bank) of the number of months until the user's saved balance equals an inflation-adjusted target.

### 4.3 User benefit

Concrete time-to-target answer showing the months saved by using diBoaS vs the bank.

### 4.4 Outcome contract

> **Output (per scenario)**: the smallest integer `m` such that, after `m` months of:
> 1. The savings target `T_m` (the goal amount) grows by one month of inflation: `T_m = T_{m-1} × (1 + i_monthly)`
> 2. The user's balance compounds at the scenario rate for one month: `B_m = B_{m-1} × (1 + r_monthly)`
> 3. The user makes a monthly contribution: `B_m = B_m + monthlySavings`
> 4. The check is performed: if `B_m ≥ T_m`, return `m`.
>
> Cap at 1200 months: if no `m ≤ 1200` satisfies the condition, return `Infinity`.

Where:
- The initial target is `T_0 = monthlyExpenses × targetMultiplier`
- The initial balance is `B_0 = 0`
- `i_monthly = (1 + i_annual)^(1/12) − 1`, where `i_annual = inflationRates.rates[locale].average5y`
- `r_monthly = (1 + r_annual)^(1/12) − 1`, where:
  - For diBoaS Historical scenario: `r_annual = (1 + 0.10)(1 + d_locale_horizon) − 1` where `d_locale_horizon` is computed at the **estimated** horizon `max(1, T_0 / (monthlySavings × 12))` (the rough years-to-target estimate)
  - For bank scenario: `r_annual = bankRates[locale].savings / 100`

**Critical ordering**: the target inflates THEN the balance compounds THEN the contribution is added. Each within a single month iteration. Reversing the order (e.g., contribution before compounding) produces an `m` that is consistently 1 month higher.

### 4.5 Input contract

| Field | Type | Default per locale | Range |
|---|---|---|---|
| `monthlyExpenses` | positive real | en:2900, pt-BR:2700, es:1500, de:2000 | [0, 1,000,000] |
| `monthlySavings` | non-negative real | en:300, pt-BR:270, es:150, de:200 | [0, 1,000,000] |
| `targetMultiplier` | positive integer | 6 (all locales) | [1, 12] |
| `locale` | enum | — | {en, pt-BR, es, de} |

### 4.6 User-facing output

| Field | Type | Tolerance |
|---|---|---|
| `target` (= monthlyExpenses × targetMultiplier) | currency, integer | exact |
| `diboasMonths` | integer or "won't reach" | ±0 |
| `bankMonths` | integer or "won't reach" | ±0 |
| `monthsSaved` (= bankMonths − diboasMonths) | integer or "won't reach" | derived |

### 4.7 Edge cases

- `monthlySavings = 0` → both outputs = Infinity (won't reach).
- When `bankApy ≤ inflationAvg5y` (e.g., en, es, de defaults), the bank scenario typically cannot reach the target → `bankMonths = Infinity`. This is correct behavior; UI must surface "won't reach at this rate."
- **Horizon-matched depreciation fallback (F3)**: when `monthlySavings > 0`, the implementation derives `estimatedHorizonYears = max(1, (monthlyExpenses × targetMultiplier) / (monthlySavings × 12))` and passes it to `resolveHorizonMatchedDepreciation`. When `monthlySavings ≤ 0` the entire output short-circuits to Infinity before the depreciation is consumed, but for parity with the other non-USD tools a default `estimatedHorizonYears = 5` is used in the helper call. A correct auditor implementation may use any value here (it's not observable in the output) but the published default for clarity is **5 years**.

### 4.8 Specific verifiable outputs

en default ($2900 expenses, $300 savings, 6× multiplier, target $17,400):
- `diboasMonths = 57`
- `bankMonths = 76`

See `TEST_VECTORS.json` "emergencyFund" section for all 16 locale × scenario combinations.

---

## 5. Time-to-Target — `/tools/time-to-target`

### 5.1 Objective

*"How long until I reach $X if I contribute $Y/month?"*

### 5.2 Purpose

Same as Emergency Fund but with explicit user-supplied target (not derived from expenses × multiplier), no inflation adjustment (nominal target), and a 4-way scenario comparison (bank / conservative / historical / optimistic).

### 5.3 Outcome contract

Identical to Emergency Fund §4.4 with two specializations:
1. `inflation = 0` (the target is fixed nominal — no inflation growth).
2. Initial balance `B_0` can be non-zero (the `initialAmount` field is the lump-sum already in the account at month 0; it grows from month 1 onward).
3. Four scenarios are produced (bank, conservative, historical, optimistic).

The estimated horizon for the FX-hedge derivation is `max(1, min(40, target / (contribution × 12)))`.

### 5.4 Input contract

| Field | Type | Default per locale | Range |
|---|---|---|---|
| `target` | positive real | en:50000, pt-BR:250000, es/de:40000 | [0, 1,000,000,000] |
| `initialAmount` | non-negative real | 0 (all locales) | [0, 1,000,000,000] |
| `contribution` | non-negative real | en:250, pt-BR:1000, es/de:200 | [0, 1,000,000,000] |
| `cadence` | enum | monthly | 7 options (mapped to monthly equivalent per §1.4 cadence map) |

### 5.5 Specific verifiable outputs

en default ($50k goal, $250/mo): bank 194 months, conservative 135, **historical 121**, optimistic 107.

### 5.6 Edge case: target unreachable

If `bankApy < inflation_implicit` (which is 0 in Time-to-Target by spec), the bank scenario reaches the target eventually for any positive contribution — but very-large targets at very-small contributions may not reach within 1200 months → `Infinity`.

### 5.7 Horizon-matched depreciation fallback (F3)

For non-USD locales, the implementation derives the depreciation rate via `resolveHorizonMatchedDepreciation`. When `contribution > 0`:

```
estimatedHorizonYears = clamp(target / (contribution × 12), [1, 40])
```

When `contribution ≤ 0`, the output short-circuits to Infinity months and the depreciation isn't observable in the output. For parity, the implementation passes a default `estimatedHorizonYears = 10` to the helper. An auditor implementation may use any value here (not observable); the published default for clarity is **10 years**. This differs from Emergency Fund's **5-year** fallback because the Time-to-Target use case implies a longer-saving horizon by construction.

---

## 6. Asset History — `/tools/asset-history`

### 6.1 Objective

*"What if I had invested $X in [asset] starting in [year], either as a one-time amount or as $X/month DCA?"*

### 6.2 Purpose

Retrospective valuation: applies the user's chosen lump-sum or DCA pattern against an actual month-by-month historical price series, producing a current-value answer.

### 6.3 User benefit

Honest historical answer to "what would I have today if I had committed in [year]?" with confidence-stratified uncertainty disclosure.

### 6.4 Outcome contract — Lump Sum

> **Output**: the present-day value of `amount` invested as a single lump sum at the start of the user's chosen `startYear` month, valued at the most recent month's closing price.
> Specifically: `terminalValue = amount × (finalPrice / startPrice)`.

Where:
- `startPrice` = `closePriceOnly` field if `returnsBasis = 'price_only'` AND the asset has the field populated; otherwise `close` field
- `finalPrice` = same field selection at the most-recent month
- `startMonth` = July for `startYear = 2010`, January for `startYear > 2010`
- If the asset's data series doesn't include the chosen start-year-and-month combination, the tool returns an error and the UI displays a fallback message

### 6.5 Outcome contract — Monthly DCA

> **Output**: the present-day value of `amount` invested at the end of each month from `startMonth` of `startYear` through the most recent month in the data series, where each contribution buys a fractional position at that month's `close` price, and the resulting fractional positions are valued at the most-recent month's `close` price.

Mathematically: if `closeₘ` denotes the close at month `m` in the window, and there are `M` months in the window:

> `terminalValue = (Σₘ₌₁ᴹ amount / closeₘ) × close_M`

Additionally, the **range output** is computed for entry-timing sensitivity:

> `rangeHigh = (Σₘ₌₁ᴹ amount / lowₘ) × close_M` (best case: each contribution bought at the month's low)
> `rangeLow  = (Σₘ₌₁ᴹ amount / highₘ) × close_M` (worst case: each contribution bought at the month's high)

The PT2 toggle: if `returnsBasis = 'price_only'`, replace `closeₘ` with `closePriceOnlyₘ` (if populated) in all three sums and in `close_M`.

### 6.6 Confidence stratification

Output a confidence label per the M6 calm-framing principle:

- BTC + `startYear ≤ 2012` → **LOW** (display as RANGE only, no single terminal number)
- BTC + `startYear ≥ 2013` → **MEDIUM** (single number with explicit ± range)
- All other (asset, startYear) combinations → **HIGH** (single number with implicit ± entry-timing range)

### 6.7 Asset codes (the 8 assets in scope)

| AssetCode | Underlying | Data source ticker | Data coverage |
|---|---|---|---|
| `BTC` | Bitcoin spot | CoinMetrics PriceUSD (2010-07 → 2014-08) + BTC-USD Yahoo Finance (2014-09 → 2026-05) | 2010-07 onwards |
| `SP500` | S&P 500 total return | SPY adjusted close | 2010-07 onwards |
| `QQQ` | NASDAQ-100 total return | QQQ adjusted close | 2010-07 onwards |
| `MSCI_WORLD` | MSCI World total return | URTH adjusted close | 2012-01 onwards (URTH inception) |
| `GOLD` | Gold spot | GLD ETF (Yahoo Finance) | 2010-07 onwards |
| `TLT` | 20+ year Treasuries total return | TLT adjusted close | 2010-07 onwards |
| `IBOVESPA` | B3 Brazilian equity native TR | ^BVSP | 2010-07 onwards |
| `DAX` | Deutsche Börse native TR | ^GDAXI | 2010-06 onwards |

The PT2 toggle (`returnsBasis = 'price_only'`) only meaningfully affects the 4 ETF-proxy assets (SP500/QQQ/MSCI_WORLD/TLT) — BTC/GOLD have no dividends and IBOVESPA/DAX are natively total-return.

**BTC backfill (2026-05-23):** the BTC series is spliced — monthly OHLC for 2010-07 → 2014-08 derived from CoinMetrics community-tier daily `PriceUSD` (`open` = first day of month, `close` = last day of month, `high` = max daily, `low` = min daily); from 2014-09 onwards the source is Yahoo Finance BTC-USD as before. Splice point validated: 2014-08-31 CoinMetrics close $478.51 → 2014-09-01 Yahoo open $465.86 (2.6% day-to-day drop, within normal BTC volatility). BTC 2010 DCA $100/mo now produces a real terminal value (~$534M) which sits inside the research-anchored $500M–$1.5B range used by the legacy anchor path — that anchor's order of magnitude is now independently validated.

**MSCI World 2010-07 → 2011-12 gap (intentional, not backfilled):** URTH (the MSCI World ETF tracker) launched January 2012. Pre-2012 MSCI World index data is gated behind MSCI Inc's licensed feed. Substituting a different free instrument (e.g. ACWI, which includes emerging markets) would introduce a meaningful methodology drift in this 19-month window for cosmetic completeness. Decision (2026-05-23): leave MSCI_WORLD with a 2012-01 floor; calculator throws `AssetHistoryDataError` for `startYear ∈ {2010, 2011}` with this asset per the §6.10 below-floor rule.

### 6.8 Input contract

| Field | Type | Default per locale | Range |
|---|---|---|---|
| `asset` | enum | BTC (all locales) | 8 codes per §6.7 |
| `startYear` | integer | 2016 (all locales) | [2010, 2026] |
| `mode` | enum | monthlyDca | {lumpSum, monthlyDca} |
| `amount` | positive real | en:100, pt-BR:500, es/de:100 | [0, 1,000,000] |
| `returnsBasis` | enum | total_return | {total_return, price_only} |

**Test-vector compound scenarios (F6, v2 schema, 2026-05-23).** The `mode-comparison` scenario in `TEST_VECTORS.json` exercises BOTH lumpSum and monthlyDca legs simultaneously to validate the same-total-contributed comparison. To eliminate ambiguity, that scenario's `input` carries explicit `lumpSumAmount` (one-time at startYear close) AND `dcaAmount` (per-month contribution) — NOT a single `amount` field. Auditor implementations MUST key into each leg via its explicit field; passing one number uniformly to both legs produces a wrong DCA result. All other scenarios continue to use the single `amount` field per the table above.

### 6.9 Specific verifiable outputs

| Scenario | Expected | Tolerance |
|---|---:|---|
| BTC 2016 DCA $100/mo (default en) | terminalValue $261,202 | ±$50 |
| BTC 2016 DCA $100/mo range | rangeLow $237,914, rangeHigh $305,010 | ±$100 each |
| SP500 2010 DCA $100/mo total_return | terminalValue $69,602 | ±$50 |
| SP500 2010 DCA $100/mo price_only | terminalValue $58,820 | ±$50 |
| BTC 2016 lumpSum $12,200 | terminalValue $2,565,246 | ±$500 |
| BTC 2010 DCA (data not in monthly series) | error or fallback | "error" or null |

### 6.10 Below-data-floor `startYear` handling (A2 fix, 2026-05-23; spec rewritten for v1.2 per Auditor 4 N2)

Each asset's monthly series has a first-available-month: BTC begins September 2014 (Yahoo's earliest BTC-USD data); MSCI_WORLD via URTH begins January 2012; the remaining 6 assets begin July 2010 (DAX begins June 2010).

The implementation rule (post-A2 data-driven first-month lookup) is:

```
startIdx = series.months.findIndex(m => year(m.ym) === startYear)
if startIdx === -1: throw AssetHistoryDataError("no data for {asset} in {startYear}")
```

In plain language: **find the first row whose year matches the requested `startYear`. If at least one row exists in that year, succeed and use that row as the start; if no row exists, throw an error.** The implementation does NOT special-case "below floor year" vs "at floor year" — there is a single uniform rule, and the outcome falls out from whether the requested year has any data at all.

Concrete behavior per asset (illustrative — `startYear ≤ requested asset's first-available-year`):

| Asset (first available month) | `startYear=2010` | `startYear=2012` | `startYear=2014` |
|---|---|---|---|
| BTC (2014-09) | error | error | success — falls back to 2014-09 |
| MSCI_WORLD (2012-01) | error | success — 2012-01 | success — 2014-01 |
| SP500 / QQQ / GOLD / TLT / IBOVESPA (2010-07) | success — 2010-07 | success — 2012-01 | success — 2014-01 |
| DAX (2010-06) | success — 2010-06 | success — 2012-01 | success — 2014-01 |

Test vectors `assetHistory_13` (BTC `startYear=2010`) and `assetHistory_14` (BTC `startYear=2014`) follow this rule: `_13` errors (no BTC row in 2010), `_14` succeeds with fallback to the first available month (Sept 2014 → 141 months DCA window).

**Legacy code path:** the older `calculateAssetHistory` (anchor-table-based, not in the v1.1+ DCA replay scope) handles BTC 2010 with a LOW-confidence range derived from research data ($500M–$1.5B for $100/mo over 190 months) per audit M6 calm-framing. This legacy path is outside the scope of `calculateAssetHistoryDcaReplay`'s contract above.

### 6.11 Basis-consistent OHLC for TR-adjusted assets (F2 fix, 2026-05-23)

For the 4 TR-adjusted assets (SP500, QQQ, MSCI_WORLD, TLT), `monthlyPrices.json` carries TWO close values per month: `close` (dividend-adjusted, TR basis) and `closePriceOnly` (raw unadjusted). The `high` and `low` fields are raw unadjusted intramonth values from Yahoo. To produce a self-consistent range in `basis='total_return'` mode, implementations MUST scale `high` and `low` by the per-month adjustment factor:

```
factor_i = close_i / closePriceOnly_i
effHigh_i = high_i × factor_i
effLow_i  = low_i  × factor_i
```

This is the standard treatment used by Bloomberg/FactSet. The factor is a within-month constant scalar, so the OHLC invariant (high ≥ close ≥ low) is preserved. Without this scaling, `terminalValue` can escape the `[rangeLow, rangeHigh]` band on these 4 assets because the adjusted close lives in a smaller numeric scale than the raw intramonth high/low. For native-TR assets (BTC, GOLD, IBOVESPA, DAX), `closePriceOnly` is absent, factor = 1 implicitly, and raw OHLC is consumed directly. In `basis='price_only'` mode for the 4 TR-adjusted assets, the calculator uses `closePriceOnly` as the close and the raw unadjusted `high`/`low` directly — all in price-only units, no factor needed. Invariant `rangeLow ≤ terminalValue ≤ rangeHigh` MUST hold for all (asset × basis × startYear) combinations.

---

## 7. Inflation Impact — `/tools/inflation-impact`

### 7.1 Objective

Forward mode: *"What will today's $X be worth in N years, given expected inflation?"*
Retrospective mode: *"What would $X from 2010 be worth today, given cumulative inflation?"*

### 7.2 Outcome contract — Forward mode

> **Cash real value**: `amount / (1 + inflationRate)^years` — purchasing-power equivalent in today's terms after `years` of inflation erosion.
> **Investment loss**: `amount − cashRealValue` — purchasing power lost.
> **Invested nominal**: `amount × (1 + 0.10)^years` — Historical-scenario growth (no inflation adjustment).
> **Invested real**: `(amount × (1 + 0.10)^years) / (1 + inflationRate)^years` — real-terms value of the invested amount.

Where `inflationRate` is selected per the convention:
- `horizonMonths ≤ 24` → use `inflationRates.rates[locale].current` (live April 2026 print)
- `horizonMonths > 24` → use `inflationRates.rates[locale].average5y` (5-year average)
- `horizonMonths = years × 12`

### 7.3 Outcome contract — Retrospective mode

> **Equivalent today**: `amount × (1 + cumulativeSince2010)` — nominal value today of an amount in 2010 dollars/reals/euros.
> **Purchasing power lost**: `amount − amount / (1 + cumulativeSince2010)` — what a 2010 amount has lost in real terms.

Where `cumulativeSince2010` is `inflationRates.rates[locale].cumulativeSince2010` from FALLBACK.

### 7.4 Specific verifiable outputs

| Scenario | Output | Tolerance |
|---|---:|---|
| en $1000 × 10y forward | cashRealValue $644, investedNominal $2,594, investedReal $1,670 | ±$5 |
| pt-BR R$5000 × 10y forward | cashRealValue R$2,818, investedNominal R$12,969 | ±R$10 |
| en retrospective $1000 from 2010 | equivalentToday $1,523 | ±$5 |
| pt-BR retrospective R$5000 from 2010 | equivalentToday R$12,250 | ±R$10 |

### 7.5 Known discontinuity

At horizon boundary `horizonMonths = 24 → 25`, the `inflationRate` switches between `.current` and `.average5y` — a documented design discontinuity. The auditor's implementation must replicate this exactly to match test vectors.

---

## 8. Currency Depreciation — `/tools/currency-depreciation`

### 8.1 Objective

*"What does holding cash in [non-USD currency] cost over N years compared to bank yield or diBoaS digital-dollar return?"*

### 8.2 Outcome contract — Forward mode

Three side-by-side projections of `amount` (in local currency) over `years`:

> **Cash idle**: `amount` (no growth — local currency stays at its today value in nominal terms; the user's purchasing power loss to depreciation is visualized separately).
> **Bank FV**: `amount × (1 + bankRate)^years`, where `bankRate = bankRates[bankSourceLocale].savings / 100` (no FX hedge — bank pays in local currency).
> **diBoaS FV**: `amount × (1 + effectiveRate)^years`, where `effectiveRate = (1 + 0.10) × (1 + d_locale_horizon) − 1` and `d_locale_horizon` is computed per §1.6 at the user's `years` horizon.

### 8.3 Outcome contract — Retrospective mode

Uses the path-dependent retrospective FX walk (per `calculateMonthlyPathDependentHedge` algorithm). The auditor implementing this from first principles needs to:

> Compute the equivalent USD value of the local-currency principal as of `startYear-startMonth`, walk forward applying USD-yield growth month-by-month while tracking the corresponding local-currency value at each month's FX rate. The final value is the actual realized local-currency outcome of holding USD-denominated returns through the historical FX path.

Specifically, the retrospective path-dependent walk is sensitive to the exact monthly FX series provided in `monthlyFx.json`; the auditor's path must match the bundled data byte-for-byte.

### 8.4 Specific verifiable outputs

| Scenario | Output | Tolerance |
|---|---:|---|
| en $10k × 5y USD (no hedge) | diBoaS FV $16,105 | ±$10 |
| pt-BR R$50k × 5y BRL forward | diBoaS FV R$80,719 | ±R$50 |
| pt-BR R$50k × 10y BRL forward | diBoaS FV R$203,358 | ±R$100 |

---

## 9. Card Fee Savings — `/tools/card-fees` (B2B)

### 9.1 Objective

*"How much do card-processor fees cost my business per year, and how much could I save with diBoaS?"*

### 9.2 Outcome contract

> **Monthly fee paid**: `monthlyVolume × processorFeeRate`
> **Annual fee paid**: `monthlyFee × 12`
> **diBoaS savings**: equal to `annualFee` (the tool's model assumes diBoaS card processing is 100% pass-through with no per-transaction merchant fee).
> **Per-transaction fee** (optional): `avgTransactionAmount × processorFeeRate`, populated when `avgTx > 0`.

### 9.3 Input contract

| Field | Type | Default per locale | Range |
|---|---|---|---|
| `monthlyVolume` | non-negative real | en:50000, pt-BR:250000, es/de:40000 | [0, 1,000,000,000] |
| `processorFeeRate` | non-negative real (decimal) | en:0.029, pt-BR:0.030, es/de:0.008 | [0, 1] |
| `avgTransactionAmount` | non-negative real | en:75, pt-BR:250, es/de:60 | [0, 1,000,000,000] |

### 9.4 Specific verifiable outputs

- en default: $50,000/mo × 2.9% = $1,450/mo × 12 = **$17,400/yr annual fee = diBoaS savings**
- es default (post-IFR effective): €40,000/mo × 0.8% = €320/mo × 12 = **€3,840/yr**

---

## 10. Idle Cash Yield — `/tools/idle-cash` (B2B)

### 10.1 Objective

*"What could my business's idle cash earn at current bank rates vs at diBoaS Conservative yield?"*

### 10.2 Outcome contract

Two side-by-side projections of `idleCash` (in local currency) over `years`:

> **Bank FV**: `idleCash × (1 + bankYieldPct/100)^years` (no FX hedge — bank pays in local currency).
> **diBoaS FV**: `idleCash × (1 + effectiveRate)^years`, where `effectiveRate = (1 + 0.07) × (1 + d_locale_horizon) − 1` (NOTE: uses Conservative 7% NOT Historical 10% — this is intentional per Decision Q1, B2B framing).

### 10.3 Input contract

| Field | Type | Default per locale | Range |
|---|---|---|---|
| `idleCash` | non-negative real | en:100k, pt-BR:500k, es/de:80k | [0, 1,000,000,000] |
| `years` | positive integer | 3 (all locales) | [1, 40] |
| `bankYieldPct` | non-negative real | locale's bank savings rate (en:0.38, pt-BR:6.83, es:2.0, de:2.3) — user-editable | [0, 100] |

### 10.4 Specific verifiable outputs

| Scenario | Output | Tolerance |
|---|---:|---|
| en default ($100k × 3y at 0.38% bank, 7% diBoaS) | bankFV $101,144, diBoaSFV $122,504 | ±$50 each |
| pt-BR default (R$500k × 3y at 6.83% bank) | bankFV R$609,607, diBoaSFV R$638,006 | ±R$100 each |

---

## 11. Brazil Poupança (supporting formula, pt-BR only)

### 11.1 Objective

Apply the regulatory rule from Lei nº 12.703/2012 to derive the live poupança annual yield from the current Selic rate and TR.

### 11.2 Outcome contract

> If `selicAnnualPct > 8.5`: poupança yields 0.5% per month plus TR, annualized geometrically.
> `rate = (1 + 0.005 + trMonthlyPct/100)^12 − 1`
>
> Otherwise (low-Selic regime): poupança yields 70% of Selic plus TR, expressed as annual.
> `rate = 0.7 × (selicAnnualPct/100) + ((1 + trMonthlyPct/100)^12 − 1)`

### 11.3 Specific verifiable outputs

| Selic input | TR input | Expected output | Notes |
|---|---:|---:|---|
| 14.50% | 0 | 6.17%/yr | Current regime (April 29 2026 Copom) |
| 8.50% | 0 | 5.95%/yr | Low-regime boundary |
| 8.51% | 0 | 6.17%/yr | Jumps to high regime |
| 6.00% | 0 | 4.20%/yr | Low-regime example |
| 14.50% | 0.05%/mo | 6.80%/yr | TR-positive example |
| -1, NaN | any | 0 (sentinel) | Negative / non-finite Selic |

This is the published BCB regulatory rule; the discontinuity at 8.5% is a regulatory feature, not a tool design choice.

---

## 12. Audit verification procedure

1. **Implement each tool's outcome contract** (§1.4, §2.4, etc.) in your language of choice, using your preferred formula. Do not reference the diBoaS code.
2. **Load the bundled data files** from `docs/tech/audit-bundle/data/`. Do not re-pull from upstream sources.
3. **Run your implementation against `TEST_VECTORS.json`**: for each scenario, feed the `input` dictionary into your implementation, and compare your output against the `expectedOutput` dictionary using the per-field `tolerance` specifications.
4. **Report divergences**: any scenario where your output exceeds the tolerance is a finding worth investigating. If the divergence is consistent (e.g., always +5%), it suggests a convention mismatch — re-read the relevant tool's §X.4–§X.5.
5. **Spot-check the PT acceptance gates** (PT1 R$7,336,100; PT2 SP500 TR vs price-only ~18.33% delta — was 18.76% pre-F1 dedup; PT3 €608,815; BTC_RECON $261,202 — was $254,188 pre-F1 dedup). These are Bar-signed product-truth values and must be reproduced exactly.

If your implementation passes all test vectors within tolerance, the audit conclusion is that the diBoaS tools faithfully implement the documented outcome contract. If not, the divergence is a concrete finding for the tool team to investigate.

## 13. Changelog

- **v1.0 (2026-05-23):** Initial functional specification. 10 tools + 1 supporting formula. Universal conventions §0. Each tool §X has objective, purpose, user benefit, outcome contract (math without algorithm prescription), input contract, output contract, specific verifiable outputs, edge cases.
