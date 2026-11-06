import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveModule } from '@/test/importGraph';
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
  // 0–3 positions (7th audit: one position at most never walked Case 1's multi-strategy branch).
  const pool = ['safeHarbor', 'goalKeeper', 'stableGrowth', 'safeHarbor'];
  const count = i % 4;
  const positions = Array.from({ length: count }, (_, k) => ({
    strategyId: i % 9 === 0 ? 'stableGrowth' : pool[(i + k) % 2],
    value: Math.round(random() * 50_000),
  }));
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
    const seen = new Set<string>();
    for (let i = 0; i < 600; i += 1) {
      const view = selectGoalProjection(fuzzInput(random, i));
      expect(violations(view), JSON.stringify(view)).toEqual([]);
      if (JSON.stringify(view).includes('"modelled"')) withAmount += 1;
      seen.add(view.kind);
      if (view.kind === 'live') seen.add(`today:${view.today.kind}`);
      if (view.kind === 'simulated') seen.add(`line:${view.line?.kind ?? 'none'}`);
    }
    /* Non-vacuity: every branch the seam can emit money from was actually walked. */
    expect(withAmount, 'no fuzzed projection carried an amount').toBeGreaterThan(100);
    for (const branch of [
      'none',
      'loading',
      'unavailable',
      'live',
      'simulated',
      'today:single',
      'today:range',
      'line:needed',
      'line:withPlan',
    ])
      expect(seen.has(branch), `the fuzz never produced ${branch}`).toBe(true);
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
/**
 * Every module a file imports — static, re-exported, dynamic, TYPE-ONLY included — resolved to a
 * path under src/ by the shared resolver (any relative depth or the `@/` alias). The first
 * version matched three spellings by regex, so `'../../view/projection'` went unseen (7th audit).
 */
const SPEC = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"`]([^'"`]+)['"`]/g;
const EXISTS = (rel: string) => FILES.some((f) => f.rel === rel);
const importsOf = (file: { rel: string; code: string }) =>
  [...file.code.matchAll(SPEC)]
    .map((m) => resolveModule(file.rel, m[1], EXISTS))
    .filter((r): r is string => r !== null);
const importsSeam = (file: { rel: string; code: string }) =>
  importsOf(file).includes('view/projection.ts');
/** Tokens that exist only to carry the view's modelled money (and its type). */
const VIEW_ONLY = /\b(?:ModelledAmount|withPlan|neededUpTo|alreadyEnough)\b/;

describe('CI-N3 · (a) only the seam works out a goal amount; (c) only the block reads it', () => {
  it('should import monthsToTarget / monthlyNeeded in view/projection.ts and nowhere else', () => {
    const readers = FILES.filter((f) => AMOUNT_MATHS.test(f.code)).map((f) => f.rel);
    expect(readers).toEqual(['view/projection.ts']);
  });

  it('should let only the block and its screen import the seam, and only the block read an amount', () => {
    const importers = FILES.filter(importsSeam)
      .map((f) => f.rel)
      .sort();
    expect(importers).toEqual(['components/GoalDetailScreen.tsx', 'components/Projection.tsx']);
    const screen = FILES.find((f) => f.rel === 'components/GoalDetailScreen.tsx')!.code;
    // The screen hands the view through untouched — it never reads into it.
    expect(screen).not.toMatch(/\bprojection\s*\.\s*\w/);
    const block = FILES.find((f) => f.rel === 'components/Projection.tsx')!.code;
    expect(block).toMatch(/\.amount\b/);
  });

  it('should name the view\u2019s modelled money nowhere but the seam and the block — whatever a variable is called', () => {
    const named = FILES.filter((f) => VIEW_ONLY.test(f.code))
      .map((f) => f.rel)
      .sort();
    expect(named).toEqual(['components/Projection.tsx', 'view/projection.ts']);
  });

  it('should resolve a seam import at any depth, and see a type-only one (non-vacuity)', () => {
    for (const code of [
      "import { x } from '../../view/projection';",
      "import type { ModelledAmount } from '../../view/projection';",
      "const m = import('@/view/projection');",
    ])
      expect(importsSeam({ rel: 'components/deep/Leak.tsx', code }), code).toBe(true);
    expect(
      importsSeam({ rel: 'components/deep/Leak.tsx', code: "import { y } from './projection';" })
    ).toBe(false);
    expect(VIEW_ONLY.test('const a = pv.withPlan;')).toBe(true);
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
