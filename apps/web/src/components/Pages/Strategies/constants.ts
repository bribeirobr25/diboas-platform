/**
 * Strategies Page - Constants
 *
 * Configuration values for strategy page
 */

/**
 * i18n namespace prefix for strategies page
 */
export const I18N_PREFIX = 'marketing.pages.strategies';

/**
 * Strategy IDs matching the i18n keys in strategies.json
 */
export const STRATEGY_IDS = [
  'safeHarbor',
  'stableGrowth',
  'goalKeeper',
  'steadyProgress',
  'patientBuilder',
  'balancedBuilder',
  'steadyCompounder',
  'wealthAccelerator',
  'yieldMaximizer',
  'fullThrottle',
] as const;

/**
 * Growth exposure percentages for each strategy (for visual styling)
 */
export const GROWTH_EXPOSURE: Record<string, number> = {
  safeHarbor: 0,
  stableGrowth: 30,
  goalKeeper: 0,
  steadyProgress: 35,
  patientBuilder: 0,
  balancedBuilder: 40,
  steadyCompounder: 0,
  wealthAccelerator: 70,
  yieldMaximizer: 0,
  fullThrottle: 85,
};

/**
 * Matrix row configuration
 */
export const MATRIX_ROWS = [
  { id: 'emergency', stableStrategy: 'safeHarbor', growthStrategy: 'stableGrowth' },
  { id: 'shortTerm', stableStrategy: 'goalKeeper', growthStrategy: 'steadyProgress' },
  { id: 'mediumTerm', stableStrategy: 'patientBuilder', growthStrategy: 'balancedBuilder' },
  { id: 'longTerm', stableStrategy: 'steadyCompounder', growthStrategy: 'wealthAccelerator' },
  { id: 'wealthBuilding', stableStrategy: 'yieldMaximizer', growthStrategy: 'fullThrottle' },
] as const;

export type StrategyId = typeof STRATEGY_IDS[number];
export type MatrixRow = typeof MATRIX_ROWS[number];
