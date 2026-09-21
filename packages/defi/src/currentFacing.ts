/**
 * CURRENT-FACING AVAILABILITY ENFORCEMENT — Stage H's one gate.
 *
 * M&E / Data ruling 2026-09-22 (`5.309` RESOLVED), for the governed class:
 *
 * ```text
 * <= 7 days     normal age window       -> AVAILABLE   (and NOT automatically CURRENT)
 * > 7 <= 14     STALE                   -> AVAILABLE   (bounded reference use)
 * > 14 days     outside acceptable
 *               current-facing vintage  -> UNAVAILABLE
 * ```
 *
 * And the three non-collapses the gate exists to preserve:
 *
 * ```text
 * freshness != availability   — except where the applicable policy explicitly
 *                               maps an age state to current-facing
 *                               unavailability, which is exactly >14 and
 *                               nothing else. STALE stays AVAILABLE.
 * freshness != actionability  — this gate never promotes or demotes
 *                               REFERENCE/EXECUTABLE.
 * UNAVAILABLE != 0 / FREE     — the refusal is an envelope arm with a reason,
 *                               so there is no shape in which a caller receives
 *                               a number it could mistake for a free operation.
 * ```
 *
 * ⚑ **EXECUTABLE EVIDENCE IS NOT GOVERNED HERE (ruling §9).** Real executable
 * quotes, route-specific quotes and provider quote expiry follow their own
 * `validity` / `validUntil` contract via `isExecutable`. Applying a Practice
 * periodic-reference age band to an executable quote would be a weaker default
 * overriding a stricter contract — the precise inversion the ruling forbids —
 * so the EXECUTABLE arm is returned untouched and `isExecutable` remains the
 * only thing that expires it.
 *
 * ⚑ **HISTORICAL REPLAY IS EXEMPT (ruling §5).** Every entry point here is
 * named *current-facing* and takes an explicit `now`. Replay must keep using
 * the evidence belonging to the historical state irrespective of its age today;
 * nothing in this module is reachable from that path, and a guard test pins it.
 *
 * ⚑ **GENERIC AXES ONLY (`5.435`).** This module reads `DataStamp` timing,
 * `availability` and `actionability`. It imports nothing from the cost
 * taxonomy: `CostCoverage` is carried through opaquely so the refusal can still
 * state what the evidence WOULD have described, and is never inspected.
 */

import type { EvidenceEnvelope } from './evidence';
import { freshnessUnder } from './freshness';
import {
  resolveFreshnessPolicy,
  type EvidenceClass,
  type FreshnessPolicy,
} from './freshnessPolicy';
import type { DataStamp } from './types';

/**
 * Is this stamp outside the acceptable CURRENT-FACING vintage?
 *
 * The single derivation of the >14-day rule. Both the envelope gate below and
 * the app's number path resolve through it, so the two cannot drift — system
 * gate X1, which is the defect class a second age check would create.
 */
export function isRefusedForCurrentFacingUse(
  stamp: DataStamp,
  now: Date | string,
  policy: FreshnessPolicy = resolveFreshnessPolicy({ source: stamp.source })
): boolean {
  return freshnessUnder(stamp, now, policy) === 'MISSING';
}

/**
 * Apply the current-facing age contract to evidence.
 *
 * Returns the SAME envelope in every case but one: REFERENCE evidence whose
 * stamp is outside the acceptable current-facing vintage becomes UNAVAILABLE
 * with `REFUSED_BY_CONTRACT`, preserving `coverage` so the refusal can be
 * stated honestly rather than as a bare absence.
 *
 * The policy is resolved from the evidence's own source unless the caller names
 * a classification — resolution never weakens the default (`freshnessPolicy`).
 */
export function enforceCurrentFacingAvailability<T>(
  evidence: EvidenceEnvelope<T>,
  now: Date | string,
  subject: { evidenceClass?: EvidenceClass } = {}
): EvidenceEnvelope<T> {
  /* Already refused: nothing to enforce, and re-deriving a reason would
     overwrite a more specific one with a less specific one. */
  if (evidence.availability !== 'AVAILABLE') return evidence;
  /* Executable evidence answers to its own expiry, never to this default. */
  if (evidence.actionability === 'EXECUTABLE') return evidence;
  const policy = resolveFreshnessPolicy({
    source: evidence.stamp.source,
    evidenceClass: subject.evidenceClass,
  });
  if (!isRefusedForCurrentFacingUse(evidence.stamp, now, policy)) return evidence;
  return {
    availability: 'UNAVAILABLE',
    reason: 'REFUSED_BY_CONTRACT',
    coverage: evidence.coverage,
  };
}
