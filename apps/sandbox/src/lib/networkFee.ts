import type { GasQuote, StrategyDef } from '@diboas/defi';

/**
 * Network fee for a chain, converted to the ledger currency for display.
 * Extracted from PathCard in §4.6 when that component was absorbed into
 * StrategyDetail (board §3.2) — the helper is pure and has consumers beyond
 * any one surface (the goal-detail entry/exit paths compute it too).
 */
export function networkFeeLocal(
  gas: GasQuote[],
  chain: StrategyDef['entryChain'],
  usdPriceLocal: number
): number {
  const quote = gas.find((g) => g.chain === chain);
  return (quote?.typicalFeeUsd ?? 0) * usdPriceLocal;
}
