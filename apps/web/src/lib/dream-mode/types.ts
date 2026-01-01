/**
 * Dream Mode - Types
 *
 * Type definitions for the Dream Mode domain
 * Following DDD principles - isolated domain types
 */

/**
 * Investment path options
 * - safety: Minimal risk, stablecoin-focused
 * - balance: Medium risk, mixed allocation
 * - growth: Higher risk, crypto-heavy
 */
export type DreamPath = 'safety' | 'balance' | 'growth';

/**
 * Regional disclaimer types for CLO compliance
 * - EU: Standard European disclaimer
 * - US: Enhanced SEC-compliant disclaimer
 * - BRAZIL: BCB-compliant disclaimer
 */
export type DisclaimerRegion = 'EU' | 'US' | 'BRAZIL';

/**
 * Dream Mode timeframe options
 */
export type DreamTimeframe = '1_week' | '1_month' | '1_year' | '5_years';

/**
 * Path projection data for a specific timeframe
 */
export interface PathProjection {
  /** Growth multiplier (e.g., 1.095 = 9.5% growth) */
  multiplier: number;
}

/**
 * Configuration for a single investment path
 */
export interface PathConfig {
  /** Path identifier */
  id: DreamPath;
  /** Display icon emoji */
  icon: string;
  /** Average annual percentage yield */
  avgApy: number;
  /** Maximum drawdown percentage (historical) */
  maxDrawdown: number;
  /** Probability of loss percentage (historical) */
  probabilityOfLoss: number;
  /** Strategy IDs included in this path */
  strategies: number[];
  /** Warning message for high-risk paths */
  warning?: string;
  /** Growth projections by timeframe */
  projections: Record<DreamTimeframe, PathProjection>;
}

/**
 * Dream Mode configuration data structure
 */
export interface DreamModeData {
  /** Data version for cache invalidation */
  version: string;
  /** When the data was generated */
  generatedAt: string;
  /** Data source information */
  dataSources: {
    apyData: {
      source: string;
      period: string;
    };
    bankComparison: {
      rate: number;
      source: string;
      date: string;
    };
  };
  /** Path configurations */
  paths: Record<DreamPath, PathConfig>;
  /** Disclaimer texts */
  disclaimers: {
    simulation: string;
    risk: string;
    cardWatermark: string;
  };
}

/**
 * Regional disclaimer content
 */
export interface RegionalDisclaimer {
  /** Region identifier */
  region: DisclaimerRegion;
  /** Primary disclaimer i18n key */
  primaryKey: string;
  /** Enhanced disclaimer i18n key (for US/Brazil) */
  enhancedKey?: string;
  /** Card disclaimer i18n key */
  cardKey: string;
}

/**
 * Growth calculation result
 */
export interface GrowthResult {
  /** Final balance after growth */
  finalBalance: number;
  /** Starting amount */
  startAmount: number;
  /** Absolute growth amount */
  growthAmount: number;
  /** Growth percentage */
  growthPercentage: number;
  /** Path used for calculation */
  path: DreamPath;
  /** Timeframe used */
  timeframe: DreamTimeframe;
}

/**
 * Bank comparison result
 */
export interface BankComparisonResult {
  /** Bank final balance */
  bankBalance: number;
  /** DeFi final balance */
  defiBalance: number;
  /** Difference (DeFi - Bank) */
  difference: number;
  /** Bank rate used */
  bankRate: number;
  /** Source citation */
  source: string;
}
