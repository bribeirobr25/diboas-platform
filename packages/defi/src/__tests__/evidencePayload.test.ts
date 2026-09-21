import { describe, expect, it } from 'vitest';
import { referenceEvidence, unavailableEvidence } from '../evidence';
import {
  EvidencePayloadError,
  baseObservationIdentity,
  canonicalJson,
  fromPayloadV1,
  ingestionKeyInput,
  normalizationObservationIdentity,
  payloadUnit,
  toPayloadV1,
} from '../evidencePayload';
import { FIXTURE_STAMP } from '../fixtures';
import { evidenceStamp } from '../types';
import type { EvidenceEnvelope } from '../evidence';

const NETWORK: { kind: 'single'; category: 'network' } = { kind: 'single', category: 'network' };

const fixtureEnvelope = (value = 0.03): EvidenceEnvelope<number> =>
  referenceEvidence({
    value,
    stamp: FIXTURE_STAMP,
    normalization: { converted: false },
    coverage: NETWORK,
  });

/** A synthetic rate stamp. Controlled test input — no provider permission is implied. */
const syntheticRate = (asOf: string) =>
  evidenceStamp({ source: 'coingecko', origin: 'OBSERVED', asOf, observedAt: null });

describe('payload v1 — provenance survives the round trip unchanged', () => {
  it('should keep MODELLED as MODELLED', () => {
    const decoded = fromPayloadV1(toPayloadV1(fixtureEnvelope(), 'USD'));
    expect(decoded.availability).toBe('AVAILABLE');
    if (decoded.availability !== 'AVAILABLE') throw new Error('unreachable');
    expect(decoded.stamp.origin).toBe('MODELLED');
    expect(decoded.stamp.source).toBe('fixture');
    expect(decoded.stamp.fallbackUsed).toBe(true);
    expect(decoded.stamp.fixtureVersion).toBe(FIXTURE_STAMP.fixtureVersion);
  });

  it('should NEVER let a fixture become OBSERVED by passing through persistence', () => {
    const payload = toPayloadV1(fixtureEnvelope(), 'USD');
    expect(JSON.stringify(payload)).not.toContain('OBSERVED');
    const decoded = fromPayloadV1(payload);
    if (decoded.availability !== 'AVAILABLE') throw new Error('unreachable');
    expect(decoded.stamp.origin).not.toBe('OBSERVED');
  });

  it('should preserve a null observedAt as null, never filling it from asOf', () => {
    const envelope = referenceEvidence({
      value: 1.25,
      stamp: evidenceStamp({
        source: 'defillama',
        origin: 'OBSERVED',
        asOf: '2026-09-21T00:00:00.000Z',
      }),
      normalization: { converted: false },
      coverage: NETWORK,
    });
    const decoded = fromPayloadV1(toPayloadV1(envelope, 'USD'));
    if (decoded.availability !== 'AVAILABLE') throw new Error('unreachable');
    expect(decoded.stamp.observedAt).toBeNull();
    expect(decoded.stamp.asOf).toBe('2026-09-21T00:00:00.000Z');
  });

  it('should carry the unit, and report it', () => {
    expect(payloadUnit(toPayloadV1(fixtureEnvelope(), 'EUR'))).toBe('EUR');
    expect(payloadUnit(unavailableEvidencePayload())).toBeNull();
  });

  function unavailableEvidencePayload() {
    return toPayloadV1Unavailable();
  }
  function toPayloadV1Unavailable() {
    return toPayloadV1(unavailableEvidence<number>('NO_OBSERVATION', NETWORK), 'USD');
  }
});

describe('payload v1 — malformed rows are REJECTED, not cast', () => {
  it('should reject a payload that is not an object', () => {
    expect(() => fromPayloadV1(null)).toThrow(EvidencePayloadError);
    expect(() => fromPayloadV1('{}')).toThrow(EvidencePayloadError);
  });

  it('should reject an unknown availability or actionability', () => {
    expect(() => fromPayloadV1({ availability: 'MAYBE' })).toThrow(EvidencePayloadError);
    const good = toPayloadV1(fixtureEnvelope(), 'USD') as Record<string, unknown>;
    expect(() => fromPayloadV1({ ...good, actionability: 'SORT_OF' })).toThrow(
      EvidencePayloadError
    );
  });

  it('should reject an AVAILABLE payload missing a required conditional fact', () => {
    const good = toPayloadV1(fixtureEnvelope(), 'USD') as Record<string, unknown>;
    for (const drop of ['value', 'unit', 'stamp', 'normalization', 'coverage']) {
      const broken = { ...good };
      delete broken[drop];
      expect(() => fromPayloadV1(broken)).toThrow(EvidencePayloadError);
    }
  });

  it('should reject a malformed stamp rather than trusting its shape', () => {
    const good = toPayloadV1(fixtureEnvelope(), 'USD') as Record<string, unknown>;
    expect(() => fromPayloadV1({ ...good, stamp: { source: 'fixture' } })).toThrow(
      EvidencePayloadError
    );
  });

  it('should reject a corrupted decimal in an otherwise valid payload', () => {
    const good = toPayloadV1(fixtureEnvelope(), 'USD') as Record<string, unknown>;
    expect(() => fromPayloadV1({ ...good, value: '0.0300' })).toThrow(Error);
    expect(() => fromPayloadV1({ ...good, value: 'NaN' })).toThrow(Error);
  });

  it('should require an UNAVAILABLE payload to carry its reason', () => {
    expect(() => fromPayloadV1({ availability: 'UNAVAILABLE', coverage: null })).toThrow(
      EvidencePayloadError
    );
  });
});

describe('observation identity — WHICH observation, never which value', () => {
  it('should exclude the value from the base identity', () => {
    const a = baseObservationIdentity(FIXTURE_STAMP);
    expect(Object.keys(a).sort()).toEqual([
      'fixtureVersion',
      'methodology',
      'observationTime',
      'origin',
      'source',
    ]);
  });

  it('should give a converted envelope a normalization identity, and an unconverted one none', () => {
    expect(normalizationObservationIdentity({ converted: false })).toBeNull();
    const identity = normalizationObservationIdentity({
      converted: true,
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rateStamp: syntheticRate('2026-09-21T00:00:00.000Z'),
    });
    expect(identity?.toCurrency).toBe('EUR');
    expect(identity?.rate.observationTime).toBe('2026-09-21T00:00:00.000Z');
  });

  it('should produce a STABLE canonical serialization regardless of key order', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(canonicalJson({ a: undefined, b: null })).toBe('{"b":null}');
  });
});

describe('ingestion key input — the collision the design had to close', () => {
  const key = 'network-cost:Arbitrum:EUR';

  it('should be IDENTICAL for the same base and the same conversion observation', () => {
    const rate = syntheticRate('2026-09-21T00:00:00.000Z');
    const one = ingestionKeyInput({
      evidenceKey: key,
      stamp: FIXTURE_STAMP,
      normalization: { converted: true, fromCurrency: 'USD', toCurrency: 'EUR', rateStamp: rate },
    });
    const two = ingestionKeyInput({
      evidenceKey: key,
      stamp: FIXTURE_STAMP,
      normalization: { converted: true, fromCurrency: 'USD', toCurrency: 'EUR', rateStamp: rate },
    });
    expect(one).toBe(two);
  });

  it('should DIFFER when the same base is converted on a NEW rate observation', () => {
    /* The defect this closes: a constant fixture base with a re-fetched FX rate
       would otherwise collide on one ingestion key, and a genuinely new
       converted value would be swallowed as a duplicate. */
    const base = { evidenceKey: key, stamp: FIXTURE_STAMP } as const;
    const monday = ingestionKeyInput({
      ...base,
      normalization: {
        converted: true,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rateStamp: syntheticRate('2026-09-21T00:00:00.000Z'),
      },
    });
    const tuesday = ingestionKeyInput({
      ...base,
      normalization: {
        converted: true,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rateStamp: syntheticRate('2026-09-22T00:00:00.000Z'),
      },
    });
    expect(monday).not.toBe(tuesday);
  });

  it('should DIFFER between a converted and an unconverted value of the same base', () => {
    const unconverted = ingestionKeyInput({
      evidenceKey: 'network-cost:Arbitrum:USD',
      stamp: FIXTURE_STAMP,
      normalization: { converted: false },
    });
    const converted = ingestionKeyInput({
      evidenceKey: key,
      stamp: FIXTURE_STAMP,
      normalization: {
        converted: true,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rateStamp: syntheticRate('2026-09-21T00:00:00.000Z'),
      },
    });
    expect(unconverted).not.toBe(converted);
  });

  it('should NOT contain the value — uniqueness is never bought with a value', () => {
    const cheap = ingestionKeyInput({
      evidenceKey: 'network-cost:Arbitrum:USD',
      stamp: FIXTURE_STAMP,
      normalization: { converted: false },
    });
    expect(cheap).not.toContain('0.03');
  });
});
