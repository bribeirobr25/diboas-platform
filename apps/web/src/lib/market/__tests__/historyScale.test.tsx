/**
 * The history chart's scale comes from the data (market clean-up C2-S G2, register `5.915`).
 *
 * The chart drew a hard-coded 14-point axis and the shell hid it whenever the regime was missing,
 * though the outage banner promises "the historical archive remains available". Now the scale is
 * the regime's `max_score`, else the methodology's; the ticks and the phone-crowding rule follow it.
 *
 * @vitest-environment happy-dom
 */
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoricalRegimeChart } from '@/components/Analytics/HistoricalRegimeChart/HistoricalRegimeChart';
import { historyChartMax, scoreTicks } from '../historyAxis';

describe('5.915: the history chart reads its scale from the data', () => {
  it('should take the regime scale, else the methodology scale, else none', () => {
    expect(historyChartMax(12, 14)).toBe(12);
    expect(historyChartMax(null, 14)).toBe(14);
    expect(historyChartMax(undefined, 14)).toBe(14);
    expect(historyChartMax(null, null)).toBeNull();
    expect(historyChartMax(0, Number.NaN)).toBeNull();
  });

  it('should tick every 3 points and end on the maximum', () => {
    expect(scoreTicks(14)).toEqual([0, 3, 6, 9, 12, 14]);
    expect(scoreTicks(12)).toEqual([0, 3, 6, 9, 12]);
    expect(scoreTicks(Number.POSITIVE_INFINITY)).toEqual([]);
    expect(scoreTicks(0)).toEqual([]);
  });

  const snapshots = [
    { date: '2026-10-06', score: 6, regime_code: 'NEUTRAL_MIXED' },
    { date: '2026-10-13', score: 9, regime_code: 'CONSTRUCTIVE' },
  ] as never;
  const chart = (maxScore: number) =>
    render(
      <HistoricalRegimeChart
        data={{ snapshots }}
        range="1Y"
        ariaLabel="score"
        tableLabels={{ date: 'Date', score: 'Score', regime: 'Regime' }}
        regimeLabels={{
          VERY_FAVORABLE: 'a',
          CONSTRUCTIVE: 'b',
          NEUTRAL_MIXED: 'c',
          DEFENSIVE: 'd',
          HOSTILE: 'e',
        }}
        dateLabels={{}}
        monthLabels={{}}
        maxScore={maxScore}
      />
    );
  const axisLabels = (c: HTMLElement) =>
    [...c.querySelectorAll('svg text')]
      .map((t) => t.textContent)
      .filter((t) => /^\d+$/.test(t ?? ''));

  it('should draw the axis of the scale it is given, not a fixed 14', () => {
    expect(axisLabels(chart(12).container)).toEqual(['0', '3', '6', '9', '12']);
    expect(axisLabels(chart(14).container)).toEqual(['0', '3', '6', '9', '12', '14']);
  });

  it('should mark only a label too close to the next as crowded (12 under 14), in drawing units', () => {
    const crowded = (c: HTMLElement) =>
      [...c.querySelectorAll('svg text')]
        .filter((t) => (t.getAttribute('class') ?? '').includes('Crowded'))
        .map((t) => t.textContent);
    expect(crowded(chart(14).container)).toEqual(['12']);
    expect(crowded(chart(12).container)).toEqual([]);
  });
});
