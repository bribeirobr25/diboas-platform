import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP, evidenceStamp, referenceEvidence, unavailableEvidence } from '@diboas/defi';
import { evaluateIngestionEligibility } from '../eligibility';

const NETWORK: { kind: 'single'; category: 'network' } = { kind: 'single', category: 'network' };

/**
 * The LC-LIC-01 scope guard for the first F-A runtime producer.
 *
 * The requirement: a persisted CONVERTED value carries an external `rateStamp`,
 * an external source identity and a derived FX calculation, which engages
 * LC-LIC-01's storage / retention / derived-data rights — whose per-provider
 * position is CONDITIONAL and uncleared. The first lane is therefore evidence
 * diBoaS owns end to end, and everything else is refused.
 */
describe('F-A ingestion eligibility — only the fixture lane is persistable', () => {
  it('should accept unconverted fixture/MODELLED evidence', () => {
    const result = evaluateIngestionEligibility(
      referenceEvidence({
        value: 0.03,
        stamp: FIXTURE_STAMP,
        normalization: { converted: false },
        coverage: NETWORK,
      })
    );
    expect(result.eligible).toBe(true);
  });

  it('should REFUSE converted evidence, because the rate stamp is external provenance', () => {
    const result = evaluateIngestionEligibility(
      referenceEvidence({
        value: 0.0276,
        stamp: FIXTURE_STAMP,
        normalization: {
          converted: true,
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rateStamp: evidenceStamp({
            source: 'coingecko',
            origin: 'OBSERVED',
            asOf: '2026-09-21T00:00:00.000Z',
          }),
        },
        coverage: NETWORK,
      })
    );
    expect(result).toEqual({ eligible: false, reason: 'EXTERNAL_NORMALIZATION' });
  });

  it('should REFUSE a live provider observation, even unconverted', () => {
    for (const source of ['defillama', 'coingecko'] as const) {
      const result = evaluateIngestionEligibility(
        referenceEvidence({
          value: 0.03,
          stamp: evidenceStamp({ source, origin: 'OBSERVED', asOf: '2026-09-21T00:00:00.000Z' }),
          normalization: { converted: false },
          coverage: NETWORK,
        })
      );
      expect(result).toEqual({ eligible: false, reason: 'EXTERNAL_SOURCE' });
    }
  });

  it('should REFUSE an UNAVAILABLE envelope — F-A does not persist refusals', () => {
    expect(
      evaluateIngestionEligibility(unavailableEvidence<number>('NO_OBSERVATION', NETWORK))
    ).toEqual({ eligible: false, reason: 'NOT_AVAILABLE' });
  });

  it('should REFUSE a fixture-sourced value that claims a non-MODELLED origin', () => {
    const result = evaluateIngestionEligibility(
      referenceEvidence({
        value: 0.03,
        stamp: { ...FIXTURE_STAMP, origin: 'OBSERVED' },
        normalization: { converted: false },
        coverage: NETWORK,
      })
    );
    expect(result).toEqual({ eligible: false, reason: 'ORIGIN_NOT_MODELLED' });
  });

  it('should fail SAFE: a source that is not named in the lane is refused, not admitted', () => {
    /* The property that matters for the future: adding a source to the evidence
       registry must NOT make it persistable. Only editing this guard can. */
    const result = evaluateIngestionEligibility(
      referenceEvidence({
        value: 0.03,
        stamp: { ...FIXTURE_STAMP, source: 'defillama' },
        normalization: { converted: false },
        coverage: NETWORK,
      })
    );
    expect(result).toEqual({ eligible: false, reason: 'EXTERNAL_SOURCE' });
  });
});
