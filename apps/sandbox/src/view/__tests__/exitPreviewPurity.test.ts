import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGoal,
  enterStrategy,
  exitPosition,
  getLedgerState,
  grantPlayMoney,
  previewGoalStop,
  previewPositionStop,
  resetSandbox,
} from '@/lib/ledgerClient';
import { PLAY_MONEY_GRANT } from '@/i18n/config';
import { selectExitPreview } from '../home';

/**
 * 5.341 · AUD-C01 — the exit preview is a function of its ARGUMENTS. The auditor's reproduction,
 * through the REAL preview functions the screen passes in (the fakes in `home.test.ts` ignore the
 * snapshot): one input object, a second entry into the same goal in between, and the preview of
 * that same input must not move (100 → 200 was the defect). A fresh snapshot does see the second
 * entry — so the test is not vacuous.
 */
describe('5.341 · selectExitPreview reads the snapshot it is given, never the live ledger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
    resetSandbox();
    grantPlayMoney(PLAY_MONEY_GRANT.b2c, 'BRL', 'b2c');
  });
  afterEach(() => vi.useRealTimers());

  it('should return the same goal preview for the same input after a second entry', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4_000,
      horizonMonths: 12,
      fundAmount: 1_000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 100, networkFeeLocal: 0 });
    const input = {
      intent: { scope: 'goal' as const },
      canPrice: true,
      goalId,
      snapshot: getLedgerState(),
      feeFor: () => 0,
      previewGoal: previewGoalStop,
      previewPosition: previewPositionStop,
    };
    const first = selectExitPreview(input);
    expect(first?.gross).toBe('100.00');

    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 100, networkFeeLocal: 0 });

    expect(selectExitPreview(input)).toEqual(first); // the same input → the same preview
    // Non-vacuity: the second entry is real, and a fresh snapshot sees it.
    expect(selectExitPreview({ ...input, snapshot: getLedgerState() })?.gross).toBe('200.00');
  });

  it('should return the same goal preview for the same input after its position closes', () => {
    // 10th audit: a live read inside `openPositionsOf` passed the second-entry case (the new
    // position is not in the snapshot, so the preview drops it anyway). Closing the goal's only
    // position is what a live read cannot hide: it would find nothing open.
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4_000,
      horizonMonths: 12,
      fundAmount: 1_000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 100, networkFeeLocal: 0 });
    const input = {
      intent: { scope: 'goal' as const },
      canPrice: true,
      goalId,
      snapshot: getLedgerState(),
      feeFor: () => 0,
      previewGoal: previewGoalStop,
      previewPosition: previewPositionStop,
    };
    const first = selectExitPreview(input);
    expect(first?.gross).toBe('100.00');
    exitPosition({ positionId: getLedgerState().positions[0].positionId, networkFeeLocal: 0 });
    expect(selectExitPreview(input)).toEqual(first);
    expect(selectExitPreview({ ...input, snapshot: getLedgerState() })).toBeNull(); // non-vacuity
  });

  it('should return the same position preview for the same input after that position closes', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 4_000,
      horizonMonths: 12,
      fundAmount: 1_000,
    });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 100, networkFeeLocal: 0 });
    const positionId = getLedgerState().positions[0].positionId;
    const input = {
      intent: { scope: 'position' as const, positionId },
      canPrice: true,
      goalId,
      snapshot: getLedgerState(),
      feeFor: () => 0,
      previewGoal: previewGoalStop,
      previewPosition: previewPositionStop,
    };
    const first = selectExitPreview(input);
    expect(first?.gross).toBe('100.00');
    // A second entry opens a NEW position and leaves this one as it was, so it cannot tell a live
    // read from a snapshot read. Closing THIS position can: a live read finds nothing to preview.
    exitPosition({ positionId, networkFeeLocal: 0 });
    expect(selectExitPreview(input)).toEqual(first);
    expect(selectExitPreview({ ...input, snapshot: getLedgerState() })).toBeNull(); // non-vacuity
  });
});
