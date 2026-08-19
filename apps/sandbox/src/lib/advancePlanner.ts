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
 * A-1: every segment passes the advance's GLOBAL `toDay` as `replayEarnings`'
 * anchor, so segment slices are contiguous (no double-counting of recent days).
 */

import Decimal from 'decimal.js';
import { recurringDepositDays, type LedgerEvent, type RecurringSchedule } from '@diboas/banking';
import { ratesForSpan, replayEarnings, type DailyApySeries } from '@diboas/investing';

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
  blendedByPosition: Map<string, DailyApySeries>;
  toDay: number;
  days: number;
  source: 'real' | 'machine';
  stamp: EventStamp;
}): LedgerEvent[] {
  const { positions, schedules, workingStart, blendedByPosition, toDay, days, source, stamp } =
    input;
  const events: LedgerEvent[] = [];
  const scheduleByPosition = new Map(schedules.map((s) => [s.positionId, s]));

  // ── Phase 1 — bound recurring deposits against the SHARED Working pool, in
  //    strict (day, positionId) order (fair + deterministic depletion). ────────
  const due: { positionId: string; goalId: string; day: number; monthly: Decimal }[] = [];
  for (const position of positions) {
    const schedule = scheduleByPosition.get(position.positionId);
    if (!schedule) continue;
    // A position with no blended series (catalog drift → strategy missing) is
    // skipped entirely in Phase 2, so it must NOT reserve Working here — else it
    // would starve other positions' deposits while contributing nothing (L1).
    if (!blendedByPosition.has(position.positionId)) continue;
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
    const blended = blendedByPosition.get(position.positionId);
    if (!blended) continue;
    const goalId = scheduleByPosition.get(position.positionId)?.goalId ?? position.goalId;
    const deposits = depositsByPosition.get(position.positionId) ?? [];

    let cursor = position.accruedThroughSimDay;
    let value = new Decimal(position.principal).plus(position.accrued);

    for (const deposit of deposits) {
      const earnings = replayEarnings(value, blended, cursor, deposit.day, toDay);
      events.push({
        ...stamp(),
        type: 'AccrualApplied',
        positionId: position.positionId,
        fromSimDay: cursor,
        toSimDay: deposit.day,
        earnings: earnings.toFixed(2),
        apySource: blended.source,
        // §3 rate-pinning: the SAME mapping replayEarnings used (one shared fn).
        ratesUsed: ratesForSpan(blended, cursor, deposit.day, toDay),
      });
      value = value.plus(earnings);
      events.push({
        ...stamp(),
        type: 'RecurringContributionApplied',
        goalId,
        positionId: position.positionId,
        amount: deposit.amount.toFixed(2),
        onSimDay: deposit.day,
      });
      value = value.plus(deposit.amount);
      cursor = deposit.day;
    }

    // Final segment [cursor, toDay]. Skipped when a deposit landed exactly on
    // toDay (cursor === toDay) — that final span is zero and would only add a
    // "earned 0.00" noise line to the trail (L3); accruedThroughSimDay is
    // already at toDay from the preceding segment.
    if (cursor < toDay) {
      const earnings = replayEarnings(value, blended, cursor, toDay, toDay);
      events.push({
        ...stamp(),
        type: 'AccrualApplied',
        positionId: position.positionId,
        fromSimDay: cursor,
        toSimDay: toDay,
        earnings: earnings.toFixed(2),
        apySource: blended.source,
        // §3 rate-pinning: the SAME mapping replayEarnings used (one shared fn).
        ratesUsed: ratesForSpan(blended, cursor, toDay, toDay),
      });
    }
  }

  events.push({ ...stamp(), type: 'TimeAdvanced', days, source });
  return events;
}
