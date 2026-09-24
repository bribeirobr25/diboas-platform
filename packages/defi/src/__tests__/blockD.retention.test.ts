import { describe, expect, it } from 'vitest';

import { isEvidenceExpired, isRecordExpired } from '../evidenceRetention';
import { reconcileRetention, retentionFor, type RetentionClass } from '../retentionPolicy';
import { mayPersistNormalized, persistenceRightFor } from '../sourcePersistenceRights';
import { EVIDENCE_SOURCES, type EvidenceSourceId } from '../types';

const CLASSES: RetentionClass[] = [
  'DERIVED_MARKET_EVIDENCE',
  'REPLAY_HISTORY',
  'PROVENANCE',
  'RAW_TRANSIENT',
];
const SOURCES = Object.keys(EVIDENCE_SOURCES) as EvidenceSourceId[];
const DAY = 86_400_000;
const at = '2026-01-01T00:00:00.000Z';
const plus = (days: number) => new Date(Date.parse(at) + days * DAY).toISOString();

/** BLOCK D · PERSISTENCE + PER-CLASS RETENTION. */
describe('Block D · retention is per class, never one universal number', () => {
  it('should declare a rule with a stated basis for every class', () => {
    for (const cls of CLASSES) {
      const r = retentionFor(cls);
      expect(r.because.length, cls).toBeGreaterThan(20);
    }
  });

  it('should keep the 90-day window EXACTLY as it was for the class it was written for', () => {
    const r = retentionFor('DERIVED_MARKET_EVIDENCE');
    expect(r.kind).toBe('ELAPSED_DAYS');
    if (r.kind !== 'ELAPSED_DAYS') throw new Error('unreachable');
    expect(r.days).toBe(90);
    /* The pinned boundary is unchanged: inclusive at expiry, exclusive below. */
    expect(isEvidenceExpired(at, plus(89.999))).toBe(false);
    expect(isEvidenceExpired(at, plus(90))).toBe(true);
  });

  it('should express replay history as COVERAGE, not as a TTL', () => {
    const r = retentionFor('REPLAY_HISTORY');
    expect(r.kind).toBe('COVERAGE');
    if (r.kind !== 'COVERAGE') throw new Error('unreachable');
    expect(r.replayDays).toBe(365);
    expect(r.boundaryObservations).toBe(1);
  });

  it('should NEVER expire a COVERAGE class on an elapsed clock', () => {
    /**
     * The defect the universal rule would have caused: replay evidence is kept
     * because the WINDOW needs it. Ageing it out on a timer makes a reachable
     * replay silently unreachable — which is worse than refusing it, because
     * nothing announces the loss.
     */
    expect(isEvidenceExpired(at, plus(10_000), 'REPLAY_HISTORY')).toBe(false);
    expect(isRecordExpired({ retrievedAt: at }, plus(10_000), 'REPLAY_HISTORY')).toBe(false);
    /* While the derived class still ages exactly as before. */
    expect(isRecordExpired({ retrievedAt: at }, plus(91))).toBe(true);
  });

  it('should treat an unparseable clock as EXPIRED — retention protects people', () => {
    expect(isEvidenceExpired('not-a-date', plus(1))).toBe(true);
    expect(isEvidenceExpired(at, 'not-a-date')).toBe(true);
  });
});

describe('Block D · required coverage and permitted rights are a CONJUNCTION', () => {
  it('should be satisfiable when the ceiling covers the requirement', () => {
    expect(reconcileRetention({ cls: 'REPLAY_HISTORY', permittedCeilingDays: 400 })).toEqual({
      satisfiable: true,
      requiredDays: 366,
    });
    expect(reconcileRetention({ cls: 'REPLAY_HISTORY', permittedCeilingDays: null })).toEqual({
      satisfiable: true,
      requiredDays: 366,
    });
  });

  it('should refuse INELIGIBLE rather than quietly take the shorter window', () => {
    /**
     * ⚑ NOT A min(). A `min()` would return 180 and call it compliant — a
     * replay that cannot reach its boundary would render as though it could.
     * The verdict surfaces the conflict so another eligible path can be used,
     * or the replay degraded to CONTROLLED UNAVAILABLE.
     */
    const r = reconcileRetention({ cls: 'REPLAY_HISTORY', permittedCeilingDays: 180 });
    expect(r.satisfiable).toBe(false);
    if (r.satisfiable) throw new Error('unreachable');
    expect(r.conflict).toBe('PERMITTED_CEILING_SHORTER_THAN_REQUIRED_COVERAGE');
    expect(r.requiredDays).toBe(366);
    /* The refused verdict must not carry a usable shortened window. */
    expect(r).not.toHaveProperty('effectiveDays');
    expect(Object.values(r)).not.toContain(180);
  });

  it('should apply the same conjunction to the derived class', () => {
    expect(
      reconcileRetention({ cls: 'DERIVED_MARKET_EVIDENCE', permittedCeilingDays: 30 }).satisfiable
    ).toBe(false);
    expect(
      reconcileRetention({ cls: 'DERIVED_MARKET_EVIDENCE', permittedCeilingDays: 90 }).satisfiable
    ).toBe(true);
  });
});

describe('Block D · persistence is a declared right, not a hard-coded set', () => {
  it('should state a right with a named basis for every registry source', () => {
    for (const source of SOURCES) {
      const r = persistenceRightFor(source);
      expect(r.because.length, source).toBeGreaterThan(20);
      expect(typeof r.mayPersistNormalized, source).toBe('boolean');
    }
  });

  it('should NOT widen any source in fact — fetch authority is not storage authority', () => {
    /**
     * The lane became declarative; nothing became persistable. Flipping a
     * provider is a Legal/Founder decision because a material expansion of
     * retention or redistribution is an explicit review trigger.
     *
     * Sabotage: flip either provider to true and this fails, naming it.
     */
    expect(mayPersistNormalized('fixture')).toBe(true);
    expect(mayPersistNormalized('coingecko')).toBe(false);
    expect(mayPersistNormalized('defillama')).toBe(false);
  });

  it('should name LC-LIC-01 or the review trigger wherever a provider is withheld', () => {
    for (const source of ['coingecko', 'defillama'] as const) {
      const { because } = persistenceRightFor(source);
      expect(because, source).toMatch(/LC-LIC-01|storage authority|review trigger/i);
    }
  });
});
