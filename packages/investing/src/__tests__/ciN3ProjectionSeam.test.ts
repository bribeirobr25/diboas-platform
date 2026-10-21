import { describe, expect, it } from 'vitest';
import { projectionDisplay, projectionRange } from '../goals';

/**
 * ⚙ `CI-N3` · THE PROJECTION SEAM — a modelled result is not money-shaped.
 *
 * The seam half of `CI-N3` (requirement traced to `LC-RR-01-10` / `LC-RR-01-12`,
 * texts in the private canon: a modelled value never feeds an actual Goal
 * balance or completion). The surface half
 * — which components may hold a ledger-write capability, and that the goal
 * balance is derived from ledger terms alone — lives in
 * `apps/sandbox/src/__tests__/ciN3NoModelledValue.test.ts`.
 *
 * ⛑ IT LIVES HERE BECAUSE A SABOTAGE FAILED TO FAIL. Written in the sandbox
 * app, these assertions imported `@diboas/investing`, which resolves through
 * `package.json#exports` to `dist/` — so planting `projectedBalance` on the
 * return of `projectionDisplay` in `src/goals.ts` changed nothing the test
 * could see, and it passed. Importing `../goals` makes the assertion source-
 * relative under every invocation, not only under `turbo`'s `^build`.
 */

/* ── 3 · the projection seam cannot express money at all ──────────────────── */

const RANGE_KEYS = ['minYears', 'maxYears'];
const DISPLAY_KEYS = ['underYear', 'minYears', 'maxYears', 'single', 'pace'];
const MONEY_KEY = /amount|balance|value|cash|principal|accrued|total|earnings|target/i;

/**
 * ⛑ SEEDED (PB-3). An unseeded `Math.random` fuzz cannot reproduce a failure,
 * and its non-null floor was only probably met. mulberry32 with a fixed seed
 * gives the same 600 inputs on every run, everywhere.
 */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('CI-N3 · a modelled result is not representable as an amount', () => {
  it('should return only the declared non-monetary fields, for 600 fuzzed inputs', () => {
    /**
     * The strongest form of this invariant is structural: if the projection
     * seam can only emit YEARS and a pace, a modelled value cannot become a
     * balance by accident downstream — it is not money-shaped in the first
     * place. The fuzz covers the edges that historically produce surprises:
     * zero and negative contributions, an unreachable target, a target already
     * met, and absurd magnitudes.
     */
    let nonNull = 0;
    const random = seededRandom(0x5eed_c1e3);
    for (let i = 0; i < 600; i += 1) {
      const target = i % 7 === 0 ? 0 : Math.round(random() * 1_000_000) - 5_000;
      const monthly = i % 5 === 0 ? 0 : Math.round(random() * 20_000) - 1_000;
      const horizon = i % 3 === 0 ? undefined : Math.round(random() * 600);

      const range = projectionRange(target, monthly);
      const display = projectionDisplay(target, monthly, horizon);

      if (range) {
        expect(Object.keys(range).sort()).toEqual([...RANGE_KEYS].sort());
        for (const [k, v] of Object.entries(range)) {
          expect(MONEY_KEY.test(k), `monetary-looking field on a projection: ${k}`).toBe(false);
          expect(Number.isFinite(v as number), `${k}=${String(v)}`).toBe(true);
        }
      }
      if (display) {
        nonNull += 1;
        expect(Object.keys(display).sort()).toEqual([...DISPLAY_KEYS].sort());
        for (const k of Object.keys(display)) {
          expect(MONEY_KEY.test(k), `monetary-looking field on a projection: ${k}`).toBe(false);
        }
        expect(Number.isInteger(display.minYears) || display.underYear).toBe(true);
      }
    }
    /* Non-vacuity: a fuzz where every case returned null would assert nothing. */
    expect(
      nonNull,
      'every fuzzed projection returned null — the fuzz proved nothing'
    ).toBeGreaterThan(100);
  });

  it('should be PURE — the same inputs give the same result, with no accumulated state', () => {
    const first = projectionDisplay(10_000, 250, 48);
    for (let i = 0; i < 50; i += 1) projectionDisplay(999, 1, 1);
    expect(projectionDisplay(10_000, 250, 48)).toEqual(first);
  });

  it('should recognise a monetary field name if one ever appeared (non-vacuity)', () => {
    /* The discriminator must be able to fire, or its silence means nothing. */
    for (const planted of ['projectedBalance', 'expectedValue', 'targetAmount', 'totalCash']) {
      expect(MONEY_KEY.test(planted), planted).toBe(true);
    }
    for (const kept of ['minYears', 'underYear', 'single', 'pace']) {
      expect(MONEY_KEY.test(kept), kept).toBe(false);
    }
  });
});
