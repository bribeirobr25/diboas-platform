/**
 * @diboas/defi — shared types for protocol data, the strategy catalog, and
 * the data-provider interfaces (Principle 3: service-agnostic abstraction).
 *
 * Every provider is an interface first; the Sandbox consumes interfaces only,
 * so swapping fixture → live → paid-tier is a provider change, never a rewrite.
 */

/** Chains the Phase-2 architecture executes on (per the platform handover). */
export type Chain = 'Arbitrum' | 'Solana' | 'Ethereum' | 'Bitcoin' | 'Sui';

/** The six execution protocols behind the strategy catalog (strategies.json canon). */
export type ProtocolId = 'skySsr' | 'aaveV3' | 'compoundV3' | 'sanctumInf' | 'jupiterJlp' | 'jito';

/** Assets in scope (CEO asset-scope decision). */
export type AssetId = 'BTC' | 'ETH' | 'SOL' | 'SUI' | 'USDC' | 'XAUT';

/** Display currencies per market (locale→currency map lives app-side). */
export type DisplayCurrency = 'USD' | 'BRL' | 'EUR';

/**
 * Honesty stamp carried by every piece of displayed data (Data Vintage Policy):
 * where a number came from and when it was fetched. `fixture` marks the
 * documented fallback values — never silently blended with live data.
 */
export interface DataStamp {
  source: 'defillama' | 'coingecko' | 'fixture';
  /** ISO timestamp of the fetch (or the fixture's documentation date). */
  asOf: string;
}

export interface ProtocolApy {
  protocolId: ProtocolId;
  /** Current APY in percent (e.g. 6.2 means 6.2%/yr). */
  apyPercent: number;
  /** Total value locked in USD, when known (display only). */
  tvlUsd: number | null;
  /** The chain of the matched pool (may differ from the preferred chain — shown honestly). */
  chain: Chain;
  stamp: DataStamp;
}

/** One point of an APY history series (per pool, daily granularity from DeFiLlama /chart). */
export interface ApyPoint {
  /** ISO date (day precision). */
  date: string;
  apyPercent: number;
}

export interface ProtocolApyHistory {
  protocolId: ProtocolId;
  points: ApyPoint[];
  stamp: DataStamp;
}

export interface PriceQuote {
  assetId: AssetId;
  /** Price in the given display currency. */
  currency: DisplayCurrency;
  price: number;
  stamp: DataStamp;
}

export interface GasQuote {
  chain: Chain;
  /** Typical network fee for one transaction, expressed in USD for display. */
  typicalFeeUsd: number;
  stamp: DataStamp;
}

/** Horizon bands, matching the strategy copy ("under 2 years", "2–5", "5–10", "10+"). */
export type HorizonBand = 'anytime' | 'short' | 'medium' | 'long' | 'wealth';

/** Risk bands as the catalog states them (stable-only vs growth exposure). */
export type RiskBand = 'stable' | 'growth';

export interface AllocationLeg {
  protocolId: ProtocolId;
  /** Weight in percent; legs of a strategy sum to 100. */
  weightPercent: number;
}

/**
 * A catalog strategy — DATA, not code (decision D-8). Adding/renaming/retiring
 * a strategy is a catalog + i18n change only.
 */
export interface StrategyDef {
  id: string;
  /** i18n key under `catalog.strategies.<key>` in the app messages. */
  i18nKey: string;
  horizonBands: HorizonBand[];
  riskBand: RiskBand;
  /** Lucide icon token for the catalog row (presentation data, never a claim). */
  icon: string;
  /** Growth exposure in percent (0 for stable-only). */
  growthExposurePercent: number;
  allocation: AllocationLeg[];
  /** Which chain the entry transaction is anchored on (for the gas line). */
  entryChain: Chain;
}

// ── Provider interfaces (the swap seam) ──────────────────────────────────────

export interface IApyProvider {
  getCurrentApys(protocolIds: ProtocolId[]): Promise<ProtocolApy[]>;
  getApyHistory(protocolId: ProtocolId, days: number): Promise<ProtocolApyHistory>;
}

export interface IPriceProvider {
  getPrices(assetIds: AssetId[], currency: DisplayCurrency): Promise<PriceQuote[]>;
}

export interface IGasProvider {
  getGas(chain: Chain): Promise<GasQuote>;
}

/**
 * THE ruled sandbox market-data refresh bound (founder 2026-08-19, P2BD-14):
 * every externally-fetched market value (APYs, pools, prices, history)
 * refreshes at most every 6 hours — free-tier protection at visitor scale.
 * Real-time is the REAL app's property (paid APIs via the analytics serving
 * layer). One constant, consumed by every provider cache; pinned by test.
 */
export const SANDBOX_MARKET_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * How a protocol leg's return is REPLAYED (§4.8 G8 price overlay).
 *
 * Two rules, and the distinction is load-bearing rather than cosmetic:
 *
 * - `lending` — USDC lending (Sky/Aave/Compound). The token is a dollar, so it
 *   has no price dimension: the APY series IS the whole return. Replay APY.
 *
 * - `market` — liquid-staking and LP tokens (JitoSOL, Sanctum INF, Jupiter
 *   JLP). **The token's price already IS the total return**, so the price
 *   series is replayed and NOTHING is added on top. An LST does not pay
 *   interest in new tokens; one JitoSOL simply becomes worth more SOL, and
 *   that drift is exactly what DeFiLlama reports as its "APY". Replaying the
 *   APY *and* the token price would therefore count the staking yield twice.
 *   The fix is not to subtract it back out — it is to not add it.
 *
 * This is what lets a growth position FALL. Before it existed the sandbox
 * could only ever replay APY, which is non-negative, so practice money could
 * only ever go up — the most dangerous lesson a practice app can teach.
 */
export type ProtocolReturnModel = { kind: 'lending' } | { kind: 'market'; coingeckoId: string };

/**
 * Every protocol's return model. A `Record<ProtocolId, …>` on purpose: adding a
 * protocol without declaring how its return is replayed becomes a COMPILE
 * error, not a silently-wrong number (the same exhaustiveness discipline the
 * ledger's `project()` guard uses).
 *
 * CoinGecko ids verified live against the free tier 2026-08-20 — each returns
 * 366 daily points for `days=365&interval=daily`.
 */
export const PROTOCOL_RETURN_MODEL: Record<ProtocolId, ProtocolReturnModel> = {
  skySsr: { kind: 'lending' },
  aaveV3: { kind: 'lending' },
  compoundV3: { kind: 'lending' },
  // NB: Sanctum Infinity's id is the legacy `socean-staked-sol` (symbol INF).
  sanctumInf: { kind: 'market', coingeckoId: 'socean-staked-sol' },
  jupiterJlp: { kind: 'market', coingeckoId: 'jupiter-perpetuals-liquidity-provider-token' },
  jito: { kind: 'market', coingeckoId: 'jito-staked-sol' },
};

/** One dated closing price (day precision) — the replay's honest unit. */
export interface DatedPricePoint {
  /** `YYYY-MM-DD` (UTC). */
  date: string;
  priceUsd: number;
}

/** A protocol leg's daily price history, stamped like every other market read. */
export interface ProtocolPriceHistory {
  protocolId: ProtocolId;
  points: DatedPricePoint[];
  stamp: DataStamp;
}
