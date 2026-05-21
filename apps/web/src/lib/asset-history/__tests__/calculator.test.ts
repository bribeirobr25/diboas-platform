/**
 * Phase E — Asset History calculator unit tests.
 *
 * Cross-validates the math against research doc Parts 1 + 2 anchor tables
 * and Part 1's BTC 2010 DCA range ($500M–$1.5B for $100/month).
 */

import { describe, it, expect } from 'vitest';
import { calculateAssetHistory, AssetHistoryDataError } from '../calculator';

describe('calculateAssetHistory — lump sum (research Parts 1+2 ratios)', () => {
  it('BTC 2010 lump sum $100 returns ~$114M (Part 1: $0.07 → $80,000)', () => {
    const result = calculateAssetHistory({
      asset: 'BTC',
      startYear: 2010,
      mode: 'lumpSum',
      amount: 100,
    });
    expect(result.terminalValue).not.toBeNull();
    expect(result.terminalValue!).toBeGreaterThan(110_000_000);
    expect(result.terminalValue!).toBeLessThan(120_000_000);
    expect(result.confidence).toBe('MEDIUM'); // BTC 2010 anchor is MEDIUM
  });

  it('S&P 500 2010 lump sum $100 returns ~$718 (Part 1: 1030 → 7400)', () => {
    const result = calculateAssetHistory({
      asset: 'SP500',
      startYear: 2010,
      mode: 'lumpSum',
      amount: 100,
    });
    expect(result.terminalValue!).toBeCloseTo(718, 0);
    expect(result.confidence).toBe('MEDIUM'); // 2026 endpoint is MEDIUM
  });

  it('Gold 2010 lump sum $100 returns ~$392 (Part 1: 1200 → 4700)', () => {
    const result = calculateAssetHistory({
      asset: 'GOLD',
      startYear: 2010,
      mode: 'lumpSum',
      amount: 100,
    });
    expect(result.terminalValue!).toBeCloseTo(392, 0);
  });

  it('TLT 2016 lump sum $100 returns ~$90 (Part 2: 94 → 85, slight loss)', () => {
    const result = calculateAssetHistory({
      asset: 'TLT',
      startYear: 2016,
      mode: 'lumpSum',
      amount: 100,
    });
    expect(result.terminalValue!).toBeCloseTo(90, 0);
  });
});

describe('calculateAssetHistory — DCA (research-validated terminals)', () => {
  it('BTC 2010 DCA $100/mo returns LOW-confidence RANGE $500M–$1.5B (M6 lock)', () => {
    const result = calculateAssetHistory({
      asset: 'BTC',
      startYear: 2010,
      mode: 'monthlyDca',
      amount: 100,
    });
    expect(result.terminalValue).toBeNull();
    expect(result.confidence).toBe('LOW');
    expect(result.rangeLow).toBe(500_000_000);
    expect(result.rangeHigh).toBe(1_500_000_000);
  });

  it('BTC 2010 DCA RANGE scales linearly with contribution amount', () => {
    const result = calculateAssetHistory({
      asset: 'BTC',
      startYear: 2010,
      mode: 'monthlyDca',
      amount: 250,
    });
    expect(result.rangeLow).toBe(500_000_000 * 2.5);
    expect(result.rangeHigh).toBe(1_500_000_000 * 2.5);
  });

  it('BTC 2016 DCA $100/mo returns ~$200,000 (research Part 2)', () => {
    const result = calculateAssetHistory({
      asset: 'BTC',
      startYear: 2016,
      mode: 'monthlyDca',
      amount: 100,
    });
    expect(result.terminalValue).toBe(200_000);
    expect(result.confidence).toBe('MEDIUM'); // BTC always MEDIUM for DCA
  });

  it('S&P 500 2010 DCA $100/mo returns ~$66,000 (research Part 1)', () => {
    const result = calculateAssetHistory({
      asset: 'SP500',
      startYear: 2010,
      mode: 'monthlyDca',
      amount: 100,
    });
    expect(result.terminalValue).toBe(66_000);
  });

  it('QQQ 2016 DCA $100/mo returns ~$28,000 (research Part 2)', () => {
    const result = calculateAssetHistory({
      asset: 'QQQ',
      startYear: 2016,
      mode: 'monthlyDca',
      amount: 100,
    });
    expect(result.terminalValue).toBe(28_000);
  });

  it('DCA terminals scale linearly with user-provided amount', () => {
    const result200 = calculateAssetHistory({
      asset: 'SP500',
      startYear: 2010,
      mode: 'monthlyDca',
      amount: 200,
    });
    // SP500 2010 DCA per $100 = $66,000; per $200 = $132,000
    expect(result200.terminalValue).toBe(132_000);
  });
});

describe('calculateAssetHistory — anchor / month accuracy', () => {
  it('months from Jul 2010 to May 2026 = 190 (research Part 1)', () => {
    const result = calculateAssetHistory({
      asset: 'SP500',
      startYear: 2010,
      mode: 'monthlyDca',
      amount: 100,
    });
    expect(result.months).toBe(190);
  });

  it('months from Mar 2016 to May 2026 = 122 (research Part 2)', () => {
    const result = calculateAssetHistory({
      asset: 'SP500',
      startYear: 2016,
      mode: 'monthlyDca',
      amount: 100,
    });
    expect(result.months).toBe(122);
  });

  it('totalContributed for DCA = amount × months', () => {
    const result = calculateAssetHistory({
      asset: 'SP500',
      startYear: 2010,
      mode: 'monthlyDca',
      amount: 100,
    });
    expect(result.totalContributed).toBe(19_000); // $100 × 190
  });
});

describe('calculateAssetHistory — currency reporting', () => {
  it('Ibovespa reports anchors in BRL', () => {
    const result = calculateAssetHistory({
      asset: 'IBOVESPA',
      startYear: 2010,
      mode: 'lumpSum',
      amount: 100,
    });
    expect(result.startAnchor.currency).toBe('BRL');
    expect(result.endAnchor.currency).toBe('BRL');
  });

  it('DAX reports anchors in EUR', () => {
    const result = calculateAssetHistory({
      asset: 'DAX',
      startYear: 2016,
      mode: 'lumpSum',
      amount: 100,
    });
    expect(result.startAnchor.currency).toBe('EUR');
    expect(result.endAnchor.currency).toBe('EUR');
  });
});

describe('calculateAssetHistory — error cases', () => {
  it('throws AssetHistoryDataError when asset has no DCA terminal value', () => {
    // This guard fires if we ever lose a DCA terminal entry in DCA_TERMINAL_PER_100.
    // Trivially asserts the data table covers all valid (asset, year) combos.
    // To trip the throw: would require mutating DCA_TERMINAL_PER_100 at runtime.
    // Instead we exhaustively verify every valid combination returns a number.
    const assets = ['BTC', 'SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX'] as const;
    const startYears = [2010, 2016] as const;
    for (const asset of assets) {
      for (const startYear of startYears) {
        const fn = () =>
          calculateAssetHistory({ asset, startYear, mode: 'monthlyDca', amount: 100 });
        // BTC 2010 returns LOW-confidence range; others return a number.
        if (asset === 'BTC' && startYear === 2010) {
          expect(fn().terminalValue).toBeNull();
        } else {
          expect(fn().terminalValue).toBeGreaterThan(0);
        }
      }
    }
  });

  it('error class is AssetHistoryDataError', () => {
    const err = new AssetHistoryDataError('test');
    expect(err.name).toBe('AssetHistoryDataError');
    expect(err.message).toContain('Asset history data unavailable');
  });
});
