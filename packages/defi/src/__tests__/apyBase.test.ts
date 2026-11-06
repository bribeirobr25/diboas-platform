/**
 * PR 2 (Q5, P3 §2) · the BASE rate of an APY history point is resolved at ingest:
 * `apyBase` when supplied; else the total when the reward is null or 0; else null (a reward
 * without a base split is unusable for the projection). It is held to the same bounds as the
 * total (all-or-nothing for the series) and passes the client shape check.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apyHistoryListIssue } from '../marketShape';
import { observedStamp } from '../testing';

const pool = {
  pool: 'uuid-base',
  project: 'aave-v3',
  chain: 'Arbitrum',
  symbol: 'USDC',
  apy: 5,
  apyBase: 5,
  apyReward: null,
  tvlUsd: 100_000_000,
};

function provider(chart: unknown[]) {
  const fetchImpl = (async (url: string) =>
    new Response(
      JSON.stringify(String(url).includes('/chart/') ? { data: chart } : { data: [pool] }),
      {
        status: 200,
      }
    )) as unknown as typeof fetch;
  return import('../providers/defillama').then(
    ({ DefiLlamaApyProvider }) => new DefiLlamaApyProvider(fetchImpl)
  );
}

describe('PR 2 · the base rate of an APY history point', () => {
  beforeEach(() => {
    vi.resetModules(); // a fresh chart cache per test
  });

  it('should take apyBase when the source supplies it, the total when there is no reward, and null otherwise', async () => {
    const p = await provider([
      { timestamp: '2026-09-08T00:00:00Z', apy: 5, apyBase: 4.2, apyReward: 0.8 },
      { timestamp: '2026-09-09T00:00:00Z', apy: 3.1, apyBase: null, apyReward: null },
      { timestamp: '2026-09-10T00:00:00Z', apy: 3.3, apyBase: null, apyReward: 0 },
      { timestamp: '2026-09-11T00:00:00Z', apy: 6, apyBase: null, apyReward: 1.5 },
    ]);
    const h = await p.getApyHistory('aaveV3', 30);
    expect(h).not.toBeNull();
    expect(h!.points.map((pt) => pt.apyBasePercent)).toEqual([4.2, 3.1, 3.3, null]);
    expect(h!.points.map((pt) => pt.apyPercent)).toEqual([5, 3.1, 3.3, 6]);
  });

  it('should refuse the whole series when one base rate is outside plausible bounds', async () => {
    const p = await provider([
      { timestamp: '2026-09-09T00:00:00Z', apy: 3, apyBase: 3, apyReward: 0 },
      { timestamp: '2026-09-10T00:00:00Z', apy: 3, apyBase: 99999, apyReward: 0 },
    ]);
    const h = await p.getApyHistory('aaveV3', 30);
    // refused → the honest fixture path (no base reported), never the corrupt observation
    expect(h === null || h.points.every((pt) => pt.apyBasePercent === undefined)).toBe(true);
  });
});

describe('PR 2 · the client shape check accepts a base rate', () => {
  const series = (apyBasePercent: unknown) => [
    {
      protocolId: 'aaveV3',
      points: [{ date: '2026-09-10', apyPercent: 3, apyBasePercent }],
      stamp: observedStamp('defillama', '2026-09-10T00:00:00.000Z'),
    },
  ];

  it.each([[2.9], [null], [undefined]])('should accept a base rate of %s', (v) => {
    expect(apyHistoryListIssue(series(v), 'h')).toBeNull();
  });

  it('should refuse a base rate that is not a finite number', () => {
    expect(apyHistoryListIssue(series('3'), 'h')).toBe('h[0].points[0].apyBasePercent');
  });
});
