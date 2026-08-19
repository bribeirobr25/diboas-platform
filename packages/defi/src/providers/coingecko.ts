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

import { FIXTURE_AS_OF, FIXTURE_FX_FROM_USD, FIXTURE_PRICES_USD } from '../fixtures';
import type { AssetId, DisplayCurrency, IPriceProvider, PriceQuote } from '../types';
import { SANDBOX_MARKET_TTL_MS } from '../types';

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
}
