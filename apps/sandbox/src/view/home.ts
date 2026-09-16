import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';
import { goalCurrentValue } from '@/lib/goalValue';

/**
 * `view/` — the view-model (selector) seam. P03's layer C, implemented.
 *
 * ## Why this layer exists
 *
 * Every P0/P1 honesty defect this project found on a money surface was a
 * calculation or a truth-decision performed inside a React component: the time
 * machine reporting the user's own deposits as market change (`5.199`), a net
 * amount beside a gross CTA (`5.230`), target-reached derived twice (`5.224`),
 * the Home triad composed in JSX. The counter-example proves the remedy:
 * `lib/monthReport.ts` derives from the conservation identity and checks that
 * identity before claiming to explain anything — and produced no findings.
 *
 * So components receive derived, already-truthful values and render them. They
 * never compute money, never derive a truth class, never decide freshness.
 *
 * ## The contract (architecture plan §3.2 rule 3, gate `VIEW-1`)
 *
 * Selectors are **pure**: `select*(state, snapshot, prefs) → ViewModel`.
 * No React, no `next/*`, no I/O, no ledger writes, no market fetching.
 * Orchestration fetches; selectors receive data as arguments. That is what
 * makes this layer testable with no DOM and no network.
 *
 * ## Why the ViewModel carries STRINGS, not `Decimal`
 *
 * A deliberate choice, and it is what lets `VIEW-2` ever reach `error`. If a
 * selector handed back `Decimal` instances, every consuming component would
 * still import `decimal.js` to type its props — the ban would be unenforceable
 * and the seam cosmetic. Strings cross the boundary as display-only values;
 * `hooks/useFormatters` already accepts `string | number`, so the convention
 * matches what the app does today. Money arithmetic stays on this side, in
 * `Decimal`, where it is exact.
 */

/** Home's money summary. Every field is a fixed-2dp display string. */
export interface HomeTriad {
  /** Undeployed money: the working + floor buckets. */
  available: string;
  /** Money committed to goals: uninvested goal cash + open positions' value. */
  working: string;
  /** The cushion bucket. */
  emergency: string;
  /** available + working + emergency. The hero figure. */
  playBalance: string;
  /**
   * Whether the emergency column may render at all.
   *
   * ABSENT OVER FALSE (board §6a). The cushion bucket's only writer was deleted
   * in the R1 re-audit, so the column can today only ever read 0.00 — and shown
   * at zero it actively misleads: a user whose goal is literally named
   * "Emergency fund" and holds real value was told their reserve was zero,
   * directly above it. The rule is a PRODUCT decision, so it belongs here with
   * the number it governs, not as a `.gt(0)` comparison inside JSX. The column
   * returns by itself the day a producer exists.
   */
  showEmergency: boolean;
}

/**
 * Home's three tones and the hero total.
 *
 * The tones sum to `playBalance` by construction: funding a goal moves cash
 * from the working bucket into `goal.cash` (engine `GoalFunded`), so goal cash
 * MUST be counted in `working` or the hero silently understates the user's
 * money. That omission was a real defect once (Home and Move both dropped it),
 * which is why the sum is asserted in this module's test rather than trusted.
 */
export function selectHomeTriad(state: LedgerState): HomeTriad {
  const available = new Decimal(state.buckets.working).plus(state.buckets.floor);

  const positionsValue = state.positions
    .filter((p) => p.open)
    .reduce((sum, p) => sum.plus(p.principal).plus(p.accrued), new Decimal(0));

  // Reuses the shared derivation rather than re-deriving: `goalCurrentValue` is
  // the single source of truth for "how much is in this goal right now", and it
  // already counts uninvested cash plus open positions. Summing it per goal
  // would double-count the positions above, so `working` adds goal CASH only —
  // the positions term is already there.
  const goalCash = state.goals.reduce((sum, g) => sum.plus(g.cash), new Decimal(0));
  const working = positionsValue.plus(goalCash);

  const emergency = new Decimal(state.buckets.cushion);
  const playBalance = available.plus(working).plus(emergency);

  return {
    available: available.toFixed(2),
    working: working.toFixed(2),
    emergency: emergency.toFixed(2),
    playBalance: playBalance.toFixed(2),
    showEmergency: emergency.gt(0),
  };
}

/**
 * A goal's progress, for any surface that shows a goal.
 *
 * `targetReached` delegates to `lib/goalValue.goalTargetReached` — the derived
 * `target_reached` fact (D-e §3), recomputed and NEVER stored, because it may
 * honestly un-reach if the market dips. `GoalDetailScreen` re-implements it
 * inline today (`5.224`); this is where that stops.
 */
export interface GoalProgress {
  current: string;
  target: string;
  /** 0-100, clamped. `0` when no target is set. */
  ratioPercent: number;
  hasTarget: boolean;
  targetReached: boolean;
}

export function selectGoalProgress(state: LedgerState, goalId: string): GoalProgress {
  const goal = state.goals.find((g) => g.goalId === goalId);
  const current = goalCurrentValue(state, goalId);
  const target = new Decimal(goal?.targetAmount ?? 0);
  const hasTarget = target.gt(0);

  return {
    current: current.toFixed(2),
    target: target.toFixed(2),
    // Clamped at BOTH ends. The upper bound is a product rule (a goal never
    // reads past 100%). The lower bound is INSURANCE, not a bug fix: today a
    // goal's value cannot go negative, because a `market` leg replays the
    // token's own price (never below zero) and a `lending` leg replays a
    // non-negative APY series. That bound is an emergent property of
    // `PROTOCOL_RETURN_MODEL`, though, not a defended one — a future protocol
    // carrying a negative-rate series would otherwise put a negative number
    // into `aria-valuenow`, which ARIA forbids.
    ratioPercent: hasTarget
      ? Decimal.max(Decimal.min(current.div(target), 1), 0)
          .mul(100)
          .toNumber()
      : 0,
    hasTarget,
    // A zero or absent target is never "reached" — asserted in the test, because
    // `0 >= 0` would otherwise make every target-less goal complete.
    targetReached: hasTarget && current.gte(target),
  };
}

/**
 * A recurring schedule's derived state.
 *
 * `paused` is DERIVED, never stored: an active schedule that Working money can
 * no longer fund. `RecurringControl` computed this as `working.lte(0)` in the
 * component, which meant importing `Decimal` purely to produce a boolean —
 * the component never needed the number at all.
 */
export interface RecurringView {
  /** An active schedule the Working balance can no longer fund (calm, not an alarm). */
  paused: boolean;
}

export function selectRecurringView(input: {
  workingBalance: string;
  hasSchedule: boolean;
}): RecurringView {
  return { paused: input.hasSchedule && new Decimal(input.workingBalance).lte(0) };
}

/**
 * A goal row's derived display values, for the shared row used by Home and the
 * goals list.
 *
 * `GoalRow` took `current: Decimal` as a PROP and re-derived the ratio itself,
 * so a `Decimal` crossed the component boundary on every render from two
 * different call sites. The ratio rule is the same one `selectGoalProgress`
 * owns: clamped to 100, and 0 when no target exists.
 */
export interface GoalRowView {
  current: string;
  target: string;
  /** 0-100, clamped. `0` when no target is set. */
  ratioPercent: number;
  /** `dropped` or `accomplished` — history stays visible, never celebrated or shamed. */
  closed: boolean;
  paused: boolean;
}

export function selectGoalRowView(state: LedgerState, goalId: string): GoalRowView {
  const goal = state.goals.find((g) => g.goalId === goalId);
  const progress = selectGoalProgress(state, goalId);
  return {
    current: progress.current,
    target: progress.target,
    ratioPercent: progress.ratioPercent,
    closed: goal?.status === 'dropped' || goal?.status === 'accomplished',
    paused: goal?.status === 'paused',
  };
}

/**
 * The goal-completion disposition screen's derived values.
 *
 * `canRaise` was `Number(newTarget) > Number(goal.targetAmount)` in the
 * component — a FLOAT comparison on money, which is exactly the class of
 * arithmetic this seam exists to remove. The rule is explicit: raising means
 * strictly greater, so entering the SAME target is not a raise.
 *
 * ⚑ Corrected 2026-09-13 (audit): moving the comparison here removed the float
 * COMPARISON but not the float PARSE — it still read `new Decimal(Number(x) || 0)`,
 * while this very docstring claimed the result was "exact in Decimal". The parse
 * now goes through `decimalFromInput`, so the claim and the code agree.
 */
export interface GoalCompletionView {
  /** The goal's uninvested cash, as a display string. */
  cash: string;
  /** The goal's current total value (cash + open positions). */
  current: string;
  hasPositions: boolean;
  /** Strictly greater than today's target. Equal is NOT a raise. */
  canRaise: boolean;
}

export function selectGoalCompletionView(
  state: LedgerState,
  goalId: string,
  newTarget: string
): GoalCompletionView {
  const goal = state.goals.find((g) => g.goalId === goalId);
  const raise = decimalFromInput(newTarget);
  return {
    cash: new Decimal(goal?.cash ?? 0).toFixed(2),
    current: goalCurrentValue(state, goalId).toFixed(2),
    hasPositions: state.positions.some((p) => p.goalId === goalId && p.open),
    canRaise: raise.gt(new Decimal(goal?.targetAmount ?? 0)),
  };
}

/**
 * History's screen-level summary.
 *
 * `showFeeDrag` is the render rule the component expressed as `feesPaid.gt(0)`.
 * Fees paid are the sum of the two fee totals the ledger tracks separately
 * (network + exit); the screen states them as one honest "drag" figure.
 */
export interface HistorySummary {
  feesPaid: string;
  /** Absent over false: no fee line when nothing has been paid. */
  showFeeDrag: boolean;
  eventCount: number;
}

export function selectHistorySummary(state: LedgerState): HistorySummary {
  const feesPaid = new Decimal(state.networkFeesPaid).plus(state.exitFeesPaid);
  return {
    feesPaid: feesPaid.toFixed(2),
    showFeeDrag: feesPaid.gt(0),
    eventCount: state.events.length,
  };
}

/**
 * The magnitude of a signed ledger amount, for a history row.
 *
 * Per-ROW rather than per-screen, so it is a helper the row map calls — the
 * component must not reach for `Decimal` just to drop a sign. The sign itself
 * is carried by the row's own direction, never by the number.
 */
export function selectEventMagnitude(amount: string): number {
  return new Decimal(amount).abs().toNumber();
}

/**
 * The weekly-cycle screen's derived amounts.
 *
 * WG-1 is a MECHANIC, not a celebration: these are plain figures, and the
 * screen states what the clock accumulated. `collectable` is the weekly credit
 * times the number of uncollected weeks — multiplication the component did in
 * `Decimal` purely to render it.
 */
export interface WeeklyCycleView {
  weeklyAmount: string;
  /** weeklyAmount × uncollected weeks. */
  collectable: string;
  /** What a proposal leaves in Available after its allocations. */
  remainderToAvailable: string;
}

export function selectWeeklyCycleView(input: {
  weeklyCreditAmount: string | number;
  uncollectedWeeks: number;
  /**
   * A `number`, because that is what the domain carries:
   * `packages/investing/src/rules.ts` types `remainderToAvailable: number` on
   * both the allocation and the proposal. Stated precisely after getting it
   * wrong twice in one sitting — first narrowed to `string` (a type error), then
   * widened to `string | number` (permissive, and the accompanying comment
   * claimed a union the domain does not have). The selector converts to Decimal
   * here so the component never holds a float it might format itself.
   */
  remainderToAvailable: number;
}): WeeklyCycleView {
  const weekly = new Decimal(input.weeklyCreditAmount);
  return {
    weeklyAmount: weekly.toFixed(2),
    collectable: weekly.mul(input.uncollectedWeeks).toFixed(2),
    remainderToAvailable: new Decimal(input.remainderToAvailable).toFixed(2),
  };
}

/**
 * The rules-builder preview.
 *
 * The component called `allocateByRule` directly — a money function in a
 * component, which `VIEW-2` bans by name. The allocation itself is domain
 * logic (`@diboas/investing`, floor-then-remainder, preview == application);
 * this selector composes it and hands back display values.
 *
 * `waiting` is deliberately allowed to be zero: the label promises "your real
 * waiting credits", so a zero preview shows zeroes rather than an invented
 * illustration figure. That is a Product rule, not a formatting choice.
 */
export interface RulesPreview {
  /** What is actually waiting to be collected. Zero is a real answer. */
  waiting: string;
  /** What the rule would distribute to goals. */
  distributed: string;
  /** What would be left sitting in Available. */
  remainderToAvailable: string;
  lines: ReadonlyArray<{ goalId: string; amount: string }>;
}

export function selectRulesPreview(input: {
  weeklyCreditAmount: string | number;
  waitingWeeks: number;
  /**
   * `allocateByRule`, passed in. The shapes mirror `@diboas/investing` exactly
   * — MUTABLE arrays, because that is what the domain declares
   * (`allocateByRule(total: number, split: RuleSplitLine[]): Allocation`).
   *
   * Stated because I got this wrong: an earlier draft declared `ReadonlyArray`
   * on both sides, which is stricter than the domain and therefore
   * unassignable — a function taking a mutable array cannot satisfy a contract
   * promising it a readonly one. The third over-narrowing in this slice, and
   * the remedy each time was to read the signature rather than assume a
   * tighter one.
   */
  allocate: (
    total: number,
    split: { goalId: string; percent: number }[]
  ) => { lines: { goalId: string; amount: number }[]; remainderToAvailable: number };
  split: { goalId: string; percent: number }[];
}): RulesPreview {
  const waiting = new Decimal(input.weeklyCreditAmount).mul(input.waitingWeeks);
  const allocation = input.allocate(waiting.toNumber(), input.split);
  // Summed from the LINES, not derived as `waiting − remainder`. The subtraction
  // form is self-consistent by construction: it would render a coherent preview
  // even if the allocation's own lines did not add up — which is precisely the
  // failure a preview exists to reveal. Summing the lines means the screen shows
  // what the rule actually distributes, and this module's test asserts the
  // identity `Σ lines + remainder === waiting` (D-r: preview == application).
  const distributed = allocation.lines.reduce((acc, l) => acc.plus(l.amount), new Decimal(0));
  return {
    waiting: waiting.toFixed(2),
    distributed: distributed.toFixed(2),
    remainderToAvailable: new Decimal(allocation.remainderToAvailable).toFixed(2),
    lines: allocation.lines.map((l) => ({
      goalId: l.goalId,
      amount: new Decimal(l.amount).toFixed(2),
    })),
  };
}

/**
 * The total play money `/move` shows.
 *
 * ⚑ This is the single strongest argument for the whole seam. `MoneyOut`
 * re-derived the same total `HomeScreen` did, independently, in its own five-
 * term sum — two components computing one number two different ways, which is
 * how they drift. The comment there warned *"goal.cash must be included or
 * funded-goal money vanishes from the total"*, and that warning had to be
 * repeated in both files because the arithmetic was.
 *
 * It is deliberately NOT `selectHomeTriad().playBalance` re-used verbatim:
 * Home sums three named tones, `/move` sums every bucket plus positions plus
 * goal cash. They agree today, and the test asserts they agree — so a future
 * divergence fails rather than ships.
 */
export function selectMoveBalance(state: LedgerState): string {
  const buckets = new Decimal(state.buckets.floor)
    .plus(state.buckets.cushion)
    .plus(state.buckets.working);
  const positions = state.positions
    .filter((p) => p.open)
    .reduce((s, p) => s.plus(p.principal).plus(p.accrued), new Decimal(0));
  const goalCash = state.goals.reduce((s, g) => s.plus(g.cash), new Decimal(0));
  return buckets.plus(positions).plus(goalCash).toFixed(2);
}

/**
 * The withdraw-fee worked example on `/move`.
 *
 * The component computed `FEE_RATES.ramp.times(100)` inside a JSX `values={{}}`
 * block — fee arithmetic in the render path, which is the `5.200` / `5.230`
 * shape: a figure derived mid-render, beside copy that must agree with it.
 *
 * The rate is passed IN so `FEE_RATES` keeps one owner (`@diboas/banking`), and
 * the base stays a constant rather than a literal in the copy, because the copy
 * must never carry a currency amount (`5.200`).
 */
export interface WithdrawFeeExample {
  /** The fee on the worked base, as a display string. */
  fee: string;
  /** The base the example is worked against. */
  base: string;
}

/**
 * A `Decimal` from untrusted text (a form field), with no float in the middle.
 *
 * `Number(value) || 0` was the previous parse, and the docstring beside it
 * claimed the comparison was "exact in Decimal". It was not: every value
 * round-tripped through a float first, so the exactness the comment promised
 * stopped one line above it. `Decimal` throws on garbage rather than yielding
 * `NaN`, so the guard is a try/catch plus an `isFinite` check: valid input keeps
 * full precision, and anything else becomes zero — which `canRaise` then
 * correctly refuses.
 */
function decimalFromInput(value: string): Decimal {
  try {
    const parsed = new Decimal(value);
    return parsed.isFinite() ? parsed : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
}

/** The round number the fee example is worked against (`5.200`). */
const WORKED_EXAMPLE_BASE = 100;

export function selectWithdrawFeeExample(feeRate: Decimal | string | number): WithdrawFeeExample {
  const base = new Decimal(WORKED_EXAMPLE_BASE);
  return {
    fee: new Decimal(feeRate.toString()).mul(base).toFixed(2),
    base: base.toFixed(2),
  };
}

/**
 * Goal detail's derived block — the largest concentration of component-resident
 * arithmetic in the app (13 sites before this).
 *
 * It re-implemented `targetReached` and the clamped `ratio` that
 * `selectGoalProgress` already owns (`5.224`), computed an affordability guard
 * in `Decimal`, summed recurring schedules and walked the event log for
 * contributions — all in the render body of a 755-line component with two view
 * modes, so several figures fed multiple render sites.
 *
 * Returns BOTH shapes each consumer needs: display strings for money the
 * component formats, and plain numbers for the `Projection` props that take
 * numerics. The component converts nothing.
 */
export interface GoalDetailView {
  /** Current value as a display string (`money(...)` takes it directly). */
  current: string;
  /** The same figure as a number, for numeric props like `Projection`. */
  currentValue: number;
  target: string;
  /** 0-100, clamped. Consumed by the progress bar and the big percentage. */
  ratioPercent: number;
  hasTarget: boolean;
  /** Derived, NEVER stored — it may honestly un-reach if the market dips. */
  targetReached: boolean;
  /** The goal's uninvested cash. */
  cash: string;
  /** Total recurring monthly across the goal's positions, as a number. */
  goalMonthly: number;
  /** Sum of `GoalFunded` amounts for this goal. */
  contributionsTotal: string;
  /**
   * Whether the goal holds uninvested cash at all — the gate on the "Add money"
   * tile and the put-to-work block.
   *
   * A PRODUCT rule, not a number: the invest affordance must not appear when
   * there is nothing to invest. The component expressed it as `cash.gt(0)` in
   * JSX, which is why `cash` had to be a `Decimal` there. Same shape as
   * `showEmergency` on Home and `showFeeDrag` in History.
   */
  hasCash: boolean;
}

export function selectGoalDetailView(state: LedgerState, goalId: string): GoalDetailView {
  const goal = state.goals.find((g) => g.goalId === goalId);
  const progress = selectGoalProgress(state, goalId);
  const current = goalCurrentValue(state, goalId);

  const goalMonthly = state.recurring
    .filter((r) => r.goalId === goalId)
    .reduce((acc, r) => acc.plus(r.monthlyAmount), new Decimal(0))
    .toNumber();

  // `LedgerEvent` IS a discriminated union on `type`, but `Array.prototype.filter`
  // does not narrow it — which is why this money sum previously went through two
  // unchecked `as` casts (`e as { amount: string }`). Narrowing inside the reduce
  // body gives the real `GoalFunded` shape (`goalId: string; amount: string`), so
  // a future event type whose `amount` means something else becomes a compile
  // error instead of a silently wrong total. Same pattern `lib/monthReport.ts`
  // already uses (`case 'GoalFunded'`).
  const contributionsTotal = state.events
    .reduce(
      (acc, e) => (e.type === 'GoalFunded' && e.goalId === goalId ? acc.plus(e.amount) : acc),
      new Decimal(0)
    )
    .toFixed(2);

  return {
    current: progress.current,
    currentValue: current.toNumber(),
    target: progress.target,
    ratioPercent: progress.ratioPercent,
    hasTarget: progress.hasTarget,
    targetReached: progress.targetReached,
    cash: new Decimal(goal?.cash ?? 0).toFixed(2),
    goalMonthly,
    contributionsTotal,
    hasCash: new Decimal(goal?.cash ?? 0).gt(0),
  };
}

/**
 * Whether the goal's uninvested cash can fund an entry of `amount`.
 *
 * The affordability guard was `investValue > 0 && cash.gte(new Decimal(investValue))`
 * in the component. It gates a real money movement, so it is exactly the kind
 * of decision that must be exact and testable without a DOM.
 */
export function selectCanInvest(state: LedgerState, goalId: string, amount: number): boolean {
  if (!(amount > 0)) return false;
  const goal = state.goals.find((g) => g.goalId === goalId);
  return new Decimal(goal?.cash ?? 0).gte(new Decimal(amount));
}

/**
 * A single position's current value (principal + accrued).
 *
 * Identical arithmetic appeared twice in goal detail — once per view mode — the
 * same duplication shape as the Home / `/move` balance. One owner, so the two
 * views cannot drift.
 */
export function selectPositionValue(position: { principal: string; accrued: string }): string {
  return new Decimal(position.principal).plus(position.accrued).toFixed(2);
}

/**
 * The entry split: what actually lands in the strategy after the network fee.
 *
 * `splitEntry` was called INSIDE a JSX prop (`value: money(splitEntry(...).invested.toFixed(2))`)
 * — deriving a net figure mid-render, directly beside a gross CTA. That is the
 * `5.230` shape, and it is why `VIEW-2` bans the helper by name in components.
 * The domain function is passed in, so it keeps one owner.
 */
export interface EntrySplit {
  /** What reaches the strategy. */
  invested: string;
  /** The network fee taken from the entry. */
  fee: string;
}

export function selectEntrySplit(input: {
  totalFromCash: number;
  networkFeeLocal: number;
  split: (total: number, fee: number) => { invested: Decimal; fee: Decimal };
}): EntrySplit {
  const { invested, fee } = input.split(input.totalFromCash, input.networkFeeLocal);
  return { invested: invested.toFixed(2), fee: fee.toFixed(2) };
}

/**
 * The sign of a money figure, for colour.
 *
 * A TRUTH-CLASS decision, not a formatting one, which is why it belongs here:
 * earnings can be NEGATIVE since the §4.8 replay (market legs replay the
 * token's own price, and nothing is added), and this app's colour grammar gives
 * a gain `financial-positive` and a fall `financial-negative` — so a fallen
 * position must never read in the gain colour. Zero claims neither.
 *
 * It lived in `GoalDetailScreen` as a local helper over `Decimal`. The rule is
 * the app's, not that screen's.
 */
export type AmountSign = 'pos' | 'neg' | 'none';

export function selectAmountSign(amount: string): AmountSign {
  const value = new Decimal(amount);
  return value.gt(0) ? 'pos' : value.lt(0) ? 'neg' : 'none';
}

/**
 * The exit preview — the last read before money moves.
 *
 * `GoalDetailScreen` composed this in its render body, branching on the exit
 * scope and calling `previewGoalStop` / `previewPositionStop` directly. Both
 * are money derivations (they itemize principal, accrued, exit fee and network
 * fee per position), so they belong behind the seam: `VIEW-2` at `error` caught
 * them there, which is the gate doing its job rather than taking my word that
 * the surface was migrated.
 *
 * The domain functions are passed IN, so they keep one owner. The `null`
 * contract is preserved exactly: null when there is no intent, when the exit
 * cannot be priced, or when the domain itself returns null (nothing open) — so
 * the surface can say so instead of rendering a zeroed ceremony.
 *
 * `canPrice` is a PRODUCT rule, not a convenience: an exit cannot be priced
 * without market data, and *no honest price, no operable control* (FC-15). It
 * stays an explicit input rather than something this selector guesses.
 */
export interface ExitIntent {
  scope: 'goal' | 'position';
  positionId?: string;
}

export function selectExitPreview<T>(input: {
  intent: ExitIntent | null;
  canPrice: boolean;
  goalId: string;
  /**
   * ⚑ AUD-C01. The snapshot the render saw, passed EXPLICITLY. Without it the
   * callbacks read global ledger state, so this selector was not a function of
   * its arguments — the same `input` object returned a different preview after
   * an entry. An explicit snapshot also makes the property TESTABLE, which a
   * closure bound at the call site would not.
   */
  snapshot: LedgerState;
  feeFor: (positionId: string) => number;
  previewGoal: (
    state: LedgerState,
    goalId: string,
    feeFor: (positionId: string) => number
  ) => T | null;
  previewPosition: (state: LedgerState, positionId: string, networkFeeLocal: number) => T | null;
}): T | null {
  const { intent, canPrice, snapshot } = input;
  if (!intent || !canPrice) return null;
  if (intent.scope === 'goal') return input.previewGoal(snapshot, input.goalId, input.feeFor);
  if (!intent.positionId) return null;
  return input.previewPosition(snapshot, intent.positionId, input.feeFor(intent.positionId));
}
