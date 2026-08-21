import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  apyFactorsForSpan,
  priceFactorsForSpan,
  replayLegged,
  type DailyApySeries,
  type DailyPriceSeries,
} from '../accrual';

/**
 * §4.8 G8 — the price replay's proof obligations (plan §5.2).
 *
 * These exist because the whole increment is one claim: practice money must be
 * able to go DOWN, and it must go down by exactly the amount the real market
 * moved — no more (double-count) and no less (a silent clamp).
 */
const flat = (n: number, price: number): DailyPriceSeries => ({
  points: Array.from({ length: n }, () => price),
  source: 'fixture',
});
const falling = (n: number, from: number, to: number): DailyPriceSeries => ({
  points: Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1)),
  source: 'fixture',
});

describe('priceFactorsForSpan — the shared-anchor contract (plan §5.1)', () => {
  it('should multiply to exactly the end/start price ratio over the span', () => {
    const s = falling(200, 100, 50);
    const f = priceFactorsForSpan(s, 0, 199, 199);
    const product = f.reduce((a, b) => a * b, 1);
    expect(product).toBeCloseTo(s.points[199] / s.points[0], 10);
  });

  it('should make a SEGMENTED replay identical to a single-call replay', () => {
    // The hazard: advancePlanner replays one segment per recurring deposit. If
    // each segment re-anchored to the newest price, the windows would overlap
    // and price movement would be counted twice. A shared anchor forbids it.
    const s = falling(120, 200, 80);
    const single = priceFactorsForSpan(s, 0, 90, 90);
    const segA = priceFactorsForSpan(s, 0, 30, 90);
    const segB = priceFactorsForSpan(s, 30, 60, 90);
    const segC = priceFactorsForSpan(s, 60, 90, 90);
    expect([...segA, ...segB, ...segC]).toEqual(single);
    const prod = (xs: number[]) => xs.reduce((a, b) => a * b, 1);
    expect(prod([...segA, ...segB, ...segC])).toBeCloseTo(prod(single), 12);
  });

  it('should re-anchoring per segment DOUBLE-COUNT (the bug this contract prevents)', () => {
    // Guard-rail proof: the naive version really is wrong, so the contract is
    // not ceremony. Re-anchoring each segment to its own end overlaps windows.
    const s = falling(120, 200, 80);
    const correct = priceFactorsForSpan(s, 0, 90, 90).reduce((a, b) => a * b, 1);
    const naive =
      priceFactorsForSpan(s, 0, 30, 30).reduce((a, b) => a * b, 1) *
      priceFactorsForSpan(s, 30, 60, 60).reduce((a, b) => a * b, 1) *
      priceFactorsForSpan(s, 60, 90, 90).reduce((a, b) => a * b, 1);
    expect(naive).not.toBeCloseTo(correct, 6);
  });
});

describe('replayLegged — mixed legs, and the no-double-count guard', () => {
  const apy: DailyApySeries = { points: Array.from({ length: 400 }, () => 7.3), source: 'fixture' };

  it('should return EXACTLY the principal for a market leg on a flat price (no APY sneaks in)', () => {
    // THE guard for the founder's double-count caveat: a market leg's price IS
    // its total return, so a flat price must mean zero earnings — if any APY
    // were being applied underneath, this would come back positive.
    const factors = priceFactorsForSpan(flat(400, 120), 0, 365, 365);
    const earnings = replayLegged(1000, [{ weightPercent: 100, factors }]);
    expect(earnings.toFixed(2)).toBe('0.00');
  });

  it('should return a NEGATIVE number when the price falls (the whole point)', () => {
    const factors = priceFactorsForSpan(falling(400, 300, 150), 0, 365, 365);
    const earnings = replayLegged(1000, [{ weightPercent: 100, factors }]);
    expect(earnings.lt(0)).toBe(true);
    // Halving the price roughly halves the money — no clamp, no floor at zero.
    expect(Number(earnings.toFixed(2))).toBeLessThan(-400);
  });

  it('should blend a lending leg and a market leg, each compounding on its own share', () => {
    const lending = apyFactorsForSpan(apy, 0, 365, 365);
    const market = priceFactorsForSpan(falling(400, 200, 100), 0, 365, 365);
    const mixed = replayLegged(1000, [
      { weightPercent: 60, factors: lending },
      { weightPercent: 40, factors: market },
    ]);
    const lendOnly = replayLegged(600, [{ weightPercent: 100, factors: lending }]);
    const mktOnly = replayLegged(400, [{ weightPercent: 100, factors: market }]);
    expect(mixed.toFixed(2)).toBe(lendOnly.plus(mktOnly).toFixed(2));
    // The gain on the stable 60% must not hide the loss on the growth 40%.
    expect(mixed.lt(0)).toBe(true);
  });

  it('should EARN on a lending-only replay (rule 1: a lending leg replays its APY)', () => {
    const lending = apyFactorsForSpan(apy, 0, 365, 365);
    // Strictly positive, not `gte(0)`: over a full year at a positive APY the
    // replay must produce a gain. `gte(0)` also passed when `replayLegged`
    // returned exactly zero — i.e. when lending replay was broken outright.
    expect(replayLegged(1000, [{ weightPercent: 100, factors: lending }]).gt(0)).toBe(true);
  });

  it('should be deterministic — the same span replays to the same cent', () => {
    const f = priceFactorsForSpan(falling(400, 300, 150), 0, 365, 365);
    expect(replayLegged(1234.56, [{ weightPercent: 100, factors: f }]).toFixed(2)).toBe(
      replayLegged(1234.56, [{ weightPercent: 100, factors: f }]).toFixed(2)
    );
  });
});
