/**
 * Play-ledger events — the event-sourced core (Principle 2: every state
 * change is an event with eventId/type/at/correlationId; Principle 11:
 * idempotent appends by eventId).
 *
 * Time note: `simDay` is SIMULATED time (day index from ledger genesis) — the
 * time machine advances it. Wall-clock `recordedAt` is telemetry only and
 * never participates in money math.
 */

export type JobBucket = 'floor' | 'cushion' | 'working';

export interface EventBase {
  eventId: string;
  /** Simulated day index (0 = genesis day). */
  simDay: number;
  /** Wall-clock ISO timestamp when the event was recorded (telemetry only). */
  recordedAt: string;
  correlationId: string;
}

/** Play money granted at first run (D-4: 10K B2C / 250K B2B, local currency). */
export interface PlayMoneyGranted extends EventBase {
  type: 'PlayMoneyGranted';
  amount: string; // Decimal string — money values are always strings in events
  currency: 'USD' | 'BRL' | 'EUR';
  mode: 'b2c' | 'b2b';
}

/** The first-run jobs split (Floor / Cushion / Working). */
export interface JobsSplitSet extends EventBase {
  type: 'JobsSplitSet';
  floorPercent: number;
  cushionPercent: number;
  workingPercent: number;
}

export interface GoalCreated extends EventBase {
  type: 'GoalCreated';
  goalId: string;
  name: string;
  icon: string; // Lucide icon name (never emoji — anti-slop)
  targetAmount: string;
  horizonMonths: number;
}

/** Working money allocated into a goal (an internal move — FREE per FEES.md). */
export interface GoalFunded extends EventBase {
  type: 'GoalFunded';
  goalId: string;
  amount: string;
}

/**
 * A goal's money entering a strategy. Entry is FREE (FEES.md); the network
 * fee is a pass-through cost, expressed in LEDGER currency (the app converts
 * the chain's USD gas quote via the USDC price quote) and genuinely deducted —
 * production honesty, not decoration.
 */
export interface StrategyEntered extends EventBase {
  type: 'StrategyEntered';
  goalId: string;
  positionId: string;
  strategyId: string;
  amount: string;
  networkFee: string;
}

/** Accrual applied to a position for a span of simulated days (real APY replay). */
export interface AccrualApplied extends EventBase {
  type: 'AccrualApplied';
  positionId: string;
  fromSimDay: number;
  toSimDay: number;
  earnings: string; // may be negative for growth strategies in a down replay
  /** Provenance of the APY series used (Data Vintage honesty). */
  apySource: 'defillama' | 'fixture';
}

/** Position exit: 0.39% fee with $0.25 floor, no cap (FE-1a), principal+earnings return to the goal. */
export interface StrategyExited extends EventBase {
  type: 'StrategyExited';
  positionId: string;
  goalId: string;
  grossAmount: string;
  exitFee: string;
  /** Pass-through network fee in ledger currency (deducted, like production). */
  networkFee: string;
}

/**
 * A recurring monthly contribution set (or changed, or cleared) for an open
 * position. Real play money: each due month, `monthlyAmount` moves from Working
 * money into the position's principal (auto-invested, so it compounds). Funded
 * from the shared Working pool → bounded by it (pauses when exhausted). Setting
 * `monthlyAmount` to '0' CLEARS the schedule. `startSimDay` anchors the 30-day
 * cadence: the first deposit lands at `startSimDay + 30`. Latest `RecurringSet`
 * per `positionId` wins (project keeps only the most recent).
 */
export interface RecurringSet extends EventBase {
  type: 'RecurringSet';
  goalId: string;
  positionId: string;
  monthlyAmount: string; // '0' clears the schedule
  startSimDay: number;
}

/**
 * One recurring monthly deposit actually applied during a time advance: moves
 * `amount` from Working money into the position's principal (auto-invest;
 * FREE — no entry fee, no per-deposit gas in MVP-0). `amount` may be a partial
 * of `monthlyAmount` when Working money is nearly exhausted (the last deposit).
 * A MOVE within the reconciliation `held` set — Working down, principal up —
 * so `reconcile` stays 0.00 by construction (no earnings, no fee).
 */
export interface RecurringContributionApplied extends EventBase {
  type: 'RecurringContributionApplied';
  goalId: string;
  positionId: string;
  amount: string;
  onSimDay: number;
}

/**
 * The canonical provenance union for any event that carries a `source`
 * (board §7b). `'real'` = real elapsed calendar time (WS-F); `'machine'` = the
 * time-machine accelerator; `'system'` = platform-injected money legs (D-s
 * simulated income/expense — no producer yet; reserved for §2.4). Pinned by a
 * tripwire in `ledger.test.ts` so adding a value is a deliberate, reviewed
 * change — and any new value MUST be re-checked against the `?? 'machine'`
 * default in `engine.ts` (only `'real'` may increment `realSettledDays`).
 */
export type LedgerSource = 'real' | 'machine' | 'system';

/**
 * Time advancing. `source` distinguishes the time-machine accelerator
 * (`'machine'`) from real elapsed calendar time settled on load (`'real'`,
 * WS-F). Missing `source` on a pre-WS-F event is treated as `'machine'`
 * (backward-compat: old ledgers do not retro-accrue real time — D-3).
 * TimeAdvanced is never `'system'` (a `LedgerSource` subset by design).
 */
export interface TimeAdvanced extends EventBase {
  type: 'TimeAdvanced';
  days: number;
  source?: Exclude<LedgerSource, 'system'>;
}

// ── D-e goal lifecycle (spec: SANDBOX_SPEC_D-E_GOAL_LIFECYCLE) ──────────────
//
// The 7 lifecycle events. Goal-status transitions carry `expectedVersion`
// (optimistic concurrency, D-e §5): the projection increments `goal.version`
// on each APPLIED transition, so an event whose `expectedVersion` is stale — a
// concurrent tab already advanced it — is skipped and the UI re-presents
// current state rather than applying blind. Idempotent per `(goalId, version)`;
// replay is deterministic. Most are zero-value (D-e §6 — ledger events anyway,
// because replay needs them for goal projections + the honest trail); the two
// that move money (`GoalDropped`, `GoalCashReleased`) do so as MOVES within
// `held` (goal cash → Available), never as a silent side effect (H-3.1).

/** Pause a goal's plan — positions keep working; proposals skip it. Zero-value. */
export interface GoalPaused extends EventBase {
  type: 'GoalPaused';
  goalId: string;
  expectedVersion: number;
}

/** Resume a paused goal. Zero-value. */
export interface GoalResumed extends EventBase {
  type: 'GoalResumed';
  goalId: string;
  expectedVersion: number;
}

/**
 * Drop a goal (terminal). Its uninvested cash returns to Available via THIS
 * event (never silently — H-3.1); dropping is blocked in the UI until open
 * positions are stopped or reassigned, so `cashReleased` is the goal's whole
 * cash at drop. History keeps the record (no DELETE, R-4).
 */
export interface GoalDropped extends EventBase {
  type: 'GoalDropped';
  goalId: string;
  cashReleased: string;
  expectedVersion: number;
}

/** The disposition the user chooses when closing a reached goal (D-e §3). */
export type GoalDisposition = 'kept-working' | 'held-as-cash' | 'transferred' | 'target-raised';

/**
 * Close a reached goal (terminal-ish) by the user's disposition choice — the
 * moment belongs to the user, not to arithmetic. Zero-value itself: any money
 * move rides the disposition's OWN events (transfer = GoalCashReleased+
 * GoalFunded; stop = the exit manifest).
 */
export interface GoalAccomplished extends EventBase {
  type: 'GoalAccomplished';
  goalId: string;
  disposition: GoalDisposition;
  expectedVersion: number;
}

/** Move a position's goal label (W-17e). Zero-value, ALWAYS — no money moves. */
export interface PositionReassigned extends EventBase {
  type: 'PositionReassigned';
  positionId: string;
  fromGoalId: string;
  toGoalId: string;
}

/** Edit a goal's target, any time (D-e §4). Zero-value; old+new both kept for the honest trail. */
export interface GoalTargetChanged extends EventBase {
  type: 'GoalTargetChanged';
  goalId: string;
  oldTarget: string;
  newTarget: string;
  expectedVersion: number;
}

/** Release goal cash to Available — the partial-release primitive D-s depends on. Move within `held`. */
export interface GoalCashReleased extends EventBase {
  type: 'GoalCashReleased';
  goalId: string;
  amount: string;
  expectedVersion: number;
}

export type LedgerEvent =
  | PlayMoneyGranted
  | JobsSplitSet
  | GoalCreated
  | GoalFunded
  | StrategyEntered
  | AccrualApplied
  | StrategyExited
  | RecurringSet
  | RecurringContributionApplied
  | TimeAdvanced
  | GoalPaused
  | GoalResumed
  | GoalDropped
  | GoalAccomplished
  | PositionReassigned
  | GoalTargetChanged
  | GoalCashReleased;

export type LedgerEventType = LedgerEvent['type'];
