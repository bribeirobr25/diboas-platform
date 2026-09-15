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
