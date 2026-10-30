import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';
import { PLAY_MONEY_GRANT } from '@/i18n/config';
import { goalCurrentValue, goalTargetReached } from '@/lib/goalValue';
import { moduleBase, runtimeImports } from '@/test/importGraph';
import { stripComments } from '@/test/stripComments';

/**
 * ⚙ `PRU-1` · A GOAL TARGET REFERENCE IS NEVER RECOMPUTED WITH A LATER RATE.
 *
 * **Controlling authority:** Strategy Canon §7.2 `P-QA2A` (status `CLOSED`) and
 * `P-QA2`, as carried into `docs/domains/practice/ARCHITECTURE.md`
 * §7.2 (the architecture plan's §3.7.1a). The two prohibitions, verbatim in substance:
 *
 *   > Engineering must not calculate Goal progress by blindly dividing Practice
 *   > Credits by a displayed MarketAmount.
 *
 *   > Do not recompute an existing Goal Target reference using a later or
 *   > current FX rate during replay or projection. The normalized reference
 *   > remains the denominator until the user explicitly edits the target.
 *
 * ⚑ SCOPE, STATED HONESTLY — THIS GATE IS `PARTIAL`, NOT THE PRU MODEL.
 *
 * Measured at source 2026-09-25: `GoalState` carries `targetAmount` and
 * **nothing else** — no original currency, no normalized reference amount, no
 * FX rate, no reference timestamp. The PRU model (ARCHITECTURE.md §7.2) specifies (Target
 * Original · Target Reference · FX provenance · rebase only on explicit edit)
 * is **NOT BUILT**, and building it is a Goal domain-object change that arrives
 * with display-currency preferences — a declared spec gap (ARCHITECTURE.md §11.7) belonging to
 * the increment that owns it, not to this lane.
 *
 * What IS true today, and what this gate therefore asserts, is CONTAINMENT:
 * a ledger has exactly ONE currency, fixed at genesis; no FX rate reaches the
 * Goal path at all; and progress is same-unit division, which is the degenerate
 * case where `1 Practice Credit = 1 PRU` holds by construction rather than by
 * the forbidden `credits ÷ MarketAmount` inference.
 *
 * So the forbidden recomputation is currently UNREACHABLE, and this gate makes
 * it impossible to make reachable silently. It does not claim the model exists.
 */

const GENESIS = new Date('2026-08-01T09:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(GENESIS);
  resetSandbox();
});
afterEach(() => {
  vi.useRealTimers();
  resetSandbox();
});

function seededGoal(): string {
  grantPlayMoney(PLAY_MONEY_GRANT.b2c, 'EUR', 'b2c');
  const goalId = createGoal({
    name: 'Kitchen',
    icon: 'home',
    targetAmount: 12_000,
    horizonMonths: 24,
    fundAmount: 4_000,
  });
  enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 3_000, networkFeeLocal: 0 });
  return goalId;
}

/* ── 1 · the reference cannot move, because no rate can reach it ──────────── */

describe('PRU-1 · the goal target reference is stable', () => {
  it('should keep the target identical no matter how much later it is read', () => {
    /**
     * The invariant's own words: an existing reference is not recomputed during
     * replay or projection. With no FX in the Goal path the target is a durable
     * quantity, and reading it a year later must not move it.
     */
    const goalId = seededGoal();
    const at = () => getLedgerState().goals.find((g) => g.goalId === goalId)!.targetAmount;
    const atGenesis = at();

    for (const when of ['2026-12-31T09:00:00Z', '2027-06-01T09:00:00Z', '2028-01-01T09:00:00Z']) {
      vi.setSystemTime(new Date(when));
      expect(at(), `the target moved when read at ${when}`).toBe(atGenesis);
    }
  });

  it('should keep goal progress a pure function of the ledger, not of the clock', () => {
    const goalId = seededGoal();
    const state = getLedgerState();
    const value = goalCurrentValue(state, goalId).toString();
    const reached = goalTargetReached(state, goalId);

    vi.setSystemTime(new Date('2027-09-01T09:00:00Z'));
    const later = getLedgerState();
    expect(goalCurrentValue(later, goalId).toString()).toBe(value);
    expect(goalTargetReached(later, goalId)).toBe(reached);
  });

  it('should fix the ledger currency at genesis — nothing later may rebase it', () => {
    /**
     * Display-currency independence, in the only form the current model can
     * express it: there is ONE currency, set by the grant, and no subsequent
     * action changes it. A goal therefore cannot be silently rebased, because
     * there is no second currency for it to be rebased into.
     */
    const goalId = seededGoal();
    expect(getLedgerState().currency).toBe('EUR');
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 500, networkFeeLocal: 0 });
    createGoal({
      name: 'Second',
      icon: 'star',
      targetAmount: 900,
      horizonMonths: 6,
      fundAmount: 100,
    });
    expect(getLedgerState().currency, 'a later action changed the ledger currency').toBe('EUR');
  });
});

/* ── 2 · no FX may reach the Goal path ────────────────────────────────────── */

const SANDBOX_SRC = join(__dirname, '..');

function code(file: string): string {
  return stripComments(readFileSync(join(SANDBOX_SRC, file), 'utf8'), file);
}

/**
 * FX lives in the network-fee path only — converting a gas cost, never a goal.
 *
 * ⛑ ANY SPELLING (R4-8, independent review 2026-10-16). These were substrings of
 * the `@/` alias, so `lib/goalValue.ts` importing `./networkFee` passed — the
 * relative-import gap `CI-N3` had already closed in its own copy. Imports are now
 * read by the shared parser (`@/test/importGraph`) and resolved to a `src/` path.
 */
const FX_MODULE = /^lib\/(?:networkFee(?:Evidence)?|market)(?:\/|$)/;
function fxImports(text: string, file: string): string[] {
  return runtimeImports(text, file).filter((spec) => {
    const base = moduleBase(file, spec);
    return base !== null && FX_MODULE.test(base);
  });
}
/**
 * ⛑ `usdPriceLocal` ADDED (P0 review, PB-3) — it is the app's REAL FX value
 * (`/api/market` → local units per USD-pegged dollar), and it was the one name
 * the list did not contain, so a goal-path read of it passed.
 */
const FX_NAMES = ['fxRate', 'exchangeRate', 'convertCurrency', 'usdToLocal', 'usdPriceLocal'];

/**
 * The goal path: the two files named when the gate was written, plus every
 * non-test file that consumes `goalCurrentValue` today (derived, so a new
 * goal-progress reader is covered without an edit here).
 */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'test') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}
const GOAL_PATH = [
  ...new Set([
    'lib/goalValue.ts',
    'view/home.ts',
    ...sourceFiles(SANDBOX_SRC)
      .filter((f) => /\bgoalCurrentValue\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SANDBOX_SRC, f)),
  ]),
];

describe('PRU-1 · no FX rate reaches goal value or goal progress', () => {
  it.each(GOAL_PATH)('should import no FX/market module in %s', (file) => {
    const found = fxImports(code(file), file);
    expect(found, `${file} imports FX/market module(s): ${found.join(', ')}`).toEqual([]);
  });

  it('should catch an FX import in ANY spelling (R4-8)', () => {
    for (const planted of [
      "import { networkCostQuote } from './networkFee';",
      "import { feeEvidence } from '@/lib/networkFeeEvidence';",
      "import { useMarket } from '../lib/market/client';",
      "const m = await import('@/lib/market');",
      "export { rate } from './market/rates';",
      "import { networkCostQuote } from './networkFee.js';",
      "import nf = require('./networkFee');",
    ]) {
      expect(fxImports(planted, 'lib/goalValue.ts'), planted).toHaveLength(1);
    }
    /* Negative controls: a type-only import carries no FX at runtime; an unrelated module is not FX. */
    expect(fxImports("import type { Quote } from './networkFee';", 'lib/goalValue.ts')).toEqual([]);
    expect(fxImports("import { goal } from './goalModel';", 'lib/goalValue.ts')).toEqual([]);
  });

  it.each(GOAL_PATH)('should name no FX rate in %s', (file) => {
    const text = code(file);
    const found = FX_NAMES.filter((n) => text.includes(n));
    expect(found, `${file} names FX rate(s): ${found.join(', ')}`).toEqual([]);
  });

  it('should have actually read the goal path — an empty read proves nothing', () => {
    for (const file of GOAL_PATH) {
      expect(code(file).length, file).toBeGreaterThan(400);
    }
  });
});

/*
 * ── 3 · the scope limit ──────────────────────────────────────────────────────
 *
 * The assertion that `GoalState` carries NO PRU reference amount, currency or
 * FX provenance lives in `packages/banking/src/__tests__/pru1GoalShape.test.ts`.
 * It was written here first and its sabotage failed to fail twice — an optional
 * type field creates no runtime key, and `@diboas/banking` resolves to `dist/`,
 * so a sandbox test reads the last build rather than the source. It belongs in
 * the package that owns the domain object.
 */
