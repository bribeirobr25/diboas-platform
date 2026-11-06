/**
 * PR 2 · guard 8 (P3 §6): months left are counted in the goal's own calendar frame, from the
 * month it was created — never the full horizon, never a 30-day approximation.
 */
import { describe, expect, it } from 'vitest';
import { goalMonthsLeft } from '../goalMonths';

const NOW = new Date(2026, 10, 5, 12); // 5 Nov 2026, local

describe('PR 2 · goalMonthsLeft', () => {
  it('should give the full horizon to a goal created this month', () => {
    expect(goalMonthsLeft(48, new Date(2026, 10, 1).toISOString(), NOW)).toBe(48);
  });

  it('should subtract the calendar months since creation', () => {
    expect(goalMonthsLeft(48, new Date(2024, 10, 20).toISOString(), NOW)).toBe(24);
  });

  it('should clamp to 0 past the horizon and to the horizon when the clock is before creation', () => {
    expect(goalMonthsLeft(12, new Date(2024, 0, 31).toISOString(), NOW)).toBe(0);
    expect(goalMonthsLeft(12, new Date(2027, 5, 1).toISOString(), NOW)).toBe(12);
  });

  it('should count a calendar month at a month end (Jan 31 to Feb 1 is one month)', () => {
    expect(
      goalMonthsLeft(12, new Date(2026, 0, 31, 23).toISOString(), new Date(2026, 1, 1, 1))
    ).toBe(11);
  });

  it('should give null for a missing or unparseable creation stamp', () => {
    expect(goalMonthsLeft(12, 'not a date', NOW)).toBeNull();
    expect(goalMonthsLeft(12, null, NOW)).toBeNull();
    expect(goalMonthsLeft(12, undefined, NOW)).toBeNull();
  });
});
