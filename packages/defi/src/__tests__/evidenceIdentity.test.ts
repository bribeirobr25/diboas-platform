import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_KEY_DELIMITER,
  EvidenceIdentityError,
  SEGMENT_PATTERN,
  UNIT_DIMENSIONLESS,
  evidenceKey,
  parseEvidenceKey,
} from '../evidenceIdentity';

/**
 * Evidence identity — `kind:subject:unit`, all three segments mandatory.
 *
 * The requirement under test is the accepted F-A design ruling: a numeric value
 * expressed in EUR is NOT the same persisted semantic fact as the same measure
 * in USD, so the unit belongs to identity. Source, origin, mode and locale do
 * not — each for a reason stated in the module.
 */
describe('evidence identity — the unit segment is part of identity', () => {
  it('should give the same measure in two currencies two DIFFERENT identities', () => {
    const usd = evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit: 'USD' });
    const eur = evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit: 'EUR' });
    expect(usd).toBe('network-cost:Arbitrum:USD');
    expect(eur).toBe('network-cost:Arbitrum:EUR');
    expect(usd).not.toBe(eur);
  });

  it('should give the same measure on two chains two DIFFERENT identities', () => {
    expect(evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit: 'USD' })).not.toBe(
      evidenceKey({ kind: 'network-cost', subject: 'Solana', unit: 'USD' })
    );
  });

  it('should carry the reserved token for a dimensionless measure rather than omitting the segment', () => {
    /* A future `apy:...` identity is described here, not implemented: the point
       is that the three-segment rule stays total for a rate, which has no
       currency variants — correctly, since an APY does not change because it is
       viewed in EUR. */
    expect(UNIT_DIMENSIONLESS).toBe('ratio');
    expect(evidenceKey({ kind: 'network-cost', subject: 'Solana', unit: UNIT_DIMENSIONLESS })).toBe(
      'network-cost:Solana:ratio'
    );
  });

  it('should round-trip through parse', () => {
    const key = evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit: 'BRL' });
    expect(parseEvidenceKey(key)).toEqual({
      kind: 'network-cost',
      subject: 'Arbitrum',
      unit: 'BRL',
    });
  });
});

describe('evidence identity — delimiter ambiguity cannot be introduced', () => {
  it('should refuse a subject containing the delimiter, at BUILD time', () => {
    expect(() =>
      evidenceKey({
        kind: 'network-cost',
        subject: `Arb${EVIDENCE_KEY_DELIMITER}itrum`,
        unit: 'USD',
      })
    ).toThrow(EvidenceIdentityError);
  });

  it('should refuse an empty or space-bearing segment', () => {
    expect(() => evidenceKey({ kind: 'network-cost', subject: '', unit: 'USD' })).toThrow(
      EvidenceIdentityError
    );
    expect(() => evidenceKey({ kind: 'network-cost', subject: 'Arb itrum', unit: 'USD' })).toThrow(
      EvidenceIdentityError
    );
  });

  it('should refuse a key that does not have exactly three segments', () => {
    expect(() => parseEvidenceKey('network-cost:Arbitrum')).toThrow(EvidenceIdentityError);
    expect(() => parseEvidenceKey('network-cost:Arbitrum:USD:extra')).toThrow(
      EvidenceIdentityError
    );
  });

  it('should keep the segment pattern free of the delimiter — the property the rule rests on', () => {
    expect(SEGMENT_PATTERN.test(EVIDENCE_KEY_DELIMITER)).toBe(false);
  });
});

describe('evidence identity — mode, source and origin are ABSENT by construction', () => {
  it('should expose no way to put Practice/Real, a source or an origin into a key', () => {
    const key = evidenceKey({ kind: 'network-cost', subject: 'Arbitrum', unit: 'USD' });
    for (const forbidden of ['practice', 'real', 'sandbox', 'fixture', 'MODELLED', 'OBSERVED']) {
      expect(key.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
    /* And structurally: the identity type has exactly three fields, so there is
       no argument a caller could pass to smuggle a fourth dimension in. */
    expect(Object.keys(parseEvidenceKey(key)).sort()).toEqual(['kind', 'subject', 'unit']);
  });
});
