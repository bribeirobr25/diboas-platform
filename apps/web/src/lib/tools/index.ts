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
  TIME_TO_TARGET_DEFAULTS,
  TOOL_DESCRIPTORS,
} from './constants';

export { toolMetadata } from './metadata';

export {
  buildToolStructuredData,
  buildToolsIndexStructuredData,
} from './structuredData';
