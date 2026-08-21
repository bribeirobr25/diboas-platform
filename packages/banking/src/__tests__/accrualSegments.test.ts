import { describe, expect, it } from 'vitest';
import { RECURRING_CADENCE_DAYS, accrualSegmentDays } from '../ledger/cadence';

/**
 * §4.8 — the accrual segment grid. Its whole job is to give the time machine's
 * chart and the History trail a real path instead of one year-long jump, WITHOUT
 * changing anything for a position that already had a monthly plan.
 */
describe('accrualSegmentDays', () => {
  it('should be a NO-OP where a monthly plan already segments the span', () => {
    // The property the whole change rests on: RECURRING_CADENCE_DAYS IS the
    // grid step, so a running plan produces exactly its old boundaries.
    const deposits = [30, 60, 90];
    expect(accrualSegmentDays(0, 90, deposits)).toEqual([30, 60, 90]);
  });

  it('should segment a plan-less year monthly instead of emitting one jump', () => {
    const segs = accrualSegmentDays(0, 360);
    expect(segs).toHaveLength(12);
    expect(segs[0]).toBe(30);
    expect(segs[segs.length - 1]).toBe(360);
  });

  it('should DEDUPE a deposit landing on a grid day (no zero-length segment)', () => {
    // Without dedupe this yields 30 twice → an "earned 0.00" noise row (L3).
    const segs = accrualSegmentDays(0, 60, [30]);
    expect(segs).toEqual([30, 60]);
    expect(new Set(segs).size).toBe(segs.length);
  });

  it('should always close on toDay, and never emit a boundary past it', () => {
    for (const [from, to] of [
      [0, 7],
      [0, 45],
      [12, 100],
      [100, 101],
    ]) {
      const segs = accrualSegmentDays(from, to);
      expect(segs[segs.length - 1], `${from}->${to}`).toBe(to);
      expect(Math.max(...segs), `${from}->${to}`).toBeLessThanOrEqual(to);
      expect(Math.min(...segs), `${from}->${to}`).toBeGreaterThan(from);
    }
  });

  it('should return nothing for an empty or backwards span', () => {
    expect(accrualSegmentDays(30, 30)).toEqual([]);
    expect(accrualSegmentDays(30, 10)).toEqual([]);
  });

  it('should be ascending, unique, and deterministic', () => {
    const a = accrualSegmentDays(5, 200, [70, 40, 70]);
    const b = accrualSegmentDays(5, 200, [70, 40, 70]);
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(a);
    expect(new Set(a).size).toBe(a.length);
  });

  it('should keep a sub-cadence span as a single segment', () => {
    // A +1 month advance is ONE window — the grid must not manufacture steps
    // that no replay actually produced.
    expect(accrualSegmentDays(0, RECURRING_CADENCE_DAYS)).toEqual([RECURRING_CADENCE_DAYS]);
  });
});
