/**
 * 5.819 · the asset-history start-year picker offers exactly the years the asset's published
 * series covers. Requirement: no offered year lacks data (MSCI World 2010-2011 made the result
 * disappear with no sentence), and no year that has data is withheld. The expectation is
 * derived from the series itself, never typed.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { marketDataService } from '@/lib/market-data';
import {
  assetHistoryStartYears,
  calculateAssetHistoryLumpSum,
  type AssetHistoryStartYear,
} from '../calculator';

const CANDIDATES = Array.from({ length: 17 }, (_, i) => 2010 + i) as AssetHistoryStartYear[];
const ASSETS = ['BTC', 'SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX'] as const;

beforeAll(async () => {
  await marketDataService.get();
});

describe('assetHistoryStartYears', () => {
  for (const asset of ASSETS) {
    it(`should offer exactly the years the ${asset} series covers when it is loaded`, () => {
      const months = marketDataService.getMonthlySeries()!.assets![asset]!.months;
      const covered = new Set(months.map((m) => parseInt(m.ym.slice(0, 4), 10)));
      const offered = assetHistoryStartYears(asset, CANDIDATES);
      expect(offered.length).toBeGreaterThan(0);
      for (const y of offered) expect(covered.has(y), `${asset} ${y}`).toBe(true);
      for (const y of CANDIDATES) {
        if (covered.has(y)) expect(offered, `${asset} ${y}`).toContain(y);
      }
    });
  }

  it('should give a result for every offered year when a lump sum is computed (no silent empty panel)', () => {
    for (const asset of ASSETS) {
      for (const startYear of assetHistoryStartYears(asset, CANDIDATES)) {
        expect(() =>
          calculateAssetHistoryLumpSum({ asset, startYear, amount: 1000 })
        ).not.toThrow();
      }
    }
  });
});
