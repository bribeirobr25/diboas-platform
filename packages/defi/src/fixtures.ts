/**
 * Documented fixture values — the fail-open fallback layer for every provider
 * (Principle 7: never crash; degrade honestly). Every fixture carries the
 * `fixture` stamp so the UI can show its provenance (Data Vintage Policy):
 * fixtures are NEVER silently blended with live data.
 *
 * Sources (documented 2026-07-18):
 * - APYs: midpoints of the shipped per-strategy "typical annual return" ranges
 *   in `strategies.json` (protocol-level estimates consistent with that copy).
 * - Prices: order-of-magnitude placeholders for offline dev ONLY — the price
 *   provider is expected to reach CoinGecko in any networked environment.
 * - Gas: typical values researched for the PreDemo fee-display work
 *   (`apps/web/src/lib/pre-demo/feeRateDisplay.ts` lineage): sub-cent Solana,
 *   cents-level Arbitrum, dollars-level Ethereum L1 / Bitcoin.
 */

import type { AssetId, Chain, DataStamp, ProtocolApy, ProtocolId } from './types';

export const FIXTURE_AS_OF = '2026-07-18';

const stamp: DataStamp = { source: 'fixture', asOf: FIXTURE_AS_OF };

export const FIXTURE_APYS: Record<ProtocolId, Omit<ProtocolApy, 'protocolId'>> = {
  skySsr: { apyPercent: 6.5, tvlUsd: null, chain: 'Arbitrum', stamp },
  aaveV3: { apyPercent: 5.2, tvlUsd: null, chain: 'Arbitrum', stamp },
  compoundV3: { apyPercent: 4.8, tvlUsd: null, chain: 'Arbitrum', stamp },
  sanctumInf: { apyPercent: 8.5, tvlUsd: null, chain: 'Solana', stamp },
  jupiterJlp: { apyPercent: 14.0, tvlUsd: null, chain: 'Solana', stamp },
  jito: { apyPercent: 7.5, tvlUsd: null, chain: 'Solana', stamp },
};

/** Offline-dev placeholders only (USD). BRL/EUR derive via fixture FX below. */
export const FIXTURE_PRICES_USD: Record<AssetId, number> = {
  BTC: 60000,
  ETH: 2500,
  SOL: 140,
  SUI: 0.8,
  USDC: 1,
  XAUT: 2400,
};

/** Fixture FX for offline dev (documented placeholders, not market claims). */
export const FIXTURE_FX_FROM_USD: Record<'USD' | 'BRL' | 'EUR', number> = {
  USD: 1,
  BRL: 5.5,
  EUR: 0.92,
};

export const FIXTURE_GAS_USD: Record<Chain, number> = {
  Solana: 0.001,
  Arbitrum: 0.03,
  Ethereum: 2.5,
  Bitcoin: 1.8,
  Sui: 0.002,
};
