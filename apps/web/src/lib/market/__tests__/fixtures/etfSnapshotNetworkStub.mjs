/**
 * etfSnapshotNetworkStub.mjs — loaded with `node --import` into the CHILD
 * process that `etfSnapshotOnly.test.ts` spawns. Never imported by
 * application code, and it changes nothing outside that child process.
 *
 * It fixes three things the snapshot run depends on:
 *   * the clock: `new Date()` / `Date.now()` return SNAPSHOT_STUB_NOW;
 *   * the waits: `setTimeout` fires immediately, so Polygon's 13 s pacing and
 *     the retry backoff take no time here. Production keeps its pacing: this
 *     file is the only place the timers change. Fetch deadlines use
 *     `AbortSignal.timeout`, which does not go through `setTimeout`;
 *   * the network: `fetch` answers only Polygon's ticker overview and Yahoo's
 *     5-day chart for the 11 snapshot funds. Every request is written to
 *     SNAPSHOT_STUB_LOG BEFORE it is answered, so a refused request stays
 *     visible to the test even when the application catches the error.
 *
 * SNAPSHOT_STUB_MODE: `ok` (default); `polygon-fail` (Polygon answers 500);
 * `incomplete` (Polygon answers the FIRST fixture fund without a share count,
 * so the run refuses the snapshot and writes refusal evidence instead).
 *
 * Fixture values come from SNAPSHOT_STUB_FIXTURE (JSON written by the test),
 * so the expected ledger line and the stub's answers have one source.
 */
import fs from 'node:fs';

const LOG = process.env.SNAPSHOT_STUB_LOG;
const MODE = process.env.SNAPSHOT_STUB_MODE ?? 'ok';
const FIXTURE = JSON.parse(process.env.SNAPSHOT_STUB_FIXTURE ?? '{}');
const NOW = Date.parse(process.env.SNAPSHOT_STUB_NOW ?? '');
if (!LOG || !Number.isFinite(NOW) || !FIXTURE.funds) {
  throw new Error('etfSnapshotNetworkStub: SNAPSHOT_STUB_LOG, _NOW and _FIXTURE are required');
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

const POLYGON = /^https:\/\/api\.polygon\.io\/v3\/reference\/tickers\/([A-Z]+)\?apiKey=/;
const YAHOO_5D =
  /^https:\/\/query1\.finance\.yahoo\.com\/v8\/finance\/chart\/([A-Z]+)\?range=5d&interval=1d$/;

function record(url, kind) {
  // The API key never reaches the log.
  const safe = url.replace(/apiKey=[^&]*/, 'apiKey=REDACTED');
  fs.appendFileSync(LOG, JSON.stringify({ url: safe, kind }) + '\n');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url;
  const polygon = POLYGON.exec(url);
  if (polygon && FIXTURE.funds[polygon[1]]) {
    record(url, 'polygon');
    if (MODE === 'polygon-fail') return json({ status: 'ERROR' }, 500);
    if (MODE === 'incomplete' && polygon[1] === Object.keys(FIXTURE.funds)[0]) {
      return json({ results: {} });
    }
    const fund = FIXTURE.funds[polygon[1]];
    return json({ results: { share_class_shares_outstanding: fund.shares } });
  }
  const yahoo = YAHOO_5D.exec(url);
  if (yahoo && FIXTURE.funds[yahoo[1]]) {
    record(url, 'yahoo-etf');
    const fund = FIXTURE.funds[yahoo[1]];
    const t = Math.floor(NOW / 1000);
    return json({
      chart: {
        result: [
          {
            timestamp: [t - 86_400, t],
            indicators: { quote: [{ close: [fund.price - 1, fund.price] }] },
          },
        ],
      },
    });
  }
  record(url, 'unexpected');
  throw new Error(`etfSnapshotNetworkStub: request refused (${url.split('?')[0]})`);
};
