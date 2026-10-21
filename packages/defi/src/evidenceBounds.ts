/**
 * PLAUSIBLE DOMAIN BOUNDS — the third of the five minimum validation checks.
 *
 * Proportionality Reset v1.1 §10 names the minimum Practice validation:
 *
 * ```text
 * required fields present          EXISTING  (evidenceCodec / evidencePayload)
 * timestamp valid                  EXISTING  (freshness / evidence / retention)
 * value within plausible bounds    THIS MODULE
 * source/provider healthy          sourceHealth.ts
 * freshness state computed truthfully  EXISTING  (freshness + Stage H)
 * ```
 *
 * Before this module the repository had finiteness and sign only — a pool
 * reporting `apy: 9000` passed every check there was.
 *
 * ⚑ REFUSE, NEVER CLAMP. An out-of-bounds value is not repaired into range. A
 * clamped value is a FABRICATED value, which Architecture §9 and reset §2 both
 * prohibit outright; the honest result is the refusal path the adapters already
 * have, which reaches the existing controlled-unavailable behaviour.
 *
 * ⚑ VALIDATION ≠ ECONOMIC TRUTH GUARANTEE. These are CORRUPTION detectors, not
 * economic judgements. A value inside its bounds is not thereby correct, and no
 * surface may present it as verified because it passed here. The bounds are set
 * where a number stops being a market and starts being a broken payload —
 * deliberately generous, because a tight bound would silently become an
 * unratified economic opinion about what a rate is allowed to be.
 *
 * ⚑ PER CLASS, NOT ONE UNIVERSAL RULE. Keyed by `EvidenceSubject`, which is the
 * same key fallback eligibility uses, so a new evidence class cannot be added
 * without stating its bounds (exhaustive Record ⇒ compile error).
 */

import type { EvidenceSubject } from './fallbackEligibility';

/** Why a value was refused. Recorded, never repaired. */
export type BoundsRefusal = 'NOT_FINITE' | 'BELOW_MINIMUM' | 'ABOVE_MAXIMUM';

export interface Bounds {
  /** Lower bound — inclusive, unless `minExclusive`. */
  readonly min: number;
  /** `min` itself is REFUSED: a class where zero is a missing value, not a measurement. */
  readonly minExclusive?: true;
  /** Inclusive upper bound. */
  readonly max: number;
  /** What makes a value beyond these corrupt rather than merely unusual. */
  readonly because: string;
}

/**
 * The declared bounds per evidence subject.
 *
 * ⚑ The ceilings are corruption thresholds. None of the six catalogue
 * protocols operates anywhere near them; a value that reaches one is a payload
 * defect, a unit error or a decimal shift, not a market.
 */
const BOUNDS: Record<EvidenceSubject, Bounds> = {
  APY_CURRENT: {
    min: 0,
    max: 1000,
    because:
      'A negative supply rate is not representable in this contract, and a four-digit percent is a unit or decimal defect rather than a rate. Deliberately far above any catalogue protocol so the bound never becomes an economic opinion.',
  },
  APY_HISTORY: {
    min: 0,
    max: 1000,
    because: 'As APY_CURRENT, applied per point so one corrupt sample cannot enter a series.',
  },
  PRICE_CURRENT: {
    min: 0,
    minExclusive: true,
    max: 1_000_000_000,
    because:
      'A non-positive price is a missing value wearing a number. A unit priced above a billion is a decimal shift, not a market.',
  },
  PRICE_HISTORY: {
    min: 0,
    minExclusive: true,
    max: 1_000_000_000,
    because: 'As PRICE_CURRENT, applied per point.',
  },
  NETWORK_COST: {
    min: 0,
    minExclusive: true,
    max: 10_000,
    because:
      'A non-positive network cost would read as free, which UNAVAILABLE ≠ FREE forbids. A five-figure single-transaction cost is a unit error between native units and USD.',
  },
};

/**
 * `null` when the value is within bounds; the refusal reason when it is not.
 *
 * ⚑ `min` is INCLUSIVE where zero is meaningful (a 0 % rate is a rate) and EXCLUSIVE
 * where it is not: a price or a network cost of exactly 0 is the "missing value wearing a
 * number" its own `because` describes, and would read as free (lane audit 2026-10-20 —
 * the bound used to be inclusive for every class, contradicting those reasons; a 0 point
 * then passed a price series and was patched by the replay instead of being refused).
 */
export function boundsRefusal(subject: EvidenceSubject, value: number): BoundsRefusal | null {
  if (!Number.isFinite(value)) return 'NOT_FINITE';
  const { min, max, minExclusive } = BOUNDS[subject];
  if (value < min || (minExclusive && value === min)) return 'BELOW_MINIMUM';
  if (value > max) return 'ABOVE_MAXIMUM';
  return null;
}

/** True when the value may be served for this subject. */
export function withinBounds(subject: EvidenceSubject, value: number): boolean {
  return boundsRefusal(subject, value) === null;
}

/** The declared bounds for a subject, for records and tests. */
export function boundsFor(subject: EvidenceSubject): Bounds {
  return BOUNDS[subject];
}
