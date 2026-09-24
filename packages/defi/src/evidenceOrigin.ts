/**
 * EVIDENCE ORIGIN — determined per source and subject, never assumed.
 *
 * ⚑ THE DEFECT THIS REPLACES. Both live adapters wrote `origin: 'OBSERVED'` as
 * a LITERAL at four call sites. Nothing recorded WHY, and nothing distinguished
 * "we determined this source observes the value" from "OBSERVED is what the
 * first draft typed". A constant is not a determination.
 *
 * Canon states the controlling invariant in four documents:
 *
 * ```text
 * EXTERNAL SOURCE
 * ≠ AUTOMATICALLY OBSERVED
 * ```
 *
 * — Strategy Canon 2026-09-18 §5/§23 · M&E 2026-09-18 §4 + Patch C ·
 *   Product/UIUX 2026-09-18 §9 + Patch B · Legal 2026-09-18 §3B ·
 *   Practice Market Data Refresh 2026-09-22 §9.
 *
 * An externally sourced value may be OBSERVED, MODELLED or PROXY **depending on
 * what the source actually provides**. That is a question about the source, so
 * the answer belongs in a table with its basis written down — not inline at the
 * moment a stamp happens to be constructed.
 *
 * ⚑ FAIL-CLOSED BY CONSTRUCTION. The table is an exhaustive
 * `Record<EvidenceSourceId, Record<EvidenceSubject, …>>`: a new source, or a
 * new evidence subject, is a COMPILE error until someone states what that
 * source supplies for it. There is no default, because a default would restore
 * exactly the silence this module exists to remove.
 *
 * ⚑ ORIGIN IS NOT SEMANTICS. Origin answers "did the source observe this or
 * derive it". It does NOT answer "what does the number mean" — supply vs
 * borrow, base vs incentive, native vs bridged. Those are the DOMAIN identity
 * questions Block B resolves. An entry may therefore be truthful about origin
 * while its subject's semantics remain undetermined; `pendingSemantics` marks
 * exactly that case so it is visible rather than implied.
 */

import type { EvidenceSubject } from './fallbackEligibility';
import type { EvidenceOrigin, EvidenceSourceId } from './types';

/**
 * A stated determination about what one source supplies for one subject.
 *
 * `because` is not decoration: it is the determination. A reviewer must be able
 * to check the claim against the source's own documentation without reading the
 * adapter, and a future source swap must be forced to restate it rather than
 * inherit it.
 */
export interface OriginDetermination {
  readonly origin: EvidenceOrigin;
  /** The basis for this determination, in terms of what the source publishes. */
  readonly because: string;
  /**
   * Set where the ORIGIN is stated but the subject's economic SEMANTICS are not
   * yet determined, and the ratified plan resolves them in a later block.
   *
   * ⚑ This does not soften the origin claim. It records that a second,
   * independent question about the same value is still open, so that nobody
   * reads a truthful origin as evidence that the semantics were settled too.
   */
  readonly pendingSemantics?: string;
}

/**
 * What each source supplies, per subject.
 *
 * ⚑ NO SPECULATIVE ENTRIES. Exactly the three sources the registry declares.
 * A subject a source cannot serve at all still needs an entry, because the
 * honest answer ("this source does not supply it") is itself a determination —
 * recorded as the origin it WOULD carry, with the basis saying so.
 */
const ORIGIN_DETERMINATIONS: Record<
  EvidenceSourceId,
  Record<EvidenceSubject, OriginDetermination>
> = {
  coingecko: {
    PRICE_CURRENT: {
      origin: 'OBSERVED',
      because:
        '/simple/price returns the current market price CoinGecko aggregates from traded venues. It is a market observation, aggregated — not a diBoaS derivation and not a projection.',
    },
    PRICE_HISTORY: {
      origin: 'OBSERVED',
      because:
        '/coins/{id}/market_chart daily points are the same aggregated market observation, sampled at a daily boundary.',
    },
    APY_CURRENT: {
      origin: 'PROXY',
      because:
        'CoinGecko publishes no protocol rate. It is declared here only so the table stays exhaustive; no adapter path asks this source for APY.',
    },
    APY_HISTORY: {
      origin: 'PROXY',
      because: 'As APY_CURRENT — CoinGecko supplies no rate series for a protocol leg.',
    },
    NETWORK_COST: {
      origin: 'PROXY',
      because:
        'CoinGecko supplies a native-token PRICE, never a network cost. Any cost built from it is a diBoaS derivation and carries the deriving methodology’s own origin, not this one.',
    },
  },
  defillama: {
    APY_CURRENT: {
      origin: 'OBSERVED',
      because:
        'DeFiLlama reports the pool rate it reads from the protocol. What that rate COMPOSES is not stated by the payload, which is a semantics question, not an origin one.',
      pendingSemantics:
        'Block B — supply vs borrow, base vs incentive, native vs bridged are undetermined for this subject today (POOL_MATCHERS admits USDC and USDC.E alike, and four project names for skySsr). Until B establishes the domain identity, this entry states the origin ONLY.',
    },
    APY_HISTORY: {
      origin: 'OBSERVED',
      because: '/chart returns the same reported pool rate, sampled per day.',
      pendingSemantics: 'Block B — as APY_CURRENT.',
    },
    PRICE_CURRENT: {
      origin: 'PROXY',
      because:
        'DeFiLlama is not an asset-price source in this build; declared for exhaustiveness, asked by no adapter path.',
    },
    PRICE_HISTORY: {
      origin: 'PROXY',
      because:
        'As PRICE_CURRENT — DeFiLlama publishes no asset-price series for the market legs, and no adapter path asks it for one.',
    },
    NETWORK_COST: {
      origin: 'PROXY',
      because: 'DeFiLlama supplies no network cost.',
    },
  },
  fixture: {
    APY_CURRENT: {
      origin: 'MODELLED',
      because:
        'diBoaS-authored reference values. Documented placeholders, not an observation of anything — which is why FIXTURE_STAMP has always carried MODELLED and fallbackUsed.',
    },
    APY_HISTORY: {
      origin: 'MODELLED',
      because: 'A flat series at the documented reference rate. Authored, not observed.',
    },
    PRICE_CURRENT: {
      origin: 'MODELLED',
      because: 'diBoaS-authored reference prices.',
    },
    PRICE_HISTORY: {
      origin: 'MODELLED',
      because: 'diBoaS-authored reference series.',
    },
    NETWORK_COST: {
      origin: 'MODELLED',
      because:
        'diBoaS-authored reference cost per chain. No request is issued and no chain is read, so there is nothing here that could be observed.',
    },
  },
};

/**
 * The determination for one source and subject.
 *
 * Call this instead of writing an origin literal. The lookup is total — the
 * table is exhaustive by type — so there is no failure mode to handle and no
 * default to fall through to.
 */
export function originDetermination(
  source: EvidenceSourceId,
  subject: EvidenceSubject
): OriginDetermination {
  return ORIGIN_DETERMINATIONS[source][subject];
}

/** The determined origin alone, for the common stamping case. */
export function originOf(source: EvidenceSourceId, subject: EvidenceSubject): EvidenceOrigin {
  return ORIGIN_DETERMINATIONS[source][subject].origin;
}
