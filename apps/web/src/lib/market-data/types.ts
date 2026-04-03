/**
 * Market Data Types
 *
 * Interfaces for all market-driven financial data consumed by the platform.
 * These types define the contract between the MarketDataService and all consumers
 * (comparison tables, goal cards, calculators, PreDream, PreDemo, fee tables).
 */

export type SupportedLocale = 'en' | 'pt-BR' | 'de' | 'es';
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
}

/** Exchange rates for all non-USD currencies */
export interface ExchangeRates {
  readonly rates: Record<string, CurrencyRate>;
}

/** Per-locale inflation data */
export interface InflationData {
  readonly current: number;
  readonly average5y: number;
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
}

/** Provider interface — swappable (Principle P3: Service Agnostic) */
export interface IMarketDataProvider {
  fetch(): Promise<MarketDataSnapshot>;
  isAvailable(): Promise<boolean>;
}
