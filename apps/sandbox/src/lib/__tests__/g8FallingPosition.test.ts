import { beforeEach, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  fixturePriceSeries,
  type ProtocolApyHistory,
  type ProtocolPriceHistory,
  type StrategyId,
} from '@diboas/defi';
import { reconcile } from '@diboas/banking';
import { practiceValueSeries } from '@/lib/practiceSeries';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
  setRecurring,
} from '@/lib/ledgerClient';

/**
 * §4.8 — the claim this whole increment exists to make true: a practice
 * position in a growth strategy CAN LOSE MONEY.
 *
 * Before this, APY series were non-negative, so a growth position could only
 * ever rise — for every user, on every strategy, forever. A practice app that
 * cannot lose money teaches the most dangerous lesson in personal finance.
 */
const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;

const apyHistories = (days: number): ProtocolApyHistory[] =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      apyPercent: 5,
    })),
    stamp: { source: 'defillama', asOf: '2026-08-20T00:00:00Z' },
  }));

/** Real-shaped falling series for the market legs (fixture = start→trough→end). */
const priceHistories = (days: number): ProtocolPriceHistory[] =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: fixturePriceSeries(protocolId, days),
    stamp: { source: 'fixture', asOf: '2026-07-18' },
  }));

function openPosition(strategyId: StrategyId): string {
  grantPlayMoney(10_000, 'USD', 'b2c');
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 5000,
    horizonMonths: 24,
    fundAmount: 1000,
  });
  enterStrategy({ goalId, strategyId, totalFromCash: 1000, networkFeeLocal: 0 });
  return goalId;
}

describe('§4.8 — a growth position can FALL', () => {
  beforeEach(() => resetSandbox());

  it('should LOSE money on a growth strategy when the market fell', () => {
    openPosition('fullThrottle'); // 85% growth exposure
    advanceTime(180, apyHistories(400), 'machine', priceHistories(400));
    const accrued = new Decimal(getLedgerState().positions[0].accrued);
    // The headline assertion of the entire increment.
    expect(accrued.lt(0)).toBe(true);
  });

  it('should keep a STABLE strategy non-negative (USDC lending has no price dimension)', () => {
    openPosition('safeHarbor'); // 0% growth exposure, all lending legs
    advanceTime(180, apyHistories(400), 'machine', priceHistories(400));
    expect(new Decimal(getLedgerState().positions[0].accrued).gte(0)).toBe(true);
  });

  it('should lose MORE on higher disclosed growth exposure (the label matches the model)', () => {
    // fullThrottle discloses 85%, stableGrowth 30% — the deeper exposure must
    // actually fall further, or the disclosed percentage is decoration.
    resetSandbox();
    openPosition('stableGrowth');
    advanceTime(180, apyHistories(400), 'machine', priceHistories(400));
    const mild = new Decimal(getLedgerState().positions[0].accrued);

    resetSandbox();
    openPosition('fullThrottle');
    advanceTime(180, apyHistories(400), 'machine', priceHistories(400));
    const steep = new Decimal(getLedgerState().positions[0].accrued);

    expect(steep.lt(mild)).toBe(true);
  });

  it('should still reconcile to 0.00 THROUGH a loss (C-P0 conservation)', () => {
    openPosition('fullThrottle');
    advanceTime(180, apyHistories(400), 'machine', priceHistories(400));
    expect(new Decimal(getLedgerState().positions[0].accrued).lt(0)).toBe(true);
    // The invariant must hold with a negative earnings term, not just a positive one.
    expect(reconcile(getLedgerState())).toBe('0.00');
  });

  it('should pin the per-leg audit record once a market leg is involved', () => {
    openPosition('fullThrottle');
    advanceTime(180, apyHistories(400), 'machine', priceHistories(400));
    const accrual = getLedgerState().events.find((e) => e.type === 'AccrualApplied') as {
      legsReplayed?: Array<{ kind: string; source: string; multiple: string }>;
      apySource: string;
    };
    expect(accrual.legsReplayed).toBeDefined();
    expect(accrual.legsReplayed!.some((l) => l.kind === 'market')).toBe(true);
    // Provenance never over-claims: a fixture price series is stamped fixture.
    expect(accrual.legsReplayed!.some((l) => l.source === 'fixture')).toBe(true);
    expect(accrual.apySource).toBe('fixture');
  });

  it('should hold value (never invent a move) when no price series is supplied', () => {
    openPosition('fullThrottle');
    advanceTime(180, apyHistories(400), 'machine'); // no prices — e.g. a stale cached response
    const accrued = new Decimal(getLedgerState().positions[0].accrued);
    // Lending legs still earn; market legs sit flat rather than guessing.
    expect(accrued.gte(0)).toBe(true);
  });
});

describe('§4.8 — the accrual grid gives the chart a PATH, not a straight line', () => {
  beforeEach(() => resetSandbox());

  it('should emit a monthly trail for a plan-less year (was ONE jump)', () => {
    openPosition('fullThrottle');
    advanceTime(360, apyHistories(400), 'machine', priceHistories(400));
    const accruals = getLedgerState().events.filter((e) => e.type === 'AccrualApplied');
    // 12 segments, so the sparkline has 13 points and History reads as a year
    // of steps instead of a single "moved −$X" row.
    expect(accruals).toHaveLength(12);
  });

  it('should give the practice series enough points to show ups AND downs', () => {
    openPosition('fullThrottle');
    advanceTime(360, apyHistories(400), 'machine', priceHistories(400));
    const values = practiceValueSeries(getLedgerState()).map((p) => p.value);
    expect(values.length).toBeGreaterThanOrEqual(13);
    // Not monotonic in one straight line: the real price path turns.
    const rises = values.slice(1).filter((v, i) => v > values[i]).length;
    const falls = values.slice(1).filter((v, i) => v < values[i]).length;
    expect(rises).toBeGreaterThan(0);
    expect(falls).toBeGreaterThan(0);
  });

  it('should NOT emit a zero-value noise row when a deposit lands on a grid day', () => {
    // The dedupe guard: a 30-day cadence deposit sits exactly on a boundary.
    const goalId = openPosition('safeHarbor');
    const positionId = getLedgerState().positions[0].positionId;
    setRecurring({ goalId, positionId, monthlyAmount: 50 });
    advanceTime(90, apyHistories(400), 'machine', priceHistories(400));
    const zeroRows = getLedgerState()
      .events.filter((e) => e.type === 'AccrualApplied')
      .filter((e) => (e as { earnings: string }).earnings === '0.00');
    expect(zeroRows).toHaveLength(0);
  });

  it('should keep conservation exact across the segmented trail', () => {
    openPosition('fullThrottle');
    advanceTime(360, apyHistories(400), 'machine', priceHistories(400));
    // More events must not mean more rounding leakage.
    expect(reconcile(getLedgerState())).toBe('0.00');
  });
});
