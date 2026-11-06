import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@/test/stripComments';
import type { RateRangesPayload } from '@/lib/rateRangesContract';
import { selectGoalProjection, type ProjectionInput } from '../view/projection';

/**
 * ⚙ `CI-N3` · THE PROJECTION SEAM — the only money it emits is a `ModelledAmount`.
 *
 * Requirement `LC-RR-01-12` (private canon): a modelled value "never enters actual funding,
 * balance, entitlement or Goal completion". RESTATED BY PR 2 (P3 §6 guard 6): the static-rate
 * seam (`projectionDisplay`, which emitted years and a pace only) is gone; the new seam
 * `selectGoalProjection` does emit money — the needed monthly amount, the plan — so the
 * guarantee becomes "every amount it emits is `{ kind: 'modelled', amount: '<whole units>' }`
 * and nothing else is money-shaped", checked over the same 600 SEEDED fuzzed inputs.
 *
 * Three parts sit beside it: (a) the import graph — only `view/projection.ts` imports the
 * maths (below); (b) the types — a `ModelledAmount` is not assignable to any command amount
 * (`ciN3ModelledAmount.test.ts`, checked by `tsc`); (c) display only — `.amount` is read by
 * the block's component alone (below). The surface half is `ciN3NoModelledValue.test.ts`.
 *
 * Imported source-relative (`../view/projection`), so a planted field is seen under every
 * invocation — the reason the old seam test lived beside its source.
 */

/** Numbers the seam may emit — counts of years/months and percentages. Never money. */
const NUMBER_KEYS = new Set([
  'years',
  'minYears',
  'maxYears',
  'monthsLeft',
  'lowPercent',
  'highPercent',
  'windowMonths',
  'ratePercent',
]);
const STRING_KEYS = new Set(['kind', 'status', 'asOf']);
const BOOLEAN_KEYS = new Set(['growthNote']);

/** Every violation in one output: a path naming what is money-shaped outside a ModelledAmount. */
function violations(value: unknown, path = 'view', out: string[] = []): string[] {
  if (value === null || typeof value !== 'object') return out;
  const record = value as Record<string, unknown>;
  if (record.kind === 'modelled') {
    const keys = Object.keys(record).sort().join(',');
    if (keys !== 'amount,kind') out.push(`${path}: a ModelledAmount with keys ${keys}`);
    if (typeof record.amount !== 'string' || !/^\d+$/.test(record.amount))
      out.push(`${path}.amount: ${String(record.amount)}`);
    return out;
  }
  for (const [k, v] of Object.entries(record)) {
    const at = `${path}.${k}`;
    if (typeof v === 'number' && !NUMBER_KEYS.has(k)) out.push(`${at}: number`);
    else if (typeof v === 'string' && !STRING_KEYS.has(k)) out.push(`${at}: string`);
    else if (typeof v === 'boolean' && !BOOLEAN_KEYS.has(k)) out.push(`${at}: boolean`);
    else if (typeof v === 'object') violations(v, at, out);
  }
  return out;
}

/** mulberry32, fixed seed (PB-3): the same 600 inputs on every run, everywhere. */
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

const range = (strategyId: string, low: number, high: number) => ({
  strategyId,
  available: true as const,
  lowPercent: low,
  highPercent: high,
  windowStart: '2026-02-13',
  windowEnd: '2026-11-04',
  observedDays: 266,
  todayPercent: (low + high) / 2,
  oldestLegAsOf: '2026-11-04',
});

function fuzzInput(random: () => number, i: number): ProjectionInput {
  const low = Math.round(random() * 80) / 10;
  const high = low + Math.round(random() * 30) / 10;
  const ranges: RateRangesPayload | null | 'error' =
    i % 23 === 0
      ? 'error'
      : i % 29 === 0
        ? null
        : {
            strategies: [range('safeHarbor', low, high), range('goalKeeper', low, high)],
            aggregate: {
              available: i % 17 !== 0,
              lowPercent: low,
              highPercent: high,
              observedDays: 266,
            },
          };
  const positions =
    i % 4 === 0
      ? []
      : [
          {
            strategyId: i % 9 === 0 ? 'stableGrowth' : i % 2 ? 'safeHarbor' : 'goalKeeper',
            value: Math.round(random() * 50_000),
          },
        ];
  return {
    status: i % 31 === 0 ? 'paused' : 'active',
    target: i % 7 === 0 ? 0 : Math.round(random() * 1_000_000),
    goalCash: Math.round(random() * 20_000),
    positions,
    monthlyPlan: i % 5 === 0 ? 0 : Math.round(random() * 5_000),
    monthsLeft: i % 11 === 0 ? null : Math.round(random() * 600),
    ranges,
  };
}

describe('CI-N3 · the projection seam emits money only as a ModelledAmount', () => {
  it('should emit no money-shaped field outside a ModelledAmount, for 600 fuzzed inputs', () => {
    const random = seededRandom(0x5eed_c1e3);
    let withAmount = 0;
    for (let i = 0; i < 600; i += 1) {
      const view = selectGoalProjection(fuzzInput(random, i));
      expect(violations(view), JSON.stringify(view)).toEqual([]);
      if (JSON.stringify(view).includes('"modelled"')) withAmount += 1;
    }
    /* Non-vacuity: a fuzz where no output carried an amount would assert nothing. */
    expect(withAmount, 'no fuzzed projection carried an amount').toBeGreaterThan(100);
  });

  it('should be PURE — the same inputs give the same result, with no accumulated state', () => {
    const input = fuzzInput(seededRandom(7), 1);
    const first = selectGoalProjection(input);
    for (let i = 0; i < 50; i += 1) selectGoalProjection(fuzzInput(seededRandom(i), i));
    expect(selectGoalProjection(input)).toEqual(first);
  });

  it('should recognise a money-shaped field if one ever appeared (non-vacuity)', () => {
    expect(violations({ kind: 'live', projectedBalance: 1200 })).toHaveLength(1);
    expect(violations({ kind: 'live', target: '10000' })).toHaveLength(1);
    expect(violations({ kind: 'modelled', amount: 200 })).toHaveLength(1);
    expect(violations({ kind: 'modelled', amount: '200', value: 200 })).toHaveLength(1);
    expect(violations({ kind: 'live', when: { kind: 'single', years: 3 } })).toEqual([]);
  });
});

/* ── (a) the maths is imported by the seam alone; (c) the amount is read by the block alone ── */

const SANDBOX_SRC = join(__dirname, '..');
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'test') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}
const FILES = sourceFiles(SANDBOX_SRC).map((f) => ({
  rel: relative(SANDBOX_SRC, f),
  code: stripComments(readFileSync(f, 'utf8'), f),
}));

/** The names a goal-reaching amount is worked out with. */
const AMOUNT_MATHS = /\b(?:monthsToTarget|monthlyNeeded)\b/;
/** A file that imports from the projection seam (alias or relative). */
const IMPORTS_SEAM = /from\s+['"](?:@\/view\/projection|\.{1,2}\/(?:view\/)?projection)['"]/;

describe('CI-N3 · (a) only the seam works out a goal amount; (c) only the block reads it', () => {
  it('should import monthsToTarget / monthlyNeeded in view/projection.ts and nowhere else', () => {
    const readers = FILES.filter((f) => AMOUNT_MATHS.test(f.code)).map((f) => f.rel);
    expect(readers).toEqual(['view/projection.ts']);
  });

  it('should let only the block and its screen import the seam, and only the block read an amount', () => {
    const importers = FILES.filter((f) => IMPORTS_SEAM.test(f.code))
      .map((f) => f.rel)
      .sort();
    expect(importers).toEqual(['components/GoalDetailScreen.tsx', 'components/Projection.tsx']);
    const screen = FILES.find((f) => f.rel === 'components/GoalDetailScreen.tsx')!.code;
    // The screen hands the view through untouched — it never reads into it.
    expect(screen).not.toMatch(/\bprojection\s*\.\s*\w/);
    const block = FILES.find((f) => f.rel === 'components/Projection.tsx')!.code;
    expect(block).toMatch(/\.amount\b/);
  });

  it('should find no static projection rate anywhere in the app (guard 3)', () => {
    const statics = FILES.filter((f) =>
      /\bSCENARIO_RATES\b|\bprojectionDisplay\b|\bprojectionRange\b/.test(f.code)
    ).map((f) => f.rel);
    expect(statics).toEqual([]);
  });

  it('should have actually read the tree — an empty read proves nothing', () => {
    expect(FILES.length).toBeGreaterThan(100);
    expect(FILES.some((f) => f.rel === 'view/projection.ts' && f.code.length > 2000)).toBe(true);
  });
});
