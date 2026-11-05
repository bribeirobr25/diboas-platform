/**
 * Rules every committed monthly price series must keep, whatever month it is
 * (2026-11-05, register 5.633 / 5.756 / 5.757).
 *
 * The Asset History tool replays these rows directly, so a row that breaks one of
 * these rules is a wrong published result. None of the assertions is a band on a
 * value a month-roll moves (5.478): each is a rule that holds for any correct
 * series, so the weekly refresh can only fail it by writing a wrong row.
 *
 *   1. Months are unique, in order and consecutive.
 *   2. Every bar is internally consistent: low <= open, price close <= high.
 *   3. In a total-return series (`close` adjusted, `closePriceOnly` the price),
 *      the adjustment factor close / closePriceOnly never FALLS from one month to
 *      the next. A dividend paid in a month lowers the factor of every EARLIER
 *      month and leaves later ones alone, so the factor can only rise going
 *      forward. A fall means a dividend was lost between the two months: rows
 *      appended later on a newer adjusted-close basis than the rows before them
 *      (5.633; the file broke this at 2026-05 for SPY, QQQ and URTH and at 2026-07
 *      for TLT before the 2026-11-05 correction).
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
type Series = Record<string, { basis: string; months: Row[] }>;

const raw = JSON.parse(
  readFileSync(join(__dirname, '../../market-data/data/monthlyPrices.json'), 'utf8')
) as Series;

const nextYm = (ym: string) => {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
};

/**
 * Months where the adjustment factor falls by more than rounding can explain.
 * `prec` is the number of decimals the writer rounds `close` and
 * `closePriceOnly` to (`SERIES_SHAPES` in tools-monthlies.mjs, the one list that
 * shapes these rows), so half a unit there bounds each value's rounding error.
 */
function factorFalls(months: Row[], prec: number): string[] {
  const h = 0.5 * 10 ** -prec;
  // The most rounding can move one month's factor close / closePriceOnly.
  const err = (close: number, price: number) => (close / price) * (h / close + h / price);
  const falls: string[] = [];
  for (let i = 1; i < months.length; i++) {
    const a = months[i - 1];
    const b = months[i];
    if (a.closePriceOnly == null || b.closePriceOnly == null) continue;
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

const SERIES = Object.entries(raw);
const TOTAL_RETURN = SERIES.filter(([, s]) => s.basis === 'total_return');

describe('committed monthly price series keep their rules (5.633 / 5.756 / 5.757)', () => {
  it('should cover every total-return fund when the file is read', () => {
    expect(TOTAL_RETURN.map(([code]) => code).sort()).toEqual(
      ['MSCI_WORLD', 'QQQ', 'SP500', 'TLT'].sort()
    );
  });

  it.each(SERIES)(
    'should hold unique, ordered, consecutive months when the series is %s',
    (_, s) => {
      const gaps = s.months
        .slice(1)
        .filter((r, i) => r.ym !== nextYm(s.months[i].ym))
        .map((r) => r.ym.slice(0, 7));
      expect(gaps).toEqual([]);
    }
  );

  it.each(SERIES)('should keep every bar internally consistent when the series is %s', (_, s) => {
    const broken = s.months
      .filter((r) => {
        const price = r.closePriceOnly ?? r.close;
        return !(r.low <= r.open && r.open <= r.high && r.low <= price && price <= r.high);
      })
      .map((r) => r.ym.slice(0, 7));
    expect(broken).toEqual([]);
  });

  it.each(TOTAL_RETURN)(
    'should never lose a dividend between two months when the fund is %s',
    (code, s) => {
      expect(factorFalls(s.months, precisionOf(code))).toEqual([]);
    }
  );

  it('should report a lost dividend when a month is appended on a newer adjusted basis', () => {
    // The factor may rise (2026-03: a later dividend re-based the months before
    // it) but a fall (2026-04) means a dividend went missing between two rows:
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
});
