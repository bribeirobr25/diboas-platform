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

const DAYS_PER_YEAR = 365;

/** Geometric daily growth factor from an annual APY percent. */
export function dailyFactorFromApyPercent(apyPercent: Decimal.Value): Decimal {
  const annual = new Decimal(apyPercent).div(100).plus(1);
  // (1 + apy)^(1/365)
  return annual.pow(new Decimal(1).div(DAYS_PER_YEAR));
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
  // Composed over the leg primitives rather than repeating their compounding
  // loop (§4.8, Principle 4): one lending leg at 100% IS this function. Keeping
  // a second loop here would let the two paths drift apart silently — the exact
  // failure the §3 shared-mapping discipline exists to prevent.
  return replayLegged(principal, [
    { weightPercent: 100, factors: apyFactorsForSpan(series, fromDay, toDay, anchorDay) },
  ]);
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
 * UNION of dates (not index-from-end like the replay's factor mapping): each
 * leg carries its last known reading forward across days
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

/** A daily closing-price series for a `market` leg, oldest → newest. */
export interface DailyPriceSeries {
  points: number[];
  source: 'coingecko' | 'fixture';
}

/**
 * The per-day PRICE growth factors a replay of `(fromDay, toDay]` uses.
 *
 * Deliberately mirrors `ratesForSpan` day-for-day — same `anchorDay` contract,
 * same index mapping. That is load-bearing, not stylistic: `advancePlanner`
 * replays SEGMENTED (one segment per recurring deposit), and if each segment
 * re-anchored its own end to the newest price, the segments' windows would
 * overlap and price movement would be counted twice — the identical hazard the
 * APY path documents at `replayEarnings`. Sharing the mapping makes the
 * segmented replay equal the single-call replay by construction.
 *
 * Each factor is `price[day] / price[day-1]`, so multiplying the span's factors
 * yields exactly `price[toDay] / price[fromDay]`.
 */
export function priceFactorsForSpan(
  series: DailyPriceSeries,
  fromDay: number,
  toDay: number,
  anchorDay: number = toDay
): number[] {
  const n = series.points.length;
  const at = (day: number) => {
    const idx = Math.max(0, Math.min(n - 1, n - 1 - (anchorDay - day)));
    return series.points[idx] ?? 0;
  };
  const factors: number[] = [];
  for (let day = fromDay + 1; day <= toDay; day += 1) {
    const prev = at(day - 1);
    const curr = at(day);
    factors.push(prev > 0 ? curr / prev : 1);
  }
  return factors;
}

/**
 * One allocation leg's replay input: its weight, and the per-day growth factors
 * for the span — whatever kind of leg produced them.
 *
 * Unifying both kinds as FACTORS is what lets one strategy hold a lending leg
 * and a market leg at once: a lending day contributes `(1+apy)^(1/365)`, a
 * market day contributes `price[d]/price[d-1]`, and each leg compounds on its
 * own share of the principal.
 */
export interface LegReplay {
  weightPercent: number;
  factors: number[];
}

/** Daily growth factors from an APY series — the `lending` counterpart. */
export function apyFactorsForSpan(
  series: DailyApySeries,
  fromDay: number,
  toDay: number,
  anchorDay: number = toDay
): number[] {
  return ratesForSpan(series, fromDay, toDay, anchorDay).map((r) =>
    dailyFactorFromApyPercent(r).toNumber()
  );
}

/**
 * Replay a position whose legs may be of MIXED kinds, returning the earnings
 * (signed — this is the function that can finally return a LOSS).
 *
 * Each leg compounds independently on its weighted share of the principal:
 *   earnings = Σ_legs [ principal × weight × (Π factors − 1) ]
 *
 * A `market` leg's factors already contain everything the token returned, so
 * nothing is added on top of them — an LST's price drift IS the yield
 * DeFiLlama reports as its APY, and replaying both would count it twice.
 */
export function replayLegged(principal: Decimal.Value, legs: LegReplay[]): Decimal {
  const start = new Decimal(principal);
  let end = new Decimal(0);
  for (const leg of legs) {
    const share = start.mul(leg.weightPercent).div(100);
    const grown = leg.factors.reduce((acc, f) => acc.mul(f), share);
    end = end.plus(grown);
  }
  return end.minus(start).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
