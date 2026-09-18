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
  previewGoalStop,
  previewPositionStop,
  resetSandbox,
  resumeGoal,
  setRecurring,
  accomplishGoal,
  raiseGoalTarget,
  stopGoalStrategies,
  exitPosition,
} from '@/lib/ledgerClient';
import { exitFeesOf } from '@diboas/banking';

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

  it('should itemize gross, exit fee, the passed-in network fee, and a net that is what actually comes back', () => {
    const positionId = openPosition();
    const preview = previewExit(getLedgerState(), positionId, 5);
    expect(preview).not.toBeNull();
    // 1000 committed, ALL of it invested (5.403: the modelled fee took nothing).
    expect(preview!.gross).toBe('1000.00');
    expect(preview!.networkFee).toBe('5.00'); // echoes the caller-computed gas fee (board §8.1a)
    // Both modelled costs are still itemized — F-12 keeps them visible.
    expect(new Decimal(preview!.exitFee).gt(0)).toBe(true);
    /**
     * ⚑ `5.403` restated this assertion, and the REQUIREMENT is unchanged: the
     * bottom line must be exact to the cent and must never drift from what the
     * ledger books. What changed is the figure it names. The ceremony labels this
     * row *"What actually comes back"*, and in Practice that is the whole gross —
     * the fees are shown separately and deducted from nothing. Asserting
     * `gross − both fees` here would now pin the defect instead of the rule.
     */
    expect(preview!.net).toBe(preview!.gross);
  });

  it('should return null for an unknown or already-closed position', () => {
    openPosition();
    expect(previewExit(getLedgerState(), 'no-such-position', 5)).toBeNull();
  });
});

/**
 * FC-15 — "what you read is exactly what happens": the confirmation surface IS
 * the transaction, to the last cent.
 *
 * `previewExit` subtracted the UNROUNDED network fee and rounded the net, while
 * `StrategyExited` rounds the fee first. At a sub-cent fee the two diverged: the
 * manifest said one net, the ledger booked another. Measured over the fee table ×
 * plausible USD→local quotes × four gross sizes: 4,257 of 1,080,080 cases. The
 * counter-example below is the first one that probe found.
 */
describe('the exit manifest books exactly what it shows (FC-15)', () => {
  beforeEach(() => resetSandbox());

  /** A position worth exactly `gross`, with the goal's cash fully invested. */
  function positionWorth(gross: number): string {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 24,
      fundAmount: gross,
    });
    return enterStrategy({
      goalId,
      strategyId: 'safeHarbor',
      totalFromCash: gross,
      networkFeeLocal: 0,
    });
  }

  it('should land in the goal exactly the net the preview stated, at a sub-cent fee', () => {
    // Gross 25.00 with a fee quoted at 0.005 (Solana 0.001 × a local rate of 5).
    const positionId = positionWorth(25);
    const preview = previewExit(getLedgerState(), positionId, 0.005)!;
    exitPosition({ positionId, networkFeeLocal: 0.005 });
    /**
     * The FC-15 requirement is UNCHANGED and this is still the sub-cent case
     * that found the original divergence: what the surface states is what the
     * ledger books, to the last cent. `5.403` changed only which figure is
     * stated — the modelled fees no longer reduce it — so the equality is now
     * against the full gross, and it still has to hold exactly.
     */
    expect(getLedgerState().goals[0].cash).toBe(preview.net);
    expect(preview.net).toBe(preview.gross);
    /* The modelled cost is still recorded on the event, not silently dropped.
       Read through `exitFeesOf` because canon's v2 shape names the field
       `modeledNetworkFee` (`5.410`); reaching for the raw `networkFee` was this
       assertion's own bug, and the union turned it into a compile-visible one. */
    const exit = getLedgerState().events.find((e) => e.type === 'StrategyExited');
    expect(exit ? exitFeesOf(exit).networkFee : null).toBe('0.01');
  });

  it('should agree with the ledger across every fee the gas table can produce', () => {
    // The fixture gas table (sub-cent Solana/Sui, cents Arbitrum) × the fixture
    // and live-shaped USD→local rates the market route actually serves.
    for (const gas of [0.001, 0.002, 0.03]) {
      for (const rate of [1, 0.92, 5, 5.5, 5.4523, 0.861341]) {
        resetSandbox();
        const positionId = positionWorth(25);
        const fee = gas * rate;
        const preview = previewExit(getLedgerState(), positionId, fee)!;
        exitPosition({ positionId, networkFeeLocal: fee });
        // Still the same promise across the whole gas × rate table: the figure
        // the surface stated is the figure the ledger booked (`5.403` moved the
        // figure to the full gross; it did not weaken the agreement).
        expect(getLedgerState().goals[0].cash, `gas ${gas} × rate ${rate}`).toBe(preview.net);
        expect(preview.net, `gas ${gas} × rate ${rate}`).toBe(preview.gross);
      }
    }
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
    raiseGoalTarget(goalId, '900');
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
    raiseGoalTarget(goalId, '900');
    expect(getLedgerState().goals.find((g) => g.goalId === goalId)!.targetAmount).toBe('500.00');
  });
});

describe('goal-level stop — the G7 composition (§4.7, board §3.3)', () => {
  beforeEach(() => {
    resetSandbox();
  });

  /** A goal holding two SMALL positions, so the $0.25 floor binds on both. */
  function twoSmallPositions(): { goalId: string; positions: string[] } {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 24,
      fundAmount: 100,
    });
    const a = enterStrategy({
      goalId,
      strategyId: 'safeHarbor',
      totalFromCash: 50,
      networkFeeLocal: 0,
    });
    const b = enterStrategy({
      goalId,
      strategyId: 'safeHarbor',
      totalFromCash: 50,
      networkFeeLocal: 0,
    });
    return { goalId, positions: [a, b] };
  }

  it('should charge the $0.25 exit floor PER position, never once on the summed gross', () => {
    const { goalId } = twoSmallPositions();
    const preview = previewGoalStop(getLedgerState(), goalId, () => 0)!;
    expect(preview.lines).toHaveLength(2);
    // Each 50.00 position is far under the floor's crossover (0.39% of 50 =
    // $0.195), so both pay the floor: the honest total is 0.50, not 0.25.
    expect(preview.lines.map((l) => l.exitFee)).toEqual(['0.25', '0.25']);
    expect(preview.exitFee).toBe('0.50');
    // The understatement this screen exists to prevent: a floor applied once to
    // the summed gross would have read 0.25 and hidden half the real cost.
    expect(preview.exitFee).not.toBe('0.25');
  });

  it('should sum a network fee PER position (N exits are N on-chain moves)', () => {
    const { goalId } = twoSmallPositions();
    const preview = previewGoalStop(getLedgerState(), goalId, () => 3)!;
    // The point of this test: two positions, two network fees. Unchanged.
    expect(preview.networkFee).toBe('6.00');
    // `5.403`: the composed figure that comes back is the summed gross; the two
    // modelled fee totals stay itemized beside it rather than subtracted from it.
    expect(preview.net).toBe(preview.gross);
  });

  it('should give the single-position preview the SAME shape as the goal-level one', () => {
    const { positions } = twoSmallPositions();
    const one = previewPositionStop(getLedgerState(), positions[0], 3)!;
    expect(one.lines).toHaveLength(1);
    expect(one.gross).toBe(one.lines[0].gross);
    expect(one.exitFee).toBe('0.25');
    expect(one.networkFee).toBe('3.00');
  });

  it('should emit one StrategyExited PER position under a SINGLE correlationId', () => {
    const { goalId } = twoSmallPositions();
    stopGoalStrategies(goalId, () => 3);
    const exits = getLedgerState().events.filter((e) => e.type === 'StrategyExited');
    expect(exits).toHaveLength(2);
    // One user decision, one correlation — but two distinct events.
    expect(new Set(exits.map((e) => e.correlationId)).size).toBe(1);
    expect(new Set(exits.map((e) => e.eventId)).size).toBe(2);
    expect(getLedgerState().positions.filter((p) => p.open)).toHaveLength(0);
  });

  it('should land the net in the GOAL as cash, never in Available (D-e)', () => {
    const { goalId } = twoSmallPositions();
    const before = getLedgerState().buckets.working;
    const preview = previewGoalStop(getLedgerState(), goalId, () => 0)!;
    stopGoalStrategies(goalId, () => 0);
    const after = getLedgerState();
    expect(after.buckets.working).toBe(before); // Available untouched
    expect(after.goals.find((g) => g.goalId === goalId)!.cash).toBe(
      new Decimal(preview.net).toFixed(2)
    );
  });

  it('should return null (not a zeroed ceremony) when the goal has nothing working', () => {
    const { goalId } = twoSmallPositions();
    stopGoalStrategies(goalId, () => 0);
    expect(previewGoalStop(getLedgerState(), goalId, () => 0)).toBeNull();
    // And a second stop is a no-op rather than a double exit.
    stopGoalStrategies(goalId, () => 0);
    expect(getLedgerState().events.filter((e) => e.type === 'StrategyExited')).toHaveLength(2);
  });
});
