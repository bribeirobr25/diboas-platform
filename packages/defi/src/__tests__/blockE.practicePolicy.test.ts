import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PRACTICE_REFERENCE_POLICY,
  practiceBoundsFor,
  withinPracticeRefreshCeiling,
} from '../practicePolicy';
import { fallbackFor } from '../fallbackEligibility';
import { DEFAULT_PRACTICE_REFERENCE_POLICY } from '../freshnessPolicy';
import { SANDBOX_MARKET_TTL_MS } from '../types';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/** BLOCK E · PRACTICE EVIDENCE POLICY. */
describe('Block E · the Practice standard is declared, not scattered', () => {
  it('should state the whole standard in one readable object', () => {
    expect(PRACTICE_REFERENCE_POLICY).toMatchObject({
      id: 'practice-reference-grade',
      expenditure: 'NONE',
      actionability: 'REFERENCE',
      permitsExecution: false,
    });
    expect(PRACTICE_REFERENCE_POLICY.because.length).toBeGreaterThan(40);
  });

  it('should carry the ratified <=6h ceiling, as a number and not a comment', () => {
    expect(PRACTICE_REFERENCE_POLICY.maxRefreshIntervalMs).toBe(SIX_HOURS_MS);
    /* And it is the SAME constant the cache actually uses — not a copy that
       could drift away from the thing it claims to describe. */
    expect(PRACTICE_REFERENCE_POLICY.maxRefreshIntervalMs).toBe(SANDBOX_MARKET_TTL_MS);
  });

  it('should allow a STRICTER cadence and refuse a looser one', () => {
    expect(withinPracticeRefreshCeiling(SIX_HOURS_MS)).toBe(true);
    expect(withinPracticeRefreshCeiling(60_000)).toBe(true);
    expect(withinPracticeRefreshCeiling(SIX_HOURS_MS + 1)).toBe(false);
    expect(withinPracticeRefreshCeiling(24 * SIX_HOURS_MS)).toBe(false);
    /* Nonsense is refused rather than treated as "no ceiling". */
    expect(withinPracticeRefreshCeiling(0)).toBe(false);
    expect(withinPracticeRefreshCeiling(-1)).toBe(false);
    expect(withinPracticeRefreshCeiling(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('should agree with the seams that actually enforce it', () => {
    /**
     * ⚑ THE POINT OF THIS TEST. The policy declares; the seams enforce. If the
     * two ever disagree, the declaration becomes a comfortable fiction — which
     * is the failure this whole block exists to prevent.
     */
    expect(PRACTICE_REFERENCE_POLICY.freshness).toBe(DEFAULT_PRACTICE_REFERENCE_POLICY);
    /* $0: the eligible arm of a fallback decision accepts exactly one
       expenditure value, and it is the one the policy declares. */
    const decision = fallbackFor('APY_CURRENT');
    expect(decision.eligible).toBe(true);
    if (!decision.eligible) throw new Error('unreachable');
    expect(decision.expenditure).toBe(PRACTICE_REFERENCE_POLICY.expenditure);
    /* Bounds are reached THROUGH the policy, so there is one table, not two. */
    expect(practiceBoundsFor('APY_CURRENT')).toBe(practiceBoundsFor('APY_CURRENT'));
    expect(practiceBoundsFor('APY_CURRENT').max).toBe(1000);
  });

  it('should NOT key the policy on mode — that collapse is what canon forbids', () => {
    /**
     * `EVIDENCE ORIGIN ≠ ACTIONABILITY ≠ AVAILABILITY ≠ FRESHNESS`, and none of
     * them is `mode`. A policy object that branched on Practice/Real would be
     * exactly the collapse the axes exist to prevent. Real's policy differs in
     * its VALUES, not in its shape.
     */
    const src = readFileSync(join(__dirname, '..', 'practicePolicy.ts'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).toContain('PRACTICE_REFERENCE_POLICY');
    for (const banned of ['LedgerScope', "'real'", "'practice'", 'isReal', 'mode']) {
      expect(code, banned).not.toContain(banned);
    }
  });

  it('should leave the enforcing seams as the ONLY enforcers (no second path)', () => {
    /* A policy that also enforced would be a second thing to keep in
       agreement. Nothing in the module decides eligibility, refuses a value or
       computes freshness — it declares and it compares. */
    const src = readFileSync(join(__dirname, '..', 'practicePolicy.ts'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const banned of ['permitsUse', 'fallbackFor', 'dataFreshness', 'boundsRefusal']) {
      expect(code, banned).not.toContain(banned);
    }
  });

  it('should be the one place the standard is stated (no rival policy object)', () => {
    /* Instrument first: the scan must see the real modules. */
    const dir = join(__dirname, '..');
    const files = readdirSync(dir).filter(
      (f) => f.endsWith('.ts') && statSync(join(dir, f)).isFile()
    );
    expect(files.length).toBeGreaterThan(10);
    const declaring = files.filter((f) =>
      /expenditure:\s*'NONE'[\s\S]{0,400}actionability:/.test(readFileSync(join(dir, f), 'utf8'))
    );
    expect(declaring).toEqual(['practicePolicy.ts']);
  });
});
