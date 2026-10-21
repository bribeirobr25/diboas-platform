import { describe, expect, it } from 'vitest';
import type { LedgerState } from '@diboas/banking';
import { expenseImpacts } from '../simulatedEvents';

/**
 * Lane audit 2026-10-21 (C5): what Available pays is derived ONCE, in the domain, in
 * decimal, and it is the same formula the card used: the expense minus what the goal's
 * cash gave (the whole expense when no goal cash moves, including a pending split).
 */
const stateWith = (working: string, cash: string) =>
  ({
    buckets: { floor: '0.00', cushion: '0.00', working },
    goals: [{ goalId: 'g', status: 'active', cash }],
  }) as unknown as LedgerState;

describe('restFromAvailable is the expense minus the goal cash used (C5)', () => {
  const state = stateWith('5000.00', '2000.00');

  it('should be the whole expense when Available covers it', () => {
    const [impact] = expenseImpacts(state, 1500, {
      coverFromAvailable: true,
      reserveGoalIds: [],
      splitGoalIds: [],
    });
    expect(impact.restFromAvailable).toBe(1500);
  });

  it('should be nothing when the reserve covers it', () => {
    const [impact] = expenseImpacts(state, 1500, {
      coverFromAvailable: false,
      reserveGoalIds: ['g'],
      splitGoalIds: [],
    });
    expect(impact.restFromAvailable).toBe(0);
  });

  it('should be the expense minus the share entered, and the whole expense while pending', () => {
    const options = { coverFromAvailable: false, reserveGoalIds: [], splitGoalIds: ['g'] };
    expect(expenseImpacts(state, 1500, options, { g: 400.1 })[0].restFromAvailable).toBe(1099.9);
    expect(expenseImpacts(state, 1500, options)[0].restFromAvailable).toBe(1500);
  });
});
