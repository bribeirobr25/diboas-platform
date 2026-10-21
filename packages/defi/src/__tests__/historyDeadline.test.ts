import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * REQUIREMENT (Principle 7; `PROVIDER_FETCH_TIMEOUT_MS` is "deliberately below the client's
 * 15 s"): one APY-history call is bounded by ONE timeout budget. Lane audit 2026-10-20:
 * `/pools` then `/chart` each got the full timeout, so a slow upstream could take ~2× it —
 * past the client's 15 s, where the honest fixture fallback is never seen.
 */
describe('an APY-history call keeps to one timeout budget', () => {
  beforeEach(() => vi.resetModules());

  const POOL = {
    pool: 'p1',
    project: 'aave-v3',
    chain: 'Arbitrum',
    symbol: 'USDC',
    apy: 5.4,
    apyBase: 5.4,
    apyReward: null,
    tvlUsd: 1,
  };
  const BUDGET_MS = 600;
  const POOLS_DELAY_MS = 400;

  /** `/pools` answers late; `/chart` never answers until its signal aborts it. */
  const slowUpstream = (async (input: unknown, init?: RequestInit) => {
    if (!String(input).includes('/chart/')) {
      await new Promise((r) => setTimeout(r, POOLS_DELAY_MS));
      return { ok: true, status: 200, json: async () => ({ data: [POOL] }) } as Response;
    }
    return new Promise<Response>((_, reject) =>
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
    );
  }) as unknown as typeof fetch;

  it('should give the chart step only what /pools left, and serve the honest fixture', async () => {
    /* Asserting the budget HANDED to each step, not wall time: load can only make the
       remainder smaller, so this cannot flake — and the old code handed the full budget. */
    const timeouts = vi.spyOn(AbortSignal, 'timeout');
    try {
      const { DefiLlamaApyProvider } = await import('../providers/defillama');
      const provider = new DefiLlamaApyProvider(slowUpstream, BUDGET_MS);
      const history = await provider.getApyHistory('aaveV3', 5);
      expect(history?.stamp.source).toBe('fixture');
      const [poolsBudget, chartBudget] = timeouts.mock.calls.map(([ms]) => ms as number);
      expect(poolsBudget).toBe(BUDGET_MS);
      /* ≈ 600 − 400 = 200; one budget, not two. */
      expect(chartBudget).toBeLessThanOrEqual(BUDGET_MS - POOLS_DELAY_MS + 50);
    } finally {
      timeouts.mockRestore();
    }
  });
});
