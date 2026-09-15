import { describe, expect, it } from 'vitest';
import type { PracticeDecomposition } from '@/lib/practiceSeries';
import { selectTimeMachineView } from '@/view/timeMachine';

function decomposition(over: Partial<PracticeDecomposition> = {}): PracticeDecomposition {
  return {
    points: [
      { simDay: 0, value: 1000 },
      { simDay: 30, value: 1000 },
    ],
    start: 1000,
    end: 1000,
    market: 0,
    contributed: 0,
    entered: 0,
    exited: 0,
    identityHolds: true,
    ...over,
  };
}

describe('selectTimeMachineView', () => {
  /**
   * AUD-F01, reproduced from the auditor's own figures: market −155.24 while
   * 1,000.00 was deposited, start 1,000.00, end 1,844.76. The balance rose; the
   * market fell. The screen said "it grew".
   */
  it('should describe the MARKET direction, not the balance direction', () => {
    const d = decomposition({
      start: 1000,
      end: 1844.76,
      market: -155.24,
      contributed: 1000,
    });

    // The old derivation, kept as the contrast: balance start/end says "grew".
    expect(d.end).toBeGreaterThan(d.start);

    expect(selectTimeMachineView(d).trend).toBe('fell');
  });

  it('should not claim a direction the market did not move in', () => {
    expect(selectTimeMachineView(decomposition({ market: 0.2 })).trend).toBe('flat');
    expect(selectTimeMachineView(decomposition({ market: 100 })).trend).toBe('grew');
  });

  /**
   * AUD-F02: an entry of 100 and an exit of 100 net to zero, and the old net
   * test let the percentage reappear even though the exposed principal changed
   * twice.
   */
  it('should suppress the percentage when principal moved and then cancelled out', () => {
    const d = decomposition({ entered: 100, exited: 100, market: 0.03 });

    expect(d.contributed + d.entered - d.exited).toBe(0); // the old rule saw nothing

    const v = selectTimeMachineView(d);
    expect(v.principalChanged).toBe(true);
    expect(v.marketPercent).toBeNull();
  });

  it('should suppress the percentage for a deposit, an entry or an exit alone', () => {
    for (const over of [{ contributed: 200 }, { entered: 200 }, { exited: 200 }]) {
      const v = selectTimeMachineView(decomposition({ ...over, market: 10 }));
      expect(v.principalChanged).toBe(true);
      expect(v.marketPercent).toBeNull();
    }
  });

  /** The one case a percentage IS a return: nothing but market movement. */
  it('should report the percentage when the exposed principal held still', () => {
    const v = selectTimeMachineView(decomposition({ end: 1100, market: 100 }));
    expect(v.principalChanged).toBe(false);
    expect(v.marketPercent).toBeCloseTo(10, 10);
  });

  /**
   * AUD-F03: the screen never read `identityHolds`, so it explained a
   * decomposition that does not reconcile.
   */
  it('should refuse to explain a stretch whose decomposition does not reconcile', () => {
    const v = selectTimeMachineView(
      decomposition({ start: 200, end: 201.58, market: 1.58, entered: 100, identityHolds: false })
    );
    expect(v.explainable).toBe(false);
    expect(v.marketPercent).toBeNull();
  });

  it('should report no stretch at all below two points', () => {
    expect(selectTimeMachineView(decomposition({ points: [] })).hasHistory).toBe(false);
    expect(
      selectTimeMachineView(decomposition({ points: [{ simDay: 0, value: 10 }] })).hasHistory
    ).toBe(false);
  });

  it('should pass the value line through untouched for the sparkline', () => {
    expect(selectTimeMachineView(decomposition()).values).toEqual([1000, 1000]);
  });
});
