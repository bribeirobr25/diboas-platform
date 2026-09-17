import type { DataStamp, GasQuote, StrategyDef } from '@diboas/defi';

/**
 * Network fee for a chain, converted to the ledger currency for display.
 * Extracted from PathCard in §4.6 when that component was absorbed into
 * StrategyDetail (board §3.2) — the helper is pure and has consumers beyond
 * any one surface (the goal-detail entry/exit paths compute it too).
 */
export function networkFeeLocal(
  gas: GasQuote[],
  chain: StrategyDef['entryChain'],
  usdPriceLocal: number | null
): number | null {
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
  const quote = gas.find((g) => g.chain === chain);
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
