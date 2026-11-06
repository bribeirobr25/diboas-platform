/**
 * PR 2 · guard 8 (P3 §6): months left are counted in the goal's own calendar frame, from the
 * month it was created — never the full horizon, never a 30-day approximation.
 */
import { describe, expect, it } from 'vitest';
import { goalMonthsLeft } from '../goalMonths';

/*
 * ⚑ Pinned to a NON-UTC zone (7th audit): CI runners are UTC, where local and UTC months agree,
 * so a switch to UTC months passed this suite there. Node reads TZ at each date operation.
 */
process.env.TZ = 'America/Sao_Paulo';

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

  it('should count LOCAL calendar months where they differ from UTC months (São Paulo, UTC−3)', () => {
    // 31 Jan 23:30 local = 1 Feb 02:30 UTC: created in JANUARY locally, February in UTC.
    const created = '2026-01-31T23:30:00-03:00';
    const now = new Date('2026-02-15T12:00:00-03:00');
    expect(new Date(created).getMonth()).toBe(0); // the pin is in force
    expect(goalMonthsLeft(12, created, now)).toBe(11);
  });
});
