import { beforeEach, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { fixturePriceSeries } from '@diboas/defi';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  previewGoalStop,
  resetSandbox,
} from '@/lib/ledgerClient';
import { goalCurrentValue } from '@/lib/goalValue';
import { positionValueSeries } from '@/lib/positionSeries';
import { classifyTrend, practiceValueSeries } from '@/lib/practiceSeries';

/**
 * §4.8 step 9 — the blast radius. Ten surfaces read `accrued`/position value,
 * and until this increment none of them could ever receive a negative. These
 * pin the DERIVATIONS behind them, so a loss stays honest all the way out to
 * the screens rather than turning into a crash, a clamp, or a fake gain.
 */
const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;
const apy = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      apyPercent: 5,
    })),
    stamp: { source: 'defillama' as const, asOf: '2026-08-20T00:00:00Z' },
  }));
const prices = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: fixturePriceSeries(protocolId, days),
    stamp: { source: 'fixture' as const, asOf: '2026-07-18' },
  }));

function fallen(): string {
  grantPlayMoney(10_000, 'USD', 'b2c');
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 5000,
    horizonMonths: 24,
    fundAmount: 1000,
  });
  enterStrategy({ goalId, strategyId: 'fullThrottle', totalFromCash: 1000, networkFeeLocal: 0 });
  advanceTime(180, apy(400), 'machine', prices(400));
  return goalId;
}

describe('§4.8 step 9 — a loss stays honest across every surface', () => {
  beforeEach(() => resetSandbox());

  it('should carry the loss into the goal total (never clamped at the contribution)', () => {
    const goalId = fallen();
    const current = goalCurrentValue(getLedgerState(), goalId);
    // 1,000 was funded and put to work; a fallen position must drag the goal
    // below it rather than flooring at "what you put in".
    expect(current.lt(1000)).toBe(true);
    expect(current.gt(0)).toBe(true);
  });

  it('should render a FALLING position series (the sparkline has a real down leg)', () => {
    fallen();
    const positionId = getLedgerState().positions[0].positionId;
    const series = positionValueSeries(getLedgerState(), positionId);
    expect(series.length).toBeGreaterThanOrEqual(2);
    expect(series[series.length - 1]).toBeLessThan(series[0]);
  });

  it('should classify the practice trend as FELL, not flat or grew', () => {
    fallen();
    const points = practiceValueSeries(getLedgerState());
    const values = points.map((p) => p.value);
    expect(classifyTrend(values[0], values[values.length - 1])).toBe('fell');
  });

  it('should let a reached goal UN-REACH when the market takes it back below target', () => {
    // Founder-agreed 2026-08-20: `target_reached` is derived, so this is the
    // honest fact — you are no longer at your target if the money fell.
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Small',
      icon: 'target',
      targetAmount: 900,
      horizonMonths: 12,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'fullThrottle', totalFromCash: 1000, networkFeeLocal: 0 });
    const before = goalCurrentValue(getLedgerState(), goalId);
    expect(before.gte(900)).toBe(true); // reached
    advanceTime(180, apy(400), 'machine', prices(400));
    expect(goalCurrentValue(getLedgerState(), goalId).lt(900)).toBe(true); // un-reached
  });

  it('should still price an EXIT on a fallen position (the floor binds, nothing breaks)', () => {
    const goalId = fallen();
    const preview = previewGoalStop(goalId, () => 0.03)!;
    expect(preview).not.toBeNull();
    // Gross is what is really there — smaller than what went in.
    expect(new Decimal(preview.gross).lt(1000)).toBe(true);
    // The fee is still charged honestly, and the floor is what binds when the
    // position has shrunk: 0.39% of a small gross is under $0.25.
    expect(new Decimal(preview.exitFee).gte(0.25)).toBe(true);
    expect(new Decimal(preview.net).lt(preview.gross)).toBe(true);
  });

  it('should keep every displayed figure finite and non-NaN through the loss', () => {
    const goalId = fallen();
    const s = getLedgerState();
    const nums = [
      goalCurrentValue(s, goalId).toNumber(),
      ...positionValueSeries(s, s.positions[0].positionId),
      ...practiceValueSeries(s).map((p) => p.value),
      Number(s.positions[0].accrued),
    ];
    for (const n of nums) expect(Number.isFinite(n)).toBe(true);
  });
});
