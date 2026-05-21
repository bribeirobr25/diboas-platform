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

import type { MarketDataSnapshot, IMarketDataProvider, HistoricalAnchorsData } from './types';
import { FALLBACK_MARKET_DATA } from './constants';
import { CircuitBreaker } from '@/lib/utils/CircuitBreaker';

/** Fallback-only provider — always returns hardcoded constants */
class FallbackProvider implements IMarketDataProvider {
  async fetch(): Promise<MarketDataSnapshot> {
    return FALLBACK_MARKET_DATA;
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
