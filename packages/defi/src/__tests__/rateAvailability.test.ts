import { describe, expect, it } from 'vitest';
import { DEFAULT_PRACTICE_REFERENCE_POLICY } from '../freshnessPolicy';
import { freshnessUnder } from '../freshness';
import { getStrategy } from '../catalog';
import { strategyRateAvailability } from '../rateAvailability';
import { observedStamp } from '../testing';
import type { ProtocolApy } from '../types';

/**
 * `5.436` — the rate half of the `5.309` age contract.
 *
 * Product ruling 2026-09-22. The point of these tests is not that the bands
 * work — `currentFacing.test.ts` owns that — it is that the RATE path reaches
 * the same bands through the same function, and that unavailability is decided
 * per STRATEGY rather than per leg.
 */

const NOW = '2026-09-22T00:00:00.000Z';
const strategy = getStrategy('safeHarbor')!; // Sky SSR 50 / Aave V3 30 / Compound V3 20

function apysAged(days: number, only?: string): ProtocolApy[] {
  const asOf = new Date(Date.parse(NOW) - days * 86_400_000).toISOString();
  return strategy.allocation.map((leg) => ({
    protocolId: leg.protocolId,
    apyPercent: 4,
    tvlUsd: null,
    chain: 'Arbitrum' as const,
    stamp: observedStamp(
      'defillama',
      only && leg.protocolId !== only ? new Date(Date.parse(NOW) - 86_400_000).toISOString() : asOf
    ),
  }));
}

describe('a strategy rate is available only when every leg is', () => {
  it('should allow a live rate', () => {
    expect(strategyRateAvailability(strategy, apysAged(1), NOW)).toEqual({ available: true });
  });

  it('should still allow a STALE rate — stale is not unavailable', () => {
    /**
     * Ruling §9: `5.436` must not widen into the `>7 <=14` band. A 10-day rate
     * is STALE and stays usable under bounded reference use; only evidence the
     * policy has actually pushed to current-facing UNAVAILABLE is refused.
     */
    expect(freshnessUnder(apysAged(10)[0].stamp, NOW, DEFAULT_PRACTICE_REFERENCE_POLICY)).toBe(
      'STALE'
    );
    expect(strategyRateAvailability(strategy, apysAged(10), NOW)).toEqual({ available: true });
  });

  it('should refuse a rate outside the current-facing vintage', () => {
    expect(strategyRateAvailability(strategy, apysAged(20), NOW)).toEqual({
      available: false,
      reason: 'REFUSED_BY_CONTRACT',
    });
  });

  it('should refuse the WHOLE strategy when only ONE leg is over-age', () => {
    /**
     * All-or-nothing, like `I-G1d` for replay history. A 50/30/20 blend whose
     * 50% leg is unknowable is not "80% of a rate" — it is not a rate, and
     * publishing the other two as though they were the blend would be the
     * quiet substitution the whole contract exists to prevent.
     */
    const oneStale = apysAged(30, strategy.allocation[0].protocolId);
    expect(strategyRateAvailability(strategy, oneStale, NOW)).toEqual({
      available: false,
      reason: 'REFUSED_BY_CONTRACT',
    });
  });

  it('should refuse a MISSING leg rather than let it count as zero', () => {
    /* `blendedApy` reads `apyPercent ?? 0`, so an absent leg silently drags the
       blend down — `MISSING != 0` at the blend, the AUD-F05 class. */
    const missingOne = apysAged(1).slice(1);
    expect(strategyRateAvailability(strategy, missingOne, NOW)).toEqual({
      available: false,
      reason: 'NO_OBSERVATION',
    });
  });

  it('should hold no freshness rule of its own', () => {
    /* One derivation (X1): the rate path must compose the shared gate, never
       re-implement the bands. A second `14` here would be a second policy. */
    const src = readSource();
    for (const forbidden of ['14', '> 7', 'staleMaxDays', 'DAY_MS', 'Date.parse']) {
      expect(src, `${forbidden} would be a second freshness derivation`).not.toContain(forbidden);
    }
    expect(src).toContain('isRefusedForCurrentFacingUse');
  });
});

function readSource(): string {
  return require('node:fs')
    .readFileSync(new URL('../rateAvailability.ts', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}
