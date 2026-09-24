/**
 * CURRENT-CATALOGUE EVIDENCE REQUIREMENT — what a leg must supply to be listed.
 *
 * ⚑ THE DEFECT THIS REPLACES (`5.444`). `strategyRateAvailability` demanded a
 * current APY observation for EVERY allocation leg, whatever that leg's economic
 * return mechanism was. So a market / price-return leg — whose return IS its
 * price movement, and for which an APY is not the return at all — could make its
 * whole strategy unavailable by lacking a number it never needed.
 *
 * The ruling is a mapping, not an exception list:
 *
 * ```text
 * LEG -> ECONOMIC RETURN MECHANISM -> REQUIRED EVIDENCE
 *
 * never
 *
 * EVERY LEG -> APY
 * ```
 *
 * ⚑ DELIBERATELY NARROW. This answers ONE question — what the CATALOGUE needs to
 * list a strategy — because that is the only place the measured defect lives. It
 * is not a universal evidence resolver:
 *
 * ```text
 * NOT HERE   a ProductFunction enum · a CURRENT_PRICE requirement · a replay
 *            requirement type · an exit / network-cost requirement type
 * ```
 *
 * Replay is already typed and live (`journey.ts` branches on the return model and
 * gives market legs price history). Exit is already gated independently by
 * network cost. Current valuation has no consumer — the goal surface values a
 * position from the replay ledger, never from a current price. Building
 * abstractions for those here would be speculative architecture for functions
 * that either already work or do not exist.
 *
 * ⚑ NO PROTOCOL IS EVER NAMED. The answer comes from the leg's declared economic
 * identity. `jupiterJlp`, `sanctumInf` and `jito` receive identical treatment
 * because they are identically typed — not because any of them is mentioned.
 */

import { domainIdentityOf } from './domainIdentity';
import type { ProtocolId } from './types';

/**
 * What the catalogue needs from one leg in order to list its strategy.
 *
 * `NONE` is a real answer, not an absence: it states that this leg's return
 * mechanism does not produce a current rate, so no current rate is owed.
 */
export type CatalogueEvidenceRequirement =
  /** The rate IS the return mechanism — an accrual leg cannot be listed without it. */
  | 'CURRENT_RATE'
  /** The price movement IS the return — a current rate is not part of it. */
  | 'NONE';

/**
 * What the catalogue requires of this leg.
 *
 * Total by construction: the switch is exhaustive over the declared leg kinds,
 * so adding a kind without stating its catalogue requirement is a COMPILE error
 * rather than a silent default. A default here would recreate exactly the
 * type-blindness this module removes.
 */
export function catalogueRequirementFor(protocolId: ProtocolId): CatalogueEvidenceRequirement {
  const identity = domainIdentityOf(protocolId);
  switch (identity.kind) {
    case 'lending':
      return 'CURRENT_RATE';
    case 'market':
      return 'NONE';
  }
}

/**
 * Does this leg owe the catalogue a current rate?
 *
 * The predicate the availability check and the rate blend both ask, so the two
 * cannot drift apart into different ideas of which legs matter.
 */
export function legRequiresCurrentRate(protocolId: ProtocolId): boolean {
  return catalogueRequirementFor(protocolId) === 'CURRENT_RATE';
}
