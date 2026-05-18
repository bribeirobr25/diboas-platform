/**
 * Phase C — historical.ts anchor data tests.
 *
 * Covers: staleness gate (L6 round-2 scoped name), anchor structure
 * invariants, FX bucket continuity, helper lookups.
 */

import { describe, it, expect } from 'vitest';
import {
  ANCHOR_PRICES,
  BRL_USD_BUCKETS,
  EUR_USD_BUCKETS,
  LAST_RESEARCH_UPDATE,
  getAnchorPrice,
  getFxBuckets,
} from '../historical';
import type { AssetCode, AnchorYear } from '../types';

// ─── Staleness gate (L6 round-2 — scoped to anchor-data Appendix F row) ─

describe('historical anchor data — single-source 365-day gate (anchor-data scope per §6.11 Appendix F)', () => {
  it('LAST_RESEARCH_UPDATE is within 365 days of CI run', () => {
    const updatedAt = new Date(LAST_RESEARCH_UPDATE).getTime();
    const ageDays = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
    expect(ageDays).toBeLessThan(365);
  });

  it('LAST_RESEARCH_UPDATE is a valid ISO-8601 date string', () => {
    expect(LAST_RESEARCH_UPDATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(LAST_RESEARCH_UPDATE).toISOString().slice(0, 10)).toBe(LAST_RESEARCH_UPDATE);
  });
});

// ─── Anchor structure invariants ────────────────────────────────────────

describe('ANCHOR_PRICES — structure invariants', () => {
  it('ships 8 assets × 3 anchor windows = 24 entries (M8 round-2 anchor scope)', () => {
    expect(ANCHOR_PRICES.length).toBe(24);
  });

  const expectedAssets: readonly AssetCode[] = [
    'BTC', 'SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX',
  ];
  const expectedYears: readonly AnchorYear[] = [2010, 2016, 2026];

  it.each(expectedAssets)('asset %s has all 3 anchor years (2010, 2016, 2026)', (asset) => {
    const years = ANCHOR_PRICES.filter(a => a.asset === asset).map(a => a.year).sort();
    expect(years).toEqual([...expectedYears].sort());
  });

  it('all anchors have positive prices', () => {
    for (const anchor of ANCHOR_PRICES) {
      expect(anchor.price).toBeGreaterThan(0);
    }
  });

  it('BTC 2010 anchor is MEDIUM confidence (research ±30% range)', () => {
    const anchor = ANCHOR_PRICES.find(a => a.asset === 'BTC' && a.year === 2010);
    expect(anchor?.confidence).toBe('MEDIUM');
  });

  it('all May 2026 anchors are HIGH or MEDIUM (no LOW for endpoint)', () => {
    const endpoints = ANCHOR_PRICES.filter(a => a.year === 2026);
    for (const anchor of endpoints) {
      expect(['HIGH', 'MEDIUM']).toContain(anchor.confidence);
    }
  });

  it('Ibovespa anchors are in BRL; DAX anchors are in EUR; others in USD', () => {
    for (const anchor of ANCHOR_PRICES) {
      if (anchor.asset === 'IBOVESPA') expect(anchor.currency).toBe('BRL');
      else if (anchor.asset === 'DAX') expect(anchor.currency).toBe('EUR');
      else expect(anchor.currency).toBe('USD');
    }
  });

  it('every anchor cites a source string', () => {
    for (const anchor of ANCHOR_PRICES) {
      expect(anchor.source).toBeTruthy();
      expect(anchor.source.length).toBeGreaterThan(5);
    }
  });
});

// ─── FX bucket continuity ───────────────────────────────────────────────

describe('FX buckets — continuity and shape (Phase B `FxBucket` lock)', () => {
  it('BRL buckets cover Jan 2010 through May 2026 contiguously', () => {
    expect(BRL_USD_BUCKETS.length).toBe(4);
    expect(BRL_USD_BUCKETS[0]!.startDate).toBe('2010-01-01');
    expect(BRL_USD_BUCKETS[BRL_USD_BUCKETS.length - 1]!.endDate).toBe('2026-05-15');
    for (let i = 1; i < BRL_USD_BUCKETS.length; i++) {
      const prevEnd = new Date(BRL_USD_BUCKETS[i - 1]!.endDate).getTime();
      const currentStart = new Date(BRL_USD_BUCKETS[i]!.startDate).getTime();
      const gapDays = (currentStart - prevEnd) / (1000 * 60 * 60 * 24);
      expect(gapDays).toBeGreaterThan(0);
      expect(gapDays).toBeLessThanOrEqual(2);
    }
  });

  it('EUR buckets cover Jan 2010 through May 2026 contiguously', () => {
    expect(EUR_USD_BUCKETS.length).toBe(3);
    expect(EUR_USD_BUCKETS[0]!.startDate).toBe('2010-01-01');
    expect(EUR_USD_BUCKETS[EUR_USD_BUCKETS.length - 1]!.endDate).toBe('2026-05-15');
  });

  it('all bucket avgRate values are positive', () => {
    for (const bucket of [...BRL_USD_BUCKETS, ...EUR_USD_BUCKETS]) {
      expect(bucket.avgRate).toBeGreaterThan(0);
    }
  });

  it('BRL Scenario D bucket averages match research Part 5 (2.0/3.5/5.2/5.65)', () => {
    expect(BRL_USD_BUCKETS.map(b => b.avgRate)).toEqual([2.0, 3.5, 5.2, 5.65]);
  });
});

// ─── Helper lookups ─────────────────────────────────────────────────────

describe('historical.ts helper lookups', () => {
  it('getAnchorPrice returns matching anchor when present', () => {
    const anchor = getAnchorPrice('BTC', 2016);
    expect(anchor).not.toBeNull();
    expect(anchor?.price).toBe(416.73);
    expect(anchor?.confidence).toBe('HIGH');
  });

  it('getAnchorPrice returns null when asset×year missing (e.g. 2020 dropped per M8)', () => {
    // 2020 is not a valid AnchorYear per M8 round-2; cast bypasses type system
    // to verify runtime returns null for missing combinations.
    const anchor = getAnchorPrice('BTC', 2020 as AnchorYear);
    expect(anchor).toBeNull();
  });

  it('getFxBuckets returns BRL bucket array for BRL', () => {
    const buckets = getFxBuckets('BRL');
    expect(buckets).toBe(BRL_USD_BUCKETS);
  });

  it('getFxBuckets returns EUR bucket array for EUR', () => {
    const buckets = getFxBuckets('EUR');
    expect(buckets).toBe(EUR_USD_BUCKETS);
  });
});

// ─── Research-parity golden values (drift-detection lock) ──────────────
//
// These assertions pin every anchor price to its research-doc source value.
// They exist solely to detect silent drift between `historical.ts` and the
// research source (`docs/researches/btc-vs-assets-inflation-fx-final-analysis.md`).
// When new research data is published, update BOTH the data and these tests
// in the same PR — the failing test forces conscious review of the new value.

describe('ANCHOR_PRICES — research-doc parity (golden values)', () => {
  // Format: [asset, year, monthIndicative, expectedPrice, expectedCurrency, expectedConfidence]
  // Sourced 1:1 from docs/researches/btc-vs-assets-inflation-fx-final-analysis.md (Parts 1+2)
  type ParityRow = readonly [AssetCode, AnchorYear, number, number, 'USD' | 'BRL' | 'EUR', 'HIGH' | 'MEDIUM' | 'LOW'];
  const goldenAnchors: readonly ParityRow[] = [
    ['BTC',        2010, 7, 0.07,    'USD', 'MEDIUM'],
    ['BTC',        2016, 3, 416.73,  'USD', 'HIGH'],
    ['BTC',        2026, 5, 80000,   'USD', 'HIGH'],
    ['SP500',      2010, 7, 1030,    'USD', 'HIGH'],
    ['SP500',      2016, 3, 2060,    'USD', 'HIGH'],
    ['SP500',      2026, 5, 7400,    'USD', 'MEDIUM'],
    ['QQQ',        2010, 7, 45.5,    'USD', 'HIGH'],
    ['QQQ',        2016, 3, 108,     'USD', 'HIGH'],
    ['QQQ',        2026, 5, 711,     'USD', 'MEDIUM'],
    ['MSCI_WORLD', 2010, 7, 1180,    'USD', 'HIGH'],
    ['MSCI_WORLD', 2016, 3, 1610,    'USD', 'HIGH'],
    ['MSCI_WORLD', 2026, 5, 5540,    'USD', 'MEDIUM'],
    ['GOLD',       2010, 7, 1200,    'USD', 'HIGH'],
    ['GOLD',       2016, 3, 1235,    'USD', 'HIGH'],
    ['GOLD',       2026, 5, 4700,    'USD', 'MEDIUM'],
    ['TLT',        2010, 7, 98,      'USD', 'HIGH'],
    ['TLT',        2016, 3, 94,      'USD', 'HIGH'],
    ['TLT',        2026, 5, 85,      'USD', 'MEDIUM'],
    ['IBOVESPA',   2010, 7, 67500,   'BRL', 'HIGH'],
    ['IBOVESPA',   2016, 3, 50055,   'BRL', 'HIGH'],
    ['IBOVESPA',   2026, 5, 177000,  'BRL', 'MEDIUM'],
    ['DAX',        2010, 7, 6100,    'EUR', 'HIGH'],
    ['DAX',        2016, 3, 9966,    'EUR', 'HIGH'],
    ['DAX',        2026, 5, 24000,   'EUR', 'MEDIUM'],
  ];

  it.each(goldenAnchors)(
    '%s %s anchor matches research source (price %s %s, confidence %s)',
    (asset, year, monthIndicative, price, currency, confidence) => {
      const anchor = getAnchorPrice(asset, year);
      expect(anchor).not.toBeNull();
      expect(anchor!.monthIndicative).toBe(monthIndicative);
      expect(anchor!.price).toBe(price);
      expect(anchor!.currency).toBe(currency);
      expect(anchor!.confidence).toBe(confidence);
    },
  );

  it('EUR/USD bucket averages match research Part 4 inversion (0.78 / 0.88 / 0.89)', () => {
    expect(EUR_USD_BUCKETS.map(b => b.avgRate)).toEqual([0.78, 0.88, 0.89]);
  });
});

// ─── §6.10 enforcement note (grep-gate runs at pre-merge per §3.13) ────

describe('§6.10 internal-only discipline (consumer-side check)', () => {
  it('historical.ts exports the documented internal surface', () => {
    // This test pins the public-to-package shape. If the §6.10 grep gate
    // fails in CI (consumer outside lib/market-data/ imports from historical),
    // tightening this assertion lets us track the package surface in one spot.
    expect(typeof getAnchorPrice).toBe('function');
    expect(typeof getFxBuckets).toBe('function');
    expect(typeof LAST_RESEARCH_UPDATE).toBe('string');
    expect(Array.isArray(ANCHOR_PRICES)).toBe(true);
  });
});
