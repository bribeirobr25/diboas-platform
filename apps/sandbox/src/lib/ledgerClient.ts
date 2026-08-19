/**
 * The client-side application service over the play ledger (MVP-0: the
 * LocalStorage store per decision G-2; the Postgres store swaps in at Stage 1
 * behind the same ILedgerStore seam).
 *
 * All money math happens in the domain packages (Decimal.js); this layer only
 * composes events and publishes state to React via a tiny external store.
 */

import Decimal from 'decimal.js';
import { generateId } from './ids';
import {
  LocalStorageLedgerStore,
  computeExitFee,
  project,
  type ILedgerStore,
  type LedgerEvent,
  type LedgerState,
} from '@diboas/banking';
import { getStrategy, type ProtocolApyHistory } from '@diboas/defi';
import { blendSeries, isValidRuleSplit, type DailyApySeries, type Proposal } from '@diboas/investing';
import { planAdvance } from './advancePlanner';
import { comparisonCreditAmount, weeklyCreditAmount } from './growthConstants';
import { clearProposalDecisions, recordDecline } from './proposalStore';
import { clearSimulatedEvents, recordResolution } from './simulatedEventStore';
import { getCollectView } from './weeklyCycle';
import { Logger } from './monitoring/Logger';

type Listener = () => void;

// Memory-authoritative design (P1.2 slice 1b, plan §6.2): the in-memory `log`
// is the source of truth for reads, so `getLedgerState()` stays synchronous and
// preserves React's `useSyncExternalStore` contract even though `ILedgerStore`
// is now async. The store (LocalStorage now, Postgres in Phase 2) is touched
// only in `hydrate()` (load-once) and the write-behind persist — never in the
// render path.
let store: ILedgerStore | null = null;
let log: LedgerEvent[] = [];
let cachedState: LedgerState | null = null;
// The hydration gate (P1.2 slice 1c, plan §7): false until `hydrate()` settles
// (success OR failure), then true forever. The UI reads it via `getReady()` +
// `<LedgerReadyGate>` so no ledger-reading screen renders against an unhydrated
// log (which would tell a returning user something FALSE about their money —
// an R-4 violation). One microtask in P1.2 (LocalStorage); seconds in Phase 2
// (Neon cold-start), where the gate earns its keep.
let ready = false;
// Chained so `flush()` can await every pending write-behind persist in order.
let pendingPersist: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function getStore(): ILedgerStore {
  if (!store) store = new LocalStorageLedgerStore();
  return store;
}

function emit(): void {
  cachedState = null;
  for (const listener of listeners) listener();
}

/**
 * Load the persisted log into memory. Called at module init (§6.2 / CTO §15.5 —
 * NOT from a useEffect, so the pre-hydration window is one microtask, invisible)
 * rather than lazily, so the render path never touches the async store.
 */
async function hydrate(): Promise<void> {
  try {
    const loaded = await getStore().getAll();
    // Precision-1 (CTO §16): adopt the persisted log ONLY if nothing was
    // appended in the pre-hydration window — a late Phase-2 hydrate (seconds
    // against Neon) must never clobber events the user already created. This is
    // the STRUCTURAL no-clobber guard at the data layer, independent of the UI
    // ready-gate (belt-and-suspenders). Near-zero window in P1.2 (LocalStorage).
    if (log.length === 0) log = loaded;
  } catch (error) {
    // Fail-open: leave `log` as-is (empty, or any pre-hydration appends) rather
    // than resetting to [] — the same no-clobber contract as the success path.
    Logger.error('ledger hydrate failed — continuing with in-memory log', {}, error);
  } finally {
    // Open the gate whether hydrate succeeded or failed — a failed load still
    // means "we tried; render what we have" (fail-open, P7), never a hung gate.
    ready = true;
    emit();
  }
}
void hydrate();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLedgerState(): LedgerState {
  // Project from the in-memory log — referentially stable until the next append
  // (cached), and never awaits the store.
  if (!cachedState) cachedState = project(log);
  return cachedState;
}

/**
 * The hydration-ready snapshot for `useSyncExternalStore` (via `useLedgerReady`
 * + `<LedgerReadyGate>`). Reuses `subscribe` — `hydrate()`'s `emit()` flips this
 * from false→true exactly once. Returns a stable primitive, so it satisfies the
 * store contract without a referential cache.
 */
export function getReady(): boolean {
  return ready;
}

/**
 * Sync (CTO §15.4): actions call this and use return values synchronously
 * (`createGoal` → `router.push` + chained `enterStrategy`). The write-behind
 * persist is fire-and-forget; callers needing durability confirmation await
 * `flush()`. Write-through awaits `flush()` at commit points (persistence
 * cutover track — see below).
 */
function appendAll(events: LedgerEvent[]): void {
  for (const event of events) log.push(event);
  const s = getStore();
  pendingPersist = pendingPersist.then(async () => {
    for (const event of events) {
      try {
        await s.append(event);
      } catch (error) {
        Logger.error('ledger persist failed', { eventId: event.eventId, type: event.type }, error);
      }
    }
  });
  emit();
}

/**
 * Await all pending write-behind persists — the durability seam for §10.
 *
 * ⚠ INTENTIONAL SEAM, zero call sites by design (CTO §16.8) — do NOT delete.
 * `apps/sandbox` is already in knip (`knip.json`); this is not flagged, and the
 * write-through path (persistence cutover) calls it at commit points (manifest
 * approve).
 *
 * ⚠ CONTRACT NOTE (CTO §16, precision 2): today the persist `catch` is INSIDE
 * the loop, so `flush()` can NEVER reject — correct for 1b write-behind, but the
 * OPPOSITE of what write-through needs. The **persistence/mode cutover track**
 * (NOT this Phase-2 Grow cut, which stays on the localStorage ledger) must CHANGE
 * the semantics (let a persist failure surface here), not merely refine them.
 */
export async function flush(): Promise<void> {
  await pendingPersist;
}

function base(correlationId: string) {
  return {
    eventId: generateId(),
    simDay: getLedgerState().simDay,
    recordedAt: new Date().toISOString(),
    correlationId,
  };
}

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * The R1 claim grant (W-5a) — the ONE grant path. Emits `PlayMoneyGranted`
 * ALONE — the engine lands the full amount in `working` (= Available), so no
 * `JobsSplitSet` is needed; allocation into jobs happens later via the D-r
 * flow, not at the grant. (`grantAndSplit`, the MVP-0 first-run emitter of the
 * product-deprecated `JobsSplitSet`, was deleted with that chain in the R1
 * audit cleanup 2026-08-18 — the engine keeps its replay case forever, D-r §2.)
 *
 * One-grant guard (plan §7): once-per-ledger. `<LedgerReadyGate>` keeps `(app)`
 * screens from mounting before hydrate, but this closes the window
 * structurally — a double-fire (fast double-tap, a stray remount) can never
 * mint a second grant that `reconcile()` could not catch. Idempotent no-op
 * once initialized.
 */
export function grantPlayMoney(
  amount: number,
  currency: 'USD' | 'BRL' | 'EUR',
  mode: 'b2c' | 'b2b'
): void {
  if (getLedgerState().initialized) return;
  const correlationId = generateId();
  appendAll([
    {
      ...base(correlationId),
      type: 'PlayMoneyGranted',
      amount: new Decimal(amount).toFixed(2),
      currency,
      mode,
    },
  ]);
}

export function createGoal(input: {
  name: string;
  icon: string;
  targetAmount: number;
  horizonMonths: number;
  fundAmount: number;
}): string {
  const goalId = generateId();
  const correlationId = generateId();
  const events: LedgerEvent[] = [
    {
      ...base(correlationId),
      type: 'GoalCreated',
      goalId,
      name: input.name.trim(),
      icon: input.icon,
      targetAmount: new Decimal(input.targetAmount).toFixed(2),
      horizonMonths: input.horizonMonths,
    },
  ];
  if (input.fundAmount > 0) {
    events.push({
      ...base(correlationId),
      type: 'GoalFunded',
      goalId,
      amount: new Decimal(input.fundAmount).toFixed(2),
    });
  }
  appendAll(events);
  return goalId;
}

/**
 * The exact Decimal split of a committed total into (fee, invested), so that
 * fee + invested == total to the cent. The manifest display and the ledger
 * event both use this — what you read is exactly what happens (no independent
 * float rounding that could drift and trip the engine's cash guard). Fee is
 * clamped so it never exceeds the total.
 */
export function splitEntry(
  totalFromCash: number,
  networkFeeLocal: number
): { total: Decimal; fee: Decimal; invested: Decimal } {
  const total = new Decimal(totalFromCash).toDecimalPlaces(2);
  const fee = Decimal.min(new Decimal(networkFeeLocal).toDecimalPlaces(2), total);
  return { total, fee, invested: total.minus(fee) };
}

/**
 * Enter a strategy. The caller passes the TOTAL committed from goal cash and
 * the network fee; the invested amount is derived in Decimal (see splitEntry),
 * so `amount + networkFee` equals the total EXACTLY.
 */
export function enterStrategy(input: {
  goalId: string;
  strategyId: string;
  totalFromCash: number;
  networkFeeLocal: number;
}): string {
  const positionId = generateId();
  const { fee, invested } = splitEntry(input.totalFromCash, input.networkFeeLocal);
  appendAll([
    {
      ...base(generateId()),
      type: 'StrategyEntered',
      goalId: input.goalId,
      positionId,
      strategyId: input.strategyId,
      amount: invested.toFixed(2),
      networkFee: fee.toFixed(2),
    },
  ]);
  return positionId;
}

/**
 * The time machine: advance simulated days, replaying real APY history onto
 * every open position (blended by the strategy's allocation weights).
 *
 * When a position carries a recurring schedule (C3), its accrual is replayed in
 * SEGMENTS split at each monthly deposit day, so each contribution compounds
 * from its own day (an annuity replay). Every segment passes the GLOBAL `toDay`
 * as `anchorDay` to `replayEarnings` (A-1) — segment slices are then contiguous
 * and their union equals the single-call slice. Deposits are bounded by the
 * shared Working pool, granted in strict day order across all positions (a
 * partial last deposit, then paused). A move within the reconciliation `held`
 * set → the invariant holds by construction.
 */
export function advanceTime(
  days: number,
  histories: ProtocolApyHistory[],
  source: 'real' | 'machine' = 'machine'
): void {
  const state = getLedgerState();
  const toDay = state.simDay + days;
  const byProtocol = new Map(histories.map((h) => [h.protocolId, h]));
  const correlationId = generateId();
  const open = state.positions.filter((p) => p.open);

  // Blended real-APY series per open position (built once, reused per segment).
  const blendedByPosition = new Map<string, DailyApySeries>();
  for (const position of open) {
    const strategy = getStrategy(position.strategyId);
    if (!strategy) continue;
    const legs = strategy.allocation.map((leg) => {
      const history = byProtocol.get(leg.protocolId);
      const series: DailyApySeries = {
        points: history ? history.points.map((p) => p.apyPercent) : [0],
        source: history?.stamp.source === 'defillama' ? 'defillama' : 'fixture',
      };
      return { weightPercent: leg.weightPercent, series };
    });
    blendedByPosition.set(position.positionId, blendSeries(legs));
  }

  // The money-moving logic lives in the pure planner (unit tested); this layer
  // only supplies the store-derived inputs and the event stamps.
  const events = planAdvance({
    positions: open.map((p) => ({
      positionId: p.positionId,
      goalId: p.goalId,
      principal: p.principal,
      accrued: p.accrued,
      accruedThroughSimDay: p.accruedThroughSimDay,
    })),
    schedules: state.recurring,
    workingStart: state.buckets.working,
    blendedByPosition,
    toDay,
    days,
    source,
    stamp: () => base(correlationId),
  });
  appendAll(events);
}

/**
 * Set, change, or clear (monthlyAmount = 0) a recurring monthly contribution on
 * an open position. Real play money from Working, auto-invested each due month
 * as the shared clock advances (C3). `startSimDay` = today's sim day → the first
 * deposit lands 30 sim-days later.
 */
export function setRecurring(input: {
  goalId: string;
  positionId: string;
  monthlyAmount: number;
}): void {
  appendAll([
    {
      ...base(generateId()),
      type: 'RecurringSet',
      goalId: input.goalId,
      positionId: input.positionId,
      monthlyAmount: new Decimal(input.monthlyAmount).toFixed(2),
      startSimDay: getLedgerState().simDay,
    },
  ]);
}

export function exitPosition(input: { positionId: string; networkFeeLocal: number }): void {
  const state = getLedgerState();
  const position = state.positions.find((p) => p.positionId === input.positionId);
  if (!position || !position.open) return;
  const gross = new Decimal(position.principal).plus(position.accrued);
  const exitFee = computeExitFee(gross, state.currency);
  appendAll([
    {
      ...base(generateId()),
      type: 'StrategyExited',
      positionId: position.positionId,
      goalId: position.goalId,
      grossAmount: gross.toFixed(2),
      exitFee: exitFee.toFixed(2),
      networkFee: new Decimal(input.networkFeeLocal).toFixed(2),
    },
  ]);
}

/**
 * Preview the full exit numbers for the manifest (no event appended). The
 * shared exit-preview primitive for BOTH the goal-detail exit manifest and
 * G3's "also stop" / G7's ceremony (Step-0 item 7). `previewExit` has no
 * market/gas access of its own (board §8.1a), so the caller passes the network
 * fee it computes via `networkFeeLocal(market.gas, entryChain, usdPriceLocal)`;
 * this returns the whole itemization incl. `net` (what actually lands back in
 * the goal after both fees).
 */
export function previewExit(
  positionId: string,
  networkFeeLocal: number
): { gross: string; exitFee: string; networkFee: string; net: string } | null {
  const state = getLedgerState();
  const position = state.positions.find((p) => p.positionId === positionId);
  if (!position || !position.open) return null;
  const gross = new Decimal(position.principal).plus(position.accrued);
  const exitFee = computeExitFee(gross, state.currency);
  const networkFee = new Decimal(networkFeeLocal);
  const net = gross.minus(exitFee).minus(networkFee);
  return {
    gross: gross.toFixed(2),
    exitFee: exitFee.toFixed(2),
    networkFee: networkFee.toFixed(2),
    net: net.toFixed(2),
  };
}

// ── §2.3 weekly cycle (WG-1 + D-r §3) ───────────────────────────────────────

/**
 * Create THE rule (one active per account, W-19a) — the G9 builder's emitter
 * seam, exercised by the §2.3 ceremony tests until that screen lands. Returns
 * the ruleId, or null when the split is invalid or a live rule already exists
 * (creating anew = editing; the UI goes through `updateRule`).
 */
export function createRule(split: { goalId: string; percent: number }[]): string | null {
  const state = getLedgerState();
  if (!state.initialized || !isValidRuleSplit(split)) return null;
  if (state.rules.some((r) => r.status !== 'deleted')) return null;
  const ruleId = generateId();
  appendAll([{ ...base(generateId()), type: 'RuleCreated', ruleId, split }]);
  return ruleId;
}

/** Edit the rule's split — versioned (regenerate-and-mark rides the derivation, W-19b). */
export function updateRule(
  ruleId: string,
  split: { goalId: string; percent: number }[],
  expectedRuleVersion: number
): void {
  if (!isValidRuleSplit(split)) return;
  appendAll([{ ...base(generateId()), type: 'RuleUpdated', ruleId, split, expectedRuleVersion }]);
}

/**
 * The explicit Collect tap (W-5b): grant every collectible week as its own
 * idempotent `WeeklyCreditGranted`. The ceiling is checked at the tap (calm
 * pause, FT-19); the engine's per-week guard makes a double-tap harmless even
 * beyond the synchronous in-memory log. Returns what happened so the surface
 * can narrate it honestly.
 */
export function collectWeeklyCredits(nowIso = new Date().toISOString()): {
  granted: number[];
  ceilingPaused: boolean;
} {
  const state = getLedgerState();
  if (!state.initialized) return { granted: [], ceilingPaused: false };
  const view = getCollectView(state, nowIso);
  if (view.ceilingPaused || view.weeks.length === 0)
    return { granted: [], ceilingPaused: view.ceilingPaused };
  const amount = new Decimal(weeklyCreditAmount(state.mode)).toFixed(2);
  const correlationId = generateId();
  appendAll(
    view.weeks.map((week) => ({
      ...base(correlationId),
      type: 'WeeklyCreditGranted' as const,
      week,
      amount,
    }))
  );
  return { granted: view.weeks, ceilingPaused: false };
}

/**
 * The one-time W-5c comparison credit. The engine enforces both covenant
 * guards (once per ledger, only after the first strategy entry); this mirrors
 * them so the caller learns synchronously whether anything happened. The offer
 * SURFACE (never pre-announced, never a reward — the binding framing rules)
 * rides the §4 screens.
 */
export function grantComparisonCredit(): boolean {
  const state = getLedgerState();
  if (!state.initialized || state.comparisonCredited || state.positions.length === 0) return false;
  appendAll([
    {
      ...base(generateId()),
      type: 'ComparisonCreditGranted',
      amount: new Decimal(comparisonCreditAmount(state.mode)).toFixed(2),
    },
  ]);
  return true;
}

export type ApplyProposalResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'staleRuleVersion'
        | 'destinationChanged'
        | 'repairNeeded'
        | 'alreadyApplied'
        | 'insufficientAvailable';
    };

/**
 * Approve a proposal (the W-8 ceremony's commit): `RuleApplied` + a
 * `GoalFunded` leg per fundable line, one correlationId — the remainder stays
 * in Available with no event. Fail-safe re-present on every guard (D-r §3/§7):
 * - version-safety: the approval NEVER applies a rule version other than the
 *   one displayed (the domain's most important invariant);
 * - RT-G3: destinations re-validated at approval — a goal paused/dropped since
 *   generation means the state changed under the user; re-present, never apply;
 * - week-set idempotency: an already-applied week can't settle twice (the
 *   synchronous in-memory log closes the double-tap window);
 * - repair: a repair-flagged proposal needs the user's re-shape first.
 * `adjustedLines` = the adjust-this-once path (rule untouched; edited amounts
 * apply, recorded on the proposal by the caller). Amounts are validated to
 * conserve: integers ≥ 0 over the proposal's own fundable destinations, sum ≤
 * the proposal total.
 */
export function applyRuleProposal(
  proposal: Proposal,
  adjustedLines?: { goalId: string; amount: number }[]
): ApplyProposalResult {
  const state = getLedgerState();
  if (proposal.repairNeeded) return { ok: false, reason: 'repairNeeded' };
  const rule = state.rules.find((r) => r.ruleId === proposal.ruleId && r.status === 'active');
  if (!rule || rule.ruleVersion !== proposal.ruleVersion)
    return { ok: false, reason: 'staleRuleVersion' };
  const applied = new Set<number>();
  for (const e of state.events) {
    if (e.type === 'RuleApplied') for (const w of e.weekSet) applied.add(w);
  }
  if (proposal.weekSet.some((w) => applied.has(w))) return { ok: false, reason: 'alreadyApplied' };

  const fundable = proposal.lines.filter((l) => !l.pausedDiversion);
  let lines = fundable;
  if (adjustedLines) {
    const allowed = new Set(fundable.map((l) => l.goalId));
    const total = fundable.reduce((s, l) => s + l.amount, 0) + proposal.remainderToAvailable;
    const valid =
      adjustedLines.every(
        (l) => allowed.has(l.goalId) && Number.isInteger(l.amount) && l.amount >= 0
      ) &&
      new Set(adjustedLines.map((l) => l.goalId)).size === adjustedLines.length &&
      adjustedLines.reduce((s, l) => s + l.amount, 0) <= total;
    if (!valid) return { ok: false, reason: 'destinationChanged' };
    lines = adjustedLines;
  }
  // RT-G3: every destination must still be an ACTIVE goal at approval time.
  const statusById = new Map(state.goals.map((g) => [g.goalId, g.status]));
  if (lines.some((l) => statusById.get(l.goalId) !== 'active'))
    return { ok: false, reason: 'destinationChanged' };
  // Available re-validation (2026-08-19 audit fix): the engine's GoalFunded
  // case silently skips an unaffordable leg — an approval must therefore never
  // emit legs Available can't cover, or "approved" would move nothing while
  // marking the weeks applied. Fail-safe re-present instead (the derivation
  // caps at Available, so a regenerated proposal is always applyable).
  const fundTotal = lines.reduce((s, l) => s + l.amount, 0);
  if (new Decimal(state.buckets.working).lt(fundTotal))
    return { ok: false, reason: 'insufficientAvailable' };

  const correlationId = generateId();
  const events: LedgerEvent[] = [
    {
      ...base(correlationId),
      type: 'RuleApplied',
      ruleId: proposal.ruleId,
      ruleVersion: proposal.ruleVersion,
      proposalId: proposal.proposalId,
      weekSet: proposal.weekSet,
    },
  ];
  for (const line of lines) {
    if (line.amount <= 0) continue;
    events.push({
      ...base(correlationId),
      type: 'GoalFunded',
      goalId: line.goalId,
      amount: new Decimal(line.amount).toFixed(2),
    });
  }
  appendAll(events);
  return { ok: true };
}

/** Decline a proposal: nothing moves, credits stay in Available, no nag — only the decline is remembered (P2BD-11). */
export function declineProposal(proposal: Proposal): void {
  recordDecline(proposal.weekSet);
}

// ── §2.4 D-s simulated events ───────────────────────────────────────────────

export type ResolveExpenseResult =
  | { ok: true }
  | { ok: false; reason: 'alreadyResolved' | 'notAffordable' };

/**
 * Resolve the R1 unexpected-expense event with the user's chosen path (after
 * the W-7 confirm — this is the commit, not the offer). Affordability is
 * RE-validated here (the balance may have changed since the impact preview —
 * fail-safe re-present, never a negative balance):
 * - `available`: one `SimulatedExpensePaid` from Available;
 * - `reserve`: `GoalCashReleased` (the full amount, from the chosen goal) +
 *   the expense debit, one correlationId — "the reserve did its job".
 * Idempotent per `eventInstanceId` (engine guard + the platform record).
 * The platform-side choice record (catalogue-version-pinned) rides along.
 */
export function resolveSimulatedExpense(input: {
  eventInstanceId: string;
  eventType: string;
  amount: number;
  via: { path: 'available' } | { path: 'reserve'; goalId: string };
}): ResolveExpenseResult {
  const state = getLedgerState();
  if (!state.initialized || state.resolvedEventInstances.includes(input.eventInstanceId))
    return { ok: false, reason: 'alreadyResolved' };
  const amount = new Decimal(input.amount);
  if (amount.lte(0)) return { ok: false, reason: 'notAffordable' };
  const correlationId = generateId();
  const events: LedgerEvent[] = [];

  if (input.via.path === 'reserve') {
    const reserveGoalId = input.via.goalId;
    const goal = state.goals.find((g) => g.goalId === reserveGoalId);
    const usable = goal && (goal.status === 'active' || goal.status === 'paused');
    if (!usable || new Decimal(goal.cash).lt(amount)) return { ok: false, reason: 'notAffordable' };
    events.push({
      ...base(correlationId),
      type: 'GoalCashReleased',
      goalId: goal.goalId,
      amount: amount.toFixed(2),
      expectedVersion: goal.version,
    });
  } else if (new Decimal(state.buckets.working).lt(amount)) {
    return { ok: false, reason: 'notAffordable' };
  }

  events.push({
    ...base(correlationId),
    type: 'SimulatedExpensePaid',
    eventInstanceId: input.eventInstanceId,
    amount: amount.toFixed(2),
    source: 'system',
  });
  appendAll(events);
  recordResolution({
    eventInstanceId: input.eventInstanceId,
    eventType: input.eventType,
    choice: input.via.path === 'reserve' ? 'useReserve' : 'coverFromAvailable',
    resolvedAt: new Date().toISOString(),
  });
  return { ok: true };
}

export function resetSandbox(): void {
  clearProposalDecisions();
  clearSimulatedEvents();
  log = [];
  pendingPersist = pendingPersist
    .then(() => getStore().clear())
    .catch((error) => Logger.error('ledger clear failed', {}, error));
  emit();
}
