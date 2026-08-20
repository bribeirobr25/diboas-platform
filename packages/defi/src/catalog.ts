/**
 * The strategy catalog — strategies as DATA (decision D-8, docs/sandbox-app).
 *
 * Seeded verbatim from the live product canon (`packages/i18n/translations/en/
 * strategies.json`, 2026-07-18): 10 strategies, each a weighted blend of the
 * 6 execution protocols (stable legs on Arbitrum, growth legs on Solana —
 * the multi-chain canon). Allocations and growth exposures are the shipped
 * figures; do not invent variants (anti-slop: no fabricated product claims).
 *
 * D-8 note: this set is NOT frozen — the founder may redesign it through
 * Sandbox use. Change it HERE (+ app i18n), never in components.
 */

import type { HorizonBand, StrategyDef } from './types';

export const STRATEGY_CATALOG: StrategyDef[] = [
  {
    id: 'safeHarbor',
    i18nKey: 'safeHarbor',
    icon: 'shield-check',
    horizonBands: ['anytime', 'short'],
    riskBand: 'stable',
    growthExposurePercent: 0,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 50 },
      { protocolId: 'aaveV3', weightPercent: 30 },
      { protocolId: 'compoundV3', weightPercent: 20 },
    ],
    entryChain: 'Arbitrum',
  },
  {
    id: 'stableGrowth',
    i18nKey: 'stableGrowth',
    icon: 'sprout',
    horizonBands: ['anytime', 'medium'],
    riskBand: 'growth',
    growthExposurePercent: 30,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 70 },
      { protocolId: 'sanctumInf', weightPercent: 30 },
    ],
    entryChain: 'Solana',
  },
  {
    id: 'goalKeeper',
    i18nKey: 'goalKeeper',
    icon: 'target',
    horizonBands: ['short'],
    riskBand: 'stable',
    growthExposurePercent: 0,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 60 },
      { protocolId: 'aaveV3', weightPercent: 25 },
      { protocolId: 'compoundV3', weightPercent: 15 },
    ],
    entryChain: 'Arbitrum',
  },
  {
    id: 'steadyProgress',
    i18nKey: 'steadyProgress',
    icon: 'trending-up',
    horizonBands: ['short'],
    riskBand: 'growth',
    growthExposurePercent: 35,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 65 },
      { protocolId: 'sanctumInf', weightPercent: 35 },
    ],
    entryChain: 'Solana',
  },
  {
    id: 'patientBuilder',
    i18nKey: 'patientBuilder',
    icon: 'clock',
    horizonBands: ['medium'],
    riskBand: 'stable',
    growthExposurePercent: 0,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 50 },
      { protocolId: 'aaveV3', weightPercent: 30 },
      { protocolId: 'compoundV3', weightPercent: 20 },
    ],
    entryChain: 'Arbitrum',
  },
  {
    id: 'balancedBuilder',
    i18nKey: 'balancedBuilder',
    icon: 'bar-chart',
    horizonBands: ['medium'],
    riskBand: 'growth',
    growthExposurePercent: 40,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 60 },
      { protocolId: 'sanctumInf', weightPercent: 25 },
      { protocolId: 'jupiterJlp', weightPercent: 15 },
    ],
    entryChain: 'Solana',
  },
  {
    id: 'steadyCompounder',
    i18nKey: 'steadyCompounder',
    icon: 'repeat',
    horizonBands: ['long'],
    riskBand: 'stable',
    growthExposurePercent: 0,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 55 },
      { protocolId: 'aaveV3', weightPercent: 30 },
      { protocolId: 'compoundV3', weightPercent: 15 },
    ],
    entryChain: 'Arbitrum',
  },
  {
    id: 'wealthAccelerator',
    i18nKey: 'wealthAccelerator',
    icon: 'fast-forward',
    horizonBands: ['long'],
    riskBand: 'growth',
    growthExposurePercent: 70,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 30 },
      { protocolId: 'sanctumInf', weightPercent: 35 },
      { protocolId: 'jupiterJlp', weightPercent: 35 },
    ],
    entryChain: 'Solana',
  },
  {
    id: 'fullHarvest',
    i18nKey: 'fullHarvest',
    icon: 'wallet',
    horizonBands: ['wealth'],
    riskBand: 'stable',
    growthExposurePercent: 0,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 45 },
      { protocolId: 'aaveV3', weightPercent: 35 },
      { protocolId: 'compoundV3', weightPercent: 20 },
    ],
    entryChain: 'Arbitrum',
  },
  {
    id: 'fullThrottle',
    i18nKey: 'fullThrottle',
    icon: 'zap',
    horizonBands: ['wealth'],
    riskBand: 'growth',
    growthExposurePercent: 85,
    allocation: [
      { protocolId: 'skySsr', weightPercent: 15 },
      { protocolId: 'sanctumInf', weightPercent: 30 },
      { protocolId: 'jupiterJlp', weightPercent: 35 },
      { protocolId: 'jito', weightPercent: 20 },
    ],
    entryChain: 'Solana',
  },
];

/**
 * Guidance WITHOUT advising (SANDBOX_RULES R-3; CLO §10 Q-A):
 * an OBJECTIVE horizon filter and nothing else. Returns every strategy whose
 * declared horizon bands include the goal's band, in catalog order — no
 * scoring, no "recommended" flag, no default selection. The UI must render
 * the full result and let the user pick.
 */
export function strategiesForHorizon(band: HorizonBand): StrategyDef[] {
  return STRATEGY_CATALOG.filter(
    (s) => s.horizonBands.includes(band) || s.horizonBands.includes('anytime')
  );
}

/** Map a goal length in months to its horizon band (the copy's own bands). */
export function horizonBandForMonths(months: number): HorizonBand {
  if (months < 24) return 'short';
  if (months < 60) return 'medium';
  if (months < 120) return 'long';
  return 'wealth';
}

export function getStrategy(id: string): StrategyDef | undefined {
  return STRATEGY_CATALOG.find((s) => s.id === id);
}
