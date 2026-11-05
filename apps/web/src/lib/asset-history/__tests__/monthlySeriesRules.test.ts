/**
 * MONTHLY-RULES-1 — rules every committed monthly series must keep, whatever
 * month it is (2026-11-05, register 5.633 / 5.756 / 5.757 / 5.479).
 *
 * The Money Tools replay these rows directly, so a row that breaks one of these
 * rules is a wrong published result. None of the assertions is a band on a value
 * a month-roll moves (5.478): each holds for any correct series.
 *
 * Prices (`monthlyPrices.json`):
 *   1. Months are unique, in order and consecutive.
 *   2. Every bar is positive and consistent: low <= open <= high, and the price
 *      close lies inside low/high.
 *   3. Every total-return row carries its price (`closePriceOnly`), and the
 *      adjustment factor close / closePriceOnly never FALLS from one month to the
 *      next. A dividend lowers the factor of the months BEFORE it and leaves later
 *      ones alone, so under an adjusted close the factor can only rise going
 *      forward. A fall means rows were appended on a newer adjusted-close basis
 *      than the rows before them, which loses the dividends paid in between
 *      (5.633: the file broke this at 2026-05 for SPY, QQQ and URTH and at 2026-07
 *      and 2026-09 for TLT before the 2026-11-05 correction).
 *
 *      ⚑ What rule 3 CANNOT see: a dividend simply missing from the source. Every
 *      later row is then scaled by the same amount, the factor stays flat, and
 *      the file is consistent but wrong. So is a dividend booked in the wrong
 *      month. Only the distributions themselves can show that: the market data
 *      store (DATA-STORE-1), once the tools read it (5.760).
 *
 * Exchange rates (`monthlyFx.json`):
 *   4. Months are unique, in order and consecutive; both directions are positive
 *      and are each other's inverse to within their 6-decimal rounding.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { SERIES_SHAPES } from '../../../../scripts/market-refresh/tools-monthlies.mjs';

type Row = {
  ym: string;
  open: number;
  high: number;
  low: number;
  close: number;
  closePriceOnly?: number;
};
type FxRow = { ym: string; closeUsdPerLocal: number; closeLocalPerUsd: number };

// Literal paths on purpose: releaseGateBoundary.test.ts finds the tests that
// read pipeline-written data by these file names.
const prices = JSON.parse(
  readFileSync(join(__dirname, '../../market-data/data/monthlyPrices.json'), 'utf8')
) as Record<string, { basis: string; months: Row[] }>;
const fx = JSON.parse(
  readFileSync(join(__dirname, '../../market-data/data/monthlyFx.json'), 'utf8')
) as Record<string, { months: FxRow[] }>;

const nextYm = (ym: string) => {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
};

/** Months that do not follow the row before them. */
const gapsIn = (months: { ym: string }[]) =>
  months
    .slice(1)
    .filter((r, i) => r.ym !== nextYm(months[i].ym))
    .map((r) => r.ym.slice(0, 7));

/**
 * Months where the adjustment factor falls by more than rounding can explain.
 * `prec` is the number of decimals the writer rounds `close` and
 * `closePriceOnly` to (`SERIES_SHAPES` in tools-monthlies.mjs, the one list that
 * shapes these rows); stored values with more decimals are rounded less, so half
 * a unit there bounds each value's rounding error.
 */
function factorFalls(months: Row[], prec: number): string[] {
  const h = 0.5 * 10 ** -prec;
  // The most rounding can move one month's factor close / closePriceOnly.
  const err = (close: number, price: number) => (close / price) * (h / close + h / price);
  const falls: string[] = [];
  for (let i = 1; i < months.length; i++) {
    const a = months[i - 1];
    const b = months[i];
    if (a.closePriceOnly == null || b.closePriceOnly == null) continue; // rule 3's other half
    const fa = a.close / a.closePriceOnly;
    const fb = b.close / b.closePriceOnly;
    const slack = err(a.close, a.closePriceOnly) + err(b.close, b.closePriceOnly);
    if (fb < fa - slack) falls.push(b.ym.slice(0, 7));
  }
  return falls;
}

const precisionOf = (code: string): number => {
  const shape = (SERIES_SHAPES as Record<string, { prec: number }>)[code];
  if (!shape) throw new Error(`${code}: no shape in tools-monthlies SERIES_SHAPES`);
  return shape.prec;
};

const SERIES = Object.entries(prices);
const TOTAL_RETURN = SERIES.filter(([, s]) => s.basis === 'total_return');
const FX = Object.entries(fx).filter(([, s]) => s.months.length > 0);

describe('MONTHLY-RULES-1: committed monthly price series keep their rules', () => {
  it('should cover every total-return fund when the file is read', () => {
    expect(TOTAL_RETURN.map(([code]) => code).sort()).toEqual(
      ['MSCI_WORLD', 'QQQ', 'SP500', 'TLT'].sort()
    );
  });

  it.each(SERIES)(
    'should hold unique, ordered, consecutive months when the series is %s',
    (_, s) => {
      expect(gapsIn(s.months)).toEqual([]);
    }
  );

  it.each(SERIES)('should keep every bar positive and consistent when the series is %s', (_, s) => {
    const broken = s.months
      .filter((r) => {
        const price = r.closePriceOnly ?? r.close;
        return !(
          r.low > 0 &&
          r.close > 0 &&
          r.low <= r.open &&
          r.open <= r.high &&
          r.low <= price &&
          price <= r.high
        );
      })
      .map((r) => r.ym.slice(0, 7));
    expect(broken).toEqual([]);
  });

  it.each(TOTAL_RETURN)('should carry the price on every row when the fund is %s', (_, s) => {
    expect(s.months.filter((r) => r.closePriceOnly == null).map((r) => r.ym)).toEqual([]);
  });

  it.each(TOTAL_RETURN)(
    'should never re-base later rows without the earlier ones when the fund is %s',
    (code, s) => {
      expect(factorFalls(s.months, precisionOf(code))).toEqual([]);
    }
  );

  it('should report a fall when a month is appended on a newer adjusted basis', () => {
    // The factor may rise (2026-03: a later dividend re-based the months before
    // it) but a fall (2026-04) means the rows before it were never re-based:
    // the 5.633 mechanism, in miniature.
    const months: Row[] = [
      { ym: '2026-01-01', open: 100, high: 101, low: 99, close: 99, closePriceOnly: 100 },
      { ym: '2026-02-01', open: 100, high: 101, low: 99, close: 99, closePriceOnly: 100 },
      { ym: '2026-03-01', open: 100, high: 101, low: 99, close: 99.5, closePriceOnly: 100 },
      { ym: '2026-04-01', open: 100, high: 101, low: 99, close: 99.2, closePriceOnly: 100 },
    ];
    expect(factorFalls(months, 4)).toEqual(['2026-04']);
    expect(factorFalls(months.slice(0, 3), 4)).toEqual([]);
  });

  it('should NOT see a dividend that is missing from the source (the stated limit)', () => {
    // March's dividend never reached the source: March and every later row are
    // lower by the same factor, so close / closePriceOnly stays flat. Consistent,
    // and wrong; the store's distributions are what catches this (5.760).
    const months: Row[] = [
      { ym: '2026-02-01', open: 100, high: 101, low: 99, close: 100, closePriceOnly: 100 },
      { ym: '2026-03-01', open: 100, high: 101, low: 99, close: 100, closePriceOnly: 100 },
    ];
    expect(factorFalls(months, 4)).toEqual([]);
  });
});

describe('MONTHLY-RULES-1: committed monthly exchange rates keep their rules', () => {
  it('should find every currency the Money Tools convert through', () => {
    expect(FX.map(([code]) => code)).toEqual(
      expect.arrayContaining(['EUR', 'BRL', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'MXN'])
    );
  });

  it.each(FX)('should hold unique, ordered, consecutive months when the currency is %s', (_, s) => {
    expect(gapsIn(s.months)).toEqual([]);
  });

  it.each(FX)(
    'should store each month as two positive rates that invert when the currency is %s',
    (_, s) => {
      // Each value is rounded to 6 decimals and one is computed from the other
      // (which one depends on the source's quote direction); 1/x moves an error
      // e in x by e/x², so one of the two directions holds within this bound.
      const h = 0.5e-6;
      const inverts = (x: number, y: number) => Math.abs(x - 1 / y) <= h + h / (y * y) + 1e-12;
      const broken = s.months
        .filter((r) => {
          const a = r.closeUsdPerLocal;
          const b = r.closeLocalPerUsd;
          return !(a > 0 && b > 0 && (inverts(a, b) || inverts(b, a)));
        })
        .map((r) => r.ym.slice(0, 7));
      expect(broken).toEqual([]);
    }
  );
});
