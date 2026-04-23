/**
 * PreDream Domain Types
 *
 * Type definitions for the PreDream simulation within the Demo flow
 * Uses extended timeframes (1/3/5/10 years) with monthly contributions
 */

/** Investment path options - same as DreamMode */
export type PreDreamPath = 'safety' | 'balance' | 'growth';

/** PreDream timeframe options (1/3/5/10 years) */
export type PreDreamTimeframe = '1year' | '3years' | '5years' | '10years';

/** PreDream screen flow */
export type PreDreamScreen =
  | 'disclaimer'
  | 'welcome'
  | 'pathSelect'
  | 'input'
  | 'timeframe'
  | 'simulation'
  | 'results';

/** Path configuration for PreDream */
export interface PreDreamPathConfig {
  readonly id: PreDreamPath;
  readonly apy: number;
}

/** Timeframe configuration */
export interface PreDreamTimeframeConfig {
  readonly label: string;
  readonly days: number;
  readonly months: number;
  readonly years: number;
}

/** PreDream calculation result */
export interface PreDreamResult {
  readonly totalInvestment: number;
  readonly defiBalance: number;
  readonly defiInterest: number;
  readonly bankBalance: number;
  readonly bankInterest: number;
  readonly difference: number;
  readonly growthPercentage: number;
  readonly pathApy: number;
  readonly bankApy: number;
  /** Estimated USD equivalent (only for currency-hedge locales) */
  readonly diboasYieldBalance?: number;
}
