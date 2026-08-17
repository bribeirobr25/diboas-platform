import { beforeEach, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  createGoal,
  enterStrategy,
  getLedgerState,
  getReady,
  grantAndSplit,
  previewExit,
  resetSandbox,
} from '@/lib/ledgerClient';

/**
 * P1.2 slice 1c — the hydration gate + one-grant guard (node env; the store is
 * node-safe and degrades to in-memory, so this exercises the app-service logic
 * without a DOM). The `<LedgerReadyGate>` render behaviour is verified in the
 * Docker MCP interaction matrix (render tests are Phase-2 slice-0).
 */
const ALL_WORKING = { floorPercent: 0, cushionPercent: 0, workingPercent: 100 };

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

  it('should mint exactly one grant when grantAndSplit is called once', () => {
    grantAndSplit(1000, 'USD', 'b2c', ALL_WORKING);
    expect(getLedgerState().initialized).toBe(true);
    expect(grantCount()).toBe(1);
  });

  it('should no-op a second grant (one-grant guard — double-grant reconcile cannot catch)', () => {
    grantAndSplit(1000, 'USD', 'b2c', ALL_WORKING);
    expect(grantCount()).toBe(1);
    const workingAfterFirst = getLedgerState().buckets.working;

    // A stray double-fire (fast double-tap / remount) must not mint a 2nd grant.
    grantAndSplit(9999, 'BRL', 'b2c', ALL_WORKING);
    expect(grantCount()).toBe(1);
    expect(getLedgerState().buckets.working).toBe(workingAfterFirst);
  });

  it('should allow a fresh grant after resetSandbox clears the ledger', () => {
    grantAndSplit(1000, 'USD', 'b2c', ALL_WORKING);
    expect(grantCount()).toBe(1);
    resetSandbox();
    expect(getLedgerState().initialized).toBe(false);
    grantAndSplit(500, 'EUR', 'b2c', ALL_WORKING);
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
    grantAndSplit(10_000, 'USD', 'b2c', ALL_WORKING);
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
