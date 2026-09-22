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
  FallbackOnlyApyProvider,
  FallbackOnlyPriceProvider,
  FixtureGasProvider,
  isSourceUsable,
  type IApyProvider,
  type IGasProvider,
  type IPriceProvider,
} from '@diboas/defi';
import { disabledSources } from './killSwitch';

let apy: IApyProvider | null = null;
let price: IPriceProvider | null = null;
let gas: IGasProvider | null = null;

/**
 * APY evidence. One instance per process, so the ruled 6 h cache is shared.
 *
 * ⚑ THE KILL SWITCH IS ENFORCED BY NOT BUILDING THE ADAPTER. A source that may
 * not be used never reaches `new DefiLlamaApyProvider()`, so the object holding
 * the endpoint, the fetch implementation and the timeout is never created —
 * there is nothing present that COULD issue a request. The adapter also guards
 * collection internally, and both are kept: the internal guard covers an
 * adapter constructed by a test or a future caller, this one covers the app.
 */
export function getApyProvider(): IApyProvider {
  if (!apy) {
    const disabled = disabledSources();
    apy = isSourceUsable('defillama', disabled)
      ? new DefiLlamaApyProvider(undefined, undefined, disabled)
      : new FallbackOnlyApyProvider(disabled);
  }
  return apy;
}

/** Price / FX evidence. Same switch, same reason. */
export function getPriceProvider(): IPriceProvider {
  if (!price) {
    const disabled = disabledSources();
    price = isSourceUsable('coingecko', disabled)
      ? new CoinGeckoPriceProvider(undefined, undefined, undefined, disabled)
      : new FallbackOnlyPriceProvider(disabled);
  }
  return price;
}

/**
 * Network-cost evidence.
 *
 * Today this is the documented fixture provider — the only implementation that
 * exists. It is resolved through the seam rather than constructed at a call
 * site so that the day a collector-backed provider is authorized, the change is
 * here and nowhere else.
 *
 * ⚑ STATED SCOPE LIMIT, not an oversight. The ruling asks for independent
 * EXTERNAL-source disablement, and this port has no external source: it reads
 * diBoaS-authored constants and issues no request, so there is nothing here a
 * kill switch could stop. Disabling `fixture` therefore does NOT refuse network
 * cost as a primary — but it does refuse the fixture as a FALLBACK for the two
 * external ports, which `fallbackFor` enforces by re-asking the substitute's
 * own disposition. The day a collector-backed gas provider is authorized, it
 * gets the same treatment as the two above, and `GasQuote` becomes refusable
 * then — widening it now would be speculative API for a source that does not
 * exist.
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
