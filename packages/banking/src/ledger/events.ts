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
  /**
   * The exact daily APY percents this span replayed, in day order (§3
   * rate-pinning, board §3.7): the "would have" claim becomes self-auditing —
   * compounding these rates over the span reproduces `earnings` exactly, with
   * no external archive to keep in sync. OPTIONAL for backward-compat: events
   * appended before §3 lack it (like the `source ?? 'machine'` precedent);
   * the projection never reads it (display/audit data, not money math).
   */
  ratesUsed?: number[];
  /**
   * Per-leg replay record (§4.8 G8), present once a position holds a
   * MARKET-priced leg — where the token's own price series IS the return and
   * no APY is applied on top (see `ProtocolReturnModel`).
   *
   * Why per-leg and not one blended day-series like `ratesUsed`: legs of
   * different kinds cannot be blended into a single rate, and each leg
   * compounds on its own weighted share of the principal. Why the compact
   * `multiple` rather than every daily factor: the §3 self-audit property is
   * "replaying what is pinned reproduces `earnings` exactly", and the product
   * does that exactly — while storing a factor per leg per day would multiply
   * this event's localStorage footprint by the leg count on every advance.
   *
   * OPTIONAL for backward-compat: events appended before §4.8 lack it, and
   * the projection never reads it (display/audit data, never money math).
   */
  legsReplayed?: Array<{
    weightPercent: number;
    kind: 'lending' | 'market';
    source: 'defillama' | 'coingecko' | 'fixture';
    /** Product of the span's daily growth factors, as a Decimal string. */
    multiple: string;
  }>;
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
 * simulated income/expense — producers: the §2.4 events below). Pinned by a
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

// ── D-r rules engine (spec: SANDBOX_SPEC_D-R_RULES_ENGINE) ──────────────────
//
// The 5 rule-CRUD events — all ZERO-VALUE ledger events (D-r §2, the D-e §6
// precedent): trail-visible history ("You created your rule: 50/30/20", W-19c),
// projections need them, reconcile() indifferent. A Rule is a PROPOSAL-
// GENERATOR that never moves money on its own; the money leg (`RuleApplied` +
// `GoalFunded` per line) lands with the weekly cycle in §2.3. Proposal
// lifecycle (`Proposed/Approved/…`) lives in its OWN store, never here (the
// C-P0 ledger set stays money-pure). CRUD transitions carry `expectedRuleVersion`
// (optimistic concurrency + the version-safety invariant, D-r §3). The split
// shape is inlined so `@diboas/banking` stays dependency-free.

/** One line of a rule's split: an integer-percent share to a goal. */
export interface RuleSplitInput {
  goalId: string;
  percent: number;
}

/** Create the (one active, R1) rule with its split. Version starts at 0. */
export interface RuleCreated extends EventBase {
  type: 'RuleCreated';
  ruleId: string;
  split: RuleSplitInput[];
}

/** Edit the rule's split — versioned (W-19a: creating anew = editing). */
export interface RuleUpdated extends EventBase {
  type: 'RuleUpdated';
  ruleId: string;
  split: RuleSplitInput[];
  expectedRuleVersion: number;
}

/** Pause the rule — generation skips it; the rule keeps its shape for resume. Zero-value. */
export interface RulePaused extends EventBase {
  type: 'RulePaused';
  ruleId: string;
  expectedRuleVersion: number;
}

/** Resume a paused rule. Zero-value. */
export interface RuleResumed extends EventBase {
  type: 'RuleResumed';
  ruleId: string;
  expectedRuleVersion: number;
}

/** Delete the rule (terminal). History keeps it (R-4). Zero-value. */
export interface RuleDeleted extends EventBase {
  type: 'RuleDeleted';
  ruleId: string;
  expectedRuleVersion: number;
}

// ── §2.3 weekly cycle (WG-1 + D-r §3) ───────────────────────────────────────
//
// The credit economy's ingress legs — the first producers of the `credited`
// conservation term (board §1a). Credits accrue on the REAL calendar regardless
// of login and materialize only at the explicit Collect tap (W-5b): the tap
// emits one `WeeklyCreditGranted` per collectible week, so replay reproduces
// every credit and idempotency is per-week. `RuleApplied` is the zero-value
// correlation marker of an approved proposal — the money moves via its
// `GoalFunded` legs (D-r §2: no new money event; the remainder simply stays
// in Available).

/**
 * One week's practice credit, collected. `week` is the 1-based genesis-anchored
 * calendar week index that accrued this credit (weeks skipped while the 2-week
 * collection cap held the meter never accrue and never appear). Ingress →
 * `credited`; lands in Available (working). Idempotent per week (projection
 * skips a duplicate week). Amount derives from the grant (WG-1: grant × 10%),
 * stamped by the emitter — never recomputed at replay.
 */
export interface WeeklyCreditGranted extends EventBase {
  type: 'WeeklyCreditGranted';
  week: number;
  amount: string;
}

/**
 * The one-time W-5c comparison credit (3.10): extra practice money to try a
 * second goal or different strategy, offered only AFTER the first strategy
 * entry (comparison-learning material — never a reward, never pre-announced;
 * the BR-no-incentive covenant + MiCA inducement rules both forbid the
 * bonus-for-investing shape). Projection enforces both guards: once per
 * ledger AND only when a `StrategyEntered` precedes it (P2BD-10). Ingress →
 * `credited`; lands in Available.
 */
export interface ComparisonCreditGranted extends EventBase {
  type: 'ComparisonCreditGranted';
  amount: string;
}

/**
 * An approved rule proposal (D-r §3) — the W-8 ceremony's record. Zero-value
 * itself: the allocation moves via the `GoalFunded` events sharing its
 * `correlationId` (approve → `RuleApplied` + `GoalFunded`×N; the remainder
 * stays in Available with no event). Carries the rule version the user SAW
 * (version-safety) and the week-set it settled (the idempotency key — a
 * week-set can be applied at most once).
 */
export interface RuleApplied extends EventBase {
  type: 'RuleApplied';
  ruleId: string;
  ruleVersion: number;
  proposalId: string;
  weekSet: number[];
}

// ── §2.4 D-s simulated events (spec: SANDBOX_SPEC_D-S) ──────────────────────
//
// The money legs of a resolved practice-life event — ordinary ledger events
// tagged `source: 'system'` (the LedgerSource third value's first producers,
// §2b.3). Life events only, never market events (H-3.4). The choice record
// (`SimulatedEventResolved`) is PLATFORM-SIDE and moves no money — it never
// joins this union (CH-1 discipline). Resolution is idempotent per
// `eventInstanceId` (D-s §3): the projection skips a duplicate instance, so a
// re-fired resolution can never double-move money.

/**
 * A simulated expense, paid from Available — money permanently GONE (egress →
 * the `spent` term; `held` never includes it). The affordability floor is
 * enforced HERE too: a debit larger than Available is skipped (no negative
 * balances, ever) — the option filter upstream should make that unreachable.
 * The reserve path (cash released from the emergency goal first) rides a
 * `GoalCashReleased` under the same correlationId.
 */
export interface SimulatedExpensePaid extends EventBase {
  type: 'SimulatedExpensePaid';
  eventInstanceId: string;
  amount: string;
  source: 'system';
}

/**
 * Simulated extra income, credited to Available (ingress → the `credited`
 * term). Never blocked or capped by the weekly-credit pauses (RD-9: it is not
 * accrual — its ceiling effect is indirect and honest: a raised base pauses
 * FUTURE weekly credits).
 */
export interface SimulatedIncomeReceived extends EventBase {
  type: 'SimulatedIncomeReceived';
  eventInstanceId: string;
  amount: string;
  source: 'system';
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
  | GoalCashReleased
  | RuleCreated
  | RuleUpdated
  | RulePaused
  | RuleResumed
  | RuleDeleted
  | WeeklyCreditGranted
  | ComparisonCreditGranted
  | RuleApplied
  | SimulatedExpensePaid
  | SimulatedIncomeReceived;

export type LedgerEventType = LedgerEvent['type'];
