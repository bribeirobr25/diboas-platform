'use client';

import { useId, useMemo } from 'react';
import { formatCurrency, type ScenarioSeries, type SeriesKey } from '@/lib/compound-interest';
import type { SupportedLocale } from '@diboas/i18n/config';
import styles from './CompoundChart.module.css';

interface CompoundChartProps {
  series: ScenarioSeries[];
  highlightedScenario: SeriesKey;
  locale: SupportedLocale;
  reducedMotion?: boolean;
  ariaLabel: string;
  /** Visually-hidden table caption for screen readers. */
  tableLabels: {
    scenario: string;
    rate: string;
    total: string;
  };
  scenarioLabels: Readonly<Record<SeriesKey, string>>;
  className?: string;
}

const VIEWBOX_WIDTH = 720;
const VIEWBOX_HEIGHT = 320;
const PADDING = { top: 24, right: 24, bottom: 40, left: 64 };
const CHART_WIDTH = VIEWBOX_WIDTH - PADDING.left - PADDING.right;
const CHART_HEIGHT = VIEWBOX_HEIGHT - PADDING.top - PADDING.bottom;

/**
 * Stroke palette per design-tokens.css (CTO-approved Option β, 2026-05-07).
 * Bank in slate to separate from diBoaS-friendly scenarios; teal gradient
 * for the three growth scenarios — darker = more growth.
 */
const STROKE_TOKEN: Readonly<Record<SeriesKey, string>> = {
  bank: 'var(--color-slate-500)',
  conservative: 'var(--color-teal-300)',
  historical: 'var(--color-teal-500)',
  optimistic: 'var(--color-teal-700)',
};

const STROKE_WIDTH_DEFAULT = 2;
const STROKE_WIDTH_HIGHLIGHTED = 3;

export function CompoundChart({
  series,
  highlightedScenario,
  locale,
  reducedMotion = false,
  ariaLabel,
  tableLabels,
  scenarioLabels,
  className,
}: CompoundChartProps) {
  const tableId = useId();

  const { maxValue, years } = useMemo(() => {
    const max = Math.max(...series.flatMap((s) => s.yearlyValues));
    const yrs = (series[0]?.yearlyValues.length ?? 1) - 1;
    return { maxValue: max === 0 ? 1 : max, years: yrs };
  }, [series]);

  const xTicks = useMemo(() => {
    const candidates = [0, 5, 10, 20, 30, 40].filter((y) => y <= years);
    if (candidates[candidates.length - 1] !== years) candidates.push(years);
    return candidates;
  }, [years]);

  const yTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => (maxValue / steps) * i);
  }, [maxValue]);

  const xScale = (year: number) => PADDING.left + (year / years) * CHART_WIDTH;
  const yScale = (value: number) => PADDING.top + CHART_HEIGHT - (value / maxValue) * CHART_HEIGHT;

  const buildPath = (s: ScenarioSeries) =>
    s.yearlyValues
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(v).toFixed(2)}`)
      .join(' ');

  return (
    <figure className={`${styles.figure} ${className ?? ''}`}>
      <svg
        role="img"
        aria-labelledby={`${tableId}-title`}
        aria-describedby={tableId}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg}
      >
        <title id={`${tableId}-title`}>{ariaLabel}</title>

        {/* Grid lines */}
        {yTicks.map((v) => (
          <line
            key={`grid-y-${v}`}
            x1={PADDING.left}
            x2={PADDING.left + CHART_WIDTH}
            y1={yScale(v)}
            y2={yScale(v)}
            className={styles.gridLine}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((v) => (
          <text
            key={`y-label-${v}`}
            x={PADDING.left - 8}
            y={yScale(v) + 4}
            textAnchor="end"
            className={styles.axisLabel}
          >
            {formatCurrency(v, locale, { maximumFractionDigits: 0 })}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((y) => (
          <text
            key={`x-label-${y}`}
            x={xScale(y)}
            y={PADDING.top + CHART_HEIGHT + 20}
            textAnchor="middle"
            className={styles.axisLabel}
          >
            {y}
          </text>
        ))}

        {/* Polylines (scenarios) */}
        {series.map((s) => {
          const isHighlighted = s.scenario === highlightedScenario;
          return (
            <path
              key={s.scenario}
              d={buildPath(s)}
              fill="none"
              stroke={STROKE_TOKEN[s.scenario]}
              strokeWidth={isHighlighted ? STROKE_WIDTH_HIGHLIGHTED : STROKE_WIDTH_DEFAULT}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={reducedMotion ? styles.pathStatic : styles.pathAnimated}
              data-scenario={s.scenario}
              data-highlighted={isHighlighted ? 'true' : 'false'}
            />
          );
        })}
      </svg>

      {/* Visually-hidden data table fallback for screen readers */}
      <table id={tableId} className={styles.srOnlyTable}>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">{tableLabels.scenario}</th>
            <th scope="col">{tableLabels.rate}</th>
            <th scope="col">{tableLabels.total}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.scenario}>
              <th scope="row">{scenarioLabels[s.scenario]}</th>
              <td>{s.rate}%</td>
              <td>{formatCurrency(s.finalValue, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
