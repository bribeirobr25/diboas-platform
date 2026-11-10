/**
 * store-inputs.mjs — the score's inputs read from the market data store (plan MP-3a).
 *
 * Returns EXACTLY the shapes the score reads today: `fetchMarketSources()`'s
 * `{ dxy, us10y, m2, nasdaq, btc, gold }` (each `{ series: [Date, number][], provenance }`)
 * and the Bitcoin month rows `btcMonths()` returns (`{ ym: 'YYYY-MM-01', open, high, low,
 * close }`). Not wired into `run.mjs` here: plan MP-4 switches the score to it.
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

const toPairs = (rows, from) =>
  rows
    .filter((r) => r.date >= from && r.close !== '' && r.close != null)
    .map((r) => [new Date(`${r.date}T00:00:00Z`), Number(r.close)])
    .filter(([, v]) => Number.isFinite(v));

/** The store series a fetched source reads from the store. */
export function storeSeriesFor(source) {
  return source.storeSeries ?? source.switchTo ?? null;
}

/**
 * @param {string} storeDir the `market/` folder of a store checkout
 * @param {{today: Date, from?: string, storeCommit?: string|null}} opts
 */
export function readStoreInputs(storeDir, { today, from = '2023-01-01', storeCommit = null }) {
  /** @type {Record<string, {series: [Date, number][], provenance: Record<string, string|null>}>} */
  const sources = {};
  for (const s of FETCHED_SOURCES) {
    const id = storeSeriesFor(s);
    if (!id) throw new Error(`STORE INPUT: ${s.label} has no store series`);
    const rows = readCsv(path.join(storeDir, 'daily', `${id}.csv`));
    if (!rows.length) throw new Error(`STORE INPUT: daily/${id}.csv is missing or empty`);
    sources[s.key] = {
      series: toPairs(rows, from),
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
