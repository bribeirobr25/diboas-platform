/**
 * GET /api/market?currency=USD|BRL|EUR
 *
 * The server-side data seam: providers run HERE (keys and caches stay
 * server-side — SANDBOX_RULES R-6), the client receives stamped values.
 * Returns current APYs for the six execution protocols, per-chain gas, and
 * the USDC local price (the honest USD→local conversion for gas display).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  CoinGeckoPriceProvider,
  DefiLlamaApyProvider,
  FixtureGasProvider,
  type Chain,
  type DisplayCurrency,
  type ProtocolId,
} from '@diboas/defi';
import { MARKET_CACHE_CONTROL, MARKET_ERROR_CACHE_CONTROL } from '@/lib/marketCacheHeaders';

const PROTOCOLS: ProtocolId[] = [
  'skySsr',
  'aaveV3',
  'compoundV3',
  'sanctumInf',
  'jupiterJlp',
  'jito',
];
/**
 * The chains the product actually enters on (`5.352`).
 *
 * Every strategy in the catalogue is Arbitrum or Solana, so quotes for
 * Ethereum/Bitcoin/Sui were fetched, serialised and shipped on every market
 * read while no surface could ever resolve them: `networkFeeLocal` and
 * `gasStampFor` both look a quote up by `strategy.entryChain`.
 */
const CHAINS: Chain[] = ['Arbitrum', 'Solana'];

const apyProvider = new DefiLlamaApyProvider();
const priceProvider = new CoinGeckoPriceProvider();
const gasProvider = new FixtureGasProvider();

function parseCurrency(value: string | null): DisplayCurrency {
  return value === 'BRL' || value === 'EUR' ? value : 'USD';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const currency = parseCurrency(request.nextUrl.searchParams.get('currency'));
  try {
    const [apys, usdcQuotes, gas] = await Promise.all([
      apyProvider.getCurrentApys(PROTOCOLS),
      priceProvider.getPrices(['USDC'], currency),
      Promise.all(CHAINS.map((chain) => gasProvider.getGas(chain))),
    ]);
    return NextResponse.json(
      {
        currency,
        apys,
        gas,
        /** Local units per 1 USD-pegged dollar (via the USDC quote). */
        /* ⚑ AUD-F05. `?? 1` asserted 1:1 parity with the ledger currency —
           a fabricated FX rate for BRL/EUR, not a neutral default. */
        usdPriceLocal: usdcQuotes[0]?.price ?? null,
        usdPriceStamp: usdcQuotes[0]?.stamp ?? null,
      },
      { headers: { 'Cache-Control': MARKET_CACHE_CONTROL } }
    );
  } catch {
    // Providers already fail open; this is the belt to their suspenders.
    return NextResponse.json(
      { error: 'market_unavailable' },
      { status: 503, headers: { 'Cache-Control': MARKET_ERROR_CACHE_CONTROL } }
    );
  }
}
