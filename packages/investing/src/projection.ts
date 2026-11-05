/**
 * The goal projection from OBSERVED pool rates (PR 2 · register 5.278 / 5.211 / 5.460).
 *
 * Authority: private docs `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md` §2 (the single
 * authority for PR 2), the founder's approval of the five parameters and the v2 wording
 * (`decisions/DR-2026-11-05-pr2-wording-approval.md`, `DR-2026-11-05-audit6-answers.md`), and the
 * measurement `MEASUREMENT_PR2_RATES_2026-11-05.md` whose analysis script these rules mirror.
 *
 * Pure maths only: no fetch, no clock, no ledger. What reaches a screen is decided by the
 * sandbox selector; a modelled amount never enters a balance, command or goal completion (CI-N3).
 */
import Decimal from 'decimal.js';

/** The five parameters the founder approved (2026-11-05), in ONE place, pinned by a test. */
export const PROJECTION_POLICY = {
  /** A rate is a 30-day average of daily observed values. */
  averagingDays: 30,
  /** Only points dated within the last 365 days count. */
  historyDays: 365,
  /** A strategy's legs must overlap for at least 90 observed days, else "can't be read". */
  minOverlapDays: 90,
  /** Rates are shown to 1 decimal, always — a whole number keeps its ".0". */
  rateDecimals: 1,
  /** Money is shown in whole units. */
  moneyDecimals: 0,
} as const;

/** A daily observed value, keyed by its UTC day `YYYY-MM-DD`. */
export type DailySeries = ReadonlyMap<string, number>;

const DAY_MS = 86_400_000;
const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;

/**
 * A strategy's daily series: the weighted sum of its legs on the days EVERY leg has a value
 * (weights are the catalogue's fractions; a day any leg lacks is not a strategy day).
 */
export function weightedSeries(
  legs: ReadonlyArray<{ weight: number; series: DailySeries }>
): Map<string, number> {
  const out = new Map<string, number>();
  if (legs.length === 0) return out;
  for (const day of legs[0].series.keys()) {
    let sum = new Decimal(0);
    let complete = true;
    for (const leg of legs) {
      const v = leg.series.get(day);
      if (v === undefined || !Number.isFinite(v)) {
        complete = false;
        break;
      }
      sum = sum.plus(new Decimal(v).times(leg.weight));
    }
    if (complete) out.set(day, sum.toNumber());
  }
  return out;
}

export interface RateRange {
  /** Lowest and highest 30-day average, percent a year (unrounded). */
  lowPercent: number;
  highPercent: number;
  /** First and last day of the observed history used. */
  windowStart: string;
  windowEnd: string;
  /** Observed days used. */
  observedDays: number;
}

/**
 * The range of a series' 30-day averages over its observed history inside
 * `[asOf − historyDays, asOf]`. An average needs `averagingDays` CONSECUTIVE observed days; a
 * gap restarts it. Returns null when fewer than `minOverlapDays` days are observed or no
 * average can be formed — the block then says the rates can't be read (Case U).
 */
export function rollingAverageRange(
  series: DailySeries,
  asOf: string,
  policy: Pick<
    typeof PROJECTION_POLICY,
    'averagingDays' | 'historyDays' | 'minOverlapDays'
  > = PROJECTION_POLICY
): RateRange | null {
  const end = dayNumber(asOf);
  const start = end - policy.historyDays;
  const days = [...series.keys()]
    .filter((d) => {
      const n = dayNumber(d);
      return Number.isFinite(n) && n >= start && n <= end && Number.isFinite(series.get(d));
    })
    .sort();
  if (days.length < policy.minOverlapDays) return null;
  const w = policy.averagingDays;
  let low: Decimal | null = null;
  let high: Decimal | null = null;
  for (let i = w - 1; i < days.length; i++) {
    if (dayNumber(days[i]) - dayNumber(days[i - w + 1]) !== w - 1) continue; // not consecutive
    let sum = new Decimal(0);
    for (let j = i - w + 1; j <= i; j++) sum = sum.plus(series.get(days[j]) as number);
    const avg = sum.div(w);
    if (low === null || avg.lt(low)) low = avg;
    if (high === null || avg.gt(high)) high = avg;
  }
  if (low === null || high === null) return null;
  return {
    lowPercent: low.toNumber(),
    highPercent: high.toNumber(),
    windowStart: days[0],
    windowEnd: days[days.length - 1],
    observedDays: days.length,
  };
}

/** Whole months covered by an observed window, as the copy states it (`{window}`). */
export function windowMonths(observedDays: number): number {
  return Math.floor(observedDays / 30);
}

/** The effective monthly rate of a yearly nominal rate in percent: (1 + a)^(1/12) − 1. */
function monthlyRate(annualPercent: number): Decimal {
  return new Decimal(1)
    .plus(new Decimal(annualPercent).div(100))
    .pow(new Decimal(1).div(12))
    .minus(1);
}

/**
 * Months until `target` is reached when money in a strategy (`investedValue`) and each added
 * `monthly` amount grow at `annualPercent`, while cash outside a strategy (`goalCash`) stays as
 * it is. Closed form: x = ((T − C) + P/r) / (V + P/r), n = ln x / ln(1 + r); r = 0 is linear.
 * Returns 0 when already reached, null when nothing grows toward it (no value and no monthly
 * amount, or a rate that cannot reach it).
 */
export function monthsToTarget(input: {
  goalCash: number;
  investedValue: number;
  monthly: number;
  annualPercent: number;
  target: number;
}): number | null {
  const C = new Decimal(Math.max(0, input.goalCash));
  const V = new Decimal(Math.max(0, input.investedValue));
  const P = new Decimal(Math.max(0, input.monthly));
  const T = new Decimal(input.target);
  if (!T.isFinite() || T.lte(0)) return null;
  const gap = T.minus(C);
  if (gap.lte(V)) return 0;
  if (input.annualPercent < 0 || !Number.isFinite(input.annualPercent)) return null;
  const r = monthlyRate(input.annualPercent);
  if (r.isZero()) {
    if (P.isZero()) return null;
    return gap.minus(V).div(P).toNumber();
  }
  const pOverR = P.div(r);
  const denominator = V.plus(pOverR);
  if (denominator.lte(0)) return null;
  const x = gap.plus(pOverR).div(denominator);
  if (x.lte(1)) return 0;
  return x.ln().div(new Decimal(1).plus(r).ln()).toNumber();
}

/**
 * The monthly amount that reaches `target` in `months` when everything (`value`) grows at
 * `annualPercent`: P = (T − V(1 + r)^n) · r / ((1 + r)^n − 1); r = 0 is linear. Returns 0 when
 * `value` already reaches it (the "already enough" line), null for no months left.
 */
export function monthlyNeeded(input: {
  value: number;
  target: number;
  months: number;
  annualPercent: number;
}): number | null {
  if (!(input.months > 0) || !Number.isFinite(input.months)) return null;
  const V = new Decimal(Math.max(0, input.value));
  const T = new Decimal(input.target);
  const n = new Decimal(input.months);
  if (input.annualPercent < 0 || !Number.isFinite(input.annualPercent)) return null;
  const r = monthlyRate(input.annualPercent);
  if (r.isZero()) {
    const p = T.minus(V).div(n);
    return p.lte(0) ? 0 : p.toNumber();
  }
  const growth = new Decimal(1).plus(r).pow(n);
  const remaining = T.minus(V.times(growth));
  if (remaining.lte(0)) return 0;
  return remaining.times(r).div(growth.minus(1)).toNumber();
}
