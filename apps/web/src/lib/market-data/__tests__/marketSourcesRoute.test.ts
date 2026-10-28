/**
 * One fetch list, one quality gate, one engine for every entry point
 * (2026-10-18 compliance pass, `lib/market-sources.mjs`).
 *
 * `data-fetchers/compute-regime.mjs` used to repeat the six fetches and skip
 * the gate, so `--archive` could write ungated data into the provenance ledger.
 * Rules only, synthetic series: this directory is a weekly blocking gate
 * (GATE-BOUND-1) and nothing here reads live market data.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RECENCY_SLA_DAYS,
  assertMarketSourcesQuality,
} from '../../../../scripts/market-refresh/lib/market-sources.mjs';
import {
  QualityGateError,
  OUTLIER_BOUNDS_PCT,
} from '../../../../scripts/market-refresh/lib/quality-gate.mjs';

const SCRIPTS = join(__dirname, '../../../../scripts');
const read = (p: string) => readFileSync(join(SCRIPTS, p), 'utf8');

const DAY = 86_400_000;
const TODAY = new Date('2026-10-19T06:17:00Z');

/** `n` daily points ending `endAgoDays` before TODAY, flat at `value`. */
function daily(n: number, endAgoDays: number, value: number): Array<[Date, number]> {
  const end = TODAY.getTime() - endAgoDays * DAY;
  return Array.from({ length: n }, (_, i) => [new Date(end - (n - 1 - i) * DAY), value]);
}

function freshSources() {
  return {
    dxy: { series: daily(60, 3, 120) },
    us10y: { series: daily(60, 2, 4.1) },
    m2: { series: daily(40, 50, 21_000) },
    nasdaq: { series: daily(60, 2, 18_000) },
    btc: { series: daily(60, 1, 110_000) },
    gold: { series: daily(60, 2, 2_600) },
  };
}

describe('the shared quality gate', () => {
  describe('M2-GATE-1 — M2 gets its own monthly check (5.626)', () => {
    /** `n` consecutive month starts ending two months before TODAY (inside the 92-day SLA). */
    const monthly = (n: number, last = 21_000): Array<[Date, number]> => {
      const end = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - 2, 1));
      return Array.from({ length: n }, (_, i) => [
        new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (n - 1 - i), 1)),
        i === n - 1 ? last : 21_000,
      ]);
    };
    const withM2 = (series: Array<[Date, number]>) => ({ ...freshSources(), m2: { series } });

    it('should keep the bound at 10 % and refuse just above it, accept just below', () => {
      expect(OUTLIER_BOUNDS_PCT.m2Monthly).toBe(10);
      expect(() =>
        assertMarketSourcesQuality(withM2(monthly(13, 21_000 * 1.0999)), TODAY)
      ).not.toThrow();
      expect(() => assertMarketSourcesQuality(withM2(monthly(13, 21_000 * 1.1001)), TODAY)).toThrow(
        /single-month move 10\.01% > 10%/
      );
    });

    it('should refuse a zero print and a ×1000 scale error', () => {
      expect(() => assertMarketSourcesQuality(withM2(monthly(13, 0)), TODAY)).toThrow(
        QualityGateError
      );
      expect(() => assertMarketSourcesQuality(withM2(monthly(13, 21_000_000)), TODAY)).toThrow(
        /single-month move/
      );
    });

    it('should require 13 months, not the daily 30: 12 refused, 13 accepted', () => {
      expect(() => assertMarketSourcesQuality(withM2(monthly(12)), TODAY)).toThrow(
        /12 months; 13 required/
      );
      expect(() => assertMarketSourcesQuality(withM2(monthly(13)), TODAY)).not.toThrow();
    });
  });

  // Pinned on purpose. The refusal tests below read RECENCY_SLA_DAYS, so they
  // prove the gate APPLIES an SLA but cannot see one loosened; changing an SLA
  // is a deliberate edit to this list too, made in review.
  it('should keep the recency SLAs at their reviewed values', () => {
    expect(RECENCY_SLA_DAYS).toEqual({
      'FRED:DTWEXBGS': 14,
      'FRED:DGS10': 7,
      'FRED:NASDAQCOM': 7,
      'Yahoo:BTC-USD': 3,
      'Yahoo:GC=F': 5,
      'FRED:M2SL': 92,
    });
  });

  it('should pass fresh, well-formed sources', () => {
    expect(() => assertMarketSourcesQuality(freshSources(), TODAY)).not.toThrow();
  });

  it.each([
    ['dxy', 'FRED:DTWEXBGS'],
    ['us10y', 'FRED:DGS10'],
    ['nasdaq', 'FRED:NASDAQCOM'],
    ['btc', 'Yahoo:BTC-USD'],
    ['gold', 'Yahoo:GC=F'],
    ['m2', 'FRED:M2SL'],
  ] as const)('should refuse %s once it is older than its SLA', (key, label) => {
    const sources = freshSources();
    const n = sources[key].series.length;
    sources[key] = { series: daily(n, RECENCY_SLA_DAYS[label] + 1, sources[key].series[0][1]) };
    expect(() => assertMarketSourcesQuality(sources, TODAY)).toThrow(QualityGateError);
  });

  it('should refuse a schema break (a series too short to evaluate)', () => {
    const sources = freshSources();
    sources.btc = { series: daily(5, 1, 110_000) };
    expect(() => assertMarketSourcesQuality(sources, TODAY)).toThrow(QualityGateError);
  });
});

describe('every entry point goes through the shared route', () => {
  const entryPoints = ['market-refresh/run.mjs', 'data-fetchers/compute-regime.mjs'];

  it.each(entryPoints)('%s fetches, gates and evaluates through market-sources.mjs', (p) => {
    const src = read(p);
    expect(src).toMatch(/from '\.{1,2}(\/market-refresh)?\/lib\/market-sources\.mjs'/);
    const fetchAt = src.indexOf('fetchMarketSources()');
    const gateAt = src.indexOf('assertMarketSourcesQuality(');
    const evalAt = src.indexOf('evaluateMarketSignals(');
    expect(fetchAt, 'no shared fetch').toBeGreaterThan(-1);
    expect(gateAt, 'no quality gate').toBeGreaterThan(fetchAt);
    expect(evalAt, 'evaluates before gating').toBeGreaterThan(gateAt);
  });

  it.each(entryPoints)('%s keeps no private copy of the source fetches', (p) => {
    const src = read(p);
    expect(src).not.toMatch(/fetchFredSeries\(/);
    expect(src).not.toMatch(/fetchYahooDaily\('(BTC-USD|GC=F)'/);
  });
});

describe('the run records one clock (5.629)', () => {
  it('should stamp computed_at with the same TODAY the gate and the engine receive', () => {
    const run = readFileSync(join(__dirname, '../../../../scripts/market-refresh/run.mjs'), 'utf8');
    expect(run).toMatch(/const TODAY = new Date\(\);/);
    expect(run).toMatch(/computed_at: TODAY\.toISOString\(\)/);
    expect(run).not.toMatch(/computed_at: new Date\(\)/);
    expect(run).toMatch(/assertMarketSourcesQuality\(sources, TODAY\)/);
  });
});
