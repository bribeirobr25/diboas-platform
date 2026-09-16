/**
 * The published methodology, pinned (PENDING_ALL 5.332).
 *
 * WHY THIS EXISTS. On 2026-09-15 a sabotage sweep changed, one at a time:
 * BTC-01's weight from 2 to 1, ETF-01's from 2 to 1, MAC-01's from 1 to 2,
 * VERY_FAVORABLE's floor from 12 to 13, CONSTRUCTIVE's from 9 to 10, and
 * HOSTILE's ceiling from 2 to 4. **All 396 tests passed every time.** The
 * scoring rule that produces the number on the page had no guard at all.
 *
 * The reason the existing gates cannot see it is worth stating, because it is
 * the same shape as the recurring weekly failures: `computedReconciliation`
 * reads the weights OUT of `computed.json` and checks they sum to `max_score`.
 * That is an internal-consistency check. Change a weight and the engine writes
 * the new one into the artefact, the sum still matches, and the gate is happy —
 * while the published score silently changes. A gate that derives its
 * expectation from the thing under test cannot fail.
 *
 * These constants are METHODOLOGY (doc 02 §8), founder-ratified, and listed in
 * the architecture review under "Explicitly NOT in this plan: any change to the
 * engine's locked conventions (strict-Friday, candle-lock, thresholds,
 * weights) — those are methodology decisions, not engineering ones."
 *
 * So this test is an ATTESTATION, not a unit test. If it fails, the correct
 * response is almost never to update the numbers here: it is to establish
 * whether a methodology change was actually ratified, and if so to bump the
 * methodology version alongside it (5.132(a) / Wave 3.3 `rule_version`).
 *
 * It reads NO live market data on purpose — `/market`'s artefacts change every
 * Monday, and a release gate that depends on them is exactly what broke the
 * 2026-09-14 cycle.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BANDS } from '../../../../scripts/market-refresh/lib/regime-engine.mjs';
import { MAX_BY_GROUP } from '../../../../scripts/market-refresh/lib/group-summaries.mjs';

/** doc 02 §8 — the eleven signals and what each is worth. Sums to 14. */
const RATIFIED_WEIGHTS: Record<string, number> = {
  'BTC-01': 2,
  'BTC-02': 2,
  'BTC-03': 1,
  'BTC-04': 1,
  'MAC-01': 1,
  'MAC-02': 1,
  'MAC-03': 1,
  'ETF-01': 2,
  'REL-01': 1,
  'REL-02': 1,
  'REL-03': 1,
};
const RATIFIED_TOTAL = 14;

/** doc 02 §8 — the five bands, contiguous, covering 0..14 with no gap or overlap. */
const RATIFIED_BANDS = [
  { code: 'HOSTILE', min: 0, max: 2 },
  { code: 'DEFENSIVE', min: 3, max: 5 },
  { code: 'NEUTRAL_MIXED', min: 6, max: 8 },
  { code: 'CONSTRUCTIVE', min: 9, max: 11 },
  { code: 'VERY_FAVORABLE', min: 12, max: 14 },
];

/** doc 02 §8 — group ceilings, which must equal the sum of their signals. */
const RATIFIED_GROUP_MAX: Record<string, number> = {
  btc_structure: 6,
  macro_environment: 3,
  institutional_demand: 2,
  relative_strength: 3,
};

const ENGINE = readFileSync(
  join(__dirname, '../../../../scripts/market-refresh/lib/regime-engine.mjs'),
  'utf8'
);

/** Every `id: 'XXX-NN'` … `weight: N` pair the engine declares, read from source. */
function declaredWeights(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of ENGINE.matchAll(/id:\s*'([A-Z]{3}-\d{2})'[\s\S]{0,400}?weight:\s*(\d+)/g)) {
    out[m[1]] = out[m[1]] ?? Number(m[2]);
  }
  return out;
}

describe('signal weights are ratified methodology, not an engineering constant', () => {
  it('should declare exactly the eleven ratified signals', () => {
    expect(Object.keys(declaredWeights()).sort()).toEqual(Object.keys(RATIFIED_WEIGHTS).sort());
  });

  it.each(Object.entries(RATIFIED_WEIGHTS))('should weight %s at %i point(s)', (id, w) => {
    expect(declaredWeights()[id], `${id} weight changed — methodology, not a code change`).toBe(w);
  });

  it(`should sum to exactly ${RATIFIED_TOTAL} points`, () => {
    const sum = Object.values(declaredWeights()).reduce((a, b) => a + b, 0);
    expect(sum).toBe(RATIFIED_TOTAL);
  });

  it('should keep every group ceiling equal to the sum of its own signals', () => {
    const w = declaredWeights();
    const byGroup: Record<string, number> = {
      btc_structure: w['BTC-01'] + w['BTC-02'] + w['BTC-03'] + w['BTC-04'],
      macro_environment: w['MAC-01'] + w['MAC-02'] + w['MAC-03'],
      institutional_demand: w['ETF-01'],
      relative_strength: w['REL-01'] + w['REL-02'] + w['REL-03'],
    };
    expect(byGroup).toEqual(RATIFIED_GROUP_MAX);
    expect(MAX_BY_GROUP).toEqual(RATIFIED_GROUP_MAX);
  });
});

describe('band thresholds are ratified methodology', () => {
  it('should match the ratified five bands exactly', () => {
    expect(
      BANDS.map((b: { code: string; min: number; max: number }) => ({
        code: b.code,
        min: b.min,
        max: b.max,
      }))
    ).toEqual(RATIFIED_BANDS);
  });

  it('should cover every attainable score 0..14 exactly once', () => {
    // Contiguity is the property, not just the numbers: a gap publishes an
    // undefined regime for a reachable score, an overlap publishes two.
    for (let score = 0; score <= RATIFIED_TOTAL; score += 1) {
      const hit = BANDS.filter(
        (b: { min: number; max: number }) => score >= b.min && score <= b.max
      );
      expect(hit, `score ${score} matched ${hit.length} bands`).toHaveLength(1);
    }
  });

  it('should leave no score above the ratified total reachable', () => {
    const top = Math.max(...BANDS.map((b: { max: number }) => b.max));
    expect(top).toBe(RATIFIED_TOTAL);
  });
});

/**
 * `methodology.json` is the METHODOLOGY THE PAGE PUBLISHES. The engine is the
 * methodology it EXECUTES. Nothing asserted they were the same (5.376 analysis,
 * 2026-09-16).
 *
 * They agree today — verified before writing this — but the document is
 * hand-maintained and the engine is code, so the only thing holding them
 * together was that nobody had changed either in a way that mattered. That is
 * the `5.361` shape one level up: a rule with no guard, where the two copies of
 * it are free to drift and the drift is invisible because each is internally
 * consistent.
 *
 * It matters now because `5.376` proposes stamping `methodology.json#version`
 * onto every archive line. A version stamp is only worth anything if the
 * version describes the engine that actually computed the row; otherwise it is
 * false provenance, which is worse than none.
 */
describe('the published methodology document matches the engine that executes it', () => {
  const DOC = JSON.parse(
    readFileSync(join(__dirname, '../../../../data/market/shared/methodology.json'), 'utf8')
  );

  it('should agree with the engine on the maximum score', () => {
    expect(DOC.max_score).toBe(RATIFIED_TOTAL);
  });

  it('should publish exactly the ratified bands, with the same boundaries', () => {
    const fromDoc = DOC.score_bands.map(
      (b: { code: string; min_score: number; max_score: number }) => ({
        code: b.code,
        min: b.min_score,
        max: b.max_score,
      })
    );
    expect(fromDoc).toEqual(RATIFIED_BANDS);
  });

  it('should publish the same group ceilings the engine enforces', () => {
    const fromDoc = Object.fromEntries(
      DOC.groups.map((g: { id: string; max_points: number }) => [g.id, g.max_points])
    );
    expect(fromDoc).toEqual(RATIFIED_GROUP_MAX);
  });

  it('should carry a version and a publication date at all', () => {
    // Not an assertion about WHICH version — that is a methodology call. Only
    // that the document identifies itself, so a stamp has something to name.
    expect(DOC.version, 'methodology.json has no version to stamp').toMatch(/^\d+\.\d+\.\d+$/);
    expect(Date.parse(DOC.published_at)).not.toBeNaN();
  });
});

/**
 * The methodology document exists TWICE (found 2026-09-16, while bumping to
 * v1.1.0 — register 5.384).
 *
 * `data/market/shared/methodology.json` is the artefact the two view loaders
 * import and publish. `lib/analytics-sdk/fixtures/methodology.json` is the SDK
 * fixture standing in for what the external diboas-analytics service will one
 * day return over the swap seam. They are byte-identical today apart from their
 * comments, and the v1.0.1 note records that they were bumped together the last
 * time too.
 *
 * Nothing asserted that. `fixtures.test.ts` has one describe for each file and
 * checks each one's SHAPE — both pass happily while the two disagree on what
 * the methodology actually says. Bumping one and forgetting the other is a
 * one-line mistake with no detector, and it would publish a version number that
 * disagrees with the contract the swap seam promises.
 *
 * This is the third instance of one shape in this subsystem: 5.361 (weights and
 * bands with no guard), 5.381 (doc vs engine), and now doc vs its own mirror.
 */
describe('the two copies of the methodology document agree', () => {
  const PUBLISHED = JSON.parse(
    readFileSync(join(__dirname, '../../../../data/market/shared/methodology.json'), 'utf8')
  );
  const FIXTURE = JSON.parse(
    readFileSync(join(__dirname, '../../analytics-sdk/fixtures/methodology.json'), 'utf8')
  );

  it('should agree on every field except the explanatory comment', () => {
    const strip = (o: Record<string, unknown>) => {
      const { _comment, ...rest } = o;
      return rest;
    };
    // Compared as a whole rather than field by field: a field ADDED to one and
    // not the other is the drift this guard exists to catch, and a per-field
    // list would not see it.
    expect(strip(FIXTURE)).toEqual(strip(PUBLISHED));
  });

  it('should carry the same version in both places', () => {
    // Stated separately from the deep-equality row above so a version drift
    // names itself in the failure output instead of arriving as a diff.
    expect(FIXTURE.version).toBe(PUBLISHED.version);
  });
});
