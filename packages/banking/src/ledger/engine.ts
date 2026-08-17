/**
 * Ledger projection — pure function from the event log to the current state
 * (event sourcing: the log is the truth; balances are always derived).
 *
 * Money math is Decimal.js end to end; amounts serialize as strings in events
 * and in projected state (never floats across boundaries).
 */

import Decimal from 'decimal.js';
import type { JobBucket, LedgerEvent } from './events';

export interface GoalState {
  goalId: string;
  name: string;
  icon: string;
  targetAmount: string;
  horizonMonths: number;
  /** Uninvested money sitting in the goal. */
  cash: string;
  /** Sum of currently-invested principal. */
  invested: string;
  /** Lifetime earnings realized + accrued across the goal's positions. */
  earnings: string;
  createdSimDay: number;
}

export interface PositionState {
  positionId: string;
  goalId: string;
  strategyId: string;
  principal: string;
  accrued: string;
  enteredSimDay: number;
  /** Sim day accrual has been applied through (exclusive of days not yet simulated). */
  accruedThroughSimDay: number;
  open: boolean;
}

/**
 * An active recurring-contribution schedule on an open position (C3). The
 * 30-day cadence is anchored at `startSimDay`; the first deposit lands at
 * `startSimDay + 30`. Derived state — "paused" is not stored: a schedule whose
 * position is closed, or whose deposits can't be funded from Working money, is
 * simply inert (the UI derives the paused message).
 */
export interface RecurringSchedule {
  goalId: string;
  positionId: string;
  monthlyAmount: string;
  startSimDay: number;
}

export interface LedgerState {
  initialized: boolean;
  mode: 'b2c' | 'b2b';
  currency: 'USD' | 'BRL' | 'EUR';
  simDay: number;
  /** Real wall-clock time of genesis (the grant) — the anchor for real-time settle (WS-F). */
  genesisRecordedAt: string | null;
  /** Real days already settled via `source:'real'` TimeAdvanced events (WS-F idempotency). */
  realSettledDays: number;
  split: { floorPercent: number; cushionPercent: number; workingPercent: number } | null;
  /** Bucket balances (working excludes money moved into goals). */
  buckets: Record<JobBucket, string>;
  goals: GoalState[];
  positions: PositionState[];
  /** Active recurring-contribution schedules (C3), keyed by position. */
  recurring: RecurringSchedule[];
  /** Total network fees paid (play), shown in the trail. */
  networkFeesPaid: string;
  /** Total exit fees paid (play). */
  exitFeesPaid: string;
  /**
   * Ingress total — money entering the system AFTER genesis (weekly credit,
   * simulated income). A subtrahend's mirror in the conservation formula.
   * Zero until §2.3/§2.4 add the producing events (Step-0 scaffold, board §1a).
   */
  credited: string;
  /**
   * Egress total — money that has permanently LEFT the system (simulated
   * expense). NOT a held bucket: gone money is gone, so `held`-derived
   * balances stay honest. Zero until §2.4 (Step-0 scaffold, board §1a).
   */
  spent: string;
  events: LedgerEvent[];
}

const ZERO = new Decimal(0);

function d(value: string): Decimal {
  return new Decimal(value);
}

export function emptyState(): LedgerState {
  return {
    initialized: false,
    mode: 'b2c',
    currency: 'USD',
    simDay: 0,
    genesisRecordedAt: null,
    realSettledDays: 0,
    split: null,
    buckets: { floor: '0', cushion: '0', working: '0' },
    goals: [],
    positions: [],
    recurring: [],
    networkFeesPaid: '0',
    exitFeesPaid: '0',
    credited: '0',
    spent: '0',
    events: [],
  };
}

/**
 * Exhaustiveness guard (P2R-13): every `LedgerEventType` must be handled in
 * `project()`'s switch. A net-new event type narrows `event` here to itself
 * (not `never`), so this fails to COMPILE until a case is added — closing the
 * "new event compiles and is silently dropped" gap. At runtime an unhandled
 * event is a bug (code older than its data), so surface it loudly.
 */
function assertNever(event: never): never {
  throw new Error(`project: unhandled ledger event ${JSON.stringify(event)}`);
}

/** Project the full event log into current state. Pure and deterministic. */
export function project(events: LedgerEvent[]): LedgerState {
  const state = emptyState();
  const floor = { v: ZERO };
  const cushion = { v: ZERO };
  const working = { v: ZERO };
  const goals = new Map<
    string,
    { s: GoalState; cash: Decimal; invested: Decimal; earnings: Decimal }
  >();
  const positions = new Map<string, { s: PositionState; principal: Decimal; accrued: Decimal }>();
  const recurring = new Map<string, RecurringSchedule>();
  let networkFees = ZERO;
  let exitFees = ZERO;
  // Ingress/egress running totals (board §1a). Zero today — the producing
  // events (WeeklyCreditGranted, simulated income/expense) land in §2.3/§2.4;
  // wire the `+= ` in the same case that adds the event, per the same-PR rule.
  let credited = ZERO;
  let spent = ZERO;

  for (const event of events) {
    switch (event.type) {
      case 'PlayMoneyGranted': {
        state.initialized = true;
        state.mode = event.mode;
        state.currency = event.currency;
        // Genesis anchor for real-time settle (WS-F): the real moment the grant landed.
        if (state.genesisRecordedAt === null) state.genesisRecordedAt = event.recordedAt;
        // Granted money lands in "working" until the split assigns jobs.
        working.v = working.v.plus(d(event.amount));
        break;
      }
      case 'JobsSplitSet': {
        const total = floor.v.plus(cushion.v).plus(working.v);
        state.split = {
          floorPercent: event.floorPercent,
          cushionPercent: event.cushionPercent,
          workingPercent: event.workingPercent,
        };
        floor.v = total.mul(event.floorPercent).div(100).toDecimalPlaces(2);
        cushion.v = total.mul(event.cushionPercent).div(100).toDecimalPlaces(2);
        working.v = total.minus(floor.v).minus(cushion.v);
        break;
      }
      case 'GoalCreated': {
        goals.set(event.goalId, {
          s: {
            goalId: event.goalId,
            name: event.name,
            icon: event.icon,
            targetAmount: event.targetAmount,
            horizonMonths: event.horizonMonths,
            cash: '0',
            invested: '0',
            earnings: '0',
            createdSimDay: event.simDay,
          },
          cash: ZERO,
          invested: ZERO,
          earnings: ZERO,
        });
        break;
      }
      case 'GoalFunded': {
        const goal = goals.get(event.goalId);
        if (!goal) break;
        const amount = d(event.amount);
        if (working.v.lt(amount)) break; // insufficient working money: reject silently at projection level
        working.v = working.v.minus(amount);
        goal.cash = goal.cash.plus(amount);
        break;
      }
      case 'StrategyEntered': {
        const goal = goals.get(event.goalId);
        if (!goal) break;
        const amount = d(event.amount);
        const fee = d(event.networkFee);
        if (goal.cash.lt(amount.plus(fee))) break;
        goal.cash = goal.cash.minus(amount).minus(fee);
        goal.invested = goal.invested.plus(amount);
        networkFees = networkFees.plus(fee);
        positions.set(event.positionId, {
          s: {
            positionId: event.positionId,
            goalId: event.goalId,
            strategyId: event.strategyId,
            principal: event.amount,
            accrued: '0',
            enteredSimDay: event.simDay,
            accruedThroughSimDay: event.simDay,
            open: true,
          },
          principal: amount,
          accrued: ZERO,
        });
        break;
      }
      case 'AccrualApplied': {
        const position = positions.get(event.positionId);
        if (!position || !position.s.open) break;
        position.accrued = position.accrued.plus(d(event.earnings));
        position.s.accruedThroughSimDay = event.toSimDay;
        const goal = goals.get(position.s.goalId);
        if (goal) goal.earnings = goal.earnings.plus(d(event.earnings));
        break;
      }
      case 'StrategyExited': {
        const position = positions.get(event.positionId);
        if (!position || !position.s.open) break;
        position.s.open = false;
        const goal = goals.get(event.goalId);
        if (goal) {
          const net = d(event.grossAmount).minus(d(event.exitFee)).minus(d(event.networkFee));
          goal.invested = goal.invested.minus(position.principal);
          goal.cash = goal.cash.plus(net);
        }
        exitFees = exitFees.plus(d(event.exitFee));
        networkFees = networkFees.plus(d(event.networkFee));
        break;
      }
      case 'RecurringSet': {
        // Latest set per position wins; '0' clears the schedule (C3, A-7).
        if (d(event.monthlyAmount).lte(0)) {
          recurring.delete(event.positionId);
        } else {
          recurring.set(event.positionId, {
            goalId: event.goalId,
            positionId: event.positionId,
            monthlyAmount: d(event.monthlyAmount).toFixed(2),
            startSimDay: event.startSimDay,
          });
        }
        break;
      }
      case 'RecurringContributionApplied': {
        // A MOVE: Working → the position's principal (auto-invest). Guarded
        // against an over-budget deposit the same way GoalFunded is (A-10) —
        // the client already bounds it, so this is belt-and-suspenders.
        const position = positions.get(event.positionId);
        if (!position || !position.s.open) break;
        const amount = d(event.amount);
        if (amount.lte(0) || working.v.lt(amount)) break;
        working.v = working.v.minus(amount);
        position.principal = position.principal.plus(amount);
        const goal = goals.get(event.goalId);
        if (goal) goal.invested = goal.invested.plus(amount);
        break;
      }
      case 'TimeAdvanced': {
        state.simDay += event.days;
        // Missing source ⇒ 'machine' (backward-compat, D-3): old ledgers don't retro-accrue.
        if ((event.source ?? 'machine') === 'real') state.realSettledDays += event.days;
        break;
      }
      default:
        assertNever(event);
    }
  }

  state.buckets = {
    floor: floor.v.toFixed(2),
    cushion: cushion.v.toFixed(2),
    working: working.v.toFixed(2),
  };
  state.goals = [...goals.values()].map((g) => ({
    ...g.s,
    cash: g.cash.toFixed(2),
    invested: g.invested.toFixed(2),
    earnings: g.earnings.toFixed(2),
  }));
  state.positions = [...positions.values()].map((p) => ({
    ...p.s,
    principal: p.principal.toFixed(2),
    accrued: p.accrued.toFixed(2),
  }));
  // Only surface schedules whose position is still open (a closed position's
  // schedule is inert → the UI shows nothing rather than a stale control).
  const openPositionIds = new Set(
    [...positions.values()].filter((p) => p.s.open).map((p) => p.s.positionId)
  );
  state.recurring = [...recurring.values()].filter((r) => openPositionIds.has(r.positionId));
  state.networkFeesPaid = networkFees.toFixed(2);
  state.exitFeesPaid = exitFees.toFixed(2);
  state.credited = credited.toFixed(2);
  state.spent = spent.toFixed(2);
  state.events = events;
  return state;
}

/**
 * Reconciliation invariant (the P.2 / C-P0 gate): total play money currently
 * held in the system equals the SYMMETRIC conservation formula (board §1a):
 *
 *   expected = granted + credited + earnings − spent − exitFees − networkFees
 *
 * `credited` (ingress: weekly credit, simulated income) and `spent` (egress:
 * simulated expense — money permanently gone) are the mirror of the fee
 * subtrahends. Both are 0 until §2.3/§2.4, so this is identical to the prior
 * `granted + earnings − fees` formula today, and the invariant holds unchanged.
 * `held` never includes `spent` (gone money is gone). Returns the residual
 * (must be 0.00).
 */
export function reconcile(state: LedgerState): string {
  let granted = ZERO;
  let earnings = ZERO;
  for (const e of state.events) {
    if (e.type === 'PlayMoneyGranted') granted = granted.plus(d(e.amount));
    if (e.type === 'AccrualApplied') earnings = earnings.plus(d(e.earnings));
  }
  const held = [
    d(state.buckets.floor),
    d(state.buckets.cushion),
    d(state.buckets.working),
    ...state.goals.map((g) => d(g.cash)),
    ...state.positions.filter((p) => p.open).map((p) => d(p.principal).plus(d(p.accrued))),
  ].reduce((acc, v) => acc.plus(v), ZERO);
  const expected = granted
    .plus(d(state.credited))
    .plus(earnings)
    .minus(d(state.spent))
    .minus(d(state.exitFeesPaid))
    .minus(d(state.networkFeesPaid));
  return held.minus(expected).toFixed(2);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole real days to settle to "now" (WS-F): real days elapsed since genesis,
 * minus those already settled via `source:'real'` events. Pure — `nowIso` is
 * passed in. Returns 0 when there is no genesis, less than a full day has
 * passed, or the clock moved backward (D-2 daily granularity; idempotent).
 */
export function realDaysToSettle(
  genesisRecordedAt: string | null,
  realSettledDays: number,
  nowIso: string
): number {
  if (!genesisRecordedAt) return 0;
  const t0 = Date.parse(genesisRecordedAt);
  const now = Date.parse(nowIso);
  if (!Number.isFinite(t0) || !Number.isFinite(now)) return 0;
  const realElapsed = Math.floor((now - t0) / MS_PER_DAY);
  return Math.max(0, realElapsed - realSettledDays);
}

/** Recurring cadence (C3, decision D-1): a deposit every 30 simulated days. */
export const RECURRING_CADENCE_DAYS = 30;

/**
 * The monthly deposit sim-days due in the half-open range `(fromDay, toDay]`
 * for a schedule anchored at `startSimDay` (first deposit at
 * `startSimDay + 30`). Pure. Because `fromDay` is the position's
 * `accruedThroughSimDay` (which advances every settle), each due-day fires
 * exactly once across successive advances — idempotent even when a single month
 * is split across two advances (A-8). Ascending.
 */
export function recurringDepositDays(
  startSimDay: number,
  fromDay: number,
  toDay: number
): number[] {
  const days: number[] = [];
  if (toDay <= fromDay) return days;
  // First cadence day strictly after fromDay.
  const elapsed = fromDay - startSimDay;
  let k = Math.floor(elapsed / RECURRING_CADENCE_DAYS) + 1;
  if (k < 1) k = 1;
  for (
    let day = startSimDay + k * RECURRING_CADENCE_DAYS;
    day <= toDay;
    day += RECURRING_CADENCE_DAYS
  ) {
    if (day > fromDay) days.push(day);
  }
  return days;
}
