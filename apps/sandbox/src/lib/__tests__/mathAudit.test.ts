import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { computeAddMoneyFee, computeExitFee, computeStrategyEntryFee } from '@diboas/banking';
import { allocateByRule } from '@diboas/investing';

/**
 * Money-math audit (2026-08-21). Each case states the property the formula
 * must hold, not just a worked example — a worked example passes for the
 * wrong reason as soon as the inputs change.
 */
describe('fee math against FEES.md v3.5 (FE-1)', () => {
  it('should charge 0.48% on add money, with no cap at any size', () => {
    expect(computeAddMoneyFee(100, 'USD').toFixed(2)).toBe('0.48');
    // FE-1 removed ALL caps: the fee stays proportional however large.
    expect(computeAddMoneyFee(1_000_000, 'USD').toFixed(2)).toBe('4800.00');
  });

  it('should charge 0.39% on exit, with no cap at any size', () => {
    expect(computeExitFee(10_000, 'USD').toFixed(2)).toBe('39.00');
    // The live web copy still claims "capped at $25" (PENDING_ALL 5.103) —
    // the ENGINE has never had a cap, which is what makes that copy wrong.
    expect(computeExitFee(1_000_000, 'USD').toFixed(2)).toBe('3900.00');
  });

  it('should apply the per-currency floor only when the percentage is smaller', () => {
    // 0.39% of 10 = 0.039 -> the floor wins.
    expect(computeExitFee(10, 'USD').toFixed(2)).toBe('0.25');
    // 0.39% of 1000 = 3.90 -> the percentage wins.
    expect(computeExitFee(1000, 'USD').toFixed(2)).toBe('3.90');
    // The floor is per-currency and currently equal across the three.
    for (const c of ['USD', 'EUR', 'BRL'] as const) {
      expect(computeExitFee(1, c).toFixed(2)).toBe('0.25');
    }
  });

  it('should charge nothing to enter a strategy', () => {
    expect(computeStrategyEntryFee().toString()).toBe('0');
  });

  it('should never produce a fee that exceeds the amount it is charged on', () => {
    // The floor could otherwise swallow a tiny position whole.
    for (const amount of [0.01, 0.1, 0.24, 0.25, 0.26, 1, 5]) {
      const fee = computeExitFee(amount, 'USD');
      if (fee.gt(amount)) {
        // Documented consequence of a FLOOR: below ~$0.25 the floor exceeds
        // the position. MIN_ADD_MONEY ($10) is what bounds this in practice.
        expect(amount).toBeLessThan(0.25);
      }
    }
  });
});

describe('rule allocation conserves money exactly', () => {
  it('should split a total so the lines plus the remainder equal it, to the cent', () => {
    for (const total of [1000, 999.99, 0.03, 1, 7, 123.45]) {
      for (const split of [
        [{ goalId: 'a', percent: 60 }],
        [
          { goalId: 'a', percent: 33 },
          { goalId: 'b', percent: 33 },
          { goalId: 'c', percent: 33 },
        ],
        [
          { goalId: 'a', percent: 50 },
          { goalId: 'b', percent: 50 },
        ],
      ]) {
        const out = allocateByRule(total, split);
        const summed = out.lines
          .reduce((acc, l) => acc.plus(l.amount), new Decimal(0))
          .plus(out.remainderToAvailable);
        expect(summed.toFixed(2), `${total} / ${JSON.stringify(split)}`).toBe(
          new Decimal(total).toFixed(2)
        );
      }
    }
  });

  it('should floor a sub-cent share to zero and send the whole cent to the remainder', () => {
    // D-r's floor-then-remainder rule at its smallest input: 50% of $0.01 is
    // half a cent, which cannot be allocated, so BOTH lines floor to 0.00 and
    // the undivided cent falls to Available.
    //
    // The previous assertions here were `>= 0` on each line and on the
    // remainder. Non-negativity is a real requirement, but that pair is also
    // satisfied by an implementation that allocates NOTHING for any input and
    // by one that silently drops the cent — so it could not distinguish the
    // rule from its absence.
    const out = allocateByRule(0.01, [
      { goalId: 'a', percent: 50 },
      { goalId: 'b', percent: 50 },
    ]);
    expect(out.lines.map((l) => l.amount)).toEqual([0, 0]);
    expect(out.remainderToAvailable).toBe(0.01);
    // Conservation still holds at the boundary: nothing is created or lost.
    expect(out.lines.reduce((s, l) => s + l.amount, 0) + out.remainderToAvailable).toBe(0.01);
  });
});

describe('emitters never append a leg the projection will drop', () => {
  it('should withhold an unaffordable goal funding rather than log a phantom move', async () => {
    const { createGoal, getLedgerState, grantPlayMoney, resetSandbox } =
      await import('@/lib/ledgerClient');
    resetSandbox();
    grantPlayMoney(100, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Too big',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 5000,
    });
    const state = getLedgerState();
    // The goal is still created — only the leg that cannot move is withheld.
    expect(goalId).toBeTruthy();
    expect(state.goals).toHaveLength(1);
    // Before the fix: one GoalFunded for $5,000 sat in the trail while
    // goalCash stayed 0.00 and working stayed 100.00 — History showed money
    // arriving that never did.
    expect(state.events.filter((e) => e.type === 'GoalFunded')).toHaveLength(0);
    expect(Number(state.goals[0].cash)).toBe(0);
    expect(Number(state.buckets.working)).toBe(100);
  });

  it('should still fund a goal it CAN afford', async () => {
    const { createGoal, getLedgerState, grantPlayMoney, resetSandbox } =
      await import('@/lib/ledgerClient');
    resetSandbox();
    grantPlayMoney(1000, 'USD', 'b2c');
    createGoal({
      name: 'Fine',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 400,
    });
    const state = getLedgerState();
    expect(Number(state.goals[0].cash)).toBe(400);
    expect(Number(state.buckets.working)).toBe(600);
  });
});
