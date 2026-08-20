/**
 * Accrual replay — play positions marked against REAL pool APY series
 * ("would have" framing by construction: the series is history, never a
 * forecast). Decimal.js end to end.
 *
 * Model: a strategy is a weighted blend of protocol pools (the catalog's
 * allocation legs). For each simulated day we take that day's blended APY
 * (daily-compounded) and grow the position: the same arithmetic the tools
 * suite uses (geometric daily rate from an annual percentage).
 *
 * Series alignment: sim day N maps to the APY point N days back from the
 * series end walking forward — i.e. advancing the time machine one week
 * replays the most recent real week of pool history onto the position.
 */

import Decimal from 'decimal.js';

export interface DailyApySeries {
  /** APY percent per day, oldest → newest (one entry per day). */
  points: number[];
  source: 'defillama' | 'fixture';
}

export interface BlendLeg {
  weightPercent: number;
  series: DailyApySeries;
}

const DAYS_PER_YEAR = 365;

/** Geometric daily growth factor from an annual APY percent. */
export function dailyFactorFromApyPercent(apyPercent: Decimal.Value): Decimal {
  const annual = new Decimal(apyPercent).div(100).plus(1);
  // (1 + apy)^(1/365)
  return annual.pow(new Decimal(1).div(DAYS_PER_YEAR));
}

/**
 * Blend leg series into one daily APY series by allocation weight.
 * Shorter series forward-fill their last value (honest approximation for
 * missing days; the stamp downgrade below records if ANY leg was fixture).
 */
export function blendSeries(legs: BlendLeg[]): DailyApySeries {
  const length = Math.max(...legs.map((l) => l.series.points.length));
  const points: number[] = [];
  for (let i = 0; i < length; i += 1) {
    let blended = new Decimal(0);
    for (const leg of legs) {
      const pts = leg.series.points;
      const idxFromEnd = length - 1 - i;
      const legIdx = pts.length - 1 - idxFromEnd;
      const value = pts[Math.max(0, Math.min(pts.length - 1, legIdx))] ?? 0;
      blended = blended.plus(new Decimal(value).mul(leg.weightPercent).div(100));
    }
    points.push(blended.toNumber());
  }
  const source = legs.every((l) => l.series.source === 'defillama') ? 'defillama' : 'fixture';
  return { points, source };
}

/**
 * The exact daily APY percents a replay of `(fromDay, toDay]` uses, in day
 * order (§3 rate-pinning, board §3.7). ONE mapping shared by `replayEarnings`
 * and the event pinning — so the rates stamped into `AccrualApplied.ratesUsed`
 * are the rates that produced the earnings BY CONSTRUCTION, never a parallel
 * computation that could drift. Same `anchorDay` contract as `replayEarnings`.
 */
export function ratesForSpan(
  series: DailyApySeries,
  fromDay: number,
  toDay: number,
  anchorDay: number = toDay
): number[] {
  const rates: number[] = [];
  const n = series.points.length;
  for (let day = fromDay + 1; day <= toDay; day += 1) {
    // Map sim day → series index so that `anchorDay` lands on the newest point
    // and each earlier day steps one point back (contiguous across segments).
    const idx = Math.max(0, Math.min(n - 1, n - 1 - (anchorDay - day)));
    rates.push(series.points[idx] ?? 0);
  }
  return rates;
}

/**
 * Replay earnings on a principal from simDay `fromDay` (exclusive) to `toDay`
 * (inclusive), using the blended series aligned so that the series' newest
 * point maps to `anchorDay`. Returns the earnings (can only be ≥0 for
 * lending-style APY series; growth-asset drawdowns arrive with the Stage-1
 * price overlay).
 *
 * `anchorDay` (default `toDay`) fixes which sim day lands on the newest series
 * point. When a single advance is replayed in one call, `anchorDay === toDay`
 * (the whole span ends on the newest real day). When the advance is SEGMENTED
 * — the recurring-contribution annuity replay splits `[cursor, toDay]` at each
 * monthly deposit so contributions compound from their own day — every segment
 * must pass the advance's GLOBAL `toDay` as `anchorDay`. Otherwise each segment
 * would re-anchor its own end to the newest point, overlapping slices and
 * double-counting recent returns. With a shared anchor, the segment slices are
 * contiguous and their union is identical to the single-call slice (proven by
 * the equivalence test).
 */
export function replayEarnings(
  principal: Decimal.Value,
  series: DailyApySeries,
  fromDay: number,
  toDay: number,
  anchorDay: number = toDay
): Decimal {
  let value = new Decimal(principal);
  const start = new Decimal(principal);
  for (const rate of ratesForSpan(series, fromDay, toDay, anchorDay)) {
    value = value.mul(dailyFactorFromApyPercent(rate));
  }
  return value.minus(start).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** One dated APY reading (day precision) — the chart's honest unit. */
export interface DatedApyPoint {
  date: string;
  apyPercent: number;
}

export interface DatedBlendLeg {
  weightPercent: number;
  points: DatedApyPoint[];
}

/**
 * Blend dated per-protocol histories into one weighted series, aligned on the
 * UNION of dates (not index-from-end like `blendSeries`, which serves the
 * replay engine): each leg carries its last known reading forward across days
 * it lacks, and days before a leg's first reading use that leg's first value.
 * Honest for a chart — every plotted day is a real weighted reading of real
 * history, never interpolated fiction. Ascending by date.
 */
export function blendDatedSeries(legs: DatedBlendLeg[]): DatedApyPoint[] {
  const dates = [...new Set(legs.flatMap((l) => l.points.map((p) => p.date)))].sort();
  const cursors = legs.map(() => 0);
  return dates.map((date) => {
    let blended = 0;
    legs.forEach((leg, i) => {
      if (leg.points.length === 0) return;
      while (cursors[i] + 1 < leg.points.length && leg.points[cursors[i] + 1].date <= date) {
        cursors[i] += 1;
      }
      const value = leg.points[cursors[i]].apyPercent;
      blended += (value * leg.weightPercent) / 100;
    });
    return { date, apyPercent: blended };
  });
}
