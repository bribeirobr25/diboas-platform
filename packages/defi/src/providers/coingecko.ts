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
  FIXTURE_STAMP,
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
import { evidenceStamp } from '../types';
import { createRevalidatingCache, type RevalidatedEntry } from './revalidatingCache';
import { permitsUse } from '../providerDisposition';
import { fallbackFor } from '../fallbackEligibility';
import { originOf } from '../evidenceOrigin';
import { boundsRefusal } from '../evidenceBounds';
import { recordSourceOutcome } from '../sourceHealth';
import { sourceAssetId } from '../domainIdentity';
import { PROTOCOL_RETURN_MODEL, PROVIDER_FETCH_TIMEOUT_MS, SANDBOX_MARKET_TTL_MS } from '../types';

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

/** One cached call covers all assets × all three currencies.
 *  Founder-ruled 6 h (2026-08-19, was 5 min): sandbox market data refreshes at
 *  most every 6 hours — free-tier protection at visitor scale (see the
 *  defillama provider's TTL note + P2BD-14). */
const PRICE_TTL_MS = SANDBOX_MARKET_TTL_MS;
/* ⛑ Shared revalidation primitive — same TTL, same lazy request-driven timing,
   same single-call-covers-everything shape. Only the duplicated staleness
   check moved. */
const priceCache = createRevalidatingCache<Record<string, Record<string, number>>>(PRICE_TTL_MS);
const PRICE_KEY = 'prices';

/** Daily-history cache, keyed by coin id. Same 6 h bound as every other market
 *  read — and it is load-bearing here, not a nicety: three uncached
 *  `market_chart` calls in quick succession returned HTTP 429 on the free tier
 *  (verified 2026-08-20), so at visitor scale the cache IS the rate-limit
 *  strategy. Daily granularity makes a 6 h TTL lossless anyway. */
const historyCache = createRevalidatingCache<DatedPricePoint[]>(PRICE_TTL_MS);

/** This adapter's source identity. Declared once; never spelled at a call site. */
const SOURCE = 'coingecko' as const;

export class CoinGeckoPriceProvider implements IPriceProvider {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    /**
     * ⚑ AN ENTITLEMENT HEADER, NOT AN AUTHORIZATION. A present key upgrades the
     * free Demo tier's limits; it clears nothing and authorizes no expenditure.
     * `fallbackEligibility` states the rule this guards against: clearance is
     * never inferred from credentials being present.
     */
    private readonly apiKey: string | undefined = process.env.COINGECKO_API_KEY,
    private readonly timeoutMs: number = PROVIDER_FETCH_TIMEOUT_MS,
    /** The deployment's operational kill switch. See `DefiLlamaApyProvider`. */
    private readonly alsoDisabled?: ReadonlySet<string>
  ) {}

  /** The eligible fallback, or none. See `DefiLlamaApyProvider.mayServeFixture`. */
  private mayServeFixture(subject: Parameters<typeof fallbackFor>[0]): boolean {
    const decision = fallbackFor(subject, this.alsoDisabled);
    return decision.eligible && decision.source === 'fixture';
  }

  async getPrices(assetIds: AssetId[], currency: DisplayCurrency): Promise<PriceQuote[]> {
    try {
      /* The kill switch, before any request is issued. */
      if (!permitsUse(SOURCE, 'NEW_COLLECTION', this.alsoDisabled)) {
        throw new Error('source may not collect');
      }
      const entry = await this.fetchAll();
      recordSourceOutcome(SOURCE, 'SUCCESS');
      // When fetched, not when served (Data Vintage P-4) — see defillama.ts.
      const asOf = new Date(entry.at).toISOString();
      const quotes = assetIds.map((assetId): PriceQuote | null => {
        const row = entry.value[COINGECKO_IDS[assetId]];
        const price = row?.[VS[currency]];
        if (typeof price !== 'number') throw new Error(`missing price ${assetId}/${currency}`);
        /* §10 validation · plausible domain bounds. A corrupt price is REFUSED,
           never clamped into range — a clamped value is a fabricated one. The
           refusal reuses the existing per-leg omission below, so one bad asset
           cannot take the whole currency offline. */
        if (boundsRefusal('PRICE_CURRENT', price) !== null) return null;
        return {
          assetId,
          currency,
          price,
          /* The origin is LOOKED UP, not typed. `EXTERNAL SOURCE ≠ OBSERVED`
             (Strategy §5 · M&E Patch C · Product Patch B · Legal §3B ·
             Refresh §9): what this source supplies is a determination recorded
             in `evidenceOrigin.ts` with its basis, not a literal here. */
          stamp: evidenceStamp({ source: SOURCE, origin: originOf(SOURCE, 'PRICE_CURRENT'), asOf }),
        };
      });
      /* Refused legs are OMITTED, never zero-filled — the same rule the catch
         block below already applies, now reached by a bounds refusal too. */
      return quotes.filter((q): q is PriceQuote => q !== null);
    } catch {
      recordSourceOutcome(SOURCE, 'FAILURE');
      /* Refused legs are OMITTED, never zero-filled. `usdPriceLocal` then
         resolves to null, which `networkFeeLocal` already treats as "no rate" —
         the cost row is WITHHELD rather than computed against a fabricated 1:1
         (AUD-F05). Existing, authorized Product behaviour; nothing new. */
      if (!this.mayServeFixture('PRICE_CURRENT')) return [];
      return assetIds.map((assetId) => ({
        assetId,
        currency,
        price: FIXTURE_PRICES_USD[assetId] * FIXTURE_FX_FROM_USD[currency],
        stamp: FIXTURE_STAMP,
      }));
    }
  }

  private async fetchAll(): Promise<RevalidatedEntry<Record<string, Record<string, number>>>> {
    return priceCache.revalidate(PRICE_KEY, async () => {
      const ids = Object.values(COINGECKO_IDS).join(',');
      const vs = Object.values(VS).join(',');
      const headers: Record<string, string> = {};
      if (this.apiKey) headers['x-cg-demo-api-key'] = this.apiKey;
      const res = await this.fetchImpl(`${API_BASE}/simple/price?ids=${ids}&vs_currencies=${vs}`, {
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) throw new Error(`coingecko ${res.status}`);
      return (await res.json()) as Record<string, Record<string, number>>;
    });
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
  async getPriceHistory(
    protocolId: ProtocolId,
    days: number
  ): Promise<ProtocolPriceHistory | null> {
    const model = PROTOCOL_RETURN_MODEL[protocolId];
    try {
      if (model.kind !== 'market') throw new Error('not a market-priced leg');
      if (!permitsUse(SOURCE, 'NEW_COLLECTION', this.alsoDisabled)) {
        throw new Error('source may not collect');
      }
      /**
       * ⛑ TRANSPORT IDENTITY, RESOLVED AT THE ADAPTER (Block B).
       *
       * The domain names its own asset; how THIS source spells it is a lookup
       * in the per-source map. A source that cannot name the asset returns
       * `null` and the leg is refused — never guessed, and never resolved by a
       * vendor slug stored on a domain type.
       */
      const vendorId = sourceAssetId(SOURCE, model.asset);
      if (vendorId === null) throw new Error(`source does not name ${model.asset}`);
      const entry = await historyCache.revalidate(vendorId, async () => {
        const headers: Record<string, string> = {};
        if (this.apiKey) headers['x-cg-demo-api-key'] = this.apiKey;
        const res = await this.fetchImpl(
          `${API_BASE}/coins/${vendorId}/market_chart?vs_currency=usd&days=365&interval=daily`,
          { headers, signal: AbortSignal.timeout(this.timeoutMs) }
        );
        if (!res.ok) throw new Error(`coingecko market_chart ${res.status}`);
        const body = (await res.json()) as { prices?: Array<[number, number]> };
        if (!Array.isArray(body.prices) || body.prices.length === 0) {
          throw new Error('coingecko market_chart: unexpected shape');
        }
        const points: DatedPricePoint[] = body.prices.map(([ms, priceUsd]) => ({
          date: new Date(ms).toISOString().slice(0, 10),
          priceUsd,
        }));
        /* §10 bounds, ALL-OR-NOTHING for a series. One corrupt sample makes the
           SERIES unavailable rather than a hole silently interpolated — the
           `5.105` discipline, which the replay already depends on. */
        if (points.some((pt) => boundsRefusal('PRICE_HISTORY', pt.priceUsd) !== null)) {
          throw new Error('coingecko market_chart: point outside plausible bounds');
        }
        return points;
      });
      recordSourceOutcome(SOURCE, 'SUCCESS');
      return {
        protocolId,
        points: entry.value.slice(-days),
        stamp: evidenceStamp({
          source: SOURCE,
          origin: originOf(SOURCE, 'PRICE_HISTORY'),
          asOf: new Date(entry.at).toISOString(),
        }),
      };
    } catch {
      recordSourceOutcome(SOURCE, 'FAILURE');
      /* Eligibility first; a refused fallback is `null`, not a synthetic series. */
      if (!this.mayServeFixture('PRICE_HISTORY')) return null;
      return {
        protocolId,
        points: fixturePriceSeries(protocolId, days),
        stamp: FIXTURE_STAMP,
      };
    }
  }
}
