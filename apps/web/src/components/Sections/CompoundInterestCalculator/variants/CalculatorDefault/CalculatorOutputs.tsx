'use client';

import { useTranslation } from '@diboas/i18n/client';
import {
  formatCurrency,
  isOneTime,
  type CalculatorOutput,
  type SeriesKey,
} from '@/lib/compound-interest';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import { CompoundChart } from '@/components/UI/CompoundChart';
import styles from './CalculatorDefault.module.css';

interface CalculatorOutputsProps {
  output: CalculatorOutput;
  reducedMotion?: boolean;
  /**
   * When 'tool' AND locale is non-USD, appends the "digital dollar" suffix
   * from `tools-shared.json` to the diBoaS scenario labels per Q2(A).
   * Default 'lesson' keeps labels pristine for educational use.
   */
  engine?: 'lesson' | 'tool';
}

export function CalculatorOutputs({
  output,
  reducedMotion,
  engine = 'lesson',
}: CalculatorOutputsProps) {
  const intl = useTranslation();
  const { series, highlightedScenario, monthlyEquivalent, inputEcho } = output;

  const chartAriaLabel = intl.formatMessage({
    id: 'learn-compound-interest.calculator.chartAriaLabel',
  });

  const oneTime = isOneTime(inputEcho.cadence);
  const summary = intl.formatMessage(
    {
      id: oneTime
        ? 'learn-compound-interest.calculator.oneTimeSummaryHeader'
        : 'learn-compound-interest.calculator.summaryHeader',
    },
    {
      years: inputEcho.years,
      amount: formatCurrency(oneTime ? inputEcho.amount : monthlyEquivalent, inputEcho.locale, {
        maximumFractionDigits: 0,
      }),
    }
  );

  // Phase-7 Q2(A) + plan §5.2 — append "digital dollar" suffix to non-USD
  // diBoaS scenarios when this calculator is in tool context. Lesson stays
  // pristine (no suffix) per Q7(a) + R2 — lesson is educational math demo,
  // not real-world projection.
  const digitalDollarSuffix =
    engine === 'tool' && LOCALE_CURRENCY[inputEcho.locale] !== 'USD'
      ? intl.formatMessage({ id: 'tools-shared.scenarios.digitalDollarSuffix' })
      : '';

  const scenarioLabels: Readonly<Record<SeriesKey, string>> = {
    bank: intl.formatMessage({ id: 'learn-compound-interest.calculator.outputBank' }),
    conservative:
      intl.formatMessage({ id: 'learn-compound-interest.calculator.outputConservative' }) +
      digitalDollarSuffix,
    historical:
      intl.formatMessage({ id: 'learn-compound-interest.calculator.outputHistorical' }) +
      digitalDollarSuffix,
    optimistic:
      intl.formatMessage({ id: 'learn-compound-interest.calculator.outputOptimistic' }) +
      digitalDollarSuffix,
  };

  // Phase I.4 (2026-05-23): scenario rate tooltips. Bank scenario has no
  // tooltip (rate is the user's actual locale-specific bank rate, not a
  // diBoaS scenario envelope). Tooltips render only on the visible legend
  // (chart's internal table consumes scenarioLabels as plain strings).
  const scenarioTooltips: Partial<Record<SeriesKey, string>> = {
    conservative: intl.formatMessage({ id: 'tools-shared.scenarios.conservativeTooltip' }),
    historical: intl.formatMessage({ id: 'tools-shared.scenarios.historicalTooltip' }),
    optimistic: intl.formatMessage({ id: 'tools-shared.scenarios.optimisticTooltip' }),
  };

  return (
    <div className={styles.outputs}>
      <p className={styles.summary} role="status" aria-live="polite">
        {summary}
      </p>

      <CompoundChart
        series={series}
        highlightedScenario={highlightedScenario}
        locale={inputEcho.locale}
        reducedMotion={reducedMotion}
        ariaLabel={chartAriaLabel}
        scenarioLabels={scenarioLabels}
        tableLabels={{
          scenario: intl.formatMessage({
            id: 'learn-compound-interest.calculator.tableHeaderScenario',
          }),
          rate: intl.formatMessage({ id: 'learn-compound-interest.calculator.tableHeaderRate' }),
          total: intl.formatMessage(
            { id: 'learn-compound-interest.calculator.tableHeaderTotal' },
            { years: inputEcho.years }
          ),
        }}
      />

      {/* Visible legend table — keeps users without JS-aware screen reader context */}
      <ul className={styles.legend}>
        {series.map((s) => {
          const tip = scenarioTooltips[s.scenario];
          return (
            <li key={s.scenario} className={styles.legendItem} data-scenario={s.scenario}>
              <span className={styles.legendSwatch} data-scenario={s.scenario} aria-hidden="true" />
              <span className={styles.legendLabel}>
                {scenarioLabels[s.scenario]}
                {tip && (
                  <span
                    className={styles.tooltip}
                    title={tip}
                    aria-label={tip}
                    role="note"
                    tabIndex={0}
                  >
                    {' '}
                    <sup>?</sup>
                  </span>
                )}
              </span>
              <span className={styles.legendValue}>
                {formatCurrency(s.finalValue, inputEcho.locale)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
