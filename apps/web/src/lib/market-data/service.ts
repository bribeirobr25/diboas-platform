/**
 * MarketDataService
 *
 * Single source of truth for all market-driven financial data.
 * Fetches from diboas-analytics when available, falls back to constants.
 *
 * Principles applied:
 * - P3 Service Agnostic: IMarketDataProvider swappable
 * - P7 Error Handling: CircuitBreaker + fallback chain
 * - P9 Performance: TTL cache, SSR-safe getSync()
 * - P12 Monitoring: Logger warnings on fallback
 */

import type {
  ClientMarketDataSnapshot,
  MarketDataSnapshot,
  IMarketDataProvider,
  HistoricalAnchorsData,
  MonthlySeriesData,
} from './types';
import { FALLBACK_MARKET_DATA } from './constants';
import { CircuitBreaker } from '@/lib/utils/CircuitBreaker';
import { Logger } from '@/lib/monitoring/Logger';

/** Cache lifetime when a snapshot does not declare its own `metadata.ttl`. */
export const MARKET_DATA_DEFAULT_TTL_MS = 300_000;
/** Consecutive provider failures before the circuit opens. */
const MARKET_DATA_CIRCUIT_FAILURE_THRESHOLD = 3;
/** How long the circuit stays open before a trial request. */
const MARKET_DATA_CIRCUIT_RESET_MS = 60_000;
/**
 * `5.688` (C2-S G4): after a failed refresh the stale snapshot is stored and served for this
 * long before the next refresh may run. Distinct from the circuit breaker (3 failures).
 * Trade-off, stated: with a real provider one failure serves the reviewed constants for 60 s,
 * and the breaker then needs about two minutes of failures to open.
 */
export const MARKET_DATA_STALE_RETRY_MS = 60_000;
/** C2-S G4 audit: a load that never settles counts as a failed one after this long. */
export const MARKET_DATA_FETCH_TIMEOUT_MS = 15_000;

/** Rejects when `promise` has not settled within `ms`; the timer never outlives the race. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`market data load timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Lazy-loaded monthly series — Phase B (TOOLS_IMPROVEMENT.md).
 * Imported dynamically inside the provider so marketing pages that never
 * touch tools ship 0KB of monthly OHLC. Cached at module level after first
 * access; the cache TTL is the provider's responsibility (no double-loading
 * once the snapshot is built).
 */
let cachedMonthlySeries: MonthlySeriesData | null = null;
async function loadMonthlySeries(): Promise<MonthlySeriesData> {
  if (cachedMonthlySeries) return cachedMonthlySeries;
  // Three domain-split files — each loaded in parallel.
  const [prices, fx, inflation] = await Promise.all([
    import('./data/monthlyPrices.json').then((m) => m.default),
    import('./data/monthlyFx.json').then((m) => m.default),
    import('./data/monthlyInflation.json').then((m) => m.default),
  ]);
  cachedMonthlySeries = {
    assets: prices as MonthlySeriesData['assets'],
    fx: fx as MonthlySeriesData['fx'],
    inflation: inflation as MonthlySeriesData['inflation'],
  };
  return cachedMonthlySeries;
}

/** Fallback-only provider — always returns hardcoded constants + lazy monthly series */
class FallbackProvider implements IMarketDataProvider {
  async fetch(): Promise<MarketDataSnapshot> {
    const monthlySeries = await loadMonthlySeries();
    return { ...FALLBACK_MARKET_DATA, monthlySeries };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

class MarketDataServiceImpl {
  private cache: MarketDataSnapshot | null = null;
  private cacheExpiry: number = 0;
  /**
   * No load (provider or series) runs before this epoch ms: set after a failed load (5.688) and
   * by a primed stale snapshot. A later fresh prime never shortens it (C2-S G4 audit).
   */
  private retryAt = 0;
  /** One refresh shared by concurrent `get()` calls (Principle 11). */
  private inFlight: Promise<MarketDataSnapshot> | null = null;
  /** One series load shared by concurrent `get()` calls. */
  private seriesInFlight: Promise<void> | null = null;
  /**
   * Bumped by every cache write and by `setProvider`: a refresh writes only if nothing was
   * written while it ran, so it never replaces a newer primed snapshot or the new provider's.
   */
  private version = 0;
  /** The snapshot object last primed, so priming on every render is idempotent. */
  private lastPrimed: unknown = null;
  private provider: IMarketDataProvider;
  private readonly fallback: MarketDataSnapshot;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(provider?: IMarketDataProvider) {
    this.provider = provider ?? new FallbackProvider();
    this.fallback = FALLBACK_MARKET_DATA;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: MARKET_DATA_CIRCUIT_FAILURE_THRESHOLD,
      resetTimeout: MARKET_DATA_CIRCUIT_RESET_MS,
    });
  }

  /**
   * Async fetch with cache + circuit breaker + fallback.
   *
   * C2-S G4: a cache inside its lifetime, or inside a retry window, is served without calling
   * the provider. When it lacks the monthly series (a browser snapshot primed without them),
   * only the series are loaded and merged in (B1): the rest of the snapshot, its lifetime and
   * any newer primed values stay as they are.
   */
  async get(): Promise<MarketDataSnapshot> {
    const now = Date.now();
    if (this.cache && (now < this.cacheExpiry || now < this.retryAt)) {
      if (!this.cache.monthlySeries) await this.ensureSeries();
      return this.getSync();
    }
    if (!this.inFlight) {
      const refresh = this.refresh(this.version);
      this.inFlight = refresh;
      refresh
        .finally(() => {
          if (this.inFlight === refresh) this.inFlight = null;
        })
        .catch(() => {}); // refresh() never rejects; this only keeps the chain from being unhandled
    }
    return this.inFlight;
  }

  /**
   * When the next load may run (epoch ms) after a failed load or a primed stale snapshot;
   * `null` when a load may run now. The asset-history tool's retry message reads it (G5).
   */
  retryAvailableAt(): number | null {
    return this.retryAt > Date.now() ? this.retryAt : null;
  }

  private async refresh(startVersion: number): Promise<MarketDataSnapshot> {
    try {
      const data = await this.circuitBreaker.execute(() =>
        withTimeout(this.provider.fetch(), MARKET_DATA_FETCH_TIMEOUT_MS)
      );
      if (startVersion !== this.version) return this.getSync(); // a newer snapshot won
      this.write(data, Date.now() + (data.metadata.ttl || MARKET_DATA_DEFAULT_TTL_MS));
      this.retryAt = 0;
      return data;
    } catch (error) {
      // P12 (2026-10-18 compliance pass): this path was silent, while the file
      // header promised "Logger warnings on fallback".
      Logger.warn('[MarketData] provider fetch failed; serving the stale snapshot', {
        error: error instanceof Error ? error.message : String(error),
      });
      if (startVersion !== this.version) return this.getSync(); // never over a newer snapshot
      // 5.688: the stale snapshot is STORED, so `getSync()` serves the same degraded read as
      // `get()`, and the next load waits MARKET_DATA_STALE_RETRY_MS (not the 300 s TTL).
      const stale = this.getStaleSnapshot();
      const until = Date.now() + MARKET_DATA_STALE_RETRY_MS;
      this.write(stale, until);
      this.retryAt = until;
      return stale;
    }
  }

  /** Loads the monthly series into the cached snapshot, once, unless a retry window is open. */
  private ensureSeries(): Promise<void> {
    if (Date.now() < this.retryAt) return Promise.resolve();
    if (!this.seriesInFlight) {
      const load: Promise<void> = withTimeout(loadMonthlySeries(), MARKET_DATA_FETCH_TIMEOUT_MS)
        .then((series) => {
          // A merge, not a version bump: the series are the same static data for any snapshot.
          if (this.cache && !this.cache.monthlySeries) {
            this.cache = { ...this.cache, monthlySeries: series };
          }
        })
        .catch((error: unknown) => {
          Logger.warn('[MarketData] monthly series failed to load', {
            error: error instanceof Error ? error.message : String(error),
          });
          this.retryAt = Math.max(this.retryAt, Date.now() + MARKET_DATA_STALE_RETRY_MS);
        })
        .finally(() => {
          if (this.seriesInFlight === load) this.seriesInFlight = null;
        });
      this.seriesInFlight = load;
    }
    return this.seriesInFlight;
  }

  private write(snapshot: MarketDataSnapshot, expiry: number): void {
    this.cache = snapshot;
    this.cacheExpiry = expiry;
    this.version += 1;
  }

  /**
   * Synchronous access — always returns cache or fallback.
   * Safe for SSR and initial render (no async waterfall).
   */
  getSync(): MarketDataSnapshot {
    return this.cache ?? this.fallback;
  }

  /**
   * Swap the provider at runtime (e.g. when analytics API becomes available).
   */
  setProvider(provider: IMarketDataProvider): void {
    this.provider = provider;
    this.cache = null;
    this.cacheExpiry = 0;
    this.retryAt = 0;
    this.inFlight = null;
    this.lastPrimed = null;
    this.version += 1;
    this.circuitBreaker.reset(); // the old provider's failures say nothing about the new one
  }

  /**
   * A8 fix (2026-05-23): synchronously prime the cache from a server-pre-fetched snapshot.
   * `MarketDataContextProvider` calls it on every render, on the server (the copy of this module
   * that renders client components) and in the browser. Idempotent per snapshot object.
   *
   * C2-S G4:
   * - a snapshot without the monthly series keeps series already in the cache (B1);
   * - a `stale` snapshot is stored as stale for MARKET_DATA_STALE_RETRY_MS and opens a retry
   *   window, never as fresh for 300 s (5.688). It is stored, not ignored, so the server's
   *   render and the browser hold the same snapshot (the audit's two-copies finding);
   * - a fresh prime never shortens an open retry window, and never extends a fresh cache's TTL.
   */
  primeCache(snapshot: ClientMarketDataSnapshot | MarketDataSnapshot): void {
    if (snapshot === this.lastPrimed) return;
    this.lastPrimed = snapshot;
    const now = Date.now();
    const keptSeries = snapshot.monthlySeries ? undefined : this.cache?.monthlySeries;
    const stored: MarketDataSnapshot = keptSeries
      ? { ...snapshot, monthlySeries: keptSeries }
      : snapshot;
    if (snapshot.metadata?.stale) {
      const until = now + MARKET_DATA_STALE_RETRY_MS;
      this.write(stored, until);
      this.retryAt = Math.max(this.retryAt, until);
    } else {
      // A prime replaces the data but never extends the cache's lifetime: only a first prime
      // (an empty cache) starts one. Otherwise the remaining lifetime is kept, or the cache stays
      // expired, so a copy primed on every request still refreshes when its TTL ends.
      const ttlEnd = now + (snapshot.metadata?.ttl || MARKET_DATA_DEFAULT_TTL_MS);
      const remaining =
        this.cache && !this.cache.metadata.stale && this.cacheExpiry > now ? this.cacheExpiry : now;
      this.write(stored, this.cache ? Math.min(remaining, ttlEnd) : ttlEnd);
    }
  }

  /**
   * Phase C+ (2026-05-16): convenience accessor for the historical anchor
   * slice. Equivalent to `getSync().historicalAnchors`; provided as a single
   * named method per L1 round-1 lock (no parallel 5-method surface).
   *
   * Returns `undefined` if the active snapshot lacks historical data
   * (partial-ship scenarios, SDK provider without history). Consumers MUST
   * handle the undefined case.
   */
  getHistoricalAnchors(): HistoricalAnchorsData | undefined {
    return this.getSync().historicalAnchors;
  }

  /**
   * Phase B (TOOLS_IMPROVEMENT.md, 2026-05-23): convenience accessor for the
   * monthly-series slice. Equivalent to `getSync().monthlySeries`; provided as
   * a single named method matching the `getHistoricalAnchors()` L1 pattern.
   *
   * Returns `undefined` when the active snapshot is the synchronous fallback
   * (cache miss) and the monthly JSON hasn't been loaded yet — consumers MUST
   * handle the undefined case (graceful degrade to non-hedged behavior; the
   * `deriveHorizonMatchedCAGR` helper returns sentinel 0 on insufficient data).
   * Call `await marketDataService.get()` first if you need the data populated.
   */
  getMonthlySeries(): MonthlySeriesData | undefined {
    return this.getSync().monthlySeries;
  }

  /**
   * The static fallback, flagged stale. Series already loaded by an earlier
   * successful fetch are kept (2026-10-18 compliance pass): the fallback
   * constants carry no `monthlySeries`, so a single failed refresh used to
   * drop the series the asset-history tool and the hedge maths read, even
   * though they were already in memory.
   */
  private getStaleSnapshot(): MarketDataSnapshot {
    return {
      ...this.fallback,
      ...(this.cache?.monthlySeries ? { monthlySeries: this.cache.monthlySeries } : {}),
      ...(this.cache?.historicalAnchors ? { historicalAnchors: this.cache.historicalAnchors } : {}),
      metadata: {
        ...this.fallback.metadata,
        stale: true,
        source: 'fallback' as const,
      },
    };
  }
}

/** Singleton instance — Phase 1 uses FallbackProvider only */
export const marketDataService = new MarketDataServiceImpl();

export { MarketDataServiceImpl, FallbackProvider };
