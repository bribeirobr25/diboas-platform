import { describe, expect, it } from 'vitest';
import {
  COST_CATEGORIES,
  executableEvidence,
  isCategoryClaimTruthful,
  isExecutable,
  presentedCategory,
  referenceEvidence,
  unavailableEvidence,
  type CostCoverage,
} from '../evidence';
import { dataFreshness } from '../freshness';
import { EVIDENCE_SOURCES, evidenceStamp, sourceKindOf, type DataStamp } from '../types';

/**
 * The Pre-F shared foundation invariants (Strategy Canon 2026-09-18).
 *
 * Each test here exists because collapsing two of these axes is a way the
 * product has already told a lie or could tell one: "Live from DeFiLlama" over
 * a fixture fee, a confident `0.00` for an unpriceable cost, an aggregate
 * labelled as one of its parts. The axes are independent, so the tests prove
 * independence — not merely that each value can be constructed.
 */

const AT = '2026-09-18T00:00:00Z';
const stampOf = (origin: DataStamp['origin'], source: DataStamp['source'] = 'defillama') =>
  evidenceStamp({ source, origin, asOf: AT });

describe('axis independence — origin ≠ actionability ≠ availability ≠ freshness', () => {
  it('should allow EVERY origin to carry EITHER actionability, for the same source', () => {
    /* If actionability were derivable from origin (or from the source), one of
       these four combinations would be unconstructible. All four are real
       states: a MODELLED route simulation can be executable; an OBSERVED
       reference price is not. */
    for (const origin of ['OBSERVED', 'MODELLED', 'PROXY'] as const) {
      const reference = referenceEvidence({
        value: 1,
        stamp: stampOf(origin),
        normalization: { converted: false },
        coverage: { kind: 'single', category: 'network' },
      });
      expect(reference).toMatchObject({ actionability: 'REFERENCE' });
      expect(reference.availability === 'AVAILABLE' && reference.stamp.origin).toBe(origin);

      const executable = executableEvidence({
        value: 1,
        stamp: stampOf(origin),
        normalization: { converted: false },
        coverage: { kind: 'single', category: 'network' },
        validity: { validFrom: AT, validUntil: '2026-09-18T00:05:00Z' },
        identity: { providerId: 'defillama', reference: 'route-1' },
      });
      expect(executable).toMatchObject({ actionability: 'EXECUTABLE' });
      expect(executable.availability === 'AVAILABLE' && executable.stamp.origin).toBe(origin);
    }
  });

  it('should keep AVAILABILITY independent of FRESHNESS', () => {
    /* A stale datum is still a datum we HAVE. Collapsing these would make
       "old" and "absent" the same state, and the product would lose the
       ability to say "this is what we last knew". */
    const old = evidenceStamp({ source: 'defillama', origin: 'OBSERVED', asOf: '2026-01-01' });
    expect(dataFreshness(old, AT)).toBe('MISSING'); // freshness says: too old to use
    const evidence = referenceEvidence({
      value: 1,
      stamp: old,
      normalization: { converted: false },
      coverage: { kind: 'single', category: 'network' },
    });
    expect(evidence.availability).toBe('AVAILABLE'); // availability says: we have it
  });

  it('should keep AVAILABILITY independent of DATA QUALITY', () => {
    /* Founder/Strategy §2: `AVAILABLE + INCONCLUSIVE` is a coherent state. The
       instrumentation contract's OK/UNKNOWN/INCONCLUSIVE vocabulary describes
       TRUST; this module describes PRESENCE. The proof that they are not
       collapsed is that this file imports no data-quality vocabulary at all and
       an AVAILABLE datum makes no quality claim. */
    const evidence = referenceEvidence({
      value: 1,
      stamp: stampOf('PROXY'), // the weakest origin we model
      normalization: { converted: false },
      coverage: { kind: 'single', category: 'network' },
    });
    expect(evidence.availability).toBe('AVAILABLE');
    expect(Object.keys(evidence)).not.toContain('dataQuality');
    expect(JSON.stringify(evidence)).not.toMatch(/INCONCLUSIVE|UNKNOWN_QUALITY/);
  });
});

describe('EXTERNAL SOURCE ≠ OBSERVED', () => {
  it('should let an externally sourced value be MODELLED or PROXY', () => {
    /* The controlling invariant: what a source IS does not decide what the
       evidence IS. A provider that returns a representative figure is
       modelling, however external it is. */
    for (const source of ['defillama', 'coingecko'] as const) {
      expect(evidenceStamp({ source, origin: 'MODELLED', asOf: AT }).origin).toBe('MODELLED');
      expect(evidenceStamp({ source, origin: 'PROXY', asOf: AT }).origin).toBe('PROXY');
    }
  });

  it('should keep SOURCE KIND independent of origin, actionability and availability', () => {
    /* `kind: 'provider'` must not imply OBSERVED / REFERENCE / EXECUTABLE /
       AVAILABLE (Founder/Strategy §2). */
    expect(sourceKindOf('defillama')).toBe('provider');
    expect(sourceKindOf('fixture')).toBe('fixture');
    // a 'provider' source carrying MODELLED evidence, unavailable overall:
    expect(evidenceStamp({ source: 'defillama', origin: 'MODELLED', asOf: AT }).origin).toBe(
      'MODELLED'
    );
    expect(unavailableEvidence('NO_OBSERVATION').availability).toBe('UNAVAILABLE');
    // and a 'fixture' source is NOT forced to any particular origin by its kind:
    expect(evidenceStamp({ source: 'fixture', origin: 'OBSERVED', asOf: AT }).origin).toBe(
      'OBSERVED'
    );
  });

  it('should register only the sources that actually exist (no speculative entries)', () => {
    expect(Object.keys(EVIDENCE_SOURCES).sort()).toEqual(['coingecko', 'defillama', 'fixture']);
  });
});

describe('REFERENCE never silently becomes EXECUTABLE', () => {
  const coverage: CostCoverage = { kind: 'single', category: 'network' };

  it('should refuse to treat reference evidence as executable', () => {
    const reference = referenceEvidence({
      value: 1,
      stamp: stampOf('OBSERVED'),
      normalization: { converted: false },
      coverage,
    });
    expect(isExecutable(reference, AT)).toBe(false);
  });

  it('should refuse EXPIRED executable evidence (canon §13: a record of what WAS executable)', () => {
    const quote = executableEvidence({
      value: 1,
      stamp: stampOf('OBSERVED'),
      normalization: { converted: false },
      coverage,
      validity: { validFrom: AT, validUntil: '2026-09-18T00:05:00Z' },
      identity: { providerId: 'defillama', reference: 'route-1' },
    });
    expect(isExecutable(quote, '2026-09-18T00:04:59Z')).toBe(true);
    expect(isExecutable(quote, '2026-09-18T00:05:01Z')).toBe(false);
  });

  it('should refuse unavailable evidence outright', () => {
    expect(isExecutable(unavailableEvidence('REFUSED_BY_CONTRACT'), AT)).toBe(false);
  });

  it('should take no mode/scope argument at all, so mode CANNOT decide actionability', () => {
    /* The strongest available protection: inferring actionability from mode is
       not merely discouraged, it is unexpressible — `isExecutable` has arity 2
       and neither argument is a scope. */
    expect(isExecutable.length).toBe(2);
  });
});

describe('cost-category truth', () => {
  it('should carry the whole shared taxonomy', () => {
    expect([...COST_CATEGORIES]).toEqual([
      'network',
      'protocol',
      'swap',
      'bridge',
      'provider',
      'diboas',
      'other',
    ]);
  });

  it('should NOT let an aggregate be presented as one of its parts (canon §9)', () => {
    /* `network + protocol + provider ≠ network` — naming one component would
       claim the figure excludes the other two. */
    const bundled: CostCoverage = {
      kind: 'aggregate',
      categories: ['network', 'protocol', 'provider'],
    };
    expect(presentedCategory(bundled)).toBe('other');
    expect(isCategoryClaimTruthful(bundled, 'network')).toBe(false);
    expect(isCategoryClaimTruthful(bundled, 'other')).toBe(true);
  });

  it('should present a single-category cost as itself', () => {
    const network: CostCoverage = { kind: 'single', category: 'network' };
    expect(presentedCategory(network)).toBe('network');
    expect(isCategoryClaimTruthful(network, 'network')).toBe(true);
    expect(isCategoryClaimTruthful(network, 'diboas')).toBe(false);
  });
});

describe('normalization provenance is required when a conversion happened', () => {
  it('should carry the RATE evidence with the converted value', () => {
    /* `5.225`: the app carried the FX stamp but never associated it with the
       converted number, so the conversion's vintage was unreasonable-about.
       Here it cannot be omitted — `converted: true` has no shape without it. */
    const rateStamp = evidenceStamp({ source: 'coingecko', origin: 'OBSERVED', asOf: AT });
    const converted = referenceEvidence({
      value: 0.03,
      stamp: stampOf('MODELLED', 'fixture'),
      normalization: { converted: true, fromCurrency: 'USD', toCurrency: 'BRL', rateStamp },
      coverage: { kind: 'single', category: 'network' },
    });
    expect(converted.availability === 'AVAILABLE' && converted.normalization).toMatchObject({
      converted: true,
      rateStamp: { source: 'coingecko', origin: 'OBSERVED' },
    });
  });

  it('should state explicitly when NO conversion happened, never leave it unsaid', () => {
    const direct = referenceEvidence({
      value: 0.03,
      stamp: stampOf('MODELLED', 'fixture'),
      normalization: { converted: false },
      coverage: { kind: 'single', category: 'network' },
    });
    expect(direct.availability === 'AVAILABLE' && direct.normalization.converted).toBe(false);
  });
});

describe('unavailability always carries a reason', () => {
  it('should name why, so a caller can refuse honestly instead of substituting zero', () => {
    for (const reason of [
      'NO_OBSERVATION',
      'NO_CONVERSION',
      'IDENTITY_MISMATCH',
      'NOT_REPRESENTABLE',
      'REFUSED_BY_CONTRACT',
    ] as const) {
      const e = unavailableEvidence(reason);
      expect(e).toMatchObject({ availability: 'UNAVAILABLE', reason });
    }
  });
});
