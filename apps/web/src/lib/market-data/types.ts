/**
 * Market Data Types
 *
 * Interfaces for all market-driven financial data consumed by the platform.
 * These types define the contract between the MarketDataService and all consumers
 * (comparison tables, goal cards, calculators, PreDream, PreDemo, fee tables).
 */

// Phase 8 carry-forward #5 (2026-05-20): single source of truth.
// Canonical type lives in `@diboas/i18n/config`. Imported here + re-exported so
// existing market-data consumers (~8 files) keep working without changing imports.
import type { SupportedLocale } from '@diboas/i18n/config';
export type { SupportedLocale };
export type StrategyPath = 'safety' | 'balance' | 'growth';
export type ScenarioKey = 'conservative' | 'historical' | 'optimistic';
export type DepositTiming = 'end' | 'beginning';

/** Locale-specific bank/savings rates */
export interface LocaleBankRates {
  readonly savings: number;
  readonly neobank: number;
  readonly treasury: number;
  readonly source: string;
  readonly sourceDate: string;
  /**
   * Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23): optional "live current" rate
   * for locales where the live rate diverges from the 5y-average `savings`.
   *  - en: FDIC national average ~0.38% (live April 2026 vs 0.32% 5y avg)
   *  - pt-BR: poupança under Selic > 8.5% rule ~6.17% (live vs 6.83% 5y avg)
   * UI toggle decisions C1 + C2 from TOOLS_IMPROVEMENT decision register.
   */
  readonly savingsCurrent?: number;
  /**
   * Phase C: optional top-1% high-yield savings tier. Currently only `en`
   * (NerdWallet top-1% HYSA ~4.10% May 2026). Surfaced as a secondary toggle
   * per Decision C1.
   */
  readonly savingsHighYield?: number;
  /**
   * Phase G (TOOLS_IMPROVEMENT.md): Brazil-specific Selic + TR for the
   * poupança regime-switch formula (0.5%/mo + TR when Selic > 8.5%; else
   * 70% × Selic + TR). Only populated on the `pt-BR` row.
   */
  readonly selicAnnualPct?: number;
  readonly trMonthlyPct?: number;
}

/** Market APY/yield rates */
export interface MarketRates {
  readonly bankRates: Record<SupportedLocale, LocaleBankRates>;
  readonly strategyApys: Record<StrategyPath, number>;
  readonly scenarioRates: Record<ScenarioKey, number>;
}

/** Crypto, ETF, commodity, and stock prices */
export interface AssetPrices {
  readonly crypto: Record<string, number>;
  readonly etfs: Record<string, number>;
  readonly commodities: Record<string, number>;
  readonly updatedAt: string;
}

/** Per-currency exchange rate configuration */
export interface CurrencyRate {
  readonly rateToUsd: number;
  readonly annualDepreciation: number;
  readonly rateDate: string;
  readonly depreciationBasis: string;
  // Phase A additions (2026-05-16): long-window historical anchors per
  // docs/researches/btc-vs-assets-inflation-fx-final-analysis.md. Optional so
  // partial-ship scenarios (SDK without history) and SupportedLocale rows
  // without a historical research source remain valid.
  readonly historicalCagr?: number;
  readonly historicalAnchorStart?: string;
  readonly historicalAnchorEnd?: string;
  readonly historicalRateStart?: number;
  readonly historicalRateEnd?: number;
}

/** Exchange rates for all non-USD currencies */
export interface ExchangeRates {
  readonly rates: Record<string, CurrencyRate>;
}

/**
 * FX bucket — local/USD average rate over a date-range window.
 *
 * Phase B (2026-05-16): consumed by `calculateMonthlyPathDependentHedge` for
 * retrospective DCA over multi-year windows where the underlying FX path is
 * non-uniform. Date ranges are inclusive at both ends, format ISO YYYY-MM-DD.
 *
 * The date-range shape supports both coarse (5-year) buckets per research
 * Part 5 methodology and annual buckets without schema change. Phase C
 * populates concrete bucket data on `MarketDataSnapshot.historicalAnchors`
 * (NOT on `CurrencyRate.historicalBuckets` — historical data lives in its
 * own snapshot slice per the §3.3.5 lock).
 */
export interface FxBucket {
  readonly avgRate: number;
  readonly startDate: string;
  readonly endDate: string;
}

// ---------------------------------------------------------------------------
// Phase C — historical anchor types (data populated in `./historical.ts`)
// ---------------------------------------------------------------------------

export type AssetCode =
  | 'BTC'
  | 'SP500'
  | 'QQQ'
  | 'MSCI_WORLD'
  | 'GOLD'
  | 'TLT'
  | 'IBOVESPA'
  | 'DAX';

/** M8 round-2: 2020 dropped — research doc has no 2020 anchor table. */
export type AnchorYear = 2010 | 2016 | 2026;

export type AnchorConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AssetAnchor {
  readonly asset: AssetCode;
  readonly year: AnchorYear;
  /** 1 = January, 3 = March, 5 = May, 7 = July (BTC Mt.Gox launch anchor) */
  readonly monthIndicative: number;
  readonly price: number;
  readonly currency: 'USD' | 'BRL' | 'EUR';
  readonly confidence: AnchorConfidence;
  readonly source: string;
}

/**
 * Phase C+ — historical-anchor snapshot slice (L1 round-1 lock).
 * Lives on `MarketDataSnapshot.historicalAnchors` as an optional field so
 * partial-ship scenarios (SDK without history) remain valid. Consumers
 * (Phase D + E) MUST route through `marketDataService.getSync().historicalAnchors`
 * — direct imports from `./historical.ts` are §6.10-prohibited outside `lib/market-data/`.
 */
export interface HistoricalAnchorsData {
  readonly anchors: readonly AssetAnchor[];
  readonly fxBuckets: {
    readonly BRL: readonly FxBucket[];
    readonly EUR: readonly FxBucket[];
  };
  readonly lastResearchUpdate: string;
}

/** Per-locale inflation data */
export interface InflationData {
  readonly current: number;
  readonly average5y: number;
  // Phase A additions (2026-05-16): long-window cumulative inflation
  // 2010→2026 per BLS/IBGE/Destatis/INE. Optional for partial-ship.
  readonly cumulativeSince2010?: number;
  readonly average16y?: number;
}

/** Inflation rates for all locales */
export interface InflationRates {
  readonly rates: Record<SupportedLocale, InflationData>;
}

/** Fee configuration for a single fee type */
export interface FeeConfig {
  readonly rate: number;
  readonly minFee: number;
  readonly maxFee: number;
}

/** All diBoaS platform fees */
export interface PlatformFees {
  readonly deposit: FeeConfig;
  readonly sell: FeeConfig;
  readonly send: FeeConfig;
  readonly receive: FeeConfig;
  readonly swap: FeeConfig;
  readonly strategyEntry: FeeConfig;
  readonly strategyExit: FeeConfig;
  readonly cashOut: FeeConfig;
}

/** Third-party pass-through fees */
export interface ThirdPartyFees {
  readonly paymentProcessor: number;
  readonly networkFee: number;
  readonly crossChainSwap: number;
  readonly btcMiner: number;
  readonly xautIssuer: number;
}

/** Network gas/reserve configuration */
export interface NetworkGas {
  readonly solReserve: number;
  readonly ethGasGwei: number;
  readonly solPriorityFee: number;
}

/** Protocol TVL data */
export interface ProtocolData {
  readonly tvl: Record<string, string>;
  readonly updatedAt: string;
}

/** Metadata about the data snapshot */
export interface MarketDataMetadata {
  readonly fetchedAt: string;
  readonly source: 'api' | 'fallback';
  readonly stale: boolean;
  readonly ttl: number;
}

/**
 * Monthly asset price OHLC series — Phase B (TOOLS_IMPROVEMENT.md).
 * Stored as Hardcoded research data per iter5-sdk-migration-map.md taxonomy.
 * `basis` distinguishes total-return (ETF adjusted close) from price-only
 * series (BTC, gold) and natively-total-return indices (DAX, Ibovespa).
 */
export interface MonthlyAssetBar {
  /** First-of-month ISO date (YYYY-MM-01) for natural sort and new Date() interop. */
  readonly ym: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  /**
   * Primary close. For assets where Phase B picked `total_return` basis
   * (SP500/QQQ/MSCI_WORLD/TLT), this is the adjusted close (dividends
   * reinvested). For native_total_return assets (DAX/Ibovespa) and price_only
   * assets (BTC/GOLD), this is just the close.
   */
  readonly close: number;
  /**
   * Phase E (TOOLS_IMPROVEMENT.md, 2026-05-23, PT2 Bar acceptance): when the
   * primary close is total-return-adjusted, `closePriceOnly` carries the
   * unadjusted close (dividends NOT reinvested). The Asset History UI toggle
   * "Returns basis: with dividends / price only" reads `close` for TR and
   * `closePriceOnly` for price-only. Only populated for the 4 TR-eligible
   * assets (SP500/QQQ/MSCI_WORLD/TLT); absent for BTC/GOLD/IBOVESPA/DAX.
   */
  readonly closePriceOnly?: number;
}
export type AssetReturnBasis = 'price_only' | 'total_return' | 'native_total_return';
export interface MonthlyAssetSeries {
  readonly basis: AssetReturnBasis;
  readonly source: string;
  readonly note: string;
  readonly months: ReadonlyArray<MonthlyAssetBar>;
  /** Present when source upstream failed at ingestion. */
  readonly error?: string;
}

/**
 * Monthly FX series for non-USD currencies.
 * Stores both representations: `closeUsdPerLocal` (e.g., $1.17 per EUR) and
 * `closeLocalPerUsd` (e.g., 0.85 EUR per USD). Canonical "local depreciation"
 * math uses `closeLocalPerUsd` — rising = local currency depreciating.
 */
export interface MonthlyFxBar {
  readonly ym: string;
  readonly closeUsdPerLocal: number;
  readonly closeLocalPerUsd: number;
}
export interface MonthlyFxSeries {
  readonly source: string;
  readonly basis: string;
  readonly note: string;
  readonly months: ReadonlyArray<MonthlyFxBar>;
  readonly error?: string;
}

/** Monthly inflation YoY + cumulative since 2010 (Hardcoded research data). */
export interface MonthlyInflationBar {
  readonly ym: string;
  readonly yoyPct: number;
  readonly cumulativeSinceStartPct: number;
}
export interface MonthlyInflationSeries {
  readonly source: string;
  readonly note: string;
  readonly months: ReadonlyArray<MonthlyInflationBar>;
}

/**
 * Monthly time-series slice — Phase B addition.
 * Per iter5-sdk-migration-map.md: this is Hardcoded research data ("The SDK
 * does not populate them"). Updated by the K.3 weekly manual runbook.
 * Asset keys reuse the canonical `AssetCode` type (not the live-price
 * `assetPrices.*` codes); FX/inflation keys are ISO 4217 currency codes
 * (with locale codes en/pt-BR/de/es for inflation where a locale exists).
 */
export interface MonthlySeriesData {
  readonly assets: Partial<Record<AssetCode, MonthlyAssetSeries>>;
  readonly fx: Partial<Record<string, MonthlyFxSeries>>;
  readonly inflation: Partial<Record<string, MonthlyInflationSeries>>;
}

/** Complete market data snapshot — single source of truth */
export interface MarketDataSnapshot {
  readonly rates: MarketRates;
  readonly assetPrices: AssetPrices;
  readonly exchangeRates: ExchangeRates;
  readonly inflationRates: InflationRates;
  readonly platformFees: PlatformFees;
  readonly thirdPartyFees: ThirdPartyFees;
  readonly networkGas: NetworkGas;
  readonly protocolData: ProtocolData;
  readonly metadata: MarketDataMetadata;
  // Phase C+ (2026-05-16): optional so partial-ship scenarios (SDK without
  // history, or pre-Phase-C+ consumers) remain valid.
  readonly historicalAnchors?: HistoricalAnchorsData;
  // Phase B (TOOLS_IMPROVEMENT.md, 2026-05-23): monthly OHLC/FX/inflation
  // time-series for horizon-matched CAGR + path-dependent retrospective math.
  // Optional for same partial-ship reasons.
  readonly monthlySeries?: MonthlySeriesData;
}

/** Provider interface — swappable (Principle P3: Service Agnostic) */
export interface IMarketDataProvider {
  fetch(): Promise<MarketDataSnapshot>;
  isAvailable(): Promise<boolean>;
}
