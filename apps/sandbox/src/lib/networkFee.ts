import { isMultiNetworkCandidate } from '@diboas/defi';
import type { DataStamp, GasQuote, StrategyDef } from '@diboas/defi';

/**
 * Network fee for a chain, converted to the ledger currency for display.
 * Extracted from PathCard in §4.6 when that component was absorbed into
 * StrategyDetail (board §3.2) — the helper is pure and has consumers beyond
 * any one surface (the goal-detail entry/exit paths compute it too).
 */
export function networkFeeLocal(
  gas: GasQuote[],
  strategy: StrategyDef,
  usdPriceLocal: number | null
): number | null {
  /**
   * `5.406` containment · A MULTI-NETWORK CANDIDATE HAS NO TRUTHFUL
   * WHOLE-CANDIDATE NETWORK COST.
   *
   * Five of the ten catalogue strategies hold `skySsr` — an **Arbitrum**
   * lending leg — at 70/65/60/30/15% of allocation while declaring
   * `entryChain: 'Solana'`. The legacy single `entryChain` quote therefore
   * priced one network's fee as though it covered the whole composition:
   * `0.001 x FX` renders as *about $0.00* for a position up to 70% Arbitrum,
   * where that leg's own quote is `0.03`.
   *
   * Founder/Strategy 2026-09-17 §4: whole-Candidate network cost =
   * **UNAVAILABLE**. Per §4 this must NOT sum per-leg gas and must NOT model
   * bridge/swap/routing cost — so the refusal returns before any arithmetic
   * that could do either exists.
   *
   * This takes the STRATEGY, not a bare chain, deliberately: the predicate then
   * holds at every call site by construction, and a future caller cannot bypass
   * containment by passing `entryChain` directly. The full per-leg cost model is
   * I-3 and is NOT pulled forward.
   */
  if (isMultiNetworkCandidate(strategy)) return null;
  /**
   * ⚑ AUD-F05 · handoff §8.7 `MISSING ≠ 0`. This read
   * `(quote?.typicalFeeUsd ?? 0) * usdPriceLocal`, so a chain with no gas quote
   * produced a confident **0.00** — and the entry path committed that zero into
   * the event log as the transaction's real cost.
   *
   * TWO independent inputs, each with its own source and vintage (§3): the
   * network-fee OBSERVATION and the FX CONVERSION. Either one missing makes the
   * result unknown, and unknown is `null` — never zero, and never carried
   * forward from something else.
   */
  const quote = gas.find((g) => g.chain === strategy.entryChain);
  if (!quote || usdPriceLocal === null) return null;
  return quote.typicalFeeUsd * usdPriceLocal;
}

/**
 * The gas stamp for a chain — or the explicit `'missing'` marker.
 *
 * It lives HERE, next to `networkFeeLocal`, because the two must resolve the
 * same quote by the same key. `StrategyDetail` passed `gas[0]?.stamp`, and the
 * route's first chain was `'Solana'`, so every Arbitrum strategy (five of the
 * ten, including every stable one) stamped its provenance from SOLANA's gas
 * while displaying ARBITRUM's fee. Two chains, one sentence.
 *
 * Absence returns `'missing'`, never `undefined`: `undefined` means *no fee is
 * rendered on this surface* and must keep meaning that (§8.7 `MISSING ≠ 0`
 * applied to provenance — an unknown fee is not an absent one).
 */
export function gasStampFor(
  gas: GasQuote[],
  chain: StrategyDef['entryChain']
): DataStamp | 'missing' {
  return gas.find((g) => g.chain === chain)?.stamp ?? 'missing';
}
