import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import type { LedgerState } from '@diboas/banking';
import { selectGoalProgress, selectHomeTriad } from '../home';

/**
 * The seam's own tests. No DOM, no network, no React — which is the property
 * `VIEW-1` exists to protect and the reason the honesty assertions live here
 * rather than in a render test.
 *
 * Every assertion below is a RESOLVED VALUE (a string, a number, a boolean),
 * never a flag that is supposed to produce one. That is the standing lesson
 * from I-1e, where 722 tests passed over a live re-tint because each asked
 * whether an attribute was absent instead of what colour actually resolved.
 */
const base = (over: Partial<LedgerState> = {}): LedgerState =>
  ({
    initialized: true,
    mode: 'b2c',
    currency: 'USD',
    simDay: 0,
    genesisRecordedAt: null,
    realSettledDays: 0,
    split: null,
    buckets: { working: '0.00', floor: '0.00', cushion: '0.00' },
    goals: [],
    positions: [],
    rules: [],
    recurring: [],
    networkFeesPaid: '0.00',
    exitFeesPaid: '0.00',
    credited: '0.00',
    events: [],
    ...over,
  }) as unknown as LedgerState;

describe('selectHomeTriad', () => {
  it('should sum the three tones to the hero total, so the headline cannot understate the balance', () => {
    const t = selectHomeTriad(
      base({
        buckets: { working: '100.00', floor: '50.00', cushion: '25.00' },
        goals: [{ goalId: 'g1', cash: '200.00' }],
        positions: [{ goalId: 'g1', open: true, principal: '300.00', accrued: '12.34' }],
      } as Partial<LedgerState>)
    );
    expect(t.available).toBe('150.00');
    expect(t.working).toBe('512.34');
    expect(t.emergency).toBe('25.00');
    expect(t.playBalance).toBe('687.34');
    // the identity, asserted rather than trusted
    expect(new Decimal(t.available).plus(t.working).plus(t.emergency).toFixed(2)).toBe(
      t.playBalance
    );
  });

  it('should count uninvested goal cash as working — the omission that once understated the hero', () => {
    const t = selectHomeTriad(
      base({
        buckets: { working: '0.00', floor: '0.00', cushion: '0.00' },
        goals: [{ goalId: 'g1', cash: '1000.00' }],
      } as Partial<LedgerState>)
    );
    expect(t.working).toBe('1000.00');
    expect(t.playBalance).toBe('1000.00');
  });

  it('should exclude closed positions from working', () => {
    const t = selectHomeTriad(
      base({
        positions: [
          { goalId: 'g1', open: false, principal: '999.00', accrued: '1.00' },
          { goalId: 'g1', open: true, principal: '10.00', accrued: '0.50' },
        ],
      } as Partial<LedgerState>)
    );
    expect(t.working).toBe('10.50');
  });

  it('should hide the emergency column at zero and show it the moment a producer writes to the bucket', () => {
    expect(selectHomeTriad(base()).showEmergency).toBe(false);
    expect(
      selectHomeTriad(
        base({
          buckets: { working: '0.00', floor: '0.00', cushion: '0.01' },
        } as Partial<LedgerState>)
      ).showEmergency
    ).toBe(true);
  });

  it('should return fixed 2-decimal strings, so no component needs Decimal to render money', () => {
    const t = selectHomeTriad(
      base({ buckets: { working: '1.5', floor: '0', cushion: '0' } } as Partial<LedgerState>)
    );
    expect(t.available).toBe('1.50');
    Object.entries(t).forEach(([k, v]) => {
      if (k !== 'showEmergency') expect(typeof v).toBe('string');
    });
  });
});

describe('selectGoalProgress', () => {
  const withGoal = (target: string, cash: string) =>
    base({ goals: [{ goalId: 'g1', targetAmount: target, cash }] } as Partial<LedgerState>);

  it('should derive the ratio and clamp it at 100', () => {
    expect(selectGoalProgress(withGoal('1000.00', '250.00'), 'g1').ratioPercent).toBe(25);
    expect(selectGoalProgress(withGoal('1000.00', '5000.00'), 'g1').ratioPercent).toBe(100);
  });

  it('should never call a target-less goal reached — 0 >= 0 would make every one complete', () => {
    const p = selectGoalProgress(withGoal('0.00', '500.00'), 'g1');
    expect(p.hasTarget).toBe(false);
    expect(p.targetReached).toBe(false);
    expect(p.ratioPercent).toBe(0);
  });

  it('should report reached exactly at the target, and un-reach if value falls back below it', () => {
    expect(selectGoalProgress(withGoal('1000.00', '1000.00'), 'g1').targetReached).toBe(true);
    expect(selectGoalProgress(withGoal('1000.00', '999.99'), 'g1').targetReached).toBe(false);
  });

  it('should return zeros for an unknown goal rather than throwing', () => {
    const p = selectGoalProgress(base(), 'nope');
    expect(p.current).toBe('0.00');
    expect(p.targetReached).toBe(false);
  });
});
