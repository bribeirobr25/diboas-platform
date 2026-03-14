/**
 * GoalCalculator constants — risk tiers, locale defaults, analytics events.
 */

import type { RiskTier } from './goalCalculatorTypes';

export const RISK_TIERS: readonly RiskTier[] = [
  { label: 'careful', expectedAPY: 0.07, goodAPY: 0.085, badAPY: 0.03 },
  { label: 'moderate', expectedAPY: 0.10, goodAPY: 0.12, badAPY: 0.02 },
  { label: 'aggressive', expectedAPY: 0.15, goodAPY: 0.18, badAPY: -0.15 },
] as const;

export const LOCALE_SMALLER_AMOUNTS: Record<string, number> = {
  en: 50,
  de: 50,
  es: 50,
  'pt-BR': 100,
};

export const GOAL_CALCULATOR_EVENTS = {
  TAB_SWITCH: 'goal_calculator_tab_switch',
  TIER_CHANGE: 'goal_calculator_tier_change',
  RESULT_SHOWN: 'goal_calculator_result_shown',
  START_SMALLER_TOGGLE: 'goal_calculator_start_smaller_toggle',
  CTA_CLICK: 'goal_calculator_cta_click',
} as const;

export const EMERGENCY_COVERAGE_OPTIONS = [3, 4, 6] as const;
export const EMERGENCY_TIMELINE_OPTIONS = [6, 9, 12, 18] as const;
