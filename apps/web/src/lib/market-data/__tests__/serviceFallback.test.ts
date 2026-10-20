/**
 * MarketDataService fallback path (2026-10-18 compliance pass).
 *
 * Two defects in `get()`'s catch: it swallowed the provider error without a
 * log line (the file header promises "Logger warnings on fallback", P12), and
 * the stale snapshot was built from the static constants alone, so one failed
 * refresh dropped `monthlySeries` that an earlier fetch had already loaded.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketDataServiceImpl } from '../service';
import { FALLBACK_MARKET_DATA } from '../constants';
import { Logger } from '@/lib/monitoring/Logger';
import type { IMarketDataProvider, MarketDataSnapshot } from '../types';

const SERIES = { marker: 'loaded-series' } as unknown as MarketDataSnapshot['monthlySeries'];

function liveSnapshot(): MarketDataSnapshot {
  return {
    ...FALLBACK_MARKET_DATA,
    monthlySeries: SERIES,
    metadata: { ...FALLBACK_MARKET_DATA.metadata, ttl: 1_000 },
  };
}

function providerThatFailsAfter(successes: number): IMarketDataProvider {
  let calls = 0;
  return {
    fetch: async () => {
      calls += 1;
      if (calls <= successes) return liveSnapshot();
      throw new Error('provider down');
    },
    isAvailable: async () => true,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('MarketDataService — fallback after a failed refresh', () => {
  it('should keep already-loaded monthlySeries when a later refresh fails', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-18T12:00:00Z') });
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const service = new MarketDataServiceImpl(providerThatFailsAfter(1));
    await service.get();
    vi.setSystemTime(new Date('2026-10-18T12:00:05Z')); // past the 1s ttl
    const stale = await service.get();
    expect(stale.metadata.stale).toBe(true);
    expect(stale.metadata.source).toBe('fallback');
    expect(stale.monthlySeries).toBe(SERIES);
  });

  it('should serve the static fallback when nothing was ever loaded', async () => {
    vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const service = new MarketDataServiceImpl(providerThatFailsAfter(0));
    const stale = await service.get();
    expect(stale.metadata.stale).toBe(true);
    expect(stale.monthlySeries).toBe(FALLBACK_MARKET_DATA.monthlySeries);
  });

  it('should log a warning naming the provider error when it falls back', async () => {
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    const service = new MarketDataServiceImpl(providerThatFailsAfter(0));
    await service.get();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(warn.mock.calls[0])).toContain('provider down');
  });
});
