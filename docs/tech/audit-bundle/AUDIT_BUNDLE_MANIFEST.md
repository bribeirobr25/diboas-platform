# Tools Suite — External Audit Bundle Manifest

**Document version:** 1.9 (2026-05-26 — FX-16 adoption: EUR `annualDepreciation` 0.0123 → 0.0055 per Bar 2026-05-26 D1 field-placement fix; 14 new currencies added to `exchangeRates.rates` (GBP/CAD/AUD/JPY/INR/MXN/ZAR/KRW/SGD/HKD/AED/ILS/CHF/PLN); `resolveHorizonMatchedDepreciation` priority inverted to constant-wins; PT3 €608,815 → PT3' €541,891 re-signed; vectors regenerated; schema bump v2 → v3. See CHANGELOG v1.9 entry.)
**Audit scope:** All 10 calculators at `https://diboas.com/{locale}/tools` + 1 supporting formula (Brazil poupança regime switch).
**Locales in scope:** `en` (US), `pt-BR` (Brazil), `es` (Spain), `de` (Germany).
**Test-vector schema:** `tools-test-vectors-v3` (bumped from v2 in v1.9 per FX-16 D12 — EUR-bearing scenarios regenerated from live engine post-D1).
**Code snapshot:** Pre-commit at the audit cycle's working tree (see §6 for file inventory).
**Audit entry point:** this document. Read it first, then `CHANGELOG.md` for the version delta you need, then follow the file references in numbered order.

**For re-auditors of v1.8:** read `CHANGELOG.md` entry "v1.9" — schema v2 → v3 (FX-16 adoption; EUR scenarios regenerated; PT3' supersedes PT3). 14 new `exchangeRates.rates.*` entries added (no `historical*` fields populated — forward-only).
**For re-auditors of v1.2:** read `CHANGELOG.md` entry "v1.3" — schema v1 → v2 (assetHistory_16 input now carries `lumpSumAmount` + `dcaAmount` instead of single `amount`). 139 of 140 scenarios byte-identical to v1.2. BTC_RECON metadata clarified to track product-owner re-ack as pending.

**For re-auditors of v1.0/v1.1:** read `CHANGELOG.md` entries cumulatively. F1 / F2 bugs fixed; F3 / F4 / F5 documentation gaps closed; F6 landed in v1.3 with v2 schema; N1 / N2 / N3 v1.1 consistency drift closed; BTC_RECON gate value updated from $254,188 → $261,202.

---

## 1. What this bundle contains

A formal, reproducible audit trail for the diBoaS tools suite covering: (a) the financial formulas the tools implement, (b) the input data the tools consume, (c) the test scenarios that validate them, (d) the regulatory disclosures that govern them, and (e) the decision history (including Bar's product-truth sign-offs).

The bundle is designed for an external auditor to independently:

1. Verify each formula matches a published reference (textbook, regulatory standard, or `numpy_financial`).
2. Verify the input data values match authoritative sources (FDIC, BCB, ECB, BLS, IBGE, Eurostat, etc.) as of the audit snapshot date.
3. Re-run the calculation against the same inputs and confirm the outputs reproduce.
4. Verify the regulatory disclosures (TILA Reg DD / MiCA / CVM / FTC) are present and adequate per locale.
5. Inspect the decision-history to confirm the magnitudes shown to users are explicitly accepted by the product owner.

## 2. Audit-bundle inventory

### Tier A — Direct audit deliverables (this directory)

| #   | Document                                             | Purpose                                                                                                                                                                                    | Status     |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| A1  | `docs/tech/TOOLS_VALIDATION.md`                      | Per-tool spec with formula prose + 140 test scenarios (internal validation report)                                                                                                         | ✅ shipped |
| A2  | `docs/tech/audit-bundle/AUDIT_BUNDLE_MANIFEST.md`    | This document — auditor entry point                                                                                                                                                        | ✅ shipped |
| A3  | `docs/tech/audit-bundle/FUNCTIONAL_SPECIFICATION.md` | **Outcome-level specification** — describes what each tool computes mathematically without prescribing algorithm. Enables code-blind black-box audit.                                      | ✅ shipped |
| A4  | `docs/tech/audit-bundle/REGULATORY_CROSSWALK.md`     | Per-tool × per-locale × per-regulation disclosure matrix                                                                                                                                   | ✅ shipped |
| A5  | `docs/tech/audit-bundle/TEST_VECTORS.json`           | Machine-readable 140 scenarios with input + expectedOutput + per-field tolerances. Auditor automation target.                                                                              | ✅ shipped |
| A6  | `docs/tech/audit-bundle/data/`                       | Bundled raw data (FALLBACK_MARKET_DATA.json, monthlyPrices.json, monthlyFx.json, monthlyInflation.json, FALLBACK_MARKET_DATA_METADATA.json). Frozen at audit snapshot for reproducibility. | ✅ shipped |
| A9  | `docs/tech/audit-bundle/GLOSSARY_AND_LIMITATIONS.md` | diBoaS-specific terms, financial-terminology, explicit "tools do NOT claim X" statements                                                                                                   | ✅ shipped |

### Tier B — Existing reference documents (re-used)

| #   | Document                             | What an auditor verifies                                                 | Path                                                                          |
| --- | ------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| B1  | Coding-standards reference           | The 12 Principles of Excellence the engineering follows                  | `docs/tech/coding-standards.md`                                               |
| B2  | Financial-calculations canonical doc | The math model with formulas, currency-hedge derivation, bug history     | `docs/tech/financial-calculations.md`                                         |
| B3  | iter-5 SDK migration map             | Field-by-field source attribution (Hardcoded / Provider-driven / Hybrid) | `docs/tech/iter5-sdk-migration-map.md`                                        |
| B4  | Security standards                   | Input validation, rate limiting, secrets policy                          | `docs/tech/security.md`                                                       |
| B5  | Internationalization                 | 4-locale parity contract                                                 | `docs/tech/internationalization.md`                                           |
| B6  | diBoaS-analytics integration note    | Scoped contract for Provider-driven fields the SDK will populate         | `docs/integrations/diboas-analytics-tools-data-note.md`                       |
| B7  | Tools data weekly runbook            | Steady-state operating model for the Hardcoded subset (monthlySeries.\*) | `docs/integrations/tools-data-weekly-runbook.md`                              |
| B8  | Validation + regression report       | 14-page Docker MCP visual sweep evidence                                 | `docs/audit/TOOLS_IMPROVEMENT_VALIDATION_2026-05-23.md` (local-only — see §6) |

### Tier C — Reproducible artifacts

| #   | Artifact                | What it does                                                                                                                                                  | Path                                                                                 |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| C1  | Stress-test simulator   | Reproduces all 140 scenarios; run with `node apps/web/scripts/tools-stress-test.mjs`; outputs to JSON                                                         | `apps/web/scripts/tools-stress-test.mjs` (700+ lines) + `tools-stress-test-out.json` |
| C2  | Production simulator    | Reproduces 25 prod default-vector outputs incl. PT1/PT3 acceptance numbers                                                                                    | `apps/web/scripts/tools-simulator.mjs` + `tools-simulator-out.json`                  |
| C3  | B2B card-fee derivation | Derives the 8 tombstoned numbers shown on `/business`; re-run after rate change                                                                               | `scripts/derive-b2b-card-numbers.mjs`                                                |
| C4  | Unit-test suite         | 967 tests covering formulas + calculator components + i18n parity (v1.9: 862 → 868 → 946 → 959 → 967 across audit cycles; +21 in FX-16 adoption + audit pass) | `apps/web/src/**/__tests__/*.test.ts` (64 test files)                                |

### Tier D — Source data files (the inputs)

| #   | Data file                      | Contents                                                                                                        | Path                                                            |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| D1  | FALLBACK_MARKET_DATA constants | 20+ fields: bank rates, scenario rates, inflation, FX, asset prices, platform fees                              | `apps/web/src/lib/market-data/constants.ts`                     |
| D2  | FALLBACK_MARKET_DATA_METADATA  | Per-field `last_verified` ISO timestamp + source attribution string                                             | Same file as D1, named export                                   |
| D3  | Monthly asset prices           | 8 assets × ~142-192 months OHLC + closePriceOnly for SP500/QQQ/MSCI/TLT (PT2 toggle)                            | `apps/web/src/lib/market-data/data/monthlyPrices.json` (210 KB) |
| D4  | Monthly FX                     | 8 of 12 currencies × ~191 months (BCB PTAX for BRL; ECB EXR for 7 others; ARS/CLP/COP pending)                  | `apps/web/src/lib/market-data/data/monthlyFx.json` (195 KB)     |
| D5  | Monthly inflation              | 12 locales/currencies stub (Phase B.3 incremental; calculators currently use `.current`/`.average5y` constants) | `apps/web/src/lib/market-data/data/monthlyInflation.json`       |

### Tier E — Calculator engine code

| #   | File                           | Engine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Path                                                                                                                                                                              |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Core formulas                  | `calculateLumpSum`, `calculateMonthlyContributions`, `monthsToInflationAdjustedTarget`, `purchasingPower`, `selectInflationRate`, `calculateFee`, `applyPlatformFees`                                                                                                                                                                                                                                                                                                                                                               | `apps/web/src/lib/market-data/formulas/core.ts`                                                                                                                                   |
| E2  | Currency hedge                 | `calculateWithCurrencyHedge`, `calculateMonthlyWithCurrencyHedge`, `calculateMonthlyPathDependentHedge`                                                                                                                                                                                                                                                                                                                                                                                                                             | `apps/web/src/lib/market-data/formulas/currencyHedge.ts`                                                                                                                          |
| E3  | Horizon-matched CAGR           | `deriveHorizonMatchedCAGR`, `resolveHorizonMatchedDepreciation` (Phase D, 2026-05-23)                                                                                                                                                                                                                                                                                                                                                                                                                                               | `apps/web/src/lib/market-data/formulas/horizonMatchedCagr.ts`                                                                                                                     |
| E4  | Brazil poupança                | `derivePoupancaRate` + `BRAZIL_POUPANCA_SELIC_THRESHOLD` (Phase G, 2026-05-23)                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `apps/web/src/lib/market-data/formulas/brazilPoupanca.ts`                                                                                                                         |
| E5  | Compound projection (hedged)   | `calculateCompoundProjectionHedged` (the tools engine; lesson uses non-hedged variant per R1 discipline)                                                                                                                                                                                                                                                                                                                                                                                                                            | `apps/web/src/lib/compound-interest/calculatorHedged.ts`                                                                                                                          |
| E6  | Asset history                  | `calculateAssetHistoryDcaReplay`, `calculateAssetHistoryLumpSum` (legacy `calculateAssetHistory` deleted 2026-05-26 per C19 close — `TOOLS_41_DEFECTS_FIX_PLAN.md` §2.7)                                                                                                                                                                                                                                                                                                                                                            | `apps/web/src/lib/asset-history/calculator.ts`                                                                                                                                    |
| E7  | Card fee model                 | `projectCardFeeSavings`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `apps/web/src/lib/business/cardFees.ts`                                                                                                                                           |
| E8  | Per-tool calculator components | UI + state management for each of the 10 tools. **Note (2026-05-26):** composition math previously inlined in 5 components (emergency-fund, time-to-target, inflation-impact, currency-depreciation, idle-cash) was extracted to `apps/web/src/lib/<tool>/calculator.ts` orchestrators. Canonical math (E1–E7) is unchanged — the orchestrators consume `MarketDataSnapshot` and call into E1–E7. Bundle test vectors still pass because they fixture inputs and verify E1–E7 outputs; the extraction is transparent to the bundle. | `apps/web/src/components/Sections/{ToolName}Calculator/*.tsx` + `apps/web/src/lib/{emergency-fund,time-to-target,inflation-impact,currency-depreciation,idle-cash}/calculator.ts` |

### Tier F — Decision history (extracted from local-only docs)

| #   | Document                               | What it proves to auditor                                                                                             | Path                                                               |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| F1  | TOOLS_IMPROVEMENT.md decision register | All product-truth sign-offs by Bar (PT1 R$7.34M, PT2 toggle, PT3 €608k, PA1 go/no-go, BTC-RECON $217k reconciliation) | `docs/audit/TOOLS_IMPROVEMENT.md` (local-only; see §6)             |
| F2  | TOOLS_IMPROVEMENT_REVIEW_2026-05-23.md | CTO Board review of the plan with 14 findings adopted                                                                 | `docs/audit/TOOLS_IMPROVEMENT_REVIEW_2026-05-23.md` (local-only)   |
| F3  | MoneyTools_LiveData_Consolidated.md    | Source-API registry + per-locale live-data validation + Phase A FX CAGR addendum + BTC reconciliation evidence        | `docs/researches/MoneyTools_LiveData_Consolidated.md` (local-only) |

## 3. How the auditor should read this bundle

### For code-blind black-box audit (high-precision result reproduction without seeing diBoaS code)

The combination of **A3 (FUNCTIONAL_SPECIFICATION.md) + A5 (TEST_VECTORS.json) + A6 (data files) + A9 (GLOSSARY_AND_LIMITATIONS.md)** is designed to be self-sufficient. An auditor following the procedure below can implement each tool from first principles in any language and validate convergence.

**Day 1 — orientation**

1. Read **A2 (this manifest)** end-to-end.
2. Read **A9 (`GLOSSARY_AND_LIMITATIONS.md`)** to understand the domain language and explicit non-claims.
3. Read **A3 (`FUNCTIONAL_SPECIFICATION.md`)** §0 (universal conventions) carefully. Note timing, rounding, and sign conventions.

**Day 2 — implementation**

4. Pick a language (Python with numpy/pandas, Excel, R, Julia — auditor's choice).
5. For each tool, read its A3 outcome contract (§X.4). Implement using your preferred formula choice.
6. Load **A6 data files** into your implementation. Do not re-pull from upstream — the snapshot is frozen.

**Day 3 — automated comparison**

7. Run your implementation against **A5 `TEST_VECTORS.json`**: for each scenario, feed `input` into your implementation, compare your output against `expectedOutput` using `tolerance`.
8. Special attention to the `productTruthGates` block at the top of A5: PT1, PT2, PT3, PA1, BTC_RECON. These are Bar-signed magnitudes that must reproduce exactly.

**Day 4 — divergence investigation (if any)**

9. For each test vector exceeding tolerance: identify which input + which output diverges. Re-read the relevant A3 §X.4 contract. Check whether your formula matches the **outcome convention** (timing, sign, compounding frequency) even if the algorithm differs.
10. Report unresolvable divergences as findings.

**Day 5 (optional) — regulatory + provenance**

11. Read **A4 (`REGULATORY_CROSSWALK.md`)** for per-jurisdiction disclosure matrix.
12. Cross-check `FALLBACK_MARKET_DATA_METADATA.json` (in A6) against the cited authoritative sources (FDIC, BCB SGS, ECB MIR, BLS, IBGE, Eurostat, Destatis) for any 3-5 randomly-sampled fields.
13. Submit audit opinion.

### For internal / sanity audit (code access permitted)

If the auditor has read access to the diBoaS codebase, they can also reference Tier B (existing docs), Tier C (reproducible scripts), Tier E (implementation code) for cross-verification. This is a faster path but less independent. See the original "Day 1-7" procedure below.

### Legacy reading order (with code access)

1. Read **A2 (this manifest)** end-to-end.
2. Read **A9 (`GLOSSARY_AND_LIMITATIONS.md`)** to understand diBoaS-specific terminology and explicit non-claims.
3. Skim **A1 (`TOOLS_VALIDATION.md`)** §1–§2 (methodology, system-wide input data tables) and §13–§14 (reproducibility + validation gates).

### Day 2-3 — formula verification

4. Open **A1** per-tool sections (§1–§11). For each tool, the formula is described in §X.4 with prose math.
5. Open the matching **Tier E** code file. Verify the prose math matches the TypeScript implementation literally.
6. Open the matching **Tier C** unit-test file (`apps/web/src/**/__tests__/*.test.ts`). Verify the assertions match published references (e.g., `calculateLumpSum(1000, 0.10, 1) === 1100`).
7. Independent reference cross-check: implement each formula in `numpy_financial` or Excel; spot-check 3-5 representative inputs per tool. The unit tests already include this for the compound family.

### Day 4 — data verification

8. Read **A1** §"System-wide input data" and **D1 (`constants.ts`)** side-by-side. Every field listed in A1 has a corresponding constant in `FALLBACK_MARKET_DATA`.
9. Read **D2 (`FALLBACK_MARKET_DATA_METADATA`)** in the same file. Every field has a `last_verified` ISO date + source string.
10. For each source: visit the cited URL on the cited date (use Wayback Machine snapshot if available). Verify the value matches the constant.
11. Sample 5 random months from **D3 (`monthlyPrices.json`)** and **D4 (`monthlyFx.json`)**. Cross-check against the source API. For BRL: `curl https://olinda.bcb.gov.br/...` (command in §K.2 weekly runbook); for ECB: `curl https://data-api.ecb.europa.eu/...`.

### Day 5 — regulatory verification

12. Read **A4 (`REGULATORY_CROSSWALK.md`)**.
13. For each cell in the matrix that says "✓ disclosed via key X", open the matching i18n JSON file and verify the key + text actually exist.
14. Visit the live tool URL in each locale (e.g., `https://diboas.com/en/tools/emergency-fund`) and verify the rendered disclosure copy matches the i18n source.
15. Check: any disclosures that the matrix says "REQUIRED but MISSING"? Flag for product follow-up.

### Day 6 — output reproduction

16. Clone the repo at the audit commit SHA: `git clone ... && git checkout <SHA>`.
17. Install dependencies: `pnpm install`.
18. Run **C1 simulator**: `node apps/web/scripts/tools-stress-test.mjs`. Output JSON should match `tools-stress-test-out.json` byte-for-byte (modulo timestamp).
19. Run the test suite: `pnpm vitest run`. Expect 967/967 passing (v1.9 baseline; was 862 in v1.0).
20. Spot-check 10 production tool URLs in a browser. Compare rendered numbers to simulator output.

### Day 7 — decision history (if access granted)

21. Read **F1 (`TOOLS_IMPROVEMENT.md`)** decision register §3. Each PT-row should be marked "ACCEPTED by Bar 2026-05-23" with the magnitude that's now live in production.
22. Read **F2 (`TOOLS_IMPROVEMENT_REVIEW_2026-05-23.md`)** to understand the CTO Board review process that surfaced the product-truth gates.
23. Read **F3 (`MoneyTools_LiveData_Consolidated.md`)** for the underlying market-data validation.

## 4. Audit-gate evidence summary

The auditor should expect to confirm the following before issuing a clean opinion:

| Audit gate                                                 | Evidence in bundle                                       | Expected finding                                                |
| ---------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| All formulas have published references                     | A1 §X.4 + financial-calculations.md + textbook citations | ✅ Standard FV / annuity / CAGR math + path-dependent extension |
| All formulas have unit-test coverage                       | C4 (967 tests) + A1 §13                                  | ✅ 100% on security utils; 80% on formulas; 60% on components   |
| All input constants have source attribution                | D2 (METADATA)                                            | ✅ Every field has `last_verified` + source string              |
| All input constants have refresh cadence                   | D2 + B7 (weekly runbook)                                 | ✅ Monthly bank/inflation; daily FX; quarterly card fees        |
| All tool outputs reproduce simulator                       | C1 + C2 + production browser sweep (B8)                  | ✅ pt-BR R$7.34M Retirement matches PT1 sign-off exact          |
| All regulatory disclosures present per locale              | A4 + i18n JSON files                                     | ✅ tools-shared.disclaimer in all 4 locales (140 chars min)     |
| Decision history with Bar sign-off                         | F1 (if access granted)                                   | ✅ PT1/PT2/PT3 all marked ACCEPTED                              |
| Visual + console-error regression                          | B8 (14 pages × 0 errors)                                 | ✅ Already verified by internal audit                           |
| Code passes type-check + lint + tests + translation parity | C4 + the validation report                               | ✅ All 4 gates green                                            |

## 5. Known limitations (auditor disclosure)

### 5.1 Pending data work (deferred sub-PRs)

- **Phase F**: Currency Depreciation 12-currency UI expansion. Currency selector currently supports USD/BRL/EUR; ARS/CLP/COP FX data still pending national-bank API integration. **Impact:** the 9 additional currencies are not yet available in the user-facing tool. Not a defect; tracked in `TOOLS_IMPROVEMENT.md` §Phase F.
- **Phase I**: UX consistency polish (HIGH/MED/LOW confidence labels on Inflation Impact + Currency Depreciation retrospective modes; scenario-rate tooltips; stop-condition warning copy). **Impact:** UX uniformity gaps; no math/data impact.
- **`monthlySeries.inflation`** data file: stub only (12 locales pending Phase B.3 incremental population). **Impact:** zero on current tool behavior — calculators use `.current` and `.average5y` constants from `FALLBACK_MARKET_DATA.inflationRates`, not the monthly series.

### 5.2 Known calculator behavior worth understanding

- **D-1 — RESOLVED v1.4 (2026-05-23)**: previously Asset History `calculateAssetHistoryDcaReplay` threw for BTC + startYear ≤ 2014 because Yahoo BTC-USD data starts September 2014. **The v1.4 CoinMetrics backfill** (see CHANGELOG v1.4 entry + §6.7) extended BTC's series back to July 2010, making all BTC `startYear ∈ {2010, …, 2026}` real computable scenarios. BTC 2010 DCA now produces a $534.5M LOW-confidence result that sits inside the legacy research-anchored $500M-$1.5B envelope — the legacy `calculateAssetHistory` path is retired for audit scope (kept in code for backwards compat). MSCI_WORLD is the only asset that still throws for sub-2012 startYears (URTH ETF inception; intentional gap per §6.7).
- **D-2**: Compound Interest 1-year horizon for non-USD locales reads a near-zero CAGR because the trailing 12 months of FX data may be flat. Mathematically correct; documented as a horizon-window convention.
- **D-3**: Inflation Impact has a discrete inflation-rate jump at horizon = 24 → 25 months (`selectInflationRate` boundary). Documented design choice; a tooltip explanation is a Phase I improvement.

### 5.3 Pre-launch context

The diBoaS platform is in **pre-launch / waitlist phase** as of 2026-05-23. The /tools surface is a marketing-and-educational set. No live financial transactions are processed by the tools. Disclaimers in all 4 locales make this explicit ("Educational projection only. Not financial advice.").

## 6. File-tracking caveat for the auditor

Per `CLAUDE.md` project convention:

- `docs/tech/` is git-tracked (this directory is committable).
- `docs/audit/`, `docs/researches/`, `docs/integrations/` are **local-only** (not git-tracked).

This means an auditor running `git log` on the repo will see:

- ✅ All Tier A documents (this bundle) — tracked
- ✅ All Tier B (docs/tech/\*) — tracked
- ❌ Tier F decision-history docs — NOT in git. The user maintains them locally and can share via file transfer or by moving them to `docs/tech/audit-bundle/` for the audit period.

**Recommendation for the audit period:** before delivering the bundle, copy or symlink the following local-only docs into this directory:

```bash
cp docs/audit/TOOLS_IMPROVEMENT.md docs/tech/audit-bundle/_TOOLS_IMPROVEMENT_PLAN.md
cp docs/audit/TOOLS_IMPROVEMENT_REVIEW_2026-05-23.md docs/tech/audit-bundle/_CTO_BOARD_REVIEW.md
cp docs/audit/TOOLS_IMPROVEMENT_VALIDATION_2026-05-23.md docs/tech/audit-bundle/_INTERNAL_VALIDATION_REPORT.md
cp docs/researches/MoneyTools_LiveData_Consolidated.md docs/tech/audit-bundle/_LIVE_DATA_CONSOLIDATED.md
```

The `_` prefix indicates "audit-period inclusion, normally local-only." After the audit, remove these copies.

The 39 currently-uncommitted files in the working tree should be committed BEFORE delivering the audit bundle so the auditor can pin to a single SHA. The user has indicated they will commit at the end (per session-end protocol).

## 7. Audit access prerequisites

The auditor will need:

1. **Read access to the repo** at the audit commit SHA.
2. **Node.js 20+ installed** (the simulator scripts use ES modules + Node 18+ APIs; tested on Node 21).
3. **No network access required** for reproducing outputs from the static `monthlyPrices.json` / `monthlyFx.json` files. (Re-pulling raw source data from BCB/ECB/Yahoo does require network access, but that's not needed if the auditor trusts the data files at SHA freeze time.)
4. **A modern browser** for spot-checking the live production URLs at `https://diboas.com/{locale}/tools/*`.

## 8. Point of contact

- **Engineering owner of the math layer:** see git blame on `apps/web/src/lib/market-data/formulas/*.ts`.
- **Product owner of the magnitudes:** Bar (CEO), via the decision-register sign-off chain in F1.
- **Data refresh owner:** TBD per K.3 weekly runbook (currently the engineering on-call rotates).
- **Audit-bundle owner:** whoever is delivering this bundle to the external auditor.

## 9. Changelog

- **v1.1 (2026-05-23):** Added **A3 (FUNCTIONAL_SPECIFICATION.md)**, **A5 (TEST_VECTORS.json)**, and **A6 (data/ directory with bundled raw data)** to enable **code-blind black-box audit**. Updated §3 with a new "code-blind audit" reading order. The bundle now contains everything an external auditor needs to reproduce results from first principles without accessing the diBoaS codebase.
- **v1.0 (2026-05-23):** Initial bundle manifest at Phase A–E+G+H+J+K shipped, F+I+L deferred. Reflects all 5 Bar-signed PT-rows + 862-passing test suite + 14-page visual regression sweep.
