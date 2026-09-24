import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetEvidenceEvents,
  drainEvidenceEvents,
  evidenceEvents,
  evidenceOutcomeCounts,
  recordEvidenceEvent,
} from '../evidenceObservability';
import { fallbackFor } from '../fallbackEligibility';

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

const feed = (pools: unknown[]) =>
  (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => ({ data: pools }),
    }) as unknown as Response) as unknown as typeof fetch;

/** BLOCK G · OBSERVABILITY. */
describe('Block G · a degradation is visible, not silent', () => {
  beforeEach(() => {
    __resetEvidenceEvents();
    vi.resetModules();
  });

  /**
   * ⛑ ONE MODULE GRAPH, OR THE ASSERTION READS A DIFFERENT BUFFER.
   *
   * `vi.resetModules()` is required so `poolsCache` does not re-serve the first
   * feed — but it also gives the provider a FRESH `evidenceObservability`, with
   * its own array. Reading the statically-imported one then reports an empty
   * buffer and the test passes or fails for the wrong reason. Both come from
   * the same dynamic graph.
   */
  const freshWith = async (pools: unknown[], fetchImpl?: typeof fetch) => {
    const { DefiLlamaApyProvider } = await import('../providers/defillama');
    const obs = await import('../evidenceObservability');
    obs.__resetEvidenceEvents();
    return { provider: new DefiLlamaApyProvider(fetchImpl ?? feed(pools)), obs };
  };

  it('should record a SERVED_PRIMARY when the live observation is used', async () => {
    const { provider, obs } = await freshWith([pool()]);
    await provider.getCurrentApys(['aaveV3']);
    expect(obs.evidenceOutcomeCounts().SERVED_PRIMARY).toBeGreaterThan(0);
    expect(obs.evidenceOutcomeCounts().SERVED_FALLBACK).toBe(0);
  });

  it('should name WHY a leg fell back to its fixture', async () => {
    /**
     * The exact silence this block removes. Block B made a bridged pool refuse
     * the native leg — correctly, and with nothing saying it happened.
     */
    const { provider, obs } = await freshWith([pool({ symbol: 'USDC.E' })]);
    await provider.getCurrentApys(['aaveV3']);
    const reasons = obs
      .evidenceEvents()
      .filter((e) => e.outcome === 'SERVED_FALLBACK')
      .map((e) => e.reason);
    expect(reasons).toContain('IDENTITY_NOT_SATISFIED');
  });

  it('should name an UNDETERMINED composition distinctly from an identity mismatch', async () => {
    const { provider, obs } = await freshWith([pool({ apyBase: null, apyReward: null })]);
    await provider.getCurrentApys(['aaveV3']);
    expect(obs.evidenceEvents().map((e) => e.reason)).toContain('COMPOSITION_UNDETERMINED');
  });

  it('should record a failed fetch as such, per leg', async () => {
    const failing = (async () => {
      throw new Error('network');
    }) as unknown as typeof fetch;
    const { provider, obs } = await freshWith([], failing);
    await provider.getCurrentApys(['aaveV3', 'skySsr']);
    const fetchFailed = obs.evidenceEvents().filter((e) => e.reason === 'FETCH_FAILED');
    expect(fetchFailed).toHaveLength(2);
  });
});

describe('Block G · reporting, never control', () => {
  beforeEach(() => __resetEvidenceEvents());

  it('should change NO decision — the same call answers the same way either way', () => {
    /**
     * ⚑ G REPORTS, A DECIDES. Health exists so nothing can CLAIM a failing
     * source is fine and is read by the decision point. This is a record of
     * what was already decided; if it could alter an outcome it would be a
     * control path wearing an observability name.
     */
    const before = fallbackFor('APY_CURRENT');
    for (let i = 0; i < 50; i += 1) {
      recordEvidenceEvent({
        subject: 'APY_CURRENT',
        source: 'defillama',
        outcome: 'REFUSED',
        reason: 'FETCH_FAILED',
      });
    }
    expect(fallbackFor('APY_CURRENT')).toEqual(before);
  });

  it('should carry NO value, payload, url or key — only codes', () => {
    recordEvidenceEvent({
      subject: 'PRICE_CURRENT',
      source: 'coingecko',
      outcome: 'REFUSED',
      reason: 'ABOVE_MAXIMUM',
    });
    const [e] = evidenceEvents();
    expect(Object.keys(e).sort()).toEqual(['at', 'outcome', 'reason', 'source', 'subject']);
    /* Structural: the module has no way to accept a value or a response. */
    const code = readFileSync(join(__dirname, '..', 'evidenceObservability.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const banned of ['value', 'payload', 'url', 'apiKey', 'body', 'response']) {
      expect(code, banned).not.toMatch(new RegExp(`\\b${banned}\\b`));
    }
  });

  it('should perform NO I/O of its own — this package stays environment-free', () => {
    const code = readFileSync(join(__dirname, '..', 'evidenceObservability.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const banned of ['console', 'fetch', 'process.env', 'writeFile', 'setInterval']) {
      expect(code, banned).not.toContain(banned);
    }
  });

  it('should stay BOUNDED — an unbounded buffer is a leak with a helpful name', () => {
    for (let i = 0; i < 600; i += 1) {
      recordEvidenceEvent({ subject: 'APY_CURRENT', source: 'fixture', outcome: 'SERVED_PRIMARY' });
    }
    expect(evidenceEvents().length).toBeLessThanOrEqual(500);
  });

  it('should drain, and draining should empty it', () => {
    recordEvidenceEvent({ subject: 'NETWORK_COST', source: 'fixture', outcome: 'SERVED_PRIMARY' });
    expect(drainEvidenceEvents()).toHaveLength(1);
    expect(evidenceEvents()).toHaveLength(0);
    expect(evidenceOutcomeCounts()).toEqual({
      SERVED_PRIMARY: 0,
      SERVED_FALLBACK: 0,
      REFUSED: 0,
    });
  });

  it('should never throw, whatever it is handed', () => {
    expect(() =>
      recordEvidenceEvent({
        subject: 'APY_CURRENT',
        source: 'defillama',
        outcome: 'REFUSED',
        now: new Date(Number.NaN),
      })
    ).not.toThrow();
  });
});
