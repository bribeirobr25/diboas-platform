import { classifyTrend, type PracticeDecomposition, type ValueTrend } from '@/lib/practiceSeries';

/**
 * `view/timeMachine.ts` — the time-machine surface's selector.
 *
 * ## Why this exists (AUD-C02)
 *
 * `TimeMachineScreen` derived four truths in its render body: the stretch's
 * direction, whether the exposed principal moved, the return percentage, and
 * the value array. Three of them were wrong, and each was wrong in a way a
 * component review does not catch — which is the whole argument for this layer.
 */
export interface TimeMachineView {
  /**
   * The gate on every claim below (AUD-F03). The screen's own comment promised
   * "when it does not hold, the amounts still show and the explanation does
   * not" — but nothing read `identityHolds`, so the explanation always showed.
   */
  explainable: boolean;
  /** Two points or more; below that there is no stretch to describe. */
  hasHistory: boolean;
  /**
   * The MARKET's direction — never the balance's (AUD-F01). `classifyTrend(start,
   * end)` folded the user's own deposits in, so a stretch where the market lost
   * 155.24 while 1,000.00 was deposited reported *"it grew"*. That is 5.199's
   * class: the user's act described as market performance.
   */
  trend: ValueTrend;
  /**
   * True when ANY principal movement happened (AUD-F02). The old test was
   * `|contributed + entered − exited| > 0.005` — the NET — so a 100 entry and a
   * 100 exit cancelled and the percentage came back, despite two real changes
   * to the exposed principal.
   */
  principalChanged: boolean;
  /**
   * A percentage ONLY when the exposed principal held still for the whole
   * stretch AND the decomposition reconciles. Otherwise an honest rate needs a
   * time-weighted derivation, which this lane has no authority to invent — so
   * the figure is absent rather than wrong.
   */
  marketPercent: number | null;
  /** The value line, for the sparkline. */
  values: number[];
}

/** Cent tolerance: the terms are Decimal, the line is stored as numbers. */
const CENT = 0.005;

export function selectTimeMachineView(d: PracticeDecomposition): TimeMachineView {
  const principalChanged = d.contributed > CENT || d.entered > CENT || d.exited > CENT;

  const explainable = d.identityHolds;

  return {
    explainable,
    hasHistory: d.points.length >= 2,
    trend: classifyTrend(d.start, d.start + d.market),
    principalChanged,
    marketPercent:
      explainable && !principalChanged && d.start > 0 ? (d.market / d.start) * 100 : null,
    values: d.points.map((p) => p.value),
  };
}
