'use client';

import { useId } from 'react';
import { useIntl } from 'react-intl';
import type { DatedApyPoint } from '@diboas/investing';
import styles from './ApyChart.module.css';

/** The timeframes the G6 detailed view offers (mockup 4-goal-strategy-2views-detailed). */
export const CHART_TIMEFRAMES = [7, 30, 90, 365] as const;
export type ChartTimeframe = (typeof CHART_TIMEFRAMES)[number];

const VIEW_W = 320;
const VIEW_H = 120;
const PAD_L = 4;
const PAD_R = 4;

/** Nice round % gridlines that always contain the series. */
function gridFor(max: number): number[] {
  const step = max <= 3 ? 1 : max <= 6 ? 2 : max <= 15 ? 5 : 10;
  const top = Math.max(step, Math.ceil(max / step) * step);
  const lines: number[] = [];
  for (let v = 0; v <= top; v += step) lines.push(v);
  return lines;
}

/**
 * The axed APY chart (G6, §4.6; mockup 4-goal-strategy-2views-detailed) — real
 * DeFiLlama history, never a projection. `Sparkline` has no axes, which is why
 * this exists: at the pre-commit moment the reader must be able to see WHAT the
 * numbers were and WHEN.
 *
 * Honesty properties: the y-axis always starts at 0% (a truncated axis
 * exaggerates movement — a chart lie), gridlines are round percentages, and the
 * x-axis is labelled with real dates from the data. Accessible without colour
 * or sight: the SVG carries a text description of the same span and range, and
 * the figure exposes the first/last readings as text.
 */
export function ApyChart({
  series,
  timeframe,
  onTimeframe,
  labelledBy,
}: {
  series: DatedApyPoint[];
  timeframe: ChartTimeframe;
  onTimeframe: (days: ChartTimeframe) => void;
  labelledBy?: string;
}) {
  const intl = useIntl();
  const titleId = useId();

  const points = series.slice(-timeframe);
  const values = points.map((p) => p.apyPercent);
  const max = values.length > 0 ? Math.max(...values) : 0;
  const grid = gridFor(max);
  const top = grid[grid.length - 1];

  const x = (i: number) =>
    points.length <= 1 ? PAD_L : PAD_L + (i * (VIEW_W - PAD_L - PAD_R)) / (points.length - 1);
  const y = (v: number) => VIEW_H - (v / top) * VIEW_H;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.apyPercent)}`).join(' ');
  const area =
    points.length > 0 ? `${line} L${x(points.length - 1)},${VIEW_H} L${PAD_L},${VIEW_H} Z` : '';

  const fmtDate = (iso: string) =>
    intl.formatDate(new Date(`${iso}T00:00:00`), { month: 'short', day: 'numeric' });
  const fmtPct = (v: number) => intl.formatNumber(v, { maximumFractionDigits: 1 });

  return (
    <figure className={styles.wrap} aria-labelledby={labelledBy}>
      <div
        className={styles.timeframes}
        role="group"
        aria-label={intl.formatMessage({ id: 'apyChart.timeframeLabel' })}
      >
        {CHART_TIMEFRAMES.map((days) => (
          <button
            key={days}
            type="button"
            className={styles.pill}
            aria-pressed={timeframe === days}
            data-active={timeframe === days}
            onClick={() => onTimeframe(days)}
          >
            {intl.formatMessage({ id: `apyChart.tf.${days}` })}
          </button>
        ))}
      </div>

      {points.length < 2 ? (
        <p className={styles.noData}>{intl.formatMessage({ id: 'apyChart.noData' })}</p>
      ) : (
        <div className={styles.plot}>
          <div className={styles.yAxis} aria-hidden>
            {[...grid].reverse().map((v) => (
              <span key={v}>{fmtPct(v)}%</span>
            ))}
          </div>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-labelledby={titleId}
          >
            <title id={titleId}>
              {intl.formatMessage(
                { id: 'apyChart.description' },
                {
                  from: fmtDate(points[0].date),
                  to: fmtDate(points[points.length - 1].date),
                  low: fmtPct(Math.min(...values)),
                  high: fmtPct(max),
                }
              )}
            </title>
            {grid.map((v) => (
              <line
                key={v}
                x1={PAD_L}
                x2={VIEW_W - PAD_R}
                y1={y(v)}
                y2={y(v)}
                className={styles.grid}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={area} className={styles.area} />
            <path d={line} className={styles.line} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}

      {points.length >= 2 ? (
        <figcaption className={styles.xAxis}>
          <span>{fmtDate(points[0].date)}</span>
          <span>{fmtDate(points[points.length - 1].date)}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
