/**
 * In-repo monthlies provider (P2 Stage 1) — reader + gated appender for
 * apps/web/src/lib/market-data/data/monthlyPrices.json (BTC leg).
 *
 * The appender NEVER writes directly from a fetch: `run.mjs` only calls it
 * after the quality gate passes the dual-source verification (Yahoo primary,
 * CoinGecko verifier, ≤0.5% tolerance).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../../../../..');
export const MONTHLY_PRICES_PATH = path.join(
  REPO_ROOT,
  'apps/web/src/lib/market-data/data/monthlyPrices.json'
);

export function readMonthlyPrices() {
  return JSON.parse(fs.readFileSync(MONTHLY_PRICES_PATH, 'utf8'));
}

export function btcMonths() {
  return readMonthlyPrices().BTC.months;
}

/**
 * Append a verified BTC monthly candle. Refuses duplicates and out-of-order
 * appends (the F1 unique-ym invariant lives in the stress harness too).
 * Rounding matches the existing BTC rows (4 decimals).
 */
export function appendBtcMonth({ ym, open, high, low, close }) {
  const raw = readMonthlyPrices();
  const months = raw.BTC.months;
  if (months.some((m) => m.ym === ym)) {
    throw new Error(`appendBtcMonth: ${ym} already present — refusing duplicate append`);
  }
  if (months.length && months[months.length - 1].ym >= ym) {
    throw new Error(
      `appendBtcMonth: ${ym} is not after the last row ${months[months.length - 1].ym}`
    );
  }
  const r4 = (x) => Math.round(x * 10000) / 10000;
  months.push({ ym, open: r4(open), high: r4(high), low: r4(low), close: r4(close) });
  fs.writeFileSync(MONTHLY_PRICES_PATH, JSON.stringify(raw, null, 2) + '\n');
  return months[months.length - 1];
}
