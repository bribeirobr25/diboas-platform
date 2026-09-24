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
export * from './evidenceRetention';
/* Test/fixture helpers — production must not import these (see testing.ts). */
export * from './testing';
export * from './provenance';
export * from './freshness';
export * from './freshnessPolicy';
export * from './currentFacing';
export * from './rateAvailability';
export * from './methodology';
export * from './fixtures';
export { DefiLlamaApyProvider, POOL_MATCHERS, matchPool } from './providers/defillama';
export { CoinGeckoPriceProvider, COINGECKO_IDS } from './providers/coingecko';
/**
 * ⚑ EXACTLY WHAT CROSSES THE PACKAGE BOUNDARY, AND NOTHING ELSE.
 *
 * The provider-safety modules are consumed INSIDE this package by relative
 * import (the two adapters and the fallback-only ports). Only these three
 * symbols have a consumer outside it — `apps/sandbox/src/lib/market/factory.ts`
 * — so only these three are re-exported.
 *
 * A first draft of this block also exported `SOURCE_DISPOSITIONS`,
 * `permitsUse`, `fallbackFor` and four of their types. Measured: zero consumers
 * outside the barrel line itself. They are deleted rather than kept, under the
 * standing ruling that unused production exports are not kept for future
 * possibility, and the repository's own rule that an unconsumed barrel entry is
 * dead code. The modules still export them; the PACKAGE does not advertise
 * them.
 */
export { FallbackOnlyApyProvider, FallbackOnlyPriceProvider } from './providers/fallbackOnly';
export { isSourceUsable } from './providerDisposition';
/**
 * Block D · the persistable lane is a DECLARED RIGHT, and `apps/sandbox`'s
 * ingestion eligibility is its one consumer outside this package. Only the
 * predicate crosses — the rights table and its rationale stay internal, the
 * same discipline the provider-safety modules follow.
 */
export { mayPersistNormalized } from './sourcePersistenceRights';
/**
 * `5.444` · the catalogue's evidence question. `apps/sandbox`'s rate blend is its
 * consumer outside this package; the requirement TYPE and the resolver stay internal,
 * so Product asks the predicate and never re-derives the mapping.
 */
export { legRequiresCurrentRate } from './catalogueEvidence';
export { FixtureGasProvider } from './providers/gas';
export {
  NETWORK_COST_NATIVE_UNIT,
  networkCostEvidence,
  networkCostEvidenceFor,
} from './providers/normalize';
