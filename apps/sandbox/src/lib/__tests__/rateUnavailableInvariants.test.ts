import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

/**
 * `5.436` · THE INVARIANTS THAT MUST HOLD BY NON-ACTION.
 *
 * Product ruling 2026-09-22 §8 and §10 are mostly prohibitions: losing today's
 * rate must not reach backwards into settled state. Those are proved by
 * measuring that the surfaces in question never acquired the gate — a test that
 * merely asserted "the job still renders" would pass even if a future edit
 * wired current-facing refusal into the ledger.
 *
 * ```text
 * ACTIVE MONEY JOB  != invalidated by current evidence loss
 * PAST DECISION     != invalidated
 * DECISION RECORD   != recomputed
 * HISTORICAL REPLAY != subject to current-facing age enforcement
 * ```
 */

const APP_ROOT = process.cwd();
const codeOf = (rel: string) => stripComments(readFileSync(join(process.cwd(), rel), 'utf8'), rel);

/** Ledger and replay modules: settled state and history live here. */
const SETTLED_STATE = [
  'src/lib/ledger/journey.ts',
  'src/lib/ledger/core.ts',
  // S1a (plan P12 §4.7): every non-test file under src/lib/ledger/ settles state now that the
  // rules live in decide/; the completeness assertion below keeps this list whole.
  'src/lib/ledger/rules.ts',
  'src/lib/ledger/credits.ts',
  'src/lib/ledger/simEvents.ts',
  'src/lib/ledger/browserContext.ts',
  'src/lib/ledger/decide/credits.ts',
  'src/lib/ledger/decide/fees.ts',
  'src/lib/ledger/decide/journey.ts',
  'src/lib/ledger/decide/rules.ts',
  'src/lib/ledger/decide/simEvents.ts',
  'src/lib/ledger/decide/stamp.ts',
  'src/lib/ledger/decide/types.ts',
  'src/lib/advancePlanner.ts',
  'src/lib/positionSeries.ts',
  'src/lib/practiceSeries.ts',
  'src/lib/monthReport.ts',
];

describe('5.436 · losing the current rate does not reach backwards', () => {
  it('should list every non-test file under src/lib/ledger/ (completeness, plan P12 §4.7)', () => {
    const root = join(APP_ROOT, 'src/lib/ledger');
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? e.name === '__tests__'
            ? []
            : walk(join(dir, e.name))
          : /\.tsx?$/.test(e.name)
            ? [relative(APP_ROOT, join(dir, e.name)).split(sep).join('/')]
            : []
      );
    const missing = walk(root).filter((f) => !SETTLED_STATE.includes(f));
    expect(walk(root).length).toBeGreaterThan(5);
    expect(missing).toEqual([]);
  });

  it.each(SETTLED_STATE)('should keep the rate gate out of %s', (file) => {
    const code = codeOf(file);
    for (const forbidden of [
      'strategyRateAvailability',
      'isRefusedForCurrentFacingUse',
      'currentFacingTimeState',
    ]) {
      expect(
        code,
        `${forbidden} in ${file} would let today's evidence invalidate settled state`
      ).not.toContain(forbidden);
    }
  });

  it('should not expose an APY on the active-job surface at all', () => {
    /**
     * Ruling §8: *"If the surface does not currently expose APY: DO NOT ADD
     * IT"* — `5.436` authorizes no new information architecture. Measured
     * rather than asserted: `GoalDetailScreen` renders no rate for an open
     * position, so there is nothing to turn unavailable, and this test fails if
     * someone adds one under cover of this row.
     */
    const code = codeOf('src/components/GoalDetailScreen.tsx');
    /* The only APY-ish identifiers present are the props passed DOWN to the
       picker/detail inside the invest block, never a rendered rate. */
    expect(code).not.toContain('blendedApy');
    expect(code).not.toContain('strategyDetail.currentApy');
    expect(code).not.toContain('strategyDetail.poolRate');
    /* By prefix (5.814): every rate-line id, the age-aware ones included. */
    expect(code).not.toContain('goalNew.apy');
    expect(code).not.toContain('<RateLine');
  });

  it('should keep the DecisionRecord and replay events untouched by this row', () => {
    /* `5.436` changed no event shape. A rate that cannot be read today says
       nothing about what was true when a decision was recorded. */
    const events = readFileSync(
      join(process.cwd(), '../../packages/banking/src/ledger/events.ts'),
      'utf8'
    );
    expect(events).not.toContain('rateAvailability');
    expect(events).not.toContain('optionUnavailable');
  });
});
