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
  FALLBACK as HARNESS_FALLBACK,
  annuityFV,
  assetHistoryDcaReplay as harnessReplay,
  effRate,
} from '../../../../scripts/tools-stress-test.mjs';
import { calculateCurrencyDepreciationRetrospective } from '@/lib/currency-depreciation/calculator';
import { calculateCompoundProjectionHedged } from '@/lib/compound-interest/calculatorHedged';
import type { SupportedLocale } from '@diboas/i18n/server';

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
  // Post-merge audit (2026-11-11): PT1 and PT3 run the PRODUCT's retirement engine (the hedged
  // compound projection the retirement page uses), not the harness's copy with a typed 10%:
  // a change to the product's rate, depreciation priority or clamp now moves them.
  const productHistorical = (g: Gate) => {
    const { amount, years, locale } = g.input!;
    const out = calculateCompoundProjectionHedged({
      amount,
      cadence: 'monthly',
      years,
      locale: locale as SupportedLocale,
    });
    return Math.round(out.series.find((s) => s.scenario === 'historical')!.finalValue);
  };

  it('should keep the pt-BR retirement result inside its signed tolerance (PT1)', () => {
    const v = productHistorical(G.PT1);
    expect(within(v, G.PT1.expectedHistorical as number, G.PT1.tolerance.absolute), String(v)).toBe(
      true
    );
  }, 30_000);

  it('should keep the de retirement result inside its signed tolerance (PT3)', () => {
    const v = productHistorical(G.PT3);
    expect(within(v, G.PT3.expectedHistorical as number, G.PT3.tolerance.absolute), String(v)).toBe(
      true
    );
  }, 30_000);

  it('should keep the S&P 500 total-return vs price-only delta inside its envelope at its end month (PT2)', () => {
    expect(G.PT2.endYm).toBeTruthy();
    // the signed input, read from the vector, never retyped (post-merge audit)
    const { asset, startYear, amount } = G.PT2.toggleDeltaTest as {
      asset: string;
      startYear: number;
      amount: number;
    };
    const tr = assetHistoryDcaReplay(asset, startYear, amount, 'total_return', 'USD', {
      endYm: G.PT2.endYm,
    });
    const po = assetHistoryDcaReplay(asset, startYear, amount, 'price_only', 'USD', {
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
    const { asset, startYear, amount } = G.BTC_RECON.input as unknown as {
      asset: string;
      startYear: number;
      amount: number;
    };
    const r = assetHistoryDcaReplay(asset, startYear, amount, 'total_return', 'USD', {
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

  // PA1 re-signed 2026-11-10 at the card's computed value (DR answer 7): it checks the PRODUCT's
  // own figure, the retrospective calculator's yearly rate for the real.
  it('should keep the BRL yearly rate the card shows at its signed value (PA1)', () => {
    const r = calculateCurrencyDepreciationRetrospective(
      { amount: 1000, currency: 'BRL' },
      FALLBACK_MARKET_DATA
    );
    const v = r!.historicalCagr;
    expect(within(v, G.PA1.expectedBrlFullSeriesCagr as number, G.PA1.tolerance.absolute)).toBe(
      true
    );
  }, 30_000);

  it('should pin every gate that reads market data to an end month', () => {
    // every gate of a tool that reads the monthly series, not a hand list (MP-1c review)
    const reading = Object.entries(G).filter(
      ([, g]) => (g as { tool?: string }).tool === 'assetHistory'
    );
    expect(reading.map(([id]) => id)).toContain('BTC_RECON');
    for (const [id, g] of reading) expect((g as Gate).endYm, id).toMatch(/^\d{4}-\d{2}-01$/);
  });

  // Review of MP-1c: the harness computes from its own copy of the product's rates ("synced with
  // constants.ts", enforced by nothing). Every value it copies must equal the product's.
  it("should compute from exactly the product's rates (the harness copy equals constants.ts)", () => {
    const h = HARNESS_FALLBACK as unknown as {
      bankRates: Record<string, Record<string, number>>;
      inflationRates: Record<string, Record<string, number>>;
      scenarioRates: Record<string, number>;
      exchangeRates: Record<string, { annualDepreciation: number }>;
    };
    const p = FALLBACK_MARKET_DATA as unknown as {
      rates: {
        bankRates: Record<string, Record<string, unknown>>;
        scenarioRates: Record<string, number>;
      };
      inflationRates: { rates: Record<string, Record<string, number>> };
      exchangeRates: { rates: Record<string, { annualDepreciation: number }> };
    };
    for (const [loc, fields] of Object.entries(h.bankRates))
      for (const [k, v] of Object.entries(fields))
        expect(p.rates.bankRates[loc]?.[k], `bankRates.${loc}.${k}`).toBe(v);
    expect(h.scenarioRates).toEqual(p.rates.scenarioRates);
    for (const [loc, fields] of Object.entries(h.inflationRates))
      for (const [k, v] of Object.entries(fields))
        expect(p.inflationRates.rates[loc]?.[k], `inflationRates.${loc}.${k}`).toBe(v);
    for (const [ccy, r] of Object.entries(h.exchangeRates))
      expect(p.exchangeRates.rates[ccy]?.annualDepreciation, `exchangeRates.${ccy}`).toBe(
        r.annualDepreciation
      );
  });
});
