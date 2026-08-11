/**
 * data_status derivation (B3, 2026-08-11 — closes Follow-up L) — the pure
 * module behind the automated panel writer in generate.mjs.
 *
 * The golden test locks every rule to reality: deriving from the committed
 * computed.json + the real ETF ledger must reproduce the committed
 * data-status.json exactly (annotations aside). The unit matrix locks each
 * cadence-class rule at its boundaries — including the F-M3 laggard rule
 * (a publication-lagged FRED series inside its window is FRESH, not
 * DELAYED) and the warm-up ledger honesty states.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  deriveDataStatus,
  SOURCE_REGISTRY,
} from '../../../../scripts/market-refresh/lib/data-status.mjs';
import { readSnapshots } from '../../../../scripts/market-refresh/lib/etf-flows.mjs';

const MARKET_DIR = join(__dirname, '../../../../data/market');
const readJson = (f: string) => JSON.parse(readFileSync(join(MARKET_DIR, f), 'utf8'));

const stripAnnotations = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !k.startsWith('_')));

/** Minimal computed.json shape: every registry signal gets an anchor. */
function mkComputed(computedAt: string, anchors: Partial<Record<string, string>>) {
  const defaults: Record<string, string> = {
    'BTC-01': '2026-07-01',
    'MAC-01': '2026-08-07',
    'MAC-02': '2026-08-07',
    'MAC-03': '2026-06-01',
    'REL-01': '2026-08-07',
    'REL-03': '2026-08-07',
  };
  const merged = { ...defaults, ...anchors };
  return {
    computed_at: computedAt,
    signals: Object.entries(merged).map(([id, anchor]) => ({ id, anchor })),
  };
}
const mkLedger = (anchorDates: string[]) => anchorDates.map((anchor) => ({ anchor, funds: {} }));
const FIVE_SNAPSHOTS = ['2026-07-10', '2026-07-17', '2026-07-24', '2026-07-31', '2026-08-07'];
const bySource = (ds: ReturnType<typeof deriveDataStatus>, name: string) =>
  ds.sources.find((s: { source: string }) => s.source.includes(name));

describe('data_status golden reconstruction (Follow-up L closed)', () => {
  it('should reproduce the committed data-status.json exactly from computed.json + the ETF ledger', () => {
    const derived = deriveDataStatus(readJson('computed.json'), readSnapshots());
    expect(derived).toEqual(stripAnnotations(readJson('data-status.json')));
  });

  it('should reproduce the committed regime.json#data_status identically (F-M6 by construction)', () => {
    const derived = deriveDataStatus(readJson('computed.json'), readSnapshots());
    expect(derived).toEqual(stripAnnotations(readJson('regime.json').data_status));
  });

  it('should keep the registry aligned with the committed source set and order', () => {
    const committed = readJson('data-status.json').sources.map((s: { source: string }) => s.source);
    expect(SOURCE_REGISTRY.map((r) => r.source)).toEqual(committed);
  });
});

describe('weekly-friday sources (F-M3 laggard rule)', () => {
  it('should stay FRESH when the anchor lags within the 14-day publication window', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', { 'MAC-02': '2026-07-31' }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    const dgs = bySource(ds, 'DGS10')!;
    expect(dgs.status).toBe('FRESH');
    expect(dgs.expected_next_update_at).toBe('2026-08-14T20:00:00Z');
    expect(dgs.stale_after).toBe('2026-08-21T20:00:00Z');
  });

  it('should flip DELAYED when the anchor lags beyond 14 days', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', { 'MAC-02': '2026-07-24' }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    expect(bySource(ds, 'DGS10')!.status).toBe('DELAYED');
    expect(ds.delayed_sources).toContain('FRED:DGS10');
  });
});

describe('BTC monthly-close source (doc 02 §5.1 expected confirmed month)', () => {
  it('should be FRESH when the anchor is the expected confirmed month', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', { 'BTC-01': '2026-07-01' }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    const btc = bySource(ds, 'monthlyPrices')!;
    expect(btc.status).toBe('FRESH');
    expect(btc.last_updated_at).toBe('2026-07-31T00:00:00Z');
    expect(btc.expected_next_update_at).toBe('2026-08-31T23:59:59Z');
    expect(btc.stale_after).toBe('2026-10-01T00:00:00Z');
  });

  it('should be DELAYED when a confirmable close has not been appended (the v4 2026-08-03 state)', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', { 'BTC-01': '2026-06-01' }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    const btc = bySource(ds, 'monthlyPrices')!;
    expect(btc.status).toBe('DELAYED');
    expect(btc.message).toContain('--append-btc due');
  });
});

describe('M2 monthly-print source', () => {
  it('should stay FRESH until the next print is overdue', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', { 'MAC-03': '2026-06-01' }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    const m2 = bySource(ds, 'M2SL')!;
    expect(m2.status).toBe('FRESH');
    expect(m2.expected_next_update_at).toBe('2026-08-25T20:00:00Z');
  });

  it('should flip DELAYED once the expected print date has passed', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-26T07:55:30.000Z', { 'MAC-03': '2026-06-01' }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    const m2 = bySource(ds, 'M2SL')!;
    expect(m2.status).toBe('DELAYED');
    expect(m2.message).toContain('overdue');
  });
});

describe('Polygon warm-up ledger source (doc 02 §10.1 honesty)', () => {
  it('should be UNAVAILABLE below 5 snapshots and name the first scorable Monday', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', {}),
      mkLedger(['2026-07-10', '2026-07-24', '2026-07-31', '2026-08-07'])
    );
    const etf = bySource(ds, 'Polygon')!;
    expect(etf.status).toBe('UNAVAILABLE');
    expect(etf.message).toContain('4 of 5 weekly snapshots');
    expect(etf.message).toContain('~2026-08-17');
    expect(ds.unavailable_sources).toEqual(['Polygon:ETF (shares-outstanding)']);
  });

  it('should flip FRESH at 5 snapshots (the 2026-08-17 activation)', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-17T07:55:30.000Z', {
        'MAC-01': '2026-08-14',
        'MAC-02': '2026-08-14',
        'REL-01': '2026-08-14',
        'REL-03': '2026-08-14',
      }),
      mkLedger([...FIVE_SNAPSHOTS.slice(1), '2026-08-14'])
    );
    const etf = bySource(ds, 'Polygon')!;
    expect(etf.status).toBe('FRESH');
    expect(etf.message).toContain('doc 02 §8.3');
    expect(ds.unavailable_sources).toEqual([]);
  });

  it('should flip DELAYED when the ledger goes stale past 21 days', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-09-10T07:55:30.000Z', {
        'BTC-01': '2026-08-01',
        'MAC-03': '2026-07-01',
        'MAC-01': '2026-09-04',
        'MAC-02': '2026-09-04',
        'REL-01': '2026-09-04',
        'REL-03': '2026-09-04',
      }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    expect(bySource(ds, 'Polygon')!.status).toBe('DELAYED');
  });
});

describe('overall_confidence derivation', () => {
  it('should be HIGH when every source is FRESH', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', {}),
      mkLedger(FIVE_SNAPSHOTS)
    );
    expect(ds.delayed_sources).toEqual([]);
    expect(ds.unavailable_sources).toEqual([]);
    expect(ds.overall_confidence).toBe('HIGH');
  });

  it('should be MODERATE when any source is UNAVAILABLE or DELAYED', () => {
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', {}),
      mkLedger(FIVE_SNAPSHOTS.slice(1))
    );
    expect(ds.overall_confidence).toBe('MODERATE');
  });

  it('should be LOW when a source is already past its stale_after at run time', () => {
    // BTC anchor 3 months stale → stale_after (anchor+2 month-ends +1d) is behind the run date.
    const ds = deriveDataStatus(
      mkComputed('2026-08-10T07:55:30.136Z', { 'BTC-01': '2026-04-01' }),
      mkLedger(FIVE_SNAPSHOTS)
    );
    expect(bySource(ds, 'monthlyPrices')!.status).toBe('DELAYED');
    expect(ds.overall_confidence).toBe('LOW');
  });
});
