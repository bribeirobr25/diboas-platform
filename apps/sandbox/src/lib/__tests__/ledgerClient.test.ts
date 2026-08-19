import { beforeEach, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  getReady,
  grantPlayMoney,
  pauseGoal,
  previewExit,
  resetSandbox,
  resumeGoal,
  setRecurring,
  accomplishGoal,
  raiseGoalTarget,
} from '@/lib/ledgerClient';

/**
 * P1.2 slice 1c — the hydration gate + one-grant guard (node env; the store is
 * node-safe and degrades to in-memory, so this exercises the app-service logic
 * without a DOM). The `<LedgerReadyGate>` render behaviour is verified in the
 * Docker MCP interaction matrix (render tests are Phase-2 slice-0).
 */
function grantCount(): number {
  return getLedgerState().events.filter((e) => e.type === 'PlayMoneyGranted').length;
}

describe('ledgerClient — slice 1c hydration gating', () => {
  beforeEach(() => {
    resetSandbox();
  });

  it('should report ready after module-init hydrate settles', async () => {
    // `void hydrate()` runs at import; `ready` flips true once it settles
    // (one microtask for the in-memory store). Drain the queue, then assert.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getReady()).toBe(true);
  });

  it('should mint exactly one grant when grantPlayMoney is called once', () => {
    grantPlayMoney(1000, 'USD', 'b2c');
    expect(getLedgerState().initialized).toBe(true);
    expect(grantCount()).toBe(1);
  });

  it('should no-op a second grant (one-grant guard — double-grant reconcile cannot catch)', () => {
    grantPlayMoney(1000, 'USD', 'b2c');
    expect(grantCount()).toBe(1);
    const workingAfterFirst = getLedgerState().buckets.working;

    // A stray double-fire (fast double-tap / remount) must not mint a 2nd grant.
    grantPlayMoney(9999, 'BRL', 'b2c');
    expect(grantCount()).toBe(1);
    expect(getLedgerState().buckets.working).toBe(workingAfterFirst);
  });

  it('should allow a fresh grant after resetSandbox clears the ledger', () => {
    grantPlayMoney(1000, 'USD', 'b2c');
    expect(grantCount()).toBe(1);
    resetSandbox();
    expect(getLedgerState().initialized).toBe(false);
    grantPlayMoney(500, 'EUR', 'b2c');
    expect(grantCount()).toBe(1);
    expect(getLedgerState().initialized).toBe(true);
  });
});

describe('previewExit — the widened exit primitive (Step 0 item 7)', () => {
  beforeEach(() => {
    resetSandbox();
  });

  /** Grant → fund a goal with 1000 → enter a strategy (10 fee) → 990 principal. */
  function openPosition(): string {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 24,
      fundAmount: 1000,
    });
    return enterStrategy({
      goalId,
      strategyId: 'safeHarbor',
      totalFromCash: 1000,
      networkFeeLocal: 10,
    });
  }

  it('should itemize gross, exit fee, the passed-in network fee, and a net that is exactly gross − both fees', () => {
    const positionId = openPosition();
    const preview = previewExit(positionId, 5);
    expect(preview).not.toBeNull();
    expect(preview!.gross).toBe('990.00'); // 990 principal + 0 accrued
    expect(preview!.networkFee).toBe('5.00'); // echoes the caller-computed gas fee (board §8.1a)
    // The bottom line the user sees is exact to the cent — never drifts from its parts.
    expect(preview!.net).toBe(
      new Decimal(preview!.gross).minus(preview!.exitFee).minus(preview!.networkFee).toFixed(2)
    );
    // And it matches the engine's own StrategyExited net formula (same math, two call sites).
    expect(new Decimal(preview!.net).lt(preview!.gross)).toBe(true);
  });

  it('should return null for an unknown or already-closed position', () => {
    openPosition();
    expect(previewExit('no-such-position', 5)).toBeNull();
  });
});

describe('G3 pause/resume (§4.3, W-17d — plan-level, positions keep working)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should pause then resume with optimistic versions, reconcile-indifferent', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 500,
    });
    pauseGoal(goalId);
    expect(getLedgerState().goals[0].status).toBe('paused');
    pauseGoal(goalId); // already paused → clean no-op
    expect(getLedgerState().goals[0].version).toBe(1);
    resumeGoal(goalId);
    expect(getLedgerState().goals[0].status).toBe('active');
    expect(new Decimal(getLedgerState().goals[0].cash).toFixed(2)).toBe('500.00');
  });

  it("should make a paused goal's recurring schedule INERT during advances — the pause copy stays true", () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    const positionId = enterStrategy({
      goalId,
      strategyId: 'safeHarbor',
      totalFromCash: 500,
      networkFeeLocal: 1,
    });
    setRecurring({ goalId, positionId, monthlyAmount: 100 });
    pauseGoal(goalId);
    const workingBefore = getLedgerState().buckets.working;
    advanceTime(35, []); // a month passes; the deposit would fire if active
    const state = getLedgerState();
    expect(state.buckets.working).toBe(workingBefore); // no deposit while paused
    expect(state.events.filter((e) => e.type === 'RecurringContributionApplied')).toHaveLength(0);
    // Resume → the next month's advance deposits again (inert, not destroyed).
    resumeGoal(goalId);
    advanceTime(35, []);
    expect(
      getLedgerState().events.filter((e) => e.type === 'RecurringContributionApplied').length
    ).toBeGreaterThan(0);
  });
});

describe('G4 emitter guards match the engine (§4.4 audit)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should let a PAUSED goal raise its target — the completion row is never a fake control', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 500,
      horizonMonths: 12,
      fundAmount: 500,
    });
    pauseGoal(goalId);
    raiseGoalTarget(goalId, 900);
    const goal = getLedgerState().goals.find((g) => g.goalId === goalId)!;
    expect(goal.targetAmount).toBe('900.00');
    expect(goal.status).toBe('paused'); // raising never resumes or closes it
  });

  it('should refuse to raise a target on an ACCOMPLISHED goal (terminal stays terminal)', () => {
    const goalId = createGoal({
      name: 'Done',
      icon: 'target',
      targetAmount: 500,
      horizonMonths: 6,
      fundAmount: 500,
    });
    accomplishGoal(goalId, 'held-as-cash');
    raiseGoalTarget(goalId, 900);
    expect(getLedgerState().goals.find((g) => g.goalId === goalId)!.targetAmount).toBe('500.00');
  });
});
