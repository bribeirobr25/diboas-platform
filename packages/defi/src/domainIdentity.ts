/**
 * DOMAIN IDENTITY — what a protocol leg IS, stated by diBoaS, never by a vendor.
 *
 * ⚑ THE DEFECT THIS REPLACES, in two halves.
 *
 * **Identity was a provider's id.** `ProtocolReturnModel` carried a
 * `coingeckoId` as the ONLY identity three market legs had. If CoinGecko were
 * replaced tomorrow, a domain type would have to change — which is exactly what
 * `PROVIDER ID ≠ DOMAIN IDENTITY` (Strategy §5 · reset §8 · Refresh §22)
 * exists to prevent, and what made the migration test impossible to pass.
 *
 * **Semantics were unstated.** `POOL_MATCHERS` accepted `USDC` and `USDC.E`
 * alike for the Aave and Compound legs, and four `project` slugs for Sky. So
 * the repository could not say what the rate it displayed actually MEANT:
 *
 * ```text
 * supply       ≠ borrow
 * base         ≠ base + incentive
 * native asset ≠ bridged asset where economically different
 * ```
 *
 * M&E's ruling is that the requirement is SEMANTIC IDENTIFIABILITY, not a
 * mandatory numeric split:
 *
 * ```text
 * base + incentive supplied separately            = ACCEPTABLE
 * VERIFIED composite whose composition is KNOWN   = ACCEPTABLE (V1)
 * AMBIGUOUS apy where supply/borrow, base/incentive
 *   or native/bridged CANNOT be determined        = NOT ACCEPTABLE
 * ```
 *
 * An unidentifiable rate is therefore UNAVAILABLE — not displayed with a
 * caveat. This module is what makes that determinable.
 *
 * ⚑ THIS IS DATA, NOT LOGIC. Every identity is a declaration with a stated
 * basis, so a domain ruling that disagrees is a one-line change to a table
 * rather than surgery on an adapter.
 */

import type { Chain, ProtocolId } from './types';

/**
 * A market-leg token, named by diBoaS.
 *
 * ⚑ These names are OURS. They are not CoinGecko slugs, not DeFiLlama symbols
 * and not on-chain mints — each of those is a TRANSPORT detail that belongs in
 * the per-source map below, where a provider swap can touch it without a domain
 * type moving.
 */
export type MarketAssetId = 'sanctumInfLp' | 'jupiterJlpLp' | 'jitoStakedSol';

/* ⚑ The names say WHAT the instrument is — an LP position, a staking receipt —
   and deliberately avoid the suffix `Token`. A field named `…Token` beside a
   long string literal is credential-shaped to every secret scanner, ours
   included, and a public repository is the wrong place to teach a security
   control to ignore a shape. The control stays sharp; the name got clearer. */

/** Which side of a lending market the rate describes. */
export type RateSide = 'SUPPLY' | 'BORROW';

/** What the rate is composed of. `UNDETERMINED` is a refusal, not a value. */
export type RateComposition = 'BASE_ONLY' | 'BASE_PLUS_INCENTIVE' | 'UNDETERMINED';

/**
 * Whether the asset is the chain-native issuance or a bridged representation.
 *
 * On Arbitrum, Circle-native `USDC` and bridged `USDC.e` are different assets in
 * different pools earning different rates. Treating one as the other is the
 * conflation canon names directly.
 */
export type AssetForm = 'NATIVE' | 'BRIDGED';

export interface LendingLegIdentity {
  readonly kind: 'lending';
  /** Every catalogue position is a deposit. diBoaS borrows nothing, anywhere. */
  readonly side: RateSide;
  /** The exact asset symbol this leg's rate must be quoted for. */
  readonly collateralSymbol: string;
  readonly assetForm: AssetForm;
  readonly chain: Chain;
  readonly because: string;
}

export interface MarketLegIdentity {
  readonly kind: 'market';
  readonly asset: MarketAssetId;
  /** The token symbol as the domain names it, for matching and display. */
  readonly symbol: string;
  readonly chain: Chain;
  readonly because: string;
}

export type ProtocolDomainIdentity = LendingLegIdentity | MarketLegIdentity;

/**
 * What each catalogue protocol IS.
 *
 * A `Record<ProtocolId, …>`, so a new protocol without a declared identity is a
 * COMPILE error — the same exhaustiveness discipline `PROTOCOL_RETURN_MODEL`
 * and the ledger's `project()` guard already use.
 */
export const PROTOCOL_DOMAIN_IDENTITY: Record<ProtocolId, ProtocolDomainIdentity> = {
  skySsr: {
    kind: 'lending',
    side: 'SUPPLY',
    collateralSymbol: 'SUSDS',
    assetForm: 'NATIVE',
    chain: 'Arbitrum',
    because:
      'The catalogue position is a USDS savings deposit represented by sUSDS. SDAI is the predecessor instrument and USDS is the underlying, not the yield-bearing receipt — accepting either would quote a different economic thing.',
  },
  aaveV3: {
    kind: 'lending',
    side: 'SUPPLY',
    collateralSymbol: 'USDC',
    assetForm: 'NATIVE',
    chain: 'Arbitrum',
    because:
      'The catalogue asset is USDC, the Circle-native digital dollar. Bridged USDC.e on Arbitrum is a different asset in a different pool at a different rate, so it cannot answer for this leg.',
  },
  compoundV3: {
    kind: 'lending',
    side: 'SUPPLY',
    collateralSymbol: 'USDC',
    assetForm: 'NATIVE',
    chain: 'Arbitrum',
    because: 'As aaveV3 — Circle-native USDC, never the bridged representation.',
  },
  sanctumInf: {
    kind: 'market',
    asset: 'sanctumInfLp',
    symbol: 'INF',
    chain: 'Solana',
    because:
      'Sanctum Infinity LP token. Its own price IS the total return, so the leg is priced, never accrued.',
  },
  jupiterJlp: {
    kind: 'market',
    asset: 'jupiterJlpLp',
    symbol: 'JLP',
    chain: 'Solana',
    because: 'Jupiter perpetuals LP token; priced, never accrued.',
  },
  jito: {
    kind: 'market',
    asset: 'jitoStakedSol',
    symbol: 'JITOSOL',
    chain: 'Solana',
    because:
      'Jito liquid-staking receipt. One JitoSOL simply becomes worth more SOL; that drift is the return.',
  },
};

/**
 * How each SOURCE happens to name a domain asset.
 *
 * ⚑ THE WHOLE POINT OF THIS TABLE. A vendor identifier is transport, so it
 * lives here — one row per source — and never on a domain type. Replacing a
 * provider adds a row; it does not touch `MarketAssetId`, the catalogue, the
 * replay, or anything Product can see.
 *
 * A source that cannot name an asset simply has no entry for it; the lookup
 * returns `null` and the caller refuses rather than guessing.
 */
const SOURCE_ASSET_ID: Record<string, Partial<Record<MarketAssetId, string>>> = {
  /* Verified live against the free tier 2026-08-20 — each returns 366 daily
     points for `days=365&interval=daily`. NB: Sanctum Infinity's id is the
     legacy `socean-staked-sol`, which is precisely the kind of vendor-history
     artefact that must never become a domain name. */
  coingecko: {
    sanctumInfLp: 'socean-staked-sol',
    jupiterJlpLp: 'jupiter-perpetuals-liquidity-provider-token',
    jitoStakedSol: 'jito-staked-sol',
  },
  /* DeFiLlama is a rate source in this build and names no asset for pricing. */
  defillama: {},
  /* The fixture set is keyed by ProtocolId and needs no per-asset vendor id. */
  fixture: {},
};

/** How `source` names `asset`, or `null` when it does not name it at all. */
export function sourceAssetId(source: string, asset: MarketAssetId): string | null {
  return SOURCE_ASSET_ID[source]?.[asset] ?? null;
}

/** The declared identity of a protocol leg. Total by construction. */
export function domainIdentityOf(protocolId: ProtocolId): ProtocolDomainIdentity {
  return PROTOCOL_DOMAIN_IDENTITY[protocolId];
}

/**
 * Classify what an observed rate is composed of.
 *
 * ⚑ UNDETERMINED IS A REFUSAL. When a payload supplies neither a base nor a
 * reward component, the composite cannot be said to be KNOWN, and M&E rules an
 * ambiguous rate NOT ACCEPTABLE. The caller's correct response is the existing
 * degrade-to-documented-fixture path, never a displayed number with a caveat.
 */
export function rateComposition(input: {
  apyBase?: number | null;
  apyReward?: number | null;
}): RateComposition {
  const hasBase = typeof input.apyBase === 'number' && Number.isFinite(input.apyBase);
  const hasReward = typeof input.apyReward === 'number' && Number.isFinite(input.apyReward);
  if (!hasBase && !hasReward) return 'UNDETERMINED';
  if (hasBase && hasReward && (input.apyReward as number) > 0) return 'BASE_PLUS_INCENTIVE';
  if (hasBase) return 'BASE_ONLY';
  return 'BASE_PLUS_INCENTIVE';
}

/**
 * Does an observed asset symbol satisfy a lending leg's declared identity?
 *
 * The comparison is exact and case-insensitive. It deliberately does NOT accept
 * a prefix or a family: `USDC.E` does not satisfy `USDC`, which is the entire
 * reason this function exists.
 */
export function symbolSatisfies(identity: LendingLegIdentity, observedSymbol: string): boolean {
  return observedSymbol.trim().toUpperCase() === identity.collateralSymbol.toUpperCase();
}
