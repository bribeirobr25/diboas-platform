/**
 * PR 2 · guard 7 (P3 §6): the rate-ranges contract — only OBSERVED, fresh legs with a base
 * split count; a refused leg makes its strategy unavailable with a named reason; the stable
 * aggregate is all-or-nothing.
 */
import { describe, expect, it } from 'vitest';
import { observedStamp, type ProtocolApyHistory, type ProtocolId } from '@diboas/defi';
import {
  STABLE_PROTOCOLS,
  STABLE_STRATEGIES,
  __resetRateRangesMemo,
  computeRateRanges,
  isDegraded,
  rateRangesFor,
} from '../rateRanges';
import { rateRangesResponseIssue } from '../responseShape';

const NOW = new Date('2026-11-05T12:00:00Z');
const DAY = 86_400_000;

function history(
  id: ProtocolId,
  opts: {
    days?: number;
    base?: (i: number) => number | null;
    lastDaysAgo?: number;
    stamp?: ProtocolApyHistory['stamp'];
  } = {}
): ProtocolApyHistory {
  const days = opts.days ?? 266;
  const last = NOW.getTime() - (opts.lastDaysAgo ?? 1) * DAY;
  const points = Array.from({ length: days }, (_, i) => {
    const date = new Date(last - (days - 1 - i) * DAY).toISOString().slice(0, 10);
    const base = opts.base ? opts.base(i) : 3 + (i % 60) / 100;
    return { date, apyPercent: (base ?? 3) + 0.2, apyBasePercent: base };
  });
  return {
    protocolId: id,
    points,
    stamp: opts.stamp ?? observedStamp('defillama', NOW.toISOString()),
  };
}

const all = (override: Partial<Record<ProtocolId, ProtocolApyHistory | null>> = {}) =>
  new Map<ProtocolId, ProtocolApyHistory | null>(
    STABLE_PROTOCOLS.map((id) => [
      id,
      id in override ? (override[id] as ProtocolApyHistory | null) : history(id),
    ])
  );

describe('PR 2 · computeRateRanges', () => {
  it('should give every stable strategy a range and an aggregate when every leg is observed and fresh', () => {
    const r = computeRateRanges(all(), NOW);
    expect(r.strategies).toHaveLength(STABLE_STRATEGIES.length);
    expect(r.strategies.every((s) => s.available)).toBe(true);
    expect(r.aggregate.available).toBe(true);
    expect(r.aggregate.lowPercent!).toBeLessThanOrEqual(r.aggregate.highPercent!);
    expect(isDegraded(r)).toBe(false);
    const s = r.strategies[0] as Extract<(typeof r.strategies)[number], { available: true }>;
    expect(s.observedDays).toBe(266);
    expect(s.todayPercent).toBeGreaterThan(0);
  });

  it('should refuse a fresh series that is not a live observation (fallback used) and make the aggregate unavailable', () => {
    const id = STABLE_PROTOCOLS[0];
    const r = computeRateRanges(
      all({
        [id]: history(id, {
          stamp: { ...observedStamp('defillama', NOW.toISOString()), fallbackUsed: true },
        }),
      }),
      NOW
    );
    expect(r.strategies.every((s) => !s.available && s.reason === 'NOT_OBSERVED')).toBe(true);
    expect(r.aggregate.available).toBe(false);
    expect(isDegraded(r)).toBe(true);
  });

  it('should refuse a series whose last point is older than the 14-day limit', () => {
    const id = STABLE_PROTOCOLS[1];
    const r = computeRateRanges(all({ [id]: history(id, { lastDaysAgo: 20 }) }), NOW);
    expect(r.strategies.some((s) => !s.available && s.reason === 'STALE')).toBe(true);
  });

  it('should refuse a day with a reward but no base split (base null)', () => {
    const id = STABLE_PROTOCOLS[2];
    const r = computeRateRanges(
      all({ [id]: history(id, { base: (i) => (i === 200 ? null : 3) }) }),
      NOW
    );
    expect(r.strategies.some((s) => !s.available && s.reason === 'BASE_SPLIT_MISSING')).toBe(true);
  });

  it('should be unavailable with fewer than 90 observed days', () => {
    const r = computeRateRanges(
      new Map(STABLE_PROTOCOLS.map((id) => [id, history(id, { days: 80 })])),
      NOW
    );
    expect(r.strategies.every((s) => !s.available && s.reason === 'TOO_LITTLE_HISTORY')).toBe(true);
  });

  it('should refuse a missing series', () => {
    const r = computeRateRanges(all({ [STABLE_PROTOCOLS[0]]: null }), NOW);
    expect(r.strategies.every((s) => !s.available && s.reason === 'NO_HISTORY')).toBe(true);
  });

  it('should refuse a fetch stamp outside the current-facing limit even when the points look fresh', () => {
    const id = STABLE_PROTOCOLS[0];
    const old = observedStamp('defillama', new Date(NOW.getTime() - 20 * DAY).toISOString());
    const r = computeRateRanges(all({ [id]: history(id, { stamp: old }) }), NOW);
    expect(r.strategies.every((s) => !s.available && s.reason === 'NOT_OBSERVED')).toBe(true);
  });
});

describe('PR 2 · the averaging runs once per provider-cache entry', () => {
  it('should reuse the payload for the same legs on the same day, and recompute on a new stamp or after an hour', () => {
    __resetRateRangesMemo();
    const first = rateRangesFor(all(), NOW);
    expect(rateRangesFor(all(), new Date(NOW.getTime() + 60_000))).toBe(first);
    const id = STABLE_PROTOCOLS[0];
    const fresh = all({
      [id]: history(id, {
        stamp: observedStamp('defillama', new Date(NOW.getTime() + 1000).toISOString()),
      }),
    });
    expect(rateRangesFor(fresh, NOW)).not.toBe(first);
    const again = rateRangesFor(all(), NOW);
    expect(rateRangesFor(all(), new Date(NOW.getTime() + 3_600_001))).not.toBe(again);
  });

  it('should never let a points-only change hide behind the memo (same stamp, one more point)', () => {
    __resetRateRangesMemo();
    const first = rateRangesFor(all(), NOW);
    const id = STABLE_PROTOCOLS[0];
    expect(rateRangesFor(all({ [id]: history(id, { days: 267 }) }), NOW)).not.toBe(first);
  });
});

describe('PR 2 · the client shape check of the rate-ranges answer', () => {
  const good = () =>
    JSON.parse(JSON.stringify(computeRateRanges(all(), NOW))) as Record<string, unknown>;

  it('should accept what the route computes, and an all-unavailable answer', () => {
    expect(rateRangesResponseIssue(good())).toBeNull();
    expect(
      rateRangesResponseIssue(computeRateRanges(all({ [STABLE_PROTOCOLS[0]]: null }), NOW))
    ).toBeNull();
  });

  it.each([
    ['a string rate', (b: any) => (b.strategies[0].lowPercent = '3'), 'strategies[0].lowPercent'],
    ['low above high', (b: any) => (b.strategies[0].lowPercent = 99), 'strategies[0].highPercent'],
    [
      'a fractional day count',
      (b: any) => (b.strategies[0].observedDays = 2.5),
      'strategies[0].observedDays',
    ],
    [
      'a non-day date',
      (b: any) => (b.strategies[0].oldestLegAsOf = 'yesterday'),
      'strategies[0].oldestLegAsOf',
    ],
    [
      'an unknown reason',
      (b: any) => (b.strategies[0] = { strategyId: 'x', available: false, reason: 'MAYBE' }),
      'strategies[0].reason',
    ],
    ['a missing aggregate', (b: any) => delete b.aggregate, 'aggregate'],
    [
      'an aggregate without a rate',
      (b: any) => delete b.aggregate.lowPercent,
      'aggregate.lowPercent',
    ],
    [
      'an impossible calendar day',
      (b: any) => (b.strategies[0].oldestLegAsOf = '2026-13-45'),
      'strategies[0].oldestLegAsOf',
    ],
    ['a negative rate', (b: any) => (b.strategies[0].lowPercent = -1), 'strategies[0].lowPercent'],
    [
      'a window under the 90-day minimum',
      (b: any) => (b.strategies[0].observedDays = 1),
      'strategies[0].observedDays',
    ],
    [
      'a window that starts after it ends',
      (b: any) => (b.strategies[0].windowStart = '2027-01-01'),
      'strategies[0].windowStart',
    ],
    ['a negative aggregate', (b: any) => (b.aggregate.lowPercent = -1), 'aggregate.lowPercent'],
  ])('should refuse %s', (_label, mutate, path) => {
    const b = good();
    mutate(b);
    expect(rateRangesResponseIssue(b)).toBe(path);
  });
});

describe('7th audit · the stable aggregate and the age use EVERY strategy and the OLDEST leg', () => {
  // Pools differ in level, history length and last day, so each strategy's range differs.
  const varied = () =>
    new Map<ProtocolId, ProtocolApyHistory | null>(
      STABLE_PROTOCOLS.map((id, k) => [
        id,
        history(id, {
          days: [120, 266, 300][k % 3],
          lastDaysAgo: [3, 1, 2][k % 3],
          base: (i) => [2.5, 3.2, 4.1][k % 3] + (i % 50) / 100,
        }),
      ])
    );

  it('should take the lowest low, the highest high and the shortest window across strategies', () => {
    const r = computeRateRanges(varied(), NOW);
    const ok = r.strategies.filter(
      (s): s is Extract<(typeof r.strategies)[number], { available: true }> => s.available
    );
    expect(ok.length).toBe(STABLE_STRATEGIES.length);
    const lows = ok.map((s) => s.lowPercent);
    const highs = ok.map((s) => s.highPercent);
    const windows = ok.map((s) => s.observedDays);
    // Non-vacuity: the strategies really disagree on every one of the three.
    expect(new Set(lows).size).toBeGreaterThan(1);
    expect(new Set(highs).size).toBeGreaterThan(1);
    // (Windows cannot differ here: every stable strategy shares the Sky leg, so they share its
    // window. The shortest-window rule is pinned in `@diboas/investing` `rangeSpan`.)
    expect(r.aggregate).toEqual({
      available: true,
      lowPercent: Math.min(...lows),
      highPercent: Math.max(...highs),
      observedDays: Math.min(...windows),
    });
  });

  it('should date a strategy by its OLDEST leg', () => {
    const r = computeRateRanges(varied(), NOW);
    const oldest = new Date(NOW.getTime() - 3 * DAY).toISOString().slice(0, 10);
    const s = r.strategies.find((x) => x.strategyId === STABLE_STRATEGIES[0].id) as Extract<
      (typeof r.strategies)[number],
      { available: true }
    >;
    // Every stable strategy draws on the first pool, the one whose last point is 3 days old.
    expect(s.oldestLegAsOf).toBe(oldest);
  });

  it('should never count a point dated after today (the window ends today at the latest)', () => {
    const id = STABLE_PROTOCOLS[0];
    const r = computeRateRanges(all({ [id]: history(id, { lastDaysAgo: -3 }) }), NOW);
    const today = NOW.toISOString().slice(0, 10);
    for (const s of r.strategies) if (s.available) expect(s.windowEnd <= today).toBe(true);
  });
});
