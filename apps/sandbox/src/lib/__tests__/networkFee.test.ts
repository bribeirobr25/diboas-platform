import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP } from '@diboas/defi';
import type { GasQuote } from '@diboas/defi';
import { networkFeeLocal } from '@/lib/networkFee';

const ARBITRUM: GasQuote = {
  chain: 'Arbitrum',
  typicalFeeUsd: 0.03,
  stamp: FIXTURE_STAMP,
};

describe('networkFeeLocal — MISSING is not zero (handoff §8.7, AUD-F05)', () => {
  it('should convert a present quote into the ledger currency', () => {
    expect(networkFeeLocal([ARBITRUM], 'Arbitrum', 1)).toBeCloseTo(0.03, 10);
    expect(networkFeeLocal([ARBITRUM], 'Arbitrum', 5.4)).toBeCloseTo(0.162, 10);
  });

  /**
   * The defect this exists to prevent: the old body was
   * `(quote?.typicalFeeUsd ?? 0) * usdPriceLocal`, which answered a confident
   * 0.00 for a chain it had no observation for — and the entry committed that
   * zero to the ledger as the move's real cost.
   */
  it('should report an UNKNOWN fee as null, never as a free transaction', () => {
    const fee = networkFeeLocal([ARBITRUM], 'Solana', 1);
    expect(fee).toBeNull();
    expect(fee).not.toBe(0);
  });

  it('should report an unknown FX conversion as null, not as 1:1 parity', () => {
    expect(networkFeeLocal([ARBITRUM], 'Arbitrum', null)).toBeNull();
  });

  it('should report null when it has neither input', () => {
    expect(networkFeeLocal([], 'Ethereum', null)).toBeNull();
  });
});
