'use client';

import { useIntl } from 'react-intl';
import { useFormatters } from '@/hooks/useFormatters';
import type { MovementSource } from '@/lib/monthReport';
import styles from './SourcesOfMovementChart.module.css';

/**
 * The Detailed view's "sources of movement" bars (§4.12; mockup 28).
 *
 * Bars from a shared zero line, so a NEGATIVE source hangs below it and is
 * read as what it is. That is the load-bearing property: a month where fees or
 * a market fall took money out must LOOK like one. Nothing is stacked and
 * nothing is normalised — each bar is its own signed figure against the
 * largest absolute one, which is the only scaling that keeps "twice as tall"
 * meaning "twice as much".
 *
 * Colour never carries the meaning alone (a11y + the batch-3 master block):
 * every bar is labelled with its signed amount, and the source rows beneath the
 * chart are its full text equivalent — which is why the chart itself is
 * `aria-hidden` rather than given an invented description.
 */
export function SourcesOfMovementChart({
  sources,
  currency,
  labelFor,
}: {
  sources: MovementSource[];
  currency: 'USD' | 'BRL' | 'EUR';
  labelFor: (key: MovementSource['key']) => string;
}) {
  const intl = useIntl();
  const { money } = useFormatters(currency);
  if (sources.length === 0) return null;

  const peak = Math.max(...sources.map((s) => Math.abs(s.amount)), 1);
  const hasNegative = sources.some((s) => s.amount < 0);

  return (
    <div className={styles.wrap} aria-hidden>
      <div className={styles.plot} data-signed={hasNegative ? 'true' : undefined}>
        {sources.map((source) => {
          const share = (Math.abs(source.amount) / peak) * 100;
          const down = source.amount < 0;
          return (
            <div key={source.key} className={styles.column}>
              {/* The value label sits OUTSIDE the fixed-height half. Inside it,
                  the tallest bar (100% of the box) squeezed its own label out
                  of view entirely — and shorter bars, having slack, kept
                  theirs. Outside, every bar owns its full half and the label
                  never competes with it. */}
              {/* Each half reserves a label line and a FIXED bar box. The bar
                  scales against the box, never against the half, so the label
                  can neither squeeze the tallest bar nor drift away from the
                  shortest — and both halves use the same box height, which is
                  what keeps ±$1,000 the same size. */}
              <div className={styles.up}>
                <div className={styles.barBox}>
                  {down ? null : (
                    <>
                      <span className={styles.value}>
                        {intl.formatMessage(
                          { id: 'monthReport.signedUp' },
                          { amount: money(source.amount.toFixed(2)) }
                        )}
                      </span>
                      <span className={styles.bar} style={{ height: `${share}%` }} />
                    </>
                  )}
                </div>
              </div>
              <div className={styles.down}>
                <div className={styles.barBoxDown}>
                  {down ? (
                    <>
                      <span
                        className={`${styles.bar} ${styles.barDown}`}
                        style={{ height: `${share}%` }}
                      />
                      <span className={styles.value}>
                        {intl.formatMessage(
                          { id: 'monthReport.signedDown' },
                          { amount: money(Math.abs(source.amount).toFixed(2)) }
                        )}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <span className={styles.label}>{labelFor(source.key)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
