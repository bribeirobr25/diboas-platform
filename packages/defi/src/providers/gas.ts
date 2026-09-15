/**
 * Gas provider — MVP-0 ships the documented fixture implementation behind the
 * real interface (the swap seam). Live per-chain estimation (Solana
 * prioritization fees, Arbitrum/Ethereum RPC, Bitcoin mempool, Sui reference
 * gas) replaces this at Stage 1 (BUILD_ORDER 1.2) with zero call-site changes.
 */

import { FIXTURE_GAS_USD, FIXTURE_STAMP } from '../fixtures';
import type { Chain, GasQuote, IGasProvider } from '../types';

export class FixtureGasProvider implements IGasProvider {
  async getGas(chain: Chain): Promise<GasQuote> {
    return {
      chain,
      typicalFeeUsd: FIXTURE_GAS_USD[chain],
      /* Fixture-only provider today: the stamp says so, including fallbackUsed. */
      stamp: FIXTURE_STAMP,
    };
  }
}
