/**
 * CoinGecko price provider — REAL prices for the six in-scope assets.
 *
 * $0-budget posture (decision G-3): works keyless against the public API
 * (low rate limit, generous server-side cache); when the founder's free Demo
 * key exists (`COINGECKO_API_KEY`), the same provider sends it — no code
 * change, higher headroom (100 calls/min, 10K/mo; cached responses free).
 *
 * Failure posture: degrade to documented fixtures with an honest stamp.
 */

import {
  FIXTURE_AS_OF,
  FIXTURE_FX_FROM_USD,
  FIXTURE_PRICES_USD,
  fixturePriceSeries,
} from '../fixtures';
import type {
  AssetId,
  DatedPricePoint,
  DisplayCurrency,
  IPriceProvider,
  PriceQuote,
  ProtocolId,
  ProtocolPriceHistory,
} from '../types';
import { PROTOCOL_RETURN_MODEL, SANDBOX_MARKET_TTL_MS } from '../types';

const API_BASE = 'https://api.coingecko.com/api/v3';

/** CoinGecko coin ids for the asset scope (BTC/ETH/SOL/SUI/USDC/XAUt). */
export const COINGECKO_IDS: Record<AssetId, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  SUI: 'sui',
  USDC: 'usd-coin',
  XAUT: 'tether-gold',
};

const VS: Record<DisplayCurrency, string> = { USD: 'usd', BRL: 'brl', EUR: 'eur' };

interface CacheEntry {
  at: number;
  value: Record<string, Record<string, number>>;
}

/** One cached call covers all assets × all three currencies.
 *  Founder-ruled 6 h (2026-08-19, was 5 min): sandbox market data refreshes at
 *  most every 6 hours — free-tier protection at visitor scale (see the
 *  defillama provider's TTL note + P2BD-14). */
const PRICE_TTL_MS = SANDBOX_MARKET_TTL_MS;
let priceCache: CacheEntry | null = null;

/** Daily-history cache, keyed by coin id. Same 6 h bound as every other market
 *  read — and it is load-bearing here, not a nicety: three uncached
 *  `market_chart` calls in quick succession returned HTTP 429 on the free tier
 *  (verified 2026-08-20), so at visitor scale the cache IS the rate-limit
 *  strategy. Daily granularity makes a 6 h TTL lossless anyway. */
const historyCache = new Map<string, { at: number; value: DatedPricePoint[] }>();

export class CoinGeckoPriceProvider implements IPriceProvider {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly apiKey: string | undefined = process.env.COINGECKO_API_KEY
  ) {}

  async getPrices(assetIds: AssetId[], currency: DisplayCurrency): Promise<PriceQuote[]> {
    try {
      const data = await this.fetchAll();
      const asOf = new Date().toISOString();
      return assetIds.map((assetId) => {
        const row = data[COINGECKO_IDS[assetId]];
        const price = row?.[VS[currency]];
        if (typeof price !== 'number') throw new Error(`missing price ${assetId}/${currency}`);
        return { assetId, currency, price, stamp: { source: 'coingecko', asOf } };
      });
    } catch {
      return assetIds.map((assetId) => ({
        assetId,
        currency,
        price: FIXTURE_PRICES_USD[assetId] * FIXTURE_FX_FROM_USD[currency],
        stamp: { source: 'fixture', asOf: FIXTURE_AS_OF },
      }));
    }
  }

  private async fetchAll(): Promise<Record<string, Record<string, number>>> {
    if (priceCache && Date.now() - priceCache.at < PRICE_TTL_MS) return priceCache.value;
    const ids = Object.values(COINGECKO_IDS).join(',');
    const vs = Object.values(VS).join(',');
    const headers: Record<string, string> = {};
    if (this.apiKey) headers['x-cg-demo-api-key'] = this.apiKey;
    const res = await this.fetchImpl(`${API_BASE}/simple/price?ids=${ids}&vs_currencies=${vs}`, {
      headers,
    });
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const body = (await res.json()) as Record<string, Record<string, number>>;
    priceCache = { at: Date.now(), value: body };
    return body;
  }

  /**
   * Daily closing prices for a `market` protocol leg (§4.8 G8).
   *
   * This is what lets a growth position FALL: the token's own price series IS
   * its total return, so the replay marks the position to price and adds
   * nothing on top (see `ProtocolReturnModel`). Ascending by date, oldest
   * first — the same shape `getApyHistory` returns, so the replay treats the
   * two series identically.
   *
   * Honest degradation (Principle 7): any failure — non-`market` leg, network,
   * rate limit, unexpected shape — returns the documented fixture series
   * stamped `fixture`, never a crash and never a silent live/fixture blend.
   */
  async getPriceHistory(protocolId: ProtocolId, days: number): Promise<ProtocolPriceHistory> {
    const model = PROTOCOL_RETURN_MODEL[protocolId];
    try {
      if (model.kind !== 'market') throw new Error('not a market-priced leg');
      const cached = historyCache.get(model.coingeckoId);
      let points: DatedPricePoint[];
      if (cached && Date.now() - cached.at < PRICE_TTL_MS) {
        points = cached.value;
      } else {
        const headers: Record<string, string> = {};
        if (this.apiKey) headers['x-cg-demo-api-key'] = this.apiKey;
        const res = await this.fetchImpl(
          `${API_BASE}/coins/${model.coingeckoId}/market_chart?vs_currency=usd&days=365&interval=daily`,
          { headers }
        );
        if (!res.ok) throw new Error(`coingecko market_chart ${res.status}`);
        const body = (await res.json()) as { prices?: Array<[number, number]> };
        if (!Array.isArray(body.prices) || body.prices.length === 0) {
          throw new Error('coingecko market_chart: unexpected shape');
        }
        points = body.prices.map(([ms, priceUsd]) => ({
          date: new Date(ms).toISOString().slice(0, 10),
          priceUsd,
        }));
        historyCache.set(model.coingeckoId, { at: Date.now(), value: points });
      }
      return {
        protocolId,
        points: points.slice(-days),
        stamp: { source: 'coingecko', asOf: new Date().toISOString() },
      };
    } catch {
      return {
        protocolId,
        points: fixturePriceSeries(protocolId, days),
        stamp: { source: 'fixture', asOf: FIXTURE_AS_OF },
      };
    }
  }
}
