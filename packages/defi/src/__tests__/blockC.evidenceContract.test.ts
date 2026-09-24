import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildHistoricalSeries, historicalUnavailable } from '../historicalEvidence';
import { fxObservedRate, fxReference, fxUnavailable } from '../fxEvidence';
import { FixtureGasProvider } from '../providers/gas';
import { observedStamp } from '../testing';
import { evidenceStamp } from '../types';

const stamp = evidenceStamp({ source: 'defillama', origin: 'OBSERVED', asOf: '2026-09-24' });
const pt = (date: string, value: number) => ({ date, value });

/** BLOCK C · EVIDENCE CONTRACT COMPLETION. */
describe('Block C · one historical contract, provider-neutral', () => {
  it('should record HOW a series was obtained, not just that it exists', () => {
    const r = buildHistoricalSeries({
      kind: 'RATE',
      protocolId: 'aaveV3',
      points: [pt('2026-09-22', 5), pt('2026-09-23', 5.1)],
      stamp,
      via: 'AGGREGATOR',
    });
    expect(r.available).toBe(true);
    if (!r.available) throw new Error('unreachable');
    expect(r.series.via).toBe('AGGREGATOR');
    expect(r.series.kind).toBe('RATE');
  });

  it('should REFUSE an empty series rather than return an empty one', () => {
    const r = buildHistoricalSeries({
      kind: 'PRICE',
      protocolId: 'jito',
      points: [],
      stamp,
      via: 'PROVIDER',
    });
    expect(r).toEqual({ available: false, reason: 'NO_OBSERVATION' });
  });

  it('should REFUSE an unordered or duplicated series — a replay must be reproducible', () => {
    const unordered = buildHistoricalSeries({
      kind: 'RATE',
      protocolId: 'aaveV3',
      points: [pt('2026-09-23', 5), pt('2026-09-22', 5)],
      stamp,
      via: 'PROVIDER',
    });
    expect(unordered).toEqual({ available: false, reason: 'NOT_REPRESENTABLE' });
    const duplicated = buildHistoricalSeries({
      kind: 'RATE',
      protocolId: 'aaveV3',
      points: [pt('2026-09-22', 5), pt('2026-09-22', 6)],
      stamp,
      via: 'PROVIDER',
    });
    expect(duplicated).toEqual({ available: false, reason: 'NOT_REPRESENTABLE' });
  });

  it('should NEVER interpolate — the helper offers no way to fill a gap', () => {
    /**
     * Structural, not behavioural: no `fill`, `interpolate` or `pad` exists in
     * the contract, so a caller cannot ask for one.
     *
     * ⛑ SCANS CODE, NOT PROSE. The first version matched the whole file and
     * tripped on this module's own comment — the rule it states is the word it
     * banned. A detector that cannot tell a MENTION from an ASSERTION reports
     * a finding that is not there; comments are stripped before the scan.
     */
    const src = readFileSync(join(__dirname, '..', 'historicalEvidence.ts'), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/\b(interpolat|backfill|padSeries|fillGap)/i);
    /* And prove the stripper did not simply empty the file. */
    expect(code).toContain('buildHistoricalSeries');
  });

  it('should name the paths a future series can arrive through', () => {
    /* STORED_SNAPSHOT (Block D) and HIGH_FIDELITY (the parked Real track) are
       declared so they need no Product-facing change later. */
    const src = readFileSync(join(__dirname, '..', 'historicalEvidence.ts'), 'utf8');
    for (const via of ['PROVIDER', 'AGGREGATOR', 'STORED_SNAPSHOT', 'HIGH_FIDELITY', 'FIXTURE']) {
      expect(src, via).toContain(`'${via}'`);
    }
  });
});

describe('Block C · FX is its own evidence class', () => {
  it('should report NO eligible current source for an FX RATE', () => {
    /**
     * The plan's disposition, in code. Practice converts today via a
     * provider-denominated PRICE; no source supplies a rate AS a rate, so a
     * rate asked for as a rate is controlled-unavailable — never manufactured.
     */
    expect(fxObservedRate('BRL')).toEqual({ available: false, reason: 'NO_OBSERVATION' });
    expect(fxObservedRate('EUR')).toEqual({ available: false, reason: 'NO_OBSERVATION' });
  });

  it('should label the documented conversion as a REFERENCE CONSTANT, never an observation', () => {
    const r = fxReference('BRL');
    expect(r.available).toBe(true);
    if (!r.available) throw new Error('unreachable');
    expect(r.evidence.basis).toBe('REFERENCE_CONSTANT');
    /* And the stamp cannot be mistaken for a live rate by anything reading it. */
    expect(r.evidence.stamp.origin).toBe('MODELLED');
    expect(r.evidence.stamp.fallbackUsed).toBe(true);
    expect(r.evidence.stamp.source).toBe('fixture');
  });

  it('should NOT manufacture a rate by dividing two prices', () => {
    /* Structural: the module exposes no division-of-prices path at all. */
    const src = readFileSync(join(__dirname, '..', 'fxEvidence.ts'), 'utf8');
    expect(src).not.toMatch(/priceA\s*\/\s*priceB|fromPrices|deriveRateFromPrice/i);
    expect(fxUnavailable('NO_CONVERSION')).toEqual({
      available: false,
      reason: 'NO_CONVERSION',
    });
  });
});

describe('Block C · the third timestamp, refusable cost, generalized stamp', () => {
  it('should carry derivedAt as a first-class, non-defaulted field', () => {
    /* Absent by default — a value passed through unchanged derived nothing,
       and a clock must never be back-filled to make one look recent. */
    expect(stamp.derivedAt).toBeNull();
    const derived = evidenceStamp({
      source: 'fixture',
      origin: 'MODELLED',
      asOf: '2026-09-24T00:00:00.000Z',
      derivedAt: '2026-09-24T01:00:00.000Z',
    });
    expect(derived.derivedAt).toBe('2026-09-24T01:00:00.000Z');
    /* The three are distinct concepts and must not be read off each other. */
    expect(derived.derivedAt).not.toBe(derived.asOf);
  });

  it('should keep the gas port refusable while the fixture source still answers', async () => {
    const quote = await new FixtureGasProvider().getGas('Solana');
    expect(quote).not.toBeNull();
    expect(quote!.stamp.source).toBe('fixture');
  });

  it('should let observedStamp name ANY registry source, not a frozen pair', () => {
    /* The union was `'defillama' | 'coingecko'`; a future collector needed a
       signature edit. It is the registry id now. */
    expect(observedStamp('fixture', '2026-09-24').source).toBe('fixture');
    expect(observedStamp('coingecko', '2026-09-24').origin).toBe('OBSERVED');
  });
});

describe('Block C · one vocabulary for "unavailable" at the shared-core seam', () => {
  it('should draw every refusal from the SAME UnavailableReason union', () => {
    /**
     * C.3, at the seam rather than app-wide. Three shapes said "unavailable" —
     * the envelope axis, the rate predicate, and a bare `null` from the history
     * ports. The new contracts reuse the envelope's own reason union and its
     * `{ available }` discrimination, so the core has ONE vocabulary instead of
     * a third spelling.
     */
    const evidenceSrc = readFileSync(join(__dirname, '..', 'evidence.ts'), 'utf8');
    const reasons = (
      evidenceSrc
        .slice(
          evidenceSrc.indexOf('export type UnavailableReason'),
          evidenceSrc.indexOf('// ── Normalization')
        )
        .match(/'[A-Z_]+'/g) ?? []
    ).map((r) => r.replace(/'/g, ''));
    expect(reasons.length).toBeGreaterThan(3);
    for (const mod of ['historicalEvidence.ts', 'fxEvidence.ts', 'rateAvailability.ts']) {
      const src = readFileSync(join(__dirname, '..', mod), 'utf8');
      expect(src, mod).toContain('UnavailableReason');
      for (const used of src.match(/reason: '([A-Z_]+)'/g) ?? []) {
        const name = used.replace(/reason: '|'/g, '');
        expect(reasons, `${mod} uses ${name}`).toContain(name);
      }
    }
  });
});
