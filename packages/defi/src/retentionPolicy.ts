/**
 * RETENTION — per evidence class, never one universal number.
 *
 * ⚑ THE DEFECT THIS REPLACES. One rule — 90 elapsed days from `retrievedAt` —
 * governed everything. It was written for DERIVED MARKET EVIDENCE and is
 * correct for that class. Applied universally it makes build-forward replay
 * history structurally impossible: a window that needs a year of daily
 * boundaries cannot be served from a store that discards at ninety days.
 *
 * ⚑ COVERAGE IS NOT A TTL. The replay requirement is
 *
 * ```text
 * 365 complete replay days + the required boundary observation(s)
 * ```
 *
 * i.e. for a daily boundary series, semantic coverage equivalent to 366
 * consecutive UTC boundary observations. Evidence is retained because the
 * WINDOW needs it, not because a clock has not yet expired. Expressing that as
 * "366 days TTL" would be wrong in both directions: it would discard a point
 * the window still needs, and keep points it does not.
 *
 * ⚑ NO UNIVERSAL RETENTION PERIOD IS ESTABLISHED (Refresh §14, Strategy §25).
 * Preserving historical truth must not silently become indefinite retention or
 * one period for everything, and personal-data purpose, lawful basis, access,
 * retention, correction, export and deletion remain live Legal/Privacy
 * dependencies.
 *
 * ⚑ STORAGE PURPOSES (reset §11): replay · provenance · source substitution ·
 * **audit / debugging**. The fourth is why an evidence store may legitimately
 * be shorter-lived than the event-level provenance that already preserves
 * decision truth.
 */

/** The classes that retain differently because they are retained for different reasons. */
export type RetentionClass =
  /** Normalized current-facing market evidence. The original 90-day rule's subject. */
  | 'DERIVED_MARKET_EVIDENCE'
  /** Series that must reproduce an authorized replay window without gaps. */
  | 'REPLAY_HISTORY'
  /** Methodology and source metadata the retained evidence depends on. */
  | 'PROVENANCE'
  /** Raw transport payloads. Not persisted today. */
  | 'RAW_TRANSIENT';

export type RetentionRule =
  | {
      readonly kind: 'ELAPSED_DAYS';
      readonly days: number;
      readonly because: string;
    }
  | {
      readonly kind: 'COVERAGE';
      /** Complete replay days the window must be able to reproduce. */
      readonly replayDays: number;
      /** Boundary observations required in addition to those days. */
      readonly boundaryObservations: number;
      readonly because: string;
    }
  | {
      readonly kind: 'AT_LEAST_AS_LONG_AS';
      /** The class whose retained evidence depends on this one. */
      readonly dependentOf: RetentionClass;
      readonly because: string;
    }
  | {
      readonly kind: 'NOT_PERSISTED';
      readonly because: string;
    };

const RETENTION_POLICIES: Record<RetentionClass, RetentionRule> = {
  DERIVED_MARKET_EVIDENCE: {
    kind: 'ELAPSED_DAYS',
    days: 90,
    because:
      'The original M&E rule, unchanged and still correct for the class it was written for: normalized current-facing evidence has no reason to outlive its operational usefulness.',
  },
  REPLAY_HISTORY: {
    kind: 'COVERAGE',
    replayDays: 365,
    boundaryObservations: 1,
    because:
      'Retain enough normalized evidence to reproduce the complete authorized replay window without interpolation, fabricated continuity or loss of required boundary state. A COVERAGE requirement, not a 366-day TTL.',
  },
  PROVENANCE: {
    kind: 'AT_LEAST_AS_LONG_AS',
    dependentOf: 'REPLAY_HISTORY',
    because:
      'Methodology and source metadata must outlive nothing and predecease nothing: evidence whose provenance has been discarded can no longer state what it was.',
  },
  RAW_TRANSIENT: {
    kind: 'NOT_PERSISTED',
    because:
      'Raw transport payloads are not persisted today. If they ever are, they may be shorter-lived than the normalized evidence derived from them, subject to source rights.',
  },
};

export function retentionFor(cls: RetentionClass): RetentionRule {
  return RETENTION_POLICIES[cls];
}

/** Why a retention requirement and a permitted ceiling cannot both be met. */
export type RetentionConflict = 'PERMITTED_CEILING_SHORTER_THAN_REQUIRED_COVERAGE';

export type RetentionReconciliation =
  | { readonly satisfiable: true; readonly requiredDays: number }
  | {
      readonly satisfiable: false;
      readonly conflict: RetentionConflict;
      readonly requiredDays: number;
    };

/**
 * Reconcile what the Product REQUIRES against what rights PERMIT.
 *
 * ⚑ THIS IS A CONJUNCTION, NOT A `min()`. M&E defines the minimum replay
 * coverage; Legal, privacy and source rights define the permitted retention
 * envelope. Both must be simultaneously satisfiable.
 *
 * If the permitted ceiling is SHORTER than the required coverage, the outcome
 * is **not** "the shorter one wins". That source/storage model is INELIGIBLE
 * for the affected replay requirement, and the system must use another eligible
 * evidence path or degrade that replay to CONTROLLED UNAVAILABLE.
 *
 * A `min()` here would silently produce a shorter-than-required window and call
 * it compliant — a replay that cannot reach its boundary would render as though
 * it could. An ineligibility verdict surfaces the conflict instead of absorbing
 * it.
 */
export function reconcileRetention(input: {
  cls: RetentionClass;
  /** Days the applicable rights permit retaining, or `null` for no stated ceiling. */
  permittedCeilingDays: number | null;
}): RetentionReconciliation {
  const rule = RETENTION_POLICIES[input.cls];
  const requiredDays =
    rule.kind === 'COVERAGE'
      ? rule.replayDays + rule.boundaryObservations
      : rule.kind === 'ELAPSED_DAYS'
        ? rule.days
        : 0;
  if (input.permittedCeilingDays === null) return { satisfiable: true, requiredDays };
  if (input.permittedCeilingDays < requiredDays) {
    return {
      satisfiable: false,
      conflict: 'PERMITTED_CEILING_SHORTER_THAN_REQUIRED_COVERAGE',
      requiredDays,
    };
  }
  return { satisfiable: true, requiredDays };
}
