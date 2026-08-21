import Decimal from 'decimal.js';
import { project, type LedgerEvent, type LedgerState } from '@diboas/banking';

/**
 * G12 month-report aggregator (§4.12). Reads only — appends nothing.
 *
 * ## Why the buckets are what they are
 *
 * The screen's promise is "every dollar is explained", so the rows must SUM to
 * the change, provably. Stage-D's proposed buckets did not: it counted
 * `GoalFunded`/`RecurringContributionApplied` as "contributions", but funding
 * a goal moves `working → goal.cash` and BOTH sit inside `reconcile()`'s
 * `held` total — it is net zero on the play balance. A contributions row
 * inside that sum would have made the footer a claim rather than an identity.
 *
 * So the buckets are derived from the conservation formula itself. `reconcile`
 * holds `held = granted + credited + earnings − spent − exitFees −
 * networkFees`; differencing it across a window gives
 *
 *   Δheld = Δgranted + Δcredited + Δearnings − Δspent − Δfees
 *
 * and each row below is one term of that. `sourcesTotal === closing − opening`
 * is therefore true by construction, not by arithmetic luck — and the test
 * asserts it against a randomised ledger.
 *
 * Each term is derived from its OWN event type rather than from the running
 * `credited` total, because simulated income also lands in `credited`: reading
 * the total would count it twice, once as a credit and once as an event.
 *
 * ## What the user DID still shows
 *
 * Money moved into goals is the user's own act and UX-63 exists so it is never
 * confused with what the market did. It is reported — but as `movedIntoGoals`,
 * deliberately OUTSIDE the summing rows, described as a movement between their
 * own pockets rather than a change in the total.
 */

/** One summing row: a term of the conservation formula over the window. */
export interface MovementSource {
  key: 'grant' | 'weeklyCredits' | 'marketChange' | 'practiceEvents' | 'fees';
  /** Signed, in ledger currency. Market change and events may be negative. */
  amount: number;
}

export interface MonthReport {
  /** Window bounds, ISO — the labelled range. */
  fromIso: string;
  toIso: string;
  /** Play balance at the window's start (a prefix projection, board §2a). */
  opening: number;
  /** Play balance now. */
  closing: number;
  /** closing − opening. */
  totalChange: number;
  /** As a share of the opening balance; 0 when opening is 0 (the genesis month). */
  totalChangePercent: number;
  /** The summing rows. Non-zero terms only — an empty row states nothing. */
  sources: MovementSource[];
  /** Play balance stepped at every event that moved it — the sparkline. */
  series: number[];
  /**
   * NOT a source of change: money the user moved from Available into goals.
   * Their own act, worth seeing, but it leaves the total untouched.
   */
  movedIntoGoals: number;
  /** Counts, never streaks (WSG G6 cleared / G7 rejected). */
  goalsCreated: number;
  cyclesCompleted: number;
}

/** The play balance a state holds — the same sum `reconcile()` calls `held`. */
export function playBalance(state: LedgerState): Decimal {
  return [
    new Decimal(state.buckets.floor),
    new Decimal(state.buckets.cushion),
    new Decimal(state.buckets.working),
    ...state.goals.map((g) => new Decimal(g.cash)),
    ...state.positions.filter((p) => p.open).map((p) => new Decimal(p.principal).plus(p.accrued)),
  ].reduce((acc, v) => acc.plus(v), new Decimal(0));
}

/**
 * How much one event moved the play balance. Every event not listed is an
 * internal transfer (goal funding, strategy entry/exit, rule application) and
 * is genuinely zero — which is why they cannot appear as sources.
 */
function deltaFor(event: LedgerEvent): Decimal {
  switch (event.type) {
    case 'PlayMoneyGranted':
      return new Decimal(event.amount);
    case 'WeeklyCreditGranted':
    case 'ComparisonCreditGranted':
    case 'SimulatedIncomeReceived':
      return new Decimal(event.amount);
    case 'AccrualApplied':
      return new Decimal(event.earnings);
    case 'SimulatedExpensePaid':
      return new Decimal(event.amount).neg();
    case 'StrategyEntered':
      return new Decimal(event.networkFee).neg();
    case 'StrategyExited':
      // gross is `principal + accrued` at both emitters, so the position
      // leaving `held` is exactly cancelled by the net landing in goal.cash —
      // what remains is the fees.
      return new Decimal(event.exitFee).plus(event.networkFee).neg();

    // ── Provably net-zero on the play balance ────────────────────────────
    // Each of these either touches no component of `held`, or moves value
    // between two of them. Verified against the projection, not assumed:
    //   JobsSplitSet          re-splits the SAME total across the three
    //                         buckets (working absorbs the rounding)
    //   GoalFunded            working → goal.cash
    //   RecurringContribution working → an OPEN position's principal
    //                         (guarded: `if (!position || !position.s.open)`)
    //   GoalDropped           goal.cash → working
    //   GoalCashReleased      goal.cash → working
    // the rest mutate no held component at all.
    case 'JobsSplitSet':
    case 'GoalCreated':
    case 'GoalFunded':
    case 'RecurringSet':
    case 'RecurringContributionApplied':
    case 'TimeAdvanced':
    case 'GoalPaused':
    case 'GoalResumed':
    case 'GoalDropped':
    case 'GoalAccomplished':
    case 'PositionReassigned':
    case 'GoalTargetChanged':
    case 'GoalCashReleased':
    case 'RuleCreated':
    case 'RuleUpdated':
    case 'RulePaused':
    case 'RuleResumed':
    case 'RuleDeleted':
    case 'RuleApplied':
      return new Decimal(0);
  }
  // No `default`. The engine's own `project()` refuses to swallow an unknown
  // event for the same reason ("code older than its data — surface it
  // loudly"), and here the stakes are the screen's whole promise: a NEW
  // money-moving event silently defaulting to zero would make the rows stop
  // summing to the change, with nothing failing. Adding an event type is now
  // a compile error until someone decides what it does to the balance.
  return assertNeverEvent(event);
}

/** Exhaustiveness guard — see the note in `deltaFor`. */
function assertNeverEvent(event: never): never {
  throw new Error(`monthReport: unhandled ledger event ${JSON.stringify(event)}`);
}

/** Which summing row an event belongs to, if any. */
function sourceOf(event: LedgerEvent): MovementSource['key'] | null {
  switch (event.type) {
    case 'PlayMoneyGranted':
      return 'grant';
    case 'WeeklyCreditGranted':
    case 'ComparisonCreditGranted':
      return 'weeklyCredits';
    case 'AccrualApplied':
      return 'marketChange';
    case 'SimulatedIncomeReceived':
    case 'SimulatedExpensePaid':
      return 'practiceEvents';
    case 'StrategyEntered':
    case 'StrategyExited':
      return 'fees';
    default:
      return null;
  }
}

/** Row order — the story: what arrived, what the market did, what life did, what it cost. */
const SOURCE_ORDER: MovementSource['key'][] = [
  'grant',
  'weeklyCredits',
  'marketChange',
  'practiceEvents',
  'fees',
];

/**
 * Build the report for the window `[fromIso, toIso)`. Pure; derived from the
 * event log on every call, so it can never drift from the ledger it describes.
 */
export function buildMonthReport(
  state: LedgerState,
  fromIso: string,
  toIso: string
): MonthReport | null {
  if (!state.initialized) return null;
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;

  const inWindow = (e: LedgerEvent) => {
    const t = Date.parse(e.recordedAt);
    return Number.isFinite(t) && t >= from && t < to;
  };
  const before = state.events.filter((e) => {
    const t = Date.parse(e.recordedAt);
    return Number.isFinite(t) && t < from;
  });

  // Board §2a: the opening balance is a POINT-IN-TIME projection of the prefix,
  // not a running total we kept — `project` is pure, so this is exact.
  const opening = playBalance(project(before));

  const totals = new Map<MovementSource['key'], Decimal>();
  const series: number[] = [opening.toNumber()];
  let running = opening;
  let movedIntoGoals = new Decimal(0);
  let goalsCreated = 0;
  let cyclesCompleted = 0;

  for (const event of state.events) {
    if (!inWindow(event)) continue;
    const delta = deltaFor(event);
    if (!delta.isZero()) {
      const key = sourceOf(event);
      if (key) totals.set(key, (totals.get(key) ?? new Decimal(0)).plus(delta));
      running = running.plus(delta);
      series.push(running.toNumber());
    }
    if (event.type === 'GoalFunded' || event.type === 'RecurringContributionApplied')
      movedIntoGoals = movedIntoGoals.plus(event.amount);
    if (event.type === 'GoalCreated') goalsCreated += 1;
    if (event.type === 'RuleApplied') cyclesCompleted += 1;
  }

  const closing = playBalance(state);
  const totalChange = closing.minus(opening);

  return {
    fromIso,
    toIso,
    opening: opening.toNumber(),
    closing: closing.toNumber(),
    totalChange: totalChange.toNumber(),
    // A percentage of nothing is not 0% — it is undefined; the genesis month
    // opens at zero, so the figure is suppressed rather than invented.
    totalChangePercent: opening.gt(0) ? totalChange.div(opening).mul(100).toNumber() : 0,
    sources: SOURCE_ORDER.flatMap((key) => {
      const amount = totals.get(key);
      // A zero row says nothing and adds a line to scan; absent is honest.
      return amount && !amount.isZero() ? [{ key, amount: amount.toNumber() }] : [];
    }),
    series,
    movedIntoGoals: movedIntoGoals.toNumber(),
    goalsCreated,
    cyclesCompleted,
  };
}

/** The current calendar month to date — the R1 window (P2BD-18). */
export function currentMonthWindow(nowIso: string): { fromIso: string; toIso: string } {
  const now = new Date(nowIso);
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { fromIso: from.toISOString(), toIso: now.toISOString() };
}
