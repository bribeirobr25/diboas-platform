/**
 * toolsMonthliesNetworkStub.mjs — loaded with `node --import` into the CHILD
 * process that `toolsMonthliesCommand.test.ts` spawns. Never imported by
 * application code; it changes nothing outside that child process.
 *
 *   * the clock: `new Date()` / `Date.now()` return TOOLS_STUB_NOW;
 *   * the waits: `setTimeout` fires immediately (retry backoff takes no time);
 *   * the network: `fetch` answers only Yahoo's monthly chart for the tickers
 *     in TOOLS_STUB_FIXTURE. Every request is written to TOOLS_STUB_LOG BEFORE
 *     it is answered, so a refused request stays visible to the test even when
 *     the application catches the error. Anything else answers 500 and is
 *     logged as `unexpected`.
 *
 * TOOLS_STUB_FIXTURE: `{ "<ticker>": [{ ym, open, high, low, close, adjclose }] }`.
 */
import fs from 'node:fs';

const LOG = process.env.TOOLS_STUB_LOG;
const FIXTURE = JSON.parse(process.env.TOOLS_STUB_FIXTURE ?? 'null');
const NOW = Date.parse(process.env.TOOLS_STUB_NOW ?? '');
if (!LOG || !Number.isFinite(NOW) || !FIXTURE) {
  throw new Error('toolsMonthliesNetworkStub: TOOLS_STUB_LOG, _NOW and _FIXTURE are required');
}

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

const MONTHLY =
  /^https:\/\/query1\.finance\.yahoo\.com\/v8\/finance\/chart\/([^?]+)\?range=2y&interval=1mo$/;
const record = (url, kind) => fs.appendFileSync(LOG, `${JSON.stringify({ url, kind })}\n`);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url;
  const m = MONTHLY.exec(url);
  const ticker = m ? decodeURIComponent(m[1]) : null;
  if (!ticker || !FIXTURE[ticker]) {
    record(url, 'unexpected');
    return json({ error: 'unexpected request' }, 500);
  }
  record(url, 'yahoo-monthly');
  const bars = FIXTURE[ticker];
  const col = (k) => bars.map((b) => b[k]);
  return json({
    chart: {
      result: [
        {
          timestamp: bars.map((b) => Date.parse(`${b.ym}T00:00:00Z`) / 1000),
          indicators: {
            quote: [{ open: col('open'), high: col('high'), low: col('low'), close: col('close') }],
            adjclose: [{ adjclose: col('adjclose') }],
          },
        },
      ],
    },
  });
};
