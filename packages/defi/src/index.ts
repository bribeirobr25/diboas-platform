/**
 * @diboas/defi — DeFi domain package.
 *
 * MVP-0 (Sandbox) activation, 2026-07-18: strategy catalog (data, D-8),
 * provider interfaces, and the real DeFiLlama/CoinGecko providers with
 * documented fixture fallbacks. See docs/sandbox-app/ for the governing rules.
 */

export const DEFI_PACKAGE_VERSION = '0.2.0';

export * from './types';
export * from './catalog';
export * from './evidence';
export * from './evidenceIdentity';
export * from './evidenceCodec';
export * from './evidencePayload';
export * from './evidenceStore';
/* Test/fixture helpers — production must not import these (see testing.ts). */
export * from './testing';
export * from './provenance';
export * from './freshness';
export * from './methodology';
export * from './fixtures';
export { DefiLlamaApyProvider, POOL_MATCHERS, matchPool } from './providers/defillama';
export { CoinGeckoPriceProvider, COINGECKO_IDS } from './providers/coingecko';
export { FixtureGasProvider } from './providers/gas';
export {
  NETWORK_COST_NATIVE_UNIT,
  networkCostEvidence,
  networkCostEvidenceFor,
} from './providers/normalize';
