/**
 * PreDream Domain Constants
 *
 * Path multipliers, timeframe configs, and slider ranges
 * Multipliers match the reference demo exactly
 */

import type { PreDreamPath, PreDreamPathConfig, PreDreamTimeframe, PreDreamTimeframeConfig } from './types';

/** Bank APY rate for comparison (FDIC National Average) */
export const PRE_DREAM_BANK_APY = 0.5; // 0.5%

/** Path configurations with multipliers for 1/3/5/10 year timeframes */
export const PRE_DREAM_PATHS: Record<PreDreamPath, PreDreamPathConfig> = {
  safety: {
    id: 'safety',
    apy: 7,
    multipliers: {
      '1year': 1.07,
      '3years': 1.2250,
      '5years': 1.4026,
      '10years': 1.9672,
    },
  },
  balance: {
    id: 'balance',
    apy: 12,
    multipliers: {
      '1year': 1.12,
      '3years': 1.4049,
      '5years': 1.7623,
      '10years': 3.1058,
    },
  },
  growth: {
    id: 'growth',
    apy: 18,
    multipliers: {
      '1year': 1.18,
      '3years': 1.6430,
      '5years': 2.2878,
      '10years': 5.2338,
    },
  },
} as const;

/** Timeframe configurations */
export const PRE_DREAM_TIMEFRAMES: Record<PreDreamTimeframe, PreDreamTimeframeConfig> = {
  '1year': { label: '1 Year', days: 365, months: 12, years: 1 },
  '3years': { label: '3 Years', days: 1095, months: 36, years: 3 },
  '5years': { label: '5 Years', days: 1825, months: 60, years: 5 },
  '10years': { label: '10 Years', days: 3650, months: 120, years: 10 },
} as const;

/** Amount slider configuration */
export const PRE_DREAM_INITIAL_AMOUNT_CONFIG = {
  min: 0,
  max: 10000,
  step: 50,
  default: 1000,
} as const;

export const PRE_DREAM_MONTHLY_AMOUNT_CONFIG = {
  min: 0,
  max: 1000,
  step: 10,
  default: 100,
} as const;

/** Simulation animation config */
export const PRE_DREAM_SIMULATION_CONFIG = {
  steps: 50,
  intervalMs: 60,
  resultDelayMs: 500,
} as const;
