import { describe, expect, it } from 'vitest';
import {
  DECIMAL_DEFAULT_SCALE,
  DECIMAL_MAX_SCALE,
  EvidenceCodecError,
  decodeDecimal,
  encodeDecimal,
} from '../evidenceCodec';

/**
 * The codec — the one boundary where a runtime number becomes a stored string.
 *
 * The contract under test is the accepted ruling: the PERSISTED STRING is the
 * authority, encoding rounds once at a declared scale and says so, and decoding
 * VALIDATES rather than casts.
 */
describe('evidence codec — string round-trip is the persistence invariant', () => {
  it('should round-trip every canonical string exactly', () => {
    for (const s of ['0', '1', '-1', '0.03', '-0.03', '1234567.89', '0.00000001']) {
      expect(encodeDecimal(decodeDecimal(s))).toBe(s);
    }
  });

  it('should encode the fixture network costs the runtime actually persists', () => {
    expect(encodeDecimal(0.03)).toBe('0.03');
    expect(encodeDecimal(0.001)).toBe('0.001');
  });

  it('should round a value that is not representable at the scale, and say so in the string', () => {
    /* 0.1 + 0.2 is 0.30000000000000004 as a double. Persisting that would claim
       a precision the measurement never had; "0.3" is the honest record, and the
       string is what everything downstream reads. */
    const encoded = encodeDecimal(0.1 + 0.2);
    expect(encoded).toBe('0.3');
    expect(decodeDecimal(encoded)).toBe(0.3);
  });

  it('should emit ONE spelling of zero', () => {
    expect(encodeDecimal(-0)).toBe('0');
    expect(encodeDecimal(0)).toBe('0');
  });
});

describe('evidence codec — malformed persisted values are REJECTED, never coerced', () => {
  it('should reject non-canonical decimal strings', () => {
    for (const bad of ['', ' 1', '1 ', '+1', '01', '1.', '.5', '1.50', '1e3', 'abc', '-0']) {
      expect(() => decodeDecimal(bad)).toThrow(EvidenceCodecError);
    }
  });

  it('should reject a value that does not round-trip at the declared scale', () => {
    /* A hand-edited or truncated row: more decimals than the scale can carry. */
    const tooPrecise = '0.000000001';
    expect(() => decodeDecimal(tooPrecise, DECIMAL_DEFAULT_SCALE)).toThrow(EvidenceCodecError);
    expect(decodeDecimal(tooPrecise, 9)).toBe(1e-9);
  });

  it('should refuse to encode a non-quantity', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => encodeDecimal(bad)).toThrow(EvidenceCodecError);
    }
  });

  it('should refuse a value beyond the safe integer range', () => {
    expect(() => encodeDecimal(Number.MAX_SAFE_INTEGER + 10)).toThrow(EvidenceCodecError);
  });

  it('should refuse an out-of-range scale', () => {
    expect(() => encodeDecimal(1, -1)).toThrow(EvidenceCodecError);
    expect(() => encodeDecimal(1, DECIMAL_MAX_SCALE + 1)).toThrow(EvidenceCodecError);
    expect(() => encodeDecimal(1, 1.5)).toThrow(EvidenceCodecError);
  });

  it('should reject a non-string input rather than stringifying it', () => {
    expect(() => decodeDecimal(0.03 as unknown as string)).toThrow(EvidenceCodecError);
    expect(() => decodeDecimal(null as unknown as string)).toThrow(EvidenceCodecError);
  });
});
