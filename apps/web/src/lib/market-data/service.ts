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

import type { MarketDataSnapshot, IMarketDataProvider, HistoricalAnchorsData, MonthlySeriesData } from './types';
import { FALLBACK_MARKET_DATA } from './constants';
import { CircuitBreaker } from '@/lib/utils/CircuitBreaker';

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
  private provider: IMarketDataProvider;
  private readonly fallback: MarketDataSnapshot;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(provider?: IMarketDataProvider) {
    this.provider = provider ?? new FallbackProvider();
    this.fallback = FALLBACK_MARKET_DATA;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 60_000,
    });
  }

  /**
   * Async fetch with cache + circuit breaker + fallback.
   * Use on client side after mount.
   */
  async get(): Promise<MarketDataSnapshot> {
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const data = await this.circuitBreaker.execute(() => this.provider.fetch());
      this.cache = data;
      this.cacheExpiry = Date.now() + (data.metadata.ttl || 300_000);
      return data;
    } catch {
      return this.getStaleSnapshot();
    }
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
  }

  /**
   * A8 fix (2026-05-23): synchronously prime the client-side cache from a
   * server-pre-fetched snapshot. Used by `MarketDataContextProvider` during client
   * hydration to eliminate the SSR-to-client depreciation flip on the landing
   * page AND ensure tool pages actually use the live `monthlySeries` data
   * (instead of staying on the static fallback because nothing triggers
   * `get()`). Idempotent — calling twice with the same data is a no-op.
   */
  primeCache(snapshot: MarketDataSnapshot): void {
    this.cache = snapshot;
    this.cacheExpiry = Date.now() + (snapshot.metadata?.ttl || 300_000);
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

  private getStaleSnapshot(): MarketDataSnapshot {
    return {
      ...this.fallback,
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
