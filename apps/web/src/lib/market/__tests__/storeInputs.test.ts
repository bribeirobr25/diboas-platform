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
} from '../../../../scripts/market-refresh/lib/store-inputs.mjs';
import { assertMarketSourcesQuality } from '../../../../scripts/market-refresh/lib/market-sources.mjs';
import { strictFridayCloses } from '../../../../scripts/market-refresh/lib/regime-engine.mjs';
import { lastTradingDay } from '../../../../scripts/market-data/calendar.mjs';

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

describe('the store reader (plan MP-3a)', () => {
  it('should return the six sources fetchMarketSources() returns, as [Date, number] pairs', () => {
    const { sources } = readStoreInputs(makeStore(), { today: TODAY, from: '2026-01-01' });
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
    const { sources } = readStoreInputs(makeStore(), { today: TODAY, from: '2025-06-01' });
    expect(() => assertMarketSourcesQuality(sources, TODAY)).not.toThrow();
    const fridays = strictFridayCloses(sources.dxy.series, TODAY);
    expect(fridays.at(-1)![0].toISOString().slice(0, 10)).toBe('2026-11-06');
  }, 30_000);

  it("should name the store series in each source's provenance", () => {
    const { sources } = readStoreInputs(makeStore(), { today: TODAY, storeCommit: 'abc1234' });
    expect(sources.dxy.provenance).toMatchObject({
      source: 'store:dollar_broad',
      storeCommit: 'abc1234',
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
    expect(() => readStoreInputs(root, { today: TODAY })).toThrow(/gold_spot/);
  }, 30_000);
});
