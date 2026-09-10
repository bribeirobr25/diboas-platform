import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  exitPosition,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
  setRecurring,
} from '@/lib/ledgerClient';
import type { ProtocolApyHistory } from '@diboas/defi';
import { classifyTrend, decomposePracticeValue } from '@/lib/practiceSeries';

/**
 * `5.199` — the P0 the time machine shipped with, and the test that did not
 * exist.
 *
 * The screen rendered `end − start` as "Change +X (+Y%)" directly above the
 * words *"It excludes your future contributions and weekly credits."* Both
 * could not be true: the value line folds `RecurringContributionApplied.amount`
 * in, so a recurring plan made the user's own deposits most of the "change",
 * and the percentage was not a return at all.
 *
 * The audit's finding was explicit about why it survived: *"No test covers the
 * interaction — no test exercises a recurring plan across an advance and
 * asserts the change figure."* This file is that test.
 *
 * The property that matters is the same one `monthReport` protects: the terms
 * must SUM to the change, provably, so the screen may claim to explain it.
 */

const GENESIS = '2026-08-03T09:00:00Z';
const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;

/** A flat, all-lending 5% series: growth comes only from accrual, so the
 *  market term is unambiguous and the arithmetic is checkable by hand. */
const apyHistories = (days: number): ProtocolApyHistory[] =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      apyPercent: 5,
    })),
    stamp: { source: 'defillama' as const, asOf: '2026-08-20T00:00:00Z' },
  }));

/** A goal with money at work, so the value line has something to track. */
function positionAtWork(totalFromCash: number) {
  grantPlayMoney(10_000, 'USD', 'b2c');
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 5000,
    horizonMonths: 24,
    fundAmount: totalFromCash,
  })!;
  enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash, networkFeeLocal: 0 });
  return goalId;
}

describe('the practice value decomposition (5.199)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(GENESIS));
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  it('should keep market change SEPARATE from the user own deposits when a recurring plan runs', () => {
    // The exact shape the audit reproduced: a position at work, a monthly
    // contribution, and a year of replay.
    const goalId = positionAtWork(1000);
    const positionId = getLedgerState().positions[0].positionId;
    setRecurring({ goalId, positionId, monthlyAmount: 200 });
    advanceTime(365, apyHistories(400), 'machine');

    const d = decomposePracticeValue(getLedgerState());

    // The regression: the total change is NOT the market's contribution.
    const totalChange = d.end - d.start;
    expect(d.contributed).toBeGreaterThan(0);
    expect(totalChange).toBeGreaterThan(d.market);

    // What the screen must now be able to say: the market term alone, and the
    // user's deposits alone — never one figure standing for both.
    expect(d.market).not.toBeCloseTo(totalChange, 2);
  });

  it('should sum its terms to EXACTLY the change in the value line', () => {
    // The identity the screen relies on before it explains anything: a ledger
    // with every kind of movement the line tracks — principal in, accrual, a
    // recurring contribution, and principal out.
    const goalId = positionAtWork(1000);
    const positionId = getLedgerState().positions[0].positionId;
    setRecurring({ goalId, positionId, monthlyAmount: 200 });
    advanceTime(120, apyHistories(400), 'machine');
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 500, networkFeeLocal: 0 });
    advanceTime(60, apyHistories(400), 'machine');

    const d = decomposePracticeValue(getLedgerState());
    const explained = d.market + d.contributed + d.entered - d.exited;

    expect(explained).toBeCloseTo(d.end - d.start, 2);
    expect(d.identityHolds).toBe(true);
  });

  it('should still hold the identity after a position is exited', () => {
    positionAtWork(1000);
    advanceTime(90, apyHistories(400), 'machine');
    const positionId = getLedgerState().positions[0].positionId;
    exitPosition({ positionId, networkFeeLocal: 0 });

    const d = decomposePracticeValue(getLedgerState());
    expect(d.exited).toBeGreaterThan(0);
    expect(d.market + d.contributed + d.entered - d.exited).toBeCloseTo(d.end - d.start, 2);
    expect(d.identityHolds).toBe(true);
  });

  it('should report zero deposits when no recurring plan exists, so a percentage stays honest', () => {
    // With nothing but market movement, `end − start` IS the market term and a
    // percentage is a genuine return — the one case the screen may show one.
    positionAtWork(1000);
    advanceTime(180, apyHistories(400), 'machine');

    const d = decomposePracticeValue(getLedgerState());
    expect(d.contributed).toBe(0);
    expect(d.entered).toBe(0);
    expect(d.exited).toBe(0);
    expect(d.market).toBeCloseTo(d.end - d.start, 2);
  });

  it('should return an empty, non-claiming decomposition for a ledger with nothing at work', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const d = decomposePracticeValue(getLedgerState());
    expect(d.points).toHaveLength(0);
    expect(d.start).toBe(0);
    expect(d.end).toBe(0);
    expect(d.market).toBe(0);
    // Nothing to explain, and it does not claim otherwise.
    expect(d.identityHolds).toBe(true);
  });

  it('should classify a flat stretch as flat rather than inventing a direction', () => {
    // Below a tenth of a percent, claiming either direction would overstate
    // what the market did (the existing `classifyTrend` contract).
    expect(classifyTrend(1000, 1000.5)).toBe('flat');
    expect(classifyTrend(1000, 1100)).toBe('grew');
    expect(classifyTrend(1000, 900)).toBe('fell');
  });
});
