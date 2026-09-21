/**
 * Evidence IDENTITY — WHAT a datum is about, and nothing else.
 *
 * ```text
 * evidenceKey = "<kind>:<subject>:<unit>"
 * ```
 *
 * Three segments, all mandatory. The unit segment is never omitted: a
 * dimensionless measure carries the reserved token `ratio` explicitly, because
 * an optional segment would make parsing partial and would let a caller stay
 * silent about a fact that decides identity — the same "no optional soup" rule
 * the envelope is built on.
 *
 * ⚑ UNIT IS IDENTITY. CONVERSION IS PROVENANCE.
 * `network-cost:Arbitrum:USD` and `network-cost:Arbitrum:EUR` are two DISTINCT
 * persisted semantics, whether or not a conversion produced either of them. A
 * numeric value expressed in EUR is not the same persisted fact as the same
 * measure expressed in USD. Whether a conversion happened, from what, and on
 * whose rate lives in `Normalization` — never in the key.
 *
 * ⚑ DELIBERATELY ABSENT from identity, each for a stated reason:
 *
 * - `source` — canon §19: Product semantics must not depend on one provider.
 *   If source were identity, replacing a fixture with a collector would create
 *   a DIFFERENT evidence stream for the same real-world fact and sever the
 *   historical continuity §13 requires. Source is provenance (`DataStamp`).
 * - `origin` / `actionability` / `availability` / `freshness` — the four
 *   independent axes (canon §5). An axis in the key would make the key change
 *   when the axis changes, which is the collapse the axes exist to prevent.
 * - `Practice` / `Real` — mode is POLICY over shared evidence, never evidence
 *   identity (Strategy 2026-09-18 §20, Legal §3A).
 * - UI locale — a German and an Irish viewer both reading EUR resolve to the
 *   same key. Locale is presentation.
 * - provider — see `source`.
 *
 * Future kinds fit without a schema or key migration (NOT implemented here):
 * `apy:skySsr:ratio` (a rate is dimensionless, so no currency variants exist —
 * correctly, since an APY does not change because it is viewed in EUR),
 * `price:BTC:USD` / `price:BTC:BRL` (subject = asset, unit = quote currency),
 * `fx:USD-BRL:BRL` (subject = the ordered pair, unit = the quote currency; the
 * redundancy is accepted deliberately to keep the three-segment rule total).
 */

/** The measures this build actually persists. No speculative members. */
export type EvidenceKind = 'network-cost';

/** The reserved unit token for a dimensionless measure (a rate, a ratio). */
export const UNIT_DIMENSIONLESS = 'ratio';

/** The one delimiter. A segment may never contain it — see `SEGMENT_PATTERN`. */
export const EVIDENCE_KEY_DELIMITER = ':';

/**
 * What a segment may contain.
 *
 * The delimiter is excluded by construction, so no future subject can introduce
 * delimiter ambiguity by containing a colon: `parseEvidenceKey` would then read
 * one key as four segments and silently mean something else. Validation happens
 * at BUILD time so an ambiguous key cannot be created, not only detected later.
 */
export const SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export interface EvidenceIdentity {
  kind: EvidenceKind;
  /** What the measure is ABOUT, scoped by `kind` (a chain, an asset, a pair). */
  subject: string;
  /** The semantic unit the persisted value IS expressed in, or `ratio`. */
  unit: string;
}

/** Thrown rather than returned: an unbuildable identity is a programming error. */
export class EvidenceIdentityError extends Error {}

function assertSegment(name: string, value: string): void {
  if (!SEGMENT_PATTERN.test(value)) {
    throw new EvidenceIdentityError(
      `evidence key ${name} segment is not representable: ${JSON.stringify(value)} ` +
        `(must match ${String(SEGMENT_PATTERN)} — the '${EVIDENCE_KEY_DELIMITER}' delimiter is excluded)`
    );
  }
}

/**
 * THE key builder. Call sites never assemble a key by hand — an ad-hoc
 * `${kind}:${subject}` somewhere would be the second derivation of one fact
 * (system gate X1) and the first place a delimiter or a missing unit slips in.
 */
export function evidenceKey(identity: EvidenceIdentity): string {
  assertSegment('kind', identity.kind);
  assertSegment('subject', identity.subject);
  assertSegment('unit', identity.unit);
  return [identity.kind, identity.subject, identity.unit].join(EVIDENCE_KEY_DELIMITER);
}

/** The inverse. Total: any string this rejects could never have been built. */
export function parseEvidenceKey(key: string): EvidenceIdentity {
  const parts = key.split(EVIDENCE_KEY_DELIMITER);
  if (parts.length !== 3) {
    throw new EvidenceIdentityError(
      `evidence key must have exactly 3 segments, got ${parts.length}: ${JSON.stringify(key)}`
    );
  }
  const [kind, subject, unit] = parts;
  assertSegment('kind', kind);
  assertSegment('subject', subject);
  assertSegment('unit', unit);
  return { kind: kind as EvidenceKind, subject, unit };
}
