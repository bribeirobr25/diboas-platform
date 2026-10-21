import { describe, expect, it } from 'vitest';
import { project } from '../ledger/engine';
import type { LedgerEvent } from '../ledger/events';

/**
 * ⚙ `PRU-1` · THE GOAL DOMAIN OBJECT — the scope half of the containment gate.
 *
 * **Controlling authority:** Strategy Canon §7.2 `P-QA2A` (status `CLOSED`),
 * carried into `WEBAPP_SYSTEM_IMPLEMENTATION_ARCHITECTURE_PLAN.md` §3.7.1a.
 * The behavioural half — no FX reaches the Goal path, the reference cannot move
 * with the clock, the ledger currency is fixed at genesis — lives in
 * `apps/sandbox/src/__tests__/pru1GoalReferenceStability.test.ts`.
 *
 * ⛑ IT LIVES HERE BECAUSE A SABOTAGE FAILED TO FAIL — TWICE, FOR TWO REASONS.
 *
 * 1. Planting `targetReferenceAmount?: string` on the `GoalState` INTERFACE
 *    changed nothing: an optional type field creates no runtime key, and the
 *    assertion reads `Object.keys(goal)`. The sabotage was retargeted at the
 *    reducer that actually builds the object.
 * 2. Retargeted, it STILL passed — because `@diboas/banking` resolves through
 *    `package.json#exports` to `dist/`, so a test in the sandbox app reads the
 *    last BUILD, not the source under mutation. Exactly the trap `CI-N3` hit.
 *
 * Importing `../ledger/engine` makes the assertion source-relative under every
 * invocation rather than only under `turbo`'s `^build`.
 */

const base = (n: number) => ({
  eventId: `e${n}`,
  simDay: 0,
  recordedAt: '2026-08-01T09:00:00.000Z',
  correlationId: 'c1',
});

const EVENTS: LedgerEvent[] = [
  { ...base(1), type: 'PlayMoneyGranted', amount: '10000.00', currency: 'EUR', mode: 'b2c' },
  {
    ...base(2),
    type: 'GoalCreated',
    goalId: 'g1',
    name: 'Kitchen',
    icon: 'home',
    targetAmount: '12000.00',
    horizonMonths: 24,
  },
];

describe('PRU-1 · the PRU model is NOT built, and this gate says so', () => {
  it('should project a goal at all — an empty projection proves nothing', () => {
    const state = project(EVENTS);
    expect(state.goals).toHaveLength(1);
    expect(Object.keys(state.goals[0]!)).toContain('targetAmount');
  });

  it('should carry no reference amount, currency or FX provenance on a Goal', () => {
    /**
     * ⚑ AN ASSERTION ABOUT AN ABSENCE, ON PURPOSE. §3.7.1a requires a Goal to
     * preserve `original amount · original currency · reference amount in PRU ·
     * FX rate used · reference timestamp`. None of that exists. If a future
     * increment adds any of it, this test FAILS — and it should, because at
     * that moment `PRU-1` stops being a containment gate and must become the
     * real §3.7.1a gate: normalize once on explicit edit, provenance
     * recoverable, never rebase on replay. The failure is the prompt to finish
     * the job, not a defect to silence.
     */
    const goal = project(EVENTS).goals[0]!;
    for (const pruField of [
      'targetReferenceAmount',
      'targetCurrency',
      'targetOriginalAmount',
      'referenceRate',
      'referenceStamp',
    ]) {
      expect(
        Object.keys(goal),
        `PRU field "${pruField}" now exists — PRU-1 must be upgraded from containment to the full §3.7.1a model`
      ).not.toContain(pruField);
    }
  });

  it('should keep the target byte-identical across repeated projections (replay stability)', () => {
    /* The event log is the only input; projecting twice cannot drift. */
    expect(project(EVENTS).goals[0]!.targetAmount).toBe(project(EVENTS).goals[0]!.targetAmount);
    expect(project(EVENTS).goals[0]!.targetAmount).toBe('12000.00');
  });
});
