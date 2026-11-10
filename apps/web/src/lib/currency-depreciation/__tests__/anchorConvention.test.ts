/**
 * FX-ANCHOR-1 · every exchange-rate figure the tools type by hand is in ONE convention:
 * units of local currency per 1 USD, the convention of `rateToUsd` and of the published
 * Fed H.10 series (`monthlyFx.json` `closeLocalPerUsd`).
 *
 * Why (5.848): the EUR retrospective anchors were stored as USD per EUR while the BRL ones
 * were BRL per USD, and the calculator divides by both the same way, so the euro's
 * "Since 2010" result showed a 22% gain where the euro lost 18% against the dollar.
 *
 * Requirement source: Legal L-W5-06 condition 3 (an FX figure states its pair and quote
 * direction), and `constants.ts`'s own unit header.
 *
 * Scope limit, stated: the convention check compares a figure with the published Fed
 * month-end of the same month and asks which of (figure, 1/figure) is closer. It cannot
 * tell the two conventions apart for a currency quoted near 1:1 (none today), and the
 * 5% agreement band allows the gap between a monthly average or a dated point (what the
 * anchors are) and a month-end (what the series is).
 */
import { describe, expect, it } from 'vitest';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';
import monthlyFx from '@/lib/market-data/data/monthlyFx.json';

type FxMonth = { ym: string; closeLocalPerUsd: number };
type FxFile = Record<string, { months?: FxMonth[] } | unknown>;

const fx = monthlyFx as unknown as FxFile;
const AGREEMENT = 0.05;

function fedMonthEnd(currency: string, isoDate: string): number | null {
  const series = fx[currency] as { months?: FxMonth[] } | undefined;
  const months = series?.months;
  if (!Array.isArray(months)) return null;
  const ym = `${isoDate.slice(0, 7)}-01`;
  const row = months.find((m) => m.ym === ym);
  return row && Number.isFinite(row.closeLocalPerUsd) ? row.closeLocalPerUsd : null;
}

function inSameConvention(figure: number, reference: number): boolean {
  return Math.abs(figure - reference) < Math.abs(1 / figure - reference);
}

const rates = FALLBACK_MARKET_DATA.exchangeRates.rates as Record<
  string,
  {
    rateToUsd: number;
    rateDate?: string;
    historicalRateStart?: number;
    historicalRateEnd?: number;
    historicalAnchorStart?: string;
    historicalAnchorEnd?: string;
  }
>;

const anchored = Object.entries(rates).filter(
  ([, r]) => r.historicalRateStart !== undefined && r.historicalAnchorStart !== undefined
);

describe('FX-ANCHOR-1: hand-typed FX figures use local currency per USD', () => {
  it('should find at least the two retrospective currencies when the anchors are read', () => {
    // A vacuous pass would hide a broken filter (guard filters are part of the threat model).
    expect(anchored.map(([c]) => c).sort()).toEqual(expect.arrayContaining(['BRL', 'EUR']));
  });

  for (const [currency, r] of anchored) {
    for (const [label, value, date] of [
      ['start', r.historicalRateStart!, r.historicalAnchorStart!],
      ['end', r.historicalRateEnd!, r.historicalAnchorEnd!],
    ] as const) {
      it(`should quote the ${currency} ${label} anchor as ${currency} per USD when compared with the Fed month-end`, () => {
        const reference = fedMonthEnd(currency, date);
        expect(reference, `no Fed month-end for ${currency} ${date}`).not.toBeNull();
        expect(inSameConvention(value, reference!)).toBe(true);
        expect(Math.abs(value / reference! - 1)).toBeLessThan(AGREEMENT);
      });
    }
  }

  it("should quote every published currency's current rate as local per USD at its own rate date", () => {
    // Compared with the Fed month of the rate's OWN date (fixed), never the latest month:
    // the latest month moves weekly and a large market move could flip the comparison
    // with no defect (the 5.478 rule).
    const checked: string[] = [];
    for (const [currency, r] of Object.entries(rates)) {
      if (!r.rateDate) continue;
      const reference = fedMonthEnd(currency, r.rateDate);
      if (reference === null) continue;
      checked.push(currency);
      expect(inSameConvention(r.rateToUsd, reference), currency).toBe(true);
    }
    // the Fed currencies whose snapshot month the published series covers
    expect(checked.length, checked.join(',')).toBeGreaterThanOrEqual(8);
  });
});
