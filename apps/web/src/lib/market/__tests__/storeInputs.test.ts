/**
 * The score's store reader (plan MP-3a): `readStoreInputs` returns the shapes the score
 * reads today, the engine's own checks accept them, and Bitcoin's months follow Bitcoin's
 * calendar (5.850). Fixtures only, in a temporary store; no network; not wired into run.mjs.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  btcMonthsFromStore,
  readStoreInputs,
  toPairs,
  windowStart,
} from '../../../../scripts/market-refresh/lib/store-inputs.mjs';
import { assertMarketSourcesQuality } from '../../../../scripts/market-refresh/lib/market-sources.mjs';
import { strictFridayCloses } from '../../../../scripts/market-refresh/lib/regime-engine.mjs';
import { isMonthComplete, lastTradingDay } from '../../../../scripts/market-data/calendar.mjs';
import { FETCHED_SOURCES } from '../../../../scripts/market-refresh/lib/source-registry.mjs';

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Daily rows from `from` to `to` inclusive; weekdays only unless `everyDay`. */
function rows(from: string, to: string, start: number, step: number, everyDay = false) {
  const out: string[] = [];
  let v = start;
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += DAY) {
    const dow = new Date(t).getUTCDay();
    if (!everyDay && (dow === 0 || dow === 6)) continue;
    out.push(`${iso(t)},,,,${v.toFixed(4)},fixture`);
    v += step;
  }
  return `date,open,high,low,close,source\n${out.join('\n')}\n`;
}

function makeStore({ btcTo = '2026-11-08' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'store-inputs-'));
  roots.push(root);
  const daily = path.join(root, 'daily');
  fs.mkdirSync(daily, { recursive: true });
  fs.writeFileSync(path.join(daily, 'us10y.csv'), rows('2026-01-01', '2026-11-06', 4.2, 0.0005));
  fs.writeFileSync(
    path.join(daily, 'dollar_broad.csv'),
    rows('2026-01-01', '2026-11-06', 120, 0.01)
  );
  fs.writeFileSync(
    path.join(daily, 'nasdaq_composite.csv'),
    rows('2026-01-01', '2026-11-06', 20000, 5)
  );
  fs.writeFileSync(path.join(daily, 'gold_spot.csv'), rows('2026-01-01', '2026-11-06', 3000, 2));
  fs.writeFileSync(path.join(daily, 'btc.csv'), rows('2025-01-01', btcTo, 60000, 20, true));
  const m2 = ['date,open,high,low,close,source'];
  for (let m = 0; m < 24; m += 1) {
    const d = new Date(Date.UTC(2024, 9 + m, 1));
    m2.push(`${iso(d.getTime())},,,,${(21000 + m * 50).toFixed(1)},fixture`);
  }
  fs.writeFileSync(path.join(daily, 'us_m2.csv'), `${m2.join('\n')}\n`);
  return root;
}

const TODAY = new Date('2026-11-10T06:20:00Z');
const SHA = '0'.repeat(40);

describe('the store reader (plan MP-3a)', () => {
  it('should return the six sources fetchMarketSources() returns, as [Date, number] pairs', () => {
    const { sources } = readStoreInputs(makeStore(), {
      today: TODAY,
      from: '2026-01-01',
      storeCommit: SHA,
    });
    expect(Object.keys(sources).sort()).toEqual(['btc', 'dxy', 'gold', 'm2', 'nasdaq', 'us10y']);
    for (const [key, src] of Object.entries(sources) as [string, { series: [Date, number][] }][]) {
      expect(src.series.length, key).toBeGreaterThan(0);
      for (const [d, v] of src.series) {
        expect(d).toBeInstanceOf(Date);
        expect(d.getUTCHours(), key).toBe(0);
        expect(Number.isFinite(v), key).toBe(true);
      }
      const times = src.series.map(([d]) => d.getTime());
      expect(
        [...times].sort((a, b) => a - b),
        key
      ).toEqual(times);
    }
  }, 30_000);

  it("should pass the score's own quality and recency checks, and feed strictFridayCloses", () => {
    const { sources } = readStoreInputs(makeStore(), {
      today: TODAY,
      from: '2025-06-01',
      storeCommit: SHA,
    });
    expect(() => assertMarketSourcesQuality(sources, TODAY)).not.toThrow();
    const fridays = strictFridayCloses(sources.dxy.series, TODAY);
    expect(fridays.at(-1)![0].toISOString().slice(0, 10)).toBe('2026-11-06');
  }, 30_000);

  it("should name the store series in each source's provenance", () => {
    const { sources } = readStoreInputs(makeStore(), {
      today: TODAY,
      storeCommit: 'abc1234'.padEnd(40, '0'),
    });
    expect(sources.dxy.provenance).toMatchObject({
      source: 'store:dollar_broad',
      storeCommit: 'abc1234'.padEnd(40, '0'),
    });
    expect(sources.gold.provenance.source).toBe('store:gold_spot');
    expect(sources.btc.provenance.source).toBe('store:btc');
  }, 30_000);

  it('should count a Bitcoin month only once its last calendar day is stored (5.850)', () => {
    // November 2025 ends on a Sunday: with the weekday rule Friday 28 would close it.
    expect(lastTradingDay('2025-11', 'weekdays')).toBe('2025-11-28');
    expect(lastTradingDay('2025-11', 'daily')).toBe('2025-11-30');
    const partial = btcMonthsFromStore(makeStore({ btcTo: '2025-11-29' }), TODAY);
    expect(partial.at(-1)!.ym).toBe('2025-10-01');
    const full = btcMonthsFromStore(makeStore({ btcTo: '2025-11-30' }), TODAY);
    expect(full.at(-1)!.ym).toBe('2025-11-01');
    expect(Object.keys(full.at(-1)!).sort()).toEqual(['close', 'high', 'low', 'open', 'ym']);
  }, 30_000);

  it("should refuse a store that lacks a source's series", () => {
    const root = makeStore();
    fs.rmSync(path.join(root, 'daily', 'gold_spot.csv'));
    expect(() => readStoreInputs(root, { today: TODAY, storeCommit: SHA })).toThrow(/gold_spot/);
  }, 30_000);

  it('should require the store commit, so a reading never passes as pinned without one', () => {
    expect(() => readStoreInputs(makeStore(), { today: TODAY } as never)).toThrow(
      /store commit is required/
    );
  });

  it('should read the window each live fetch covers (Yahoo 6 months / 1 year, FRED 2023 on)', () => {
    const src = (key: string) => (FETCHED_SOURCES as { key: string }[]).find((s) => s.key === key)!;
    expect(windowStart(src('btc'), TODAY)).toBe('2026-05-10');
    expect(windowStart(src('gold'), TODAY)).toBe('2025-11-10');
    expect(windowStart(src('us10y'), TODAY)).toBe('2023-01-01');
    const { sources } = readStoreInputs(makeStore(), {
      today: TODAY,
      from: '2023-01-01',
      storeCommit: SHA,
    });
    expect(sources.btc.series[0][0].toISOString().slice(0, 10)).toBe('2026-05-10');
  }, 30_000);

  it.each([
    ['a malformed date', '2026-13-01'],
    ['an impossible date', '2026-02-30'],
    ['a hex close', '0x10'],
    ['an empty close', ''],
    ['a close with a unit', '12.5 USD'],
  ])('should refuse %s, naming the series and the row', (what, bad) => {
    const rows = [
      { date: '2026-01-02', close: '1' },
      bad.startsWith('20') ? { date: bad, close: '1' } : { date: '2026-01-05', close: bad },
    ];
    expect(() => toPairs(rows, '2020-01-01', 'us10y')).toThrow(/daily\/us10y\.csv row 3/);
  });

  it('should refuse a repeated or out-of-order day, and a file without the columns', () => {
    const r = (date: string) => ({ date, close: '1' });
    expect(() => toPairs([r('2026-01-05'), r('2026-01-05')], '2020-01-01', 'x')).toThrow(
      /out of order or repeated/
    );
    expect(() => toPairs([r('2026-01-06'), r('2026-01-05')], '2020-01-01', 'x')).toThrow(
      /out of order or repeated/
    );
    expect(() => toPairs([{ date: '2026-01-05', price: '1' }], '2020-01-01', 'x')).toThrow(
      /no date and close columns/
    );
  });

  it('should keep a Bitcoin month with a missing last day incomplete, even once later days exist', () => {
    // every-day calendar: a missing month-end is a gap, not a holiday
    expect(isMonthComplete({ ym: '2025-11', last_day: '2025-11-29' }, '2025-12-03', 'daily')).toBe(
      false
    );
    // an exchange holiday month-end stays complete once a later day is stored
    expect(
      isMonthComplete({ ym: '2025-12', last_day: '2025-12-30' }, '2026-01-02', 'weekdays')
    ).toBe(true);
  });

  it('should refuse a store commit that is not a full sha', () => {
    for (const bad of ['x', 'abc1234', 'Z'.repeat(40)])
      expect(() => readStoreInputs(makeStore(), { today: TODAY, storeCommit: bad }), bad).toThrow(
        /full 40-character sha/
      );
  }, 30_000);

  it('should refuse, never drop, a Bitcoin day missing in the middle of the history', () => {
    const root = makeStore();
    const file = path.join(root, 'daily', 'btc.csv');
    fs.writeFileSync(
      file,
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .filter((l) => !l.startsWith('2025-06-30'))
        .join('\n')
    );
    expect(() => btcMonthsFromStore(root, TODAY)).toThrow(/no row for 2025-06-30/);
  }, 30_000);
});
