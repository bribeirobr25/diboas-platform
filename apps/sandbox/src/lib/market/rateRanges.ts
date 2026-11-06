/**
 * PR 2 · the stable strategies' base-rate ranges, computed from OBSERVED pool history.
 *
 * Authority: private docs `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md` §1–§2; the five
 * parameters approved 2026-11-05 (`PROJECTION_POLICY`, `@diboas/investing`).
 *
 * A leg counts only when its series is a LIVE observation (`isLiveObservation`), its stamp is not
 * refused for current-facing use, its LAST point is inside the default 14-day limit (whatever the
 * fetch stamp says), and every day in the window carries a base rate. Anything else makes the
 * strategy unavailable — the block then says the rates can't be read (Case U), never a number.
 * The stable aggregate (simulations, Cases 2/3) is all-or-nothing: one stable strategy
 * unavailable → unavailable.
 */
import {
  FRESHNESS_STALE_MAX_DAYS,
  STRATEGY_CATALOG,
  isLiveObservation,
  isRefusedForCurrentFacingUse,
  type ProtocolApyHistory,
  type ProtocolId,
} from '@diboas/defi';
import { PROJECTION_POLICY, rollingAverageRange, weightedSeries } from '@diboas/investing';
import type {
  RateRangesPayload,
  RateRangeUnavailable,
  StableAggregate,
  StrategyRateRange,
} from '@/lib/rateRangesContract';

/** The stable strategies (no growth exposure) — the ones the projection may state a rate for. */
export const STABLE_STRATEGIES = STRATEGY_CATALOG.filter((s) => s.growthExposurePercent === 0);

/** The protocols every stable strategy draws on — the only histories the route reads. */
export const STABLE_PROTOCOLS: ProtocolId[] = [
  ...new Set(STABLE_STRATEGIES.flatMap((s) => s.allocation.map((a) => a.protocolId))),
];

const DAY_MS = 86_400_000;
const utcDay = (d: Date) => d.toISOString().slice(0, 10);

type LegSeries =
  | { ok: true; series: Map<string, number>; lastDay: string }
  | { ok: false; reason: RateRangeUnavailable };

function legSeries(history: ProtocolApyHistory | null | undefined, now: Date): LegSeries {
  if (!history || history.points.length === 0) return { ok: false, reason: 'NO_HISTORY' };
  if (!isLiveObservation(history.stamp) || isRefusedForCurrentFacingUse(history.stamp, now))
    return { ok: false, reason: 'NOT_OBSERVED' };
  // Only points dated in [today − historyDays, today] count (P3 §2).
  const today = utcDay(now);
  const from = utcDay(new Date(now.getTime() - PROJECTION_POLICY.historyDays * DAY_MS));
  const inWindow = history.points.filter((pt) => pt.date >= from && pt.date <= today);
  if (inWindow.length === 0) return { ok: false, reason: 'STALE' };
  const lastDay = inWindow[inWindow.length - 1].date;
  if ((now.getTime() - Date.parse(`${lastDay}T00:00:00Z`)) / DAY_MS > FRESHNESS_STALE_MAX_DAYS)
    return { ok: false, reason: 'STALE' };
  const series = new Map<string, number>();
  for (const pt of inWindow) {
    if (typeof pt.apyBasePercent !== 'number') return { ok: false, reason: 'BASE_SPLIT_MISSING' };
    series.set(pt.date, pt.apyBasePercent);
  }
  return { ok: true, series, lastDay };
}

/** Every stable strategy's range, and the stable aggregate, from the protocols' histories. */
export function computeRateRanges(
  histories: ReadonlyMap<ProtocolId, ProtocolApyHistory | null>,
  now: Date
): RateRangesPayload {
  const legs = new Map<ProtocolId, LegSeries>();
  for (const id of STABLE_PROTOCOLS) legs.set(id, legSeries(histories.get(id), now));
  const strategies: StrategyRateRange[] = STABLE_STRATEGIES.map((s) => {
    const parts = s.allocation.map((a) => ({
      weight: a.weightPercent / 100,
      leg: legs.get(a.protocolId) as LegSeries,
    }));
    const refused = parts.find((p) => !p.leg.ok);
    if (refused && !refused.leg.ok)
      return { strategyId: s.id, available: false, reason: refused.leg.reason };
    const ready = parts as Array<{ weight: number; leg: Extract<LegSeries, { ok: true }> }>;
    const series = weightedSeries(ready.map((p) => ({ weight: p.weight, series: p.leg.series })));
    const range = rollingAverageRange(series, utcDay(now));
    if (!range) return { strategyId: s.id, available: false, reason: 'TOO_LITTLE_HISTORY' };
    return {
      strategyId: s.id,
      available: true,
      ...range,
      todayPercent: series.get(range.windowEnd) as number,
      oldestLegAsOf: ready.map((p) => p.leg.lastDay).sort()[0],
    };
  });
  const ok = strategies.filter(
    (s): s is Extract<StrategyRateRange, { available: true }> => s.available
  );
  const aggregate: StableAggregate =
    ok.length === strategies.length && ok.length > 0
      ? {
          available: true,
          lowPercent: Math.min(...ok.map((s) => s.lowPercent)),
          highPercent: Math.max(...ok.map((s) => s.highPercent)),
          observedDays: Math.min(...ok.map((s) => s.observedDays)),
        }
      : { available: false };
  return { strategies, aggregate };
}

/** True when any stable strategy is unavailable — the response then takes the degraded cache. */
export function isDegraded(payload: RateRangesPayload): boolean {
  return payload.strategies.some((s) => !s.available);
}

/**
 * The averaging runs once per provider-cache entry, not per request (P3 §2): memoised on every
 * leg's stamp and last point (the provider returns a NEW object per call, so identity is no
 * key) and on the UTC day. Bounded to one hour as well, so a freshness verdict computed now can
 * never outlive its moment by more than that. One entry — the route reads one set of legs.
 */
let memo: { key: string; validUntil: number; payload: RateRangesPayload } | null = null;
const MEMO_MAX_MS = 3_600_000;

function memoKey(histories: ReadonlyMap<ProtocolId, ProtocolApyHistory | null>, now: Date) {
  const legs = STABLE_PROTOCOLS.map((id) => {
    const h = histories.get(id);
    if (!h) return `${id}:none`;
    const last = h.points[h.points.length - 1]?.date ?? '';
    return `${id}:${h.stamp.origin}:${h.stamp.fallbackUsed}:${h.stamp.asOf}:${h.points.length}:${last}`;
  });
  return `${legs.join('|')}|${utcDay(now)}`;
}

export function rateRangesFor(
  histories: ReadonlyMap<ProtocolId, ProtocolApyHistory | null>,
  now: Date
): RateRangesPayload {
  const key = memoKey(histories, now);
  const t = now.getTime();
  if (memo && memo.key === key && t < memo.validUntil) return memo.payload;
  const nextUtcMidnight = Date.parse(`${utcDay(now)}T00:00:00Z`) + DAY_MS;
  const payload = computeRateRanges(histories, now);
  memo = { key, validUntil: Math.min(nextUtcMidnight, t + MEMO_MAX_MS), payload };
  return payload;
}

/** Test seam: forget the memoised payload. */
export function __resetRateRangesMemo(): void {
  memo = null;
}
