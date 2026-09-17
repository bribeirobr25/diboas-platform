import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP, observedStamp } from '@diboas/defi';
import type { GasQuote } from '@diboas/defi';
import { gasStampFor, networkFeeLocal } from '@/lib/networkFee';

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

describe('gasStampFor — the stamp must describe the chain whose fee is shown', () => {
  const SOLANA = {
    chain: 'Solana' as const,
    typicalFeeUsd: 0.001,
    stamp: observedStamp('defillama', '2026-09-17'),
  };

  it('should resolve BY CHAIN, not by array position', () => {
    // The defect: `gas[0]?.stamp` with the route's old ['Solana', ...] order
    // stamped every Arbitrum strategy from Solana's quote.
    expect(gasStampFor([SOLANA, ARBITRUM], 'Arbitrum')).toBe(FIXTURE_STAMP);
    expect(gasStampFor([SOLANA, ARBITRUM], 'Solana')).toBe(SOLANA.stamp);
  });

  it('should report an absent quote as MISSING, never as undefined', () => {
    // `undefined` means "no fee on this surface" and must keep meaning that.
    expect(gasStampFor([ARBITRUM], 'Solana')).toBe('missing');
    expect(gasStampFor([], 'Arbitrum')).toBe('missing');
    expect(gasStampFor([ARBITRUM], 'Solana')).not.toBeUndefined();
  });
});
