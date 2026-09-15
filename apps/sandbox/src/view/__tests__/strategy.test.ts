import { describe, expect, it } from 'vitest';
import { blendDatedSeries } from '@diboas/investing';
import { observedStamp } from '@diboas/defi';
import type { AllocationLeg, ProtocolApyHistory } from '@diboas/defi';
import { CHART_TIMEFRAMES, selectStrategyChartSeries } from '../strategy';

const ALLOC: AllocationLeg[] = [
  { protocolId: 'skySsr', weightPercent: 50 },
  { protocolId: 'aaveV3', weightPercent: 30 },
  { protocolId: 'compoundV3', weightPercent: 20 },
];

function history(protocolId: ProtocolApyHistory['protocolId'], apy: number, days = 120) {
  return {
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: `2026-0${1 + Math.floor(i / 31)}-${String((i % 31) + 1).padStart(2, '0')}`,
      apyPercent: apy,
    })),
    /* Built, not literal: §8.8 made every provenance field required so no
       construction site can stay silent — test harnesses included. */
    stamp: observedStamp('defillama', '2026-09-14'),
  } satisfies ProtocolApyHistory;
}

const FULL = [history('skySsr', 4), history('aaveV3', 6), history('compoundV3', 10)];

describe('selectStrategyChartSeries', () => {
  it('should blend every leg by its own weight when all history is present', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: FULL,
      requestedTimeframe: 90,
    });
    expect(v.complete).toBe(true);
    expect(v.weightCovered).toBe(100);
    expect(v.missingProtocolIds).toEqual([]);
    // 4*0.5 + 6*0.3 + 10*0.2 = 5.8
    expect(v.series[0].apyPercent).toBeCloseTo(5.8, 10);
  });

  /**
   * The defect this selector exists to prevent, asserted on the DOMAIN function
   * so the class is recorded rather than described: drop the 50% leg and
   * `blendDatedSeries` still returns a confident number — 3.8, not 5.8 — with
   * nothing marking it partial. Rendering that as the strategy's own history is
   * a `MISSING ≠ 0` untruth, so the selector must refuse instead.
   */
  it('should refuse rather than publish the low curve a missing leg produces', () => {
    const partial = [history('aaveV3', 6), history('compoundV3', 10)];

    const raw = blendDatedSeries(
      ALLOC.map((leg) => ({
        weightPercent: leg.weightPercent,
        points: partial.find((h) => h.protocolId === leg.protocolId)?.points ?? [],
      }))
    );
    expect(raw[0].apyPercent).toBeCloseTo(3.8, 10); // silently low, and unmarked

    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: partial,
      requestedTimeframe: 90,
    });
    expect(v.complete).toBe(false);
    expect(v.missingProtocolIds).toEqual(['skySsr']);
    expect(v.weightCovered).toBe(50);
    expect(v.series).toEqual([]);
    expect(v.sparkSeries).toEqual([]);
  });

  it('should treat a leg present but EMPTY as missing, not as zero', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: [{ ...history('skySsr', 4), points: [] }, FULL[1], FULL[2]],
      requestedTimeframe: 90,
    });
    expect(v.complete).toBe(false);
    expect(v.missingProtocolIds).toEqual(['skySsr']);
  });

  it('should never show a timeframe wider than the data can fill', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: [
        history('skySsr', 4, 40),
        history('aaveV3', 6, 40),
        history('compoundV3', 10, 40),
      ],
      requestedTimeframe: 365,
    });
    expect(v.series.length).toBeLessThan(90);
    expect(v.widestFit).toBe(30);
    expect(v.timeframe).toBe(30);
  });

  it('should honour the requested timeframe when history covers it', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: FULL,
      requestedTimeframe: 7,
    });
    expect(v.timeframe).toBe(7);
  });

  it('should fall back to the narrowest timeframe when there is no series at all', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: [],
      requestedTimeframe: 365,
    });
    expect(v.complete).toBe(false);
    expect(v.timeframe).toBe(CHART_TIMEFRAMES[0]);
    expect(v.missingProtocolIds).toEqual(['skySsr', 'aaveV3', 'compoundV3']);
  });

  it('should summarise only the trailing 30 readings in the sparkline', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: FULL,
      requestedTimeframe: 90,
    });
    expect(v.sparkSeries).toHaveLength(30);
    expect(v.sparkSeries.every((n) => Math.abs(n - 5.8) < 1e-9)).toBe(true);
  });
});
