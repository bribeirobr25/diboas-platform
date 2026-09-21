/**
 * Pure planner for a time advance (C3). Given the open positions, their active
 * recurring schedules, the starting Working balance, and each position's
 * blended real-APY series, it produces the ordered event list for the advance:
 * per-position accrual SEGMENTED at each monthly deposit day, interleaved with
 * the bounded recurring contributions, followed by the TimeAdvanced marker.
 *
 * Extracted from the ledgerClient (which owns the store, the defi strategy
 * blend, and the id/timestamp stamping) so the money-moving logic is unit
 * testable without a browser store — Principle 6 (decoupling) and the
 * reconciliation gate both depend on this staying pure and deterministic.
 *
 * A-1: every segment passes the advance's GLOBAL `toDay` as the replay anchor,
 * so segment slices are contiguous (no double-counting of recent days). §4.8
 * widened the segmentation from deposit-days-only to the merged monthly grid
 * (`accrualSegmentDays`) — same anchor contract, more boundaries.
 */

import Decimal from 'decimal.js';
import {
  type ReplayRefusalReason,
  accrualSegmentDays,
  recurringDepositDays,
  type LedgerEvent,
  type RecurringSchedule,
} from '@diboas/banking';
import {
  apyFactorsForSpan,
  apyFactorsForSpanWindowed,
  priceFactorsForSpan,
  priceFactorsForSpanWindowed,
  ratesForSpan,
  ratesForSpanWindowed,
  windowCoverage,
  replayLegged,
  type DailyApySeries,
  type DailyPriceSeries,
  type LegReplay,
} from '@diboas/investing';
import { FIXTURE_VERSION } from '@diboas/defi';

/**
 * One allocation leg's replay source (§4.8 G8). A `lending` leg replays its APY
 * series; a `market` leg replays the token's own PRICE series and adds nothing
 * on top — the price already is the total return, so applying the APY too
 * would count an LST's staking yield twice.
 */
export type PositionLeg =
  | { kind: 'lending'; weightPercent: number; apy: DailyApySeries }
  | { kind: 'market'; weightPercent: number; price: DailyPriceSeries };

export interface AdvancePositionInput {
  positionId: string;
  goalId: string;
  principal: string;
  accrued: string;
  accruedThroughSimDay: number;
}

/** The variable event fields the client stamps (eventId/simDay/recordedAt/correlationId). */
export type EventStamp = () => {
  eventId: string;
  simDay: number;
  recordedAt: string;
  correlationId: string;
};

export function planAdvance(input: {
  positions: AdvancePositionInput[];
  schedules: RecurringSchedule[];
  workingStart: string;
  /** Per-position legs. Mixed kinds are expected: a growth strategy holds both. */
  legsByPosition: Map<string, PositionLeg[]>;
  /**
   * Positions whose STRATEGY resolved in the catalog, whether or not their
   * history can be replayed (`5.105` I-G1d, batch D).
   *
   * Deliberately SEPARATE from `legsByPosition`: that map answers *"can this
   * position's market history be replayed"*, and a RECURRING DEPOSIT must not
   * depend on the answer — it is the user's own money moving on a calendar,
   * which needs no market series at all. Gating both on one map is what made an
   * honest replay refusal also swallow a monthly contribution.
   *
   * Omit it and it defaults to the replayable set, which is exactly the
   * behaviour before batch D.
   */
  catalogPositions?: Set<string>;
  toDay: number;
  days: number;
  source: 'real' | 'machine';
  /**
   * The calendar date this span's FIRST replayed day maps to (`5.105`, I-G1c).
   *
   * Supplied for `machine` advances so consecutive jumps consume history
   * SEQUENTIALLY instead of re-anchoring a fresh recent tail. Absent for
   * `real` advances on purpose: real elapsed days genuinely correspond to the
   * newest real days, so the historic anchoring is the correct one there.
   *
   * When the series cannot honestly cover the window the windowed functions
   * return `null`, and this planner emits NO accrual for that span rather than
   * padding with a repeated reading.
   */
  windowStartDate?: string;
  /**
   * `'none'` when the caller established that NO dated history exists for this
   * advance at all (`journey.ts` filters empty dates out of `oldestDate`, so an
   * undated corpus yields no epoch and therefore no window).
   *
   * Explicit rather than inferred from an absent `windowStartDate`: the two mean
   * different things. An absent window can be a caller that does not use
   * calendar anchoring; `'none'` is an evidence statement, and only an evidence
   * statement may refuse a span (`5.105` §2/§3).
   */
  calendarEvidence?: 'none' | 'present';
  stamp: EventStamp;
}): LedgerEvent[] {
  const { positions, schedules, workingStart, legsByPosition, toDay, days, source, stamp } = input;
  const { windowStartDate, calendarEvidence } = input;
  /** Catalog-resolved positions (see `catalogPositions`); defaults to replayable. */
  const catalogResolved = input.catalogPositions ?? new Set(legsByPosition.keys());
  /** Calendar date for a segment's first replayed day, when a window is pinned. */
  const windowFor = (fromDay: number): string | undefined => {
    if (windowStartDate === undefined) return undefined;
    const d = new Date(`${windowStartDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + (fromDay - (input.toDay - input.days)));
    return d.toISOString().slice(0, 10);
  };

  /**
   * The span's per-leg replay inputs. Every leg — whatever its kind — resolves
   * to per-day growth FACTORS through the SAME day→index mapping and the SAME
   * shared `anchorDay` (the advance's global `toDay`). That shared anchor is
   * what makes the segmented replay identical to a single-call replay; letting
   * a segment re-anchor to its own end would overlap windows and double-count
   * recent movement (proven divergent by test).
   */

  /** Historic anchoring: each leg replays the last N days of its OWN series. */
  const historicFactors = (leg: PositionLeg, fromDay: number, segEnd: number): number[] =>
    leg.kind === 'market'
      ? priceFactorsForSpan(leg.price, fromDay, segEnd, toDay)
      : apyFactorsForSpan(leg.apy, fromDay, segEnd, toDay);

  /** Calendar anchoring for one leg, or `null` when its series cannot cover it. */
  const windowedFactors = (
    leg: PositionLeg,
    fromDay: number,
    segEnd: number,
    win: string
  ): number[] | null =>
    leg.kind === 'market'
      ? priceFactorsForSpanWindowed(leg.price, fromDay, segEnd, win)
      : apyFactorsForSpanWindowed(leg.apy, fromDay, segEnd, win);

  /**
   * The window for this segment, but ONLY if EVERY leg can honestly cover it.
   *
   * ⚑ Why all-or-nothing (found by breaking it, 2026-09-15). The legs of one
   * position must move together in TIME: replaying leg A over January while leg
   * B replays May would report a blend of two different markets as one
   * position's history. The ranges really do diverge — a fixture fallback
   * manufactures today-ending dates while a live series carries the provider's
   * own, so any PARTIAL provider failure gives one position two calendars.
   *
   * When the window is unusable the segment falls back to the HISTORIC
   * anchoring — never to an empty factor list, which reads as "no movement" and
   * silently flattens a falling position. That was the defect this replaced:
   * three tests about a position losing money went green while the market legs
   * had quietly stopped moving.
   */
  const usableWindow = (
    positionId: string,
    fromDay: number,
    segEnd: number
  ): string | undefined => {
    const win = windowFor(fromDay);
    if (win === undefined) return undefined;
    const legs = legsByPosition.get(positionId) ?? [];
    if (legs.length === 0) return undefined;
    return legs.every((leg) => windowedFactors(leg, fromDay, segEnd, win) !== null)
      ? win
      : undefined;
  };

  /**
   * Must this span be REFUSED rather than replayed? (`5.105` §2/§3, `5.360`.)
   *
   * `null` means replay normally. A returned reason means: emit
   * `ReplaySpanRefused`, emit NO accrual, and let the disclosed gap reach the
   * screen. `5.360` is ruled — a refused span is CONSUMED as a disclosed
   * evidence gap, so there is no catch-up, no retroactive auto-replay and no
   * backfill when new provider data appears.
   *
   * ## Why this had to exist, and why it is not in `usableWindow`
   *
   * `usableWindow` returns `undefined` for several different causes and
   * `legReplaysFor` then fell back to `historicFactors` — i.e. it replayed a
   * DIFFERENT, recent month and presented it as this stretch. That fallback IS
   * the superseded `5.114` behaviour: the position moved, the numbers looked
   * plausible, and nothing anywhere said the required history was missing.
   *
   * ## `real` advances are untouched, deliberately
   *
   * `source: 'real'` gets no window on purpose — three real days elapsed SHOULD
   * consume the last three real days, and the historic anchoring is correct
   * there. So a real settle can never refuse, and `windowStartDate === undefined`
   * on a MACHINE advance is not "no window needed", it is *no dated evidence
   * exists at all* (`journey.ts` filters empty dates out of `oldestDate`), which
   * is a refusal.
   *
   * ## The no-legs case belongs to batch E, not here
   *
   * A position absent from `legsByPosition` is already UNAVAILABLE as a whole
   * (I-G1d) and emits no accrual by a different path. This returns `null` for
   * it so one span cannot be refused twice by two owners.
   */
  const refusalFor = (
    positionId: string,
    fromDay: number,
    segEnd: number
  ): { reason: ReplayRefusalReason; windowStartDate?: string } | null => {
    if (source !== 'machine') return null;
    const legs = legsByPosition.get(positionId) ?? [];
    if (legs.length === 0) return null;
    /* The caller states whether ANY dated evidence exists — this function must
       not infer it from a missing window. `advancePlanner.test.ts` drives the
       planner directly with `source: 'machine'` and no window at all, which is
       a harness omission, not an evidence claim; only `journey.ts` knows that
       every date was filtered out of `oldestDate`. Inferring it here refused six
       unit tests' spans and would have refused any future caller that omits the
       window for its own reasons. */
    if (calendarEvidence === 'none') return { reason: 'missing-calendar-evidence' };
    const win = windowFor(fromDay);
    if (win === undefined) return null;
    const coverage = legs.map((leg) =>
      leg.kind === 'market'
        ? // A price factor needs the day BEFORE the window opens.
          windowCoverage(leg.price, fromDay, segEnd, win, true)
        : windowCoverage(leg.apy, fromDay, segEnd, win)
    );
    if (coverage.every((c) => c === 'covered')) return null;
    // §2: the legs of one position must move together in TIME. Some covering and
    // some not IS the mixed-calendar case, and it is classified separately from
    // "no calendar at all" because the two have different owners.
    if (coverage.some((c) => c === 'covered'))
      return { reason: 'mixed-calendar', windowStartDate: win };
    // No leg covers. A missing calendar is the more fundamental failure, so it
    // wins over "the window is outside the series" when both appear.
    return {
      reason: coverage.includes('missing-calendar-evidence')
        ? 'missing-calendar-evidence'
        : 'window-outside-series',
      windowStartDate: win,
    };
  };

  const legReplaysFor = (positionId: string, fromDay: number, segEnd: number): LegReplay[] => {
    const win = usableWindow(positionId, fromDay, segEnd);
    return (legsByPosition.get(positionId) ?? []).map((leg) => ({
      weightPercent: leg.weightPercent,
      factors:
        win === undefined
          ? /* REAL advances only, now. A `machine` span whose window is unusable
               is REFUSED by `refusalFor` before this is reached, so this branch
               can no longer present a recent month as a historical stretch
               (`5.105` §2/§3). */
            historicFactors(leg, fromDay, segEnd)
          : // `usableWindow` already proved every leg covers it.
            (windowedFactors(leg, fromDay, segEnd, win) as number[]),
    }));
  };

  /** The audit record pinned onto the event (§4.8 step 5). */
  const legsReplayedFor = (positionId: string, fromDay: number, segEnd: number) =>
    (legsByPosition.get(positionId) ?? []).map((leg, i) => {
      const factors = legReplaysFor(positionId, fromDay, segEnd)[i].factors;
      return {
        weightPercent: leg.weightPercent,
        kind: leg.kind,
        source: leg.kind === 'market' ? leg.price.source : leg.apy.source,
        multiple: factors.reduce((acc, f) => acc.mul(f), new Decimal(1)).toString(),
      };
    });
  const events: LedgerEvent[] = [];
  const scheduleByPosition = new Map(schedules.map((s) => [s.positionId, s]));

  // ── Phase 1 — bound recurring deposits against the SHARED Working pool, in
  //    strict (day, positionId) order (fair + deterministic depletion). ────────
  const due: { positionId: string; goalId: string; day: number; monthly: Decimal }[] = [];
  for (const position of positions) {
    const schedule = scheduleByPosition.get(position.positionId);
    if (!schedule) continue;
    // CATALOG DRIFT only (strategy missing entirely): such a position emits
    // nothing in Phase 2, so it must NOT reserve Working here — else it would
    // starve other positions' deposits while contributing nothing (L1).
    //
    // ⚑ Batch D: this gate asks about the CATALOG, never about replayability. A
    // position whose history is missing still owes its deposits, so it still
    // reserves Working. (Before this it gated on `legsByPosition`, which
    // conflated the two and refused the deposit with the accrual.)
    if (!catalogResolved.has(position.positionId)) continue;
    for (const day of recurringDepositDays(
      schedule.startSimDay,
      position.accruedThroughSimDay,
      toDay
    )) {
      due.push({
        positionId: position.positionId,
        goalId: schedule.goalId,
        day,
        monthly: new Decimal(schedule.monthlyAmount),
      });
    }
  }
  due.sort((a, b) => a.day - b.day || (a.positionId < b.positionId ? -1 : 1));

  let working = new Decimal(workingStart);
  const depositsByPosition = new Map<string, { day: number; amount: Decimal }[]>();
  for (const item of due) {
    if (working.lte(0)) break; // Working exhausted → remaining deposits paused (no events).
    const amount = Decimal.min(item.monthly, working);
    if (amount.lte(0)) continue;
    working = working.minus(amount);
    const list = depositsByPosition.get(item.positionId) ?? [];
    list.push({ day: item.day, amount });
    depositsByPosition.set(item.positionId, list);
  }

  // ── Phase 2 — per position, segmented accrual interleaved with its deposits. ─
  for (const position of positions) {
    const found = legsByPosition.get(position.positionId);
    /**
     * ⚑ `5.105` I-G1d + batch D — REPLAYABILITY AND DEPOSITS ARE DIFFERENT THINGS.
     *
     * `replayLegs === null` means this position cannot be replayed for this span
     * (no evidenced history). Time still advances, the trail is still written,
     * and its DEPOSITS still fire — what does not happen is an accrual claiming
     * earnings nobody can evidence. Ruled by Strategy/M&E §7: a partially
     * evidenced position is UNAVAILABLE as a whole, never held flat and never
     * reported from its evidenced minority legs.
     */
    const replayLegs = found !== undefined && found.length > 0 ? found : null;
    if (replayLegs === null && !catalogResolved.has(position.positionId)) continue;
    // The §3 day-level APY trail (`ratesUsed`) is only CORRECT for a position
    // whose entire value follows ONE series — i.e. a single lending leg at
    // 100%. With several legs each compounds on its own share, so no single
    // rate series reproduces the earnings: pinning one leg's rates would make
    // the "would have" claim un-auditable (measured: 3 legs emitted 4.75 while
    // the pinned rates recompounded to 7.86) and would report that leg's
    // provenance as the whole position's. Those positions pin per-leg
    // multiples instead, which reproduce the earnings exactly.
    const soleLendingLeg =
      replayLegs !== null &&
      replayLegs.length === 1 &&
      replayLegs[0].kind === 'lending' &&
      replayLegs[0].weightPercent === 100
        ? replayLegs[0].apy
        : null;
    const blended = soleLendingLeg;
    // Provenance is the WEAKEST leg's, never the first leg's: 'defillama' is
    // reserved for a replay where every leg was live (Data Vintage Policy —
    // fixtures are never silently blended into a live claim).
    const allLive =
      replayLegs !== null &&
      replayLegs.every((l) => (l.kind === 'market' ? l.price.source : l.apy.source) !== 'fixture');
    const goalId = scheduleByPosition.get(position.positionId)?.goalId ?? position.goalId;
    const deposits = depositsByPosition.get(position.positionId) ?? [];

    let cursor = position.accruedThroughSimDay;
    let value = new Decimal(position.principal).plus(position.accrued);

    // Walk the MERGED boundary grid (§4.8): monthly steps unioned with this
    // position's deposit days. Before the grid existed a plan-less advance
    // emitted ONE accrual for the whole span — a two-point chart (the straight
    // diagonal the spec forbids) and a whole year collapsed into one History
    // row. Where a monthly plan is running the grid IS the deposit cadence, so
    // those positions emit exactly what they emitted before.
    const depositByDay = new Map(deposits.map((d) => [d.day, d.amount]));
    const boundaries = accrualSegmentDays(
      cursor,
      toDay,
      deposits.map((d) => d.day)
    );

    for (const segEnd of boundaries) {
      // Zero-length spans are impossible here (the grid is deduped + strictly
      // ascending), so no segment can emit an "earned 0.00" noise row (L3).
      const refusal = replayLegs !== null ? refusalFor(position.positionId, cursor, segEnd) : null;
      if (refusal !== null) {
        /* §3: the span is CONSUMED as a disclosed evidence gap. No accrual, so
           `reconcile()` — which sums `earnings` from emitted accruals — loses
           the term from both sides together and conservation is untouched. */
        events.push({
          ...stamp(),
          type: 'ReplaySpanRefused',
          positionId: position.positionId,
          fromSimDay: cursor,
          toSimDay: segEnd,
          reason: refusal.reason,
          ...(refusal.windowStartDate !== undefined
            ? { windowStartDate: refusal.windowStartDate }
            : {}),
          apySource: allLive ? 'defillama' : 'fixture',
          /* `I-G5`: pin the VERSION of the versioned evidence, and only when
             versioned evidence took part. An all-live span has none. */
          ...(allLive ? {} : { fixtureVersion: FIXTURE_VERSION }),
        });
      } else if (replayLegs !== null) {
        const earnings = replayLegged(value, legReplaysFor(position.positionId, cursor, segEnd));
        events.push({
          ...stamp(),
          type: 'AccrualApplied',
          positionId: position.positionId,
          fromSimDay: cursor,
          toSimDay: segEnd,
          earnings: earnings.toFixed(2),
          // Lending-only keeps the §3 day-level APY trail unchanged; any market
          // leg pins per-leg multiples instead (§4.8 step 5). `apySource` stays
          // 'fixture' when a series is not fully live, so provenance never
          // over-claims — 'defillama' is reserved for an all-live lending replay.
          apySource: allLive ? 'defillama' : 'fixture',
          /* `I-G5`: same rule on the accrual — the evidence version travels
             with the evidence, never as a placeholder when there is none. */
          ...(allLive ? {} : { fixtureVersion: FIXTURE_VERSION }),
          ...(blended
            ? {
                /* §3 same-source: the pinned rates must be the ones that produced
                 the earnings, so this follows the money path's anchoring mode
                 rather than always using the historic one. */
                ratesUsed: (() => {
                  const win = usableWindow(position.positionId, cursor, segEnd);
                  return win === undefined
                    ? ratesForSpan(blended, cursor, segEnd, toDay)
                    : (ratesForSpanWindowed(blended, cursor, segEnd, win) ??
                        ratesForSpan(blended, cursor, segEnd, toDay));
                })(),
              }
            : { legsReplayed: legsReplayedFor(position.positionId, cursor, segEnd) }),
        });
        value = value.plus(earnings);
      }

      const deposit = depositByDay.get(segEnd);
      if (deposit) {
        events.push({
          ...stamp(),
          type: 'RecurringContributionApplied',
          goalId,
          positionId: position.positionId,
          amount: deposit.toFixed(2),
          onSimDay: segEnd,
        });
        value = value.plus(deposit);
      }
      cursor = segEnd;
    }
  }

  events.push({ ...stamp(), type: 'TimeAdvanced', days, source });
  return events;
}
