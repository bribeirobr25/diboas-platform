/**
 * EVIDENCE OBSERVABILITY — what the evidence path actually did.
 *
 * ⚑ THE GAP THIS FILLS. The evidence path had no instrumentation at all, so
 * every honest degradation was also a SILENT one. Block B's own record names
 * the consequence exactly: if a pool is listed under a symbol the declared
 * identity does not accept, that leg falls back to its documented fixture —
 * truthfully, and with nothing anywhere saying it happened. A system that
 * degrades correctly but invisibly is one bad week away from serving fixtures
 * to everyone while every dashboard stays green.
 *
 * ⚑ SMALLEST USEFUL INCREMENT, and bounded by the ratified plan:
 *
 * ```text
 * IS      a process-local record of evidence-path outcomes, drainable by a host
 * IS NOT  a monitoring platform · an alerting system · a metrics backend ·
 *         a sampler · a tracer · anything that performs I/O of its own
 * ```
 *
 * It writes nothing, opens nothing and calls nothing. A host that wants these
 * somewhere drains them and decides; this package stays environment-free.
 *
 * ⚑ G REPORTS, A DECIDES. `sourceHealth` exists so nothing can CLAIM a failing
 * source is fine, and it is read by the disposition/fallback decision point.
 * This module changes no decision whatsoever — it is a record of what was
 * already decided. Collapsing the two would make a reporting path into a
 * control path, which is how observability quietly acquires authority.
 *
 * ⚑ NO PAYLOADS, NO VALUES, NO SECRETS. An event carries the subject, the
 * source id, the outcome and a declared reason code — never a price, a rate, a
 * URL, a key or a response body. There is nothing here for a log scraper to
 * find, which is deliberate for a public repository and a money surface.
 */

import type { BoundsRefusal } from './evidenceBounds';
import type { UnavailableReason } from './evidence';
import type { EvidenceSubject } from './fallbackEligibility';
import type { EvidenceSourceId, ProtocolId } from './types';

/**
 * What happened when evidence for a subject was sought — or, for
 * `NOT_REQUIRED`, why it was never sought at all.
 */
export type EvidenceOutcome =
  /** The primary source answered and its value was served. */
  | 'SERVED_PRIMARY'
  /** The primary was unusable and an ELIGIBLE fallback served instead. */
  | 'SERVED_FALLBACK'
  /** Nothing could truthfully answer. Controlled unavailable. */
  | 'REFUSED'
  /**
   * ⛑ `5.444` §16 · NO EVIDENCE WAS OWED, so none was sought and nothing was
   * gated on it.
   *
   * The other three outcomes all answer *"what did the source do?"*. This one
   * answers a question that comes BEFORE a source is consulted: does this leg's
   * return mechanism produce this kind of evidence at all? A market leg's
   * return is its price, so a current rate is not missing from it — it was
   * never owed. Recording that as `REFUSED` would report a refusal that did not
   * happen, and recording it as `SERVED_*` would claim a source acted. It is
   * its own outcome because it is its own fact.
   */
  | 'NOT_REQUIRED';

/** Why an outcome was not `SERVED_PRIMARY`. A closed vocabulary, never free text. */
export type EvidenceReason =
  | UnavailableReason
  | BoundsRefusal
  | 'SOURCE_NOT_PERMITTED'
  | 'IDENTITY_NOT_SATISFIED'
  | 'COMPOSITION_UNDETERMINED'
  | 'FETCH_FAILED';

export interface EvidenceEvent {
  readonly subject: EvidenceSubject;
  /**
   * The source consulted, or `null` when none was.
   *
   * ⛑ `5.444` §16. A catalogue decision is reached before any source is asked,
   * so naming one would invent a participant. `null` says "no source was
   * consulted" — which is the fact. It is deliberately NOT a new
   * `EvidenceSourceId` member: that type keys `SOURCE_DISPOSITIONS`, and a
   * non-source with an operational disposition would be a lie with a Record
   * entry.
   */
  readonly source: EvidenceSourceId | null;
  /**
   * WHICH leg the decision was about, when it was about one.
   *
   * ⛑ `5.444` §16 — and it closes a gap that predates this lane. `degrade()`
   * in the DeFiLlama adapter already RECEIVES `protocolId` and throws it away,
   * so a stream of `SERVED_FALLBACK` events could say that legs degraded but
   * never which. A per-leg decision recorded without the leg is half an
   * observation.
   *
   * ⚑ A DOMAIN identity, never a provider one (`PROVIDER ID ≠ DOMAIN
   * IDENTITY`). `ProtocolId` is diBoaS's own catalogue vocabulary and is
   * already public in `STRATEGY_CATALOG`; no pool id, slug or vendor SKU may
   * ever be put here.
   */
  readonly leg: ProtocolId | null;
  readonly outcome: EvidenceOutcome;
  readonly reason: EvidenceReason | null;
  /** When the event was recorded. Not an evidence timestamp — never confuse the two. */
  readonly at: string;
}

/**
 * The ring's size.
 *
 * ⚑ BOUNDED ON PURPOSE. An unbounded buffer in a long-lived process is a leak
 * with a helpful name. Oldest events are dropped, because a recent picture that
 * costs nothing beats a complete one that costs memory — and anything that
 * needs completeness should be draining.
 */
const MAX_EVENTS = 500;

let events: EvidenceEvent[] = [];

/**
 * Record what the evidence path did.
 *
 * Never throws: an observability failure must not become an evidence failure.
 */
export function recordEvidenceEvent(input: {
  subject: EvidenceSubject;
  source: EvidenceSourceId | null;
  leg?: ProtocolId | null;
  outcome: EvidenceOutcome;
  reason?: EvidenceReason | null;
  now?: Date;
}): void {
  try {
    events.push({
      subject: input.subject,
      source: input.source,
      leg: input.leg ?? null,
      outcome: input.outcome,
      reason: input.reason ?? null,
      at: (input.now ?? new Date()).toISOString(),
    });
    if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  } catch {
    /* Reporting must never break the thing it reports on. */
  }
}

/** Read the recorded events without consuming them. */
export function evidenceEvents(): readonly EvidenceEvent[] {
  return events;
}

/** Take the recorded events and clear the buffer. */
export function drainEvidenceEvents(): EvidenceEvent[] {
  const taken = events;
  events = [];
  return taken;
}

/**
 * A count per outcome, for the one question worth asking cheaply:
 * *is the primary still answering, or are we quietly on fixtures?*
 */
export function evidenceOutcomeCounts(): Record<EvidenceOutcome, number> {
  const counts: Record<EvidenceOutcome, number> = {
    SERVED_PRIMARY: 0,
    SERVED_FALLBACK: 0,
    REFUSED: 0,
    NOT_REQUIRED: 0,
  };
  for (const e of events) counts[e.outcome] += 1;
  return counts;
}

/** Test-only: drop the process-local buffer (mirrors the cache and health resets). */
export function __resetEvidenceEvents(): void {
  events = [];
}
