'use client';

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { fetchSeries } from '@/hooks/useMarket';
import { advanceTime } from '@/lib/ledgerClient';
import { classifyTrend, practiceValueSeries } from '@/lib/practiceSeries';
import { LucideIcon } from './LucideIcon';
import { SegmentedToggle } from './SegmentedToggle';
import { Sparkline } from './Sparkline';
import { ValueChart } from './ValueChart';
import styles from './TimeMachineScreen.module.css';

type View = 'simple' | 'detailed';

/** The two jumps the spec offers. Real calendar lengths, not round numbers. */
const ADVANCES = [
  { id: 'month', days: 30, labelId: 'timeMachine.advanceMonth' },
  { id: 'year', days: 365, labelId: 'timeMachine.advanceYear' },
] as const;

/**
 * G8 — the time machine (§4.8; mockups 17-time-machine-simple/-detailed, spec
 * `batch-3-time-history-rules.md` §3.1 as rewritten 2026-08-13).
 *
 * This is the screen that finally tells the truth about growth. Before §4.8 the
 * replay used APY only, and APY is never negative — so practice money could
 * only ever rise, for every user, forever. Now a `market` leg replays the
 * token's real price, and a stretch can genuinely lose money.
 *
 * The spec's shape, deliberately: **lead with MEANING, not a chart.** Simple
 * opens with a plain sentence about what happened, then the controls, then the
 * honesty label, then a soft axis-less sparkline that shows the down periods
 * too. The chart with axes and precise figures lives in Detailed. A loss is
 * stated as plainly as a gain — no alarm styling, no commentary, no reassurance
 * (R-2): the number is the message.
 */
export function TimeMachineScreen({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const state = useLedger();
  const { money, date } = useFormatters(state.currency);
  const [view, setView] = useState<View>('simple');
  const [busy, setBusy] = useState(false);

  const points = practiceValueSeries(state);
  const values = points.map((p) => p.value);
  const start = values[0] ?? 0;
  const end = values[values.length - 1] ?? 0;
  const trend = classifyTrend(start, end);
  const changeAmount = end - start;
  const changePercent = start > 0 ? (changeAmount / start) * 100 : 0;
  const hasHistory = points.length >= 2;

  /**
   * Advance the clock. The series are fetched per tap rather than held in
   * state: they are server-cached at the ruled 6 h TTL, so a re-read is free,
   * and holding them would risk replaying a stale window after a refresh.
   * Failure leaves time unmoved rather than advancing on invented data (P7).
   */
  async function advance(days: number) {
    if (busy) return;
    setBusy(true);
    try {
      const { histories, priceHistories } = await fetchSeries(Math.max(days + 30, 400));
      advanceTime(days, histories, 'machine', priceHistories);
    } catch {
      /* time stays put; no fabricated movement */
    } finally {
      setBusy(false);
    }
  }

  const controls = (
    <div className={styles.controls}>
      <span className={styles.controlsLabel}>
        <FormattedMessage id="timeMachine.advanceTime" />
      </span>
      <div className={styles.controlsRow}>
        {ADVANCES.map((a) => (
          <button
            key={a.id}
            type="button"
            className={styles.advance}
            disabled={busy}
            onClick={() => void advance(a.days)}
          >
            <LucideIcon name="calendar" size={18} />
            <FormattedMessage id={a.labelId} />
          </button>
        ))}
      </div>
    </div>
  );

  /* The honesty label the board required and the mockup already carries. It is
     NOT decoration: it names the model's nature so "real market" is never
     implied. */
  const honestyLabel = (
    <p className={styles.honesty}>
      <FormattedMessage id="timeMachine.simulationLabel" />
      <LucideIcon name="info" size={14} />
    </p>
  );

  const excludes = (
    <p className={styles.excludes}>
      <FormattedMessage id="timeMachine.excludes" />
    </p>
  );

  return (
    <section className={styles.wrap} aria-labelledby="timemachine-title">
      <div className={styles.heroBand} aria-hidden />

      <SegmentedToggle
        value={view}
        onChange={setView}
        ariaLabel={intl.formatMessage({ id: 'goalsList.viewToggle' })}
        segments={[
          { id: 'simple', label: intl.formatMessage({ id: 'goalDual.simple' }) },
          { id: 'detailed', label: intl.formatMessage({ id: 'goalDual.detailed' }) },
        ]}
      />

      <div className={styles.head}>
        <span className={styles.icon}>
          <LucideIcon name="history" size={24} />
        </span>
        <div>
          <h1 id="timemachine-title" className={styles.title}>
            <FormattedMessage id="timeMachine.title" />
          </h1>
          {view === 'simple' ? (
            <p className={styles.status}>
              <FormattedMessage id="timeMachine.status" />
            </p>
          ) : (
            honestyLabel
          )}
        </div>
      </div>

      {view === 'simple' ? (
        <>
          {/* Meaning first, per spec — the sentence carries the story, the
              sparkline only illustrates it. */}
          <p className={styles.meaning}>
            <FormattedMessage
              id={
                !hasHistory
                  ? 'timeMachine.meaningNone'
                  : trend === 'grew'
                    ? 'timeMachine.meaningGrew'
                    : trend === 'fell'
                      ? 'timeMachine.meaningFell'
                      : 'timeMachine.meaningFlat'
              }
            />
          </p>

          {controls}
          {honestyLabel}

          {hasHistory ? (
            <div className={styles.spark}>
              <Sparkline series={values} />
            </div>
          ) : null}

          {excludes}
        </>
      ) : (
        <>
          <div className={styles.metaRow}>
            <span className={styles.meta}>
              <span className={styles.metaLabel}>
                <FormattedMessage id="timeMachine.startDate" />
              </span>
              <span className={styles.metaValue}>
                <LucideIcon name="calendar" size={14} />
                {/* Absent before the first grant — an em-dash placeholder would
                    be a fake value, so the label simply carries no date yet. */}
                {state.genesisRecordedAt ? date(state.genesisRecordedAt) : '—'}
              </span>
            </span>
            <span className={styles.meta}>
              <span className={styles.metaLabel}>
                <FormattedMessage id="timeMachine.duration" />
              </span>
              <span className={styles.metaValue}>
                <FormattedMessage id="timeMachine.durationDays" values={{ days: state.simDay }} />
              </span>
            </span>
          </div>

          {controls}

          {hasHistory ? (
            <>
              <ValueChart
                points={points}
                startValue={start}
                currency={state.currency}
                labelledBy="timemachine-title"
              />

              <div className={styles.summary}>
                <span className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>
                    <FormattedMessage id="timeMachine.startValue" />
                  </span>
                  <span className={styles.summaryValue}>{money(start.toFixed(2))}</span>
                </span>
                <span className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>
                    <FormattedMessage id="timeMachine.endValue" />
                  </span>
                  <span className={styles.summaryValue}>{money(end.toFixed(2))}</span>
                </span>
                <span className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>
                    <FormattedMessage id="timeMachine.change" />
                  </span>
                  {/* The meaning is in the WORDS as well as the colour (batch-3
                      master block): a screen reader and a colour-blind reader
                      both get "down", not just a red pixel. */}
                  <span
                    className={changeAmount < 0 ? styles.changeDown : styles.changeUp}
                    data-direction={changeAmount < 0 ? 'down' : 'up'}
                  >
                    <span className={styles.srOnly}>
                      <FormattedMessage
                        id={changeAmount < 0 ? 'timeMachine.down' : 'timeMachine.up'}
                      />{' '}
                    </span>
                    {changeAmount < 0 ? '−' : '+'}
                    {money(Math.abs(changeAmount).toFixed(2))}
                    <span className={styles.changePercent}>
                      {changeAmount < 0 ? '−' : '+'}
                      {intl.formatNumber(Math.abs(changePercent), {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      %
                    </span>
                  </span>
                </span>
              </div>
            </>
          ) : (
            <p className={styles.meaning}>
              <FormattedMessage id="timeMachine.meaningNone" />
            </p>
          )}

          <p className={styles.footnote}>
            <LucideIcon name="info" size={14} />
            <FormattedMessage id="timeMachine.footnote" />
          </p>
        </>
      )}
    </section>
  );
}
