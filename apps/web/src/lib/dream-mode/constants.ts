/**
 * Dream Mode - Constants
 *
 * Configuration constants for Dream Mode calculations and display
 * Data sourced from DeFiLlama historical analysis (May 2022 - Dec 2025)
 */

import type { DreamPath, DreamTimeframe, PathConfig, RegionalDisclaimer } from './types';

/**
 * Bank comparison rate (ECB Statistics, December 2024)
 * Average EU savings account rate
 */
export const BANK_APY_RATE = 0.5; // 0.5% APY

/**
 * Bank rate sources by locale for CLO compliance
 * - EN (US): Federal Reserve
 * - DE/ES: European Central Bank
 * - PT-BR: Brazilian Central Bank
 */
export const BANK_RATE_SOURCES: Record<string, {
  rate: number;
  source: string;
  translationKey: string;
}> = {
  en: {
    rate: 0.45,
    source: 'Federal Reserve',
    translationKey: 'dreamMode.results.bank_source_us',
  },
  de: {
    rate: 0.5,
    source: 'ECB Statistics',
    translationKey: 'dreamMode.results.bank_source_eu',
  },
  es: {
    rate: 0.5,
    source: 'ECB Statistics',
    translationKey: 'dreamMode.results.bank_source_eu',
  },
  'pt-BR': {
    rate: 6.5,  // Brazilian Selic-based savings rate
    source: 'Banco Central do Brasil',
    translationKey: 'dreamMode.results.bank_source_br',
  },
} as const;

/**
 * ECB source citation for CLO compliance (legacy, kept for compatibility)
 */
export const ECB_SOURCE_CITATION = {
  rate: BANK_APY_RATE,
  source: 'ECB Statistics',
  date: 'December 2024',
  url: 'https://www.ecb.europa.eu/stats/',
} as const;

/**
 * Timeframe configurations in days
 */
export const TIMEFRAME_DAYS: Record<DreamTimeframe, number> = {
  '1_week': 7,
  '1_month': 30,
  '1_year': 365,
  '5_years': 1825,
} as const;

/**
 * Path icon configuration
 * Uses icon type identifiers that map to professional SVG icons
 */
export const PATH_ICONS: Record<DreamPath, 'shield' | 'balance' | 'rocket'> = {
  safety: 'shield',
  balance: 'balance',
  growth: 'rocket',
} as const;

/**
 * Path color configuration (for UI)
 */
export const PATH_COLORS: Record<DreamPath, { primary: string; secondary: string }> = {
  safety: { primary: '#3B82F6', secondary: '#60A5FA' },   // Blue
  balance: { primary: '#8B5CF6', secondary: '#A78BFA' },  // Purple
  growth: { primary: '#EF4444', secondary: '#F87171' },   // Red
} as const;

/**
 * Path configurations with APY rates
 * Safety First = 7%, Balanced Growth = 12%, Maximum Growth = 18%
 */
export const PATH_CONFIGS: Record<DreamPath, PathConfig> = {
  safety: {
    id: 'safety',
    icon: 'shield',
    avgApy: 7.0,  // 7% APY for Safety First
    maxDrawdown: 0.0,
    probabilityOfLoss: 0.5,
    strategies: [1, 3, 5, 7, 9],
    projections: {
      '1_week': { multiplier: 1.00134 },   // ~7% APY weekly
      '1_month': { multiplier: 1.00565 },  // ~7% APY monthly
      '1_year': { multiplier: 1.07 },      // 7% APY annually
      '5_years': { multiplier: 1.4026 },   // 7% compounded 5 years
    },
  },
  balance: {
    id: 'balance',
    icon: 'balance',
    avgApy: 12.0,  // 12% APY for Balanced Growth
    maxDrawdown: 15.0,
    probabilityOfLoss: 20.0,
    strategies: [2, 4, 6],
    projections: {
      '1_week': { multiplier: 1.0022 },    // ~12% APY weekly
      '1_month': { multiplier: 1.0095 },   // ~12% APY monthly
      '1_year': { multiplier: 1.12 },      // 12% APY annually
      '5_years': { multiplier: 1.7623 },   // 12% compounded 5 years
    },
  },
  growth: {
    id: 'growth',
    icon: 'rocket',
    avgApy: 18.0,  // 18% APY for Maximum Growth
    maxDrawdown: 30.0,
    probabilityOfLoss: 35.0,
    strategies: [8, 10],
    warning: 'Higher volatility expected with growth strategies',
    projections: {
      '1_week': { multiplier: 1.0032 },    // ~18% APY weekly
      '1_month': { multiplier: 1.0139 },   // ~18% APY monthly
      '1_year': { multiplier: 1.18 },      // 18% APY annually
      '5_years': { multiplier: 2.2878 },   // 18% compounded 5 years
    },
  },
} as const;

/**
 * Regional disclaimer configuration for CLO compliance
 */
export const REGIONAL_DISCLAIMERS: Record<string, RegionalDisclaimer> = {
  EU: {
    region: 'EU',
    primaryKey: 'dreamMode.disclaimer.body',
    cardKey: 'dreamMode.disclaimer.card',
  },
  US: {
    region: 'US',
    primaryKey: 'dreamMode.disclaimer.body',
    enhancedKey: 'dreamMode.disclaimer.enhanced.us',
    cardKey: 'dreamMode.disclaimer.card',
  },
  BRAZIL: {
    region: 'BRAZIL',
    primaryKey: 'dreamMode.disclaimer.body',
    enhancedKey: 'dreamMode.disclaimer.enhanced.brazil',
    cardKey: 'dreamMode.disclaimer.card',
  },
} as const;

/**
 * Amount slider configuration
 * Per CMO v2 spec: min €50, max €10,000, step €10, default €500
 */
export const AMOUNT_SLIDER_CONFIG = {
  min: 50,
  max: 10000,
  step: 10,
  default: 500,
  currency: '€',
} as const;

/**
 * Dream Mode analytics events
 */
export const DREAM_MODE_EVENTS = {
  STARTED: 'dream_mode_started',
  DISCLAIMER_ACCEPTED: 'dream_disclaimer_accepted',
  PATH_SELECTED: 'dream_path_selected',
  AMOUNT_SET: 'dream_amount_set',
  TIMEFRAME_CHANGED: 'dream_timeframe_changed',
  SIMULATION_STARTED: 'dream_simulation_started',
  SIMULATION_COMPLETED: 'dream_simulation_completed',
  SHARE_INITIATED: 'dream_share_initiated',
  SHARE_COMPLETED: 'dream_share_completed',
  CARD_DOWNLOADED: 'dream_card_downloaded',
  LINK_COPIED: 'dream_link_copied',
  PATH_RETRY: 'dream_path_retry',
  COMPLETED: 'dream_mode_completed',
} as const;

/**
 * Session storage keys for CLO compliance
 */
export const STORAGE_KEYS = {
  DISCLAIMER_ACCEPTED: 'dream_disclaimer_accepted',
  DISCLAIMER_TIMESTAMP: 'dream_disclaimer_timestamp',
  SELECTED_PATH: 'dream_selected_path',
} as const;
