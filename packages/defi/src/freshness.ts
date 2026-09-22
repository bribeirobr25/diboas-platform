import { DEFAULT_PRACTICE_REFERENCE_POLICY, type FreshnessPolicy } from './freshnessPolicy';
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
 *
 * ⛑ **M&E / Data ruling 2026-09-22 · `5.309` RESOLVED.** The numbers above are
 * unchanged, but their SCOPE is now stated: they are the DEFAULT policy for the
 * Practice periodic reference / fallback class, not a universal evidence law. A
 * stricter source or classification contract overrides them, and executable
 * evidence follows its own expiry instead (`isExecutable`). The bands
 * themselves live in `freshnessPolicy.ts`; this module evaluates a stamp
 * against whichever policy applies.
 */
export const FRESHNESS_DELAYED_MAX_DAYS = DEFAULT_PRACTICE_REFERENCE_POLICY.delayedMaxDays;
export const FRESHNESS_STALE_MAX_DAYS = DEFAULT_PRACTICE_REFERENCE_POLICY.staleMaxDays;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The TIME state of a stamp against a clock and an explicit policy, for
 * CURRENT-FACING use.
 *
 * Deliberately a function of an explicit `now`: freshness is not a property of
 * the datum, so storing it on the stamp would have written a value that stops
 * being true immediately. An unparseable timestamp is MISSING, never CURRENT —
 * the fail-honest direction (`MISSING` is also what an over-age stamp returns,
 * and the caller must then treat the rate-dependent output as
 * unavailable/incomplete, NOT as zero: §8.7 `MISSING ≠ 0`).
 *
 * ⚑ `HISTORICAL` is never returned here. Historical replay is exempt from
 * current-facing age enforcement (ruling §5) — that state is asserted by the
 * replay caller against the evidence belonging to the historical moment, and
 * computing it from today's clock is precisely the retroactive enforcement the
 * ruling forbids.
 */
export function freshnessUnder(
  stamp: DataStamp,
  now: Date | string,
  policy: FreshnessPolicy
): TimeState {
  const at = Date.parse(stamp.asOf);
  const ref = typeof now === 'string' ? Date.parse(now) : now.getTime();
  if (!Number.isFinite(at) || !Number.isFinite(ref)) return 'MISSING';
  const ageDays = (ref - at) / DAY_MS;
  /* A future timestamp is not "fresher than current" — it is unusable, and
     silently accepting it would let a clock skew manufacture currency. */
  if (ageDays < -1) return 'MISSING';
  if (ageDays > policy.staleMaxDays) return 'MISSING';
  if (ageDays > policy.delayedMaxDays) return 'STALE';
  /* Inside the normal age window. `<=7 days != automatically CURRENT` (ruling
     §2): CURRENT is reachable only where the SOURCE CONTRACT supports it, which
     no policy declares today — so this stays DELAYED, as it always has. */
  return policy.supportsCurrent ? 'CURRENT' : 'DELAYED';
}

/**
 * The time state under the DEFAULT Practice periodic reference / fallback
 * policy — the 7/14 bands.
 *
 * Kept as the one-argument-pair entry point so every existing caller and test
 * is unchanged: this is the same function it always was, with its policy now
 * named rather than hard-coded.
 */
export function dataFreshness(stamp: DataStamp, now: Date | string): TimeState {
  return freshnessUnder(stamp, now, DEFAULT_PRACTICE_REFERENCE_POLICY);
}
