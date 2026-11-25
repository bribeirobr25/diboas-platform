/**
 * MDS-READ-1 (C2-S G4) · a failed series load opens the same retry window as a failed refresh.
 *
 * Its own file: the service caches the series module once loaded, so the failure needs a fresh
 * module graph in which the FX data module fails to load. Never reads pipeline data.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MARKET_DATA_STALE_RETRY_MS, MarketDataServiceImpl } from '@/lib/market-data/service';
import { toClientSnapshot } from '@/lib/market-data/clientSnapshot';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';
import { Logger } from '@/lib/monitoring/Logger';
import type { IMarketDataProvider } from '@/lib/market-data/types';

vi.mock('@/lib/market-data/data/monthlyPrices.json', () => ({ default: {} }));
vi.mock('@/lib/market-data/data/monthlyFx.json', () => {
  throw new Error('chunk failed to load');
});
vi.mock('@/lib/market-data/data/monthlyInflation.json', () => ({ default: {} }));

const T0 = new Date('2026-11-25T12:00:00Z').getTime();
const noProvider: IMarketDataProvider = {
  fetch: async () => {
    throw new Error('the provider must not be called for the series');
  },
  isAvailable: async () => true,
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('a failed series load', () => {
  it('should open a retry window and not retry the load inside it', async () => {
    vi.useFakeTimers({ now: T0 });
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const service = new MarketDataServiceImpl(noProvider);
    service.primeCache(toClientSnapshot({ ...FALLBACK_MARKET_DATA }));
    const first = await service.get();
    expect(first.monthlySeries).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(service.retryAvailableAt()).toBe(T0 + MARKET_DATA_STALE_RETRY_MS);
    vi.setSystemTime(T0 + 1_000);
    service.primeCache(toClientSnapshot({ ...FALLBACK_MARKET_DATA })); // a navigation: a new prime
    await service.get();
    expect(warn).toHaveBeenCalledTimes(1); // no second attempt inside the window
    vi.setSystemTime(T0 + MARKET_DATA_STALE_RETRY_MS + 1);
    await service.get();
    expect(warn).toHaveBeenCalledTimes(2); // retried after it
  });
});
