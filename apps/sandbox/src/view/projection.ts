/**
 * PR 2 · the goal projection, routed and worked out (VIEW-1: pure — the months left and the rate
 * ranges are passed in; no fetch, no clock, no formatting, no ledger write).
 *
 * Authority: private docs `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md` §1–§2; the text
 * the founder approved (v2, `decisions/DR-2026-11-05-pr2-wording-approval.md`); the founder's
 * 2026-11-06 pace ruling ("never false").
 *
 * Routing order: none → U → 3 → 2 → 1. Every "none" that can be decided WITHOUT the rates is
 * decided first, so the screen never fetches for, or announces, a block that would be empty
 * (`selectProjectionCanShow` asks this same routing with no rates).
 *   1 · every open position stable, the range available → the goal's own range.
 *   2 · no open position → a simulation at the stable aggregate (needed / up to / already enough).
 *   3 · any open position growth-exposed → the growth note + the simulation.
 *   U · a needed range (or, in Case 1, today's rate) unavailable → no numbers.
 * Lines that need months left (needed, pace) are dropped — never the whole block — when months
 * left are 0 or unknown; Case 2 then has nothing to say, so it is none.
 * CI-N3 (LC-RR-01-12): the only money this seam emits is a `ModelledAmount` — a whole-unit string
 * under a type no balance, command or goal completion accepts; the component formats it.
 */
import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';
import { STRATEGY_CATALOG } from '@diboas/defi';
import {
  GOAL_HORIZON_MAX_MONTHS,
  PROJECTION_POLICY,
  monthlyNeeded,
  monthsToTarget,
  rangeSpan,
  windowMonths,
} from '@diboas/investing';
import { positionCurrentValue } from '@/lib/goalValue';
import type { RateRangesPayload, StrategyRateRange } from '@/lib/rateRangesContract';
import { selectRecurringView } from './home';

/** A modelled amount: whole units, for display only. Not a number, so it cannot be booked (CI-N3). */
export interface ModelledAmount {
  readonly kind: 'modelled';
  /** Whole currency units as a string (`PROJECTION_POLICY.moneyDecimals` = 0), e.g. "204". */
  readonly amount: string;
}

export type Pace = 'within' | 'edge' | 'beyond';

export type When =
  | { kind: 'underYear' }
  | { kind: 'single'; years: number }
  | { kind: 'range'; minYears: number; maxYears: number }
  /** Beyond the longest goal horizon: "in more than {years} years", a true lower bound (5.804). */
  | { kind: 'overCap'; years: number }
  /** The fast end within a year, the slow end beyond the horizon: "anywhere from within a year
   *  to more than {years} years" — `years` is the horizon (8th audit: "more than 1 year" was false). */
  | { kind: 'underYearToOverCap'; years: number };

export interface RangeLine {
  lowPercent: number;
  highPercent: number;
  windowMonths: number;
}

export type SimulatedLine =
  | {
      kind: 'needed';
      amounts: ModelledAmount | { min: ModelledAmount; max: ModelledAmount };
      monthsLeft: number;
    }
  | { kind: 'neededUpTo'; max: ModelledAmount; monthsLeft: number }
  | { kind: 'alreadyEnough'; monthsLeft: number }
  | { kind: 'withPlan'; amount: ModelledAmount; when: When };

export type ProjectionView =
  | { kind: 'none' }
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | {
      kind: 'live';
      withPlan: ModelledAmount | null;
      when: When;
      range: RangeLine;
      today:
        | { kind: 'single'; ratePercent: number; asOf: string }
        | { kind: 'range'; lowPercent: number; highPercent: number; asOf: string };
      pace: { status: Pace; monthsLeft: number } | null;
    }
  | {
      kind: 'simulated';
      growthNote: boolean;
      range: RangeLine;
      /** null only in Case 3 without a plan when months left are 0 or unknown (P3 §1). */
      line: SimulatedLine | null;
    };

export interface ProjectionInput {
  status: 'active' | 'paused' | 'dropped' | 'accomplished';
  target: number;
  goalCash: number;
  /** Open positions of this goal: strategy and current value (principal + accrued). */
  positions: ReadonlyArray<{ strategyId: string; value: number }>;
  /** The goal's monthly plan — 0 unless the goal is active and Available > 0 (P3 §2). */
  monthlyPlan: number;
  /** Months left in the goal's frame (`lib/goalMonths.ts`); null → the lines needing it drop. */
  monthsLeft: number | null;
  /** null = still loading (or not asked for); 'error' = the fetch failed. */
  ranges: RateRangesPayload | null | 'error';
}

const modelled = (n: number): ModelledAmount => ({
  kind: 'modelled',
  amount: Math.round(n).toFixed(PROJECTION_POLICY.moneyDecimals),
});

/** A positive amount still NEEDED never reads as nothing: at least one whole unit (7th audit). */
const needed = (n: number): ModelledAmount => modelled(Math.max(1, n));

/** One amount, or a range when the two ends differ in whole units (never a range whose ends match). */
function amounts(minAmount: number, maxAmount: number) {
  const lo = needed(minAmount);
  const hi = needed(maxAmount);
  return lo.amount === hi.amount ? hi : { min: lo, max: hi };
}

/**
 * Whole years as today's projection rounds them (min 1; under a year is its own line). Past the
 * longest horizon a goal can have (`GOAL_HORIZON_MAX_MONTHS`, 40 years), the line states a lower
 * bound instead — the fast end's whole years, never more than 40 (founder 2026-11-06, 5.804).
 */
export function whenOf(minMonths: number, maxMonths: number): When {
  if (maxMonths > GOAL_HORIZON_MAX_MONTHS) {
    const capYears = GOAL_HORIZON_MAX_MONTHS / 12;
    // The largest whole N with N years STRICTLY before the fast end, so "more than N years" is
    // true even at exactly 12·k months (8th audit). Fast end within a year: no N exists.
    const lowerBound = Math.ceil(minMonths / 12) - 1;
    return lowerBound < 1
      ? { kind: 'underYearToOverCap', years: capYears }
      : { kind: 'overCap', years: Math.min(capYears, lowerBound) };
  }
  if (maxMonths / 12 < 1) return { kind: 'underYear' };
  const minYears = Math.max(1, Math.round(minMonths / 12));
  const maxYears = Math.max(1, Math.round(maxMonths / 12));
  return minYears === maxYears
    ? { kind: 'single', years: minYears }
    : { kind: 'range', minYears, maxYears };
}

const statusOf = (lo: number, hi: number, left: number): Pace =>
  hi <= left ? 'within' : lo <= left ? 'edge' : 'beyond';

/**
 * Pace against the months left — NEVER FALSE (founder 2026-11-06). The verdict is decided on the
 * real months; where it disagrees with the rounded years the line shows, it is "edge" ("lands
 * around"), so the sentence is always true and never contradicts the years beside it.
 */
function paceOf(when: When, fast: number, slow: number, left: number | null) {
  if (left === null || !(left > 0)) return null;
  const real = statusOf(fast, slow, left);
  const shown =
    when.kind === 'underYear' || when.kind === 'overCap' || when.kind === 'underYearToOverCap'
      ? real
      : when.kind === 'single'
        ? statusOf(when.years * 12, when.years * 12, left)
        : statusOf(when.minYears * 12, when.maxYears * 12, left);
  const status: Pace = real === shown ? real : 'edge';
  return { status, monthsLeft: left };
}

/** An unknown strategy is treated as growth-exposed: no rate may be stated for it. */
const isGrowth = (strategyId: string) =>
  (STRATEGY_CATALOG.find((s) => s.id === strategyId)?.growthExposurePercent ?? 1) > 0;

export function selectGoalProjection(input: ProjectionInput): ProjectionView {
  const invested = input.positions.reduce((a, p) => a + p.value, 0);
  const value = input.goalCash + invested;
  const left =
    input.monthsLeft !== null && Number.isFinite(input.monthsLeft) ? input.monthsLeft : null;
  const hasLeft = left !== null && left > 0;
  // A plan under one whole unit cannot be stated (it would read as zero); it counts as no plan.
  const plan =
    Number.isFinite(input.monthlyPlan) && input.monthlyPlan >= 0.5 ? input.monthlyPlan : 0;
  const growth = input.positions.some((p) => isGrowth(p.strategyId));

  // ── none, decided before any rate ──
  if (!(input.target > 0) || !(value < input.target) || input.status !== 'active')
    return { kind: 'none' };
  if (input.positions.length === 0 && !hasLeft) return { kind: 'none' }; // Case 2: nothing to say
  if (input.positions.length > 0 && !growth && !(invested > 0) && plan === 0)
    return { kind: 'none' }; // Case 1: nothing grows toward it

  // ── U ──
  if (input.ranges === null) return { kind: 'loading' };
  if (input.ranges === 'error') return { kind: 'unavailable' };
  const ranges = input.ranges;

  // ── Cases 3 and 2: the simulation at the stable aggregate ──
  if (input.positions.length === 0 || growth) {
    const agg = ranges.aggregate;
    if (!agg.available) return { kind: 'unavailable' };
    const range: RangeLine = {
      lowPercent: agg.lowPercent as number,
      highPercent: agg.highPercent as number,
      windowMonths: windowMonths(agg.observedDays as number),
    };
    if (growth && plan > 0) {
      const at = (a: number) =>
        monthsToTarget({
          goalCash: 0,
          investedValue: value,
          monthly: plan,
          annualPercent: a,
          target: input.target,
        });
      const slow = at(range.lowPercent);
      const fast = at(range.highPercent);
      if (slow === null || fast === null) return { kind: 'none' };
      return {
        kind: 'simulated',
        growthNote: true,
        range,
        line: { kind: 'withPlan', amount: modelled(plan), when: whenOf(fast, slow) },
      };
    }
    // Case 3 without a plan and no months left: the needed line drops, the block stands.
    if (!hasLeft) return { kind: 'simulated', growthNote: true, range, line: null };
    const months = left as number;
    const atLow = monthlyNeeded({
      value,
      target: input.target,
      months,
      annualPercent: range.lowPercent,
    }) as number;
    const atHigh = monthlyNeeded({
      value,
      target: input.target,
      months,
      annualPercent: range.highPercent,
    }) as number;
    const line: SimulatedLine =
      atLow === 0
        ? { kind: 'alreadyEnough', monthsLeft: months }
        : Math.round(atHigh) === 0
          ? { kind: 'neededUpTo', max: needed(atLow), monthsLeft: months }
          : { kind: 'needed', amounts: amounts(atHigh, atLow), monthsLeft: months };
    return { kind: 'simulated', growthNote: growth, range, line };
  }

  // ── Case 1: the goal's own stable strategies ──
  const own = [...new Set(input.positions.map((p) => p.strategyId))].map((id) =>
    ranges.strategies.find((s) => s.strategyId === id)
  );
  if (own.some((s) => !s || !s.available)) return { kind: 'unavailable' };
  const ok = own as Array<Extract<StrategyRateRange, { available: true }>>;
  const span = rangeSpan(ok) as NonNullable<ReturnType<typeof rangeSpan>>;
  const range: RangeLine = {
    lowPercent: span.lowPercent,
    highPercent: span.highPercent,
    windowMonths: windowMonths(span.observedDays),
  };
  const asOf = ok.map((s) => s.oldestLegAsOf).sort()[0];
  const todays = ok.map((s) => s.todayPercent);
  const today =
    ok.length === 1
      ? ({ kind: 'single', ratePercent: todays[0], asOf } as const)
      : ({
          kind: 'range',
          lowPercent: Math.min(...todays),
          highPercent: Math.max(...todays),
          asOf,
        } as const);
  const at = (a: number) =>
    monthsToTarget({
      goalCash: input.goalCash,
      investedValue: invested,
      monthly: plan,
      annualPercent: a,
      target: input.target,
    });
  const slow = at(range.lowPercent);
  const fast = at(range.highPercent);
  if (slow === null || fast === null) return { kind: 'none' }; // nothing grows toward it
  const when = whenOf(fast, slow);
  return {
    kind: 'live',
    withPlan: plan > 0 ? modelled(plan) : null,
    when,
    range,
    today,
    pace: plan > 0 ? paceOf(when, fast, slow, left) : null,
  };
}

/**
 * The block for one goal, from the ledger: open positions at their current value
 * (`positionCurrentValue`, the term `goalCurrentValue` sums), the goal's cash, and the monthly
 * plan — counted only while the goal is active and Available > 0 (`selectRecurringView`, the
 * same rule the recurring control shows; P3 §2).
 */
export function selectGoalProjectionFor(
  state: LedgerState,
  goalId: string,
  monthsLeft: number | null,
  ranges: RateRangesPayload | null | 'error'
): ProjectionView {
  const goal = state.goals.find((g) => g.goalId === goalId);
  if (!goal) return { kind: 'none' };
  const monthly = state.recurring
    .filter((r) => r.goalId === goalId)
    .reduce((acc, r) => acc.plus(r.monthlyAmount), new Decimal(0));
  const funded = !selectRecurringView({
    workingBalance: state.buckets.working,
    hasSchedule: monthly.gt(0),
  }).paused;
  return selectGoalProjection({
    status: goal.status,
    target: new Decimal(goal.targetAmount).toNumber(),
    goalCash: new Decimal(goal.cash).toNumber(),
    positions: state.positions
      .filter((p) => p.goalId === goalId && p.open)
      .map((p) => ({ strategyId: p.strategyId, value: positionCurrentValue(p).toNumber() })),
    monthlyPlan: goal.status === 'active' && funded ? monthly.toNumber() : 0,
    monthsLeft,
    ranges,
  });
}

/**
 * Whether the goal's block can show anything — the screen's gate on fetching the rates. It is the
 * SAME routing asked without rates: "none" before the rates means there is nothing to fetch for.
 */
export function selectProjectionCanShow(
  state: LedgerState,
  goalId: string,
  monthsLeft: number | null
): boolean {
  return selectGoalProjectionFor(state, goalId, monthsLeft, null).kind !== 'none';
}
