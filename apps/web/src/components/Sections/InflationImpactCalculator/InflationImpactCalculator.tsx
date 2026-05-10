'use client';

/**
 * Inflation Impact Calculator (Tier-2 tool, 6D.1).
 *
 * Shows future-value purchasing power of a today-amount given the locale's
 * 5-year average inflation rate, plus a side-by-side "if you put it to work
 * at 7% historical yield" comparison.
 *
 * Math: `purchasingPower(amount, years, inflationRate)` from
 * lib/market-data/formulas/core.ts. Inflation rate per locale flows from
 * `marketDataService.getSync().inflationRates.rates[locale]`.
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import {
  calculateLumpSum,
  marketDataService,
  purchasingPower,
  selectInflationRate,
  type SupportedLocale,
} from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import { INFLATION_IMPACT_DEFAULTS } from '@/lib/tools';
import styles from './InflationImpactCalculator.module.css';

const HISTORICAL_RATE = SCENARIO_RATES.historical;

interface FormState {
  amount: number;
  years: number;
  /** Country picker — defaults to user locale; can be overridden to compare. */
  country: SupportedLocale;
}

const COUNTRY_OPTIONS: ReadonlyArray<SupportedLocale> = ['en', 'pt-BR', 'es', 'de'];

export function InflationImpactCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-inflation-impact.${key}` }, values);

  const initial = useMemo<FormState>(
    () => ({
      amount: INFLATION_IMPACT_DEFAULTS.amount[localeKey],
      years: INFLATION_IMPACT_DEFAULTS.years,
      country: localeKey,
    }),
    [localeKey],
  );
  const [form, setForm] = useState<FormState>(initial);

  const snapshot = marketDataService.getSync();
  // selectInflationRate returns a decimal already (0.045 = 4.5%), picks
  // current rate for short horizons (≤2y) or average5y for longer.
  const inflationRate = selectInflationRate(
    form.country,
    form.years * 12,
    snapshot.inflationRates,
  );

  const result = useMemo(() => {
    if (form.amount <= 0 || form.years <= 0) return null;
    const cashValueReal = purchasingPower(form.amount, form.years, inflationRate);
    const investedNominal = calculateLumpSum(
      form.amount,
      HISTORICAL_RATE / 100,
      0,
      form.years,
    ).nominalFV;
    const investedReal = purchasingPower(investedNominal, form.years, inflationRate);
    return { cashValueReal, investedReal, lostToInflation: form.amount - cashValueReal };
  }, [form, inflationRate]);

  const handleNumber = (field: 'amount' | 'years', value: number) =>
    setForm((prev) => ({ ...prev, [field]: clamp(value, 0, 1_000_000) }));
  const handleCountry = (country: SupportedLocale) =>
    setForm((prev) => ({ ...prev, country }));

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-amount`} className={styles.label}>
            {t('inputs.amountLabel')}
          </label>
          <input
            id={`${baseId}-amount`}
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            value={form.amount}
            onChange={(e) => handleNumber('amount', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.amountHelp')}</span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-years`} className={styles.label}>
            {t('inputs.yearsLabel')}
          </label>
          <input
            id={`${baseId}-years`}
            type="number"
            inputMode="numeric"
            min={1}
            max={40}
            step={1}
            value={form.years}
            onChange={(e) => handleNumber('years', Math.round(Number(e.target.value)))}
            className={styles.numberInput}
          />
          <span className={styles.help}>
            {t('inputs.yearsHelp', { rate: (inflationRate * 100).toFixed(1) })}
          </span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-country`} className={styles.label}>
            {t('inputs.countryLabel')}
          </label>
          <select
            id={`${baseId}-country`}
            value={form.country}
            onChange={(e) => handleCountry(e.target.value as SupportedLocale)}
            className={styles.select}
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(`inputs.countryOptions.${opt}`)}
              </option>
            ))}
          </select>
          <span className={styles.help}>{t('inputs.countryHelp')}</span>
        </div>
      </div>

      {result && (
        <div className={styles.resultsGrid}>
          <div className={styles.resultCardCash}>
            <p className={styles.resultLabel}>{t('output.ifYouKeepCash')}</p>
            <p className={styles.resultValueMuted}>
              {formatCurrency(result.cashValueReal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.lostToInflation', {
                amount: formatCurrency(result.lostToInflation, localeKey, { maximumFractionDigits: 0 }),
              })}
            </p>
          </div>
          <div className={styles.resultCardInvested}>
            <p className={styles.resultLabel}>{t('output.ifYouInvest')}</p>
            <p className={styles.resultValue}>
              {formatCurrency(result.investedReal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.investedNote', { rate: HISTORICAL_RATE.toString() })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default InflationImpactCalculator;
