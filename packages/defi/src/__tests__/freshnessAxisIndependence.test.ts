import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { enforceCurrentFacingAvailability, isRefusedForCurrentFacingUse } from '../currentFacing';
import { referenceEvidence, type CostCoverage } from '../evidence';
import { evidenceStamp, type DataStamp } from '../types';

/**
 * STAGE H · MODE IS NOT AN AXIS, AND NEITHER IS ORIGIN.
 *
 * The migration plan's H row carries an explicit generalize condition —
 * *"never equate mode with freshness/availability"* — and canon §21 states it
 * as a prohibition: *"H must not equate mode with freshness, availability or
 * actionability."* This file makes that structural rather than remembered.
 *
 * Two independent proofs, because either alone is weak:
 *
 * ```text
 * BEHAVIOURAL  the same stamp at the same instant yields the same verdict for
 *              every EvidenceOrigin — so origin cannot leak into the age rule
 * STRUCTURAL   the H modules mention no mode, scope or journey vocabulary at
 *              all, so a mode-dependent verdict is not merely absent, it is
 *              unexpressible without editing these files
 * ```
 *
 * The structural half mirrors the G-layer guard in `normalize.test.ts`: the two
 * boundaries are enforced the same way, from opposite sides.
 */

const NOW = '2026-09-22T00:00:00.000Z';
const COVERAGE: CostCoverage = { kind: 'single', category: 'network' };
const ORIGINS = ['OBSERVED', 'MODELLED', 'PROXY'] as const;

const stampOf = (origin: DataStamp['origin'], days: number): DataStamp =>
  evidenceStamp({
    source: 'defillama',
    origin,
    asOf: new Date(Date.parse(NOW) - days * 86_400_000).toISOString(),
  });

/** Source with comments stripped — prose naming a concept is not a dependency. */
const codeOf = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

describe('freshness ≠ origin — every origin is judged by the same clock', () => {
  it.each(ORIGINS)('should give %s the same verdict as every other origin', (origin) => {
    /* A MODELLED fixture is not refused for being modelled, and an OBSERVED
       reading is not spared for being observed. Age is age. */
    expect(isRefusedForCurrentFacingUse(stampOf(origin, 3), NOW)).toBe(false);
    expect(isRefusedForCurrentFacingUse(stampOf(origin, 10), NOW)).toBe(false);
    expect(isRefusedForCurrentFacingUse(stampOf(origin, 20), NOW)).toBe(true);
  });

  it('should preserve origin untouched on the evidence it lets through', () => {
    /* The gate may change availability. It may not launder a MODELLED value
       into an OBSERVED one on the way past — `EXTERNAL SOURCE != OBSERVED`
       applies to anything that handles a stamp, not only to what stamps it. */
    const evidence = referenceEvidence({
      value: 1.25,
      stamp: stampOf('MODELLED', 3),
      normalization: { converted: false },
      coverage: COVERAGE,
    });
    const out = enforceCurrentFacingAvailability(evidence, NOW);
    if (out.availability !== 'AVAILABLE') throw new Error('expected AVAILABLE');
    expect(out.stamp.origin).toBe('MODELLED');
    expect(out.stamp).toEqual(evidence.availability === 'AVAILABLE' ? evidence.stamp : null);
  });
});

describe('the H layer knows nothing about mode, scope or journey state', () => {
  it.each(['../currentFacing.ts', '../freshnessPolicy.ts', '../freshness.ts'])(
    'should carry no mode, scope or journey vocabulary in %s',
    (file) => {
      const code = codeOf(file);
      for (const forbidden of ['LedgerScope', 'journey', 'mode']) {
        expect(
          code,
          `${forbidden} in ${file} would let mode decide freshness or availability`
        ).not.toContain(forbidden);
      }
    }
  );

  /**
   * ⚑ THE MODE WORDS ARE CHECKED BY CONTEXT, NOT BY ABSENCE — and a first
   * draft of this guard got that wrong. It banned the bare token `practice`
   * and failed on `practice-periodic-reference`, which is the POLICY
   * CLASSIFICATION's name (the ruling's own wording), not a mode dependency.
   *
   * Narrowing by quoting the context rather than by adding an exception: every
   * occurrence must be part of one of the two named identifiers. A genuine
   * mode branch — `if (scope === 'practice')` — still fails, because it cannot
   * spell the word inside either identifier.
   */
  it.each(['../currentFacing.ts', '../freshnessPolicy.ts', '../freshness.ts'])(
    'should use the mode words ONLY inside the classification identifier in %s',
    (file) => {
      const code = codeOf(file);
      const ALLOWED = /practice-periodic-reference|PRACTICE_REFERENCE_POLICY/g;
      const residue = code.replace(ALLOWED, '');
      for (const forbidden of ['practice', 'Practice', 'real', 'Real']) {
        expect(
          residue,
          `${forbidden} in ${file} outside the classification name would be a mode dependency`
        ).not.toContain(forbidden);
      }
    }
  );

  it('should expose no entry point that could accept a mode', () => {
    /* Argument lists are the surface a future caller would reach for. Neither
       function takes anything but evidence, a clock and a policy subject. */
    expect(enforceCurrentFacingAvailability.length).toBeLessThanOrEqual(3);
    expect(isRefusedForCurrentFacingUse.length).toBeLessThanOrEqual(3);
  });
});
