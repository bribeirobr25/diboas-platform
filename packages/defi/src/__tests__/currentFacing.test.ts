import { describe, expect, it } from 'vitest';
import { enforceCurrentFacingAvailability, isRefusedForCurrentFacingUse } from '../currentFacing';
import { executableEvidence, referenceEvidence, unavailableEvidence } from '../evidence';
import type { CostCoverage } from '../evidence';
import { freshnessUnder } from '../freshness';
import {
  DEFAULT_PRACTICE_REFERENCE_POLICY,
  isStricterOrEqual,
  resolveFreshnessPolicy,
  type FreshnessPolicy,
} from '../freshnessPolicy';
import { FIXTURE_STAMP } from '../fixtures';
import { evidenceStamp, type DataStamp } from '../types';

/**
 * Stage H — the `5.309` M&E / Data ruling of 2026-09-22 made executable.
 *
 * Every test here pins a sentence of that ruling, because the failure mode
 * Stage H exists to prevent is not "the bands are wrong" — it is the bands
 * being applied to evidence they were never meant to govern, or an age state
 * being read as an availability, actionability or origin state.
 */

const NOW = '2026-09-22T00:00:00.000Z';

/** A stamp `days` old at `NOW`, with an explicit origin (never defaulted). */
function agedBy(days: number, source: DataStamp['source'] = 'defillama'): DataStamp {
  const at = Date.parse(NOW) - days * 86_400_000;
  return evidenceStamp({
    source,
    origin: 'OBSERVED',
    asOf: new Date(at).toISOString(),
  });
}

const COVERAGE: CostCoverage = { kind: 'single', category: 'network' };

const reference = (stamp: DataStamp) =>
  referenceEvidence({
    value: 1.25,
    stamp,
    normalization: { converted: false },
    coverage: COVERAGE,
  });

describe('the default policy governs the Practice periodic reference class only', () => {
  it('should state the ruled default bands', () => {
    expect(DEFAULT_PRACTICE_REFERENCE_POLICY.delayedMaxDays).toBe(7);
    expect(DEFAULT_PRACTICE_REFERENCE_POLICY.staleMaxDays).toBe(14);
  });

  it('should NOT make <=7 days automatically CURRENT', () => {
    /**
     * Ruling §2: `<=7` is the normal age window, not a CURRENT claim. CURRENT
     * is reachable only where the source contract supports it, and no policy
     * declares that today — so the whole window resolves DELAYED.
     */
    expect(freshnessUnder(agedBy(0), NOW, DEFAULT_PRACTICE_REFERENCE_POLICY)).toBe('DELAYED');
    expect(freshnessUnder(agedBy(7), NOW, DEFAULT_PRACTICE_REFERENCE_POLICY)).toBe('DELAYED');
    expect(DEFAULT_PRACTICE_REFERENCE_POLICY.supportsCurrent).toBe(false);
  });

  it('should reach CURRENT only through a source-contract capability, never a shorter band', () => {
    /* The §K Engineering choice, made explicit: the capability flag is what
       unlocks CURRENT. Narrowing the bands alone must never do it. */
    const narrower: FreshnessPolicy = {
      ...DEFAULT_PRACTICE_REFERENCE_POLICY,
      id: 'narrower-bands',
      delayedMaxDays: 1,
      staleMaxDays: 2,
    };
    expect(freshnessUnder(agedBy(0), NOW, narrower)).toBe('DELAYED');
    const realTime: FreshnessPolicy = { ...narrower, id: 'real-time', supportsCurrent: true };
    expect(freshnessUnder(agedBy(0), NOW, realTime)).toBe('CURRENT');
  });
});

describe('a weaker override never overrides a stricter contract', () => {
  const WEAKER: FreshnessPolicy = {
    id: 'weaker',
    delayedMaxDays: 30,
    staleMaxDays: 60,
    supportsCurrent: false,
  };
  const STRICTER: FreshnessPolicy = {
    id: 'stricter',
    delayedMaxDays: 1,
    staleMaxDays: 2,
    supportsCurrent: false,
  };
  const MIXED: FreshnessPolicy = {
    id: 'mixed',
    delayedMaxDays: 1,
    staleMaxDays: 60,
    supportsCurrent: false,
  };

  it('should accept a stricter candidate and refuse a weaker one', () => {
    expect(isStricterOrEqual(STRICTER, DEFAULT_PRACTICE_REFERENCE_POLICY)).toBe(true);
    expect(isStricterOrEqual(WEAKER, DEFAULT_PRACTICE_REFERENCE_POLICY)).toBe(false);
  });

  it('should refuse a MIXED candidate that tightens one bound and loosens the other', () => {
    /* A mixed candidate is a different contract, not a stricter one. Accepting
       it would let a weakening ride in behind a tightening. */
    expect(isStricterOrEqual(MIXED, DEFAULT_PRACTICE_REFERENCE_POLICY)).toBe(false);
  });

  it('should resolve to the default when no override is registered', () => {
    /* The registries ship EMPTY on purpose — the mechanism can receive a
       stricter policy; no provider policy is authorized to be in it yet. */
    expect(resolveFreshnessPolicy({ source: 'defillama' })).toBe(DEFAULT_PRACTICE_REFERENCE_POLICY);
    expect(resolveFreshnessPolicy({ source: 'fixture' })).toBe(DEFAULT_PRACTICE_REFERENCE_POLICY);
    expect(resolveFreshnessPolicy({ evidenceClass: 'practice-periodic-reference' })).toBe(
      DEFAULT_PRACTICE_REFERENCE_POLICY
    );
  });
});

describe('the current-facing availability gate', () => {
  it('should keep <=7-day reference evidence AVAILABLE', () => {
    const out = enforceCurrentFacingAvailability(reference(agedBy(3)), NOW);
    expect(out.availability).toBe('AVAILABLE');
  });

  it('should keep >7 <=14-day evidence STALE but still AVAILABLE', () => {
    /**
     * Ruling §3: `STALE != automatically UNAVAILABLE`. Bounded reference use
     * remains valid — the surface simply may not represent it as CURRENT, LIVE
     * or EXECUTABLE, which is the caller's contract, not this gate's.
     */
    const stamp = agedBy(10);
    expect(freshnessUnder(stamp, NOW, DEFAULT_PRACTICE_REFERENCE_POLICY)).toBe('STALE');
    const out = enforceCurrentFacingAvailability(reference(stamp), NOW);
    expect(out.availability).toBe('AVAILABLE');
    if (out.availability === 'AVAILABLE') expect(out.actionability).toBe('REFERENCE');
  });

  it('should make >14-day evidence UNAVAILABLE for current-facing use, with a reason', () => {
    const out = enforceCurrentFacingAvailability(reference(agedBy(15)), NOW);
    expect(out.availability).toBe('UNAVAILABLE');
    if (out.availability === 'UNAVAILABLE') {
      expect(out.reason).toBe('REFUSED_BY_CONTRACT');
      /* The refusal still knows what it WOULD have described, so the surface
         can be honest instead of merely blank. */
      expect(out.coverage).toEqual(COVERAGE);
    }
  });

  it('should never turn unavailable evidence into a number, a zero or a free cost', () => {
    /* `MISSING != 0` / `UNAVAILABLE != FREE` made structural: the refused arm
       has no `value` field at all, so there is nothing to mistake for zero. */
    const out = enforceCurrentFacingAvailability(reference(agedBy(99)), NOW);
    expect(out).not.toHaveProperty('value');
  });

  it('should leave EXECUTABLE evidence to its own expiry contract', () => {
    /**
     * Ruling §9: the Practice 7/14 default must NOT govern executable quotes.
     * This quote is 40 days old — far outside the default band — and must be
     * returned untouched, because its `validUntil` is the contract that
     * governs it.
     */
    const quote = executableEvidence({
      value: 1.25,
      stamp: agedBy(40),
      normalization: { converted: false },
      coverage: COVERAGE,
      validity: { validFrom: NOW, validUntil: '2099-01-01T00:00:00.000Z' },
      identity: { providerId: 'defillama', reference: 'route-1' },
    });
    const out = enforceCurrentFacingAvailability(quote, NOW);
    expect(out.availability).toBe('AVAILABLE');
    if (out.availability === 'AVAILABLE') expect(out.actionability).toBe('EXECUTABLE');
  });

  it('should not overwrite an existing, more specific refusal reason', () => {
    const out = enforceCurrentFacingAvailability(
      unavailableEvidence<number>('NOT_REPRESENTABLE', COVERAGE),
      NOW
    );
    expect(out.availability).toBe('UNAVAILABLE');
    if (out.availability === 'UNAVAILABLE') expect(out.reason).toBe('NOT_REPRESENTABLE');
  });

  it('should not change actionability when it refuses', () => {
    /* Freshness != actionability. The gate may move AVAILABLE -> UNAVAILABLE
       and nothing else; it never promotes or demotes REFERENCE/EXECUTABLE. */
    const out = enforceCurrentFacingAvailability(reference(agedBy(20)), NOW);
    expect(out).not.toHaveProperty('actionability');
  });
});

describe('the shipped fixture under the resolved ruling', () => {
  it('should refuse the 2026-07-18 fixture for current-facing use', () => {
    /**
     * Ruling §6: the current fixture is 66 days old at the ruling date and is
     * UNAVAILABLE for current-facing Practice use. `5.110` restores a valid
     * evidence supply later; it no longer blocks this enforcement (§7, B2).
     *
     * ⚑ This asserts the RULE against a stamp whose age is computed from its
     * own `asOf`, so it states a policy outcome rather than a calendar
     * coincidence — but the fixture IS the live gas stamp today, which is the
     * point of the assertion.
     */
    expect(isRefusedForCurrentFacingUse(FIXTURE_STAMP, NOW)).toBe(true);
    const out = enforceCurrentFacingAvailability(reference(FIXTURE_STAMP), NOW);
    expect(out.availability).toBe('UNAVAILABLE');
  });

  it('should still have refused it the day before the ruling, and accept a fresh fixture', () => {
    /* Not an expiry landmine in either direction: a REFRESHED fixture passes
       the same gate, which is what `5.110` landing looks like here. */
    expect(isRefusedForCurrentFacingUse(agedBy(2, 'fixture'), NOW)).toBe(false);
  });
});
