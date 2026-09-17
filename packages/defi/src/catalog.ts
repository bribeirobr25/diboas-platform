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

import type { Chain, HorizonBand, ProtocolId, StrategyDef } from './types';

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

/**
 * `5.406` containment · **Product-owned network identity per execution leg.**
 *
 * The network a leg runs on is a PRODUCT fact. Before this it existed only as
 * provider search config (`POOL_MATCHERS[*].preferredChains`) and fixture data
 * (`FIXTURE_APYS[*].chain`) — so provider behaviour could define, or silently
 * mutate, Product identity. Founder/Strategy 2026-09-17 §2: *"explicit current
 * catalog / Product intent determines intended legacy leg network; provider data
 * must not define or mutate Product identity."*
 *
 * ⚑ SCOPE — NORMATIVE (Founder/Strategy 2026-09-17 §1). Current legacy-catalog
 * deployment identity used for Pre-I2 containment only. I-3 moves network identity
 * to each MoneyJobCandidate technical leg. This mapping must not be treated as a
 * protocol-global Product invariant.
 *
 * So this is NOT `ProtocolId -> exactly one canonical network forever`. Product
 * authority places network on the Candidate's technical leg
 * (`MoneyJobCandidate -> technicalLegs[] -> protocol, network`); the same protocol
 * may appear on different networks on different legs once I-3 lands. The name says
 * CURRENT_CATALOG for that reason.
 *
 * NOTHING IS INVENTED HERE. This file's own header already states it — *"stable
 * legs on Arbitrum, growth legs on Solana — the multi-chain canon"* — and both
 * pre-existing declarations agree with this map for all six protocols, which a
 * test asserts in both directions. Keyed on the closed `ProtocolId` union, so a
 * new protocol without a declared network is a COMPILE error, never a default.
 */
export const CURRENT_CATALOG_PROTOCOL_NETWORK: Record<ProtocolId, Chain> = {
  skySsr: 'Arbitrum',
  aaveV3: 'Arbitrum',
  compoundV3: 'Arbitrum',
  sanctumInf: 'Solana',
  jupiterJlp: 'Solana',
  jito: 'Solana',
};

/** Every distinct network a strategy's legs actually run on, in catalog order. */
export function candidateNetworks(strategy: StrategyDef): Chain[] {
  const seen: Chain[] = [];
  for (const leg of strategy.allocation) {
    const network = CURRENT_CATALOG_PROTOCOL_NETWORK[leg.protocolId];
    if (!seen.includes(network)) seen.push(network);
  }
  return seen;
}

/**
 * Does this Candidate span more than one network?
 *
 * The single materially governing predicate of the `5.406` containment: when it
 * is true, `StrategyDef.entryChain` cannot represent the Candidate, so the
 * whole-Candidate network cost is UNAVAILABLE and the single-network Path claim
 * is suppressed. Measured today: 5 of 10 strategies are true here, each holding
 * `skySsr` (Arbitrum) while declaring `entryChain: 'Solana'`.
 *
 * This is legacy CONTAINMENT, not the `MoneyJobCandidate` model — no per-leg
 * fee, route or bridge cost is derived from it (§1, §4).
 */
export function isMultiNetworkCandidate(strategy: StrategyDef): boolean {
  return candidateNetworks(strategy).length > 1;
}

export function getStrategy(id: string): StrategyDef | undefined {
  return STRATEGY_CATALOG.find((s) => s.id === id);
}
