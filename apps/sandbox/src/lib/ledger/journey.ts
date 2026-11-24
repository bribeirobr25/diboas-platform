/**
 * Core-journey actions (P2BD-4 extraction): grant, goals, strategy entry/exit,
 * the time machine, recurring. Composed over the `ledger/core` seam; consumed
 * via the `ledgerClient` barrel. Since S1a (plan P12) each command is an ADAPTER:
 * its rule is a pure decision in `decide/journey.ts`, and this file keeps the
 * command's name and signature and does the writing. `advanceTime` moves in PR-3.
 */

import Decimal from 'decimal.js';
import { computeExitFee, type LedgerState } from '@diboas/banking';
import {
  PROTOCOL_RETURN_MODEL,
  getStrategy,
  type ProtocolApyHistory,
  type ProtocolPriceHistory,
  type StrategyId,
} from '@diboas/defi';
import { planAdvance, type PositionLeg } from '../advancePlanner';
import { generateId } from '../ids';
import { browserContext } from './browserContext';
import { appendAll, base, getLedgerState } from './core';
import {
  decideAccomplishGoal,
  decideCreateGoal,
  decideEnterStrategy,
  decideExitPosition,
  decideGrantPlayMoney,
  decidePauseGoal,
  decideRaiseGoalTarget,
  decideResumeGoal,
  decideSetRecurring,
  decideStopGoalStrategies,
  decideTransferGoalCash,
} from './decide/journey';
import { feeInCents, splitEntry } from './decide/fees';
import type { Decision } from './decide/types';

export { splitEntry };

/** Writes what a decision decided and returns its result (the adapter's whole job). */
function apply<R>(decision: Decision<R, string>): R {
  if (decision.append) appendAll(decision.append);
  return decision.result;
}

/** The R1 claim grant (W-5a), once per ledger. Decision: `decideGrantPlayMoney`. */
export function grantPlayMoney(
  amount: number,
  currency: 'USD' | 'BRL' | 'EUR',
  mode: 'b2c' | 'b2b'
): void {
  apply(decideGrantPlayMoney({ amount, currency, mode }, browserContext));
}

/** Pause a goal's PLAN (G3, W-17d): a zero-value transition. Decision: `decidePauseGoal`. */
export function pauseGoal(goalId: string): void {
  apply(decidePauseGoal(goalId, browserContext));
}

/** Resume a paused goal's plan. Decision: `decideResumeGoal`. */
export function resumeGoal(goalId: string): void {
  apply(decideResumeGoal(goalId, browserContext));
}

/** Close a reached goal by the user's disposition (G4 / D-e §3). Decision: `decideAccomplishGoal`. */
export function accomplishGoal(
  goalId: string,
  disposition: 'kept-working' | 'held-as-cash' | 'transferred'
): void {
  apply(decideAccomplishGoal({ goalId, disposition }, browserContext));
}

/** "Move to another goal" (G4): release, fund, close, one correlationId. Decision: `decideTransferGoalCash`. */
export function transferGoalCash(fromGoalId: string, toGoalId: string): void {
  apply(decideTransferGoalCash({ fromGoalId, toGoalId }, browserContext));
}

/** "Raise the target" (G4), from the raw input string (AUD-E01). Decision: `decideRaiseGoalTarget`. */
export function raiseGoalTarget(goalId: string, newTarget: string): void {
  apply(decideRaiseGoalTarget({ goalId, newTarget }, browserContext));
}

/** Create a goal; an unaffordable funding leg is withheld. Decision: `decideCreateGoal`. */
export function createGoal(input: {
  name: string;
  icon: string;
  targetAmount: number;
  horizonMonths: number;
  fundAmount: number;
}): string {
  return apply(decideCreateGoal(input, browserContext));
}

/** Enter a strategy with the whole committed total (`5.403`, schema v2). Decision: `decideEnterStrategy`. */
export function enterStrategy(input: {
  goalId: string;
  /** A CATALOGUE id, not a free string (a typo is a compile error). */
  strategyId: StrategyId;
  totalFromCash: number;
  networkFeeLocal: number;
}): string {
  return apply(decideEnterStrategy(input, browserContext));
}

/**
 * The time machine: advance simulated days, replaying real APY history onto
 * every open position (blended by the strategy's allocation weights).
 *
 * Accrual is replayed in SEGMENTS on the merged monthly grid
 * (`accrualSegmentDays`: the 30-day cadence unioned with this position's
 * deposit days), so each contribution compounds from its own day (an annuity
 * replay) AND a plan-less advance still produces a real path rather than one
 * year-long jump. Every segment passes the GLOBAL `toDay` as `anchorDay`
 * (A-1) — segment slices are then contiguous and their union equals the
 * single-call slice. Deposits are bounded by the
 * shared Working pool, granted in strict day order across all positions (a
 * partial last deposit, then paused). A move within the reconciliation `held`
 * set → the invariant holds by construction.
 */
export function advanceTime(
  days: number,
  histories: ProtocolApyHistory[],
  source: 'real' | 'machine' = 'machine',
  priceHistories: ProtocolPriceHistory[] = []
): void {
  const state = getLedgerState();
  const toDay = state.simDay + days;
  const byProtocol = new Map(histories.map((h) => [h.protocolId, h]));
  const priceByProtocol = new Map(priceHistories.map((h) => [h.protocolId, h]));
  const correlationId = generateId();
  const open = state.positions.filter((p) => p.open);

  // Per-position LEGS (§4.8 G8), built once and reused for every segment.
  //
  // The leg's kind decides what gets replayed: a `lending` leg replays its APY
  // series, a `market` leg replays the token's own PRICE series with nothing
  // added on top. That second case is what finally lets a growth position FALL
  // — APY series are non-negative, so before this the money could only ever go
  // up, which is the most dangerous lesson a practice app can teach.
  const legsByPosition = new Map<string, PositionLeg[]>();
  /** Catalog-resolved positions, replayable or not (batch D — see the planner). */
  const catalogPositions = new Set<string>();
  for (const position of open) {
    const strategy = getStrategy(position.strategyId);
    if (!strategy) continue;
    /**
     * ⚑ I-G1d (`5.105`). A leg with NO history is UNAVAILABLE, not flat.
     *
     * This used to substitute `[1]` for a missing price series and `[0]` for a
     * missing APY series, so the leg silently held its value — "invented data
     * wearing a fixture stamp", as the interim test that pinned it said. The
     * consequence was worst exactly where it mattered: a growth position whose
     * price feed was missing could not fall, which is the one lesson a practice
     * app must never teach.
     *
     * `null` here means "this position cannot be replayed for this span". Time
     * still advances, its DEPOSITS still fire and the trail is still written —
     * what does NOT happen is an accrual claiming earnings nobody can evidence.
     * MISSING is not zero, and it is not flat either.
     *
     * ⚑ The deposits only survive because of batch D: this position is omitted
     * from `legsByPosition` but recorded in `catalogPositions`, and the planner
     * gates its Working reservation on the latter. An earlier revision of this
     * comment claimed "deposits still fire" while the planner still gated them
     * on `legsByPosition` — it did not, and `ledgerClient`'s paused-goal test
     * caught it. The two maps must both be passed for this to stay true.
     */
    const legs: (PositionLeg | null)[] = strategy.allocation.map((leg) => {
      const model = PROTOCOL_RETURN_MODEL[leg.protocolId];
      if (model.kind === 'market') {
        const history = priceByProtocol.get(leg.protocolId);
        if (!history || history.points.length === 0) return null;
        return {
          kind: 'market',
          weightPercent: leg.weightPercent,
          price: {
            points: history.points.map((p) => p.priceUsd),
            /* I-G1a: the dates ride along instead of being discarded here —
               dropping them is what left the replay unable to anchor to a
               calendar window (5.105). */
            dates: history.points.map((p) => p.date),
            /* `5.440` · record the source, do not re-derive it from its name.
               This read `stamp.source === 'coingecko' ? 'coingecko' : 'fixture'`
               — a coercion that would have written 'fixture' for any SUBSTITUTED
               provider's genuinely live series, i.e. a false provenance record
               in an append-only event. The stamp already says what it is. */
            source: history.stamp.source,
          },
        };
      }
      const history = byProtocol.get(leg.protocolId);
      if (!history || history.points.length === 0) return null;
      return {
        kind: 'lending',
        weightPercent: leg.weightPercent,
        apy: {
          points: history.points.map((p) => p.apyPercent),
          /* I-G1a — see the market leg above. `ApyPoint` carries `date`. */
          dates: history.points.map((p) => p.date),
          /* `5.440` — see the market leg above. */
          source: history.stamp.source,
        },
      };
    });
    /* The STRATEGY resolved, so this position is catalog-valid and still owes
       its recurring deposits even when it cannot be replayed (batch D). Recorded
       BEFORE the all-or-nothing check below, which is about replayability only. */
    catalogPositions.add(position.positionId);
    /* All-or-nothing per POSITION (Strategy/M&E §7: PARTIALLY-EVIDENCED POSITION
       = WHOLE-POSITION REPLAY UNAVAILABLE). A partially-replayable position would
       report some legs' movement as the whole position's, understating or
       overstating by the missing legs' weight — and "do not present evidenced
       minority legs as the whole-position result" is explicit. Omitting it from
       this map is the "cannot replay" path; the planner still emits its
       deposits because `catalogPositions` holds it. */
    if (legs.some((l) => l === null)) continue;
    legsByPosition.set(position.positionId, legs as PositionLeg[]);
  }

  /**
   * The replay's calendar window (`5.105`, I-G1c).
   *
   * A `machine` advance replays HISTORY, so it must continue where the previous
   * machine advance stopped. The epoch is pinned once — the oldest date the
   * first advance's series actually carried — and where the next window starts is
   * derived (`simDay − realSettledDays` = machine days already advanced). That is the
   * CALENDAR position; each position's own walk starts at the first day of the advance
   * (`advancePlanner.ts`, lane audit 2026-10-21 B1/B5).
   *
   * A `real` advance gets NO window: real elapsed days correspond to the newest
   * real days, which is exactly what the historic anchoring gives.
   */
  const oldestDate = (() => {
    /**
     * The epoch must be a day the corpus can actually replay FROM — not merely
     * the oldest date it mentions.
     *
     * ⚑ CORRECTED 2026-09-16, and this is why it matters. A PRICE factor is
     * `price[d] / price[d-1]`, so a price series' oldest REPLAYABLE day is its
     * SECOND date; there is no day before its first. Anchoring the epoch to the
     * oldest date therefore made the first segment of every market replay
     * uncoverable. That went unnoticed for as long as an uncoverable window fell
     * back to historic anchoring — the segment replayed a recent tail instead,
     * and nothing said so. Once the refusal landed (`5.105` §2/§3) it surfaced
     * immediately as a refused first span.
     *
     * And it is the LATEST of the per-series oldest-replayable days, never the
     * earliest: §2 requires the window to be coverable by EVERY economically
     * material leg, so an epoch one series cannot reach is an epoch that refuses
     * the whole position.
     */
    const oldestReplayable: string[] = [];
    const dated = (points: Array<{ date?: string }>) =>
      points
        .map((p) => p.date)
        .filter((d): d is string => typeof d === 'string' && d.length > 0)
        .sort();
    for (const h of histories) {
      const ds = dated(h.points);
      if (ds.length > 0) oldestReplayable.push(ds[0]);
    }
    for (const h of priceHistories) {
      const ds = dated(h.points);
      // A single dated price point can never yield a factor.
      if (ds.length > 1) oldestReplayable.push(ds[1]);
    }
    return oldestReplayable.length > 0 ? oldestReplayable.sort().at(-1) : undefined;
  })();
  const epoch = source === 'machine' ? (state.replayEpoch ?? oldestDate) : undefined;
  const machineDaysBefore = state.simDay - state.realSettledDays;
  const windowStartDate = (() => {
    if (epoch === undefined) return undefined;
    const d = new Date(`${epoch}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + machineDaysBefore);
    return d.toISOString().slice(0, 10);
  })();

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
    // G3/W-17d: a paused goal's schedules are INERT while paused (the pause
    // sheet says "stops your weekly plan" — auto-deposits must honor that or
    // the copy lies). Derived, not stored: resume re-activates them untouched.
    schedules: state.recurring.filter((r) => {
      const goal = state.goals.find((g) => g.goalId === r.goalId);
      return goal ? goal.status === 'active' : false;
    }),
    workingStart: state.buckets.working,
    legsByPosition,
    catalogPositions,
    toDay,
    days,
    source,
    windowStartDate,
    /* `5.105` §2/§3: an undated corpus produces no epoch (empty dates are
       filtered out of `oldestDate` above), and for a MACHINE advance that is an
       evidence statement, not a configuration choice — so the planner refuses
       the span and discloses it instead of replaying a recent month. A `real`
       settle needs no window at all and never refuses. */
    calendarEvidence: source === 'machine' && epoch === undefined ? 'none' : 'present',
    stamp: () => base(correlationId),
  });
  /* Pin the epoch on the first machine advance so every later one continues the
     same window. `state.replayEpoch` already set ⇒ nothing to pin. */
  const pin =
    source === 'machine' && state.replayEpoch === null && epoch !== undefined
      ? { replayEpoch: epoch }
      : {};
  appendAll(events.map((e) => (e.type === 'TimeAdvanced' ? { ...e, ...pin } : e)));
}

/**
 * Set, change, or clear (monthlyAmount = 0) a recurring monthly contribution on
 * an open position (C3). Decision: `decideSetRecurring`.
 */
export function setRecurring(input: {
  goalId: string;
  positionId: string;
  monthlyAmount: number;
}): void {
  apply(decideSetRecurring(input, browserContext));
}

/** Exit one open position; both fees are modelled information. Decision: `decideExitPosition`. */
export function exitPosition(input: { positionId: string; networkFeeLocal: number }): void {
  apply(decideExitPosition(input, browserContext));
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
  /**
   * ⚑ AUD-C01. This read `getLedgerState()` itself, which made every preview
   * built on it a function of the CLOCK rather than of its arguments: the same
   * `input` object handed to `selectExitPreview` twice, with an entry in
   * between, returned 100.00 then 200.00. A PREVIEW must describe the state the
   * render saw. Commands (`exitPosition`, `stopGoalStrategies`) still read
   * current state on purpose — they act on now, not on a snapshot.
   */
  state: LedgerState,
  positionId: string,
  networkFeeLocal: number
): { gross: string; exitFee: string; networkFee: string; net: string } | null {
  const position = state.positions.find((p) => p.positionId === positionId);
  if (!position || !position.open) return null;
  const gross = new Decimal(position.principal).plus(position.accrued);
  const exitFee = computeExitFee(gross, state.currency);
  const networkFee = feeInCents(networkFeeLocal);
  /**
   * `5.403` — `net` is what ACTUALLY comes back, and in Practice that is the
   * whole gross: the exit and network fees are modelled cost, shown on their own
   * rows, deducted from nothing. The ceremony's approved label for this figure is
   * *"What actually comes back"*, so it must carry the amount the ledger really
   * credits or the confirmation surface would state a number the transaction
   * contradicts — the FC-15 breakage this file's own rounding comment exists to
   * prevent. The fee figures are unchanged, including the per-position floor.
   */
  return {
    gross: gross.toFixed(2),
    exitFee: exitFee.toFixed(2),
    networkFee: networkFee.toFixed(2),
    net: gross.toFixed(2),
  };
}

/** One position's line in an exit ceremony (G7 itemization, FC-15). */
export interface ExitLine {
  positionId: string;
  strategyId: string;
  gross: string;
  exitFee: string;
  networkFee: string;
  net: string;
}

/** The composed preview for stopping N positions (board §3.3). */
export interface StopPreview {
  lines: ExitLine[];
  gross: string;
  exitFee: string;
  networkFee: string;
  net: string;
}

/**
 * Compose an itemized stop preview over the given open positions (G7, board
 * §3.3). Both the single-position and whole-goal ceremonies run through here,
 * so the two can never drift into different arithmetic.
 *
 * Why per-position matters: `computeExitFee` applies the $0.25 floor PER
 * position, so stopping three small positions really does cost three floors.
 * A total computed on the summed gross would understate the true cost, and N
 * network fees would vanish behind one line. Both are exactly the fee-truth
 * breakage G7 exists to prevent.
 */
function composeStop(
  state: LedgerState,
  positions: { positionId: string; strategyId: string }[],
  feeFor: (positionId: string) => number
): StopPreview | null {
  const lines: ExitLine[] = [];
  let gross = new Decimal(0);
  let exitFee = new Decimal(0);
  let networkFee = new Decimal(0);
  for (const position of positions) {
    const preview = previewExit(state, position.positionId, feeFor(position.positionId));
    if (!preview) continue;
    lines.push({
      positionId: position.positionId,
      strategyId: position.strategyId,
      ...preview,
    });
    gross = gross.plus(preview.gross);
    exitFee = exitFee.plus(preview.exitFee);
    networkFee = networkFee.plus(preview.networkFee);
  }
  if (lines.length === 0) return null;
  return {
    lines,
    gross: gross.toFixed(2),
    exitFee: exitFee.toFixed(2),
    networkFee: networkFee.toFixed(2),
    /* `5.403`: the composed total mirrors `previewExit` — the money that comes
       back is the summed gross; the fee totals stay itemized information. */
    net: gross.toFixed(2),
  };
}

/** Open positions of a goal, in ledger order (the stop set). */
function openPositionsOf(state: LedgerState, goalId: string) {
  return state.positions.filter((p) => p.goalId === goalId && p.open);
}

/**
 * Preview stopping ONE position — the ceremony's single-position case. Returns
 * the same shape as the goal-level preview so the surface never branches on
 * which entry point opened it. Null when the position is closed or unknown.
 */
export function previewPositionStop(
  state: LedgerState,
  positionId: string,
  networkFeeLocal: number
): StopPreview | null {
  const position = state.positions.find((p) => p.positionId === positionId && p.open);
  if (!position) return null;
  return composeStop(state, [position], () => networkFeeLocal);
}

/**
 * Preview stopping EVERY open position of a goal (G7, board §3.3): the
 * goal-level stop is a COMPOSITION of position exits, never a replacement
 * primitive — and the itemization is the point, not decoration.
 *
 * `feeFor` resolves each position's network fee (the caller owns market/gas
 * access — the same seam `previewExit` uses). Returns null when nothing is
 * open, so the surface can say so instead of rendering a zeroed ceremony.
 */
export function previewGoalStop(
  state: LedgerState,
  goalId: string,
  feeFor: (positionId: string) => number
): StopPreview | null {
  return composeStop(state, openPositionsOf(state, goalId), feeFor);
}

/**
 * Stop every open position of a goal — N `StrategyExited` events under ONE
 * correlationId (one user decision); the money returns to the GOAL as cash.
 * Decision: `decideStopGoalStrategies`.
 */
export function stopGoalStrategies(goalId: string, feeFor: (positionId: string) => number): void {
  apply(decideStopGoalStrategies({ goalId }, { feeFor }, browserContext));
}
