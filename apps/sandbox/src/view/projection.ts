/**
 * PR 2 · the goal projection, routed and worked out (VIEW-1: pure — the months left and the rate
 * ranges are passed in; no fetch, no clock, no formatting, no ledger write).
 *
 * Authority: private docs `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md` §1–§2; the text
 * the founder approved (v2, `decisions/DR-2026-11-05-pr2-wording-approval.md`).
 *
 * Routing order: none → U → 3 → 2 → 1.
 *   1 · every open position stable, the range available → the goal's own range.
 *   2 · no open position → a simulation at the stable aggregate (needed / up to / already enough).
 *   3 · any open position growth-exposed → the growth note + the simulation.
 *   U · a needed range (or, in Case 1, today's rate) unavailable → no numbers.
 * CI-N3 (LC-RR-01-12): the only money this seam emits is a `ModelledAmount` — a whole-unit string
 * under a type no balance, command or goal completion accepts; the component formats it.
 */
import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';
import { STRATEGY_CATALOG } from '@diboas/defi';
import { PROJECTION_POLICY, monthlyNeeded, monthsToTarget, windowMonths } from '@diboas/investing';
import { goalCurrentValue } from '@/lib/goalValue';
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
  | { kind: 'range'; minYears: number; maxYears: number };

export interface RangeLine {
  lowPercent: number;
  highPercent: number;
  windowMonths: number;
}

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
      line:
        | {
            kind: 'needed';
            amounts: ModelledAmount | { min: ModelledAmount; max: ModelledAmount };
            monthsLeft: number;
          }
        | { kind: 'neededUpTo'; max: ModelledAmount; monthsLeft: number }
        | { kind: 'alreadyEnough'; monthsLeft: number }
        | { kind: 'withPlan'; amount: ModelledAmount; when: When };
      pace: { status: Pace; monthsLeft: number } | null;
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
  /** null = still loading; 'error' = the fetch failed. */
  ranges: RateRangesPayload | null | 'error';
}

const modelled = (n: number): ModelledAmount => ({
  kind: 'modelled',
  amount: Math.round(n).toFixed(PROJECTION_POLICY.moneyDecimals),
});

/** Whole years as today's projection rounds them (min 1; under a year is its own line). */
function whenOf(minMonths: number, maxMonths: number): When {
  if (maxMonths / 12 < 1) return { kind: 'underYear' };
  const minYears = Math.max(1, Math.round(minMonths / 12));
  const maxYears = Math.max(1, Math.round(maxMonths / 12));
  return minYears === maxYears
    ? { kind: 'single', years: minYears }
    : { kind: 'range', minYears, maxYears };
}

/** Pace against the months left, from the SAME years the line shows (one value feeds both). */
function paceOf(when: When, minMonths: number, maxMonths: number, left: number | null) {
  if (left === null || left <= 0) return null;
  const [lo, hi] =
    when.kind === 'underYear'
      ? [minMonths, maxMonths]
      : when.kind === 'single'
        ? [when.years * 12, when.years * 12]
        : [when.minYears * 12, when.maxYears * 12];
  const status: Pace = hi <= left ? 'within' : lo <= left ? 'edge' : 'beyond';
  return { status, monthsLeft: left };
}

/** One amount, or a range when the two ends differ in whole units (never a range whose ends match). */
function amounts(minAmount: number, maxAmount: number) {
  return Math.round(minAmount) === Math.round(maxAmount)
    ? modelled(maxAmount)
    : { min: modelled(minAmount), max: modelled(maxAmount) };
}

/**
 * Whether the block can show anything at all (the first "none" rows of P3 §1). The screen reads
 * the SAME answer to decide whether to fetch the rates, so the goal page never pays for data it
 * will not show — and never shows "loading" for a block that would be empty.
 */
function projectionCanShow(input: {
  status: ProjectionInput['status'];
  target: number;
  value: number;
}): boolean {
  return input.target > 0 && input.value < input.target && input.status === 'active';
}

export function selectGoalProjection(input: ProjectionInput): ProjectionView {
  const value = input.goalCash + input.positions.reduce((a, p) => a + p.value, 0);
  // none
  if (!projectionCanShow({ status: input.status, target: input.target, value }))
    return { kind: 'none' };
  if (input.ranges === null) return { kind: 'loading' };
  if (input.ranges === 'error') return { kind: 'unavailable' };
  const left = input.monthsLeft;
  const growth = input.positions.some(
    (p) => (STRATEGY_CATALOG.find((s) => s.id === p.strategyId)?.growthExposurePercent ?? 1) > 0
  );

  // Cases 2 and 3 — the simulation at the stable aggregate.
  if (input.positions.length === 0 || growth) {
    const agg = input.ranges.aggregate;
    if (!agg.available) return { kind: 'unavailable' };
    const range: RangeLine = {
      lowPercent: agg.lowPercent as number,
      highPercent: agg.highPercent as number,
      windowMonths: windowMonths(agg.observedDays as number),
    };
    if (growth && input.monthlyPlan > 0) {
      const at = (a: number) =>
        monthsToTarget({
          goalCash: 0,
          investedValue: value,
          monthly: input.monthlyPlan,
          annualPercent: a,
          target: input.target,
        });
      const slow = at(range.lowPercent);
      const fast = at(range.highPercent);
      if (slow === null || fast === null) return { kind: 'none' };
      const when = whenOf(fast, slow);
      return {
        kind: 'simulated',
        growthNote: true,
        range,
        line: {
          kind: 'withPlan',
          amount: modelled(input.monthlyPlan),
          when,
        },
        pace: null,
      };
    }
    // The needed line has nothing to say without months left (both Cases 2 and 3).
    if (left === null || left <= 0) return { kind: 'none' };
    const atLow = monthlyNeeded({
      value,
      target: input.target,
      months: left,
      annualPercent: range.lowPercent,
    }) as number;
    const atHigh = monthlyNeeded({
      value,
      target: input.target,
      months: left,
      annualPercent: range.highPercent,
    }) as number;
    const line =
      atLow === 0
        ? ({ kind: 'alreadyEnough', monthsLeft: left } as const)
        : atHigh === 0
          ? ({
              kind: 'neededUpTo',
              max: modelled(atLow),
              monthsLeft: left,
            } as const)
          : ({
              kind: 'needed',
              amounts: amounts(atHigh, atLow),
              monthsLeft: left,
            } as const);
    return { kind: 'simulated', growthNote: growth, range, line, pace: null };
  }

  // Case 1 — the goal's own stable strategies.
  const own = [...new Set(input.positions.map((p) => p.strategyId))].map((id) =>
    input.ranges === null || input.ranges === 'error'
      ? undefined
      : input.ranges.strategies.find((s) => s.strategyId === id)
  );
  if (own.some((s) => !s || !s.available)) return { kind: 'unavailable' };
  const ok = own as Array<Extract<StrategyRateRange, { available: true }>>;
  const range: RangeLine = {
    lowPercent: Math.min(...ok.map((s) => s.lowPercent)),
    highPercent: Math.max(...ok.map((s) => s.highPercent)),
    windowMonths: windowMonths(Math.min(...ok.map((s) => s.observedDays))),
  };
  const asOf = ok.map((s) => s.oldestLegAsOf).sort()[0];
  const today =
    ok.length === 1
      ? ({ kind: 'single', ratePercent: ok[0].todayPercent, asOf } as const)
      : ({
          kind: 'range',
          lowPercent: Math.min(...ok.map((s) => s.todayPercent)),
          highPercent: Math.max(...ok.map((s) => s.todayPercent)),
          asOf,
        } as const);
  const invested = input.positions.reduce((a, p) => a + p.value, 0);
  const at = (a: number) =>
    monthsToTarget({
      goalCash: input.goalCash,
      investedValue: invested,
      monthly: input.monthlyPlan,
      annualPercent: a,
      target: input.target,
    });
  const slow = at(range.lowPercent);
  const fast = at(range.highPercent);
  if (slow === null || fast === null) return { kind: 'none' }; // nothing grows toward it
  const when = whenOf(fast, slow);
  return {
    kind: 'live',
    withPlan: input.monthlyPlan > 0 ? modelled(input.monthlyPlan) : null,
    when,
    range,
    today,
    pace: input.monthlyPlan > 0 ? paceOf(when, fast, slow, left) : null,
  };
}

/** Whether the goal's block can show anything — the screen's gate on fetching the rates. */
export function selectProjectionCanShow(state: LedgerState, goalId: string): boolean {
  const goal = state.goals.find((g) => g.goalId === goalId);
  if (!goal) return false;
  return projectionCanShow({
    status: goal.status,
    target: new Decimal(goal.targetAmount).toNumber(),
    value: goalCurrentValue(state, goalId).toNumber(),
  });
}

/**
 * The block for one goal, from the ledger: open positions at principal + accrued, the goal's
 * cash, and the monthly plan — counted only while the goal is active and Available > 0
 * (`selectRecurringView`, the same rule the recurring control shows; P3 §2).
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
      .map((p) => ({
        strategyId: p.strategyId,
        value: new Decimal(p.principal).plus(p.accrued).toNumber(),
      })),
    monthlyPlan: goal.status === 'active' && funded ? monthly.toNumber() : 0,
    monthsLeft,
    ranges,
  });
}
