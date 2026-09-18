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

/**
 * The catalogue's strategy ids, as a closed union — the same discipline as
 * `ProtocolId` and `PROTOCOL_RETURN_MODEL`.
 *
 * `StrategyDef.id` used to be a bare `string`, so a typo compiled: a caller
 * could enter a position with a strategy that does not exist, the ledger would
 * happily record it, and every later `getStrategy(id)` would return undefined
 * — so the position silently earned nothing forever. It cost a §4.12 test that
 * asserted nothing at all before it was noticed. A money path must not accept
 * an id the catalogue cannot resolve.
 */
export type StrategyId =
  | 'safeHarbor'
  | 'stableGrowth'
  | 'goalKeeper'
  | 'steadyProgress'
  | 'patientBuilder'
  | 'balancedBuilder'
  | 'steadyCompounder'
  | 'wealthAccelerator'
  | 'fullHarvest'
  | 'fullThrottle';

/** Assets in scope (CEO asset-scope decision). */
export type AssetId = 'BTC' | 'ETH' | 'SOL' | 'SUI' | 'USDC' | 'XAUT';

/** Display currencies per market (locale→currency map lives app-side). */
export type DisplayCurrency = 'USD' | 'BRL' | 'EUR';

/**
 * Where a datum came FROM, independent of how old it is (handoff §8.2).
 *
 * ORIGIN and FRESHNESS are orthogonal and must never be collapsed: a freshly
 * retrieved modelled value is CURRENT and MODELLED at the same time, and a
 * three-week-old observation is OBSERVED and STALE at the same time. Reading
 * one off the other is how "Live from DeFiLlama" ended up above a fixture fee.
 */
export type EvidenceOrigin = 'OBSERVED' | 'MODELLED' | 'PROXY';

/**
 * The TIME state (§8.2/§8.5). DERIVED from a stamp and a clock by
 * `dataFreshness` — never stored, because a stored freshness silently stops
 * being true the moment it is written. `HISTORICAL` is the one value that is
 * ASSERTED by a replay caller (§8.3: correctly frozen history does not become
 * STALE merely because time passed) and is never computed from age.
 */
export type TimeState = 'CURRENT' | 'DELAYED' | 'STALE' | 'HISTORICAL' | 'MISSING';

/**
 * How a source is CLASSIFIED — a source-identity property, and nothing else.
 *
 * ⚑ `SOURCE KIND ≠ EVIDENCE ORIGIN ≠ ACTIONABILITY ≠ AVAILABILITY` (canon §2).
 * `kind: 'provider'` does NOT imply OBSERVED, REFERENCE, EXECUTABLE or
 * AVAILABLE. A provider can return a modelled value; a collector can hold an
 * observed one. The classification exists so a future source can be described,
 * never so an axis can be inferred from it.
 */
export type EvidenceSourceKind =
  'provider' | 'collector' | 'rpc' | 'routeProvider' | 'executionProvider' | 'fixture';

/**
 * The registry of sources this build actually has.
 *
 * ⚑ NO SPECULATIVE ENTRIES (canon §2). Exactly the three that exist today; a
 * collector or route provider is added here when one is actually authorized,
 * which is what makes the identity generalizable without pre-authorizing
 * anything.
 */
export const EVIDENCE_SOURCES = {
  defillama: { kind: 'provider' },
  coingecko: { kind: 'provider' },
  fixture: { kind: 'fixture' },
} as const satisfies Record<string, { kind: EvidenceSourceKind }>;

/** The authoritative source id — derived from the registry, never hand-listed. */
export type EvidenceSourceId = keyof typeof EVIDENCE_SOURCES;

/** A source's classification. Never a shortcut to origin/actionability/availability. */
export function sourceKindOf(source: EvidenceSourceId): EvidenceSourceKind {
  return EVIDENCE_SOURCES[source].kind;
}

/**
 * Honesty stamp carried by every piece of displayed data (Data Vintage Policy).
 *
 * ⚑ WIDENED 2026-09-14 (AUD-F05, handoff §8.8). It carried two fields —
 * `source` and `asOf` — and `asOf` was doing two incompatible jobs: for a
 * provider it is the RETRIEVAL time (`new Date(entry.at)`), while for a fixture
 * it is the OBSERVATION date the values were documented on. One field cannot be
 * both, and §8.8 requires them separately. Every field below is REQUIRED on
 * purpose: an optional one lets a construction site stay silent about
 * provenance, which is the state this replaces.
 */
export interface DataStamp {
  /**
   * THE single authoritative source identity (Strategy Canon 2026-09-18 §2).
   *
   * Generalized from a frozen three-value union to a REGISTRY-derived id so a
   * future collector / RPC / route or execution provider is representable by
   * adding one data entry — not by surgery on a type every stamp depends on.
   * The members are unchanged in this batch (no new source is authorized), so
   * every existing `stamp.source === 'defillama'` comparison behaves exactly as
   * before.
   *
   * There is deliberately NO second `source` on the evidence envelope: canon
   * forbids two competing source identities.
   */
  source: EvidenceSourceId;
  /** OBSERVED / MODELLED / PROXY — see `EvidenceOrigin`. */
  origin: EvidenceOrigin;
  /** RETRIEVAL / refresh timestamp: when we fetched, never when we served. */
  asOf: string;
  /**
   * When the datum was observed AT ITS SOURCE. `null` where only the retrieval
   * time is knowable — which is the honest answer for every provider today,
   * since neither API returns an observation timestamp per value.
   */
  observedAt: string | null;
  /** Did this value come from the documented fallback instead of the source? */
  fallbackUsed: boolean;
  /** Which fixture set produced it, for deterministic replay. `null` when live. */
  fixtureVersion: string | null;
  /**
   * `methodologyId@version` when the value is MODELLED from an observation
   * (handoff §8.8: "methodology/version where modelled"). A raw observation
   * carries none — the distinction is the point.
   */
  methodology?: string;
  /**
   * What this value stands in FOR, and why, when `origin` is `PROXY`
   * (§8.8: "proxy identity/reason where proxy"). A proxy without a named
   * subject is an unattributable substitution.
   */
  proxyOf?: string;
}

/** A live, source-observed stamp. `observedAt` stays null unless the API gives one. */
export function evidenceStamp(input: {
  source: EvidenceSourceId;
  /**
   * REQUIRED, and deliberately not defaulted (Founder/Strategy 2026-09-18 §1).
   *
   * `EXTERNAL SOURCE ≠ OBSERVED` is the controlling invariant: an externally
   * sourced value may be OBSERVED, MODELLED or PROXY depending on what the
   * source actually provides. A default here would let a construction site stay
   * silent and have silence mean "observed" — which is the exact failure this
   * argument exists to prevent. Omitting it is a COMPILE error, which is a
   * stronger protection than a runtime assertion after a silent default.
   */
  origin: EvidenceOrigin;
  /** RETRIEVAL time. */
  asOf: string;
  /** Source-observation time where knowable; `null` is honest, not a default origin. */
  observedAt?: string | null;
  fallbackUsed?: boolean;
  fixtureVersion?: string | null;
  methodology?: string;
  proxyOf?: string;
}): DataStamp {
  const stamp: DataStamp = {
    source: input.source,
    origin: input.origin,
    asOf: input.asOf,
    observedAt: input.observedAt ?? null,
    fallbackUsed: input.fallbackUsed ?? false,
    fixtureVersion: input.fixtureVersion ?? null,
  };
  if (input.methodology !== undefined) stamp.methodology = input.methodology;
  if (input.proxyOf !== undefined) stamp.proxyOf = input.proxyOf;
  return stamp;
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
  id: StrategyId;
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
  /**
   * ⚑ ADDITIVE CONTRACT COMPLETION (2026-09-18, authorized).
   *
   * The port was UNDER-DECLARED: `/api/market/history` has always called this,
   * and `CoinGeckoPriceProvider` has always implemented it — but the interface
   * omitted it, so the capability existed only on the concrete class. That went
   * unnoticed while routes constructed providers directly; resolving them
   * through the `5.243` seam surfaced it immediately, because the seam returns
   * the PORT and the port could not express what the route needs.
   *
   * Completing it is additive and changes no behaviour: every implementation
   * already satisfies it. The alternative — having the factory return the
   * concrete class — was rejected, because it would defeat provider
   * substitution, which is the entire purpose of the seam.
   *
   * Nothing speculative is added here: exactly the capability the route depends
   * on today, and nothing else.
   */
  getPriceHistory(protocolId: ProtocolId, days: number): Promise<ProtocolPriceHistory>;
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
 * How long a provider waits on an upstream before failing open to its
 * documented fixture (Principle 7).
 *
 * Without a bound, a hung upstream holds the function open to the platform
 * limit — and the browser gives up first (`fetchSeries` aborts at 15 s), so the
 * honest fixture fallback that exists for exactly this case is never served;
 * the user gets an error instead. Deliberately below the client's 15 s.
 */
export const PROVIDER_FETCH_TIMEOUT_MS = 8_000;

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
