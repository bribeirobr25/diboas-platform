/**
 * Tools Domain Constants
 *
 * Per-tool defaults are locale-keyed (Record<SupportedLocale, T>) so that
 * a future analytics-driven provider (PENDING_ALL.md P4-9) can swap the
 * source without touching call sites. v1 ships hard-coded fallback values
 * derived from the same locale-bank-rate context as GOAL_CARD_INPUTS.
 */

import type {
  CompoundToolDefaults,
  EmergencyFundDefaults,
  ToolDescriptor,
  ToolKey,
} from './types';

/** Display order for /tools landing cards within each section. */
export const TOOL_DESCRIPTORS: Record<ToolKey, ToolDescriptor> = {
  'compound-interest': {
    key: 'compound-interest',
    section: 'grow',
    slug: 'compound-interest',
    i18nNamespace: 'tools-compound-interest',
    icon: 'compound',
    forBusiness: false,
  },
  retirement: {
    key: 'retirement',
    section: 'grow',
    slug: 'retirement',
    i18nNamespace: 'tools-retirement',
    icon: 'retirement',
    forBusiness: false,
  },
  'goal-savings': {
    key: 'goal-savings',
    section: 'grow',
    slug: 'goal-savings',
    i18nNamespace: 'tools-goal-savings',
    icon: 'goal',
    forBusiness: false,
  },
  'emergency-fund': {
    key: 'emergency-fund',
    section: 'target',
    slug: 'emergency-fund',
    i18nNamespace: 'tools-emergency-fund',
    icon: 'emergency',
    forBusiness: false,
  },
};

/**
 * Default inputs for tools that reuse the CompoundInterestCalculator.
 * Per-locale `amount` follows the GOAL_CARD_INPUTS convention so future
 * locale-specific data swaps are zero-call-site.
 */
export const COMPOUND_TOOL_DEFAULTS: Record<
  Exclude<ToolKey, 'emergency-fund'>,
  CompoundToolDefaults
> = {
  'compound-interest': {
    initialAmount: 0,
    amount: { en: 5, 'pt-BR': 25, es: 3, de: 4 },
    cadence: 'daily',
    years: 12,
  },
  retirement: {
    initialAmount: 0,
    amount: { en: 500, 'pt-BR': 2000, es: 400, de: 400 },
    cadence: 'monthly',
    years: 25,
  },
  'goal-savings': {
    initialAmount: 0,
    amount: { en: 200, 'pt-BR': 1000, es: 150, de: 150 },
    cadence: 'monthly',
    years: 10,
  },
};

/** Default inputs for the Emergency Fund time-to-target calculator. */
export const EMERGENCY_FUND_DEFAULTS: EmergencyFundDefaults = {
  monthlyExpenses: { en: 2900, 'pt-BR': 2700, es: 1500, de: 2000 },
  monthlySavings: { en: 300, 'pt-BR': 270, es: 150, de: 200 },
  targetMultiplier: 6,
};
