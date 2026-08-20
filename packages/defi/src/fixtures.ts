/**
 * Documented fixture values — the fail-open fallback layer for every provider
 * (Principle 7: never crash; degrade honestly). Every fixture carries the
 * `fixture` stamp so the UI can show its provenance (Data Vintage Policy):
 * fixtures are NEVER silently blended with live data.
 *
 * Sources (documented 2026-07-18):
 * - APYs: midpoints of the shipped per-strategy "typical annual return" ranges
 *   in `strategies.json` (protocol-level estimates consistent with that copy).
 * - Prices: order-of-magnitude placeholders for offline dev ONLY — the price
 *   provider is expected to reach CoinGecko in any networked environment.
 * - Gas: typical values researched for the PreDemo fee-display work
 *   (`apps/web/src/lib/pre-demo/feeRateDisplay.ts` lineage): sub-cent Solana,
 *   cents-level Arbitrum, dollars-level Ethereum L1 / Bitcoin.
 */

import type { AssetId, Chain, DataStamp, ProtocolApy, ProtocolId } from './types';

export const FIXTURE_AS_OF = '2026-07-18';

const stamp: DataStamp = { source: 'fixture', asOf: FIXTURE_AS_OF };

export const FIXTURE_APYS: Record<ProtocolId, Omit<ProtocolApy, 'protocolId'>> = {
  skySsr: { apyPercent: 6.5, tvlUsd: null, chain: 'Arbitrum', stamp },
  aaveV3: { apyPercent: 5.2, tvlUsd: null, chain: 'Arbitrum', stamp },
  compoundV3: { apyPercent: 4.8, tvlUsd: null, chain: 'Arbitrum', stamp },
  sanctumInf: { apyPercent: 8.5, tvlUsd: null, chain: 'Solana', stamp },
  jupiterJlp: { apyPercent: 14.0, tvlUsd: null, chain: 'Solana', stamp },
  jito: { apyPercent: 7.5, tvlUsd: null, chain: 'Solana', stamp },
};

/** Offline-dev placeholders only (USD). BRL/EUR derive via fixture FX below. */
export const FIXTURE_PRICES_USD: Record<AssetId, number> = {
  BTC: 60000,
  ETH: 2500,
  SOL: 140,
  SUI: 0.8,
  USDC: 1,
  XAUT: 2400,
};

/** Fixture FX for offline dev (documented placeholders, not market claims). */
export const FIXTURE_FX_FROM_USD: Record<'USD' | 'BRL' | 'EUR', number> = {
  USD: 1,
  BRL: 5.5,
  EUR: 0.92,
};

export const FIXTURE_GAS_USD: Record<Chain, number> = {
  Solana: 0.001,
  Arbitrum: 0.03,
  Ethereum: 2.5,
  Bitcoin: 1.8,
  Sui: 0.002,
};

/**
 * Fixture price anchors for the `market` legs (§4.8 G8), USD.
 *
 * `start`/`trough`/`end` are rounded from the REAL 365-day windows verified
 * against CoinGecko on 2026-08-20 — so the offline series has the same shape
 * as the live one, including the drawdown. Offline-dev/fallback ONLY; the
 * provider reaches CoinGecko in any networked environment.
 */
const FIXTURE_PRICE_SHAPE: Partial<
  Record<ProtocolId, { start: number; peak: number; end: number }>
> = {
  // Rounded from the REAL 365-day windows verified against CoinGecko
  // 2026-08-20 — Sanctum INF fell ~80% peak-to-trough, JitoSOL similarly,
  // Jupiter JLP ~46% (shallower; it accrues trading fees).
  sanctumInf: { start: 290, peak: 337, end: 70 },
  jito: { start: 260, peak: 305, end: 68 },
  jupiterJlp: { start: 5.4, peak: 5.9, end: 3.2 },
};

/**
 * A deterministic daily price series ending today: a short rise to a peak in
 * the first quarter, then a decline to `end` (which sits BELOW `start`).
 *
 * The shape is chosen for a specific reason. The replay anchors its span to the
 * NEWEST point, so a short advance only ever sees the TAIL of this series — a
 * fixture that troughs in the middle and recovers at the end would therefore
 * replay as a GAIN, and the down path would stay invisible offline no matter
 * how deep the mid-series dip was. Putting the decline in the tail is what
 * makes the fall reachable by both tests and a human running the app without
 * network access, which is the whole reason this fixture exists.
 *
 * Deterministic (no randomness) so replays reproduce exactly.
 */
export function fixturePriceSeries(
  protocolId: ProtocolId,
  days: number
): Array<{ date: string; priceUsd: number }> {
  const shape = FIXTURE_PRICE_SHAPE[protocolId] ?? { start: 100, peak: 115, end: 45 };
  const peakAt = Math.max(1, Math.floor(days * 0.25));
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const base =
      i <= peakAt
        ? shape.start + ((shape.peak - shape.start) * i) / peakAt
        : shape.peak + ((shape.end - shape.peak) * (i - peakAt)) / Math.max(1, days - 1 - peakAt);
    // Small deterministic texture so the line reads as a market, not a ramp —
    // never enough to reverse the trend.
    const wobble = 1 + 0.02 * Math.sin(i / 9);
    return { date: dayString(today, days - 1 - i), priceUsd: Number((base * wobble).toFixed(4)) };
  });
}

/** `YYYY-MM-DD` for `back` days before `from` (UTC). */
function dayString(from: Date, back: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
}
