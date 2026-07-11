/**
 * Yahoo Finance provider (P2 Stage 1) — chart API with the required UA.
 * Daily series for weekly signals; monthly bars for the BTC candle append.
 */
import { withRetry } from '../lib/retry.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function chart(symbol, range, interval) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Yahoo ${symbol} returned ${res.status}`);
  const json = await res.json();
  const r = json.chart?.result?.[0];
  if (!r) throw new Error(`Yahoo ${symbol} bad response`);
  return r;
}

export async function fetchYahooDaily(symbol, range = '1y') {
  const r = await withRetry(() => chart(symbol, range, '1d'), { label: `Yahoo:${symbol}` });
  const ts = r.timestamp;
  const closes = r.indicators.quote[0].close;
  const series = ts
    .map((t, i) => [new Date(t * 1000), closes[i]])
    .filter((pair) => pair[1] != null);
  return {
    series,
    provenance: {
      source: `Yahoo:${symbol}`,
      url: `chart/${symbol}?interval=1d`,
      fetchedAt: new Date().toISOString(),
      licence: 'quote-display',
    },
  };
}

/**
 * Monthly OHLC bars keyed by ym ('YYYY-MM-01'). The +12h shift lands each
 * bar's period-start timestamp inside its intended month regardless of the
 * exchange timezone (the CEST/UTC edge that mislabels ^GDAXI bars —
 * incident caught 2026-07-11 during the May-correction pass).
 */
export async function fetchYahooMonthlyBars(symbol, range = '2y') {
  const r = await withRetry(() => chart(symbol, range, '1mo'), { label: `Yahoo:${symbol}:1mo` });
  const ts = r.timestamp;
  const q = r.indicators.quote[0];
  const adj = r.indicators.adjclose?.[0]?.adjclose ?? null;
  const bars = new Map();
  ts.forEach((t, i) => {
    if (q.close[i] == null) return;
    const dt = new Date((t + 43200) * 1000);
    const ym = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-01`;
    if (!bars.has(ym)) {
      bars.set(ym, {
        ym,
        open: q.open[i],
        high: q.high[i],
        low: q.low[i],
        close: q.close[i],
        adjclose: adj ? adj[i] : null,
      });
    }
  });
  return {
    bars,
    provenance: {
      source: `Yahoo:${symbol}`,
      url: `chart/${symbol}?interval=1mo`,
      fetchedAt: new Date().toISOString(),
      licence: 'quote-display',
    },
  };
}
