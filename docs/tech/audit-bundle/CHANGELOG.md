# Audit Bundle Changelog

Re-audit cycles after Bundle v1.0 (2026-05-23). Each entry is a self-contained delta — auditors can read the latest entry and the manifest to re-run.

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
| **Numerical impact** | **BTC_RECON gate value changed from $254,188 → $261,202** (+$7,014, +2.76%). The prior value was biased by the bug; the new value is correct. Other PT gates unchanged or within tolerance. |

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
