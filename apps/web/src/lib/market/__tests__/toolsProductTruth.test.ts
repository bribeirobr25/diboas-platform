/**
 * TOOLS-PT-1 · the Money Tools' founder-signed reference results hold on every PR (5.853).
 *
 * Requirement: `docs/tech/TOOLS_VALIDATION.md` §13 asks for the product-truth gates before a
 * tools change merges; before this test no script compared them, and the Bitcoin gate had no
 * end month, so every monthly append moved it (it read 261,403 against a signed 261,202).
 * Each gate is recomputed with the stress harness's own functions and compared with
 * `docs/tech/audit-bundle/TEST_VECTORS.json` within its signed tolerance; a gate that reads
 * market data is pinned to its `endYm`, so a new month never turns this red (the 5.478 rule).
 *
 * It reads `monthlyPrices.json` through the harness, not directly, so the pipeline-reader list
 * (`releaseGateBoundary.test.ts`) does not count it; that is safe only because every
 * data-reading gate is pinned to an end month (asserted below). Outside the weekly-gate
 * directories.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';
import {
  annuityFV,
  assetHistoryDcaReplay as harnessReplay,
  effRate,
} from '../../../../scripts/tools-stress-test.mjs';

/** The harness is plain JavaScript; its result shape, typed for this test. */
const assetHistoryDcaReplay = harnessReplay as unknown as (
  asset: string,
  startYear: number,
  amount: number,
  basis: 'total_return' | 'price_only',
  displayCurrency: string,
  opts: { endYm?: string }
) => { terminalValue: number; endYm: string };

type Gate = Record<string, unknown> & {
  tolerance: { absolute: number };
  endYm?: string;
  input?: { amount: number; years: number; locale: string };
};
const vectors = JSON.parse(
  readFileSync(
    join(__dirname, '../../../../../../docs/tech/audit-bundle/TEST_VECTORS.json'),
    'utf8'
  )
) as { productTruthGates: Record<string, Gate> };
const G = vectors.productTruthGates;

const within = (value: number, expected: number, tolerance: number) =>
  Math.abs(value - expected) <= tolerance;

describe('TOOLS-PT-1: the signed product-truth gates (5.853)', () => {
  it('should keep the pt-BR retirement result inside its signed tolerance (PT1)', () => {
    const { amount, years, locale } = G.PT1.input!;
    const v = Math.round(annuityFV(amount, effRate(10, locale, years), years * 12));
    expect(within(v, G.PT1.expectedHistorical as number, G.PT1.tolerance.absolute), String(v)).toBe(
      true
    );
  }, 30_000);

  it('should keep the de retirement result inside its signed tolerance (PT3)', () => {
    const { amount, years, locale } = G.PT3.input!;
    const v = Math.round(annuityFV(amount, effRate(10, locale, years), years * 12));
    expect(within(v, G.PT3.expectedHistorical as number, G.PT3.tolerance.absolute), String(v)).toBe(
      true
    );
  }, 30_000);

  it('should keep the S&P 500 total-return vs price-only delta inside its envelope at its end month (PT2)', () => {
    expect(G.PT2.endYm).toBeTruthy();
    const tr = assetHistoryDcaReplay('SP500', 2010, 100, 'total_return', 'USD', {
      endYm: G.PT2.endYm,
    });
    const po = assetHistoryDcaReplay('SP500', 2010, 100, 'price_only', 'USD', {
      endYm: G.PT2.endYm,
    });
    const delta = Math.round((tr.terminalValue / po.terminalValue - 1) * 10000) / 100;
    expect(
      within(delta, G.PT2.expectedDeltaPct as number, G.PT2.tolerance.absolute),
      String(delta)
    ).toBe(true);
  }, 30_000);

  it('should keep the Bitcoin 2016 monthly purchase at its re-signed value at its end month (BTC_RECON)', () => {
    expect(G.BTC_RECON.endYm).toBeTruthy();
    const r = assetHistoryDcaReplay('BTC', 2016, 100, 'total_return', 'USD', {
      endYm: G.BTC_RECON.endYm,
    });
    expect(r.endYm).toBe(G.BTC_RECON.endYm);
    expect(
      within(
        r.terminalValue,
        G.BTC_RECON.expectedTerminal as number,
        G.BTC_RECON.tolerance.absolute
      ),
      String(r.terminalValue)
    ).toBe(true);
  }, 30_000);

  it('should keep the BRL forward fallback inside its signed tolerance (PA1)', () => {
    const v = FALLBACK_MARKET_DATA.exchangeRates.rates.BRL.annualDepreciation;
    expect(within(v, G.PA1.expectedBrlFullSeriesCagr as number, G.PA1.tolerance.absolute)).toBe(
      true
    );
  }, 30_000);

  it('should pin every gate that reads market data to an end month', () => {
    for (const id of ['PT2', 'BTC_RECON']) expect(G[id].endYm, id).toMatch(/^\d{4}-\d{2}-01$/);
  });
});
