import { beforeEach, describe, expect, it } from 'vitest';

import { boundsFor, boundsRefusal, withinBounds } from '../evidenceBounds';
import { originDetermination, originOf } from '../evidenceOrigin';
import {
  __resetSourceHealth,
  isSourceHealthy,
  recordSourceOutcome,
  sourceHealth,
} from '../sourceHealth';
import { fallbackFor } from '../fallbackEligibility';
import { EVIDENCE_SOURCES, type EvidenceSourceId } from '../types';
import type { EvidenceSubject } from '../fallbackEligibility';

const SOURCES = Object.keys(EVIDENCE_SOURCES) as EvidenceSourceId[];
const SUBJECTS: EvidenceSubject[] = [
  'APY_CURRENT',
  'APY_HISTORY',
  'PRICE_CURRENT',
  'PRICE_HISTORY',
  'NETWORK_COST',
];

/**
 * BLOCK A · EVIDENCE ORIGIN + VALIDATION TRUTH.
 *
 * Three rules, each of which shipped absent: an origin that was a constant
 * rather than a determination, a value nothing bounded, and a source nothing
 * could call unhealthy.
 */
describe('Block A · origin is DETERMINED, never assumed', () => {
  it('should carry a determination for every source x subject (fail-closed by exhaustion)', () => {
    /* The instrument first: a table with a hole would let a future source stamp
       a default. Exhaustion is enforced by the type, and proven here. */
    expect(SOURCES.length).toBeGreaterThan(2);
    for (const source of SOURCES) {
      for (const subject of SUBJECTS) {
        const d = originDetermination(source, subject);
        expect(d, `${source}/${subject}`).toBeDefined();
        expect(d.origin, `${source}/${subject}`).toMatch(/^(OBSERVED|MODELLED|PROXY)$/);
      }
    }
  });

  it('should state a BASIS on every determination, because the basis is the determination', () => {
    for (const source of SOURCES) {
      for (const subject of SUBJECTS) {
        const { because } = originDetermination(source, subject);
        expect(because.length, `${source}/${subject}`).toBeGreaterThan(20);
      }
    }
  });

  it('should never classify diBoaS-authored reference values as OBSERVED', () => {
    /* The fixture observes nothing: no request is issued and no chain is read.
       MODELLED is what FIXTURE_STAMP has always carried, and the table must not
       be able to disagree with it. */
    for (const subject of SUBJECTS) {
      expect(originOf('fixture', subject), subject).toBe('MODELLED');
    }
  });

  it('should mark the APY subjects as pending their SEMANTICS while stating the origin', () => {
    /**
     * ORIGIN ≠ SEMANTICS. The origin of DeFiLlama's rate is answerable today;
     * what the rate composes — supply vs borrow, base vs incentive, native vs
     * bridged — is not, and Block B resolves it. The marker exists so a
     * truthful origin is never read as evidence that the semantics were settled.
     */
    for (const subject of ['APY_CURRENT', 'APY_HISTORY'] as const) {
      const d = originDetermination('defillama', subject);
      expect(d.pendingSemantics, subject).toMatch(/Block B/);
    }
    /* And the converse: a subject whose semantics ARE settled carries no marker. */
    expect(originDetermination('coingecko', 'PRICE_CURRENT').pendingSemantics).toBeUndefined();
  });
});

describe('Block A · plausible domain bounds', () => {
  it('should declare bounds for every evidence subject', () => {
    for (const subject of SUBJECTS) {
      const b = boundsFor(subject);
      expect(b.max, subject).toBeGreaterThan(b.min);
      expect(b.because.length, subject).toBeGreaterThan(20);
    }
  });

  it('should REFUSE the four-digit APY that passed every previous check', () => {
    /* The named defect: `p.apy > 0` was the whole of the old validation, so a
       pool reporting 9000 % reached Product as a rate. */
    expect(boundsRefusal('APY_CURRENT', 9000)).toBe('ABOVE_MAXIMUM');
    expect(withinBounds('APY_CURRENT', 9000)).toBe(false);
    /* And the ordinary catalogue rates still pass, so the bound is not an
       economic opinion in disguise. */
    for (const apy of [0, 4.8, 6.5, 14])
      expect(withinBounds('APY_CURRENT', apy), `${apy}`).toBe(true);
  });

  it('should refuse non-finite and out-of-range values with a NAMED reason', () => {
    expect(boundsRefusal('PRICE_CURRENT', Number.NaN)).toBe('NOT_FINITE');
    expect(boundsRefusal('PRICE_CURRENT', Number.POSITIVE_INFINITY)).toBe('NOT_FINITE');
    expect(boundsRefusal('PRICE_CURRENT', -1)).toBe('BELOW_MINIMUM');
    expect(boundsRefusal('PRICE_CURRENT', 1e12)).toBe('ABOVE_MAXIMUM');
    expect(boundsRefusal('NETWORK_COST', -0.01)).toBe('BELOW_MINIMUM');
  });

  it('should REFUSE rather than clamp — the API cannot return a repaired value', () => {
    /**
     * A clamped value is a fabricated value (Architecture §9, reset §2). The
     * protection here is structural: `boundsRefusal` returns a REASON or null
     * and `withinBounds` returns a boolean. Neither can hand back a number, so
     * no caller can accidentally receive a repaired one.
     */
    const refusal: string | null = boundsRefusal('APY_CURRENT', 9000);
    expect(typeof refusal).toBe('string');
    expect(typeof withinBounds('APY_CURRENT', 9000)).toBe('boolean');
  });
});

describe('Block A · source health', () => {
  beforeEach(() => __resetSourceHealth());

  it('should report a never-called source as healthy, with no third state', () => {
    expect(isSourceHealthy('defillama')).toBe(true);
    expect(sourceHealth('defillama')).toEqual({
      healthy: true,
      consecutiveFailures: 0,
      lastOutcome: null,
    });
  });

  it('should stop claiming healthy once observations actually fail', () => {
    /* One timeout is network weather; three in a row is the source. */
    recordSourceOutcome('defillama', 'FAILURE');
    expect(isSourceHealthy('defillama')).toBe(true);
    recordSourceOutcome('defillama', 'FAILURE');
    expect(isSourceHealthy('defillama')).toBe(true);
    recordSourceOutcome('defillama', 'FAILURE');
    expect(isSourceHealthy('defillama')).toBe(false);
    expect(sourceHealth('defillama').consecutiveFailures).toBe(3);
  });

  it('should reset on success — the question is "failing now", not "on balance"', () => {
    for (let i = 0; i < 5; i += 1) recordSourceOutcome('coingecko', 'FAILURE');
    expect(isSourceHealthy('coingecko')).toBe(false);
    recordSourceOutcome('coingecko', 'SUCCESS');
    expect(isSourceHealthy('coingecko')).toBe(true);
    expect(sourceHealth('coingecko').consecutiveFailures).toBe(0);
  });

  it('should track sources INDEPENDENTLY — one failing must not condemn another', () => {
    for (let i = 0; i < 3; i += 1) recordSourceOutcome('defillama', 'FAILURE');
    expect(isSourceHealthy('defillama')).toBe(false);
    expect(isSourceHealthy('coingecko')).toBe(true);
    expect(isSourceHealthy('fixture')).toBe(true);
  });

  it('should NOT be eligibility — an unhealthy source changes no fallback decision', () => {
    /**
     * ⚑ The interlock. `§11a` fixed the defect where a failure handler decided
     * substitution on its own authority. Health must not quietly become a
     * second such authority: it is a technical fact, never a right — the same
     * relationship freshness has to eligibility.
     */
    const before = fallbackFor('APY_CURRENT');
    for (let i = 0; i < 10; i += 1) recordSourceOutcome('defillama', 'FAILURE');
    expect(isSourceHealthy('defillama')).toBe(false);
    expect(fallbackFor('APY_CURRENT')).toEqual(before);
  });
});
