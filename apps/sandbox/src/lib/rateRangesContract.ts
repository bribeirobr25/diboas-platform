/**
 * PR 2 · the wire contract of `GET /api/market/rate-ranges` — types only, so the route (which
 * produces it, `lib/market/rateRanges.ts`) and the projection selector (which reads it,
 * `view/projection.ts`) share one shape without the selector importing the I/O folder (VIEW-1).
 */
export type RateRangeUnavailable =
  'NO_HISTORY' | 'NOT_OBSERVED' | 'STALE' | 'BASE_SPLIT_MISSING' | 'TOO_LITTLE_HISTORY';

export type StrategyRateRange =
  | {
      strategyId: string;
      available: true;
      lowPercent: number;
      highPercent: number;
      windowStart: string;
      windowEnd: string;
      observedDays: number;
      /** The strategy's base rate on its last observed day (the range's last point). */
      todayPercent: number;
      /** The OLDEST leg's last observed day — the age the block shows. */
      oldestLegAsOf: string;
    }
  | { strategyId: string; available: false; reason: RateRangeUnavailable };

export interface StableAggregate {
  available: boolean;
  lowPercent?: number;
  highPercent?: number;
  /** The shortest window across the stable strategies. */
  observedDays?: number;
}

export interface RateRangesPayload {
  strategies: StrategyRateRange[];
  aggregate: StableAggregate;
}
