/**
 * Tools domain barrel.
 */

export type {
  CompoundToolDefaults,
  CurrencyDepreciationDefaults,
  EmergencyFundDefaults,
  InflationImpactDefaults,
  TimeToTargetDefaults,
  ToolDescriptor,
  ToolKey,
  ToolSectionKey,
} from './types';

export {
  COMPOUND_TOOL_DEFAULTS,
  CURRENCY_DEPRECIATION_DEFAULTS,
  EMERGENCY_FUND_DEFAULTS,
  INFLATION_IMPACT_DEFAULTS,
  TIME_TO_TARGET_DEFAULTS,
  TOOL_DESCRIPTORS,
} from './constants';

export { toolMetadata } from './metadata';

export {
  buildToolStructuredData,
  buildToolsIndexStructuredData,
} from './structuredData';
