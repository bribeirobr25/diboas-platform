'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import type { SandboxLocale } from '@/i18n/config';
import { useLedger } from '@/hooks/useLedger';
import { useFormatters } from '@/hooks/useFormatters';
import { buildMonthReport, currentMonthWindow, type MovementSource } from '@/lib/monthReport';
import { LucideIcon } from './LucideIcon';
import { SegmentedToggle } from './SegmentedToggle';
import { Sparkline } from './Sparkline';
import { SourcesOfMovementChart } from './SourcesOfMovementChart';
import styles from './MonthReportScreen.module.css';

type View = 'simple' | 'detailed';

/** Each source's own mark — the thing it is, not decoration. */
const SOURCE_ICON: Record<MovementSource['key'], string> = {
  grant: 'gift',
  weeklyCredits: 'coins',
  marketChange: 'trending-up',
  practiceEvents: 'receipt',
  fees: 'percent',
};

/**
 * G12 — the month report (§4.12; mockups 27 + 28).
 *
 * Reads only; appends nothing. The whole screen rests on one property: the
 * rows SUM to the change, so "every dollar is explained" is an identity rather
 * than a claim (see `monthReport.ts` for why the buckets are the conservation
 * formula's own terms — Stage-D's proposed "contributions" bucket would have
 * broken it, since funding a goal moves money between the user's own pockets).
 *
 * Source-separation is the load-bearing compliance property (UX-63 / 14.10):
 * what ARRIVED (the grant, weekly credits) must never read as what the money
 * EARNED. They are separate rows with separate names, and the market row is
 * the only one that may be called market movement.
 *
 * Deliberately absent, each for a ruled reason:
 * - **no streak.** Mockup 27's "7 days in a row" is veto-class (WSG G7
 *   rejected, R-2 streak pressure). Counts are cleared and are built; a
 *   consecutive chain is not.
 * - **no "try real money" card.** Plan §4.12 ships R1 as a plain,
 *   non-interactive line — no card chrome, no affordance, no ask. The
 *   disabled mode-affordance arrives with the mode-architecture track.
 * - **no pace or projection.** This report is backward-looking only (Q3).
 */
export function MonthReportScreen({ locale }: { locale: SandboxLocale }) {
  const intl = useIntl();
  const state = useLedger();
  const { money, date } = useFormatters(state.currency);
  const [view, setView] = useState<View>('simple');

  const window = currentMonthWindow(new Date().toISOString());
  const report = buildMonthReport(state, window.fromIso, window.toIso);

  if (!report) {
    return (
      <section className={styles.wrap} aria-labelledby="month-title">
        <h1 id="month-title" className={styles.title}>
          <FormattedMessage id="monthReport.title" />
        </h1>
        <p className={styles.subtitle}>
          <FormattedMessage id="monthReport.emptyBody" />
        </p>
      </section>
    );
  }

  const sourceLabel = (key: MovementSource['key']) =>
    intl.formatMessage({ id: `monthReport.source.${key}` });
  const range = intl.formatMessage(
    { id: 'monthReport.range' },
    { from: date(report.fromIso), to: date(report.toIso) }
  );
  const down = report.totalChange < 0;
  /** Zero moved in neither direction: a "+" and an "up" would both be claims. */
  const flat = report.totalChange === 0;
  /** A share of the opening balance — meaningless, so absent, when it was 0. */
  const showPercent = report.opening > 0;

  const signed = (amount: number) => {
    const value = money(Math.abs(amount).toFixed(2));
    if (amount === 0) return value;
    return intl.formatMessage(
      { id: amount < 0 ? 'monthReport.signedDown' : 'monthReport.signedUp' },
      { amount: value }
    );
  };

  return (
    <section className={styles.wrap} aria-labelledby="month-title">
      <div className={styles.head}>
        <h1 id="month-title" className={styles.title}>
          <FormattedMessage id="monthReport.title" />
        </h1>
        <p className={styles.range}>{range}</p>
      </div>

      <SegmentedToggle
        value={view}
        onChange={setView}
        ariaLabel={intl.formatMessage({ id: 'goalsList.viewToggle' })}
        segments={[
          { id: 'simple', label: intl.formatMessage({ id: 'goalDual.simple' }) },
          { id: 'detailed', label: intl.formatMessage({ id: 'goalDual.detailed' }) },
        ]}
      />

      {/* Meaning first, in words — the figure is read, not decoded from a
          colour. The direction is stated for a screen reader too. */}
      <div className={styles.hero}>
        <p className={styles.heroLabel}>
          <FormattedMessage id="monthReport.totalChange" />
        </p>
        <p className={down ? styles.heroValueDown : styles.heroValue}>
          {flat ? null : (
            <span className={styles.srOnly}>
              <FormattedMessage id={down ? 'monthReport.wordDown' : 'monthReport.wordUp'} />{' '}
            </span>
          )}
          {signed(report.totalChange)}
          {showPercent ? (
            <span className={styles.heroPercent}>
              {intl.formatNumber(Math.abs(report.totalChangePercent), {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              %
            </span>
          ) : null}
        </p>
        <p className={styles.heroNote}>
          <FormattedMessage id="monthReport.everyDollar" />
        </p>
      </div>

      {view === 'simple' ? (
        <>
          {report.series.length >= 2 ? (
            <div className={styles.spark}>
              <Sparkline series={report.series} />
            </div>
          ) : null}

          <h2 className={styles.sectionLabel}>
            <FormattedMessage id="monthReport.sourcesTitle" />
          </h2>
          {report.sources.length === 0 ? (
            /* A month where nothing moved is a real answer, not an empty
               section: the heading above must never stand over nothing. */
            <p className={styles.quietNote}>
              <FormattedMessage id="monthReport.nothingMoved" />
            </p>
          ) : (
            <ul className={styles.rows}>
              {report.sources.map((source) => (
                <li key={source.key} className={styles.row}>
                  <span className={styles.rowIcon}>
                    <LucideIcon name={SOURCE_ICON[source.key]} size={18} />
                  </span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowName}>{sourceLabel(source.key)}</span>
                    <span className={styles.rowNote}>
                      <FormattedMessage id={`monthReport.sourceNote.${source.key}`} />
                    </span>
                  </span>
                  <span className={source.amount < 0 ? styles.rowValueDown : styles.rowValue}>
                    {signed(source.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <h2 className={styles.sectionLabel}>
            <FormattedMessage id="monthReport.sourcesTitle" />
          </h2>
          <SourcesOfMovementChart
            sources={report.sources}
            currency={state.currency}
            labelFor={sourceLabel}
          />
          {/* The chart is aria-hidden; THIS is its text equivalent, carrying
              the same figures in the same order. */}
          {report.sources.length === 0 ? (
            /* A month where nothing moved is a real answer, not an empty
               section: the heading above must never stand over nothing. */
            <p className={styles.quietNote}>
              <FormattedMessage id="monthReport.nothingMoved" />
            </p>
          ) : (
            <ul className={styles.rows}>
              {report.sources.map((source) => (
                <li key={source.key} className={styles.row}>
                  <span className={styles.rowIcon}>
                    <LucideIcon name={SOURCE_ICON[source.key]} size={18} />
                  </span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowName}>{sourceLabel(source.key)}</span>
                    <span className={styles.rowNote}>
                      <FormattedMessage id={`monthReport.sourceNote.${source.key}`} />
                    </span>
                  </span>
                  <span className={source.amount < 0 ? styles.rowValueDown : styles.rowValue}>
                    {signed(source.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Board §2a: opening + change == closing, with the opening derived
              from a point-in-time projection of the log's prefix. */}
          <dl className={styles.reconciliation}>
            <div className={styles.reconRow}>
              <dt>
                <FormattedMessage
                  id="monthReport.opening"
                  values={{ date: date(report.fromIso) }}
                />
              </dt>
              <dd>{money(report.opening.toFixed(2))}</dd>
            </div>
            <div className={styles.reconRow}>
              <dt>
                <FormattedMessage id="monthReport.totalChange" />
              </dt>
              <dd>{signed(report.totalChange)}</dd>
            </div>
            <div className={styles.reconTotal}>
              <dt>
                <FormattedMessage id="monthReport.closing" values={{ date: date(report.toIso) }} />
              </dt>
              <dd>{money(report.closing.toFixed(2))}</dd>
            </div>
          </dl>
        </>
      )}

      {/* The user's OWN act, kept visible but OUTSIDE the sum — it moves money
          between their pockets, it does not change the total (UX-63: what you
          did must never be read as what the money earned). */}
      {report.movedIntoGoals > 0 ? (
        <p className={styles.movedNote}>
          <FormattedMessage
            id="monthReport.movedIntoGoals"
            values={{ amount: money(report.movedIntoGoals.toFixed(2)) }}
          />
        </p>
      ) : null}

      {report.goalsCreated > 0 || report.cyclesCompleted > 0 ? (
        <div className={styles.practice}>
          <p className={styles.practiceTitle}>
            <FormattedMessage id="monthReport.practiceTitle" />
          </p>
          {/* Counts, never a chain: WSG G6 is cleared, G7 is veto-class. */}
          {report.goalsCreated > 0 ? (
            <p className={styles.practiceLine}>
              <FormattedMessage
                id="monthReport.goalsCreated"
                values={{ count: report.goalsCreated }}
              />
            </p>
          ) : null}
          {report.cyclesCompleted > 0 ? (
            <p className={styles.practiceLine}>
              <FormattedMessage
                id="monthReport.cyclesCompleted"
                values={{ count: report.cyclesCompleted }}
              />
            </p>
          ) : null}
        </div>
      ) : null}

      <Link href={`/${locale}/history`} className={styles.historyLink}>
        <LucideIcon name="list" size={18} />
        <FormattedMessage id="monthReport.viewHistory" />
      </Link>

      {/* The R1 shipping state of the "try real money" moment: a plain,
          non-interactive line. No card chrome, no buttons, no ask — the
          disabled mode-affordance lands with the mode-architecture track
          (plan §4.12), so nothing here presumes that decision. */}
      <p className={styles.practiceOnly}>
        <FormattedMessage id="monthReport.practiceOnly" />
      </p>
    </section>
  );
}
