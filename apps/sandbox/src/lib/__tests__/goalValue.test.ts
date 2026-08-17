import { describe, it, expect } from 'vitest';
import { project, type LedgerEvent, type LedgerState } from '@diboas/banking';
import { goalCurrentValue, goalTargetReached } from '../goalValue';

let n = 0;
const base = () => ({
  eventId: `e${(n += 1)}`,
  simDay: 0,
  recordedAt: '2026-07-24T00:00:00.000Z',
  correlationId: 't',
});

/** A state with one goal `g1` of the given target, holding `funded` cash. */
function stateWithGoal(target: string, funded: string): LedgerState {
  const evs: LedgerEvent[] = [
    { ...base(), type: 'PlayMoneyGranted', amount: '10000.00', currency: 'USD', mode: 'b2c' },
    { ...base(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
    {
      ...base(),
      type: 'GoalCreated',
      goalId: 'g1',
      name: 'Trip',
      icon: 'plane',
      targetAmount: target,
      horizonMonths: 24,
    },
    { ...base(), type: 'GoalFunded', goalId: 'g1', amount: funded },
  ];
  return project(evs);
}

describe('goalValue — current value + derived target_reached', () => {
  it('should sum goal cash + open positions for the current value', () => {
    expect(goalCurrentValue(stateWithGoal('3000.00', '1200.00'), 'g1').toFixed(2)).toBe('1200.00');
  });

  it('should derive target_reached: false below target, true at or above (never stored)', () => {
    expect(goalTargetReached(stateWithGoal('3000.00', '1200.00'), 'g1')).toBe(false);
    expect(goalTargetReached(stateWithGoal('1000.00', '1000.00'), 'g1')).toBe(true); // exactly at target
    expect(goalTargetReached(stateWithGoal('1000.00', '1500.00'), 'g1')).toBe(true); // above
  });

  it('should never mark a zero/absent target as reached', () => {
    expect(goalTargetReached(stateWithGoal('0.00', '500.00'), 'g1')).toBe(false);
  });

  it('should treat an unknown goal as zero-value and not reached', () => {
    const st = stateWithGoal('3000.00', '1000.00');
    expect(goalCurrentValue(st, 'nope').toFixed(2)).toBe('0.00');
    expect(goalTargetReached(st, 'nope')).toBe(false);
  });
});
