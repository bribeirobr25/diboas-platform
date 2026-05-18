/**
 * Market Data — Public API
 *
 * Single source of truth for all market-driven financial data.
 * Replaces hardcoded values across translation files, constants, and configs.
 */

// Service
export { marketDataService, MarketDataServiceImpl, FallbackProvider } from './service';

// Types
export type {
  SupportedLocale,
  StrategyPath,
  ScenarioKey,
  DepositTiming,
  LocaleBankRates,
  MarketRates,
  AssetPrices,
  CurrencyRate,
  ExchangeRates,
  FxBucket,
  AssetCode,
  AnchorYear,
  AnchorConfidence,
  AssetAnchor,
  HistoricalAnchorsData,
  InflationData,
  InflationRates,
  FeeConfig,
  PlatformFees,
  ThirdPartyFees,
  NetworkGas,
  ProtocolData,
  MarketDataMetadata,
  MarketDataSnapshot,
  IMarketDataProvider,
} from './types';

// Constants
export { FALLBACK_MARKET_DATA, LOCALE_CURRENCY } from './constants';

// Formulas
export {
  annualToMonthlyRate,
  selectInflationRate,
  calculateLumpSum,
  calculateMonthlyContributions,
  calculateWithCurrencyHedge,
  calculateMonthlyWithCurrencyHedge,
  calculateMonthlyPathDependentHedge,
  monthsToInflationAdjustedTarget,
  monthsToStaticTarget,
  purchasingPower,
  calculateFee,
  applyPlatformFees,
} from './formulas';
export type {
  LumpSumResult,
  MonthlyContributionResult,
  CurrencyHedgeResult,
  MonthlyHedgeResult,
  PathDependentHedgeArgs,
  PathDependentHedgeResult,
  FeeResult,
} from './formulas';

// Formatters
export {
  formatRate,
  formatApproxRate,
  formatCurrency,
  formatGain,
  formatReturn,
  formatCompactCurrency,
  formatTimeDifference,
  getLocaleConfig,
} from './formatters';
