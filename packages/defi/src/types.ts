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
