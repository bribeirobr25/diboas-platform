import { beforeEach, describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { fixtureDateSeries, fixturePriceSeries, FIXTURE_STAMP, observedStamp } from '@diboas/defi';
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
/**
 * The shared fixture calendar, built ONCE per length.
 *
 * `fixtureDateSeries` walks `days` dates, so calling it inside a per-point
 * callback is O(days²) — measured consequence: `g8FallingPosition`'s
 * higher-exposure test TIMED OUT at 5000ms in the full suite (roughly a million
 * date operations per builder call, six protocols deep, twice per test) while
 * passing in isolation. Hoisted, not inlined.
 */
const datesFor = (() => {
  const cache = new Map<number, string[]>();
  return (days: number): string[] => {
    const hit = cache.get(days);
    if (hit) return hit;
    const built = fixtureDateSeries(days);
    cache.set(days, built);
    return built;
  };
})();

const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;
const apy = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: datesFor(days)[i],
      apyPercent: 5,
    })),
    stamp: observedStamp('defillama', '2026-08-20T00:00:00Z'),
  }));
const prices = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: fixturePriceSeries(protocolId, days),
    stamp: FIXTURE_STAMP,
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
    /* 360 days, not 180 — and the reason is the point. MEASURED on the shared
       fixture calendar, with ZERO spans refused in all three: 180 days ends at
       965.36, which is ABOVE the 900 target; 270 ends at 740.96; 360 at 542.34.
       The old 180-day margin existed only because segment 0's window was
       uncoverable and the planner silently fell back to historic anchoring,
       replaying the fixture's steep recent tail in place of the stretch actually
       requested (`5.105` §2/§3). The REQUIREMENT is unchanged — a derived
       `target_reached` must un-reach when the money falls — so the fix is a fall
       deep enough to test it, never a weaker assertion. */
    advanceTime(360, apy(400), 'machine', prices(400));
    expect(goalCurrentValue(getLedgerState(), goalId).lt(900)).toBe(true); // un-reached
  });

  it('should still price an EXIT on a fallen position (the floor binds, nothing breaks)', () => {
    const goalId = fallen();
    const preview = previewGoalStop(getLedgerState(), goalId, () => 0.03)!;
    expect(preview).not.toBeNull();
    // Gross is what is really there — smaller than what went in.
    expect(new Decimal(preview.gross).lt(1000)).toBe(true);
    // The fee is still computed honestly, and the floor is what binds when the
    // position has shrunk: 0.39% of a small gross is under $0.25.
    expect(new Decimal(preview.exitFee).gte(0.25)).toBe(true);
    /* `5.403`: the surface still SHOWS the modelled cost on a fallen position —
       which is this test's concern, that a loss stays honest all the way out —
       but Practice money is not reduced by it, so what comes back is the gross.
       The old `net < gross` line asserted the deduction, not the honesty. */
    expect(new Decimal(preview.exitFee).plus(preview.networkFee).gt(0)).toBe(true);
    expect(preview.net).toBe(preview.gross);
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
