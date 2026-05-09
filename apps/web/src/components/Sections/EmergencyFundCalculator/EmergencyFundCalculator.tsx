'use client';

/**
 * Emergency Fund Calculator (Tier-1 tool, 6C.3).
 *
 * Computes time-to-target for the user's emergency fund using the canonical
 * `monthsToInflationAdjustedTarget` math from `lib/market-data/formulas/core`.
 * Output is "months to goal" with a bank-vs-diBoaS comparison — a different
 * shape than the future-value compound calculator.
 *
 * All numeric defaults flow from `lib/tools/constants.ts` (locale-keyed) and
 * yield/inflation rates come from `marketDataService.getSync()` per the §10
 * service-agnostic guardrail.
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import {
  monthsToInflationAdjustedTarget,
  type SupportedLocale,
} from '@/lib/market-data';
import { marketDataService } from '@/lib/market-data/service';
import { formatCurrency } from '@/lib/compound-interest';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import { EMERGENCY_FUND_DEFAULTS } from '@/lib/tools';
import styles from './EmergencyFundCalculator.module.css';

const HISTORICAL_RATE = SCENARIO_RATES.historical;

interface FormState {
  monthlyExpenses: number;
  monthlySavings: number;
  targetMultiplier: number;
}

export function EmergencyFundCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-emergency-fund.${key}` }, values);
  const tShared = (key: string) => intl.formatMessage({ id: `tools-shared.${key}` });

  const localeKey = (locale ?? 'en') as SupportedLocale;
  const initial = useMemo<FormState>(
    () => ({
      monthlyExpenses: EMERGENCY_FUND_DEFAULTS.monthlyExpenses[localeKey],
      monthlySavings: EMERGENCY_FUND_DEFAULTS.monthlySavings[localeKey],
      targetMultiplier: EMERGENCY_FUND_DEFAULTS.targetMultiplier,
    }),
    [localeKey],
  );

  const [form, setForm] = useState<FormState>(initial);

  const snapshot = marketDataService.getSync();
  const bankRate = snapshot.rates.bankRates[localeKey]?.savings ?? 0;
  const inflation = snapshot.inflationRates.rates[localeKey]?.average5y ?? 0;

  const target = form.monthlyExpenses * form.targetMultiplier;
  const result = useMemo(() => {
    if (form.monthlySavings <= 0) return null;
    try {
      const diboasMonths = monthsToInflationAdjustedTarget(
        target,
        form.monthlySavings,
        HISTORICAL_RATE / 100,
        inflation / 100,
      );
      const bankMonths = monthsToInflationAdjustedTarget(
        target,
        form.monthlySavings,
        bankRate / 100,
        inflation / 100,
      );
      return { diboasMonths, bankMonths, savedMonths: bankMonths - diboasMonths };
    } catch {
      return null;
    }
  }, [target, form.monthlySavings, bankRate, inflation]);

  const formatMonths = (m: number): string => {
    if (m < 12) return t('output.monthsLabel', { months: m });
    const years = (m / 12).toFixed(1);
    return t('output.yearsLabel', { years });
  };

  const handleChange = (field: keyof FormState, value: number) =>
    setForm((prev) => ({ ...prev, [field]: clamp(value, 0, 1_000_000) }));

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-expenses`} className={styles.label}>
            {t('inputs.monthlyExpensesLabel')}
          </label>
          <input
            id={`${baseId}-expenses`}
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            value={form.monthlyExpenses}
            onChange={(e) => handleChange('monthlyExpenses', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.monthlyExpensesHelp')}</span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-savings`} className={styles.label}>
            {t('inputs.monthlySavingsLabel')}
          </label>
          <input
            id={`${baseId}-savings`}
            type="number"
            inputMode="decimal"
            min={0}
            step={25}
            value={form.monthlySavings}
            onChange={(e) => handleChange('monthlySavings', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.monthlySavingsHelp')}</span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-multiplier`} className={styles.label}>
            {t('inputs.targetMultiplierLabel')}
          </label>
          <input
            id={`${baseId}-multiplier`}
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            step={1}
            value={form.targetMultiplier}
            onChange={(e) => handleChange('targetMultiplier', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.targetMultiplierHelp')}</span>
        </div>
      </div>

      <p className={styles.targetLine}>
        {t('output.targetLabel', { amount: formatCurrency(target, localeKey, { maximumFractionDigits: 0 }) })}
      </p>

      {result ? (
        <div className={styles.resultsGrid}>
          <div className={styles.resultCardDiboas}>
            <p className={styles.resultLabel}>{t('output.withDiboas')}</p>
            <p className={styles.resultValue}>{formatMonths(result.diboasMonths)}</p>
            <p className={styles.resultRate}>{tShared('scenarios.historical')}</p>
          </div>
          <div className={styles.resultCardBank}>
            <p className={styles.resultLabel}>{t('output.withBank')}</p>
            <p className={styles.resultValueMuted}>{formatMonths(result.bankMonths)}</p>
            <p className={styles.resultRate}>{tShared('scenarios.bank')} ({bankRate}%)</p>
          </div>
          {result.savedMonths > 0 && (
            <div className={styles.savedHighlight}>
              <span className={styles.savedLabel}>{t('output.saved')}</span>
              <span className={styles.savedValue}>{formatMonths(result.savedMonths)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.noResult}>{t('output.noResult')}</p>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default EmergencyFundCalculator;
