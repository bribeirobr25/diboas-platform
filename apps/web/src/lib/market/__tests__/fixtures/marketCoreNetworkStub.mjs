/**
 * marketCoreNetworkStub.mjs — loaded with `node --import` into the CHILD
 * process that `partialWriteEntryPoint.test.ts` spawns, to drive the CORE run
 * of `run.mjs` (fetch -> quality gate -> engine -> computed.json -> archive)
 * without the network. Never imported by application code.
 *
 *   * the clock: `new Date()` / `Date.now()` return CORE_STUB_NOW;
 *   * the waits: `setTimeout` fires immediately (retry backoff takes no time);
 *   * the network: `fetch` answers only the six weekly sources (four FRED
 *     series, Yahoo daily BTC-USD and GC=F), Yahoo's monthly BTC bars and the
 *     CoinGecko month-boundary price used by `--append-btc`. Anything else is
 *     logged to CORE_STUB_LOG and refused.
 *
 * The values are SYNTHETIC and smooth: they exist to pass the fail-closed
 * quality gate, not to resemble a market. Every series ends one day before
 * the clock, so the test does not depend on the calendar it runs on.
 */
import fs from 'node:fs';

const LOG = process.env.CORE_STUB_LOG;
const NOW = Date.parse(process.env.CORE_STUB_NOW ?? '');
if (!LOG || !Number.isFinite(NOW)) {
  throw new Error('marketCoreNetworkStub: CORE_STUB_LOG and CORE_STUB_NOW are required');
}
/** The BTC monthly close the Yahoo bar and the CoinGecko verifier both report. */
export const STUB_BTC_MONTH_CLOSE = 61_000;

const RealDate = Date;
class FixedDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) super(NOW);
    else super(...args);
  }
  static now() {
    return NOW;
  }
}
globalThis.Date = FixedDate;

const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, _ms, ...rest) => realSetTimeout(fn, 0, ...rest);

const DAY = 86_400_000;
const LAST_DAY = NOW - DAY;

/** `count` daily points ending at LAST_DAY, value = f(i) for i = 0..count-1. */
function daily(count, f) {
  return Array.from({ length: count }, (_, i) => [LAST_DAY - (count - 1 - i) * DAY, f(i)]);
}

const FRED = {
  DTWEXBGS: () => daily(700, (i) => 120 - i * 0.002),
  DGS10: () => daily(700, (i) => 4 + 0.3 * Math.sin(i / 30)),
  NASDAQCOM: () => daily(700, (i) => 15_000 * 1.0004 ** i),
  // Monthly, first of the month, the last one about seven weeks before NOW.
  M2SL: () => {
    const end = new RealDate(NOW);
    return Array.from({ length: 40 }, (_, i) => {
      const t = RealDate.UTC(end.getUTCFullYear(), end.getUTCMonth() - 41 + i, 1);
      return [t, 20_000 + i * 40];
    });
  },
};

const YAHOO_DAILY = {
  'BTC-USD': () => daily(180, (i) => 55_000 * 1.001 ** i),
  'GC=F': () => daily(365, (i) => 2_000 * 1.0003 ** i),
};

function record(url, kind) {
  fs.appendFileSync(LOG, JSON.stringify({ url: url.split('?')[0], kind }) + '\n');
}

function json(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function yahooChart(points) {
  return json({
    chart: {
      result: [
        {
          timestamp: points.map(([t]) => Math.floor(t / 1000)),
          indicators: { quote: [{ close: points.map(([, v]) => v) }] },
        },
      ],
    },
  });
}

/** Twelve monthly BTC bars ending with the month before NOW's month. */
function yahooMonthly() {
  const end = new RealDate(NOW);
  const months = Array.from({ length: 12 }, (_, i) =>
    RealDate.UTC(end.getUTCFullYear(), end.getUTCMonth() - 12 + i, 1)
  );
  const close = months.map((_, i) => (i === 11 ? STUB_BTC_MONTH_CLOSE : 50_000 + i * 500));
  return json({
    chart: {
      result: [
        {
          timestamp: months.map((t) => t / 1000),
          indicators: {
            quote: [
              {
                open: close.map((c) => c * 0.98),
                high: close.map((c) => c * 1.05),
                low: close.map((c) => c * 0.95),
                close,
              },
            ],
          },
        },
      ],
    },
  });
}

globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url;
  const fred = /^https:\/\/fred\.stlouisfed\.org\/graph\/fredgraph\.csv\?id=([A-Z0-9]+)&/.exec(url);
  if (fred && FRED[fred[1]]) {
    record(url, `fred:${fred[1]}`);
    const rows = FRED[fred[1]]().map(
      ([t, v]) => `${new RealDate(t).toISOString().slice(0, 10)},${v}`
    );
    return new Response(`observation_date,${fred[1]}\n${rows.join('\n')}\n`, { status: 200 });
  }
  const yahoo =
    /^https:\/\/query1\.finance\.yahoo\.com\/v8\/finance\/chart\/([^?]+)\?range=[^&]+&interval=(1d|1mo)$/.exec(
      url
    );
  if (yahoo) {
    const symbol = decodeURIComponent(yahoo[1]);
    if (yahoo[2] === '1d' && YAHOO_DAILY[symbol]) {
      record(url, `yahoo:${symbol}`);
      return yahooChart(YAHOO_DAILY[symbol]());
    }
    if (yahoo[2] === '1mo' && symbol === 'BTC-USD') {
      record(url, 'yahoo:BTC-USD:1mo');
      return yahooMonthly();
    }
  }
  const gecko =
    /^https:\/\/api\.coingecko\.com\/api\/v3\/coins\/bitcoin\/market_chart\/range\?vs_currency=usd&from=(\d+)&to=(\d+)$/.exec(
      url
    );
  if (gecko) {
    record(url, 'coingecko');
    const mid = ((Number(gecko[1]) + Number(gecko[2])) / 2) * 1000;
    return json({ prices: [[mid, STUB_BTC_MONTH_CLOSE]] });
  }
  record(url, 'unexpected');
  throw new Error(`marketCoreNetworkStub: request refused (${url.split('?')[0]})`);
};
