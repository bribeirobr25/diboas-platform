/**
 * The Market data collector (apps/web/scripts/market-data) end to end, with
 * every provider faked: what BLOCKS a series, that a blocked series writes
 * nothing, how a reviewed exception is bound to the one fault it resolves,
 * the fetch layer's retry/fallback/circuit breaker, the commit guard, the
 * parsers and the workflow's refusals. No network; no committed data.
 * Requirements: R-13 (every failure path runs in a test), R-14 (background
 * jobs fail closed), founder decisions 2026-11-04 (append-only store).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectSeries, main } from '../../../../scripts/market-data/collect.mjs';
import { createFetcher, HostDown } from '../../../../scripts/market-data/fetch-source.mjs';
import { createStore, readCsv } from '../../../../scripts/market-data/store.mjs';
import {
  distributionException,
  parseExceptions,
} from '../../../../scripts/market-data/exceptions.mjs';
import {
  evaluateStaged,
  parseNameStatus,
  parseNumstat,
} from '../../../../scripts/market-data/commit-guard.mjs';
import * as P from '../../../../scripts/market-data/parsers.mjs';

const tmp: string[] = [];
const freshDir = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mdc-'));
  tmp.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

// ---- fixtures: 20 October 2026 weekdays with moving closes ----
const DAYS = Array.from(
  { length: 31 },
  (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`
).filter((d) => ![0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay()));
const close = (i: number) => Math.round((100 + 5 * Math.sin(i / 2) + i * 0.3) * 100) / 100;
const TODAY = '2026-11-02';
const yahoo = (
  closes = DAYS.map((_, i) => close(i)),
  divs: { date: string; amount: number }[] = []
) =>
  JSON.stringify({
    chart: {
      result: [
        {
          meta: { gmtoffset: -14400 },
          timestamp: DAYS.map((d) => Date.parse(`${d}T13:30:00Z`) / 1000),
          indicators: {
            quote: [
              {
                open: closes,
                high: closes.map((c) => c + 1),
                low: closes.map((c) => c - 1),
                close: closes,
              },
            ],
          },
          events: {
            dividends: Object.fromEntries(
              divs.map((d, k) => [
                k,
                { date: Date.parse(`${d.date}T13:30:00Z`) / 1000, amount: d.amount },
              ])
            ),
          },
        },
      ],
    },
  });
const cnbc = (closes = DAYS.map((_, i) => close(i))) =>
  JSON.stringify({
    barData: {
      priceBars: DAYS.map((d, i) => ({
        tradeTime: `${d.replaceAll('-', '')}000000`,
        open: String(closes[i] - 0.5),
        high: String(closes[i] + 1),
        low: String(closes[i] - 1),
        close: String(closes[i]),
      })),
    },
  });
const nasdaqDiv = (rows: { date: string; amount: number }[]) =>
  JSON.stringify({
    data: {
      dividends: {
        rows: rows.map((r) => ({
          exOrEffDate: `${r.date.slice(5, 7)}/${r.date.slice(8)}/${r.date.slice(0, 4)}`,
          type: 'Cash',
          amount: `$${r.amount}`,
        })),
      },
    },
  });

type Routes = Record<string, string | (() => Response | Promise<Response>)>;
const fakeFetch =
  (routes: Routes, calls: string[] = []) =>
  async (url: string) => {
    calls.push(url);
    const host = new URL(url).host;
    const r = routes[host];
    if (r == null) throw new Error(`connect ECONNREFUSED ${host}`);
    return typeof r === 'function' ? r() : new Response(r, { status: 200 });
  };
const src = (provider: string, parser: string, host: string) => ({
  provider,
  parser,
  url: () => `https://${host}/x`,
});
const series = (over: object = {}) => ({
  id: 't',
  kind: 'fund',
  since: '2026-10-01',
  primary: src('yahoo', 'yahoo', 'p.test'),
  checks: [{ source: src('cnbc', 'cnbc', 'c.test'), tolerance: 0.005 }],
  dividendChecks: [{ source: src('nasdaq', 'nasdaqDividends', 'n.test') }],
  ...over,
});
const DIV = [{ date: '2026-10-15', amount: 0.5 }];
const run = async (
  s: object,
  routes: Routes,
  { store = createStore(freshDir()), exceptions = [] as object[] } = {}
) => {
  const fetcher = createFetcher({ store, retryBaseMs: 1, fetchImpl: fakeFetch(routes) });
  const out = await collectSeries(s, { store, fetcher, today: TODAY, backfill: false, exceptions });
  return { out, store };
};
const written = (store: ReturnType<typeof createStore>) =>
  fs.existsSync(path.join(store.root, 'daily', 't.csv'));

describe('collectSeries: a series is stored only when every check passes', () => {
  it('should store a fund whose closes and distributions agree with their checks', async () => {
    const { out, store } = await run(series(), {
      'p.test': yahoo(undefined, DIV),
      'c.test': cnbc(),
      'n.test': nasdaqDiv(DIV),
    });
    expect(out.blocked).toEqual([]);
    expect(readCsv(path.join(store.root, 'daily', 't.csv'))).toHaveLength(DAYS.length);
    expect(readCsv(path.join(store.root, 'events', 't.distributions.csv'))).toEqual([
      { date: '2026-10-15', amount: '0.5', sources: 'yahoo+nasdaq' },
    ]);
    expect(fs.existsSync(path.join(store.root, 'derived', 'monthly', 't.csv'))).toBe(true);
  });

  it('should BLOCK, and write nothing, when a check returns no rows (fail closed, R-14)', async () => {
    const { out, store } = await run(series(), {
      'p.test': yahoo(undefined, DIV),
      'c.test': JSON.stringify({ barData: { priceBars: [] } }),
      'n.test': nasdaqDiv(DIV),
    });
    expect(out.blocked.join()).toMatch(/shares only 0 of \d+ days/);
    expect(written(store)).toBe(false);
  });

  it('should BLOCK when a check source fails, after its retries', async () => {
    const { out, store } = await run(series(), {
      'p.test': yahoo(undefined, DIV),
      'c.test': () => new Response('down', { status: 503 }),
      'n.test': nasdaqDiv(DIV),
    });
    expect(out.blocked.join()).toMatch(/check cnbc failed: .*HTTP 503/);
    expect(written(store)).toBe(false);
  });

  it('should BLOCK when a distribution source returns no distributions at all', async () => {
    const { out, store } = await run(series(), {
      'p.test': yahoo(undefined, DIV),
      'c.test': cnbc(),
      'n.test': JSON.stringify({ data: { dividends: { rows: null } } }),
    });
    expect(out.blocked.join()).toMatch(/returned no distributions/);
    expect(written(store)).toBe(false);
  });

  it('should BLOCK a weekend ex-date and write neither days nor distributions', async () => {
    const weekend = [...DIV, { date: '2026-10-17', amount: 0.2 }];
    const { out, store } = await run(series(), {
      'p.test': yahoo(undefined, DIV),
      'c.test': cnbc(),
      'n.test': nasdaqDiv(weekend),
    });
    expect(out.blocked.join()).toMatch(/not_a_trading_day/);
    expect(written(store)).toBe(false);
    expect(fs.existsSync(path.join(store.root, 'events', 't.distributions.csv'))).toBe(false);
  });

  it('should BLOCK a check outlier, and unblock it only with an exception bound to that source AND value', async () => {
    const off = DAYS.map((_, i) => (i === 5 ? close(i) * 1.03 : close(i)));
    const routes = { 'p.test': yahoo(off, DIV), 'c.test': cnbc(), 'n.test': nasdaqDiv(DIV) };
    const day = DAYS[5];
    const reason = 'Reviewed against a third source on the same day; the stored close is right.';
    expect((await run(series(), routes)).out.blocked.join()).toMatch(/check cnbc: 1 day/);
    const wrongValue = [
      {
        kind: 'check',
        series: 't',
        date: day,
        source: 'cnbc',
        primary: off[5] + 1,
        reviewed_on: '2026-11-05',
        reason,
      },
    ];
    expect((await run(series(), routes, { exceptions: wrongValue })).out.blocked.join()).toMatch(
      /check cnbc: 1 day/
    );
    const wrongSource = [{ ...wrongValue[0], primary: off[5], source: 'nasdaq' }];
    expect((await run(series(), routes, { exceptions: wrongSource })).out.blocked.join()).toMatch(
      /check cnbc: 1 day/
    );
    const bound = [{ ...wrongValue[0], primary: off[5] }];
    expect((await run(series(), routes, { exceptions: bound })).out.blocked).toEqual([]);
  });

  it('should pass a day one check disputes when another independent check agrees (two of three)', async () => {
    const odd = DAYS.map((_, i) => (i === 5 ? close(i) * 1.03 : close(i)));
    const s = series({
      checks: [
        { source: src('cnbc', 'cnbc', 'c.test'), tolerance: 0.005 },
        { source: src('cnbc', 'cnbc', 'c2.test'), tolerance: 0.005 },
      ],
    });
    const { out } = await run(s, {
      'p.test': yahoo(undefined, DIV),
      'c.test': cnbc(odd),
      'c2.test': cnbc(),
      'n.test': nasdaqDiv(DIV),
    });
    expect(out.blocked).toEqual([]);
    expect(
      (out.checks as { corroboratedByAnotherCheck?: unknown }[])[0].corroboratedByAnotherCheck
    ).toEqual([{ date: DAYS[5], agreed_by: 'cnbc' }]);
  });

  it('should still BLOCK when the other check disagrees on that day too', async () => {
    const odd = DAYS.map((_, i) => (i === 5 ? close(i) * 1.03 : close(i)));
    const odder = DAYS.map((_, i) => (i === 5 ? close(i) * 0.97 : close(i)));
    const s = series({
      checks: [
        { source: src('cnbc', 'cnbc', 'c.test'), tolerance: 0.005 },
        { source: src('cnbc', 'cnbc', 'c2.test'), tolerance: 0.005 },
      ],
    });
    const { out, store } = await run(s, {
      'p.test': yahoo(undefined, DIV),
      'c.test': cnbc(odd),
      'c2.test': cnbc(odder),
      'n.test': nasdaqDiv(DIV),
    });
    expect(out.blocked.join()).toMatch(/check cnbc: 1 day/);
    expect(written(store)).toBe(false);
  });

  it('should BLOCK a check shifted by one day, even inside every tolerance', async () => {
    const shifted = DAYS.map((_, i) => close(i + 1));
    const s = series({ checks: [{ source: src('cnbc', 'cnbc', 'c.test'), tolerance: 0.5 }] });
    const { out } = await run(s, {
      'p.test': yahoo(undefined, DIV),
      'c.test': cnbc(shifted),
      'n.test': nasdaqDiv(DIV),
    });
    expect(out.blocked.join()).toMatch(/looks shifted by one day/);
  });

  it('should BLOCK a changed stored day, log it once, and move on only after a reviewed "keep"', async () => {
    const store = createStore(freshDir());
    const routes = { 'p.test': yahoo(undefined, DIV), 'c.test': cnbc(), 'n.test': nasdaqDiv(DIV) };
    await run(series(), routes, { store });
    const changed = DAYS.map((_, i) => (i === 2 ? close(i) + 0.1 : close(i)));
    const r2 = { ...routes, 'p.test': yahoo(changed, DIV), 'c.test': cnbc(changed) };
    expect((await run(series(), r2, { store })).out.blocked.join()).toMatch(
      /1 stored day\(s\) changed/
    );
    await run(series(), r2, { store });
    expect(
      fs.readFileSync(path.join(store.root, 'revisions.jsonl'), 'utf8').trim().split('\n')
    ).toHaveLength(1);
    const keep = [
      {
        kind: 'revision',
        series: 't',
        date: DAYS[2],
        stored: close(2),
        fetched: changed[2],
        decision: 'keep',
        reviewed_on: '2026-11-05',
        reason: 'Checked: the original print was the exchange close.',
      },
    ];
    const r3 = await run(series(), r2, { store, exceptions: keep });
    expect(r3.out.blocked).toEqual([]);
    expect(readCsv(path.join(store.root, 'daily', 't.csv'))[2].close).toBe(String(close(2)));
  });
});

describe('collectSeries: a revision the publisher makes is accepted AND logged (M2)', () => {
  it('should store the revised value and write the revision to revisions.jsonl', async () => {
    const store = createStore(freshDir());
    const s = series({ kind: 'monthly', revisable: true, checks: [], dividendChecks: [] });
    await run(s, { 'p.test': yahoo() }, { store });
    const revised = DAYS.map((_, i) => (i === 3 ? close(i) + 1 : close(i)));
    const r = await run(s, { 'p.test': yahoo(revised) }, { store });
    expect(r.out.blocked).toEqual([]);
    expect(readCsv(path.join(store.root, 'daily', 't.csv'))[3].close).toBe(String(revised[3]));
    expect(
      JSON.parse(fs.readFileSync(path.join(store.root, 'revisions.jsonl'), 'utf8'))
    ).toMatchObject({ date: DAYS[3], accepted: true });
    expect(fs.existsSync(path.join(store.root, 'derived', 'weekly', 't.csv'))).toBe(false); // no weekly file for a monthly series
  });
});

describe('the fetch layer: retry, fallback, circuit breaker, exact evidence', () => {
  it('should retry a 200 that carries the wrong body, then use the fallback host', async () => {
    const store = createStore(freshDir());
    const calls: string[] = [];
    const fetcher = createFetcher({
      store,
      retryBaseMs: 1,
      fetchImpl: fakeFetch(
        {
          'main.test': '<html>maintenance</html>',
          'alt.test': 'observation_date,X\n2026-10-01,1.5\n',
        },
        calls
      ),
    });
    const s = {
      provider: 'fred',
      parser: 'fred',
      url: () => 'https://main.test/x',
      fallback: () => 'https://alt.test/x',
    };
    const r = await fetcher.fetchSource(s, { from: '2026-10-01', to: '2026-10-31', series: 'x' });
    expect(r.usedFallback).toBe(true);
    expect(r.rows).toEqual([{ date: '2026-10-01', close: 1.5 }]);
    expect(calls.filter((u) => u.includes('main.test'))).toHaveLength(3);
  });

  it('should mark a host down after a network failure, so its next series fails fast', async () => {
    const store = createStore(freshDir());
    const calls: string[] = [];
    const fetcher = createFetcher({ store, retryBaseMs: 1, fetchImpl: fakeFetch({}, calls) });
    const s = { provider: 'cnbc', parser: 'cnbc', url: () => 'https://gone.test/x' };
    await expect(
      fetcher.fetchSource(s, { from: '2026-10-01', to: '2026-10-31', series: 'a' })
    ).rejects.toThrow(/ECONNREFUSED/);
    await expect(
      fetcher.fetchSource(s, { from: '2026-10-01', to: '2026-10-31', series: 'b' })
    ).rejects.toBeInstanceOf(HostDown);
    expect(calls).toHaveLength(3); // the second series made no request
  });

  it('should keep the response bytes exactly as received (a BOM and invalid UTF-8 survive)', async () => {
    const store = createStore(freshDir());
    const bytes = Buffer.from([0xef, 0xbb, 0xbf, 0x6f, 0x62, 0x73, 0xff, 0x0a]);
    const fetcher = createFetcher({
      store,
      retryBaseMs: 1,
      fetchImpl: async () => new Response(bytes, { status: 200 }),
    });
    await expect(
      fetcher.fetchSource(
        { provider: 'fred', parser: 'fred', url: () => 'https://x.test/x' },
        { from: '2026-10-01', to: '2026-10-02', series: 'a' }
      )
    ).rejects.toThrow();
    const row = JSON.parse(
      fs.readFileSync(path.join(store.root, 'raw', 'manifest.jsonl'), 'utf8').split('\n')[0]
    );
    expect(row.bytes).toBe(8);
    expect(row.sha256).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));
  });

  it('should not retry a 404', async () => {
    const calls: string[] = [];
    const fetcher = createFetcher({
      store: createStore(freshDir()),
      retryBaseMs: 1,
      fetchImpl: fakeFetch({ 'x.test': () => new Response('no', { status: 404 }) }, calls),
    });
    await expect(
      fetcher.fetchSource(
        { provider: 'cnbc', parser: 'cnbc', url: () => 'https://x.test/x' },
        { from: '2026-10-01', to: '2026-10-02', series: 'a' }
      )
    ).rejects.toThrow(/HTTP 404/);
    expect(calls).toHaveLength(1);
  });
});

describe('reviewed exceptions: validated, bound, fail closed', () => {
  const base = {
    series: 'x',
    date: '2026-10-01',
    reviewed_on: '2026-11-05',
    reason: 'A sentence that explains what was checked.',
  };
  it('should refuse an entry without a real reason, a kind, or the value it reviewed', () => {
    expect(() =>
      parseExceptions(
        JSON.stringify([{ ...base, kind: 'check', source: 'cnbc', primary: 1, reason: true }])
      )
    ).toThrow(/reason/);
    expect(() =>
      parseExceptions(JSON.stringify([{ ...base, kind: 'check', source: 'cnbc' }]))
    ).toThrow(/primary/);
    expect(() =>
      parseExceptions(JSON.stringify([{ ...base, source: 'cnbc', primary: 1 }]))
    ).toThrow(/kind/);
    expect(() =>
      parseExceptions(
        JSON.stringify([{ ...base, kind: 'distribution', action: 'store', amount: 0 }])
      )
    ).toThrow(/positive/);
    expect(() => parseExceptions('{not json')).toThrow(/not valid JSON/);
  });
  it('should store only an amount a source actually reported', () => {
    const list = parseExceptions(
      JSON.stringify([{ ...base, kind: 'distribution', action: 'store', amount: 1.63643 }])
    );
    const outlier = {
      date: '2026-10-01',
      seen: [
        { name: 'yahoo', amount: 1.633 },
        { name: 'stockanalysis', amount: 1.63643 },
      ],
    };
    expect(distributionException(list, 'x', outlier)).not.toBeNull();
    expect(
      distributionException(list, 'x', { ...outlier, seen: [{ name: 'yahoo', amount: 1.633 }] })
    ).toBeNull();
  });
  it('should exit 3, keeping a check report, when the exceptions file is unreadable', async () => {
    const dir = freshDir();
    fs.mkdirSync(path.join(dir, 'checks'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'checks', 'accepted-exceptions.json'), '[{"series":1}]');
    expect(await main(['--store', dir, '--series', 'spy'], { fetchImpl: fakeFetch({}) })).toBe(3);
    const reports = fs
      .readdirSync(path.join(dir, 'checks'))
      .filter((f) => f !== 'accepted-exceptions.json');
    expect(
      JSON.parse(fs.readFileSync(path.join(dir, 'checks', reports[0]), 'utf8')).failed
    ).toMatch(/EXCEPTIONS/);
  });
  it('should exit 2, fetching nothing, on bad arguments', async () => {
    expect(await main(['--store', freshDir(), '--series', 'spy\nbranch=pre-launch'])).toBe(2);
    expect(await main(['--series', 'spy'])).toBe(2);
  });
});

describe('the commit guard: append-only under market/, read from the index', () => {
  const ns = (...pairs: [string, number, number][]) =>
    new Map(pairs.map(([p, a, d]) => [p, { added: a, deleted: d }]));
  it('should allow additions, growing files and rebuilt derived files', () => {
    const changes = parseNameStatus(
      'A\0market/raw/yahoo/spy/a.json.gz\0M\0market/daily/spy.csv\0M\0market/derived/monthly/spy.csv\0M\0market/daily/us_m2.csv\0'
    );
    expect(
      evaluateStaged(
        changes,
        ns(
          ['market/daily/spy.csv', 5, 0],
          ['market/derived/monthly/spy.csv', 3, 3],
          ['market/daily/us_m2.csv', 1, 1]
        )
      )
    ).toEqual([]);
  });
  it('should refuse deletions, renames, lines removed, edits outside market/ and the exceptions file', () => {
    const changes = parseNameStatus(
      'D\0market/daily/spy.csv\0M\0market/events/spy.distributions.csv\0A\0main.py\0M\0market/checks/accepted-exceptions.json\0M\0market/README.md\0'
    );
    const refused = evaluateStaged(changes, ns(['market/events/spy.distributions.csv', 1, 1]));
    expect(refused).toHaveLength(5);
    expect(refused.join('\n')).toMatch(/D \(deletions/);
    expect(refused.join('\n')).toMatch(/lines removed/);
    expect(refused.join('\n')).toMatch(/outside market/);
    expect(refused.join('\n')).toMatch(/only a reviewed PR/);
    expect(refused.join('\n')).toMatch(/not an append-only file/);
  });
  it('should refuse a collection that adds or changes a reviewed record under checks/reviews/ (5.776)', () => {
    const changes = parseNameStatus(
      'A\0market/checks/reviews/btc-range-pass-2026-11-14.json\0A\0market/checks/20261114T092300Z.json\0'
    );
    const refused = evaluateStaged(changes, ns());
    expect(refused).toHaveLength(1);
    expect(refused[0]).toMatch(/reviews\/btc-range-pass/);
    expect(refused[0]).toMatch(/only a reviewed PR/);
  });
  it('should read paths with spaces and tabs exactly (NUL-separated)', () => {
    expect(parseNameStatus('A\0market/raw/a b.json.gz\0')).toEqual([
      { status: 'A', path: 'market/raw/a b.json.gz' },
    ]);
    expect(parseNumstat('3\t0\tmarket/x y.csv\0').get('market/x y.csv')).toEqual({
      added: 3,
      deleted: 0,
    });
  });
});

describe('parsers', () => {
  it('should date a Yahoo bar in the exchange’s time zone even when UTC is the next day', () => {
    // 2026-10-30 22:00 New York = 2026-10-31 02:00 UTC
    const body = JSON.stringify({
      chart: {
        result: [
          {
            meta: { gmtoffset: -14400 },
            timestamp: [Date.parse('2026-10-31T02:00:00Z') / 1000],
            indicators: { quote: [{ open: [1], high: [1], low: [1], close: [1] }] },
          },
        ],
      },
    });
    expect(P.parseYahooChart(body, 't').rows[0].date).toBe('2026-10-30');
  });
  it('should read B3 by month column and day row, pt-BR numbers, and refuse an impossible date', () => {
    const body = JSON.stringify({
      results: [
        { day: 2, rateValue1: '40.570,03', rateValue3: '41.000,50' },
        { day: 30, rateValue2: null },
      ],
    });
    expect(P.parseB3Year(body, 2026, 't').rows).toEqual([
      { date: '2026-01-02', close: 40570.03 },
      { date: '2026-03-02', close: 41000.5 },
    ]);
    const bad = JSON.stringify({ results: [{ day: 30, rateValue2: '1,00' }] });
    expect(() => P.parseB3Year(bad, 2026, 't')).toThrow(/impossible date 2026-02-30/);
  });
  it('should refuse a FRED body that is not its CSV (a maintenance page)', () => {
    expect(() => P.parseFredCsv('<html>down</html>', 't')).toThrow(/unexpected header/);
  });
  it('should drop flat CNBC bars (holidays, faults) and weekend bars', () => {
    const bar = (t: string, o: string, c: string) => ({
      tradeTime: t,
      open: o,
      high: c,
      low: o,
      close: c,
    });
    const body = JSON.stringify({
      barData: {
        priceBars: [
          bar('20260403000000', '1', '1'),
          bar('20260406000000', '1', '2'),
          bar('20260404000000', '1', '2'),
        ],
      },
    });
    expect(P.parseCnbcBars(body, 't').rows.map((r: { date: string }) => r.date)).toEqual([
      '2026-04-06',
    ]);
  });
  it('should read the World Gold Council fix by its UTC day, Coin Metrics paging, Bitstamp volume and Coinbase candles', () => {
    expect(
      P.parseWgcChart(
        JSON.stringify({ chartData: { USD: [[Date.parse('2016-01-29T00:00:00Z'), 1111.8]] } }),
        't'
      ).rows
    ).toEqual([{ date: '2016-01-29', close: 1111.8 }]);
    expect(
      P.parseCoinMetrics(
        JSON.stringify({
          data: [{ time: '2026-10-30T00:00:00.000000000Z', PriceUSD: '77109.59' }],
          next_page_url: 'https://n',
        }),
        't'
      )
    ).toEqual({ rows: [{ date: '2026-10-30', close: 77109.59 }], next: 'https://n' });
    const bs = P.parseBitstampOhlc(
      JSON.stringify({
        data: {
          ohlc: [
            {
              timestamp: '1314144000',
              open: '11',
              high: '11',
              low: '11',
              close: '11',
              volume: '0',
            },
            { timestamp: '1314230400', open: '10', high: '12', low: '9', close: '11', volume: '5' },
          ],
        },
      }),
      't'
    );
    expect(bs.rows.map((r: { date: string }) => r.date)).toEqual(['2011-08-25']);
    expect(
      P.parseCoinbaseCandles(JSON.stringify([[1793318400, 76000, 78000, 77000, 77200, 10]]), 't')
        .rows
    ).toEqual([{ date: '2026-10-30', open: 77000, high: 78000, low: 76000, close: 77200 }]);
  });
  it('should read Nasdaq, iShares and stockanalysis distributions by ex-date', () => {
    expect(
      P.parseNasdaqDividends(nasdaqDiv([{ date: '2026-09-21', amount: 0.75143 }]), 't').events
    ).toEqual([{ date: '2026-09-21', amount: 0.75143 }]);
    const ish =
      '{"name":"exDate","formattedValue":["Nov 02, 2026","Oct 01, 2026"]} {"name":"totalDistribution","formattedValue":["0.343177","0.311581"]}';
    expect(P.parseIsharesDistributions(ish, 't').events).toEqual([
      { date: '2026-10-01', amount: 0.311581 },
      { date: '2026-11-02', amount: 0.343177 },
    ]);
    expect(
      P.parseStockAnalysisDividends(
        JSON.stringify({ data: { history: [{ dt: '2021-12-17', amt: '$1.63643' }] } }),
        't'
      ).events
    ).toEqual([{ date: '2021-12-17', amount: 1.63643 }]);
  });
});

describe('the collection workflow refuses what it must', () => {
  const yml = fs.readFileSync(
    path.resolve(__dirname, '../../../../../../.github/workflows/market-data-collect.yml'),
    'utf8'
  );
  it('should keep the evidence of a blocked, failed or timed-out run', () => {
    expect(yml).toMatch(/set \+e -u -o pipefail/);
    expect(yml).toMatch(/if: always\(\) && steps\.analytics\.outcome == 'success'/);
    expect(yml).toMatch(/timeout-minutes: 40/);
  });
  it('should run the append-only guard before committing, and again after a rebase', () => {
    expect(
      yml.match(/node \.\.\/apps\/web\/scripts\/market-data\/commit-guard\.mjs/g)
    ).toHaveLength(2);
    expect(yml).toMatch(/git add -A -f market/);
  });
  it('should validate every input before it reaches GITHUB_OUTPUT, and refuse an unseeded main', () => {
    expect(yml).toMatch(/refusing target branch/);
    expect(yml).toMatch(/refusing series value/);
    expect(yml).toMatch(/merge diboas-analytics #1 first/);
  });
  it('should let only a run from main write the analytics main', () => {
    expect(yml).toMatch(/REF: \$\{\{ github\.ref \}\}/);
    expect(yml).toMatch(
      /\[\[ "\$branch" != "main" \|\| "\$REF" == "refs\/heads\/main" \]\] \|\| \{ echo "refusing: only a run from main writes the analytics main"; exit 1; \}/
    );
  });
  it('should start only from the schedule or a manual dispatch, never from a push', () => {
    // The first backfill ran from a temporary push trigger on its feature
    // branch; it reached main in #808 and was removed 2026-11-05. A push trigger
    // here would re-run a write to diboas-analytics on any matching push.
    const triggers = yml.slice(yml.indexOf('\non:'), yml.indexOf('\npermissions:'));
    expect(triggers).toMatch(/schedule:/);
    expect(triggers).toMatch(/workflow_dispatch:/);
    expect(triggers).not.toMatch(/^\s*(push|pull_request|pull_request_target):/m);
    expect(yml).not.toMatch(/"\$EVENT" = "push"/);
  });
  it('should commit as the GitHub Actions bot, never as someone’s account', () => {
    expect(yml).toMatch(/41898282\+github-actions\[bot\]@users\.noreply\.github\.com/);
    expect(yml).not.toMatch(/market-data@users\.noreply/);
  });
});
