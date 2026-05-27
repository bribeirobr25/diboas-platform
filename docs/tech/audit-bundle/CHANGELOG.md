# Audit Bundle Changelog

Re-audit cycles after Bundle v1.0 (2026-05-23). Each entry is a self-contained delta — auditors can read the latest entry and the manifest to re-run.

---

## v1.9 — 2026-05-26 (FX-16 adoption — EUR field-placement fix + 14 new currencies)

**Audience:** Any auditor re-running against the v1.8 baseline. **Schema bumped v2 → v3** — old v2 vectors will not reproduce.

**Driver:** `docs/tools/ADOPTING_NEW_FX_PLAN.md` v1.2 (CTO-board feedback v1.1 folded in) + Bar-signed decision register D1–D14 (committed to `docs/audit/PENDING_ALL.md` 2026-05-26 §2026-05-26 decision register).

### What changed

1. **EUR `annualDepreciation` 0.0123 → 0.0055 (D1).** The 1.23% was an _endpoint-pair retrospective CAGR_ (anchor pair 1.4272 → 1.1706 USD/EUR over ~16.33y) mistakenly placed in the forward-projection field. D1 keeps 1.23% in `historicalCagr` (the correct field) and adopts the model's 0.55% — a forward calibration assumption from FRED `AEXUSEU` long-horizon annual-average behavior — in `annualDepreciation`. A literal "FRED AEXUSEU 2010→2025 annual-average CAGR" computation produces ~1.07%, NOT 0.55%; the calibration framing in the `depreciationBasis` string is locked to "forward annualDepreciation assumption calibrated from long-horizon annual-average FX behavior and projection fit" so auditors recomputing don't flag a 2× mismatch.
2. **`resolveHorizonMatchedDepreciation` priority inverted.** The function now consults the calibrated constant FIRST and falls back to the live monthly-FX horizon-matched CAGR only when the constant is missing. Pre-inversion, live FX won and over-rode EUR's 0.55% with ~1.23% (the very value D1 retires). Inversion's only observable effect is EUR; BRL coincides at 6.21%; 14 new currencies have no monthly FX so were always constant-driven.
3. **14 new currencies in `exchangeRates.rates`.** GBP/CAD/AUD/JPY/INR/MXN/ZAR/KRW/SGD/HKD/AED/ILS/CHF/PLN. Each carries only the 4 required `CurrencyRate` fields (`rateToUsd`, `annualDepreciation`, `rateDate`, `depreciationBasis`). The 5 `historical*` fields are **left absent** — populating `historicalCagr` without the matching anchor pair would produce a malformed `CurrencyRate` and contradict D4. ARS/CLP/COP **excluded** per FX model §5 hyperinflation/multi-regime gate.
4. **`tools-test-vectors-v2` → `v3`.** EUR-bearing scenarios across all 11 tools regenerated from live engine post-D1 priority inversion. 140 scenarios total — non-EUR (and non-BRL-monthly-vs-static-derived) scenarios are byte-identical to v2; the rest move per the corrected forward rate.
5. **PT3 €608,815 → PT3' €541,891.** Bar re-signed 2026-05-26. The €11% drop is purely from the EUR forward rate correction; no model change beyond D1's field-placement fix.

### Files changed

```
docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md       (version + schema bump)
docs/tech/audit-bundle/CHANGELOG.md                   (this entry)
docs/tech/audit-bundle/TEST_VECTORS.json              (schema v2 → v3; PT3 → PT3'; 140 scenarios regenerated)
docs/tech/audit-bundle/data/FALLBACK_MARKET_DATA.json (EUR + 14 new currencies)
docs/tech/audit-bundle/data/FALLBACK_MARKET_DATA_METADATA.json (EUR re-stamped + 14 new last_verified entries)
```

`monthlyFx.json`, `monthlyPrices.json`, `monthlyInflation.json` are **unchanged** in v1.9.

### Verification

- 140 / 140 vectors PASS within per-field tolerance using the live engine post-FX-16 adoption (`node /tmp/verify-audit-bundle.mjs` against regenerated `apps/web/scripts/tools-stress-test-out.json`).
- **967 / 967 tests passing** (was 946 pre-FX-16 → 959 after FX-16 phases 1-7 → **967 after the post-execution audit pass**). Test additions: +13 FX-16 tests in `apps/web/src/lib/currency-depreciation/__tests__/calculator.test.ts` covering negative-FX CHF, peg HKD, no-bank-rate JPY, EUR forward = 0.55%, BRL = 0.0621, `getBankRateForCurrency` null for the 14 new currencies, retrospective D4 gate. Post-audit-pass added +8 priority-inversion regression tests in `apps/web/src/lib/market-data/__tests__/horizonMatchedCagr.test.ts` (`describe('resolveHorizonMatchedDepreciation — FX-16 D1 priority inversion (Bar 2026-05-26)')`) — formula-layer regression guard that pins constant-wins behavior across all 7 hedged consumer tools (compound, retirement, goal-savings, emergency-fund, time-to-target, idle-cash, currency-depreciation).
- `pnpm validate:all` 10/10 turbo tasks ✓; `pnpm check:budget` peak 531 KB within caps; pa11y WCAG2AA 19/19 URLs ✓.

### Decision-register reference

- D1 (B2 closed): EUR forward methodology — verbatim Bar text in `docs/audit/PENDING_ALL.md` §"2026-05-26 decision register".
- D2: PT3' €541,891 Bar-signed.
- D3: Hide bank card for 14 new currencies (no `LOCALE_CURRENCY` mapping).
- D4: Retrospective mode stays BRL/EUR-only (`HistoricalAnchorsData.fxBuckets` is a closed 2-key type).
- D8: Phase F reconciliation (migration-map updated; ARS/CLP/COP removed; 14 new currencies added).
- D9–D14: Q1–Q6 board answers (string-literal union; separate `buckets.ts`; native `<select>`; schema bump; D13(b) no-new-event fallback; 32-combo sampled visual regression).

---

## v1.8 — 2026-05-23 (final v1.4-backfill spec-drift sweep — §6.4 + §5.2 D-1 caught by Auditor 4 v1.7 review)

**Audience:** Auditor 3 (closed cycle in v1.7) and Auditor 4 (flagged remaining blocker in v1.7).
**Context:** v1.7 closed §6.6/§6.9/§6.10/GLOSSARY/assetHistory_14 — Auditor 3 verified closeout (140/140 vectors reproduce, tripwire passes, all three findings genuinely closed). Auditor 4 verified the same findings closed AND caught one remaining drift point I missed: **§6.4 still said "BTC begins September 2014 post-CoinMetrics backfill"** (logically contradictory; pre-backfill data starts September 2014, post-backfill data starts July 2010) and used `BTC startYear=2013 predates September 2014` as the "no row exists" example — both stale post-v1.4. v1.8 closes this. Pure docs; no code, no number changes.

### Closed in v1.8

**Auditor 4 v1.7 blocker — §6.4 startMonth bullet rewritten.**

Previous text:

> `startMonth` = the FIRST AVAILABLE month in `startYear` from the asset's data series … BTC begins September 2014 post-CoinMetrics backfill but the calculator finds the first row…
> If no row exists in `startYear` at all (e.g. BTC `startYear=2013` predates September 2014), the tool throws…

New text:

> `startMonth` = the FIRST AVAILABLE month in `startYear` from the asset's data series … **post v1.4 CoinMetrics backfill**: BTC begins July 2010; DAX begins June 2010; SP500/QQQ/GOLD/TLT/IBOVESPA begin July 2010; MSCI_WORLD begins January 2012 (URTH ETF inception)…
> If no row exists in `startYear` at all (e.g. `MSCI_WORLD` with `startYear ∈ {2010, 2011}` — the only sub-2012 floor remaining post-backfill), the tool throws…

This aligns §6.4 with §6.7 / §6.9 / §6.10 / GLOSSARY which were already correct. The example switches from a stale BTC case to a real MSCI_WORLD case that still throws.

**Bonus catch — §5.2 D-1 in AUDIT_BUNDLE_MANIFEST.md** previously said "Asset History throws for BTC + startYear ≤ 2014 because BTC Yahoo data starts September 2014. The legacy `calculateAssetHistory` path covers BTC 2010 via the research-anchored LOW-confidence range. Tracked as a Phase E sub-PR fix." Now marked **RESOLVED v1.4** with the post-backfill reality: BTC 2010 DCA produces a real $534.5M result inside the legacy envelope; legacy `calculateAssetHistory` is retired for audit scope; MSCI_WORLD is the only remaining sub-2012 floor.

### Auditor 3's optional observation — BTC 2013 vector to pin §6.6 LOW→MEDIUM boundary

Auditor 3 noted §6.6's confidence rule applies cleanly but no vector exercises BTC `startYear ∈ {2011, 2012, 2013}`. Adding a single BTC 2013 vector would pin the LOW→MEDIUM confidence boundary explicitly. **Not adopted in v1.8** (specified-but-untested is acceptable per Auditor 3's framing), but tracked as a future-quality improvement.

### Vectors + data — UNCHANGED from v1.7

`TEST_VECTORS.json` byte-identical to v1.7 (140 scenarios; 5 PT gates; no label change this round). Data files unchanged. All 5 PT gates reproduce (PT1 R$7,336,100 / PT2 18.33% / PT3 €608,815 / PA1 0.0621 / BTC_RECON $261,202).

### Quality gates (post-v1.8)

- 868 tests passing
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors

### Files refreshed in this delta

```
docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md   (version bump to 1.8 + §5.2 D-1 marked RESOLVED v1.4)
docs/tech/audit-bundle/CHANGELOG.md               (this entry)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md (§6.4 startMonth bullet rewritten)
```

All other v1.7 artifacts byte-identical to v1.7.

### Process observation (extending Auditor 4's v1.6 → v1.7 push-back)

Auditor 4's v1.6 push-back said "for any release that touches data or adds a code path, full re-run is the audit; targeted is a spot-check." v1.7 was supposed to be the audit gate for the v1.4 backfill drift — and it was, mostly. The §6.4 miss reveals a sub-pattern: when fixing related-but-distinct sections (§6.6, §6.9, §6.10, GLOSSARY were all "BTC pre-2014 behavior") an exhaustive grep for the underlying stale-string ("September 2014") was the correct discipline. I patched the sections I knew about and didn't grep for the underlying claim. v1.8 closed by running `grep -nE "September 2014|Sept 2014|predates September" docs/tech/audit-bundle/*.md` — should have been step zero of v1.7.

For v1.9+ if any release: grep first, then patch.

---

## v1.7 — 2026-05-23 (closes v1.4 BTC-backfill spec drift caught by Auditor 3 + 4 v1.6 review)

**Audience:** Auditor 3 (PwC) and Auditor 4 (clean-room) + future auditors.
**Context:** Auditors 3 and 4 each returned independent clean-cycle reviews of v1.6. Both validated the math fully (140/140 vectors, 5/5 PT gates, cross-currency reproduction, BTC backfill splice integrity, F2 invariant under cross-currency). Both also caught the same class of issue: **v1.4's BTC backfill silently invalidated three spec sections (§6.6 / §6.9 / §6.10) and the GLOSSARY's §4.2.4 limitations text, and the v1.6 docs-audit closed only the v1.5 gaps without noticing the older v1.4 drift.** Auditor 4 noted §6.10 was _specifically_ rewritten in v1.2 to fix N2, then silently un-fixed by v1.4. This release closes those drift points. **No math change, no number change** — every finding is spec-vs-implementation contradiction that the data + vectors already had correct.

### Closed in v1.7

**G1 (HIGH, Auditor 4) + Auditor 3 HIGH — §6.10 + §6.9 + GLOSSARY §4.2.4 rewritten for post-v1.4 BTC reality.**

- **§6.10 worked table** previously said "BTC startYear=2010 → error" and "BTC startYear=2014 → success — falls back to 2014-09." Post-backfill the truth is: BTC `startYear=2010` SUCCEEDS (191 months from 2010-07-01, terminal $534,529,757, LOW confidence); BTC `startYear=2014` starts at 2014-01-01 with 149 months (no fallback to Sept). Table rewritten with a `startYear=2011` column added for completeness; closing paragraph updated to describe what `assetHistory_13` and `_14` actually encode.
- **§6.9 verifiable-outputs** previously listed "BTC 2010 DCA (data not in monthly series) → error or fallback". Replaced with two real rows showing BTC 2010 ($534,529,757; range; LOW; 191 months) and BTC 2014 ($811,847; range; MEDIUM; 149 months; startYm 2014-01-01).
- **§6.10 banner** now reads "rewritten v1.2 per Auditor 4 N2; rewritten again v1.7 per Auditor 4 G1" — the rule is unchanged from v1.2; only the BTC-specific worked table and closing paragraph changed when the data range expanded.
- **GLOSSARY §4.2.4 stale claims** ("BTC data floor at September 2014"; "legacy LOW-confidence range branch"; "does NOT FX-convert (Phase F.2 future improvement)") all rewritten for post-v1.4/v1.5 reality. Per-asset data floors enumerated; cross-currency math explained.
- **Legacy `calculateAssetHistory` anchor-table path** noted as retired-for-audit-scope (still in code for backwards compat but not exercised by the DCA replay path post-v1.4).

**G2 (MEDIUM, Auditor 4) — §6.6 confidence stratification clarified.**

§6.6 previously said "BTC startYear ≤ 2012 → LOW (display as RANGE only, **no single terminal number**)" — but `assetHistory_13` emits `confidence: 'LOW'` AND a populated `terminalValue: 534529757`. Pre-v1.4 this was moot (BTC 2010 errored); v1.4 made it a real computable scenario and surfaced the latent contradiction. Section now explicitly distinguishes: the **calculator always returns the full output shape** (including `terminalValue` for LOW); the **UI layer** uses the `confidence` label to suppress the central number for LOW and render the range only. Auditor implementations must reproduce the full shape; the suppression is render-layer.

**G3 (LOW, Auditor 4) — `basis` output field defined in §6.8.**

§6.8 previously documented only input fields. The `basis` output field (and all other output fields — `terminalValue` / `rangeLow` / `rangeHigh` / `months` / `totalContributed` / `confidence` / `startYm` / `endYm` / `displayCurrency`) is now explicitly defined. `basis` is an echo of the `returnsBasis` input — confirms which mode was requested. NOT a statement about whether the asset's data series has dividends (BTC's underlying data is price-only since BTC has no dividends, but the calculator still echoes `basis: 'total_return'` because that's the requested input mode; the two modes produce identical results for BTC since there are no dividends to reinvest).

**A3 LOW — `assetHistory_14` scenario label corrected.**

Label was "BTC 2014 DCA $100/mo (Sep 2014 first available BTC month)" — pre-backfill phrasing. Now reads "BTC 2014 DCA $100/mo (starts 2014-01 post-v1.4 CoinMetrics backfill)". `TEST_VECTORS.json` regenerated. Output unchanged ($811,847 / 149 months / startYm 2014-01-01).

### Process note (per Auditor 4's recommendation)

Auditor 4 explicitly pushed back on the v1.6 cover note's "you do NOT need to re-execute the full harness" framing:

> _"That instruction, had I followed it, would have missed G1 entirely. Every round of this audit, the material finding has come from the full run, not the targeted subset (round 1: F1 hidden in vectors; round 2: N1/N2; round 3: G1). Spec drift by definition lives in the parts the changelog doesn't flag."_

**He's right.** v1.7+ cover notes should drop the "full re-run optional" framing. For any release that touches data or adds a code path, the full clean-room re-execution IS the audit; a targeted pass is a spot-check. The PT gates are not where bugs live — by construction.

### Quality gates (post-v1.7)

- 868 tests passing (unchanged from v1.6)
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors
- All 5 PT gates reproduce exactly (PT1 R$7,336,100 / PT2 18.33% / PT3 €608,815 / PA1 0.0621 / BTC_RECON $261,202) — **byte-identical to v1.6**
- All 140 v2-schema vectors reproduce — **byte-identical to v1.6** except `assetHistory_14.label` text (data unchanged)

### Files refreshed in this delta

```
docs/tech/audit-bundle/CHANGELOG.md                       (this entry)
docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md           (version bump to 1.7)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md        (§6.6 LOW clarification; §6.8 output fields; §6.9 BTC rows; §6.10 BTC table rewrite)
docs/tech/audit-bundle/GLOSSARY_AND_LIMITATIONS.md        (§4.2.4 data-floor + cross-currency text)
docs/tech/audit-bundle/TEST_VECTORS.json                  (assetHistory_14 label only; output data unchanged)
apps/web/scripts/tools-stress-test.mjs                    (assetHistory_14 label only)
```

REGULATORY_CROSSWALK.md unchanged from v1.6. All data/\*.json files byte-identical to v1.5+.

### Release-chain attestation note

Per Auditor 4's "Observation — not a finding": v1.2-v1.5 were never submitted as discrete bundles to either auditor for independent validation. Only v1.0, v1.1, v1.6 (now v1.7) had formal audit gates. For a pre-launch educational tool this is acceptable; if diBoaS ever needs a defensible release-history attestation (regulator, acquirer, due-diligence buyer), each numerically-material release should get at least a targeted re-execution gate. Worth one line in the project record now.

---

## v1.6 — 2026-05-23 (spec gaps closed — internal docs audit found v1.5 work in code but not in auditor-facing spec)

**Audience:** future auditors implementing strictly from the spec.
**Context:** post-v1.5 internal docs audit identified 5 places where the cross-currency Asset History work (landed in v1.5) was present in code + CHANGELOG + TEST_VECTORS but missing from the FUNCTIONAL_SPECIFICATION / REGULATORY_CROSSWALK / GLOSSARY. An auditor implementing strictly from v1.5 would have correctly reported the locale-specific scenarios as failing (their from-spec implementation would produce single-currency USD math, not the cross-currency BRL/EUR math). This release closes those 5 gaps. **No code changes; no number changes** (except correcting one stale R$1,270,941 → R$1,842,885 in REGULATORY_CROSSWALK).

### Closed in v1.6

**Spec §6.4 (Lump Sum Outcome contract) — cross-currency math added.** Now describes both the single-currency case (`displayCurrency` = asset-native; original formula) AND the cross-currency case (`displayCurrency` ≠ asset-native; FX conversion at start month + end month with `fxLookup` semantics). Also fixed the stale `startMonth = July for 2010 / January otherwise` rule — replaced with "first available month in `startYear`" per the A2 fix (DAX begins June 2010; spec §6.10 has the correct per-asset table).

**Spec §6.5 (Monthly DCA Outcome contract) — cross-currency math added.** Mathematical formula updated to include the per-month FX factor `α_m = fxLookup(displayCurrency → assetCcy, ym_m)` and the end-month back-conversion `fxBack = fxLookup(assetCcy → displayCurrency, ym_M)`. Single-currency case reduces to the original formula (when both factors = 1). Range formulas (`rangeHigh`/`rangeLow`) updated similarly; cross-references §6.11 for the basis-consistent `effHigh`/`effLow` factor-adjustment.

**Spec §6.8 (Input Contract) — `displayCurrency` field added.** New optional enum field (`USD` | `BRL` | `EUR`; default `USD`); per-locale defaults (en → USD, pt-BR → BRL, es/de → EUR) documented. Paragraph below the table explains the semantics (single-currency vs cross-currency), the cross-rate composition via USD pivot, and the forward-fill behavior at end-of-window gaps.

**REGULATORY_CROSSWALK pt-BR Asset History row — value refreshed.** Was "R$1.27M default" (pre-v1.5 USD-with-BRL-symbol rendering); now **R$1,842,885** (post-v1.5 path-dependent FX cross-currency math). Both values are within Bar's originally-accepted research range, but the R$1,842,885 is the correct path-dependent FX result and is what users now see in production. CVM disclosure substantiation review aligned with the live UI value.

**GLOSSARY — 5 new definitions added.** Entries for `displayCurrency`, `ASSET_NATIVE_CURRENCY`, "cross-currency math", "monthly-precision FX path", and "FX forward-fill". Each cites the source file (`lib/asset-history/calculator.ts`) and cross-references the spec section that uses the term.

### Vectors + data — UNCHANGED from v1.5

All 140 scenarios in `TEST_VECTORS.json` reproduce exactly as v1.5. All 5 PT gates unchanged (PT1 R$7,336,100 / PT2 18.33% / PT3 €608,815 / PA1 0.0621 / BTC_RECON $261,202). Data files (`monthlyPrices.json` / `monthlyFx.json` / `monthlyInflation.json`) byte-identical to v1.5.

### Quality gates (post-v1.6)

- 868 tests passing
- TypeScript strict-mode clean
- ESLint 0 warnings / 0 errors
- All 5 PT gates reproduce exactly against the v1.5 vector set (unchanged)

### Asks for re-confirmation

These are spec-only updates — no math change, no vector regeneration, no PT-gate movement. Auditors do NOT need to re-execute their harnesses. The asks are:

**Auditor 3:** confirm §6.4/§6.5 cross-currency math matches what your independent implementation produces for pt-BR/es/de Asset History scenarios in v1.5. (If your v1.5 implementation didn't already cover cross-currency, this v1.6 spec update is the contract you should now implement against.)

**Auditor 4:** confirm the 5 gap-closures address the internal-audit findings. The R$1,842,885 vs prior R$1,270,941 difference in REGULATORY_CROSSWALK is intentional (post-v1.5 value).

### Files refreshed in this delta

```
docs/tech/audit-bundle/CHANGELOG.md                       (this entry)
docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md           (version bump to 1.6)
docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md        (§6.4 cross-currency + startMonth fix; §6.5 cross-currency; §6.8 displayCurrency)
docs/tech/audit-bundle/REGULATORY_CROSSWALK.md            (pt-BR Asset History row value refresh)
docs/tech/audit-bundle/GLOSSARY_AND_LIMITATIONS.md        (5 new definitions)
```

All other v1.5 artifacts (`TEST_VECTORS.json`, `data/`) are byte-identical to v1.5.

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

| Native USD                             | Native BRL | Native EUR |
| -------------------------------------- | ---------- | ---------- |
| BTC, SP500, QQQ, MSCI_WORLD, GOLD, TLT | IBOVESPA   | DAX        |

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

The v1.1 entry stated _"Bar has been notified of the gate update"_ without basis. Replaced with explicit tracking: `productTruthGates.BTC_RECON.note` now ends with _"Product-owner (Bar) re-ack pending for the updated point estimate; within originally-accepted $200k–$280k research-anchored envelope."_ No code change — only metadata transparency.

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
**Context:** v1.1 received clean numerical sign-off from both auditors (Auditor 3: 140/140 scenarios + 417/417 fields + 5/5 gates + 56/56 data checks all pass; Auditor 4: F1+F2+F3+F4+F5+A2+A3+A4 all verified fixed, 60/60 invariant combinations clean, core formulas match `numpy_financial` exactly). Auditor 4 also identified 4 self-consistency defects introduced _by the v1.1 fix cycle itself_ — places where the bundle now contradicted itself. None changed a tool output; all blocked a clean external audit opinion. This release closes them.

### Closed in v1.2

**N1 — PT2 gate value updated 18.76 → 18.33.** The `productTruthGates.PT2.expectedDeltaPct` in `TEST_VECTORS.json` still hardcoded `18.76` (the pre-F1 value), while the actual `assetHistory_15` vector showed `18.33`. The gate was passing only because the ±2pp tolerance swallowed the 0.43pp gap — green for the wrong reason. The PT2 gate is now `18.33` with a `note` documenting the v1.1 → v1.2 update.

**N2 + N2a — Spec §6.10 rewritten for the post-A2 fallback rule.** §6.10 still described the pre-A2 behavior ("BTC `startYear ∈ {2010…2014}` returns an error from the DCA replay path"), but the A2 fix made the calculator use a data-driven first-month lookup, so BTC `startYear=2014` now correctly falls back to the September 2014 first available month and succeeds with a 141-month DCA window. The spec is rewritten as a single uniform rule — "find the first row whose year matches `startYear`; if any exists, succeed; if not, throw" — with a per-asset behavior table covering all 8 assets × 3 representative start years. `assetHistory_13` (BTC 2010 → error) and `assetHistory_14` (BTC 2014 → success with fallback) now both follow the same documented rule.

**N3 — Math.round inline at §1.6.** F4's rounding rule was in §0.2 universal conventions but not inline at §1.6 where `windowMonths` is defined. §1.6's `windowMonths` formula now reads `min(Math.round(years × 12), M)` directly, with a cross-reference to §0.2 — no more action-at-a-distance.

**F6 caveat — note added to `assetHistory_16` scenario.** The `mode-comparison` scenario still carries `amount: 12200` covering both legs (lump sum $12,200 one-time AND DCA $100/mo × 125 months = $12,500 total). The schema split into separate `lumpSumAmount` + `dcaAmount` fields stays deferred to a future v2 vector format. In the meantime, the scenario now carries an explicit `note` warning auditors not to pass `amount=12200` uniformly to both legs.

### What was NOT changed

The 140-scenario vector set is byte-identical to v1.1 _except for_ the PT2 gate value (N1) and the `assetHistory_16.note` field. All per-tool expected outputs reproduce unchanged. Auditor 3's clean PASS result holds for v1.2 without re-execution; only the gate-block validation needs a one-line recheck.

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

| Fix                  | Detail                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data                 | 7 duplicate rows removed from `data/monthlyPrices.json` via dedupe-by-`ym` (first occurrence kept = aggregated row with wider OHLC range).                                                                                                                                                                                                                                                      |
| Harvester            | `pull-all-assets.mjs` now dedupes by `ym` before writing — future pulls bug-proof.                                                                                                                                                                                                                                                                                                              |
| Invariant            | Stress-test simulator asserts `len(months) == len(set(ym))` at load time; throws on regression.                                                                                                                                                                                                                                                                                                 |
| **Numerical impact** | **BTC_RECON gate value changed from $254,188 → $261,202** (+$7,014, +2.76%). The prior value was biased by the bug; the new value is correct. The change is within Bar's originally-accepted $200k–$280k research-anchored range, so the principle of the sign-off still holds. **Product-owner re-ack pending** for the specific point estimate. Other PT gates unchanged or within tolerance. |

**F2 — Range inversion in `calculateAssetHistoryDcaReplay` (Auditor 4, MEDIUM).**

The DCA replay used adjusted `close` (TR basis) for terminal value AND units-by-close, but raw unadjusted `high` / `low` for `rangeLow` / `rangeHigh`. For the 4 TR-adjusted assets (SP500, QQQ, MSCI_WORLD, TLT), the adjusted close lives in a different numeric scale than the raw intramonth low — confirmed by an in-house follow-up audit which found 571 OHLC anomalies across these 4 assets (146/192 for SP500, 105/192 for QQQ, 134/174 for MSCI_WORLD, 186/192 for TLT) where `close < low` violates the basic OHLC invariant. This is a structural property of dividend-adjusted close vs unadjusted intramonth prices, not a data-quality issue.

**Fix:** scale `high` and `low` into TR space using the per-month adjustment factor `factor_i = close_i / closePriceOnly_i`, then compute the band from `effHigh = high × factor` and `effLow = low × factor`. This is the standard treatment used by Bloomberg / FactSet — the factor is a within-month constant scalar, so `high ≥ close ≥ low` is preserved. For native-TR assets (BTC, GOLD, IBOVESPA, DAX) there is no `closePriceOnly`, factor = 1 implicitly, no change. For `basis='price_only'` mode, all OHLC stays unadjusted, no factor. Documented in §6.11 of the spec.

| Test | Invariant `rangeLow ≤ terminalValue ≤ rangeHigh` now holds across 8 assets × 2 start years × 2 bases (32 combinations). Regression test landed in `calculator.test.ts`. |

**Range comparison for the 4 affected assets (2016 DCA $100/mo, total_return basis):**

| Asset      | Pre-F2 range (inverted) | Post-F2 range       | Terminal |
| ---------- | ----------------------- | ------------------- | -------: |
| SP500      | $26,313 – $28,164 ❌    | $28,926 – $30,948 ✓ |  $29,638 |
| QQQ        | $37,423 – $40,700 ❌    | $39,099 – $42,511 ✓ |  $40,284 |
| MSCI_WORLD | $23,444 – $25,052 ❌    | $25,960 – $27,732 ✓ |  $26,621 |
| TLT        | $8,864 – $9,387 ❌      | $10,352 – $10,962 ✓ |  $10,632 |

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
