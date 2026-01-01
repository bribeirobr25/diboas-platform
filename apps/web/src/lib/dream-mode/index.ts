/**
 * Dream Mode - Public API
 *
 * Barrel export for Dream Mode domain functionality
 */

// Types
export type {
  DreamPath,
  DisclaimerRegion,
  DreamTimeframe,
  PathProjection,
  PathConfig,
  DreamModeData,
  RegionalDisclaimer,
  GrowthResult,
  BankComparisonResult,
} from './types';

// Constants
export {
  BANK_APY_RATE,
  ECB_SOURCE_CITATION,
  TIMEFRAME_DAYS,
  PATH_ICONS,
  PATH_COLORS,
  PATH_CONFIGS,
  REGIONAL_DISCLAIMERS,
  AMOUNT_SLIDER_CONFIG,
  DREAM_MODE_EVENTS,
  STORAGE_KEYS,
} from './constants';

// Calculations
export {
  calculatePathGrowth,
  calculateBankBalance,
  calculateBankComparison,
  getPathApy,
  getPathRiskMetrics,
  formatDreamCurrency,
  formatDreamPercentage,
} from './calculations';

// Regional Detection
export {
  getDisclaimerRegion,
  requiresEnhancedDisclaimer,
  getDisclaimerKeySuffix,
  getRegionDisplayName,
} from './regional-detection';
