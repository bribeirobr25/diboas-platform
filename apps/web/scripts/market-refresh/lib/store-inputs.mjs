/**
 * store-inputs.mjs — the score's inputs read from the market data store (plan MP-3a).
 *
 * Returns the shapes the score reads today: `fetchMarketSources()`'s
 * `{ dxy, us10y, m2, nasdaq, btc, gold }` (each `{ series: [Date, number][], provenance }`),
 * over the SAME window each live fetch covers (FRED from 2023-01-01; Yahoo's Bitcoin 6 months,
 * gold 1 year: the relative-strength EMAs start at the window's first point, so a longer window
 * would move them on the day MP-4 switches), and the Bitcoin month rows `btcMonths()` returns
 * (`{ ym: 'YYYY-MM-01', open, high, low, close }`). The VALUES differ by source (the store keeps
 * spot gold and Coin Metrics' Bitcoin, whose month open/high/low come from daily values), and
 * the provenance names the store series and its commit. Not wired into `run.mjs` here: plan
 * MP-4 switches the score to it.
 *
 * Fail closed: a row with a malformed date, a non-decimal or empty close, a day out of order
 * or repeated, or a file without `date` and `close` columns throws, naming the series and the
 * row; nothing is dropped silently (review of MP-3a).
 *
 * Rules it keeps:
 *   - daily values only, read from `daily/` at whatever commit the caller checked out (the
 *     weekly workflow pins one); weekly closes are built by the engine's own
 *     `strictFridayCloses` at the run's clock, never taken from the store's `derived/weekly`
 *     files, which are dated by collection day (finding N7);
 *   - Bitcoin's months come from the store's own month builder (`derive.mjs monthlyBars`)
 *     and count only once the month's last CALENDAR day is stored (`calendar.mjs`, 5.850);
 *   - each source maps to its store series through the one source list
 *     (`source-registry.mjs`: `storeSeries`, or `switchTo` for the two Yahoo sources).
 */
import path from 'node:path';
import { readCsv } from '../../market-data/store.mjs';
import { monthlyBars } from '../../market-data/derive.mjs';
import { isMonthComplete } from '../../market-data/calendar.mjs';
import { FETCHED_SOURCES } from './source-registry.mjs';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;

/** Every row checked, then the window kept, as `[Date, number]` pairs. */
export function toPairs(rows, from, id) {
  if (rows.length && !('date' in rows[0] && 'close' in rows[0]))
    throw new Error(`STORE INPUT: daily/${id}.csv has no date and close columns`);
  let prev = '';
  for (const [i, r] of rows.entries()) {
    const day = new Date(`${r.date}T00:00:00Z`);
    if (
      !ISO_DAY.test(r.date ?? '') ||
      Number.isNaN(day.getTime()) ||
      day.toISOString().slice(0, 10) !== r.date
    )
      throw new Error(`STORE INPUT: daily/${id}.csv row ${i + 2} has a malformed date "${r.date}"`);
    if (r.date <= prev)
      throw new Error(
        `STORE INPUT: daily/${id}.csv row ${i + 2} (${r.date}) is out of order or repeated`
      );
    if (!DECIMAL.test(String(r.close ?? '')))
      throw new Error(
        `STORE INPUT: daily/${id}.csv row ${i + 2} (${r.date}) has no plain decimal close`
      );
    prev = r.date;
  }
  return rows
    .filter((r) => r.date >= from)
    .map((r) => [new Date(`${r.date}T00:00:00Z`), Number(r.close)]);
}

/** The first day of a live fetch's window: FRED's fixed start, or Yahoo's range back from today. */
export function windowStart(source, today, fredStart = '2023-01-01') {
  if (!source.range) return fredStart;
  const m = /^(\d+)(mo|y)$/.exec(source.range);
  if (!m) throw new Error(`STORE INPUT: unknown range ${source.range}`);
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (m[2] === 'y') d.setUTCFullYear(d.getUTCFullYear() - Number(m[1]));
  else d.setUTCMonth(d.getUTCMonth() - Number(m[1]));
  return d.toISOString().slice(0, 10);
}

/** The store series a fetched source reads from the store. */
export function storeSeriesFor(source) {
  return source.storeSeries ?? source.switchTo ?? null;
}

/**
 * @param {string} storeDir the `market/` folder of a store checkout
 * @param {{today: Date, from?: string, storeCommit: string}} opts  `from` is the FRED start;
 *   the store commit is required, so a reading can never pass as pinned without one
 */
export function readStoreInputs(storeDir, { today, from = '2023-01-01', storeCommit }) {
  if (!storeCommit) throw new Error('STORE INPUT: the store commit is required (provenance)');
  /** @type {Record<string, {series: [Date, number][], provenance: Record<string, string|null>}>} */
  const sources = {};
  for (const s of FETCHED_SOURCES) {
    const id = storeSeriesFor(s);
    if (!id) throw new Error(`STORE INPUT: ${s.label} has no store series`);
    const rows = readCsv(path.join(storeDir, 'daily', `${id}.csv`));
    if (!rows.length) throw new Error(`STORE INPUT: daily/${id}.csv is missing or empty`);
    sources[s.key] = {
      series: toPairs(rows, windowStart(s, today, from), id),
      provenance: {
        source: `store:${id}`,
        url: `market/daily/${id}.csv`,
        fetchedAt: today.toISOString(),
        storeCommit,
      },
    };
  }
  return { sources, btcMonths: btcMonthsFromStore(storeDir, today) };
}

/** Bitcoin's complete months from the store, in the committed `monthlyPrices.json` shape. */
export function btcMonthsFromStore(storeDir, today) {
  const daily = readCsv(path.join(storeDir, 'daily', 'btc.csv'));
  if (!daily.length) throw new Error('STORE INPUT: daily/btc.csv is missing or empty');
  const lastStored = daily.at(-1).date;
  return monthlyBars(daily, [], today.toISOString().slice(0, 10))
    .filter((m) => isMonthComplete(m, lastStored, 'daily'))
    .map((m) => ({ ym: `${m.ym}-01`, open: m.open, high: m.high, low: m.low, close: m.close }));
}
