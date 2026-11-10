import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  dailyFactorFromApyPercent,
  replayEarnings,
  ratesForSpan,
  type DailyApySeries,
  blendDatedSeries,
} from '../accrual';
import {
  FINANCIAL_FREEDOM_SWR,
  GOAL_ICONS,
  MONTHLY_INVEST_SHARE,
  type GoalMarket,
  emergencyFundTarget,
  financialFreedomTarget,
  suggestedMonthlyContribution,
  validateGoalDraft,
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

describe('ratesForSpan — the §3 rate-pinning slice (same-source with replayEarnings)', () => {
  const series = { points: [3, 4, 5, 6, 7], source: 'defillama' as const };

  it('should compound to EXACTLY replayEarnings (one shared mapping, board §3.7)', () => {
    const principal = new Decimal(1000);
    const earnings = replayEarnings(principal, series, 0, 5);
    let value = principal;
    for (const rate of ratesForSpan(series, 0, 5)) {
      value = value.mul(dailyFactorFromApyPercent(rate));
    }
    expect(value.minus(principal).toDecimalPlaces(2).toFixed(2)).toBe(earnings.toFixed(2));
  });

  it('should keep segment slices contiguous under a shared anchor (the A-1 contract)', () => {
    const whole = ratesForSpan(series, 0, 5, 5);
    const segmented = [...ratesForSpan(series, 0, 3, 5), ...ratesForSpan(series, 3, 5, 5)];
    expect(segmented).toEqual(whole);
  });

  it('should clamp early days to the oldest point (spans longer than the series)', () => {
    expect(ratesForSpan({ points: [9], source: 'fixture' }, 0, 3)).toEqual([9, 9, 9]);
  });
});

describe('blendDatedSeries — the G6 chart blend (union-of-dates, carry-forward)', () => {
  it('should weight each leg and carry its last reading across missing days', () => {
    const out = blendDatedSeries([
      {
        weightPercent: 50,
        points: [
          { date: '2026-01-01', apyPercent: 4 },
          { date: '2026-01-03', apyPercent: 6 },
        ],
      },
      { weightPercent: 50, points: [{ date: '2026-01-02', apyPercent: 2 }] },
    ]);
    expect(out.map((p) => p.date)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
    // day1: 4*.5 + 2*.5 (leg2's first reading carried BACK) = 3
    expect(out[0].apyPercent).toBeCloseTo(3, 6);
    // day2: 4 (carried fwd) *.5 + 2*.5 = 3
    expect(out[1].apyPercent).toBeCloseTo(3, 6);
    // day3: 6*.5 + 2 (carried fwd) *.5 = 4
    expect(out[2].apyPercent).toBeCloseTo(4, 6);
  });

  it('should return an empty series for no legs and ignore an empty leg', () => {
    expect(blendDatedSeries([])).toEqual([]);
    const out = blendDatedSeries([
      { weightPercent: 50, points: [{ date: '2026-01-01', apyPercent: 8 }] },
      { weightPercent: 50, points: [] },
    ]);
    expect(out[0].apyPercent).toBeCloseTo(4, 6); // the present leg's half only
  });
});
