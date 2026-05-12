/**
 * Tools Domain Types
 *
 * Per-tool input configuration for the Money Tools route group.
 * Locale-aware defaults follow the GOAL_CARD_INPUTS pattern from
 * config/goalCards.ts so future migrations to a live data provider
 * (PENDING_ALL.md P4-9) flip a single source.
 */

import type { SupportedLocale } from '@diboas/i18n/config';
import type { Cadence } from '@/lib/compound-interest';

/**
 * 4 Tier-1 (6C) + 3 Tier-2 (6D) + 2 Tier-3 B2B (6E) = 9 tools total.
 */
export type ToolKey =
  | 'compound-interest'
  | 'retirement'
  | 'emergency-fund'
  | 'goal-savings'
  | 'inflation-impact'
  | 'time-to-target'
  | 'currency-depreciation'
  | 'card-fees'
  | 'idle-cash';

/** Section grouping shown on the /tools landing (per Q9 — Option B). */
export type ToolSectionKey = 'grow' | 'protect' | 'target' | 'business';

/** Input config for tools that reuse the existing CompoundInterestCalculator. */
export interface CompoundToolDefaults {
  readonly initialAmount: number;
  readonly amount: Record<SupportedLocale, number>;
  readonly cadence: Cadence;
  readonly years: number;
}

/** Input config for the Emergency Fund time-to-target calculator. */
export interface EmergencyFundDefaults {
  readonly monthlyExpenses: Record<SupportedLocale, number>;
  readonly monthlySavings: Record<SupportedLocale, number>;
  readonly targetMultiplier: number;
}

/** Input config for the Inflation Impact calculator (6D.1). */
export interface InflationImpactDefaults {
  readonly amount: Record<SupportedLocale, number>;
  readonly years: number;
}

/** Input config for the Time-to-Target calculator (6D.2). */
export interface TimeToTargetDefaults {
  readonly target: Record<SupportedLocale, number>;
  readonly initialAmount: Record<SupportedLocale, number>;
  readonly contribution: Record<SupportedLocale, number>;
  readonly cadence: Cadence;
}

/** Input config for the Currency Depreciation calculator (6D.3). */
export interface CurrencyDepreciationDefaults {
  readonly amount: Record<SupportedLocale, number>;
  readonly years: number;
}

/** Input config for the B2B Card Fee Savings calculator (6E.1). */
export interface CardFeesDefaults {
  readonly monthlyVolume: Record<SupportedLocale, number>;
  readonly processorFeeRate: Record<SupportedLocale, number>;
  readonly avgTransactionAmount: Record<SupportedLocale, number>;
}

/** Input config for the B2B Idle Cash Yield calculator (6E.2). */
export interface IdleCashDefaults {
  readonly idleCash: Record<SupportedLocale, number>;
  readonly years: number;
}

export interface ToolDescriptor {
  readonly key: ToolKey;
  readonly section: ToolSectionKey;
  readonly slug: string;
  readonly i18nNamespace: string;
  readonly icon:
    | 'compound'
    | 'retirement'
    | 'emergency'
    | 'goal'
    | 'inflation'
    | 'timeToTarget'
    | 'currencyDepreciation'
    | 'cardFees'
    | 'idleCash';
  readonly forBusiness: boolean;
}
