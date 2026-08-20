'use client';

import { useId } from 'react';
import { useIntl } from 'react-intl';
import { useFormatters } from '@/hooks/useFormatters';
import type { ValuePoint } from '@/lib/practiceSeries';
import styles from './ValueChart.module.css';

const VIEW_W = 320;
const VIEW_H = 150;
const PAD = 4;

/** Nice round money gridlines that always contain the series. */
function gridFor(min: number, max: number): number[] {
  const span = Math.max(max - min, 1);
  const rawStep = span / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rawStep) ?? mag * 10;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const lines: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) lines.push(Number(v.toFixed(6)));
  return lines;
}

/**
 * The Detailed view's money chart (§4.8 G8; mockup 17-time-machine-detailed).
 *
 * Deliberately NOT `ApyChart`, and the difference is a decision worth stating:
 * `ApyChart` forces its y-axis from 0% because a truncated *rate* axis
 * exaggerates movement. A *money* axis forced to zero does the opposite — it
 * flattens every real move into a straight line and hides exactly the drawdown
 * this screen exists to show. So this one scales to the data and instead
 * anchors honesty with the mockup's **dashed reference line at the starting
 * value**: above it you are up, below it you are down, readable at a glance and
 * impossible to misjudge from the axis alone.
 *
 * Accessible without sight or colour: the SVG describes its own span, range and
 * direction in text, so the drawdown is not conveyed by the line shape alone.
 */
export function ValueChart({
  points,
  startValue,
  currency,
  labelledBy,
}: {
  points: ValuePoint[];
  startValue: number;
  currency: 'USD' | 'BRL' | 'EUR';
  labelledBy?: string;
}) {
  const intl = useIntl();
  const { money } = useFormatters(currency);
  const titleId = useId();

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values, startValue);
  const rawMax = Math.max(...values, startValue);
  const grid = gridFor(rawMin, rawMax);
  const lo = grid[0];
  const hi = grid[grid.length - 1];
  const range = hi - lo || 1;

  const x = (i: number) =>
    points.length <= 1 ? PAD : PAD + (i * (VIEW_W - PAD * 2)) / (points.length - 1);
  const y = (v: number) => VIEW_H - ((v - lo) / range) * VIEW_H;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${VIEW_H} L${PAD},${VIEW_H} Z`;
  const end = values[values.length - 1];
  const down = end < startValue;

  return (
    <figure className={styles.wrap} aria-labelledby={labelledBy}>
      <div className={styles.plot}>
        <div className={styles.yAxis} aria-hidden>
          {[...grid].reverse().map((v) => (
            <span key={v}>{money(v.toFixed(2))}</span>
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
              { id: 'timeMachine.chartDescription' },
              {
                start: money(startValue.toFixed(2)),
                end: money(end.toFixed(2)),
                low: money(Math.min(...values).toFixed(2)),
                high: money(Math.max(...values).toFixed(2)),
                direction: intl.formatMessage({
                  id: down ? 'timeMachine.down' : 'timeMachine.up',
                }),
              }
            )}
          </title>
          {grid.map((v) => (
            <line
              key={v}
              x1={PAD}
              x2={VIEW_W - PAD}
              y1={y(v)}
              y2={y(v)}
              className={styles.grid}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} className={styles.area} />
          <path d={line} className={styles.line} vectorEffect="non-scaling-stroke" />
          {/* The start-value reference — the honest anchor for "am I up or down". */}
          <line
            x1={PAD}
            x2={VIEW_W - PAD}
            y1={y(startValue)}
            y2={y(startValue)}
            className={styles.startRef}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <figcaption className={styles.xAxis}>
        <span>
          {intl.formatMessage({ id: 'timeMachine.dayN' }, { day: points[0]?.simDay ?? 0 })}
        </span>
        <span>
          {intl.formatMessage(
            { id: 'timeMachine.dayN' },
            { day: points[points.length - 1]?.simDay ?? 0 }
          )}
        </span>
      </figcaption>
    </figure>
  );
}
