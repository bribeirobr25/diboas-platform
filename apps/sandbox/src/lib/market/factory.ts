/**
 * Market-provider factory — the provider-selection seam (`5.243`).
 *
 * Before this, `api/market/route.ts` and `api/market/history/route.ts` each did
 * `new DefiLlamaApyProvider()` / `new CoinGeckoPriceProvider()` /
 * `new FixtureGasProvider()` at MODULE SCOPE. Principle 3 asks for a factory,
 * and this app already had the pattern for the auth seam
 * (`lib/auth/factory.ts`, selecting by environment presence) — this is the same
 * shape for market data, so swapping a provider stops meaning "edit the routes".
 *
 * ⚑ PROVIDER SELECTION ≠ MODE SELECTION (canon 2026-09-18 §5, Founder §6).
 * Nothing here reads Practice/Real, `LedgerScope`, or any mode flag. Selection
 * is by capability/environment only. A Real route-quote provider would be
 * chosen the same way — by what is configured, not by which mode is asking.
 *
 * ⚑ NO NEW PROVIDER IS ACTIVATED BY THIS SEAM. Each port resolves to exactly
 * the implementation the app already used; the branch point exists, and the
 * second arm arrives with an authorized source (F/G). Adding one here would be
 * out of scope for the Pre-F batch.
 */

import {
  CoinGeckoPriceProvider,
  DefiLlamaApyProvider,
  FixtureGasProvider,
  type IApyProvider,
  type IGasProvider,
  type IPriceProvider,
} from '@diboas/defi';

let apy: IApyProvider | null = null;
let price: IPriceProvider | null = null;
let gas: IGasProvider | null = null;

/** APY evidence. One instance per process, so the ruled 6 h cache is shared. */
export function getApyProvider(): IApyProvider {
  if (!apy) apy = new DefiLlamaApyProvider();
  return apy;
}

/** Price / FX evidence. */
export function getPriceProvider(): IPriceProvider {
  if (!price) price = new CoinGeckoPriceProvider();
  return price;
}

/**
 * Network-cost evidence.
 *
 * Today this is the documented fixture provider — the only implementation that
 * exists. It is resolved through the seam rather than constructed at a call
 * site so that the day a collector-backed provider is authorized, the change is
 * here and nowhere else.
 */
export function getGasProvider(): IGasProvider {
  if (!gas) gas = new FixtureGasProvider();
  return gas;
}

/** Test-only: drop the memoised instances (mirrors `__resetAuthProvider`). */
export function __resetMarketProviders(): void {
  apy = null;
  price = null;
  gas = null;
}
