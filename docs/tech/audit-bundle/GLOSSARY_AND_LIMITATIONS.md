# Tools Suite — Glossary & Limitations Statement

**Document version:** 1.0 (2026-05-23)
**Audience:** External auditor + new internal stakeholders.
**Purpose:** Define every diBoaS-specific term, every financial-terminology choice, and every explicit non-claim the tools make. Eliminates ambiguity for an auditor who is not familiar with the platform.

---

## 1. Glossary — diBoaS-specific terms

| Term | Definition | First introduced |
|---|---|---|
| **diBoaS** | "Diversificação Boa em Ações" (Portuguese) — branded platform name. Marketing entity offering wealth-building tools. | Brand inception |
| **Adelaide** | Brand persona — "the grandmother that finance forgot." Drives the "Adelaide Daily" macro dashboard at `/market`. | Pre-launch storytelling |
| **Adelaide Daily** | The BTC macro-regime dashboard at `/market`. Powered by `diboas-analytics` SDK (Pattern B integration). Out of scope for `/tools` audit. | Phase 6 |
| **digital dollar** | Generic user-facing label for the underlying USDC-equivalent yield diBoaS strategies generate. Phase 7 `digitalDollarSuffix` discipline — body copy uses "digital dollar" instead of "USDC" / "stablecoin" / "DeFi". | Phase 7 §5.2 |
| **scenarios** | The 4-band yield envelope shown on tool result cards: bank (locale-specific), Conservative (7%), Historical (10%), Optimistic (14%). The 3 diBoaS scenarios are USD nominal rates; non-USD locales apply currency-hedge per §2.3 below. | Phase 6 |
| **Conservative scenario** | 7% USD nominal — Hardcoded in `FALLBACK_MARKET_DATA.rates.scenarioRates.conservative`. Per CLAUDE.md: "digital-dollar (USDC) yield envelope across Solana-first DeFi stack." NOT advertised as a guaranteed return. | Phase 6E.2 |
| **Historical scenario** | 10% USD nominal. The diBoaS-canonical reference rate; matches S&P 500 1928-2024 total-return CAGR ~10.2%. Default highlighted scenario on most tools. | Phase 6 |
| **Optimistic scenario** | 14% USD nominal — reflects trailing-10y multi-asset bull-cycle envelope. Always disclosed as high-end, not baseline. | Phase 6 |
| **B2B forBusiness pill** | UI tag on `/tools` landing identifying tools relevant to business merchants (currently 2: Card Fees + Idle Cash). Implemented as `ToolDescriptor.forBusiness: true` in `apps/web/src/lib/tools/constants.ts`. | Phase 6E |
| **Try Demo / Show Me / waitlist** | Pre-launch CTAs. Tools surface them as conversion paths. No actual financial transaction occurs. | Pre-launch |
| **Dream Mode** | The goal-calculator simulation at `/dream-mode` (not `/tools`). Out of scope for tools audit but shares some library code (`lib/pre-dream/`). | Phase 5 |

## 2. Glossary — methodology terms

| Term | Definition | Implementation |
|---|---|---|
| **horizon-matched CAGR** | Phase D (2026-05-23) methodology for forward FX projection. The CAGR window matches the user's horizon: `windowMonths = min(horizonYears × 12, totalAvailableMonths)`. Continuous (no step-function discontinuity). | `apps/web/src/lib/market-data/formulas/horizonMatchedCagr.ts` |
| **path-dependent FX walk** | Phase 7 / 2026-05-16 retrospective methodology. Walks actual historical month-by-month FX rates. Used by Currency Depreciation retrospective mode. | `apps/web/src/lib/market-data/formulas/currencyHedge.ts:calculateMonthlyPathDependentHedge` |
| **effective-rate currency hedge** | Forward-projection currency-hedge formula: `effectiveLocalAPY = (1 + usdYield) × (1 + localDepreciation) − 1`. Applies to non-USD locales. | `formulas/currencyHedge.ts:calculateWithCurrencyHedge` |
| **M6 calm-framing** | Audit principle (from 2026-05-16 audit) requiring high-uncertainty outputs to display as a RANGE, not a single number. BTC 2010-2012 DCA falls under this. | Asset History `confidenceForDcaReplay` |
| **R1 discipline** | Phase 7 Q7(a) lock: never consolidate hedged + non-hedged calculator variants via a `hedge: boolean` flag. Two distinct named functions: `calculateCompoundProjection` (lesson, non-hedged) and `calculateCompoundProjectionHedged` (tools, hedged). | `apps/web/src/lib/compound-interest/calculator*.ts` |
| **monthly OHLC replay** | Phase E v2 (Asset History) — each month's $X DCA contribution buys at month-end close; best-case range uses monthly-low (cheapest entry), worst-case uses monthly-high (worst entry). | `lib/asset-history/calculator.ts:calculateAssetHistoryDcaReplay` |
| **PT1 / PT2 / PT3** | Product-truth decision-register rows. PT1 = pt-BR Retirement R$7.34M acceptance; PT2 = Asset History S&P/QQQ/MSCI total-return basis toggle; PT3 = EUR depreciation horizon-matched value (€608k Retirement). Each Bar-signed 2026-05-23. | `docs/audit/TOOLS_IMPROVEMENT.md` §3 |
| **PA1 / BTC-RECON** | Phase A validation gates. PA1 = **BRL full-series CAGR (Jan 2010 → May 2026)** go/no-go — live BCB PTAX OData matches narrative within ±0.5%. (Renamed from "16y CAGR" per Auditor 4 F5 — prior name was ambiguous about endpoint choice.) BTC-RECON = the $261,202 DCA replay reconciliation (was $254,188 pre-F1 dedup; updated post-fix) that closed the 5× delta between the research table ($200k) and File #1 ($30-40k). | `docs/audit/TOOLS_IMPROVEMENT.md` §3 |
| **Pattern B integration** | The `/market` UI-embed integration model via `@analytics-platform/client` SDK. NOT applicable to `/tools` (which is a field-by-field `IMarketDataProvider` pattern per `iter5-sdk-migration-map.md`). | `docs/integrations/diboas-analytics.md` |
| **K.3 weekly runbook** | The steady-state operating model for the Hardcoded `monthlySeries.*` data subset. Manual refresh by engineering. NOT replaced by the iter-5 SDK (which only takes Provider-driven fields). | `docs/integrations/tools-data-weekly-runbook.md` |

## 3. Glossary — general financial terms (audit reference)

| Term | Definition | Used by |
|---|---|---|
| **APY (Annual Percentage Yield)** | Effective annual rate of return accounting for compounding within the year. The TILA Reg DD-mandated terminology for deposit accounts in the US. | en bank-rate displays |
| **APR (Annual Percentage Rate)** | Nominal annual interest rate without compounding adjustment. NOT used in tool outputs (tools use APY-equivalent compounded math throughout). | n/a in tools |
| **FV (Future Value)** | The accumulated value of an investment at a future date. Standard textbook formula: lump-sum `P × (1+r)^t`; annuity `PMT × ((1+i)^n − 1)/i` where i = monthly geometric rate. | All projection tools |
| **DCA (Dollar Cost Averaging)** | Regular contributions to an investment at a fixed cadence regardless of price. Standard investment strategy. | Asset History, Compound, Retirement, etc. (monthly cadence) |
| **Lump sum** | Single one-time investment at start of horizon. Asset History supports both modes. | Asset History |
| **Total return** | Asset return including dividends/coupons reinvested. SP500/QQQ/MSCI/TLT default basis in Asset History. ETF adjusted-close = total return. | Asset History (PT2 toggle) |
| **Price return / price-only** | Asset return excluding dividends. Roughly 30% lower than total return for S&P 500 over 16 years. PT2 toggle alternative. | Asset History (PT2 toggle) |
| **Real return (real value)** | Inflation-adjusted return. Computed as `nominal / (1 + inflation)^years`. Used in Inflation Impact tool. | Inflation Impact |
| **Nominal return (nominal value)** | Return without inflation adjustment. Used as the headline number in all tool outputs except Inflation Impact (which contrasts real vs nominal). | All projection tools |
| **Geometric mean / CAGR** | Compound Annual Growth Rate: `(endValue / startValue)^(1/years) - 1`. Used for asset/FX backtests. | Asset History, Currency Depreciation, FX hedge derivation |
| **Monthly geometric rate** | `i = (1 + annualRate)^(1/12) - 1`. Converts annual rate to monthly without overstating compounding. Used in annuity FV computations. | `formulas/core.ts:annualToMonthlyRate` |
| **Ordinary annuity** | Cash flow at end of each period (vs annuity-due at start). Tools default to end-of-period unless specified. | `calculateMonthlyContributions` with `timing='end'` |
| **Cumulative inflation** | Total compound inflation over a window. e.g., `(1 + i)^years - 1` cumulative since 2010. en: 52.3%; pt-BR: 145%. Used in Inflation Impact retrospective mode. | `inflationRates.rates.*.cumulativeSince2010` |
| **Selic** | Brazilian central bank policy rate. Currently 14.50% (April 29, 2026 Copom). Drives the poupança regime-switch. | Brazil poupança formula |
| **TR (Taxa Referencial)** | Brazilian floating reference rate used as a poupança adder. Currently near zero. BCB SGS series 7811. | Brazil poupança formula |
| **Poupança** | Brazilian regulated savings account. Rate = `0.5%/mo + TR` when Selic > 8.5%; `70% × Selic + TR` otherwise. Lei 12.703/2012. | pt-BR `bankRates.savingsCurrent` |
| **IFR caps** | EU Interchange Fee Regulation (EU) 2015/751: 0.2% debit / 0.3% credit consumer-card interchange ceiling. Drives ES/DE Card Fees default to ~0.8% effective MSC. | Card Fees ES/DE |
| **MSC (Merchant Service Charge)** | Total fee a merchant pays to accept a card payment = interchange + scheme fees + acquirer markup. EU effective MSC ~0.44-1.0% after IFR. | Card Fees |
| **HYSA (High-Yield Savings Account)** | US top-tier savings rate ~4.10% (NerdWallet May 2026 leaderboard). Surfaced as toggle in en bank rate. | en `bankRates.savingsHighYield` |
| **Tagesgeld** | German call-money / overnight-deposit savings account. Typical rate 2.0-2.6% standard (May 2026). | de `bankRates.savings` |
| **Cuenta remunerada** | Spanish interest-bearing checking-equivalent account. Typical 1.0-3.04% TAE. | es `bankRates.savings` |
| **Saturation behavior** | When the horizon-matched-window method's `min(horizonYears × 12, totalAvailableMonths)` hits the data ceiling. For pt-BR Retirement (25y horizon, 197 months data), the window saturates at full series → 6.21% CAGR → R$7.34M FV. | Phase A finding |

## 4. Explicit limitations — what the tools do NOT claim

This section is the audit-relevant "non-claims" register. Every limitation below should be interpreted as a hard contract: the tool MAKES NO CLAIM to the contrary, and any user who reads the output to mean otherwise is reading something the disclaimer does not assert.

### 4.1 Universal limitations (every tool)

1. **Not financial advice.** Every tool's result card surfaces `tools-shared.disclaimer` which states "Educational projection only. Not financial advice."
2. **Not personalized recommendations.** The tools compute mechanical scenarios from user inputs; no profiling, no risk tolerance assessment, no goal optimization. A user with $X to invest is told what compounding produces, not what they should invest in.
3. **Pre-tax projections.** All numeric outputs are gross, before any jurisdiction-specific tax treatment. (US capital gains, Brazilian IR-22.5%, EU MwSt., etc. not applied.) Per CLAUDE.md: "Tools are pre-tax projections; validating against after-tax outcomes produces false failures."
4. **Past performance is not predictive.** Standard FTC §5 / MiCA Art. 13 / CVM 19/2021 disclaimer; explicit in 4-locale universal disclaimer.
5. **Yield assumptions are scenarios, not guarantees.** The 7% / 10% / 14% scenario rates are labeled as Conservative / Historical / Optimistic — not as products diBoaS sells.
6. **Tools are not transactional.** No order is placed; no security is purchased; no signing takes place. Diboas is in pre-launch / waitlist phase.
7. **diBoaS is not a registered investment adviser, broker, or bank.** Not currently registered under SEC 1940 Act §202, BaFin §32 WpHG, CVM CRP, CNMV LIMV.
8. **The diBoaS app itself is not currently a CVM-registered investment product (Brazil), not a MiCA-licensed crypto-asset service provider (EU), not an FDIC-insured depository (US).** Bank rates shown for comparison are external FDIC/ECB/BCB national-average figures, not diBoaS-offered deposit rates.

### 4.2 Per-tool limitations

#### 4.2.1 Compound Interest / Retirement / Goal Savings

- **Returns are nominal (not real).** Inflation NOT subtracted from the headline FV. A user reading "$1M retirement default" should not interpret this as "$1M in today's purchasing power."
- **FX hedge assumes the historical relationship continues.** The horizon-matched CAGR derives from 2010-2026 actual FX behavior. The future may differ — the tool surfaces the data-anchored projection, not a forecast.
- **Bank scenarios use locale-typical rates, not user's actual bank.** A US user with a 5% promotional account is NOT modeled; the en default is FDIC national-average 0.38%.
- **Scenarios are not specific products.** Conservative 7% is not "the diBoaS Conservative account" — it's an envelope figure. Once products launch, actual yields will differ from these scenarios.

#### 4.2.2 Emergency Fund

- **The "won't reach" output is mathematical, not behavioral.** When a user's monthly savings rate is below inflation, the target inflates faster than savings can catch up. The tool surfaces this honestly via 1200-month cap → Infinity. It does NOT advise the user to change their savings rate.
- **Target multiplier 6 months is conventional, not mandatory.** Tool accepts 1-12 months; no opinion on "right" answer.
- **Inflation used is the 5-year average (`.average5y`), not the live monthly print.** For the projection horizon of typical emergency funds (1-5 years), this is a defensible smoothing choice. A user expecting "today's inflation rate" should look at the live `.current` rate shown in Inflation Impact instead.

#### 4.2.3 Time-to-Target

- **No inflation adjustment.** Tool computes nominal months-to-reach-nominal-target. A user wanting inflation-adjusted "months to reach today's $X buying power" should use Emergency Fund (which does inflate the target) or compute manually.
- **Initial deposit is treated as immediately available at the rate.** No time-deposit lockup considered.

#### 4.2.4 Asset History

- **Historical performance is path-dependent and locked.** A user who selects "BTC, 2016, $100/mo DCA" gets the exact same number every time because the underlying monthly OHLC data is frozen. Daily refreshes apply only to the end-anchor and current-spot.
- **2010 start year floors at July 2010** (data start for non-BTC assets); 2011-2025 starts at January. BTC has a data floor at September 2014 (Yahoo's earliest). For BTC + 2010-2014, the legacy LOW-confidence range branch is used (audit M6 calm-framing).
- **MSCI World inception** in Yahoo's URTH ETF is January 2012. Selecting MSCI World + 2010 or 2011 returns an error / fallback to 2012.
- **Asset prices are in the asset's native currency.** IBOVESPA is BRL; DAX is EUR; all others USD. The tool labels rendered values with the user's locale currency symbol but does NOT FX-convert (Phase F.2 future improvement).
- **PT2 toggle (total-return vs price-only) only meaningful for SP500/QQQ/MSCI/TLT.** BTC/Gold/Crypto: no dividends → price = total return. DAX/Ibovespa: native total-return indices by methodology.
- **DCA replay uses month-end close as the purchase price.** Best-case range uses monthly low (cheapest entry); worst-case uses monthly high. Real DCA users get something between these, depending on the day-of-month their order executes.

#### 4.2.5 Inflation Impact

- **24/25-month discontinuity in inflation rate.** `selectInflationRate` uses `.current` for horizons ≤ 24mo, `.average5y` for > 24mo. Documented design choice; produces a visible jump at boundary.
- **Inflation rate is locale-wide, not user-specific.** A user with a different consumption basket (more food, more energy, etc.) will experience different effective inflation.
- **Retrospective `cumulativeSince2010` is a single point estimate.** Computed from BLS/IBGE/Eurostat back-series; updated annually per K.3 runbook.

#### 4.2.6 Currency Depreciation

- **Forward depreciation derived from past data.** The horizon-matched-CAGR window assumes future FX behavior follows the trailing N-year pattern. This is the most-aggressive assumption in the tool suite. A user reading "BRL depreciates 6.21%/yr" should NOT interpret this as a forecast.
- **The 5-year window for BRL currently shows ~0.05%** because USD/BRL has been range-bound 4.9-5.5 over 2021-2026. This is data-faithful but counter to the long-term narrative.
- **For USD users**, depreciation is 0 — no hedge applied. Tool is most informative for non-USD users.

#### 4.2.7 Card Fees

- **"Upper-bound estimate" assumption.** Tool computes `monthlyVolume × processorFeeRate × 12` as both the annual fee paid AND the diBoaS savings. This treats diBoaS as 100% pass-through (no per-tx merchant-side fee), which is the current product model per Decision E (E-followup-1). Actual merchant economics depend on customer mix, refund rates, chargebacks, and cross-border surcharges — none modeled.
- **Default fee rates per locale reflect blended typical, not user's specific contract.** US 2.9% is Stripe-blended; BR 3.0% is adquirentes-typical; ES/DE 0.8% is post-IFR effective MSC. A merchant with a different acquirer will have different real rates.
- **Phase H lowered ES/DE from 1.75% to 0.8%** based on Decision Q3 (effective MSC vs published blended rates). The auditor should verify this rate change is reflected in the live es/de Card Fees tool output.

#### 4.2.8 Idle Cash

- **Uses Conservative (7%) NOT Historical (10%).** Idle Cash is framed as conservative cash-management, not investment. Per Decision Q1 (Bar-signed): intentional asymmetry vs B2C compound family.
- **No inflation adjustment.** Tool shows nominal gains. A merchant treasury with $100k idle in en (3.8% inflation) actually has $4,180/yr in lost purchasing power at the 0.38% bank rate, vs $3,220 at the 7% diBoaS conservative — but this is not surfaced in the tool's headline output.
- **User-override bank yield (e.g., HYSA 4.10%) is accepted and used directly.** No validation of whether the rate is real.

#### 4.2.9 Brazil Poupança (supporting formula)

- **The formula is the BCB-published rule** (Lei nº 12.703/2012). Tool does not invent or modify it. If BCB changes the rule, the formula changes.
- **Selic threshold of 8.5% is the regulatory boundary** — discontinuous switch is a feature, not a bug. Documented design choice.

### 4.3 Disclosure scope (what the tool's disclaimer covers)

The universal `tools-shared.disclaimer` covers:
- "Educational projection only"
- "Not financial advice"
- "Past performance does not guarantee future results"
- "diBoaS returns are shown in digital dollar; for non-US currencies, the local-currency total combines the dollar return with how your local currency typically moves against the US dollar over time."

It does NOT (currently) cover:
- ⚠️ The explicit US APY-terminology requirement (TILA Reg DD §1030.8(b)(1))
- ⚠️ The CVM 19/2021 3-warning rule (warnings 2 + 3 missing)
- ⚠️ The EU IFR 2015/751 cap disclosure for Card Fees ES/DE
- ⚠️ The BaFin / CNMV jurisdiction-specific phrasing nuances

See `REGULATORY_CROSSWALK.md` §5 for the Phase I sub-PR copy recommendations to close these gaps.

## 5. Data-source provenance

The auditor should NOT take any numeric claim in the tools at face value without traceability to an external source. Every constant in `FALLBACK_MARKET_DATA` has a corresponding entry in `FALLBACK_MARKET_DATA_METADATA` with two fields:

- `last_verified`: ISO date when the value was confirmed against the external source
- `source`: human-readable string identifying the source (e.g., "FDIC National Rates and Rate Caps, April 2026")

For monthly time-series data:
- `monthlySeries.assets[asset]`: Yahoo Finance v8 chart API (per asset.source field)
- `monthlySeries.fx.BRL`: BCB PTAX OData
- `monthlySeries.fx.{EUR, GBP, AUD, CAD, CHF, JPY, MXN}`: ECB EXR cross-via-EUR (per series.source field)
- `monthlySeries.fx.{ARS, CLP, COP}`: pending (Phase F)

For decision-driven values (not external market data):
- `scenarioRates`: locked by Phase 6E.2 product decision; refreshed annually only by Bar + research review.
- `platformFees`: pricing decision documented in `docs/full-view/FEES.md` (local-only); never market-data.

## 6. What's NOT in `FALLBACK_MARKET_DATA`

For audit completeness — fields the auditor might expect to find but that are intentionally absent:

- **Stablecoin issuance fees** — not in tools (not modeled).
- **Network gas fees** — modeled separately in `networkGas` (not consumed by /tools).
- **Per-asset volatility** — not modeled; confidence stratification is qualitative per M6.
- **User-specific tax brackets** — out of scope; pre-tax projections only.
- **Spread / bid-ask** — not modeled in asset-history (uses monthly close which is the midpoint by convention).

## 7. Auditor self-test questions

If the auditor can answer "yes" to all of these, the bundle is sufficient for audit purposes:

1. ☐ Can I locate the formula for each tool in code?
2. ☐ Can I locate the source attribution (URL + date) for each input constant?
3. ☐ Can I run the simulator and reproduce the production-rendered numbers?
4. ☐ Can I identify which regulations apply per locale and verify the disclosures?
5. ☐ Can I trace any user-facing magnitude back to a Bar sign-off in the decision register?
6. ☐ Can I distinguish a "shipped" feature from a "deferred" one?
7. ☐ Can I tell which tools are pre-tax / post-tax (answer: all pre-tax)?
8. ☐ Can I identify any cases where the calculator throws an error and verify the UI handles it gracefully?

The 3 audit-bundle docs (this + manifest + crosswalk) + the existing `TOOLS_VALIDATION.md` + the code at the audit commit SHA should satisfy all 8.

## 8. Changelog

- **v1.0 (2026-05-23):** Initial glossary + limitations statement. Covers all 10 tools + 1 supporting formula. 47 glossary entries; 8 universal + 9 per-tool limitations; 5 audit self-test questions.
