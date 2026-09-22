import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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

const codeOf = (rel: string) =>
  readFileSync(join(process.cwd(), rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

/** Ledger and replay modules: settled state and history live here. */
const SETTLED_STATE = [
  'src/lib/ledger/journey.ts',
  'src/lib/ledger/core.ts',
  'src/lib/advancePlanner.ts',
  'src/lib/positionSeries.ts',
  'src/lib/practiceSeries.ts',
  'src/lib/monthReport.ts',
];

describe('5.436 · losing the current rate does not reach backwards', () => {
  it.each(SETTLED_STATE)('should keep the rate gate out of %s', (file) => {
    const code = codeOf(file);
    for (const forbidden of ['strategyRateAvailability', 'isRefusedForCurrentFacingUse']) {
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
    expect(code).not.toContain('goalNew.apyNow');
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
