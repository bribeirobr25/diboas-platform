/**
 * TOOLS-CLOSE-1 (5.627): the monthly tools leg never stores a missing close as
 * 0. Total-return series store Yahoo's adjusted close; when a bar carried none,
 * `round(null)` wrote 0 into the file the Money Tools calculators read. A bar
 * without a usable close now fails that series (reported in the weekly PR;
 * `--check` fails). Whether a later run recovers it is tested in
 * `toolsMonthliesCommand.test.ts`, not assumed. Rule-only: no pipeline data.
 */
import { describe, expect, it } from 'vitest';
import { storedClose } from '../../../../scripts/market-refresh/tools-monthlies.mjs';

const TOTAL_RETURN = { adjClose: true };
const PRICE_ONLY = { adjClose: false };

describe('storedClose', () => {
  it('should store the adjusted close for a total-return series', () => {
    expect(storedClose(TOTAL_RETURN, { close: 500, adjclose: 512.5 })).toBe(512.5);
  });

  it.each([null, undefined, 0, -1, Number.NaN])(
    'should refuse an adjusted close of %s even when the price close is fine',
    (adjclose) => {
      expect(storedClose(TOTAL_RETURN, { close: 500, adjclose: adjclose as number })).toBeNull();
    }
  );

  it('should store the price close for a price-only series, ignoring adjclose', () => {
    expect(storedClose(PRICE_ONLY, { close: 4100, adjclose: null })).toBe(4100);
    expect(storedClose(PRICE_ONLY, { close: 0, adjclose: 4100 })).toBeNull();
  });
});
