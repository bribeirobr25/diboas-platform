'use client';

import { useId, useMemo } from 'react';
import type { HistoricalRegimes, RegimeCode } from '@/lib/analytics-sdk/types';
import styles from './HistoricalRegimeChart.module.css';

interface HistoricalRegimeChartProps {
  data: HistoricalRegimes;
  range: '3M' | '6M' | '1Y';
  ariaLabel: string;
  reducedMotion?: boolean;
  tableLabels: { date: string; score: string; regime: string };
  className?: string;
}

const VIEWBOX_W = 720;
const VIEWBOX_H = 240;
const PADDING = { top: 16, right: 24, bottom: 32, left: 40 };
const CHART_W = VIEWBOX_W - PADDING.left - PADDING.right;
const CHART_H = VIEWBOX_H - PADDING.top - PADDING.bottom;
const MAX_SCORE = 14;
const Y_TICKS = [0, 3, 6, 9, 12, 14];

const POINT_FILL_BY_REGIME: Record<RegimeCode, string> = {
  VERY_FAVORABLE: 'var(--text-success-accessible)',
  CONSTRUCTIVE: 'var(--text-brand-accessible)',
  NEUTRAL_MIXED: 'var(--color-text-secondary)',
  DEFENSIVE: 'var(--color-amber-700)',
  HOSTILE: 'var(--text-error-accessible)',
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
  className,
}: HistoricalRegimeChartProps) {
  const tableId = useId();

  const snapshots = useMemo(() => {
    const count = rangeToCount(range);
    return data.snapshots.slice(-count);
  }, [data.snapshots, range]);

  const xScale = (i: number) =>
    PADDING.left + (snapshots.length <= 1 ? CHART_W / 2 : (i / (snapshots.length - 1)) * CHART_W);
  const yScale = (score: number) =>
    PADDING.top + CHART_H - (score / MAX_SCORE) * CHART_H;

  const path = useMemo(
    () =>
      snapshots
        .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(s.score).toFixed(2)}`)
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshots],
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
        {Y_TICKS.map((t) => (
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
              className={styles.axisLabel}
            >
              {t}
            </text>
          </g>
        ))}
        <path
          d={path}
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
      <table id={tableId} className={styles.srOnly}>
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
              <th scope="row">{s.date.slice(0, 10)}</th>
              <td>{s.score}</td>
              <td>{s.regime_code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
