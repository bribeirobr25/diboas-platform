import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
  setRecurring,
} from '@/lib/ledgerClient';
import { playBalance } from '@/lib/monthReport';
import { selectHomeTriad } from '@/view/home';

/**
 * ONE FACT, ONE VALUE (Front 9 X1; lane audit 2026-10-21, L4): the play balance is summed
 * in `view/home.ts` (Home's hero) and again in `lib/monthReport.ts` (the report's opening
 * and closing). Only Home ↔ Move was pinned; this pins the month report to the hero, on a
 * ledger that has every bucket kind in play.
 */
describe('the month report and Home state the same play balance (L4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T09:00:00Z'));
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  it('should agree to the cent across grants, goal cash, positions and deposits', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 24,
      fundAmount: 1500,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 1000, networkFeeLocal: 0 });
    const positionId = getLedgerState().positions[0].positionId;
    setRecurring({ goalId, positionId, monthlyAmount: 200 });
    advanceTime(60, [], 'machine', []);

    const state = getLedgerState();
    expect(playBalance(state).toFixed(2)).toBe(selectHomeTriad(state).playBalance);
  });
});
