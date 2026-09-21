/**
 * The persisted PAYLOAD (v1) and the identities derived from it.
 *
 * ```text
 * RECORD METADATA = persistence mechanics   -> SQL columns
 * PAYLOAD         = evidence semantics      -> this module
 * DERIVED ON READ = freshness, presented category, executability
 * ```
 *
 * One owner per fact. `evidenceKey`, `schemaVersion` and `ingestedAt` are SQL
 * columns and are NOT repeated here; `origin` stays inside `stamp` and is not
 * promoted to a column, because a second copy is a second thing to disagree.
 *
 * ⚑ FRESHNESS IS NOT PERSISTED. A stored freshness verdict stops being true the
 * moment it is written. The payload carries what H needs to evaluate it later —
 * `asOf` (retrieval) and `observedAt` (observation) — and never the verdict.
 */

import { decodeDecimal, encodeDecimal } from './evidenceCodec';
import type {
  Actionability,
  CostCoverage,
  EvidenceEnvelope,
  ExecutableIdentity,
  Normalization,
  UnavailableReason,
  Validity,
} from './evidence';
import type { DataStamp } from './types';

/** The payload contract version. Bumped when the SHAPE changes, never silently. */
export const EVIDENCE_SCHEMA_VERSION = 1;

export class EvidencePayloadError extends Error {}

/**
 * The serialized envelope. Discriminated exactly like `EvidenceEnvelope`, so a
 * conditionally-required fact cannot be silently omitted in storage either: an
 * UNAVAILABLE row has no stamp at all, and an EXECUTABLE row cannot exist
 * without its validity and identity.
 */
export type EvidencePayloadV1 =
  | {
      availability: 'UNAVAILABLE';
      reason: UnavailableReason;
      coverage: CostCoverage | null;
    }
  | {
      availability: 'AVAILABLE';
      actionability: 'REFERENCE';
      value: string;
      unit: string;
      stamp: DataStamp;
      normalization: Normalization;
      coverage: CostCoverage;
    }
  | {
      availability: 'AVAILABLE';
      actionability: 'EXECUTABLE';
      value: string;
      unit: string;
      stamp: DataStamp;
      normalization: Normalization;
      coverage: CostCoverage;
      validity: Validity;
      identity: ExecutableIdentity;
    };

/** number -> payload. `unit` is stated explicitly; it is identity, not decoration. */
export function toPayloadV1(
  envelope: EvidenceEnvelope<number>,
  unit: string,
  scale?: number
): EvidencePayloadV1 {
  if (envelope.availability === 'UNAVAILABLE') {
    return { availability: 'UNAVAILABLE', reason: envelope.reason, coverage: envelope.coverage };
  }
  const base = {
    availability: 'AVAILABLE' as const,
    value: encodeDecimal(envelope.value, scale),
    unit,
    stamp: envelope.stamp,
    normalization: envelope.normalization,
    coverage: envelope.coverage,
  };
  return envelope.actionability === 'EXECUTABLE'
    ? {
        ...base,
        actionability: 'EXECUTABLE',
        validity: envelope.validity,
        identity: envelope.identity,
      }
    : { ...base, actionability: 'REFERENCE' };
}

function assertStamp(stamp: unknown): DataStamp {
  const s = stamp as Partial<DataStamp> | null;
  if (
    !s ||
    typeof s.source !== 'string' ||
    typeof s.origin !== 'string' ||
    typeof s.asOf !== 'string' ||
    !('observedAt' in s) ||
    (s.observedAt !== null && typeof s.observedAt !== 'string') ||
    typeof s.fallbackUsed !== 'boolean' ||
    !('fixtureVersion' in s) ||
    (s.fixtureVersion !== null && typeof s.fixtureVersion !== 'string')
  ) {
    throw new EvidencePayloadError(`persisted stamp is malformed: ${JSON.stringify(stamp)}`);
  }
  return s as DataStamp;
}

/**
 * payload -> number. Validates rather than casts: every arm, every required
 * conditional field, and the decimal itself. A malformed row throws here — it
 * never becomes a plausible envelope one layer up.
 */
export function fromPayloadV1(payload: unknown, scale?: number): EvidenceEnvelope<number> {
  const p = payload as Partial<EvidencePayloadV1> | null;
  if (!p || typeof p !== 'object') {
    throw new EvidencePayloadError(
      `persisted payload is not an object: ${JSON.stringify(payload)}`
    );
  }
  if (p.availability === 'UNAVAILABLE') {
    const { reason, coverage } = p as Extract<EvidencePayloadV1, { availability: 'UNAVAILABLE' }>;
    if (typeof reason !== 'string') {
      throw new EvidencePayloadError('persisted UNAVAILABLE payload has no reason');
    }
    return { availability: 'UNAVAILABLE', reason, coverage: coverage ?? null };
  }
  if (p.availability !== 'AVAILABLE') {
    throw new EvidencePayloadError(
      `persisted payload has an unknown availability: ${String(p.availability)}`
    );
  }
  const a = p as Extract<EvidencePayloadV1, { availability: 'AVAILABLE' }>;
  if (typeof a.value !== 'string' || typeof a.unit !== 'string') {
    throw new EvidencePayloadError('persisted AVAILABLE payload is missing value or unit');
  }
  if (!a.normalization || typeof a.normalization.converted !== 'boolean') {
    throw new EvidencePayloadError('persisted AVAILABLE payload has malformed normalization');
  }
  if (!a.coverage || typeof a.coverage.kind !== 'string') {
    throw new EvidencePayloadError('persisted AVAILABLE payload has malformed coverage');
  }
  /* Read the discriminant from the UNTYPED payload: once `a` is narrowed to one
     arm, TypeScript treats the other comparison as impossible and the message
     below would be typed `never` — a statement about our types, not about the
     bytes actually read. */
  const rawActionability = (payload as { actionability?: unknown }).actionability;
  if (rawActionability !== 'REFERENCE' && rawActionability !== 'EXECUTABLE') {
    throw new EvidencePayloadError(
      `persisted payload has an unknown actionability: ${String(rawActionability)}`
    );
  }
  const stamp = assertStamp(a.stamp);
  const value = decodeDecimal(a.value, scale);
  const common = {
    availability: 'AVAILABLE' as const,
    value,
    stamp,
    normalization: a.normalization,
    coverage: a.coverage,
  };
  if (a.actionability === 'EXECUTABLE') {
    const e = a as Extract<EvidencePayloadV1, { actionability: 'EXECUTABLE' }>;
    if (!e.validity?.validUntil || !e.identity?.reference) {
      throw new EvidencePayloadError(
        'persisted EXECUTABLE payload is missing validity or identity'
      );
    }
    return { ...common, actionability: 'EXECUTABLE', validity: e.validity, identity: e.identity };
  }
  return { ...common, actionability: 'REFERENCE' };
}

/** The unit a persisted payload states, or `null` on the UNAVAILABLE arm. */
export function payloadUnit(payload: EvidencePayloadV1): string | null {
  return payload.availability === 'AVAILABLE' ? payload.unit : null;
}

// ── Observation identity ─────────────────────────────────────────────────────

/**
 * WHICH OBSERVATION a stamp represents — never which VALUE it carried.
 *
 * `observedAt ?? asOf` is the discriminator, and it works because both live
 * providers stamp `asOf` from the cache entry's FETCH moment, not serve time
 * (Data Vintage P-4). Two serves inside the 6 h window therefore carry the same
 * observation identity; the next fetch cycle carries a new one.
 */
export interface ObservationIdentity {
  source: string;
  origin: string;
  observationTime: string;
  fixtureVersion: string | null;
  methodology: string | null;
}

export function baseObservationIdentity(stamp: DataStamp): ObservationIdentity {
  return {
    source: stamp.source,
    origin: stamp.origin,
    observationTime: stamp.observedAt ?? stamp.asOf,
    fixtureVersion: stamp.fixtureVersion,
    methodology: stamp.methodology ?? null,
  };
}

export interface NormalizationObservationIdentity {
  fromCurrency: string;
  toCurrency: string;
  rate: ObservationIdentity;
}

/**
 * The CONVERSION's own observation identity, or `null` when nothing was
 * converted.
 *
 * Without this, a constant fixture base plus a re-fetched FX rate would collide
 * on one ingestion key: the base observation can stay identical while the rate,
 * and therefore the converted value, genuinely changes. The rate's VALUE is
 * still not an input — uniqueness is never bought with a value.
 */
export function normalizationObservationIdentity(
  normalization: Normalization
): NormalizationObservationIdentity | null {
  if (!normalization.converted) return null;
  return {
    fromCurrency: normalization.fromCurrency,
    toCurrency: normalization.toCurrency,
    rate: baseObservationIdentity(normalization.rateStamp),
  };
}

/** Stable serialization: sorted keys, no whitespace, explicit nulls. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

/**
 * The hash INPUT for the ingestion key — semantic identity + base observation +
 * conversion observation. No value, anywhere.
 */
export function ingestionKeyInput(input: {
  evidenceKey: string;
  stamp: DataStamp;
  normalization: Normalization;
}): string {
  return canonicalJson({
    evidenceKey: input.evidenceKey,
    base: baseObservationIdentity(input.stamp),
    normalization: normalizationObservationIdentity(input.normalization),
  });
}

/** The hash input for contradiction detection: the FULL payload, value included. */
export function payloadDigestInput(payload: EvidencePayloadV1): string {
  return canonicalJson(payload);
}
