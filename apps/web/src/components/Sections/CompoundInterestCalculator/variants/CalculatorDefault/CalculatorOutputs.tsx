'use client';

import { useTranslation } from '@diboas/i18n/client';
import {
  formatCurrency,
  type CalculatorOutput,
  type SeriesKey,
} from '@/lib/compound-interest';
import { CompoundChart } from '@/components/UI/CompoundChart';
import styles from './CalculatorDefault.module.css';

interface CalculatorOutputsProps {
  output: CalculatorOutput;
  reducedMotion?: boolean;
}

export function CalculatorOutputs({ output, reducedMotion }: CalculatorOutputsProps) {
  const intl = useTranslation();
  const { series, highlightedScenario, monthlyEquivalent, inputEcho } = output;

  const chartAriaLabel = intl.formatMessage({
    id: 'learn-compound-interest.calculator.chartAriaLabel',
  });

  const summary = intl.formatMessage(
    { id: 'learn-compound-interest.calculator.summaryHeader' },
    {
      years: inputEcho.years,
      amount: formatCurrency(monthlyEquivalent, inputEcho.locale, { maximumFractionDigits: 0 }),
    },
  );

  const scenarioLabels: Readonly<Record<SeriesKey, string>> = {
    bank: intl.formatMessage({ id: 'learn-compound-interest.calculator.outputBank' }),
    conservative: intl.formatMessage({ id: 'learn-compound-interest.calculator.outputConservative' }),
    historical: intl.formatMessage({ id: 'learn-compound-interest.calculator.outputHistorical' }),
    optimistic: intl.formatMessage({ id: 'learn-compound-interest.calculator.outputOptimistic' }),
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
          scenario: intl.formatMessage({ id: 'learn-compound-interest.calculator.tableHeaderScenario' }),
          rate: intl.formatMessage({ id: 'learn-compound-interest.calculator.tableHeaderRate' }),
          total: intl.formatMessage(
            { id: 'learn-compound-interest.calculator.tableHeaderTotal' },
            { years: inputEcho.years },
          ),
        }}
      />

      {/* Visible legend table — keeps users without JS-aware screen reader context */}
      <ul className={styles.legend}>
        {series.map((s) => (
          <li key={s.scenario} className={styles.legendItem} data-scenario={s.scenario}>
            <span className={styles.legendSwatch} data-scenario={s.scenario} aria-hidden="true" />
            <span className={styles.legendLabel}>{scenarioLabels[s.scenario]}</span>
            <span className={styles.legendValue}>{formatCurrency(s.finalValue, inputEcho.locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
