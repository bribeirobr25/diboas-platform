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
 * 4 Tier-1 (6C) + 3 Tier-2 (6D) + 2 Tier-3 B2B (6E) + 1 retrospective (Phase E) = 10 tools total.
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
  | 'idle-cash'
  | 'asset-history';

/** Section grouping shown on the /tools landing (per Q9 — Option B). */
export type ToolSectionKey = 'grow' | 'protect' | 'target' | 'business';

/** Input config for tools that reuse the existing CompoundInterestCalculator. */
export interface CompoundToolDefaults {
  readonly initialAmount: number;
  readonly amount: Record<SupportedLocale, number>;
  readonly cadence: Cadence;
  readonly years: number;
  /**
   * Per-locale slider ceiling for the recurring `amount` input (C6 close,
   * TOOLS_41_DEFECTS_FIX_PLAN.md §4.5, 2026-05-26). Pre-fix, the slider
   * topped out at 250 for ALL locales, making pt-BR retirement's default
   * R$2000 visually peg the slider to its right edge. This per-tool +
   * per-locale ceiling lets the slider visually represent the default
   * amount with headroom. Numeric input still accepts up to
   * INPUT_BOUNDS.amount.max (1B); this is the visible affordance only.
   */
  readonly recurringSliderMax: Record<SupportedLocale, number>;
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

/**
 * Asset codes for the Phase E asset-history tool. Re-exported from
 * `@/lib/market-data` so the tool type system is locale-aware without
 * coupling the marketing layer to the data layer's internal naming.
 */
export type AssetHistoryAssetKey =
  | 'BTC'
  | 'SP500'
  | 'QQQ'
  | 'MSCI_WORLD'
  | 'GOLD'
  | 'TLT'
  | 'IBOVESPA'
  | 'DAX';

// Phase E v2 (TOOLS_IMPROVEMENT.md, 2026-05-23): expanded from {2010, 2016} to
// the full 17-year range. 2010 floors at July (data start); 2011+ start in January.
export type AssetHistoryStartYear =
  | 2010
  | 2011
  | 2012
  | 2013
  | 2014
  | 2015
  | 2016
  | 2017
  | 2018
  | 2019
  | 2020
  | 2021
  | 2022
  | 2023
  | 2024
  | 2025
  | 2026;

export type AssetHistoryMode = 'lumpSum' | 'monthlyDca';

/** Input config for the Asset History calculator (Phase E, 2026-05-16). */
export interface AssetHistoryDefaults {
  readonly asset: Record<SupportedLocale, AssetHistoryAssetKey>;
  readonly startYear: AssetHistoryStartYear;
  readonly mode: AssetHistoryMode;
  /** Contribution amount per locale — applied to both lump-sum principal and monthly-DCA amount. */
  readonly contribution: Record<SupportedLocale, number>;
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
    | 'idleCash'
    | 'assetHistory';
  readonly forBusiness: boolean;
}
