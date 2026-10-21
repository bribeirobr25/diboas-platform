import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildHistoricalSeries } from '../historicalEvidence';
import { datesAreConsecutiveDays } from '../marketShape';
import { FIXTURE_STAMP } from '../fixtures';
import { FUTURE_SKEW_ALLOWANCE_DAYS, freshnessUnder } from '../freshness';
import { networkCostEvidence } from '../providers/normalize';
import { DEFAULT_PRACTICE_REFERENCE_POLICY } from '../freshnessPolicy';

/**
 * Lane audit 2026-10-21 — the defi findings fixed in that pass, each pinned to the
 * requirement it restores (D1/D6 `5.105`, D2 R-13, D3 one acceptance rule, D4 `5.583`,
 * D7 a stated allowance).
 */
const pool = (over: Record<string, unknown> = {}) => ({
  pool: 'p1',
  project: 'aave-v3',
  chain: 'Arbitrum',
  symbol: 'USDC',
  apy: 5.4,
  apyBase: 5.4,
  apyReward: null,
  tvlUsd: 1_000_000,
  ...over,
});

const endpoints = (pools: unknown[], chart: unknown[] = []) =>
  (async (input: unknown) =>
    ({
      ok: true,
      status: 200,
      json: async () => (String(input).includes('/chart/') ? { data: chart } : { data: pools }),
    }) as unknown as Response) as unknown as typeof fetch;

const day = (d: number) => `2026-10-${String(d).padStart(2, '0')}`;

describe('a replay series is one point per consecutive calendar day (5.105, D1/D6)', () => {
  it('should refuse a series with a missing day rather than read later values early', () => {
    const built = buildHistoricalSeries({
      kind: 'RATE',
      protocolId: 'aaveV3',
      points: [10, 11, 13, 14].map((d) => ({ date: day(d), value: 5 })),
      stamp: FIXTURE_STAMP,
      via: 'AGGREGATOR',
    });
    expect(built.available).toBe(false);
  });

  it('should refuse a date that is not a real calendar day', () => {
    expect(datesAreConsecutiveDays(['2026-02-28', '2026-02-29'])).toBe(false);
    expect(datesAreConsecutiveDays(['2026-02-28', '2026-03-01'])).toBe(true);
    expect(datesAreConsecutiveDays(['2026-10-17T00', '2026-10-18'])).toBe(false);
  });

  beforeEach(() => vi.resetModules());

  it('should serve the fixture, not a shifted chart, when a day inside the window has no rate', async () => {
    const { DefiLlamaApyProvider } = await import('../providers/defillama');
    const chart = [10, 11, 12, 13, 14].map((d) => ({
      timestamp: `${day(d)}T00:00:00.000Z`,
      apy: d === 12 ? null : 5.4,
    }));
    const h = await new DefiLlamaApyProvider(endpoints([pool()], chart)).getApyHistory('aaveV3', 5);
    expect(h?.stamp.fallbackUsed).toBe(true);
  });
});

describe('the pool a leg uses (D2, D3)', () => {
  beforeEach(() => vi.resetModules());

  it('should still serve every leg when one /pools row is malformed', async () => {
    const { DefiLlamaApyProvider } = await import('../providers/defillama');
    const pools = [null, pool({ symbol: 42 }), pool()];
    const apys = await new DefiLlamaApyProvider(endpoints(pools)).getCurrentApys(['aaveV3']);
    expect(apys).toHaveLength(1);
    expect(apys[0].stamp.source).toBe('defillama');
  });

  it('should not let a refused, larger pool hide an acceptable one', async () => {
    const { DefiLlamaApyProvider } = await import('../providers/defillama');
    const pools = [
      pool({ pool: 'bridged', symbol: 'USDC.E', apy: 9.9, tvlUsd: 9_000_000 }),
      pool({ pool: 'native', symbol: 'USDC', apy: 5.4, tvlUsd: 1_000_000 }),
    ];
    const apys = await new DefiLlamaApyProvider(endpoints(pools)).getCurrentApys(['aaveV3']);
    expect(apys[0].stamp.source).toBe('defillama');
    expect(apys[0].apyPercent).toBe(5.4);
  });

  it('should still refuse, with its reason, when only a refused pool exists', async () => {
    const { DefiLlamaApyProvider } = await import('../providers/defillama');
    const pools = [pool({ symbol: 'USDC.E', apy: 9.9 })];
    const apys = await new DefiLlamaApyProvider(endpoints(pools)).getCurrentApys(['aaveV3']);
    expect(apys.every((a) => a.stamp.source !== 'defillama')).toBe(true);
  });
});

describe('a network cost of zero is not free (5.583, D4)', () => {
  it('should refuse a non-positive network cost at the seam', () => {
    const quote = { chain: 'Arbitrum' as const, typicalFeeUsd: 0, stamp: FIXTURE_STAMP };
    expect(networkCostEvidence(quote)).toMatchObject({
      availability: 'UNAVAILABLE',
      reason: 'REFUSED_BY_CONTRACT',
    });
    expect(networkCostEvidence({ ...quote, typicalFeeUsd: 0.03 }).availability).toBe('AVAILABLE');
  });
});

describe('a future timestamp is tolerated only within the stated skew (D7)', () => {
  const policy = DEFAULT_PRACTICE_REFERENCE_POLICY;
  const now = '2026-10-21T00:00:00Z';
  it('should accept a stamp inside the allowance and refuse one beyond it', () => {
    const ahead = (days: number) => new Date(Date.parse(now) + days * 86_400_000).toISOString();
    expect(FUTURE_SKEW_ALLOWANCE_DAYS).toBe(1);
    expect(freshnessUnder({ ...FIXTURE_STAMP, asOf: ahead(0.5) }, now, policy)).not.toBe('MISSING');
    expect(freshnessUnder({ ...FIXTURE_STAMP, asOf: ahead(1.5) }, now, policy)).toBe('MISSING');
  });
});
