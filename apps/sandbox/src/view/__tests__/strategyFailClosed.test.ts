import { describe, expect, it, vi } from 'vitest';

/**
 * `5.814` · THE RATE LINE FAILS CLOSED WHERE ITS INPUTS DISAGREE.
 *
 * Two branches in `strategyRateDisplay` cannot be reached with consistent
 * evidence, by construction: a live or mixed origin always has a live leg, and
 * the newest live date is always set when one exists. They exist so that an
 * inconsistency upstream withholds the rate instead of rendering a line without
 * its date or a kind built on no live leg. Reaching them needs the provenance
 * answer replaced, so they live in their own file.
 */
const provenance = vi.hoisted(() => ({ override: null as null | Record<string, unknown> }));

vi.mock('@diboas/defi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@diboas/defi')>();
  return {
    ...actual,
    strategyProvenance: (...args: Parameters<typeof actual.strategyProvenance>) => {
      const real = actual.strategyProvenance(...args);
      return provenance.override ? { ...real, ...provenance.override } : real;
    },
  };
});

const { getStrategy, observedStamp } = await import('@diboas/defi');
const { strategyRateDisplay } = await import('../strategy');

const NOW = '2026-11-17T12:00:00.000Z';
const AN_HOUR_AGO = '2026-11-17T11:00:00.000Z';
const SAFE = getStrategy('safeHarbor')!;
const LIVE = SAFE.allocation.map((leg) => ({
  protocolId: leg.protocolId,
  apyPercent: 4,
  tvlUsd: null,
  chain: 'Arbitrum' as const,
  stamp: observedStamp('defillama', AN_HOUR_AGO),
}));
const WITHHELD = { displayable: false, reason: 'MISSING_REQUIRED_RATE' };

describe('5.814 · an inconsistent provenance answer withholds the rate', () => {
  it('should show the RECENT line when provenance is consistent (the control)', () => {
    provenance.override = null;
    const d = strategyRateDisplay(SAFE, LIVE, NOW);
    expect(d.displayable && d.label.kind).toBe('RECENT');
  });

  it('should withhold a live origin that lists every leg as documented', () => {
    provenance.override = {
      apyProvenance: 'live',
      fixtureProtocolIds: SAFE.allocation.map((leg) => leg.protocolId),
    };
    expect(strategyRateDisplay(SAFE, LIVE, NOW)).toEqual(WITHHELD);
  });

  it('should withhold a dated line when there is no live date to state', () => {
    provenance.override = { newestLiveAsOf: null, newestLiveSource: null };
    expect(strategyRateDisplay(SAFE, LIVE, NOW)).toEqual(WITHHELD);
  });
});
