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
 * The 4 Tier-1 tools shipped in 6C.
 * Tier-2/3 tools (inflation, time-to-target, currency-depreciation,
 * card-fees, idle-cash) extend this union in 6D and 6E.
 */
export type ToolKey =
  | 'compound-interest'
  | 'retirement'
  | 'emergency-fund'
  | 'goal-savings';

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

export interface ToolDescriptor {
  readonly key: ToolKey;
  readonly section: ToolSectionKey;
  readonly slug: string;
  readonly i18nNamespace: string;
  readonly icon: 'compound' | 'retirement' | 'emergency' | 'goal';
  readonly forBusiness: boolean;
}
