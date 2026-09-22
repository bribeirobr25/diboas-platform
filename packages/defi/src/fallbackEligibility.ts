/**
 * FALLBACK ELIGIBILITY — when the primary is gone, may anything stand in?
 *
 * ⚑ THE DEFECT THIS REPLACES. Every provider adapter decided this for itself,
 * inside a `catch`: six trigger paths across two files, each one unilaterally
 * returning the documented fixture. Nothing asked whether the substitute was
 * cleared for that use, because there was nothing to ask. Founder/Legal
 * 2026-09-22 rules it directly:
 *
 * ```text
 * FALLBACK MAY ACTIVATE ONLY WHEN
 *   technically eligible
 *   + independently legally cleared
 *   + expenditure-authorized where applicable
 *
 * AUTOMATIC UNCLEARED FALLBACK = PROHIBITED
 * AUTOMATIC PAID FALLBACK      = PROHIBITED
 * NO ELIGIBLE FALLBACK         = CONTROLLED UNAVAILABLE
 * ```
 *
 * ⚑ `PRIMARY RIGHTS != FALLBACK RIGHTS` (Legal). This is why eligibility is a
 * separate module from `providerDisposition.ts` and not a field on it: the
 * question "may we use DeFiLlama" and the question "may the fixture stand in
 * for DeFiLlama" have different answers, different owners and different
 * evidence. Collapsing them is the mistake that made the `catch` blocks look
 * reasonable in the first place.
 *
 * ⚑ CLEARANCE IS NEVER INFERRED. Not from the fixture existing, not from
 * credentials being present, not from the API answering, not from the value
 * being fresh, and not from the fetch having succeeded. Each of those is a
 * TECHNICAL fact; none of them is a RIGHT. The only thing that makes a fallback
 * eligible is a declaration in the table below with a stated authority.
 *
 * ⚑ FRESHNESS GRANTS NOTHING. Eligibility is decided before and independently
 * of Stage H. A fixture refreshed to one day old is exactly as ineligible as a
 * sixty-day-old one if its rights are not cleared — which is the `5.110`
 * interlock, and is sabotage-proven rather than asserted.
 */

import { permitsUse } from './providerDisposition';
import type { EvidenceSourceId } from './types';

/**
 * What is being served. One entry per adapter operation that can fail, because
 * a per-PROVIDER key would have said nothing about the class of evidence whose
 * rights are actually at issue.
 */
export type EvidenceSubject =
  'APY_CURRENT' | 'APY_HISTORY' | 'PRICE_CURRENT' | 'PRICE_HISTORY' | 'NETWORK_COST';

export type FallbackRefusal =
  /** Nothing is declared for this subject. The default, and the safe one. */
  | 'NO_DECLARED_FALLBACK'
  /** Declared, but its own rights are not cleared for this use. */
  | 'RIGHTS_NOT_CLEARED'
  /** Declared, but it would cost money, and no expenditure is authorized. */
  | 'EXPENDITURE_NOT_AUTHORIZED'
  /** Declared and cleared, but the substitute's own disposition refuses it. */
  | 'FALLBACK_SOURCE_NOT_PERMITTED';

/**
 * ⚑ `expenditure` ACCEPTS EXACTLY ONE VALUE, and that is the enforcement.
 *
 * `AUTOMATIC PAID FALLBACK = PROHIBITED` is expressed by making a paid eligible
 * fallback UNREPRESENTABLE: there is no member of this type that is both
 * `eligible: true` and costly. Authorising one later is therefore a deliberate
 * widening of a type under review, never a config edit. A runtime re-check in
 * `fallbackFor` backs this up, because types are gone at runtime and a
 * declaration can arrive through a cast.
 */
export type FallbackDecision =
  | { readonly eligible: false; readonly reason: FallbackRefusal }
  | {
      readonly eligible: true;
      readonly source: EvidenceSourceId;
      /** The authority that cleared it. Not a restatement of the decision. */
      readonly clearance: string;
      readonly expenditure: 'NONE';
    };

/**
 * The declared fallbacks. `Record<EvidenceSubject, …>`, so a new subject with
 * no decision is a COMPILE ERROR rather than a silent permit.
 */
const FALLBACKS: Record<EvidenceSubject, FallbackDecision> = {
  APY_CURRENT: {
    eligible: true,
    source: 'fixture',
    clearance:
      'diBoaS-authored reference values: internally owned provenance, no third-party rights engaged — the basis already recorded in the F-A ingestion guard, which admits the fixture lane precisely because it is "evidence diBoaS itself owns end to end". Serving is a weaker right than the persistence that basis already supports.',
    expenditure: 'NONE',
  },
  APY_HISTORY: {
    eligible: true,
    source: 'fixture',
    clearance: 'As APY_CURRENT — same internally-owned reference corpus.',
    expenditure: 'NONE',
  },
  PRICE_CURRENT: {
    eligible: true,
    source: 'fixture',
    clearance: 'As APY_CURRENT — same internally-owned reference corpus.',
    expenditure: 'NONE',
  },
  PRICE_HISTORY: {
    eligible: true,
    source: 'fixture',
    clearance: 'As APY_CURRENT — same internally-owned reference corpus.',
    expenditure: 'NONE',
  },
  /**
   * Network cost has NO fallback, and the honest reason is that it has no
   * primary to fall back FROM: the fixture IS the source. Declaring a fallback
   * here would describe a path that cannot be taken.
   */
  NETWORK_COST: { eligible: false, reason: 'NO_DECLARED_FALLBACK' },
};

const REFUSED = (reason: FallbackRefusal): FallbackDecision => ({ eligible: false, reason });

/**
 * May a fallback serve `subject`?
 *
 * Every arm below refuses. There is no arm that permits something the table did
 * not declare, and no default parameter, `??` or `||` that could supply one —
 * an absent decision is an absent right.
 *
 * `alsoDisabled` is the deployment's operational kill switch, passed through so
 * that disabling a source also stops it standing in for something else. A kill
 * switch that stopped a source as a primary while leaving it serving as a
 * fallback would not be a kill switch.
 */
export function fallbackFor(
  subject: EvidenceSubject,
  alsoDisabled?: ReadonlySet<string>
): FallbackDecision {
  const declared = FALLBACKS[subject] as FallbackDecision | undefined;
  if (!declared) return REFUSED('NO_DECLARED_FALLBACK');
  if (!declared.eligible) return declared;
  /* Runtime re-check of the paid-fallback prohibition. The type already makes
     it unrepresentable; this catches a declaration that arrived through a cast,
     which is exactly how the `5.438` vacuous tests got past a required field. */
  if (declared.expenditure !== 'NONE') return REFUSED('EXPENDITURE_NOT_AUTHORIZED');
  /* PRIMARY RIGHTS != FALLBACK RIGHTS, and the substitute has a disposition of
     its own. Serving a value to a user is a CURRENT_FACING use of that source. */
  if (!permitsUse(declared.source, 'CURRENT_FACING', alsoDisabled)) {
    return REFUSED('FALLBACK_SOURCE_NOT_PERMITTED');
  }
  return declared;
}
