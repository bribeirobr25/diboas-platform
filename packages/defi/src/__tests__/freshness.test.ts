import { describe, expect, it } from 'vitest';
import { FRESHNESS_DELAYED_MAX_DAYS, FRESHNESS_STALE_MAX_DAYS, dataFreshness } from '../freshness';
import { FIXTURE_AS_OF, FIXTURE_STAMP, FIXTURE_VERSION } from '../fixtures';
import { observedStamp } from '../types';

/** A stamp retrieved `days` before the reference moment. */
function agedBy(days: number) {
  const now = Date.parse('2026-09-14T00:00:00.000Z');
  return observedStamp('defillama', new Date(now - days * 86_400_000).toISOString());
}
const NOW = '2026-09-14T00:00:00.000Z';

describe('dataFreshness — the §8.5 age bands', () => {
  it('should call a fresh retrieval DELAYED, never CURRENT', () => {
    /**
     * Neither provider's contract promises real-time and the sandbox caches at
     * the ruled 6 h TTL, so CURRENT would overstate what we know. §8.5 allows
     * CURRENT only when "the source contract independently supports" it.
     */
    expect(dataFreshness(agedBy(0), NOW)).toBe('DELAYED');
    expect(dataFreshness(agedBy(FRESHNESS_DELAYED_MAX_DAYS), NOW)).toBe('DELAYED');
  });

  it('should call 7-to-14 days STALE', () => {
    expect(dataFreshness(agedBy(FRESHNESS_DELAYED_MAX_DAYS + 0.5), NOW)).toBe('STALE');
    expect(dataFreshness(agedBy(FRESHNESS_STALE_MAX_DAYS), NOW)).toBe('STALE');
  });

  it('should refuse anything past 14 days as MISSING, not merely old', () => {
    // §8.7: the rate-dependent output becomes unavailable/incomplete — and
    // MISSING is emphatically not 0.
    expect(dataFreshness(agedBy(FRESHNESS_STALE_MAX_DAYS + 0.5), NOW)).toBe('MISSING');
    expect(dataFreshness(agedBy(90), NOW)).toBe('MISSING');
  });

  it('should treat an unusable or future timestamp as MISSING, never as fresh', () => {
    // Fail-honest direction: a clock skew must not be able to manufacture
    // currency, and garbage must not read as CURRENT.
    expect(dataFreshness(observedStamp('defillama', 'not-a-date'), NOW)).toBe('MISSING');
    expect(dataFreshness(agedBy(-5), NOW)).toBe('MISSING');
  });
});

describe('the stamp builders state provenance that a literal could omit', () => {
  it('should mark a live read OBSERVED, with no fallback and no fixture version', () => {
    const s = observedStamp('coingecko', NOW);
    expect(s.origin).toBe('OBSERVED');
    expect(s.fallbackUsed).toBe(false);
    expect(s.fixtureVersion).toBeNull();
    // Honest about what the APIs do not give us: no per-value observation time.
    expect(s.observedAt).toBeNull();
  });

  it('should mark every fixture MODELLED, fallback-used, and version-identified', () => {
    expect(FIXTURE_STAMP.origin).toBe('MODELLED');
    expect(FIXTURE_STAMP.fallbackUsed).toBe(true);
    expect(FIXTURE_STAMP.fixtureVersion).toBe(FIXTURE_VERSION);
    // Unlike a provider, the fixture set DOES know when it was observed.
    expect(FIXTURE_STAMP.observedAt).toBe(FIXTURE_AS_OF);
  });
});

describe('the shipped fixture against the age rule (registers 5.309 / 5.355)', () => {
  /**
   * ⚑ This pins a REAL conflict rather than describing it. `FIXTURE_AS_OF` is
   * 2026-07-18 — 58 days before the audit date — so under §8.5 every
   * fixture-backed rate is MISSING for current-facing use TODAY. That is why
   * §8.5 cannot be enforced at the consumer before the weekly refresh cadence
   * (`5.110`) lands: switching it on first would take every fallback rate
   * offline.
   *
   * When the cadence lands and the fixture refreshes, this test FAILS — which
   * is the intent. It is a tripwire on a known conflict, not an expiry
   * landmine: its failure means the conflict is resolved and §8.5 can be
   * enforced at the consumer.
   */
  it('should report the shipped fixture as MISSING for current-facing use', () => {
    expect(dataFreshness(FIXTURE_STAMP, NOW)).toBe('MISSING');
  });
});
