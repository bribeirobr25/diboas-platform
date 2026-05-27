/**
 * Tools domain barrel.
 */

export type {
  AssetHistoryAssetKey,
  AssetHistoryDefaults,
  AssetHistoryMode,
  AssetHistoryStartYear,
  CardFeesDefaults,
  CompoundToolDefaults,
  CurrencyDepreciationDefaults,
  EmergencyFundDefaults,
  IdleCashDefaults,
  InflationImpactDefaults,
  TimeToTargetDefaults,
  ToolDescriptor,
  ToolKey,
  ToolSectionKey,
} from './types';

export {
  ASSET_HISTORY_DEFAULTS,
  CARD_FEES_DEFAULTS,
  COMPOUND_TOOL_DEFAULTS,
  CURRENCY_DEPRECIATION_DEFAULTS,
  EMERGENCY_FUND_DEFAULTS,
  IDLE_CASH_DEFAULTS,
  INFLATION_IMPACT_DEFAULTS,
  SHIPPED_TOOLS,
  TIME_TO_TARGET_DEFAULTS,
  TOOL_DESCRIPTORS,
} from './constants';

export { toolMetadata } from './metadata';

export { buildToolStructuredData, buildToolsIndexStructuredData } from './structuredData';

export {
  clampInput,
  exceedsSoftMaxWarning,
  CARD_FEES_PROCESSOR_FEE_PCT_BOUNDS,
  CURRENCY_DEPRECIATION_AMOUNT_BOUNDS,
  CURRENCY_DEPRECIATION_YEARS_BOUNDS,
  EMERGENCY_FUND_TARGET_MULTIPLIER_BOUNDS,
  IDLE_CASH_BANK_YIELD_PCT_BOUNDS,
  INFLATION_IMPACT_YEARS_BOUNDS,
  type NumberInputBounds,
  type SoftMaxWarning,
} from './clampInput';
