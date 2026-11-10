/**
 * The read-only range-pass report (register 5.776, plan MP-2, gate DATA-STORE-1).
 *
 * Requirement: every stored day that passed its check ONLY through the range rule is
 * listed for review, built from the check responses the store already keeps, with no
 * fetch; days beyond tolerance are listed with the check that confirmed them; a response
 * that is missing or unreadable is listed, never fatal; a path that is not a store is
 * refused; the store is never modified except for the one report file, which is never
 * overwritten.
 *
 * Fixtures only, in a temporary store; no network. Outside the weekly-gate directories.
 * Budgets: each test runs in well under a second locally; 30 s is the project's explicit
 * per-test ceiling.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { main, rangePassReport } from '../../../../scripts/market-data/range-pass-report.mjs';

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

const unix = (d: string) => Date.parse(`${d}T00:00:00Z`) / 1000;
type Manifest = {
  fetched_at: string;
  provider: string;
  series: string;
  status: number;
  saved_as: string;
};
type Check = Record<string, unknown> & { check_source: string };

/** Coinbase candle: [time, low, high, open, close, volume]. */
const cb = (d: string, low: number, high: number, close: number) => [
  unix(d),
  low,
  high,
  close,
  close,
  1,
];
/** Bitstamp OHLC row. */
const bs = (d: string, low: number, high: number, close: number, volume = 1) => ({
  timestamp: String(unix(d)),
  open: String(close),
  high: String(high),
  low: String(low),
  close: String(close),
  volume: String(volume),
});

function makeStore(
  responses: {
    provider: 'coinbase' | 'bitstamp';
    fetched_at: string;
    body: unknown;
    status?: number;
  }[],
  daily = 'date,close\n2022-06-28,20000\n2022-06-29,19332.91\n2022-06-30,15000\n2022-07-01,19500\n'
): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'range-pass-'));
  roots.push(root);
  const m = path.join(root, 'market');
  fs.mkdirSync(path.join(m, 'daily'), { recursive: true });
  fs.mkdirSync(path.join(m, 'raw'), { recursive: true });
  fs.writeFileSync(path.join(m, 'daily', 'btc.csv'), daily);
  const lines: Manifest[] = [];
  responses.forEach((r, i) => {
    const saved = `raw/${r.provider}/btc/${r.fetched_at.replace(/[:.]/g, '-')}-${i}.json.gz`;
    fs.mkdirSync(path.join(m, path.dirname(saved)), { recursive: true });
    const text = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    fs.writeFileSync(path.join(m, saved), zlib.gzipSync(text));
    lines.push({
      fetched_at: r.fetched_at,
      provider: r.provider,
      series: 'btc',
      status: r.status ?? 200,
      saved_as: saved,
    });
  });
  fs.writeFileSync(
    path.join(m, 'raw', 'manifest.jsonl'),
    lines.map((l) => `${JSON.stringify(l)}\n`).join('')
  );
  return root;
}

// 06-28 agrees with both; 06-29 sits inside both ranges but over 3% from both closes (a
// range pass against each); 06-30 is outside Coinbase's range but agrees with Bitstamp
// (beyond tolerance, confirmed by the other check).
const COINBASE = [
  cb('2022-06-28', 19800, 20300, 20010),
  cb('2022-06-29', 18603, 20143.53, 19985.62),
  cb('2022-06-30', 18900, 20100, 19900),
];
const BITSTAMP = {
  data: {
    ohlc: [
      bs('2022-06-28', 19800, 20300, 20020),
      bs('2022-06-29', 18700, 20100, 19924.89),
      bs('2022-06-30', 14500, 15500, 15100),
    ],
  },
};
const STANDARD = () =>
  makeStore([
    { provider: 'coinbase', fetched_at: '2026-11-04T23:59:07.000Z', body: COINBASE },
    { provider: 'bitstamp', fetched_at: '2026-11-04T23:59:14.000Z', body: BITSTAMP },
  ]);

function digest(root: string): string {
  const h = crypto.createHash('sha256');
  const walk = (d: string) => {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else h.update(p).update(fs.readFileSync(p));
    }
  };
  walk(root);
  return h.digest('hex');
}

type Report = {
  rows: Record<string, unknown>[];
  checks: Check[];
  distinct_days: number;
  definition: string | null;
  beyond_tolerance: Record<string, unknown>[];
};

const byCheck = (r: Report, source: string): Check => {
  const c = r.checks.find((x) => x.check_source === source);
  if (!c) throw new Error(`no ${source} check in the report`);
  return c;
};

const report = (root: string): Report => rangePassReport(root, 'btc', '2026-11-10') as Report;

describe('range-pass report (5.776, DATA-STORE-1)', () => {
  it('should list each range pass per check source with exactly the contract fields', () => {
    const r = report(STANDARD());
    expect(r.rows).toEqual([
      {
        series: 'btc',
        check_source: 'bitstamp',
        day: '2022-06-29',
        stored: 19332.91,
        check_low: 18700,
        check_high: 20100,
        check_close: 19924.89,
        passed_by: 'range',
      },
      {
        series: 'btc',
        check_source: 'coinbase',
        day: '2022-06-29',
        stored: 19332.91,
        check_low: 18603,
        check_high: 20143.53,
        check_close: 19985.62,
        passed_by: 'range',
      },
    ]);
    expect(r.distinct_days).toBe(1);
    expect(byCheck(r, 'coinbase')).toMatchObject({
      passed_by_range: 1,
      beyond_tolerance: 1,
      compared_days: 3,
    });
    expect(byCheck(r, 'bitstamp')).toMatchObject({
      passed_by_range: 1,
      beyond_tolerance: 0,
      compared_days: 3,
    });
    expect(r.definition).toMatch(/last 30 minutes before 00:00 UTC/);
  }, 30_000);

  it('should list a day beyond one check with the check that confirmed it', () => {
    expect(report(STANDARD()).beyond_tolerance).toEqual([
      expect.objectContaining({
        day: '2022-06-30',
        check_source: 'coinbase',
        stored: 15000,
        agreed_by: 'bitstamp',
      }),
    ]);
  }, 30_000);

  it('should use the newest stored response for a day when pages overlap', () => {
    const revised = [cb('2022-06-29', 19000, 19400, 19300)]; // now within tolerance
    const root = makeStore([
      { provider: 'coinbase', fetched_at: '2026-11-04T23:59:07.000Z', body: COINBASE },
      { provider: 'coinbase', fetched_at: '2026-11-05T00:01:00.000Z', body: revised },
    ]);
    expect(report(root).rows).toEqual([]);
  }, 30_000);

  it("should compare nothing before a check source's start date", () => {
    // Coinbase checks Bitcoin from 2015-07-20: a 2014 candle in a stored response is ignored.
    const root = makeStore(
      [
        {
          provider: 'coinbase',
          fetched_at: '2026-11-04T23:59:07.000Z',
          body: [cb('2014-01-02', 700, 900, 870), cb('2015-07-21', 270, 290, 280)],
        },
      ],
      'date,close\n2014-01-02,760\n2015-07-21,280\n'
    );
    const r = report(root);
    expect(byCheck(r, 'coinbase')).toMatchObject({ compared_days: 1 });
    expect(r.rows).toEqual([]);
  }, 30_000);

  it('should leave out the day a response was fetched on, which may still be trading', () => {
    const root = makeStore([
      { provider: 'coinbase', fetched_at: '2022-06-29T12:00:00.000Z', body: COINBASE },
    ]);
    const r = report(root);
    expect(byCheck(r, 'coinbase')).toMatchObject({ through: '2022-06-28', compared_days: 1 });
    expect(r.rows).toEqual([]);
  }, 30_000);

  it('should skip a response that was not a 200 and list one that cannot be parsed', () => {
    const root = makeStore([
      {
        provider: 'coinbase',
        fetched_at: '2026-11-04T23:59:01.000Z',
        body: [cb('2022-06-29', 1, 2, 1)],
        status: 503,
      },
      { provider: 'coinbase', fetched_at: '2026-11-04T23:59:05.000Z', body: '{"message":"slow"}' },
      { provider: 'coinbase', fetched_at: '2026-11-04T23:59:07.000Z', body: COINBASE },
    ]);
    const c = byCheck(report(root), 'coinbase');
    expect(c.stored_responses).toBe(2);
    expect(c.unreadable_responses).toEqual([
      expect.objectContaining({ error: expect.stringMatching(/not an array/) }),
    ]);
    expect(c.passed_by_range).toBe(1);
  }, 30_000);

  it('should drop a zero-volume Bitstamp day, as the collector does', () => {
    const quiet = { data: { ohlc: [bs('2022-06-29', 18700, 20100, 19924.89, 0)] } };
    const root = makeStore([
      { provider: 'bitstamp', fetched_at: '2026-11-04T23:59:14.000Z', body: quiet },
    ]);
    expect(byCheck(report(root), 'bitstamp').note).toMatch(/no stored check response/);
  }, 30_000);

  it('should say so when a check source has no stored response, instead of a silent empty list', () => {
    const r = report(makeStore([]));
    for (const source of ['coinbase', 'bitstamp'])
      expect(byCheck(r, source).note).toMatch(/no stored check response/);
  }, 30_000);

  it('should refuse a path that is not a market data store, and write nothing', () => {
    const missing = path.join(os.tmpdir(), `not-a-store-${crypto.randomUUID()}`);
    const logs: string[] = [];
    expect(main(['--store', missing, '--write'], { log: (m: string) => logs.push(m) })).toBe(2);
    expect(fs.existsSync(missing)).toBe(false);
    expect(logs.join('\n')).toMatch(/not a market data store/);
    expect(main(['--store', '--write'], { log: () => {} })).toBe(2);
  }, 30_000);

  it('should leave the store unchanged without --write, and add only the report file with it', () => {
    const root = STANDARD();
    const before = digest(root);
    const quiet = () => {};
    const now = new Date('2026-11-10T12:00:00Z');
    expect(main(['--store', root], { now, log: quiet })).toBe(0);
    expect(digest(root)).toBe(before);
    expect(main(['--store', root, '--write'], { now, log: quiet })).toBe(0);
    const out = path.join(root, 'market', 'checks', 'reviews', 'btc-range-pass-2026-11-10.json');
    expect(JSON.parse(fs.readFileSync(out, 'utf8')).rows).toHaveLength(2);
    fs.rmSync(path.join(root, 'market', 'checks'), { recursive: true });
    expect(digest(root)).toBe(before);
  }, 30_000);

  it('should refuse to overwrite an existing report, a dangling link included', () => {
    const root = STANDARD();
    const quiet = () => {};
    const now = new Date('2026-11-10T12:00:00Z');
    expect(main(['--store', root, '--write'], { now, log: quiet })).toBe(0);
    expect(main(['--store', root, '--write'], { now, log: quiet })).toBe(3);
    const next = path.join(root, 'market', 'checks', 'reviews', 'btc-range-pass-2026-11-11.json');
    const target = path.join(root, 'elsewhere.json');
    fs.symlinkSync(target, next);
    const later = new Date('2026-11-11T12:00:00Z');
    expect(main(['--store', root, '--write'], { now: later, log: quiet })).toBe(3);
    expect(fs.existsSync(target)).toBe(false);
  }, 30_000);
});
