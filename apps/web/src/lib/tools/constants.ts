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
  CurrencyDepreciationDefaults,
  EmergencyFundDefaults,
  InflationImpactDefaults,
  TimeToTargetDefaults,
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
  // Phase 6D — Tier 2 tools
  'inflation-impact': {
    key: 'inflation-impact',
    section: 'protect',
    slug: 'inflation-impact',
    i18nNamespace: 'tools-inflation-impact',
    icon: 'inflation',
    forBusiness: false,
  },
  'time-to-target': {
    key: 'time-to-target',
    section: 'target',
    slug: 'time-to-target',
    i18nNamespace: 'tools-time-to-target',
    icon: 'timeToTarget',
    forBusiness: false,
  },
  'currency-depreciation': {
    key: 'currency-depreciation',
    section: 'protect',
    slug: 'currency-depreciation',
    i18nNamespace: 'tools-currency-depreciation',
    icon: 'currencyDepreciation',
    forBusiness: false,
  },
};

/**
 * Tools that reuse the CompoundInterestCalculator (Tier-1 only). Other
 * Tier-2/3 tools have their own calculator with bespoke math.
 */
export type CompoundToolKey = 'compound-interest' | 'retirement' | 'goal-savings';

/**
 * Default inputs for tools that reuse the CompoundInterestCalculator.
 * Per-locale `amount` follows the GOAL_CARD_INPUTS convention so future
 * locale-specific data swaps are zero-call-site.
 */
export const COMPOUND_TOOL_DEFAULTS: Record<CompoundToolKey, CompoundToolDefaults> = {
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

/** Default inputs for the Inflation Impact calculator (6D.1). */
export const INFLATION_IMPACT_DEFAULTS: InflationImpactDefaults = {
  amount: { en: 1000, 'pt-BR': 5000, es: 1000, de: 1000 },
  years: 10,
};

/** Default inputs for the Time-to-Target calculator (6D.2). */
export const TIME_TO_TARGET_DEFAULTS: TimeToTargetDefaults = {
  target: { en: 50000, 'pt-BR': 250000, es: 40000, de: 40000 },
  initialAmount: { en: 0, 'pt-BR': 0, es: 0, de: 0 },
  contribution: { en: 250, 'pt-BR': 1000, es: 200, de: 200 },
  cadence: 'monthly',
};

/** Default inputs for the Currency Depreciation calculator (6D.3).
 *  Defaults sized in local currency for non-USD locales; en falls back to USD/EUR-equivalent. */
export const CURRENCY_DEPRECIATION_DEFAULTS: CurrencyDepreciationDefaults = {
  amount: { en: 10000, 'pt-BR': 50000, es: 10000, de: 10000 },
  years: 5,
};
