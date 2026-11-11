'use client';

import { useId, useMemo } from 'react';
import type { HistoricalRegimes, RegimeCode } from '@/lib/analytics-sdk/types';
import { historicalMonthTicks, monthLabelGap, snapshotDayTime } from '@/lib/market/historyAxis';
import styles from './HistoricalRegimeChart.module.css';

interface HistoricalRegimeChartProps {
  data: Pick<HistoricalRegimes, 'snapshots'>;
  range: '3M' | '6M' | '1Y';
  ariaLabel: string;
  reducedMotion?: boolean;
  tableLabels: { date: string; score: string; regime: string };
  /** Translated band labels for the table (a screen reader heard the raw code). */
  regimeLabels: Record<RegimeCode, string>;
  /**
   * The table's dates as display text, keyed by ISO day, formatted on the
   * server (`historicalDateLabels`) so the browser never re-formats them.
   * The ISO day stays in `<time dateTime>`.
   */
  dateLabels: Record<string, string>;
  /**
   * Short month names for the time axis, keyed `YYYY-MM`, formatted on the
   * server (`historicalMonthLabels`). A month with no label gets no tick.
   */
  monthLabels: Record<string, string>;
  className?: string;
}

const VIEWBOX_W = 720;
const VIEWBOX_H = 240;
const PADDING = { top: 16, right: 24, bottom: 32, left: 40 };
const CHART_W = VIEWBOX_W - PADDING.left - PADDING.right;
const CHART_H = VIEWBOX_H - PADDING.top - PADDING.bottom;
const MAX_SCORE = 14;
const Y_TICKS = [0, 3, 6, 9, 12, 14];
// Warm editorial ramp (B5 / F-2, 2026-07-13): repointed off the semantic
// green/amber/red stoplight tokens — that grammar reads as buy/sell (Q3
// advisory) and clashed with the warm /market palette. The ramp runs
// teal-deep, teal, ink-soft, deep-copper, rust (the same copper/teal
// family as the RegimeScore gauge arc and RegimeLabel pill fills), so the
// chart, gauge, and pill share one warm system with no green-up/red-down read.
// VERY_FAVORABLE takes the deepest teal so the colour-only points stay
// all-five distinguishable (the pill can merge it with CONSTRUCTIVE because it
// also carries a text label). Do-not-regress: implementation-notes.md (F-2).
const POINT_FILL_BY_REGIME: Record<RegimeCode, string> = {
  VERY_FAVORABLE: 'var(--editorial-teal-deep)',
  CONSTRUCTIVE: 'var(--editorial-teal)',
  NEUTRAL_MIXED: 'var(--editorial-ink-soft)',
  DEFENSIVE: 'var(--editorial-defensive)',
  HOSTILE: 'var(--editorial-hostile)',
};

function rangeToCount(range: HistoricalRegimeChartProps['range']): number {
  return range === '3M' ? 13 : range === '6M' ? 26 : 52;
}

export function HistoricalRegimeChart({
  data,
  range,
  ariaLabel,
  reducedMotion = false,
  tableLabels,
  regimeLabels,
  dateLabels,
  monthLabels,
  className,
}: HistoricalRegimeChartProps) {
  const tableId = useId();

  // Chronological first (a date axis needs it; the writer only appends), then
  // the newest `count`.
  const snapshots = useMemo(() => {
    const count = rangeToCount(range);
    const ordered = [...data.snapshots].sort((a, b) =>
      a.date.slice(0, 10) < b.date.slice(0, 10)
        ? -1
        : a.date.slice(0, 10) > b.date.slice(0, 10)
          ? 1
          : 0
    );
    return ordered.slice(-count);
  }, [data.snapshots, range]);

  // Date-scaled, not index-scaled (5.176 (c)): two runs a day apart sit a day
  // apart, and a gap between runs shows as a gap. One point, or all on one day,
  // sits in the middle; an unreadable date falls back to the index axis.
  const { startTime, spanMs, dateScaled } = useMemo(() => {
    const times = snapshots.map((s) => snapshotDayTime(s.date));
    const start = times[0] ?? 0;
    const end = times[times.length - 1] ?? 0;
    return {
      startTime: start,
      spanMs: end - start,
      dateScaled: times.every((time) => Number.isFinite(time)),
    };
  }, [snapshots]);
  const xAtTime = (time: number) =>
    spanMs > 0
      ? PADDING.left + ((time - startTime) / spanMs) * CHART_W
      : PADDING.left + CHART_W / 2;
  const xScale = (i: number) =>
    dateScaled
      ? xAtTime(snapshotDayTime(snapshots[i]!.date))
      : PADDING.left +
        (snapshots.length <= 1 ? CHART_W / 2 : (i / (snapshots.length - 1)) * CHART_W);
  const yScale = (score: number) => PADDING.top + CHART_H - (score / MAX_SCORE) * CHART_H;

  const path = useMemo(
    () =>
      snapshots
        .map(
          (s, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(s.score).toFixed(2)}`
        )
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshots]
  );

  const monthTicks = useMemo(
    () =>
      dateScaled
        ? historicalMonthTicks(
            snapshots.map((s) => s.date),
            xAtTime,
            {
              left: PADDING.left,
              right: PADDING.left + CHART_W,
              minGap: monthLabelGap(monthLabels),
            }
          ).filter((tick) => monthLabels[tick.key] !== undefined)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshots, monthLabels]
  );

  return (
    <figure className={`${styles.figure} ${className ?? ''}`}>
      <svg
        role="img"
        aria-labelledby={`${tableId}-title`}
        aria-describedby={tableId}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg}
      >
        <title id={`${tableId}-title`}>{ariaLabel}</title>
        {Y_TICKS.map((t, i) => (
          <g key={`yt-${t}`}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + CHART_W}
              y1={yScale(t)}
              y2={yScale(t)}
              className={styles.gridLine}
            />
            <text
              x={PADDING.left - 8}
              y={yScale(t) + 4}
              textAnchor="end"
              className={
                // Less than 3 points below the next tick (12 under 14): the
                // phone-size labels would touch, so phones hide this one.
                (Y_TICKS[i + 1] ?? Infinity) - t < 3
                  ? `${styles.axisLabel} ${styles.axisLabelCrowded}`
                  : styles.axisLabel
              }
            >
              {t}
            </text>
          </g>
        ))}
        {monthTicks.map((tick) => (
          <text
            key={`mt-${tick.key}`}
            x={tick.x}
            y={PADDING.top + CHART_H + 22}
            textAnchor={tick.anchor}
            className={styles.axisLabel}
          >
            {monthLabels[tick.key]}
          </text>
        ))}
        <path
          d={path}
          pathLength={1}
          fill="none"
          stroke="var(--text-brand-accessible)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={reducedMotion ? styles.pathStatic : styles.pathAnimated}
        />
        {snapshots.map((s, i) => (
          <circle
            key={s.date}
            cx={xScale(i)}
            cy={yScale(s.score)}
            r={3}
            fill={POINT_FILL_BY_REGIME[s.regime_code]}
            className={styles.point}
          />
        ))}
      </svg>
      {/* 5.303: the CLIP lives on a wrapper, never on the <table>.
          `.srOnly` sets width:1px, but auto table layout treats width as a
          MINIMUM and never goes below min-content, so the table computed
          644.797px and pushed 167-176px of horizontal scroll onto every mobile
          market page. A <div> honours width:1px and clips its children, so the
          scroll goes away. Do NOT "fix" this by putting display:block on the
          table instead: that strips its table semantics for assistive tech,
          and this table is the only screen-reader path to the chart
          (`aria-describedby` on the svg points at its id). */}
      <div className={styles.srOnly}>
        <table id={tableId}>
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">{tableLabels.date}</th>
              <th scope="col">{tableLabels.score}</th>
              <th scope="col">{tableLabels.regime}</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr key={s.date}>
                <th scope="row">
                  <time dateTime={s.date.slice(0, 10)}>
                    {dateLabels[s.date.slice(0, 10)] ?? s.date.slice(0, 10)}
                  </time>
                </th>
                <td>{s.score}</td>
                <td>{regimeLabels[s.regime_code] ?? s.regime_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
