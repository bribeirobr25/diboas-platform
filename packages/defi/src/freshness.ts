import type { DataStamp, TimeState } from './types';

/**
 * §8.5 — the fallback age rule for CURRENT-FACING Practice simulations.
 *
 *   0–7 days    usable fallback, normally DELAYED unless the source contract
 *               independently supports CURRENT
 *   >7–14 days  STALE, usable only under the bounded stale-simulation rule
 *   >14 days    NOT acceptable for a current-facing rate-dependent simulation;
 *               the required market input becomes MISSING / UNAVAILABLE
 *
 * This does NOT apply to correctly preserved HISTORICAL replay observations
 * (§8.3) — that state is asserted by the replay caller, never computed here.
 */
export const FRESHNESS_DELAYED_MAX_DAYS = 7;
export const FRESHNESS_STALE_MAX_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The TIME state of a stamp against a clock, for CURRENT-FACING use.
 *
 * Deliberately a function of an explicit `now`: freshness is not a property of
 * the datum, so storing it on the stamp would have written a value that stops
 * being true immediately. An unparseable timestamp is MISSING, never CURRENT —
 * the fail-honest direction (`MISSING` is also what >14 days returns, and the
 * caller must then treat the rate-dependent output as unavailable/incomplete,
 * NOT as zero: §8.7 `MISSING ≠ 0`).
 */
export function dataFreshness(stamp: DataStamp, now: Date | string): TimeState {
  const at = Date.parse(stamp.asOf);
  const ref = typeof now === 'string' ? Date.parse(now) : now.getTime();
  if (!Number.isFinite(at) || !Number.isFinite(ref)) return 'MISSING';
  const ageDays = (ref - at) / DAY_MS;
  /* A future timestamp is not "fresher than current" — it is unusable, and
     silently accepting it would let a clock skew manufacture currency. */
  if (ageDays < -1) return 'MISSING';
  if (ageDays > FRESHNESS_STALE_MAX_DAYS) return 'MISSING';
  if (ageDays > FRESHNESS_DELAYED_MAX_DAYS) return 'STALE';
  /* A retrieved observation inside the window is DELAYED, not CURRENT: neither
     provider's contract promises real-time, and the sandbox caches for 6h. */
  return 'DELAYED';
}
