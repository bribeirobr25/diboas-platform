#!/usr/bin/env node
/**
 * BTC pre-2014-09 backfill via CoinMetrics community API.
 *
 * Run after fresh clone or whenever monthlyPrices.json needs regenerated.
 * Yahoo Finance's BTC-USD series begins 2014-09. CoinMetrics covers
 * 2010-07-17 onwards (Mt. Gox first market price) — fills the 4-year gap.
 *
 * Output: monthly OHLC for 2010-07 → 2014-08, spliced into BTC.months by
 * the calling integration script.
 *
 * Usage: node apps/web/scripts/data-fetchers/fetch-btc-coinmetrics.mjs
 */

const API_BASE = 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics';
const PARAMS =
  'assets=btc&metrics=PriceUSD&start_time=2010-07-17&end_time=2014-08-31&frequency=1d&page_size=10000';

async function fetchAll() {
  let url = `${API_BASE}?${PARAMS}`;
  let allData = [];
  let pageNum = 0;
  while (url) {
    pageNum++;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} on page ${pageNum}`);
    const d = await res.json();
    process.stderr.write(`Page ${pageNum}: ${d.data.length} records\n`);
    allData = allData.concat(d.data);
    url = d.next_page_url || null;
  }
  return allData;
}

function aggregateMonthly(daily) {
  const months = {};
  for (const r of daily) {
    const ym = r.time.slice(0, 7) + '-01';
    const price = parseFloat(r.PriceUSD);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (!months[ym]) months[ym] = [];
    months[ym].push({ date: r.time.slice(0, 10), price });
  }
  const sortedYms = Object.keys(months).sort();
  return sortedYms.map((ym) => {
    const days = months[ym];
    days.sort((a, b) => (a.date < b.date ? -1 : 1));
    const open = days[0].price;
    const close = days[days.length - 1].price;
    let high = -Infinity;
    let low = Infinity;
    for (const d of days) {
      if (d.price > high) high = d.price;
      if (d.price < low) low = d.price;
    }
    return {
      ym,
      open: +open.toFixed(4),
      high: +high.toFixed(4),
      low: +low.toFixed(4),
      close: +close.toFixed(4),
    };
  });
}

const daily = await fetchAll();
const monthly = aggregateMonthly(daily);
process.stderr.write(
  `Total months: ${monthly.length} (${monthly[0].ym} → ${monthly[monthly.length - 1].ym})\n`
);
process.stdout.write(JSON.stringify(monthly, null, 2));
