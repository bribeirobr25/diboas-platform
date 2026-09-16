import { beforeEach, describe, expect, it } from 'vitest';
import { observedStamp, type ProtocolApyHistory, type ProtocolId } from '@diboas/defi';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';

/**
 * `5.105` / I-G1c — the Replay Context, tested at LEDGER level.
 *
 * The defect, stated as a property: the time machine claims to "replay what the
 * market actually did", but every advance re-fetched a series ending TODAY and
 * re-anchored its newest point to that advance's end. So two consecutive +30
 * jumps replayed the SAME thirty days, forever.
 *
 * The property this file pins is therefore the defect's inverse: consecutive
 * machine advances must consume ADJACENT, NON-OVERLAPPING history.
 *
 * `safeHarbor` is deliberately chosen: all three of its legs are lending, so one
 * dated APY series covers the whole position and the calendar window is usable.
 * A position mixing leg kinds whose series carry different date ranges falls
 * back to the historic anchoring on purpose — covered separately below.
 */
const LENDING: ProtocolId[] = ['skySsr', 'aaveV3', 'compoundV3'];

/** A dated series whose APY is DISTINCT per day, so the window is visible in the values. */
function datedApy(days: number): ProtocolApyHistory[] {
  return LENDING.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      // 1..days — a value that identifies exactly which day was replayed.
      apyPercent: i + 1,
    })),
    stamp: observedStamp('defillama', '2026-09-15T00:00:00Z'),
  }));
}

function positionAtWork(): void {
  grantPlayMoney(10_000, 'USD', 'b2c');
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 9000,
    horizonMonths: 24,
    fundAmount: 2000,
  });
  enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 2000, networkFeeLocal: 0 });
}

/**
 * Every accrual's pinned per-leg MULTIPLES, in emission order.
 *
 * ⚑ Not `ratesUsed`: that field is pinned only for a position with ONE lending
 * leg at 100% (`soleLendingLeg`), and NO catalog strategy is shaped that way —
 * every one holds 2-4 legs (measured). So production always pins
 * `legsReplayed`, and a test reading `ratesUsed` reads a field that is never
 * populated. `multiple` is the product of the segment's growth factors, which
 * is the number the audit trail actually witnesses.
 */
function multiplesByAdvance(): string[][] {
  return getLedgerState()
    .events.filter((e) => e.type === 'AccrualApplied')
    .map((e) =>
      ((e as { legsReplayed?: Array<{ multiple: string }> }).legsReplayed ?? []).map(
        (l) => l.multiple
      )
    );
}

/** Total earnings across every accrual, as a number (sign matters). */
function totalEarnings(): number {
  return getLedgerState()
    .events.filter((e) => e.type === 'AccrualApplied')
    .reduce((sum, e) => sum + Number((e as { earnings: string }).earnings), 0);
}

describe('the Replay Context makes consecutive advances consume ADJACENT history (5.105)', () => {
  beforeEach(() => resetSandbox());

  it('should replay a DIFFERENT window on the second advance, not the same tail again', () => {
    positionAtWork();
    const series = datedApy(400);

    advanceTime(30, series, 'machine');
    const first = multiplesByAdvance();
    const firstEarned = totalEarnings();
    advanceTime(30, series, 'machine');
    const second = multiplesByAdvance().slice(first.length);
    const secondEarned = totalEarnings() - firstEarned;

    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);

    /**
     * THE defect, as a property: the series rises 1%..400% by day, so a LATER
     * window must compound harder than an earlier one. Under the old anchoring
     * both advances replayed the same newest 30 days and these were equal.
     */
    expect(second.flat()).not.toEqual(first.flat());
    expect(secondEarned).toBeGreaterThan(firstEarned);
  });

  it('should make 90 = 30+30+30 over one contiguous window (§7)', () => {
    positionAtWork();
    const series = datedApy(400);
    advanceTime(30, series, 'machine');
    advanceTime(30, series, 'machine');
    advanceTime(30, series, 'machine');
    const perAdvance = multiplesByAdvance();
    expect(perAdvance.length).toBeGreaterThanOrEqual(3);
    // Each successive window compounds harder on a rising series, so no two
    // advances replayed the same stretch.
    const products = perAdvance.map((ms) => ms.map(Number).reduce((a, b) => a * b, 1));
    expect(new Set(products.map((p) => p.toFixed(8))).size).toBe(products.length);
    for (let i = 1; i < products.length; i += 1) {
      expect(products[i]).toBeGreaterThan(products[i - 1]);
    }
  });

  it('should pin the epoch ONCE and never rewrite it', () => {
    positionAtWork();
    const series = datedApy(400);

    expect(getLedgerState().replayEpoch).toBeNull();
    advanceTime(30, series, 'machine');
    const pinned = getLedgerState().replayEpoch;
    expect(pinned).toBe('2026-01-01'); // the oldest date the first advance saw

    // A later advance offered a DIFFERENT, newer series must not slide the window.
    advanceTime(30, datedApy(200), 'machine');
    expect(getLedgerState().replayEpoch).toBe(pinned);
  });

  it('should NOT pin an epoch for a real-time settle (its newest-anchoring is correct)', () => {
    // Three real days elapsed should consume the last three REAL days, not days
    // 91-93 of a historical window. `source` discriminates the two meanings.
    positionAtWork();
    advanceTime(3, datedApy(400), 'real');
    expect(getLedgerState().replayEpoch).toBeNull();
  });
});

/** Every refusal the ledger disclosed, in emission order. */
function refusals(): Array<{ reason: string; fromSimDay: number; toSimDay: number }> {
  return getLedgerState()
    .events.filter((e) => e.type === 'ReplaySpanRefused')
    .map((e) => e as unknown as { reason: string; fromSimDay: number; toSimDay: number });
}

function accrualCount(): number {
  return getLedgerState().events.filter((e) => e.type === 'AccrualApplied').length;
}

/**
 * `5.105` §2/§3 — AN UNUSABLE WINDOW IS A DISCLOSED GAP, NOT ANOTHER MONTH.
 *
 * ⚑ REWRITTEN 2026-09-16. This describe read *"an unusable window falls back to
 * the historic anchoring, never to flatness"*, and its test asserted that an
 * undated series still produced earnings. That was true of the code and is now
 * FORBIDDEN by Strategy: §3 rules a refused span
 * `CONSUMED AS A DISCLOSED EVIDENCE GAP`, and §2 forbids substituting another
 * historical period for missing evidence. The old test was therefore a `5.114`
 * case — it encoded the behaviour as a requirement and would have told the next
 * person that fixing it was a regression.
 *
 * The HALF of its concern that was always right is kept as the second test: an
 * empty factor list reading as "no movement" would silently flatten a falling
 * position. The answer to that is refusal plus disclosure, never a replay of a
 * month the user never lived through.
 */
describe('an unusable window is DISCLOSED as a gap, never replayed from another month', () => {
  beforeEach(() => resetSandbox());

  it('should refuse the span and say WHY when a series carries no dates', () => {
    const undated: ProtocolApyHistory[] = LENDING.map((protocolId) => ({
      protocolId,
      points: Array.from({ length: 400 }, () => ({ date: '', apyPercent: 6 })),
      stamp: observedStamp('defillama', '2026-09-15T00:00:00Z'),
    }));
    positionAtWork();
    advanceTime(30, undated, 'machine');

    // Disclosed, with the cause classified — not silence, and not a number.
    expect(refusals().length).toBeGreaterThan(0);
    expect(refusals().every((r) => r.reason === 'missing-calendar-evidence')).toBe(true);

    // And NOTHING was claimed: no accrual, no earnings from a substituted month.
    expect(accrualCount()).toBe(0);
    expect(totalEarnings()).toBe(0);
    expect(multiplesByAdvance().flat().length).toBe(0);
  });

  it('should still replay a REAL settle from the newest days, refusing nothing', () => {
    // `source` discriminates the two meanings, and this is the half of the old
    // test that remains correct: three real days elapsed SHOULD consume the last
    // three real days, so the historic anchoring is right and no window is
    // needed. A real settle can never refuse.
    const undated: ProtocolApyHistory[] = LENDING.map((protocolId) => ({
      protocolId,
      points: Array.from({ length: 400 }, () => ({ date: '', apyPercent: 6 })),
      stamp: observedStamp('defillama', '2026-09-15T00:00:00Z'),
    }));
    positionAtWork();
    advanceTime(3, undated, 'real');

    expect(refusals().length).toBe(0);
    expect(totalEarnings()).toBeGreaterThan(0);
    expect(
      multiplesByAdvance()
        .flat()
        .every((m) => Number(m) > 1)
    ).toBe(true);
  });

  it('should keep a DATED series replaying normally (the refusal is not a blanket)', () => {
    positionAtWork();
    advanceTime(30, datedApy(400), 'machine');
    expect(refusals().length).toBe(0);
    expect(totalEarnings()).toBeGreaterThan(0);
  });
});
