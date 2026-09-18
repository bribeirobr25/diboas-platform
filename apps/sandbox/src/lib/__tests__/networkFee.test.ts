import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP, getStrategy, observedStamp } from '@diboas/defi';
import type { GasQuote } from '@diboas/defi';
import { gasStampFor, networkFeeLocal } from '@/lib/networkFee';

const ARBITRUM: GasQuote = {
  chain: 'Arbitrum',
  typicalFeeUsd: 0.03,
  stamp: FIXTURE_STAMP,
};

const SOLANA_QUOTE: GasQuote = {
  chain: 'Solana',
  typicalFeeUsd: 0.001,
  stamp: FIXTURE_STAMP,
};

/**
 * `5.406` · `networkFeeLocal` now takes the STRATEGY, because the multi-network
 * refusal is a property of the Candidate and not of a chain string. These two
 * are the real catalogue entries, resolved through `getStrategy` rather than
 * hand-built, so a catalogue change cannot leave this file asserting a topology
 * the product no longer has.
 */
const SINGLE = getStrategy('safeHarbor')!; // Arbitrum x3 legs
const MULTI = getStrategy('stableGrowth')!; // skySsr 70% Arbitrum + sanctumInf 30% Solana

describe('networkFeeLocal — MISSING is not zero (handoff §8.7, AUD-F05)', () => {
  it('should convert a present quote into the ledger currency', () => {
    expect(networkFeeLocal([ARBITRUM], SINGLE, 1)).toBeCloseTo(0.03, 10);
    expect(networkFeeLocal([ARBITRUM], SINGLE, 5.4)).toBeCloseTo(0.162, 10);
  });

  /**
   * The defect this exists to prevent: the old body was
   * `(quote?.typicalFeeUsd ?? 0) * usdPriceLocal`, which answered a confident
   * 0.00 for a chain it had no observation for — and the entry committed that
   * zero to the ledger as the move's real cost.
   */
  it('should report an UNKNOWN fee as null, never as a free transaction', () => {
    // The entry chain (Arbitrum) has no quote in this list.
    const fee = networkFeeLocal([SOLANA_QUOTE], SINGLE, 1);
    expect(fee).toBeNull();
    expect(fee).not.toBe(0);
  });

  it('should report an unknown FX conversion as null, not as 1:1 parity', () => {
    expect(networkFeeLocal([ARBITRUM], SINGLE, null)).toBeNull();
  });

  it('should report null when it has neither input', () => {
    expect(networkFeeLocal([], SINGLE, null)).toBeNull();
  });
});

/**
 * X1 (system gate, 2026-09-17): the entry network fee is DERIVED AT TWO SITES and
 * `5.347`'s user-facing reason depends on them agreeing.
 *
 * - `GoalDetailScreen:139` computes `feeLocal` and gates the CTA on
 *   `canPriceEntry = feeLocal !== null` (FC-15: no honest price, no operable
 *   control).
 * - `StrategyDetail:80` computes `fee` from the same inputs and, since
 *   Increment 2, SELECTS WHICH REASON the disabled CTA shows: `fee === null`
 *   renders the approved refusal string, anything else renders the amount hint.
 *
 * If those two ever disagree, the screen shows a disabled control with the wrong
 * explanation — precisely the defect `5.347` was raised to remove. The agreement
 * is structural (same function, same `entryChain`, same FX), so it holds by
 * construction — but nothing asserted it, and `canPriceEntry` appeared in ZERO
 * test files while `GoalDetailScreen:143` itself states the VIEW-2 rule that a
 * money guard must be "derived and unit-tested rather than computed in the render
 * body". X1 is exactly this: where a second derivation is deliberate, a test must
 * assert the two AGREE.
 */
describe('X1 — the two entry-fee derivations agree, so the refusal reason is never wrong', () => {
  /** GoalDetailScreen:139 + :142, as written. */
  const canPriceEntry = (gas: GasQuote[], fx: number | null) =>
    networkFeeLocal(gas, SINGLE, fx) !== null;
  /** StrategyDetail:80 + the 5.347 branch, as written. */
  const showsRefusalReason = (gas: GasQuote[], fx: number | null) =>
    networkFeeLocal(gas, SINGLE, fx) === null;

  /* Typed explicitly rather than with `as const`: that made the fixtures
     `readonly [GasQuote] | readonly []`, and the readonly->mutable cast it then
     needed is an illegal conversion (TS2352). Casting through `unknown` would
     have silenced the mismatch instead of removing it. */
  const cases: readonly [label: string, gas: GasQuote[], fx: number | null][] = [
    ['a priceable entry', [ARBITRUM], 1],
    ['no quote for the entry chain', [], 1],
    ['no FX to the ledger currency', [ARBITRUM], null],
    ['neither input', [], null],
  ];

  it.each(cases)('should never disable the CTA and show the amount hint — %s', (_case, gas, fx) => {
    // The CTA is operable EXACTLY when the refusal reason is not shown.
    expect(canPriceEntry(gas, fx)).toBe(!showsRefusalReason(gas, fx));
  });

  it('should show the refusal reason in every case that blocks the entry', () => {
    // Sabotage target: a StrategyDetail branch keyed on anything other than the
    // same `networkFeeLocal` result would break one of these pairs.
    const blocking: readonly [GasQuote[], number | null][] = [
      [[], 1],
      [[ARBITRUM], null],
      [[], null],
    ];
    for (const [gas, fx] of blocking) {
      expect(canPriceEntry(gas, fx)).toBe(false);
      expect(showsRefusalReason(gas, fx)).toBe(true);
    }
    // …and never when the entry IS priceable.
    expect(canPriceEntry([ARBITRUM], 1)).toBe(true);
    expect(showsRefusalReason([ARBITRUM], 1)).toBe(false);
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

/**
 * `5.406` containment — the materially governing predicate.
 *
 * Founder/Strategy 2026-09-17 §4: a Candidate spanning two networks has no
 * truthful whole-Candidate network cost, so it is UNAVAILABLE — never one
 * network's gas presented as the whole, never `sum(per-leg gas)`.
 */
describe('5.406 — a multi-network Candidate has no whole-Candidate network cost', () => {
  it('should refuse a multi-network Candidate EVEN WHEN its entryChain has a quote', () => {
    /* This is the whole finding: `stableGrowth` declares `entryChain: 'Solana'`
       and Solana's quote is present, so the legacy path answered a confident
       0.001 x FX — "about $0.00" — for a composition that is 70% Arbitrum,
       where that leg's own quote is 0.03. A present quote is exactly the case
       that used to LOOK fine. */
    const fee = networkFeeLocal([SOLANA_QUOTE, ARBITRUM], MULTI, 1);
    expect(fee).toBeNull();
    expect(fee).not.toBe(0);
    // And not the per-leg sum either (§4 forbids summing): 0.031 must not appear.
    expect(fee).not.toBeCloseTo(0.031, 10);
  });

  it('should keep pricing a genuinely single-network Candidate (§7 regression boundary)', () => {
    expect(networkFeeLocal([SOLANA_QUOTE, ARBITRUM], SINGLE, 1)).toBeCloseTo(0.03, 10);
  });

  it('should refuse for every multi-network strategy and price every single-network one', () => {
    /* The classification is proven across all ten in `catalog.test.ts`; this
       asserts the CONSEQUENCE at the money boundary, which is where an
       untruthful figure would actually reach a reader. */
    const gas = [SOLANA_QUOTE, ARBITRUM];
    const multi = [
      'stableGrowth',
      'steadyProgress',
      'balancedBuilder',
      'wealthAccelerator',
      'fullThrottle',
    ];
    const single = [
      'safeHarbor',
      'goalKeeper',
      'patientBuilder',
      'steadyCompounder',
      'fullHarvest',
    ];
    for (const id of multi) {
      expect(networkFeeLocal(gas, getStrategy(id)!, 1), id).toBeNull();
    }
    for (const id of single) {
      expect(networkFeeLocal(gas, getStrategy(id)!, 1), id).not.toBeNull();
    }
  });
});
