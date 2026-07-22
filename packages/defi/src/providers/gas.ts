/**
 * Gas provider — MVP-0 ships the documented fixture implementation behind the
 * real interface (the swap seam). Live per-chain estimation (Solana
 * prioritization fees, Arbitrum/Ethereum RPC, Bitcoin mempool, Sui reference
 * gas) replaces this at Stage 1 (BUILD_ORDER 1.2) with zero call-site changes.
 */

import { FIXTURE_AS_OF, FIXTURE_GAS_USD } from '../fixtures';
import type { Chain, GasQuote, IGasProvider } from '../types';

export class FixtureGasProvider implements IGasProvider {
  async getGas(chain: Chain): Promise<GasQuote> {
    return {
      chain,
      typicalFeeUsd: FIXTURE_GAS_USD[chain],
      stamp: { source: 'fixture', asOf: FIXTURE_AS_OF },
    };
  }
}
