/**
 * The shared evidence / cost semantics — Practice and Real, one contract.
 *
 * Strategy Canon Final Targeted Reconciliation 2026-09-18 makes four dimensions
 * INDEPENDENT, and forbids collapsing any of them into `mode`:
 *
 *   OBSERVED / MODELLED / PROXY      = EVIDENCE ORIGIN   (`EvidenceOrigin`, types.ts)
 *   REFERENCE / EXECUTABLE           = ACTIONABILITY     (here)
 *   AVAILABLE / UNAVAILABLE          = AVAILABILITY      (here)
 *   CURRENT / DELAYED / STALE / …    = FRESHNESS         (`TimeState` + `dataFreshness`)
 *
 * And three non-collapse rules this module exists to make structural:
 *
 *   EXTERNAL SOURCE ≠ OBSERVED   — origin is stamped explicitly, never inferred
 *                                  from where a value came from.
 *   Practice ≠ REFERENCE         — actionability is a property of the evidence
 *   Real     ≠ EXECUTABLE          contract, never of `LedgerScope` or mode.
 *   AVAILABILITY ≠ DATA QUALITY  — a datum may be AVAILABLE and INCONCLUSIVE at
 *                                  the same time. The instrumentation contract's
 *                                  OK/UNKNOWN/INCONCLUSIVE vocabulary describes
 *                                  TRUST, not presence, and is deliberately NOT
 *                                  reused here (Founder/Strategy §2).
 *
 * ⚑ CONDITIONAL TRUTH → CONDITIONALLY REQUIRED DATA. Every "…where applicable"
 * in canon is a discriminated arm here, never an optional field: UNAVAILABLE
 * carries a reason, EXECUTABLE carries validity + identity, and a conversion
 * carries its rate evidence. There is no shape in which a required fact can be
 * silently omitted — that is the "no optional soup" rule made structural.
 *
 * ⚑ NO SECOND SOURCE IDENTITY. The envelope composes `DataStamp`, which holds
 * the one authoritative `source`. This module deliberately declares none.
 *
 * Nothing here creates Real execution: authorization, signing, submission and
 * custody remain Real-only extensions outside this batch (canon §22).
 */

import type { DataStamp } from './types';

// ── Actionability ────────────────────────────────────────────────────────────

/**
 * What the evidence may be USED for — never what mode is showing it.
 *
 * `REFERENCE` informs; it may be displayed and reasoned about but may not carry
 * an authorization or execution. `EXECUTABLE` satisfies the contract applicable
 * to the operation actually being committed.
 *
 * Preserve: `EXECUTABLE EVIDENCE ≠ USER AUTHORIZATION ≠ EXECUTION CONFIRMATION`
 * (Legal §3B). Executable evidence does not authorize anything by existing.
 */
export type Actionability = 'REFERENCE' | 'EXECUTABLE';

// ── Availability ─────────────────────────────────────────────────────────────

/** Whether we HAVE the datum at all. Not freshness, and not data quality. */
export type Availability = 'AVAILABLE' | 'UNAVAILABLE';

/**
 * WHY a datum is unavailable. Required on the UNAVAILABLE arm, because
 * "unavailable" with no reason is the state `MISSING ≠ 0` exists to prevent —
 * it invites a caller to substitute zero.
 */
export type UnavailableReason =
  /** No observation for the thing asked about. */
  | 'NO_OBSERVATION'
  /** A conversion the answer depends on could not be made (e.g. no FX rate). */
  | 'NO_CONVERSION'
  /** Evidence exists but does not match the identity requested (wrong network/route). */
  | 'IDENTITY_MISMATCH'
  /** The model cannot truthfully represent the thing asked about (e.g. `5.406`). */
  | 'NOT_REPRESENTABLE'
  /** A contract refused it: too stale, expired, or insufficient for the journey state. */
  | 'REFUSED_BY_CONTRACT';

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Whether a value was converted, and on what evidence.
 *
 * Discriminated rather than an optional field: canon requires that when a
 * conversion occurred its provenance is preserved, so `converted: true` cannot
 * exist without the rate's own stamp. Today's network-fee display multiplies a
 * USD figure by an FX rate whose stamp the app carries but never associates
 * with the converted number (`5.225`) — this is the shape that ends that.
 */
export type Normalization =
  | { converted: false }
  | {
      converted: true;
      fromCurrency: string;
      toCurrency: string;
      /** The CONVERSION's own evidence — its own source, origin and vintage. */
      rateStamp: DataStamp;
    };

// ── Executable-only metadata ─────────────────────────────────────────────────

/** When executable evidence is good for. Required on the EXECUTABLE arm. */
export interface Validity {
  validFrom: string;
  validUntil: string;
}

/**
 * WHAT the executable evidence is evidence OF. Required on the EXECUTABLE arm:
 * a quote that cannot name the operation it priced cannot support a commitment.
 */
export interface ExecutableIdentity {
  /** Which source produced it — the same authoritative id the stamp carries. */
  providerId: DataStamp['source'];
  /** The route / transaction the quote belongs to, as the provider identifies it. */
  reference: string;
}

// ── Cost taxonomy ────────────────────────────────────────────────────────────

/**
 * The shared normalization taxonomy (canon §9). ECONOMIC MEANING AND OWNER —
 * not variable name, file name, or historical implementation label.
 *
 * ⚑ A future third-party ramp or provider cost is NOT `diboas` merely because
 * today's internal schedule happens to use a "ramp" label; it is `provider`.
 * Classification follows who the money actually goes to.
 *
 * This is a normalization taxonomy, NOT a mandate for one internal pricing
 * engine per category.
 */
export const COST_CATEGORIES = [
  'network',
  'protocol',
  'swap',
  'bridge',
  'provider',
  'diboas',
  'other',
] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number];

/**
 * What a cost figure actually COVERS.
 *
 * `aggregate` exists so that a source which bundles categories cannot be
 * presented as a narrower one: canon §9's `network + protocol + provider ≠
 * network`.
 */
export type CostCoverage =
  | { kind: 'single'; category: CostCategory }
  | { kind: 'aggregate'; categories: readonly CostCategory[] };

/**
 * The category a figure may TRUTHFULLY be presented as.
 *
 * A single-category cost presents as itself. An aggregate presents as `other` —
 * never as any one of its components — because naming one component would claim
 * the figure excludes the rest.
 */
export function presentedCategory(coverage: CostCoverage): CostCategory {
  if (coverage.kind === 'single') return coverage.category;
  const distinct = Array.from(new Set(coverage.categories));
  return distinct.length === 1 ? distinct[0] : 'other';
}

/** Would presenting `coverage` as `claimed` be a narrower claim than the truth? */
export function isCategoryClaimTruthful(coverage: CostCoverage, claimed: CostCategory): boolean {
  return presentedCategory(coverage) === claimed;
}

// ── The envelope ─────────────────────────────────────────────────────────────

/**
 * Evidence, with its four axes explicit and its conditional facts required.
 *
 * Freshness is deliberately NOT a member: it is derived from the stamp and a
 * clock by `dataFreshness`, never stored (a stored freshness stops being true
 * the moment it is written). Origin lives on the stamp, which is also the one
 * authoritative source identity.
 */
export type EvidenceEnvelope<T> =
  | {
      availability: 'UNAVAILABLE';
      reason: UnavailableReason;
      /** What the evidence WOULD have described, for an honest refusal message. */
      coverage: CostCoverage | null;
    }
  | {
      availability: 'AVAILABLE';
      actionability: 'REFERENCE';
      value: T;
      stamp: DataStamp;
      normalization: Normalization;
      coverage: CostCoverage;
    }
  | {
      availability: 'AVAILABLE';
      actionability: 'EXECUTABLE';
      value: T;
      stamp: DataStamp;
      normalization: Normalization;
      coverage: CostCoverage;
      /** Required: executable evidence that cannot expire is not executable evidence. */
      validity: Validity;
      /** Required: it must name the operation it priced. */
      identity: ExecutableIdentity;
    };

/** Reference evidence — informative, never a basis for authorization. */
export function referenceEvidence<T>(input: {
  value: T;
  stamp: DataStamp;
  normalization: Normalization;
  coverage: CostCoverage;
}): EvidenceEnvelope<T> {
  return { availability: 'AVAILABLE', actionability: 'REFERENCE', ...input };
}

/**
 * Executable evidence. Validity and identity are REQUIRED arguments — the
 * compiler, not a reviewer, is what stops an executable claim without them.
 */
export function executableEvidence<T>(input: {
  value: T;
  stamp: DataStamp;
  normalization: Normalization;
  coverage: CostCoverage;
  validity: Validity;
  identity: ExecutableIdentity;
}): EvidenceEnvelope<T> {
  return { availability: 'AVAILABLE', actionability: 'EXECUTABLE', ...input };
}

/** Unavailable, with the reason the refusal can be stated honestly from. */
export function unavailableEvidence<T>(
  reason: UnavailableReason,
  coverage: CostCoverage | null = null
): EvidenceEnvelope<T> {
  return { availability: 'UNAVAILABLE', reason, coverage };
}

/**
 * Is this evidence usable for a commitment?
 *
 * ⚑ Reads the EVIDENCE, and takes no mode/scope argument at all — so
 * "actionability inferred from mode" is not merely discouraged here, it is
 * unexpressible. Expired executable evidence is not executable (canon §13).
 */
export function isExecutable<T>(evidence: EvidenceEnvelope<T>, now: Date | string): boolean {
  if (evidence.availability !== 'AVAILABLE') return false;
  if (evidence.actionability !== 'EXECUTABLE') return false;
  const until = Date.parse(evidence.validity.validUntil);
  const ref = typeof now === 'string' ? Date.parse(now) : now.getTime();
  if (!Number.isFinite(until) || !Number.isFinite(ref)) return false;
  return ref <= until;
}
