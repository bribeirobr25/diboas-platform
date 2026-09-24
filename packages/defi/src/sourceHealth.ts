/**
 * SOURCE HEALTH — the fourth of the five minimum validation checks (reset §10).
 *
 * Before this module the repository had NO health signal of any kind: a
 * word-boundary search for health / circuit / consecutive-failure across
 * `packages/defi/src` and the market lib returned zero, so nothing could say a
 * source was failing and nothing could avoid claiming it was fine.
 *
 * ⚑ WHAT THIS IS FOR, EXACTLY. The ratified plan bounds it:
 *
 * ```text
 * provider request success/failure state
 * consecutive/recent failure indication where useful
 * health available to provider disposition / fallback logic
 * no false claim of healthy when observations fail
 * ```
 *
 * and bounds it negatively, which matters more:
 *
 * ```text
 * NOT a monitoring platform
 * NOT a circuit-breaker state machine
 * NOT a retry-policy change
 * NOT alerting, dashboards or half-open probing
 * ```
 *
 * ⚑ HEALTH IS NOT ELIGIBILITY. `§11a` already fixed the defect where a failure
 * handler decided on its own authority whether a substitute could serve.
 * Nothing here decides that. A source can be perfectly healthy and still
 * ineligible, and an unhealthy source's fallback is still decided by
 * `fallbackFor`. FRESHNESS GRANTS NOTHING; so does health. The parallel is
 * exact: each is a TECHNICAL fact, and neither is a RIGHT.
 *
 * ⚑ HEALTH IS INFRASTRUCTURE STATE AND NEVER REACHES PRODUCT (Refresh §6 ⚑).
 * Product consumes availability, freshness, origin, actionability and
 * provenance. A failing source arrives there as an ABSENT OBSERVATION — a
 * state that already exists, with handling that already exists. This module is
 * therefore not exported from the package barrel.
 *
 * ⚑ NOT PERSISTED, AND DELIBERATELY SO. Process-local, like the revalidation
 * caches beside it. A health record that outlived the process would be a
 * durable claim about a source's behaviour, which is a different and
 * unauthorized thing.
 */

import type { EvidenceSourceId } from './types';

/** What the source did, last time it was asked. */
export type SourceOutcome = 'SUCCESS' | 'FAILURE';

export interface SourceHealth {
  /**
   * `true` until observations actually fail. `UNKNOWN` is deliberately not a
   * state: a source nobody has called yet has produced no failure, and
   * inventing a third state would invite a consumer to branch on it.
   */
  readonly healthy: boolean;
  /** Consecutive failures since the last success. Zero after any success. */
  readonly consecutiveFailures: number;
  /** The last outcome recorded, or `null` before the first call. */
  readonly lastOutcome: SourceOutcome | null;
}

/**
 * How many consecutive failures before a source stops being reported healthy.
 *
 * ⚑ ONE IS TOO FEW and ten is a policy. A single timeout is ordinary network
 * weather and the existing per-call degradation already handles it correctly;
 * three in a row is the source, not the moment. This threshold changes NO
 * decision by itself — it only governs when `healthy` may still be claimed.
 */
const UNHEALTHY_AFTER_CONSECUTIVE_FAILURES = 3;

interface MutableHealth {
  consecutiveFailures: number;
  lastOutcome: SourceOutcome | null;
}

const health = new Map<EvidenceSourceId, MutableHealth>();

function entry(source: EvidenceSourceId): MutableHealth {
  let e = health.get(source);
  if (!e) {
    e = { consecutiveFailures: 0, lastOutcome: null };
    health.set(source, e);
  }
  return e;
}

/**
 * Record what happened when a source was asked.
 *
 * Called by the adapters at the collection seam. A success RESETS the count
 * rather than decrementing it: the question is "is it failing now", not "how
 * has it behaved on balance".
 */
export function recordSourceOutcome(source: EvidenceSourceId, outcome: SourceOutcome): void {
  const e = entry(source);
  e.lastOutcome = outcome;
  e.consecutiveFailures = outcome === 'FAILURE' ? e.consecutiveFailures + 1 : 0;
}

/** The current health of a source. Never throws; never blocks. */
export function sourceHealth(source: EvidenceSourceId): SourceHealth {
  const e = health.get(source);
  if (!e) return { healthy: true, consecutiveFailures: 0, lastOutcome: null };
  return {
    healthy: e.consecutiveFailures < UNHEALTHY_AFTER_CONSECUTIVE_FAILURES,
    consecutiveFailures: e.consecutiveFailures,
    lastOutcome: e.lastOutcome,
  };
}

/**
 * Whether a source may currently be REPORTED healthy.
 *
 * ⚑ This is the whole contract. It does not gate collection, does not select a
 * fallback and does not refuse a value. It exists so that nothing in the system
 * can claim a source is fine while its observations are failing.
 */
export function isSourceHealthy(source: EvidenceSourceId): boolean {
  return sourceHealth(source).healthy;
}

/** Test-only: drop the process-local health record (mirrors the cache resets). */
export function __resetSourceHealth(): void {
  health.clear();
}
