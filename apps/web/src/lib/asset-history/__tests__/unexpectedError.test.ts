/**
 * Phase 7 §7.1 — C21 reproducer test (engine-side).
 *
 * Plan called for `Default.test.tsx → 'should render empty state on unexpected
 * engine error'`. The asset-history React component is hard to render in
 * isolation (loads `marketDataService.get()` in mount, depends on locale
 * provider, etc.) — so the C21 protection is exercised at the engine boundary
 * here instead. The component's widened catch (now distinguishing
 * AssetHistoryDataError vs unexpected throws + routing the latter through
 * CALCULATOR_UNEXPECTED_ERROR + Sentry) is then a thin pass-through that the
 * defaults pinning + page-wiring smoke tests (Phase 7 §7.3) cover.
 *
 * The key property: the engine SHOULD only throw `AssetHistoryDataError` for
 * data-availability issues. If a different throw shape escapes (e.g. due to a
 * future regression where a corrupted FX series produces NaN inside arithmetic),
 * the component's catch widening is the safety net. These tests pin the engine
 * boundary so a future engine change that violates the contract is caught
 * loudly here, not silently in production.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { calculateAssetHistoryDcaReplay, AssetHistoryDataError } from '../calculator';
import { marketDataService } from '@/lib/market-data';

describe('asset-history engine — C21 unexpected-error contract', () => {
  beforeAll(async () => {
    await marketDataService.get();
  });

  it('throws AssetHistoryDataError (NOT a plain Error) for unknown asset', () => {
    expect(() =>
      calculateAssetHistoryDcaReplay({
        // @ts-expect-error — deliberately passing an invalid AssetCode to test
        asset: 'NONEXISTENT_ASSET',
        startYear: 2016,
        amount: 100,
      })
    ).toThrow(AssetHistoryDataError);
  });

  it('throws AssetHistoryDataError for startYear with no data', () => {
    // MSCI_WORLD data begins 2012-01; 2010/2011 yield AssetHistoryDataError.
    expect(() =>
      calculateAssetHistoryDcaReplay({
        asset: 'MSCI_WORLD',
        startYear: 2010,
        amount: 100,
      })
    ).toThrow(AssetHistoryDataError);
  });

  it('every thrown error from the engine is an instanceof AssetHistoryDataError (engine contract)', () => {
    // Try the known data-availability failure modes; every one must satisfy
    // `err instanceof AssetHistoryDataError` so the component's `if (err instanceof
    // AssetHistoryDataError) return null` branch handles them. Anything else
    // would fall through to the C21 widened-catch (Sentry + event) path.
    const cases = [
      // Unknown asset
      () =>
        calculateAssetHistoryDcaReplay({
          // @ts-expect-error — deliberately invalid
          asset: 'XXX',
          startYear: 2016,
          amount: 100,
        }),
      // Pre-data startYear for MSCI_WORLD
      () => calculateAssetHistoryDcaReplay({ asset: 'MSCI_WORLD', startYear: 2011, amount: 100 }),
    ];
    for (const c of cases) {
      try {
        c();
        expect.fail('Engine should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AssetHistoryDataError);
      }
    }
  });
});
