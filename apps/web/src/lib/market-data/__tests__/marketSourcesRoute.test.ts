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
import { QualityGateError } from '../../../../scripts/market-refresh/lib/quality-gate.mjs';

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
