/**
 * Calculator Library - Public API
 *
 * Exports for Future You Calculator functionality
 */

// Types
export type {
  InvestmentInput,
  ProjectionTimeframe,
  ShortTermTimeframe,
  LongTermTimeframe,
  RateScenario,
  ProjectionResult,
  ScenarioComparison,
  ShortTermProjections,
  LongTermProjections,
  CalculatorResult,
  CalculatorConfig,
} from './types';

// Constants
export {
  CALCULATOR_CONFIG,
  DEFI_SCENARIO,
  BANK_SCENARIO,
  TIMEFRAME_DAYS,
  TIMEFRAME_LABELS,
  LONG_TERM_TIMEFRAMES,
  CURRENCY_CONFIG,
  CALCULATOR_EVENTS,
  LOCALE_CONFIG,
  getLocaleConfig,
} from './constants';

// Calculations
export {
  calculateCompoundGrowth,
  calculateProjection,
  compareScenarios,
  calculateFullResult,
  formatCurrency,
  formatPercentage,
  getCurrencyLocale,
} from './calculations';
