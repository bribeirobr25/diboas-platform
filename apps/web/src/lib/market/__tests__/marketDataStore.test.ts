/**
 * The Market data store (apps/web/scripts/market-data), its RULES: total
 * return computed from closes + distributions, the engine's strict-Friday
 * weekly rule, cross-source checks, distribution reconciliation, and
 * plan-then-write append-only storage. Fixtures only; no network, no committed
 * data (so this is not a weekly release gate). The collector, the exceptions
 * and the commit guard are in marketDataCollect.test.ts.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { monthlyBars, weeklyCloses } from '../../../../scripts/market-data/derive.mjs';
import { compareCloses, reconcileDistributions } from '../../../../scripts/market-data/checks.mjs';
import { createStore, readCsv } from '../../../../scripts/market-data/store.mjs';
import { SERIES as SERIES_TYPED } from '../../../../scripts/market-data/catalogue.mjs';
import { strictFridayCloses } from '../../../../scripts/market-refresh/lib/regime-engine.mjs';

// The catalogue is untyped data; read it as such in assertions.
const SERIES = SERIES_TYPED as any[];
const tmp: string[] = [];
const freshDir = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mds-'));
  tmp.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});
type Ym = { ym: string; tr_close: number; close: number; distributions: number };

describe('total return (5.633): computed from closes and ex-dates, never from a moving adjusted close', () => {
  const daily = [
    { date: '2026-01-02', close: 100 },
    { date: '2026-01-30', close: 100 },
    { date: '2026-02-27', close: 102 },
    { date: '2026-03-02', close: 99 }, // ex-date: price drops by the distribution
    { date: '2026-03-31', close: 99 },
  ];
  const dist = [{ date: '2026-03-02', amount: 3 }];

  it('should reinvest a distribution at the close before its ex-date', () => {
    const mar = monthlyBars(daily, dist, '2026-11-05').find((x: Ym) => x.ym === '2026-03');
    // 102 → (99 + 3) / 102 = flat in total return, -2.94% in price
    expect(mar.close).toBe(99);
    expect(mar.tr_close).toBeCloseTo(102, 10);
    expect(mar.distributions).toBe(3);
  });

  it('should keep every stored month unchanged when a later distribution arrives', () => {
    const before = monthlyBars(daily, dist, '2026-11-05');
    const later = [...daily, { date: '2026-04-01', close: 97 }, { date: '2026-04-30', close: 98 }];
    const after = monthlyBars(later, [...dist, { date: '2026-04-01', amount: 2 }], '2026-11-05');
    for (const m of before) expect(after.find((x: Ym) => x.ym === m.ym).tr_close).toBe(m.tr_close);
  });

  it('should refuse a distribution whose ex-date has no trading day', () => {
    expect(() => monthlyBars(daily, [{ date: '2026-03-01', amount: 1 }], '2026-11-05')).toThrow(
      /no trading day/
    );
  });

  it('should leave out the current month and a first month the series entered late (BTC 2014-09-17)', () => {
    expect(monthlyBars(daily, dist, '2026-03-15').map((x: Ym) => x.ym)).toEqual([
      '2026-01',
      '2026-02',
    ]);
    const late = [
      { date: '2014-09-17', close: 1 },
      { date: '2014-09-30', close: 2 },
      { date: '2014-10-01', close: 3 },
      { date: '2014-10-31', close: 4 },
    ];
    expect(monthlyBars(late, [], '2026-11-05').map((x: Ym) => x.ym)).toEqual(['2014-10']);
  });

  it('should not count a distribution on the first stored day (the index starts after it)', () => {
    const m = monthlyBars(daily, [{ date: '2026-01-02', amount: 5 }], '2026-11-05');
    expect(m[0].distributions).toBe(0);
    expect(m[0].tr_close).toBe(100);
  });
});

describe('monthly bars: open is the first day’s, high and low span the month', () => {
  it('should take the first open, the highest high, the lowest low and the last close', () => {
    const rows = [
      { date: '2026-10-01', open: 10, high: 12, low: 9, close: 11 },
      { date: '2026-10-15', open: 11, high: 15, low: 10, close: 14 },
      { date: '2026-10-30', open: 14, high: 14.5, low: 7, close: 8 },
    ];
    expect(monthlyBars(rows, [], '2026-11-05')[0]).toMatchObject({
      ym: '2026-10',
      open: 10,
      high: 15,
      low: 7,
      close: 8,
      last_day: '2026-10-30',
    });
  });
  it('should build the range from closes for a close-only source (B3, Coin Metrics)', () => {
    const rows = [
      { date: '2026-10-01', close: 11 },
      { date: '2026-10-15', close: 14 },
      { date: '2026-10-30', close: 8 },
    ];
    expect(monthlyBars(rows, [], '2026-11-05')[0]).toMatchObject({
      open: 11,
      high: 14,
      low: 8,
      close: 8,
    });
  });
});

describe('weekly closes: the engine’s own strict-Friday rule, never a copy', () => {
  const daily = [
    { date: '2026-04-02', close: 10 }, // Thu; Good Friday 04-03 closed
    { date: '2026-04-09', close: 11 },
    { date: '2026-04-10', close: 12 }, // Fri
    { date: '2026-04-15', close: 13 }, // Wed: data ends before that week's Friday
  ];

  it('should equal strictFridayCloses on the same rows, including the Thursday fallback', () => {
    const today = '2026-04-25';
    const engine = strictFridayCloses(
      daily.map((r) => [new Date(`${r.date}T00:00:00Z`), r.close]),
      new Date(`${today}T00:00:00Z`)
    ).map(([d, v]: [Date, number]) => ({ week_ending: d.toISOString().slice(0, 10), close: v }));
    expect(weeklyCloses(daily, today)).toEqual(engine);
    expect(engine).toEqual([
      { week_ending: '2026-04-03', close: 10 },
      { week_ending: '2026-04-10', close: 12 },
    ]); // no row for 04-17: the data stopped on the Wednesday
  });

  it('should not emit a week whose Friday is today', () => {
    expect(
      weeklyCloses(daily, '2026-04-10').map((w: { week_ending: string }) => w.week_ending)
    ).toEqual(['2026-04-03']);
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

  it('should pass by range only when the STORED value lies inside the CHECK’s traded range', () => {
    const noon = [
      { date: '2026-10-29', close: 5.4 }, // inside 5.35..5.52
      { date: '2026-10-30', close: 5.4 }, // outside 5.45..5.52
    ];
    const close = [
      { date: '2026-10-29', close: 5.5, low: 5.35, high: 5.52 },
      { date: '2026-10-30', close: 5.5, low: 5.45, high: 5.52 },
    ];
    const r = compareCloses(noon, close, 0.015, { rangeSlack: 0.003 });
    expect(r.passedByRange).toBe(1);
    expect(r.outliers.map((o: { date: string }) => o.date)).toEqual(['2026-10-30']);
    expect(compareCloses(noon, close, 0.015).outliers).toHaveLength(2);
  });

  it('should never let the primary’s own range excuse its close (a wrong gold close against the fix)', () => {
    const spot = [{ date: '2026-10-30', close: 4400, low: 2000, high: 6000 }];
    const fix = [{ date: '2026-10-30', close: 3950 }];
    expect(compareCloses(spot, fix, 0.035, { rangeSlack: 0.003 }).outliers).toHaveLength(1);
  });

  it('should report a pair shifted by one day as misaligned', () => {
    const days = Array.from({ length: 20 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    const px = days.map((date, i) => ({ date, close: 100 + 10 * Math.sin(i) }));
    const shifted = px.map((r, i) => ({
      date: days[i + 1] ?? '2026-10-21',
      close: r.close * 1.001,
    }));
    expect(
      compareCloses(
        px,
        px.map((r) => ({ ...r, close: r.close * 1.001 })),
        0.05
      ).alignment?.misaligned
    ).toBe(false);
    expect(compareCloses(px, shifted, 0.2).alignment?.misaligned).toBe(true);
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
      [{ name: 'stockanalysis', from: '2021-12-01', events: [] }]
    );
    expect(r.notes[0]).toEqual({ date: '2015-03-20', kind: 'single_source', sources: ['yahoo'] });
  });

  it('should block one distribution dated a day apart by two sources, never count it twice', () => {
    const r = reconcileDistributions(
      [{ date: '2026-09-21', amount: 0.75 }],
      [{ name: 'nasdaq', events: [{ date: '2026-09-22', amount: 0.75 }] }]
    );
    expect(r.merged).toEqual([]);
    expect(r.outliers.map((o: { kind: string }) => o.kind)).toEqual([
      'date_disagrees',
      'date_disagrees',
    ]);
  });

  it('should block an ex-date that is not a trading day of the primary', () => {
    const r = reconcileDistributions(
      [],
      [{ name: 'stockanalysis', events: [{ date: '2026-10-17', amount: 1 }] }],
      {
        tradingDays: new Set(['2026-10-16', '2026-10-19']),
      }
    );
    expect(r.outliers.map((o: { kind: string }) => o.kind)).toEqual(['not_a_trading_day']);
  });
});

describe('the store plans before it writes, and never rewrites a stored day', () => {
  const runAt = '2026-11-04T00:00:00Z';
  const seed = (store: ReturnType<typeof createStore>, rows: object[]) =>
    store.writeDaily('x', rows);

  it('should plan new days without writing, and block on a changed stored value', () => {
    const store = createStore(freshDir());
    seed(store, [{ date: '2026-10-29', open: '', high: '', low: '', close: 1, source: 's' }]);
    const plan = store.planDaily(
      'x',
      [
        { date: '2026-10-29', close: 2 },
        { date: '2026-10-30', close: 3 },
      ],
      { source: 's', runAt }
    );
    expect(plan.blocked).toBe(true);
    expect(plan.added).toBe(1);
    expect(plan.all.find((r: { date: string }) => r.date === '2026-10-29').close).toBe('1'); // planned value unchanged too
    expect(readCsv(path.join(store.root, 'daily', 'x.csv')).map((d) => d.close)).toEqual(['1']); // nothing written
  });

  it('should keep the stored value, unblocked, when a reviewed exception decided "keep"', () => {
    const store = createStore(freshDir());
    seed(store, [{ date: '2026-10-29', open: '', high: '', low: '', close: 1, source: 's' }]);
    const plan = store.planDaily('x', [{ date: '2026-10-29', close: 2 }], {
      source: 's',
      runAt,
      keep: new Set(['2026-10-29']),
    });
    expect(plan.blocked).toBe(false);
    expect(plan.all[0].close).toBe('1');
  });

  it('should accept a revision only for a series the publisher revises (M2)', () => {
    const store = createStore(freshDir());
    seed(store, [{ date: '2026-08-01', open: '', high: '', low: '', close: 100, source: 'fred' }]);
    const plan = store.planDaily('x', [{ date: '2026-08-01', close: 101 }], {
      source: 'fred',
      revisable: true,
      runAt,
    });
    expect(plan.blocked).toBe(false);
    expect(plan.all[0].close).toBe(101);
    expect(plan.revisions[0]).toMatchObject({ stored: 100, fetched: 101, accepted: true });
  });

  it('should block, and plan no change, when a stored distribution amount changes', () => {
    const store = createStore(freshDir());
    store.writeEvents('x', [{ date: '2026-09-21', amount: 0.75143, sources: 'yahoo+nasdaq' }]);
    const plan = store.planEvents(
      'x',
      [
        { date: '2026-09-21', amount: 0.76, sources: ['yahoo'] },
        { date: '2026-12-21', amount: 0.8, sources: ['yahoo'] },
      ],
      { runAt }
    );
    expect(plan.blocked).toBe(true);
    expect(plan.all.find((e: { date: string }) => e.date === '2026-09-21').amount).toBe('0.75143');
  });

  it('should log a revision once, however many runs see it', () => {
    const store = createStore(freshDir());
    const rev = {
      series: 'x',
      date: '2026-10-29',
      stored: 1,
      fetched: 2,
      source: 's',
      detected_at: runAt,
      accepted: false,
    };
    expect(store.logRevisions([rev])).toBe(1);
    expect(store.logRevisions([{ ...rev, detected_at: '2026-11-11T00:00:00Z' }])).toBe(0);
    expect(
      fs.readFileSync(path.join(store.root, 'revisions.jsonl'), 'utf8').trim().split('\n')
    ).toHaveLength(1);
  });

  it('should treat an existing but empty series file as damage, never as "nothing stored"', () => {
    const store = createStore(freshDir());
    fs.mkdirSync(path.join(store.root, 'daily'), { recursive: true });
    fs.writeFileSync(path.join(store.root, 'daily', 'x.csv'), '');
    expect(() => store.readDaily('x')).toThrow(/exists but is empty/);
  });

  it('should keep every response body byte for byte, with its hash', () => {
    const store = createStore(freshDir());
    const bytes = Buffer.from([0xef, 0xbb, 0xbf, 0x61, 0x2c, 0xff, 0x0a]); // BOM + invalid UTF-8 survive
    const row = store.saveRaw({
      provider: 'p',
      series: 'x',
      url: 'https://e/x',
      status: 200,
      bytes,
      fetchedAt: '2026-11-04T01:02:03.000Z',
      ext: 'csv',
    });
    expect(row.sha256).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));
    expect(row.bytes).toBe(7);
    expect(
      zlib.gunzipSync(fs.readFileSync(path.join(store.root, row.saved_as))).equals(bytes)
    ).toBe(true);
  });

  it('should name each run’s check report by its UTC start, so reports sort in run order', () => {
    const store = createStore(freshDir());
    const a = store.writeChecks('2026-11-04T23:11:17.670Z', {});
    const b = store.writeChecks('2026-11-04T23:59:01.002Z', {});
    expect(a).toBe(path.join('checks', '20261104T231117Z.json'));
    expect([b, a].sort()).toEqual([a, b]);
  });
});

describe('the catalogue', () => {
  it('should give every series a unique id, a primary source and at least ten years, unless the source starts later and says why', () => {
    const ids = SERIES.map((s: { id: string }) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SERIES as {
      id: string;
      since: string;
      primary: { url: unknown };
      historyLimit?: string;
    }[]) {
      expect(s.primary?.url, s.id).toBeTypeOf('function');
      if (s.since > '2016-11-04')
        expect(s.historyLimit ?? '', `${s.id} since ${s.since} states no historyLimit`).toMatch(
          /.{30,}/
        );
      else expect(s.historyLimit, `${s.id} has ten years; historyLimit not needed`).toBeUndefined();
    }
  });

  it('should store spot gold, never the GLD fund or futures (founder 2026-11-04)', () => {
    const gold = SERIES.find((s: { id: string }) => s.id === 'gold_spot');
    expect(gold?.primary.url('2026-01-01', '2026-01-31')).toContain('/bars/XAU%3D/');
    const urls = SERIES.flatMap(
      (s: {
        primary: { url: (a: string, b: string) => string };
        checks: { source: { url: (a: string, b: string) => string } }[];
      }) => [
        s.primary.url('2026-01-01', '2026-01-31'),
        ...s.checks.map((c) => String(c.source.url('2026-01-01', '2026-01-31'))),
      ]
    );
    expect(urls.filter((u: string) => /\/GLD[?/]|GC%3DF|GC=F/.test(u))).toEqual([]);
  });

  it('should never use Yahoo for Bitcoin (rejected by review: 1-3% off two exchanges on 104 days)', () => {
    const btc = SERIES.find((s: { id: string }) => s.id === 'btc');
    expect(btc?.primary.provider).toBe('coinmetrics');
    expect(btc?.checks.map((c: { source: { provider: string } }) => c.source.provider)).toEqual([
      'coinbase',
      'bitstamp',
    ]);
  });
});
