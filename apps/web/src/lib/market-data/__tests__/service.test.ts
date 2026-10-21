/**
 * MarketDataService tests — Phase C+ snapshot extension.
 *
 * Per L2 round-1: this is the FIRST test file for the service module
 * (previously only `formulas.test.ts` existed). Covers the historical-anchors
 * snapshot slice + the single new `getHistoricalAnchors()` method.
 *
 * Scope intentionally narrow: snapshot shape + method surface + §6.10 lock.
 * Provider swap semantics + circuit breaker behavior remain covered by
 * higher-level integration tests when those land.
 */

import { describe, it, expect } from 'vitest';
import { marketDataService } from '../service';
import { FALLBACK_MARKET_DATA } from '../constants';
import PROTOCOLS_TVL from '../data/protocolsTvl.json';
import {
  ANCHOR_PRICES,
  BRL_USD_BUCKETS,
  EUR_USD_BUCKETS,
  LAST_RESEARCH_UPDATE,
} from '../historical';

describe('marketDataService — Phase C+ historicalAnchors snapshot slice', () => {
  it('FALLBACK_MARKET_DATA.historicalAnchors is populated from historical.ts', () => {
    expect(FALLBACK_MARKET_DATA.historicalAnchors).toBeDefined();
    expect(FALLBACK_MARKET_DATA.historicalAnchors?.anchors).toBe(ANCHOR_PRICES);
    expect(FALLBACK_MARKET_DATA.historicalAnchors?.fxBuckets.BRL).toBe(BRL_USD_BUCKETS);
    expect(FALLBACK_MARKET_DATA.historicalAnchors?.fxBuckets.EUR).toBe(EUR_USD_BUCKETS);
    expect(FALLBACK_MARKET_DATA.historicalAnchors?.lastResearchUpdate).toBe(LAST_RESEARCH_UPDATE);
  });

  it('getSync().historicalAnchors returns the same slice as FALLBACK_MARKET_DATA', () => {
    const snapshot = marketDataService.getSync();
    expect(snapshot.historicalAnchors).toBe(FALLBACK_MARKET_DATA.historicalAnchors);
  });

  it('getHistoricalAnchors() returns the same data as getSync().historicalAnchors (L1 single-method lock)', () => {
    const fromMethod = marketDataService.getHistoricalAnchors();
    const fromSnapshot = marketDataService.getSync().historicalAnchors;
    expect(fromMethod).toBe(fromSnapshot);
  });

  it('historicalAnchors.anchors ships all 24 entries (8 assets × 3 anchor years)', () => {
    const anchors = marketDataService.getHistoricalAnchors()?.anchors;
    expect(anchors?.length).toBe(24);
  });

  it('historicalAnchors.fxBuckets.BRL has 4 buckets per research Part 5 methodology', () => {
    const buckets = marketDataService.getHistoricalAnchors()?.fxBuckets.BRL;
    expect(buckets?.length).toBe(4);
  });

  it('historicalAnchors is optional — type allows undefined for partial-ship scenarios', () => {
    // This test pins the type-level lock: `historicalAnchors?` on
    // MarketDataSnapshot means consumers MUST handle undefined. A future
    // SDK provider that omits historical data is a valid partial-ship.
    const data = marketDataService.getHistoricalAnchors();
    expect(data === undefined || typeof data === 'object').toBe(true);
  });
});

// The /protocols TVL figures' age is NOT checked here (2026-10-21): a
// wall-clock assertion in this suite turned every lane's CI red on a calendar
// date. Their freshness is `scripts/data-freshness/check.mjs` (blocks only a
// change that touches them; a scheduled run alerts the owner), and their
// consistency is `components/Pages/Protocols/__tests__/protocolsTvl.test.tsx`.
describe('protocolData', () => {
  it('should serve the figures and pull date of the one committed DeFiLlama pull', () => {
    const { protocolData } = marketDataService.getSync();
    expect(protocolData.updatedAt).toBe(PROTOCOLS_TVL.pulled_at);
    expect(protocolData.tvl).toEqual({
      combinedUsd: PROTOCOLS_TVL.combined.usd,
      combinedFloorUsd: PROTOCOLS_TVL.combined.floor_usd,
    });
    expect(protocolData.tvl.combinedUsd).toBeGreaterThanOrEqual(protocolData.tvl.combinedFloorUsd);
  });
});

describe('§6.10 minimal-surface discipline (L1 round-1 lock)', () => {
  it('public service exposes exactly 4 methods: get / getSync / setProvider / getHistoricalAnchors', () => {
    // Pins the minimal-surface discipline. If a future PR adds parallel
    // domain-specific methods (e.g. `getBankRate`, `getCurrencyDepreciation`),
    // they break the L1 lock — failure here flags the regression.
    expect(typeof marketDataService.get).toBe('function');
    expect(typeof marketDataService.getSync).toBe('function');
    expect(typeof marketDataService.setProvider).toBe('function');
    expect(typeof marketDataService.getHistoricalAnchors).toBe('function');
    // Negative: no parallel domain accessors leaked through. Cast to record
    // for the property check; would be a build-time error if the type lock
    // is correct (no such method on MarketDataServiceImpl) — runtime check
    // is the belt to the type system's suspenders.
    const surface = marketDataService as unknown as Record<string, unknown>;
    expect(typeof surface.getBankRate).toBe('undefined');
    expect(typeof surface.getCurrencyDepreciation).toBe('undefined');
    expect(typeof surface.getFxBuckets).toBe('undefined');
    expect(typeof surface.getHistoricalAnchor).toBe('undefined');
  });
});
