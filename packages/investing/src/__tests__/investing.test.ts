import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  blendSeries,
  dailyFactorFromApyPercent,
  replayEarnings,
  type DailyApySeries,
} from '../accrual';
import {
  FINANCIAL_FREEDOM_SWR,
  GOAL_ICONS,
  MONTHLY_INVEST_SHARE,
  SCENARIO_RATES,
  type GoalMarket,
  emergencyFundTarget,
  financialFreedomTarget,
  paceStatus,
  projectionDisplay,
  projectionRange,
  suggestedMonthlyContribution,
  validateGoalDraft,
  yearsToTarget,
} from '../goals';
import { DEFAULT_SPLIT, MONEY_JOBS_MODEL, illustrativeMirror, isValidSplit } from '../jobs';

describe('isValidSplit', () => {
  it('should accept the default and any whole-percent split summing to 100', () => {
    expect(isValidSplit(DEFAULT_SPLIT)).toBe(true);
    expect(isValidSplit({ floorPercent: 0, cushionPercent: 0, workingPercent: 100 })).toBe(true);
  });

  it('should reject sums ≠ 100, negatives, and fractions', () => {
    expect(isValidSplit({ floorPercent: 50, cushionPercent: 30, workingPercent: 30 })).toBe(false);
    expect(isValidSplit({ floorPercent: -10, cushionPercent: 60, workingPercent: 50 })).toBe(false);
    expect(isValidSplit({ floorPercent: 33.5, cushionPercent: 33.5, workingPercent: 33 })).toBe(
      false
    );
  });
});

describe('validateGoalDraft', () => {
  const good = {
    name: 'Recife em dezembro',
    icon: GOAL_ICONS[0],
    targetAmount: 5000,
    horizonMonths: 18,
  };

  it('should accept a well-formed draft', () => {
    expect(validateGoalDraft(good)).toEqual([]);
  });

  it('should reject empty names, unknown icons, non-positive targets, silly horizons', () => {
    expect(validateGoalDraft({ ...good, name: '  ' })).toContain('name_empty');
    expect(validateGoalDraft({ ...good, icon: 'emoji-party' })).toContain('icon_invalid');
    expect(validateGoalDraft({ ...good, targetAmount: 0 })).toContain('target_not_positive');
    expect(validateGoalDraft({ ...good, horizonMonths: 0 })).toContain('horizon_out_of_range');
    expect(validateGoalDraft({ ...good, horizonMonths: 481 })).toContain('horizon_out_of_range');
  });
});

describe('dailyFactorFromApyPercent', () => {
  it('should compound 365 daily factors back to the annual APY', () => {
    const daily = dailyFactorFromApyPercent(6.5);
    const annual = daily.pow(365);
    expect(annual.minus(1).mul(100).toNumber()).toBeCloseTo(6.5, 6);
  });

  it('should return exactly 1 for 0% APY', () => {
    expect(dailyFactorFromApyPercent(0).eq(1)).toBe(true);
  });
});

describe('blendSeries', () => {
  it('should weight legs by allocation percent', () => {
    const a: DailyApySeries = { points: [10, 10, 10], source: 'defillama' };
    const b: DailyApySeries = { points: [2, 2, 2], source: 'defillama' };
    const blended = blendSeries([
      { weightPercent: 50, series: a },
      { weightPercent: 50, series: b },
    ]);
    expect(blended.points).toEqual([6, 6, 6]);
    expect(blended.source).toBe('defillama');
  });

  it('should stamp the blend as fixture when ANY leg is fixture (no silent blending)', () => {
    const real: DailyApySeries = { points: [5], source: 'defillama' };
    const fx: DailyApySeries = { points: [5], source: 'fixture' };
    expect(
      blendSeries([
        { weightPercent: 50, series: real },
        { weightPercent: 50, series: fx },
      ]).source
    ).toBe('fixture');
  });
});

describe('replayEarnings (accuracy vs. a known series — the P.5 gate)', () => {
  it('should equal hand-compounded growth over a flat series', () => {
    const series: DailyApySeries = { points: Array(30).fill(6.5), source: 'defillama' };
    const earnings = replayEarnings(1000, series, 0, 30);
    // Hand computation: 1000 × (1.065)^(30/365) − 1000
    const expected = new Decimal(1000)
      .mul(new Decimal(1.065).pow(new Decimal(30).div(365)))
      .minus(1000);
    expect(earnings.toNumber()).toBeCloseTo(expected.toNumber(), 2);
  });

  it('should replay a varying series day by day (order matters)', () => {
    const series: DailyApySeries = {
      points: [0, 0, (365 * ((1.01 ** 365 - 1) * 100)) / 365],
      source: 'defillama',
    };
    // Simplest observable property: a nonzero final-day APY yields > 0 earnings
    const earnings = replayEarnings(1000, series, 0, 1);
    expect(earnings.toNumber()).toBeGreaterThan(0);
  });

  it('should return zero for a zero-day span', () => {
    const series: DailyApySeries = { points: [8, 8], source: 'defillama' };
    expect(replayEarnings(1000, series, 5, 5).isZero()).toBe(true);
  });

  // C3 A-1: the annuity replay splits a single advance at each deposit day. If a
  // shared anchor is used, the segment slices are contiguous and their union
  // equals the single-call slice, so segmented earnings (WITHOUT deposits) equal
  // single-call earnings exactly. This proves the recurring segmentation is
  // arithmetically neutral on the accrual itself.
  it('should make anchored segments sum to the single-call earnings (no double-count)', () => {
    const series: DailyApySeries = {
      points: Array.from({ length: 90 }, (_, i) => 4 + (i % 7)), // a varying 90-day series
      source: 'defillama',
    };
    const single = replayEarnings(1000, series, 0, 90); // one call, anchor defaults to 90

    // Segment [0,30]+[30,60]+[60,90], every segment anchored to the global toDay=90,
    // compounding the growing value forward (no deposits added between segments).
    let value = new Decimal(1000);
    let summed = new Decimal(0);
    for (const [from, to] of [
      [0, 30],
      [30, 60],
      [60, 90],
    ] as const) {
      const seg = replayEarnings(value, series, from, to, 90);
      summed = summed.plus(seg);
      value = value.plus(seg);
    }
    // Equal to the cent (rounding per-segment introduces at most a cent of drift).
    expect(summed.minus(single).abs().toNumber()).toBeLessThanOrEqual(0.01);
  });

  it('should OVERSTATE if each segment re-anchors to its own end (proves A-1 matters, varying series)', () => {
    // A front-loaded series: high APY in the OLD points, low in the recent ones.
    // The naive path (each segment anchored to its own end) makes both segments
    // re-use the recent LOW tail, so it must differ from the correct single call.
    const points = Array.from({ length: 90 }, (_, i) => (i < 45 ? 20 : 2));
    const series: DailyApySeries = { points, source: 'defillama' };
    const single = replayEarnings(1000, series, 0, 90); // correct: contiguous slice

    let value = new Decimal(1000);
    let naive = new Decimal(0);
    for (const [from, to] of [
      [0, 45],
      [45, 90],
    ] as const) {
      const seg = replayEarnings(value, series, from, to); // anchor defaults to `to` (the BUG for segments)
      naive = naive.plus(seg);
      value = value.plus(seg);
    }
    // The naive segmentation re-anchors both halves to the newest (low) tail, so
    // it does NOT equal the correct single-call earnings — the bug A-1 prevents.
    expect(naive.minus(single).abs().toNumber()).toBeGreaterThan(1);
  });
});

describe('projectionRange + SCENARIO_RATES (C2 honest projection)', () => {
  it('should be the three digital-dollar envelope rates', () => {
    expect(SCENARIO_RATES).toEqual({ conservative: 7, historical: 10, optimistic: 14 });
  });

  it('should return a range where the optimistic edge is fewer years than conservative', () => {
    const range = projectionRange(22320, 600);
    expect(range).not.toBeNull();
    expect(range!.minYears).toBeLessThan(range!.maxYears);
    // minYears uses optimistic (14%), maxYears conservative (7%).
    expect(range!.maxYears).toBeCloseTo(yearsToTarget(22320, 600, 7)!, 5);
    expect(range!.minYears).toBeCloseTo(yearsToTarget(22320, 600, 14)!, 5);
  });

  it('should return null when the contribution or target is non-positive', () => {
    expect(projectionRange(0, 600)).toBeNull();
    expect(projectionRange(1000, 0)).toBeNull();
  });
});

describe('paceStatus (WS-E on-track — compared to the full real-life horizon)', () => {
  it('should be within when both edges land inside the horizon', () => {
    // range 2 to 4 years, horizon 60 months (5y) → within.
    expect(paceStatus({ minYears: 2, maxYears: 4 }, 60)).toBe('within');
  });

  it('should be edge when the horizon falls inside the range', () => {
    // range 2 to 6 years, horizon 48 months (4y) → the horizon splits the range.
    expect(paceStatus({ minYears: 2, maxYears: 6 }, 48)).toBe('edge');
  });

  it('should be beyond when even the fast edge runs longer than the horizon', () => {
    // range 5 to 6 years, horizon 24 months (2y) → beyond.
    expect(paceStatus({ minYears: 5, maxYears: 6 }, 24)).toBe('beyond');
  });

  it('should return null for a null range or non-positive horizon', () => {
    expect(paceStatus(null, 24)).toBeNull();
    expect(paceStatus({ minYears: 2, maxYears: 4 }, 0)).toBeNull();
  });
});

describe('projectionDisplay (CLO board F-CLO-B3 / CC-1: reach line and pace never contradict)', () => {
  it('should reproduce the board R1 case as a consistent "about 2 years", not "2 to 3 / fits inside"', () => {
    // target 15000, initial fund 2000 → remaining 13000, monthly 500, horizon 24mo.
    const d = projectionDisplay(13000, 500, 24)!;
    expect(d.underYear).toBe(false);
    expect(d.single).toBe(true);
    expect(d.minYears).toBe(2);
    // ~2.0y straddling a 24-month horizon → NOT 'beyond', NOT a false 'within'-vs-"3 years".
    expect(d.pace === 'within' || d.pace === 'edge').toBe(true);
  });

  it('should keep displayed years and the pace word consistent across a wide sweep (no rounding-boundary contradiction)', () => {
    for (let t = 1000; t <= 120000; t += 2500) {
      for (let m = 50; m <= 2000; m += 100) {
        for (let h = 1; h <= 360; h += 7) {
          const d = projectionDisplay(t, m, h);
          if (!d || d.underYear) continue; // "within a year" is a coarse, complementary line
          const horizonYears = h / 12;
          // The invariant: 'within' ⇒ the displayed upper bound is within the horizon;
          // 'beyond' ⇒ the displayed lower bound exceeds it. Never contradictory.
          if (d.pace === 'within') {
            expect(d.maxYears, `within@t${t}/m${m}/h${h}`).toBeLessThanOrEqual(horizonYears);
          }
          if (d.pace === 'beyond') {
            expect(d.minYears, `beyond@t${t}/m${m}/h${h}`).toBeGreaterThan(horizonYears);
          }
        }
      }
    }
  });

  it('should return null when the target is unreachable or already met', () => {
    expect(projectionDisplay(0, 500, 24)).toBeNull();
    expect(projectionDisplay(1000, 0, 24)).toBeNull();
  });
});

describe('goal-preset constants (attestation drift guard — SANDBOX_GOAL_CONSTANTS_ATTESTATION.md)', () => {
  const MARKETS: GoalMarket[] = ['US', 'BR', 'DE', 'ES'];

  it('should define an SWR for every market and nothing extra', () => {
    for (const m of MARKETS) expect(FINANCIAL_FREEDOM_SWR[m]).toBeGreaterThan(0);
    expect(Object.keys(FINANCIAL_FREEDOM_SWR).sort()).toEqual([...MARKETS].sort());
  });

  it('should match the attested SWR values exactly (change the doc + this test together)', () => {
    expect(FINANCIAL_FREEDOM_SWR).toEqual({ US: 0.039, BR: 0.04, DE: 0.0325, ES: 0.0325 });
    expect(MONTHLY_INVEST_SHARE).toBe(0.1);
  });

  it('should compute the Financial-Freedom target as income × 12 ÷ SWR, rounded whole', () => {
    // US 3.9%: 6000 × 12 / 0.039 = 1,846,153.85 → 1,846,154
    expect(financialFreedomTarget(6000, 'US')).toBe(1846154);
    // BR 4.0%: 6000 × 12 / 0.04 = 1,800,000 (exact)
    expect(financialFreedomTarget(6000, 'BR')).toBe(1800000);
    // DE/ES 3.25%: 6000 × 12 / 0.0325 = 2,215,384.6 → 2,215,385
    expect(financialFreedomTarget(6000, 'DE')).toBe(2215385);
    expect(financialFreedomTarget(6000, 'ES')).toBe(2215385);
  });

  it('should keep the market multiples in their honest bands (~300× US/BR, ~370× DE/ES)', () => {
    // multiple of monthly income = 12 / SWR
    expect(12 / FINANCIAL_FREEDOM_SWR.US).toBeCloseTo(307.7, 1);
    expect(12 / FINANCIAL_FREEDOM_SWR.BR).toBeCloseTo(300, 1);
    expect(12 / FINANCIAL_FREEDOM_SWR.DE).toBeCloseTo(369.2, 1);
    expect(12 / FINANCIAL_FREEDOM_SWR.ES).toBeCloseTo(369.2, 1);
  });

  it('should compute Emergency-Fund as essentials × 6 (attested cushion, market-aware) + 10% monthly', () => {
    // US essentials share 0.62: 6000 × 0.62 × 6 = 22,320
    expect(emergencyFundTarget(6000, 'US')).toBe(22320);
    // DE essentials share 0.47: 6000 × 0.47 × 6 = 16,920
    expect(emergencyFundTarget(6000, 'DE')).toBe(16920);
    // A user-provided essentials overrides the share: 2000 × 6 = 12,000
    expect(emergencyFundTarget(6000, 'US', 2000)).toBe(12000);
    expect(suggestedMonthlyContribution(6000)).toBe(600);
  });

  it('should return 0 for non-positive or non-finite income (the no-salary sentinel, F-A5)', () => {
    for (const bad of [0, -100, NaN, Infinity]) {
      expect(financialFreedomTarget(bad, 'US')).toBe(0);
      expect(emergencyFundTarget(bad, 'US')).toBe(0);
      expect(suggestedMonthlyContribution(bad)).toBe(0);
    }
  });

  it('should project whole years-to-target (annuity FV, the minimal FF projection)', () => {
    // Financial Freedom: ~$1.85M at $600/mo, 7% → decades (honest)
    expect(yearsToTarget(1846154, 600, 7)).toBeCloseTo(43, 0);
    // Emergency Fund: $22,320 at $600/mo, 7% → a few years
    expect(yearsToTarget(22320, 600, 7)).toBeCloseTo(2.8, 1);
    // 0% growth falls back to linear: 1200 / 100/mo = 12 months = 1 year
    expect(yearsToTarget(1200, 100, 0)).toBeCloseTo(1, 6);
  });

  it('should return null for invalid projection inputs', () => {
    expect(yearsToTarget(0, 600, 7)).toBeNull();
    expect(yearsToTarget(1000, 0, 7)).toBeNull();
    expect(yearsToTarget(1000, -5, 7)).toBeNull();
    expect(yearsToTarget(NaN, 600, 7)).toBeNull();
  });
});

describe('illustrativeMirror (attested Money Jobs model — MONEY_JOBS_CONSTANTS_ATTESTATION.md)', () => {
  it('should match the attested constants exactly (drift guard)', () => {
    expect(MONEY_JOBS_MODEL.essentialsShare).toEqual({ US: 0.62, BR: 0.61, ES: 0.56, DE: 0.47 });
    expect(MONEY_JOBS_MODEL.cushionMonths).toBe(6);
    expect(MONEY_JOBS_MODEL.prudenceFactor).toBe(0.75);
    expect(MONEY_JOBS_MODEL.dignityFloorRatio).toBe(0.05);
  });

  it('should derive Floor/Cushion/Working from income × the market share', () => {
    const m = illustrativeMirror(6000, 'US');
    expect(m).not.toBeNull();
    expect(m!.floor).toBeCloseTo(3720, 6); // 6000 × 0.62
    expect(m!.cushionTarget).toBeCloseTo(22320, 6); // 3720 × 6
    expect(m!.working).toBeCloseTo(2280, 6); // 6000 − 3720
    expect(m!.workingIdeal).toBeCloseTo(1710, 6); // 2280 × 0.75
    expect(m!.dignityState).toBe(false);
    expect(m!.essentialsAssumed).toBe(true);
  });

  it('should enter the dignity state and zero Working when surplus ≤ 5% of income', () => {
    // essentials 5800 on income 6000 → surplus 200 = 3.3% < 5% → dignity
    const m = illustrativeMirror(6000, 'US', { essentials: 5800 });
    expect(m!.dignityState).toBe(true);
    expect(m!.working).toBe(0);
    expect(m!.workingIdeal).toBe(0);
    expect(m!.essentialsAssumed).toBe(false);
  });

  it('should return null for invalid income', () => {
    for (const bad of [0, -1, NaN, Infinity]) expect(illustrativeMirror(bad, 'US')).toBeNull();
  });
});
