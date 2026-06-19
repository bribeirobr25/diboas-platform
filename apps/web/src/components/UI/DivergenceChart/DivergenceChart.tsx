'use client';

/**
 * DivergenceChart — the "data as hero" primitive.
 *
 * A bespoke inline SVG (NO chart library — Principle 9 / bundle budget) that
 * draws N series diverging from a shared start to different ends, with
 * tabular-mono end labels. Lines draw on scroll-in via `useInView`; under
 * prefers-reduced-motion they render fully drawn with no animation. The
 * numeric labels are always present in the SSR markup (SEO + a11y tree).
 *
 * All values are caller-supplied (market-data-bound at the call site — never
 * hardcoded here). Teal (`--accent-action`) marks the "primary" series only.
 */

import { useMemo } from 'react';
import { useInView } from '@/hooks/useInView';
import styles from './DivergenceChart.module.css';

export interface DivergenceSeries {
  id: string;
  label: string;
  /** Y-values across the shared x-axis (index 0 = the common start). */
  values: number[];
  /** `primary` renders in the teal action accent; `muted` in ink. */
  variant?: 'primary' | 'muted';
}

interface DivergenceChartProps {
  series: DivergenceSeries[];
  /** Start / end captions under the axis, e.g. ["Today", "1 year"]. */
  xCaptions?: [string, string];
  /** Format a value for the end labels (e.g. (n) => formatCurrency(n, locale)). */
  formatValue?: (value: number) => string;
  /** Required: a sentence describing the divergence for screen readers. */
  ariaLabel: string;
  className?: string;
}

const VIEW_W = 640;
const VIEW_H = 320;
const PAD = { top: 28, right: 132, bottom: 34, left: 24 };

export function DivergenceChart({
  series,
  xCaptions,
  formatValue = (n) => String(Math.round(n)),
  ariaLabel,
  className = '',
}: DivergenceChartProps) {
  const { ref, inView } = useInView<SVGSVGElement>({ threshold: 0.35 });

  const geom = useMemo(() => {
    const plotW = VIEW_W - PAD.left - PAD.right;
    const plotH = VIEW_H - PAD.top - PAD.bottom;
    const all = series.flatMap((s) => s.values);
    const min = Math.min(...all);
    const max = Math.max(...all);
    const span = max - min || 1;
    // small headroom so the top line isn't flush with the edge
    const yOf = (v: number) => PAD.top + (1 - (v - min) / span) * plotH * 0.94 + plotH * 0.03;
    const xOf = (i: number, n: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);

    const lines = series.map((s) => {
      const n = s.values.length;
      const pts = s.values.map((v, i) => `${xOf(i, n).toFixed(1)},${yOf(v).toFixed(1)}`);
      const end = s.values[n - 1] ?? 0;
      const endX = xOf(n - 1, n);
      const endY = yOf(end);
      return { ...s, points: pts.join(' '), endX, endY, endValue: end };
    });
    const startV = series[0]?.values[0] ?? 0;
    const startPt = { x: PAD.left, y: yOf(startV), value: startV };
    const baselineY = PAD.top + plotH + 2;
    return { lines, startPt, baselineY };
  }, [series]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
      className={`${styles.chart} ${inView ? styles.isDrawn : ''} ${className}`}
    >
      {/* baseline hairline */}
      <line
        x1={PAD.left}
        y1={geom.baselineY}
        x2={VIEW_W - PAD.right}
        y2={geom.baselineY}
        className={styles.baseline}
      />

      {/* shared start dot */}
      <circle cx={geom.startPt.x} cy={geom.startPt.y} r={4} className={styles.startDot} />

      {geom.lines.map((l) => {
        const isPrimary = l.variant === 'primary';
        return (
          <g key={l.id} className={isPrimary ? styles.primary : styles.muted}>
            <polyline
              points={l.points}
              pathLength={1}
              className={styles.line}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={l.endX} cy={l.endY} r={isPrimary ? 5 : 3.5} className={styles.endDot} />
            <text x={l.endX + 12} y={l.endY - 7} className={styles.endValue}>
              {formatValue(l.endValue)}
            </text>
            <text x={l.endX + 12} y={l.endY + 11} className={styles.endLabel}>
              {l.label}
            </text>
          </g>
        );
      })}

      {xCaptions ? (
        <>
          <text x={PAD.left} y={VIEW_H - 8} className={styles.caption}>
            {xCaptions[0]}
          </text>
          <text x={VIEW_W - PAD.right} y={VIEW_H - 8} textAnchor="end" className={styles.caption}>
            {xCaptions[1]}
          </text>
        </>
      ) : null}
    </svg>
  );
}
