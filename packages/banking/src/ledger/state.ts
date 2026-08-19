/**
 * Projected ledger state — the shapes `project()` derives from the event log.
 * Types only (plus the empty-state constructor); the projection logic lives in
 * `engine.ts` + the per-domain appliers under `projection/`.
 */

import type { JobBucket, LedgerEvent } from './events';

/** Goal lifecycle status (D-e §1). `target_reached` is NOT a status — it is a
 *  derived fact (`current ≥ target`), recomputable and never stored. */
export type GoalStatus = 'active' | 'paused' | 'dropped' | 'accomplished';

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
  /** Lifecycle status (D-e). Defaults 'active' at creation. */
  status: GoalStatus;
  /** Optimistic-concurrency version; incremented on each applied transition (D-e §5). */
  version: number;
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

/** Rule lifecycle status (D-r §1). One active/paused rule per account in R1. */
export type RuleStatus = 'active' | 'paused' | 'deleted';

/**
 * A projected rule (D-r). Zero-value — it holds NO money (a proposal-generator
 * only), so it never enters `reconcile()`'s `held`. `ruleVersion` is the
 * optimistic-concurrency + version-safety anchor (D-r §3).
 */
export interface RuleState {
  ruleId: string;
  ruleVersion: number;
  split: { goalId: string; percent: number }[];
  status: RuleStatus;
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
  /** Rules (D-r). Zero-value; one active/paused per account in R1 (W-19a). */
  rules: RuleState[];
  /** Active recurring-contribution schedules (C3), keyed by position. */
  recurring: RecurringSchedule[];
  /** Total network fees paid (play), shown in the trail. */
  networkFeesPaid: string;
  /** Total exit fees paid (play). */
  exitFeesPaid: string;
  /**
   * Ingress total — money entering the system AFTER genesis (weekly credit,
   * comparison credit, simulated income). A subtrahend's mirror in the
   * conservation formula. First producers: §2.3's credit events.
   */
  credited: string;
  /**
   * Genesis-anchored week indices whose credit has been collected (WG-1) —
   * ascending, the per-week idempotency record. Weeks skipped while the
   * collection cap held the meter never appear (they never accrued).
   */
  collectedWeeks: number[];
  /** Whether the one-time W-5c comparison credit has been granted (P2BD-10). */
  comparisonCredited: boolean;
  /**
   * Simulated-event instance ids already resolved (D-s §3 idempotency) — a
   * duplicate money leg for a resolved instance is skipped at projection.
   */
  resolvedEventInstances: string[];
  /**
   * Egress total — money that has permanently LEFT the system (simulated
   * expense). NOT a held bucket: gone money is gone, so `held`-derived
   * balances stay honest. First producer: §2.4's expense leg.
   */
  spent: string;
  events: LedgerEvent[];
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
    rules: [],
    recurring: [],
    networkFeesPaid: '0',
    exitFeesPaid: '0',
    credited: '0',
    collectedWeeks: [],
    comparisonCredited: false,
    resolvedEventInstances: [],
    spent: '0',
    events: [],
  };
}
