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

    /**
     * DERIVED from the cadence spec, not from running the code (rule 4).
     * `recurringDepositDays` anchors the first deposit at `startSimDay + 30`
     * and steps by `RECURRING_CADENCE_DAYS = 30`, so a 365-day advance from
     * day 0 fires on days 30, 60 … 360 — **12 deposits**. At 200 each the
     * user's own money is exactly 2,400.00. This is the same figure the audit
     * row states independently ("user deposits are 2,400").
     */
    expect(d.contributed).toBeCloseTo(12 * 200, 2);

    /**
     * And the defect the row quantifies: the deposits were **95% of the
     * headline**. Asserting the SHARE is what pins the defect rather than its
     * symptom — a market-only headline can never be dominated by deposits,
     * because deposits are no longer in it.
     */
    const totalChange = d.end - d.start;
    expect(d.contributed / totalChange).toBeGreaterThan(0.9);
    expect(d.market / totalChange).toBeLessThan(0.1);

    /**
     * The market term must be exactly the accrual total the log carries —
     * nothing else may reach it. Derived from the event log, independently of
     * the decomposition under test.
     */
    const accrualSum = getLedgerState()
      .events.filter((e) => e.type === 'AccrualApplied')
      .reduce((sum, e) => sum + Number((e as { earnings: string }).earnings), 0);
    expect(d.market).toBeCloseTo(accrualSum, 2);
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
    /**
     * DERIVED from the event log, independently of the decomposition under
     * test: an exit removes exactly what the position held, which is its
     * entry principal plus every accrual credited to it. `> 0` would pass
     * under any wrong amount.
     *
     * (Note: this cannot be derived from `points` — the value line collapses
     * a same-day accrual and exit into one point by design, so the pre-exit
     * peak never appears there. Deriving it from the events instead is both
     * independent and immune to that.)
     */
    const events = getLedgerState().events;
    const principal = events
      .filter((e) => e.type === 'StrategyEntered')
      .reduce((sum, e) => sum + Number((e as { amount: string }).amount), 0);
    const accruals = events
      .filter((e) => e.type === 'AccrualApplied')
      .reduce((sum, e) => sum + Number((e as { earnings: string }).earnings), 0);
    expect(d.exited).toBeCloseTo(principal + accruals, 2);
    // …and the whole position left, so the line ends at zero.
    expect(d.end).toBeCloseTo(0, 2);
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
