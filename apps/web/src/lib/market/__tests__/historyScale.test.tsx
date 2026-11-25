/**
 * The history chart's scale comes from the data (market clean-up C2-S G2, register `5.915`).
 *
 * The chart drew a hard-coded 14-point axis. Now the scale is the regime's `max_score`, else the
 * methodology's, else the ratified 14, so the chart renders whenever it has history (during a
 * regime outage too, as on `main`); the ticks, their step and the phone-crowding rule follow it,
 * and a score above the scale stays inside the drawing.
 *
 * @vitest-environment happy-dom
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoricalRegimeChart } from '@/components/Analytics/HistoricalRegimeChart/HistoricalRegimeChart';
import { historyChartMax, scoreTicks } from '../historyAxis';

describe('5.915: the history chart reads its scale from the data', () => {
  it('should take the regime scale, else the methodology scale, else the ratified 14', () => {
    expect(historyChartMax(12, 14)).toBe(12);
    expect(historyChartMax(null, 20)).toBe(20);
    expect(historyChartMax(undefined, 16)).toBe(16);
    expect(historyChartMax(null, null)).toBe(14);
    expect(historyChartMax(0, Number.NaN)).toBe(14);
    expect(historyChartMax(3e7, 14)).toBe(14); // not a plausible scale
  });

  it('should step so the labels stay apart, and end on the maximum', () => {
    expect(scoreTicks(14)).toEqual([0, 3, 6, 9, 12, 14]);
    expect(scoreTicks(12)).toEqual([0, 2, 4, 6, 8, 10, 12]);
    expect(scoreTicks(20)).toEqual([0, 5, 10, 15, 20]);
    expect(scoreTicks(30)).toEqual([0, 5, 10, 15, 20, 25, 30]);
    expect(scoreTicks(5)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(scoreTicks(Number.POSITIVE_INFINITY)).toEqual([]);
    expect(scoreTicks(0)).toEqual([]);
  });

  it('should keep the history chart in the shell whatever the regime (its condition names no regime)', () => {
    const shell = readFileSync(
      join(__dirname, '../../../app/[locale]/(landing)/market/MarketViewShell.tsx'),
      'utf8'
    );
    expect(shell).toContain(
      'historyChartMax(regime?.max_score, initialData.methodology?.max_score)'
    );
    const section = shell.slice(
      shell.lastIndexOf(
        "{view.grammar === 'scored'",
        shell.indexOf('sectionId="market-historical"')
      ),
      shell.indexOf('sectionId="market-historical"')
    );
    expect(section).toMatch(/historical\.snapshots\.length > 0/);
    expect(section).not.toMatch(/\bregime\b|maxScore/);
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
    expect(axisLabels(chart(12).container)).toEqual(['0', '2', '4', '6', '8', '10', '12']);
    expect(axisLabels(chart(14).container)).toEqual(['0', '3', '6', '9', '12', '14']);
  });

  it('should redraw the line when the scale changes (the memo follows the scale)', () => {
    const view = chart(14);
    const before = view.container.querySelector('path')?.getAttribute('d');
    view.rerender(
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
        maxScore={28}
      />
    );
    expect(view.container.querySelector('path')?.getAttribute('d')).not.toBe(before);
  });

  it('should draw the line through the dots, on the scale it is given', () => {
    for (const max of [14, 28]) {
      const { container } = chart(max);
      const d = container.querySelector('path')?.getAttribute('d') ?? '';
      const pathYs = [...d.matchAll(/[ML] [\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]).toFixed(2));
      const dotYs = [...container.querySelectorAll('circle')].map((c) =>
        Number(c.getAttribute('cy')).toFixed(2)
      );
      expect(pathYs).toEqual(dotYs);
    }
  });

  it('should keep a score above the scale inside the drawing', () => {
    const high = [
      { date: '2026-10-06', score: 16, regime_code: 'CONSTRUCTIVE' },
      { date: '2026-10-13', score: 9, regime_code: 'CONSTRUCTIVE' },
    ] as never;
    const { container } = render(
      <HistoricalRegimeChart
        data={{ snapshots: high }}
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
        maxScore={14}
      />
    );
    for (const dot of container.querySelectorAll('circle'))
      expect(Number(dot.getAttribute('cy'))).toBeGreaterThanOrEqual(0);
  });

  it('should mark only a label too close to the next as crowded (12 under 14), in drawing units', () => {
    const crowded = (c: HTMLElement) =>
      [...c.querySelectorAll('svg text')]
        .filter((t) => (t.getAttribute('class') ?? '').includes('Crowded'))
        .map((t) => t.textContent);
    expect(crowded(chart(14).container)).toEqual(['12']);
    expect(crowded(chart(12).container)).toEqual([]);
    expect(crowded(chart(20).container)).toEqual([]);
    expect(crowded(chart(30).container)).toEqual([]);
  });
});
