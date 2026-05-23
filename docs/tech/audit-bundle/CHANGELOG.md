# Audit Bundle Changelog

Re-audit cycles after Bundle v1.0 (2026-05-23). Each entry is a self-contained delta — auditors can read the latest entry and the manifest to re-run.

---

## v1.5 — 2026-05-23 (Asset History cross-currency FX path + TLT UX + forward-tool USD parenthetical)

**Audience:** future auditors + product reviewers.
**Context:** User-observed UX issues prompted three concurrent improvements: (1) TLT 2016 DCA appeared to produce a loss without explanation, (2) Asset History numbers for non-USD locales were labeled with local currency symbol but computed in USD (cross-currency rendering bug), (3) forward-projecting tools didn't surface the dollar dimension implicit in the effective-rate hedge model.

### Asset History — proper FX-path math for non-USD locales (real bug fix)

The DCA replay and lump-sum calculators previously treated `args.amount` as if it were in the asset's native currency, then labeled the output with the user's locale currency symbol. For a pt-BR user investing in BTC, "R$500/month" was being treated as $500 USD, and the $1.3M USD terminal was labeled "R$1.3M" — wrong magnitude (you'd actually accumulate R$1.84M after FX path) and wrong unit (the math wasn't in BRL at all).

**Fix:** introduced a new `displayCurrency` arg (USD/BRL/EUR). When non-USD AND different from the asset's native currency:
- Each month's contribution is converted from `displayCurrency` to asset-native at THAT month's historical FX close rate (via `monthlyFx`)
- The unit math runs in asset-native units
- The terminal asset-native value is converted back to `displayCurrency` at the end-month's FX rate

This is the **path-dependent retrospective FX model**, which is appropriate here because historical FX rates are known. It does NOT violate the CLAUDE.md prohibition on the explicit forward-projection FX model — that prohibition is about projecting unknown future FX rates, which doesn't apply to retrospective tools.

**Native pricing currency per asset** (now documented in §6.7):

| Native USD | Native BRL | Native EUR |
|---|---|---|
| BTC, SP500, QQQ, MSCI_WORLD, GOLD, TLT | IBOVESPA | DAX |

Cross-rates derive via USD (e.g., BRL→EUR = BRL→USD × USD→EUR). When the requested month's FX rate isn't in `monthlyFx` (e.g., EUR data lags asset-price data by 1 month), the lookup forward-fills with the latest available earlier month — standard end-of-window handling.

**Magnitude of impact (pt-BR BTC 2016 DCA R$500/mo, illustrative):**
- Pre-v1.5: R$1,306,011 (USD math, R$ label)
- Post-v1.5: R$1,842,885 (real BRL value after the BRL depreciation tailwind)
- Difference is the value of the BRL depreciation against USD over the window (~6%/yr)

**PT gates impact:** all unchanged. PT1/PT3 use Retirement (calculatorHedged, no asset-history FX), PT2/BTC_RECON use locale-less (USD-default) scenarios, PA1 is a constants-level gate.

### TLT UX wins (no math change)

- **Per-asset description tooltips** on the asset selector explain each asset's character. The TLT description specifically notes its long duration and the 2022-2023 Fed-hike crush — addressing user confusion about why TLT produces a loss for 2016-2026 DCA (it's historically accurate: 10-year US Treasury yields rose from ~0.5% Aug 2020 to ~5% Oct 2023; long-duration bonds lost roughly 50% peak-to-trough)
- **Gain/loss percentage badge** next to the terminal value: green `+N%` for gains, red `−N%` for losses. Computed as `(terminalValue / totalContributed) - 1`

### USD-equivalent parenthetical on forward tools (presentation only)

For non-USD locales, the user's amount input on Compound Interest / Retirement / Goal Savings / Emergency Fund / Time-to-Target / Idle Cash now displays "≈ $X USD today" next to the input. Computed from `marketDataService.getSync().exchangeRates.rates[currency].rateToUsd`. Makes the dollar dimension visible without changing any math — the underlying calculations continue to use the currency-hedged effective-rate model (`(1+usdYield)(1+depreciation)−1`) per the Phase 7 architectural decision.

**Tools intentionally NOT receiving the parenthetical:**
- Inflation Impact (purely about purchasing-power loss in the user's currency; no USD step is meaningful)
- Currency Depreciation (explicitly an FX tool with its own currency selector)
- Card Fees (% math; no FX step)

### Quality gates (post-v1.5)

- 863 tests passing
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors
- All 5 PT gates reproduce exactly against the regenerated v2 vectors
- All 4 locales × 31 translation files synced via `validate:translations`
- F2 invariant (rangeLow ≤ terminalValue ≤ rangeHigh) holds for all 32 (asset × startYear × basis) combinations after FX-path integration

### Files refreshed in this delta

```
docs/tech/audit-bundle/CHANGELOG.md                                    (this entry)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md                     (§6.7 native-currency table)
docs/tech/audit-bundle/TEST_VECTORS.json                               (assetHistory locale scenarios regenerated)
apps/web/src/lib/asset-history/calculator.ts                           (displayCurrency arg + buildFxLookup)
apps/web/src/components/Sections/AssetHistoryCalculator/...            (UI wiring + tooltips + gain badge)
apps/web/src/components/UI/UsdEquivalentBadge.tsx                      (new reusable component)
apps/web/src/components/Sections/{Compound,Idle,Emergency,TimeToTarget}Calculator/...  (badge wiring)
apps/web/scripts/tools-stress-test.mjs                                 (mirror of calculator FX logic)
packages/i18n/translations/{en,pt-BR,es,de}/tools-asset-history.json   (8 asset descriptions + gain-badge tooltip)
packages/i18n/translations/{en,pt-BR,es,de}/tools-shared.json          (usdEquivalent label)
```

---

## v1.4 — 2026-05-23 (BTC pre-2014 backfill + MSCI World floor documented)

**Audience:** future auditors + product-owner.
**Context:** User-reported observation that Asset History could not show BTC results before 2014-09 nor MSCI World results before 2012-01. Investigation confirmed this was an upstream data-source limitation (Yahoo Finance's BTC-USD starts 2014-09; URTH ETF launched 2012-01), not a calculation bug. Decision: backfill BTC with an alternate free source (CoinMetrics) where the data is uncontroversially available; leave MSCI World's 2012-01 floor in place because pre-inception MSCI World index data is gated and proxy substitution would introduce methodology drift.

### BTC backfilled 2010-07 → 2014-08 via CoinMetrics

50 months of monthly OHLC prepended to the BTC series. Source: CoinMetrics community-tier API (`PriceUSD` daily, aggregated to monthly OHLC). Splice point validated: 2014-08-31 CoinMetrics close $478.51 → 2014-09-01 Yahoo open $465.86 (2.6% day-to-day drop, within normal BTC volatility — no continuity break). Fetcher script `apps/web/scripts/data-fetchers/fetch-btc-coinmetrics.mjs` allows future re-runs.

**Validation outcome:** BTC 2010 DCA $100/mo now produces a real terminal value:
- 191 months, $19,100 contributed
- Terminal value: **$534M**
- Range (best/worst entry): $462M – $718M
- Confidence: LOW (per spec §6.6 — BTC 2010-2012 startYear is calm-framed LOW)
- **Independently validates the legacy anchor path's $500M–$1.5B research-anchored range** — the new live-data terminal sits inside that envelope.

### MSCI World 2010-07 → 2011-12 gap intentionally not backfilled

The MSCI World index pre-URTH-inception (Jan 2012) is gated behind MSCI Inc's licensed data feed (not free-programmatically accessible). Substituting a different free instrument (e.g. ACWI, which includes ~12% emerging markets) would introduce a ~1-2pp annual return drift for this 19-month window. Decision: keep the 2012-01 data floor; document it explicitly in §6.7. Calculator behavior unchanged — `startYear ∈ {2010, 2011}` for MSCI_WORLD throws `AssetHistoryDataError` per the §6.10 below-data-floor rule, which the UI catches and renders no result panel.

### Spec changes

- §6.7 Asset codes table — added "Data coverage" column; BTC now lists CoinMetrics + Yahoo splice; MSCI_WORLD documents the 2012-01 floor as intentional.
- §6.7 prose — added BTC backfill paragraph (sources, splice validation, range) and MSCI World gap rationale.
- §6.10 (below-data-floor handling) is unchanged — same rule applies to all assets, the table just looks different now (BTC: zero rows error; MSCI_WORLD: 2010, 2011 error).

### Quality gates (post-v1.4)

- 863 tests passing
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors
- All 5 PT gates reproduce exactly against the regenerated vectors (BTC_RECON $261,202, PT1 R$7,336,100, PT2 18.33%, PT3 €608,815, PA1 BRL CAGR 0.0621 — all unchanged because the backfill only added pre-2016 data; all PT gates use 2016+ startYears).
- New BTC 2010 / 2011 / 2012 / 2013 / 2014 scenarios now have real expected outputs instead of error sentinels.

### Files refreshed in this delta

```
docs/tech/audit-bundle/CHANGELOG.md                      (this entry appended)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md       (§6.7 expanded)
docs/tech/audit-bundle/TEST_VECTORS.json                 (BTC pre-2014 scenarios now have outputs)
docs/tech/audit-bundle/data/monthlyPrices.json           (50 months prepended to BTC)
apps/web/src/lib/market-data/data/monthlyPrices.json     (production mirror)
apps/web/scripts/data-fetchers/fetch-btc-coinmetrics.mjs (new — fetcher script)
```

---

## v1.3 — 2026-05-23 (F6 schema landed + Bar re-ack tracking)

**Audience:** future auditors + product-owner re-ack flow.
**Context:** v1.2 closed all consistency drift from v1.1. v1.3 lands the F6 schema split that v1.1/v1.2 deferred, and replaces an inaccurate "Bar has been notified" attestation with explicit re-ack-pending tracking. No new auditor findings.

### F6 — `assetHistory` mode-comparison schema split

The `mode-comparison` scenario in `TEST_VECTORS.json` previously carried `{ amount: 12200 }` covering BOTH the lumpSum leg AND the DCA leg, with a `note` explaining that the DCA leg actually used $100/mo. An auditor passing `amount=12200` uniformly to both legs would produce an incorrect DCA terminal (Auditor 4 F6 finding).

Schema bumped from `tools-test-vectors-v1` → `tools-test-vectors-v2`:

- `mode-comparison` scenario's `input` now carries explicit `lumpSumAmount: 12200` + `dcaAmount: 100` fields (replacing the single `amount` field).
- All other 139 scenarios are byte-identical to v1.2.
- §6.8 Input Contract documents the split.

Auditor 1's v1.0 Python harness (if ever returned) would need to re-key against v2; per cover-note communication, Auditor 1 is no longer in cycle.

### BTC_RECON re-ack tracking

The v1.1 entry stated *"Bar has been notified of the gate update"* without basis. Replaced with explicit tracking: `productTruthGates.BTC_RECON.note` now ends with *"Product-owner (Bar) re-ack pending for the updated point estimate; within originally-accepted $200k–$280k research-anchored envelope."* No code change — only metadata transparency.

### Quality gates (post-v1.3)

- 863 tests passing
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors
- All 5 PT gates reproduce exactly against v2 vectors.

### Files refreshed in this delta

```
docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md      (version bump to 1.3)
docs/tech/audit-bundle/CHANGELOG.md                  (this entry appended)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md   (§6.8 documents compound input)
docs/tech/audit-bundle/TEST_VECTORS.json             (schema v1 → v2; assetHistory_16 input split; BTC_RECON note updated)
apps/web/scripts/tools-stress-test.mjs               (mode-comparison input shape v2)
```

All other bundle artifacts (`GLOSSARY_AND_LIMITATIONS.md`, `REGULATORY_CROSSWALK.md`, `data/`) are byte-identical to v1.2.

---

## v1.2 — 2026-05-23 (consistency clean-up after v1.1 audit)

**Audience:** Auditor 3 (PwC Brazil) and Auditor 4 (independent quantitative reviewer).
**Context:** v1.1 received clean numerical sign-off from both auditors (Auditor 3: 140/140 scenarios + 417/417 fields + 5/5 gates + 56/56 data checks all pass; Auditor 4: F1+F2+F3+F4+F5+A2+A3+A4 all verified fixed, 60/60 invariant combinations clean, core formulas match `numpy_financial` exactly). Auditor 4 also identified 4 self-consistency defects introduced *by the v1.1 fix cycle itself* — places where the bundle now contradicted itself. None changed a tool output; all blocked a clean external audit opinion. This release closes them.

### Closed in v1.2

**N1 — PT2 gate value updated 18.76 → 18.33.** The `productTruthGates.PT2.expectedDeltaPct` in `TEST_VECTORS.json` still hardcoded `18.76` (the pre-F1 value), while the actual `assetHistory_15` vector showed `18.33`. The gate was passing only because the ±2pp tolerance swallowed the 0.43pp gap — green for the wrong reason. The PT2 gate is now `18.33` with a `note` documenting the v1.1 → v1.2 update.

**N2 + N2a — Spec §6.10 rewritten for the post-A2 fallback rule.** §6.10 still described the pre-A2 behavior ("BTC `startYear ∈ {2010…2014}` returns an error from the DCA replay path"), but the A2 fix made the calculator use a data-driven first-month lookup, so BTC `startYear=2014` now correctly falls back to the September 2014 first available month and succeeds with a 141-month DCA window. The spec is rewritten as a single uniform rule — "find the first row whose year matches `startYear`; if any exists, succeed; if not, throw" — with a per-asset behavior table covering all 8 assets × 3 representative start years. `assetHistory_13` (BTC 2010 → error) and `assetHistory_14` (BTC 2014 → success with fallback) now both follow the same documented rule.

**N3 — Math.round inline at §1.6.** F4's rounding rule was in §0.2 universal conventions but not inline at §1.6 where `windowMonths` is defined. §1.6's `windowMonths` formula now reads `min(Math.round(years × 12), M)` directly, with a cross-reference to §0.2 — no more action-at-a-distance.

**F6 caveat — note added to `assetHistory_16` scenario.** The `mode-comparison` scenario still carries `amount: 12200` covering both legs (lump sum $12,200 one-time AND DCA $100/mo × 125 months = $12,500 total). The schema split into separate `lumpSumAmount` + `dcaAmount` fields stays deferred to a future v2 vector format. In the meantime, the scenario now carries an explicit `note` warning auditors not to pass `amount=12200` uniformly to both legs.

### What was NOT changed

The 140-scenario vector set is byte-identical to v1.1 *except for* the PT2 gate value (N1) and the `assetHistory_16.note` field. All per-tool expected outputs reproduce unchanged. Auditor 3's clean PASS result holds for v1.2 without re-execution; only the gate-block validation needs a one-line recheck.

### Quality gates verified (post-v1.2)

- 863 tests passing
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors
- All 5 PT gates reproduce exactly against the regenerated vectors with no tolerance-edge cases.

### Files refreshed in this delta

```
docs/tech/audit-bundle/CHANGELOG.md                  (this entry appended)
docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md      (version bump to 1.2)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md   (§1.6 inline round; §6.10 rewritten)
docs/tech/audit-bundle/TEST_VECTORS.json             (PT2 gate updated; assetHistory_16 note)
```

All other bundle artifacts (`GLOSSARY_AND_LIMITATIONS.md`, `REGULATORY_CROSSWALK.md`, `data/`) are byte-identical to v1.1.

### Asks for re-confirmation (lightweight)

These are 1-line spot-checks, not full re-execution:

**Auditor 3:** confirm `productTruthGates.PT2.expectedDeltaPct === 18.33` in the v1.2 vectors. Nothing else moved.

**Auditor 4:** confirm N1+N2+N2a+N3+F6-note are closed to your satisfaction. All other v1.1 sign-offs hold.

---

## v1.1 — 2026-05-23 (post first-round audit)

**Audience:** Auditor 3 (PwC Brazil) and Auditor 4 (independent quantitative reviewer)
**Context:** Both auditors returned high-quality reports against Bundle v1.0. This release closes the bugs they surfaced and the documentation gaps they identified, then asks for a clean second-round pass.

### What changed in the product

**F1 — Duplicate `ym` rows in `monthlyPrices.json` (Auditor 4, HIGH).**

Yahoo Finance's `interval=1mo` endpoint returns BOTH an aggregated full-month bar AND a partial trailing bar when the query window ends mid-month — both labeled with the same first-of-month `ym`. The Phase B data harvester wrote both verbatim, producing one duplicate row per asset in 7 of 8 assets (DAX was exempt because the partial bar didn't materialize at pull time). The duplicate affected DCA replay output: terminal value was biased slightly high because the partial-bar contribution was counted, and `finalPrice` was the partial-bar close (typically lower magnitude than the proper full-month close).

| Fix | Detail |
|---|---|
| Data | 7 duplicate rows removed from `data/monthlyPrices.json` via dedupe-by-`ym` (first occurrence kept = aggregated row with wider OHLC range). |
| Harvester | `pull-all-assets.mjs` now dedupes by `ym` before writing — future pulls bug-proof. |
| Invariant | Stress-test simulator asserts `len(months) == len(set(ym))` at load time; throws on regression. |
| **Numerical impact** | **BTC_RECON gate value changed from $254,188 → $261,202** (+$7,014, +2.76%). The prior value was biased by the bug; the new value is correct. The change is within Bar's originally-accepted $200k–$280k research-anchored range, so the principle of the sign-off still holds. **Product-owner re-ack pending** for the specific point estimate. Other PT gates unchanged or within tolerance. |

**F2 — Range inversion in `calculateAssetHistoryDcaReplay` (Auditor 4, MEDIUM).**

The DCA replay used adjusted `close` (TR basis) for terminal value AND units-by-close, but raw unadjusted `high` / `low` for `rangeLow` / `rangeHigh`. For the 4 TR-adjusted assets (SP500, QQQ, MSCI_WORLD, TLT), the adjusted close lives in a different numeric scale than the raw intramonth low — confirmed by an in-house follow-up audit which found 571 OHLC anomalies across these 4 assets (146/192 for SP500, 105/192 for QQQ, 134/174 for MSCI_WORLD, 186/192 for TLT) where `close < low` violates the basic OHLC invariant. This is a structural property of dividend-adjusted close vs unadjusted intramonth prices, not a data-quality issue.

**Fix:** scale `high` and `low` into TR space using the per-month adjustment factor `factor_i = close_i / closePriceOnly_i`, then compute the band from `effHigh = high × factor` and `effLow = low × factor`. This is the standard treatment used by Bloomberg / FactSet — the factor is a within-month constant scalar, so `high ≥ close ≥ low` is preserved. For native-TR assets (BTC, GOLD, IBOVESPA, DAX) there is no `closePriceOnly`, factor = 1 implicitly, no change. For `basis='price_only'` mode, all OHLC stays unadjusted, no factor. Documented in §6.11 of the spec.

| Test | Invariant `rangeLow ≤ terminalValue ≤ rangeHigh` now holds across 8 assets × 2 start years × 2 bases (32 combinations). Regression test landed in `calculator.test.ts`. |

**Range comparison for the 4 affected assets (2016 DCA $100/mo, total_return basis):**

| Asset | Pre-F2 range (inverted) | Post-F2 range | Terminal |
|---|---|---|---:|
| SP500 | $26,313 – $28,164 ❌ | $28,926 – $30,948 ✓ | $29,638 |
| QQQ | $37,423 – $40,700 ❌ | $39,099 – $42,511 ✓ | $40,284 |
| MSCI_WORLD | $23,444 – $25,052 ❌ | $25,960 – $27,732 ✓ | $26,621 |
| TLT | $8,864 – $9,387 ❌ | $10,352 – $10,962 ✓ | $10,632 |

### What changed in the documentation

**F3 — Contribution-zero fallback for non-USD horizon-matched depreciation (Auditor 4).**
- §4.7 Emergency Fund: documented `monthlySavings ≤ 0 → estimatedHorizonYears = 5` default.
- §5.7 Time-to-Target (new): documented `contribution ≤ 0 → estimatedHorizonYears = 10` default. Explained the 5-vs-10 asymmetry (Time-to-Target's use case implies a longer saving horizon by construction).

**F4 — Fractional-year-to-month rounding rule (Auditor 4).**
- §0.2 Universal Conventions: added `months = Math.round(years × 12)` rule. Applies to all tools and symmetrically to `deriveHorizonMatchedCAGR`'s `desiredMonths` calculation. Provided worked examples: `5.5 → 66`, `5.49 → 66`, `5.51 → 66`.

**F5 — PA1 gate rename (Auditor 4).**
- Renamed `BRL 16y CAGR` → `BRL full-series CAGR (Jan 2010 → May 2026)` in `TEST_VECTORS.json` and `GLOSSARY_AND_LIMITATIONS.md`. The prior label was ambiguous about endpoint choice (Auditor 4 demonstrated that a literal 16-year window starting May 2010 gives 0.0664, while the full-series 197-month window starting Jan 2010 gives 0.0621 — the ±0.5% tolerance masked the definitional imprecision). The full-series value is what the calculators actually use for any horizon clamped to the available data length.

### Internal follow-up findings (not from external audit, but addressed in this cycle)

The bug-fix cycle prompted an in-house code-blind audit. Two additional implementation gaps were found and fixed; all auditor-visible outputs unchanged or improved.

**A2 — DAX 2010 start month off-by-one.** Asset History calculator hardcoded `startMonthNeeded = 7` for `startYear=2010`. DAX is the only asset whose dataset begins June 2010 (others begin July 2010), so DAX 2010 DCA silently skipped its first available month. Replaced with data-driven `findIndex(year matches)`. DAX 2010 DCA window now includes the June 2010 row.

**A3 — Brazil poupança regime-switch formula not wired to production.** `derivePoupancaRate(selicAnnualPct, trMonthlyPct)` was defined and tested in Phase G but never consumed by any production code path; `bankRates['pt-BR'].savingsCurrent` was a hardcoded literal `6.17`. Now overwritten at module-load time from the formula — single source of truth for the regime-switch rule (Lei nº 12.703/2012 / BCB poupança remuneration). Current Selic = 14.5% → high-regime → `(1.005)^12 − 1 = 6.17%/yr`; matches the prior literal exactly, so no observable change in outputs today. Future Selic changes (specifically, crossing the 8.5% threshold) now auto-propagate.

**A4 — Inconsistent horizon-matched depreciation adoption.** Phase D introduced `resolveHorizonMatchedDepreciation` as the single policy helper; half the calculator surface adopted it. Now migrated `useGoalCardData.ts` (the home-page goal example cards). ComparisonTable's static `annualDepreciation` is preserved with a comment explaining why (its 1-year fixed projection benefits from full-series CAGR stability over a noisy 12-month trailing window — a defensible different precedent for fixed-horizon use cases).

### What's deferred

**F6 — Split `assetHistory_16` input.** Auditor 4 noted the test-vector scenario carries both `{ lumpSumAmount: 12200, dcaAmount: 100 }` collapsed into a single `amount` field, which forces auditor implementations to special-case the parsing. Deferring this to v1.2 because (a) it's a TEST_VECTORS schema change that would require Auditor 1 to re-key their Python harness against v2 schema, and (b) Auditor 1's raw-output request is still open (see §"Asks" below). Will land alongside the v1.2 cycle.

**A7 — Component-layer smoke tests.** Zero automated tests at the calculator-UI layer; all coverage lives at formula/library layer. Deferred to a separate post-launch ticket — real engineering investment (jsdom env, 8 components × baseline render-with-defaults tests). Not load-bearing for audit reproducibility.

**A8 — Hydration-time depreciation flip.** `useMarketData` returns synchronous fallback on SSR / first client render; `monthlySeries.fx` populates after the async `marketDataService.get()` resolves. For horizons where the trailing-window CAGR diverges from the full-series CAGR constant, the rendered FV may visibly shift after hydration. Deferred to a separate architectural ticket. Mitigation options under consideration: pre-warm `marketDataService.get()` during SSR; or render a skeleton until the snapshot is populated.

### Asks for second-round audit

**Auditor 3:** Please confirm:
1. The 18.33% PT2 SP500 2010 TR-vs-price-only delta still reproduces (was 18.76% pre-F1; now within the published ±2pp gate).
2. The $261,202 BTC_RECON gate reproduces under your independent monthly DCA replay.
3. The factor-adjusted OHLC treatment described in §6.11 matches your expected Bloomberg / FactSet methodology.

**Auditor 4:** Please confirm:
1. F1 + F2 fixes match your originally suggested approach (or flag where ours diverges).
2. F3 / F4 / F5 documentation closes your finding scope.
3. F6 deferral is acceptable for this cycle.

### Files refreshed in this delta

```
docs/tech/audit-bundle/CHANGELOG.md                       (this file, new)
docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md           (no change v1.1; v1.2 will bump)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md        (§0.2, §4.7, §5.7 new, §6.9, §6.11 new)
docs/tech/audit-bundle/GLOSSARY_AND_LIMITATIONS.md        (PA1 row rewritten)
docs/tech/audit-bundle/REGULATORY_CROSSWALK.md            (Asset History row: $254k → $261k)
docs/tech/audit-bundle/TEST_VECTORS.json                  (140 scenarios regenerated; PA1 renamed; BTC_RECON gate updated)
docs/tech/audit-bundle/data/monthlyPrices.json            (7 duplicate rows removed)
docs/tech/audit-bundle/data/monthlyFx.json                (unchanged)
docs/tech/audit-bundle/data/monthlyInflation.json         (unchanged)
docs/tech/audit-bundle/data/FALLBACK_MARKET_DATA.json     (unchanged)
```

### Quality gates verified

- 863 tests passing (was 862 — added F2 invariant regression test)
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors
- PT1 / PT2 / PT3 / PA1 / BTC_RECON reproduce within tolerance against the regenerated vectors.
