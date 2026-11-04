/**
 * The Market data store (apps/web/scripts/market-data): total return computed
 * from closes + distributions, the strict-Friday weekly rule, the dividend
 * reconciliation across sources, and append-only storage. Fixtures only; no
 * network, no committed data (so this is not a weekly release gate).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { fridayOf, monthlyBars, weeklyCloses } from '../../../../scripts/market-data/derive.mjs';
import { compareCloses, reconcileDistributions } from '../../../../scripts/market-data/checks.mjs';
import { createStore, readCsv } from '../../../../scripts/market-data/store.mjs';
import { parseCnbcBars, parseYahooChart } from '../../../../scripts/market-data/parsers.mjs';
import { SERIES } from '../../../../scripts/market-data/catalogue.mjs';

const tmp: string[] = [];
const freshDir = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mds-'));
  tmp.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

describe('total return (5.633): computed from closes and ex-dates, never from a moving adjusted close', () => {
  const daily = [
    { date: '2026-01-30', close: 100 },
    { date: '2026-02-02', close: 100 },
    { date: '2026-02-27', close: 102 },
    { date: '2026-03-02', close: 99 }, // ex-date: price drops by the distribution
    { date: '2026-03-31', close: 99 },
  ];
  const dist = [{ date: '2026-03-02', amount: 3 }];

  it('should reinvest a distribution at the close before its ex-date', () => {
    const m = monthlyBars(daily, dist, '2026-11-05');
    const mar = m.find((x: { ym: string }) => x.ym === '2026-03');
    // 102 → (99 + 3) / 102 = flat in total return, -2.94% in price
    expect(mar.close).toBe(99);
    expect(mar.tr_close).toBeCloseTo(102, 10);
    expect(mar.distributions).toBe(3);
  });

  it('should keep every stored month unchanged when a later distribution arrives', () => {
    const before = monthlyBars(daily, dist, '2026-11-05');
    const later = [...daily, { date: '2026-04-01', close: 97 }, { date: '2026-04-30', close: 98 }];
    const after = monthlyBars(later, [...dist, { date: '2026-04-01', amount: 2 }], '2026-11-05');
    for (const m of before)
      expect(after.find((x: { ym: string }) => x.ym === m.ym).tr_close).toBe(m.tr_close);
  });

  it('should refuse a distribution whose ex-date has no trading day', () => {
    expect(() => monthlyBars(daily, [{ date: '2026-03-01', amount: 1 }], '2026-11-05')).toThrow(
      /no trading day/
    );
  });

  it('should leave out the current, incomplete month', () => {
    const m = monthlyBars(daily, dist, '2026-03-15');
    expect(m.map((x: { ym: string }) => x.ym)).toEqual(['2026-01', '2026-02']);
  });
});

describe('weekly closes: the strict-Friday rule the score uses', () => {
  it('should map every weekday and the weekend to the Friday of its week', () => {
    expect(fridayOf('2026-10-26')).toBe('2026-10-30'); // Monday
    expect(fridayOf('2026-10-30')).toBe('2026-10-30');
    expect(fridayOf('2026-10-31')).toBe('2026-10-30'); // Saturday
    expect(fridayOf('2026-11-01')).toBe('2026-10-30'); // Sunday
  });

  it('should use Thursday when Friday was a holiday, and skip a week whose Friday is not over', () => {
    const daily = [
      { date: '2026-04-02', close: 10 }, // Thu; Good Friday 04-03 closed
      { date: '2026-04-09', close: 11 },
      { date: '2026-04-10', close: 12 }, // Fri
      { date: '2026-04-16', close: 13 }, // Thu of a week whose Friday is "today"
    ];
    expect(weeklyCloses(daily, '2026-04-17')).toEqual([
      { week_ending: '2026-04-03', date: '2026-04-02', close: 10 },
      { week_ending: '2026-04-10', date: '2026-04-10', close: 12 },
    ]);
  });

  it('should never let a weekend row stand in for a Friday close', () => {
    const daily = [
      { date: '2026-10-30', close: 1 },
      { date: '2026-10-31', close: 2 },
    ];
    expect(weeklyCloses(daily, '2026-11-02')).toEqual([
      { week_ending: '2026-10-30', date: '2026-10-30', close: 1 },
    ]);
  });
});

describe('distributions reconciled across sources', () => {
  it('should take the more precise amount when sources agree to rounding', () => {
    const r = reconcileDistributions(
      [{ date: '2026-09-21', amount: 0.751 }],
      [{ name: 'nasdaq', events: [{ date: '2026-09-21', amount: 0.75143 }] }]
    );
    expect(r.merged).toEqual([
      { date: '2026-09-21', amount: 0.75143, sources: ['yahoo', 'nasdaq'] },
    ]);
    expect(r.outliers).toEqual([]);
  });

  it('should store a distribution the primary omitted and say so (TLT 2026-10-01)', () => {
    const r = reconcileDistributions(
      [],
      [{ name: 'ishares', events: [{ date: '2026-10-01', amount: 0.311581 }] }]
    );
    expect(r.merged).toEqual([{ date: '2026-10-01', amount: 0.311581, sources: ['ishares'] }]);
    expect(r.notes).toEqual([
      { date: '2026-10-01', kind: 'missing_in_primary', sources: ['ishares'] },
    ]);
  });

  it('should block on a disagreeing amount and on a primary-only date inside a check’s coverage', () => {
    const r = reconcileDistributions(
      [
        { date: '2026-03-20', amount: 1.797 },
        { date: '2026-06-18', amount: 1.904 },
      ],
      [{ name: 'stockanalysis', from: '2021-12-01', events: [{ date: '2026-03-20', amount: 1.9 }] }]
    );
    expect(r.outliers.map((o: { kind: string }) => o.kind)).toEqual([
      'amount_disagrees',
      'missing_in_check',
    ]);
    expect(r.merged).toEqual([]);
  });

  it('should keep a primary-only date before every check’s coverage as single-source', () => {
    const r = reconcileDistributions(
      [{ date: '2015-03-20', amount: 1.03 }],
      [
        {
          name: 'stockanalysis',
          from: '2021-12-01',
          events: [{ date: '2026-03-20', amount: 1.797 }],
        },
      ]
    );
    expect(r.notes[0]).toEqual({ date: '2015-03-20', kind: 'single_source', sources: ['yahoo'] });
  });
});

describe('closes checked against a second source', () => {
  it('should report the days beyond the tolerance and no others', () => {
    const p = [
      { date: '2026-10-29', close: 100 },
      { date: '2026-10-30', close: 100 },
    ];
    const c = [
      { date: '2026-10-29', close: 100.4 },
      { date: '2026-10-30', close: 101 },
    ];
    const r = compareCloses(p, c, 0.005);
    expect(r.common).toBe(2);
    expect(r.outliers).toEqual([{ date: '2026-10-30', primary: 100, check: 101, diff: 0.01 }]);
  });
});

describe('the store is append-only', () => {
  it('should add new days, never rewrite a stored one, and block on a changed value', () => {
    const store = createStore(freshDir());
    const runAt = '2026-11-04T00:00:00Z';
    expect(
      store.mergeDaily('x', [{ date: '2026-10-29', close: 1 }], { source: 's', runAt }).added
    ).toBe(1);
    const r = store.mergeDaily(
      'x',
      [
        { date: '2026-10-29', close: 2 },
        { date: '2026-10-30', close: 3 },
      ],
      { source: 's', runAt }
    );
    expect(r.blocked).toBe(true);
    expect(readCsv(path.join(store.root, 'daily', 'x.csv')).map((d) => d.close)).toEqual(['1']); // nothing written
    const log = fs
      .readFileSync(path.join(store.root, 'revisions.jsonl'), 'utf8')
      .trim()
      .split('\n');
    expect(JSON.parse(log[0])).toMatchObject({
      series: 'x',
      date: '2026-10-29',
      stored: 1,
      fetched: 2,
      accepted: false,
    });
  });

  it('should accept AND log a revision for a series the publisher revises (M2)', () => {
    const store = createStore(freshDir());
    const runAt = '2026-11-04T00:00:00Z';
    store.mergeDaily('m2', [{ date: '2026-08-01', close: 100 }], {
      source: 'fred',
      revisable: true,
      runAt,
    });
    const r = store.mergeDaily('m2', [{ date: '2026-08-01', close: 101 }], {
      source: 'fred',
      revisable: true,
      runAt,
    });
    expect(r.blocked).toBe(false);
    expect(store.readDaily('m2')[0].close).toBe('101');
  });

  it('should keep every response body, byte-exact, with its hash', () => {
    const store = createStore(freshDir());
    const row = store.saveRaw({
      provider: 'p',
      series: 'x',
      url: 'https://e/x',
      status: 200,
      body: 'a,b\n1,2\n',
      fetchedAt: '2026-11-04T01:02:03.000Z',
      ext: 'csv',
    });
    expect(row.sha256).toBe(crypto.createHash('sha256').update('a,b\n1,2\n').digest('hex'));
    expect(row.bytes).toBe(8);
    const saved = zlib
      .gunzipSync(fs.readFileSync(path.join(store.root, row.saved_as)))
      .toString('utf8');
    expect(saved).toBe('a,b\n1,2\n');
  });
});

describe('parsers keep the market’s own trading day', () => {
  it('should date a Yahoo bar by the exchange offset, not by UTC', () => {
    // 2026-10-30 09:30 New York = 13:30 UTC; gmtoffset -14400
    const body = JSON.stringify({
      chart: {
        result: [
          {
            meta: { gmtoffset: -14400 },
            timestamp: [1793367000],
            indicators: { quote: [{ open: [1], high: [2], low: [0.5], close: [1.5] }] },
            events: { dividends: { a: { date: 1793367000, amount: 0.3 } } },
          },
        ],
      },
    });
    const r = parseYahooChart(body, 't');
    expect(r.rows[0].date).toBe('2026-10-30');
    expect(r.events).toEqual([{ date: '2026-10-30', amount: 0.3 }]);
  });

  it('should drop the flat weekend bars a 24-hour instrument carries', () => {
    const bar = (t: string, c: string) => ({ open: c, high: c, low: c, close: c, tradeTime: t });
    const body = JSON.stringify({
      barData: {
        priceBars: [
          bar('20261030000000', '1'),
          bar('20261031000000', '1'),
          bar('20261101000000', '1'),
          bar('20261102000000', '2'),
        ],
      },
    });
    expect(parseCnbcBars(body, 't').rows.map((r: { date: string }) => r.date)).toEqual([
      '2026-10-30',
      '2026-11-02',
    ]);
  });
});

describe('the catalogue', () => {
  it('should give every series a unique id, a primary source and at least ten years', () => {
    const ids = SERIES.map((s: { id: string }) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SERIES) {
      expect(s.primary?.url, s.id).toBeTypeOf('function');
      // btc starts with Yahoo's history (2014-09); btc_coinmetrics covers 2010-07 on
      expect(s.since <= '2016-11-04', `${s.id} since ${s.since}`).toBe(true);
    }
  });

  it('should store spot gold, never the GLD fund or futures (founder 2026-11-04)', () => {
    const gold = SERIES.find((s: { id: string }) => s.id === 'gold_spot');
    expect(gold?.primary.url('2026-01-01', '2026-01-31')).toContain('/bars/XAU%3D/');
    expect(
      SERIES.some((s: { primary: { url: (a: string, b: string) => string } }) =>
        /GLD|GC%3DF|GC=F/.test(s.primary.url('2026-01-01', '2026-01-31'))
      )
    ).toBe(false);
  });
});
