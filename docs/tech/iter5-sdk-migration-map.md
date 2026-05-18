# Iter-5 SDK Migration Map

**Purpose.** Reference for the future iter-5 migration: maps every field on `MarketDataSnapshot` (the platform's single source of truth for market-driven values) to its expected upstream data source. When the iter-5 SDK lands, this table is the implementation checklist.

**Why this exists.** Phase C+ of the Historical Performance Calibration workstream (2026-05-16) locked the snapshot shape so the eventual SDK swap is mechanical — consumers route through `marketDataService.getSync()` and never touch raw sources. This doc closes the corresponding "Appendix E" referenced in `docs/audit/HISTORICAL_PERFORMANCE_CALIBRATION_PLAN_2026-05-16.md` §3.3.5.

**Read alongside.** `apps/web/src/lib/market-data/types.ts` (snapshot shape) and `apps/web/src/lib/market-data/service.ts` (consumer surface).

---

## Snapshot field → upstream source

Status legend: **Hardcoded** (project config — stays in code) · **Provider-driven** (SDK populates at runtime) · **Hybrid** (provider drives a subset; defaults fall back to constants).

| Field | Status | Upstream source | Refresh cadence | Notes |
|---|---|---|---|---|
| `rates.bankRates.*.savings` | Provider-driven | Central-bank or aggregator API (Fed FRED `DFF` / BCB SGS `4189` / ECB SDW / BdE) | Daily | Per locale; 4 rows (en/pt-BR/de/es). |
| `rates.bankRates.*.neobank` | Hybrid | Manual research → quarterly review | Quarterly | No clean API; track top neobank rate per locale. |
| `rates.bankRates.*.treasury` | Provider-driven | Treasury yield series (US 10Y / BR Tesouro Selic / EUR 10Y bund) | Daily | |
| `rates.strategyApys.*` | Hardcoded | diBoaS internal config | Manual | safety/balance/growth tiers — product-defined, not market-data. |
| `rates.scenarioRates.*` | Hardcoded | Research-anchored | Annual | conservative/historical/optimistic — locked in `constants.ts`, refreshed during annual research cycle. |
| `assetPrices.crypto.*` | Provider-driven | CoinGecko `/simple/price` or Crypto.com Exchange `/get_index_price` | 5-min TTL | BTC, ETH, SOL, SUI, TRX, USDC. |
| `assetPrices.etfs.*` | Provider-driven | Yahoo Finance / Polygon (delayed quotes OK pre-real-time) | 15-min TTL | SPYx, QQQx, IWMon. |
| `assetPrices.commodities.*` | Provider-driven | LBMA gold fix / metals.dev | Daily | XAUt tracks gold spot. |
| `assetPrices.updatedAt` | Provider-driven | Computed at fetch | — | ISO-8601. |
| `exchangeRates.rates.*.rateToUsd` | Provider-driven | ECB SDW `EXR` or exchangerate.host | Daily | EUR, BRL, GBP, etc. |
| `exchangeRates.rates.*.annualDepreciation` | Hardcoded | Research-anchored | Annual | Forward-looking conservative estimate, NOT a live rate. |
| `exchangeRates.rates.*.historicalCagr` | Hardcoded | Research doc Part 4 | Annual | 2010→present CAGR; Phase A field. |
| `exchangeRates.rates.*.historicalRateStart` / `End` | Hardcoded | Research doc Part 4 | Annual | Anchor pair. |
| `inflationRates.rates.*.current` | Provider-driven | BLS CPI / IBGE IPCA / Destatis VPI / INE IPC | Monthly | YoY headline rate. |
| `inflationRates.rates.*.average5y` | Provider-driven | Computed from same series | Monthly | Rolling 5-year mean. |
| `inflationRates.rates.*.cumulativeSince2010` | Hardcoded | Research doc Part 3 | Annual | Phase A field; static "since-2010" reference. |
| `inflationRates.rates.*.average16y` | Hardcoded | Research doc Part 3 | Annual | Phase A field. |
| `platformFees.*` | Hardcoded | diBoaS internal config (`docs/full-view/FEES.md`) | Manual | Pricing decision — NEVER provider-driven. |
| `thirdPartyFees.paymentProcessor` | Hybrid | Stripe/local PSP rates | Quarterly | Locale-aware once on/off-ramp partner is signed (`MEMORY.md` notes this is "NOT YET DECIDED" as of 2026-04-10). |
| `thirdPartyFees.networkFee` | Provider-driven | Solana RPC `getRecentPrioritizationFees` (or equiv L1) | 5-min TTL | |
| `thirdPartyFees.crossChainSwap` | Provider-driven | Jupiter / bridge aggregator | 5-min TTL | |
| `thirdPartyFees.btcMiner` | Provider-driven | mempool.space recommended fee | 5-min TTL | |
| `thirdPartyFees.xautIssuer` | Hardcoded | Tether Gold issuance fee schedule | Annual | |
| `networkGas.solReserve` | Hardcoded | Operational config | Manual | Reserve floor for SOL accounts. |
| `networkGas.ethGasGwei` | Provider-driven | Etherscan `gasoracle` or alchemy_getFeeHistory | 1-min TTL | |
| `networkGas.solPriorityFee` | Provider-driven | Solana RPC | 5-min TTL | |
| `protocolData.tvl.combined` | Provider-driven | DeFiLlama `/api/protocol/{slug}` (Sky, Aave, Compound, Jito, Jupiter combined) | Daily | Phase I (2026-05-16) currently manual; iter-5 swap target. |
| `protocolData.updatedAt` | Provider-driven | Computed at fetch | — | 90-day soft staleness gate (Appendix F). |
| `metadata.fetchedAt` | Provider-driven | Computed at fetch | — | |
| `metadata.source` | Provider-driven | `'api'` when SDK serves; `'fallback'` when constants used | — | |
| `metadata.stale` | Provider-driven | Per-field staleness check | — | |
| `metadata.ttl` | Provider-driven | Per-source SLA | — | |
| `historicalAnchors.anchors` | Hardcoded | Research doc Parts 1+2 | Annual | 24 entries (8 assets × 3 windows). Phase C/C+. |
| `historicalAnchors.fxBuckets.BRL` / `EUR` | Hardcoded | Research doc Part 4/5 | Annual | Coarse path-dependent windows. |
| `historicalAnchors.lastResearchUpdate` | Hardcoded | Manual stamp | Per refresh | Drives 365-day staleness gate (`historical.test.ts`). |

---

## Migration sequencing

1. **Stand up the SDK adapter.** Implement `IMarketDataProvider.fetch()` against the SDK; keep `FALLBACK_MARKET_DATA` constants as the failover branch when `metadata.source === 'fallback'`.
2. **Flip provider-driven fields first.** Order: crypto prices → ETF prices → FX rates → inflation rates → bank rates → network gas → TVL. Each flip is independent (consumers read through `marketDataService.getSync()` and need no code change).
3. **Hybrid fields stay defaulted.** `neobank`, `paymentProcessor`, `xautIssuer` remain in constants; SDK can override per-locale if/when partner data is available.
4. **Hardcoded fields never flip.** `platformFees`, `strategyApys`, `scenarioRates`, all `historicalAnchors`, all `historicalCagr`/`cumulativeSince2010` Phase A research stamps — these are product/research config, NOT market data. The SDK does not populate them.

## Consumer-side invariant (§6.10 lock)

Consumers MUST NOT bypass the service to read raw upstream data. Every market-data read goes through one of:

- `marketDataService.getSync()` — synchronous snapshot read (returns cached or fallback)
- `marketDataService.get()` — async fetch with TTL/cache
- `marketDataService.getHistoricalAnchors()` — historical-slice helper

Direct imports from `lib/market-data/historical.ts`, `constants.ts`, or any future SDK adapter file are prohibited outside `lib/market-data/` and enforced by the pre-merge grep gate.

## When to update this doc

- A new field is added to `MarketDataSnapshot` → add a row.
- A field's source moves from hardcoded → provider-driven (or vice versa) → update Status and Upstream.
- A new upstream API is adopted → update the relevant rows.
- The iter-5 migration completes → mark this doc as historical reference (the snapshot field list will still describe the platform).
