'use client';

/**
 * Inflation Impact Calculator (Tier-2 tool, 6D.1).
 *
 * Two modes:
 *   - Forward: shows future-value purchasing power of a today-amount given the
 *     locale's 5-year average inflation rate, plus an invested comparison.
 *   - Retrospective (Phase D.1, 2026-05-16): shows what an amount from
 *     January 2010 is worth today, using `cumulativeSince2010` from
 *     `marketDataService.getSync().inflationRates.rates[locale]` (Phase A).
 *
 * Math: `purchasingPower(amount, years, inflationRate)` from
 * lib/market-data/formulas/core.ts. Inflation rate per locale flows from
 * `marketDataService.getSync().inflationRates.rates[locale]`.
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
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

type Mode = 'forward' | 'retrospective';

interface FormState {
  amount: number;
  years: number;
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
  const [mode, setMode] = useState<Mode>('forward');

  const snapshot = marketDataService.getSync();
  const inflationRate = selectInflationRate(
    form.country,
    form.years * 12,
    snapshot.inflationRates,
  );

  const forwardResult = useMemo(() => {
    if (mode !== 'forward' || form.amount <= 0 || form.years <= 0) return null;
    const cashValueReal = purchasingPower(form.amount, form.years, inflationRate);
    const investedNominal = calculateLumpSum(
      form.amount,
      HISTORICAL_RATE / 100,
      0,
      form.years,
    ).nominalFV;
    const investedReal = purchasingPower(investedNominal, form.years, inflationRate);
    return { cashValueReal, investedReal, lostToInflation: form.amount - cashValueReal };
  }, [mode, form, inflationRate]);

  // Retrospective math (Phase D.1): cumulativeSince2010 is a decimal stored on
  // InflationData (Phase A). "Your $X from Jan 2010 has the purchasing power
  // of $X / (1 + cumulative) today." We also expose the inverse — "$X today
  // would have been worth $X × (1 + cumulative) in 2010 dollars" framing —
  // because both readings are useful (purchasing-power loss vs nominal lift).
  const retrospectiveResult = useMemo(() => {
    if (mode !== 'retrospective' || form.amount <= 0) return null;
    const localeInflation = snapshot.inflationRates.rates[form.country];
    const cumulative = localeInflation.cumulativeSince2010;
    if (cumulative === undefined) return null;
    const todayPurchasingPower = form.amount / (1 + cumulative);
    const lostToInflation = form.amount - todayPurchasingPower;
    const percentLoss = (lostToInflation / form.amount) * 100;
    return { cumulative, todayPurchasingPower, lostToInflation, percentLoss };
  }, [mode, form.amount, form.country, snapshot]);

  const handleNumber = (field: 'amount' | 'years', value: number) =>
    setForm((prev) => ({ ...prev, [field]: clamp(value, 0, 1_000_000) }));
  const handleCountry = (country: SupportedLocale) =>
    setForm((prev) => ({ ...prev, country }));

  const showYearsInput = mode === 'forward';

  return (
    <div className={styles.calculator}>
      <div className={styles.modeToggle} role="tablist" aria-label={t('mode.ariaLabel')}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'forward'}
          className={`${styles.modeButton} ${mode === 'forward' ? styles.modeButtonActive : ''}`}
          onClick={() => setMode('forward')}
        >
          {t('mode.forward')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'retrospective'}
          className={`${styles.modeButton} ${mode === 'retrospective' ? styles.modeButtonActive : ''}`}
          onClick={() => setMode('retrospective')}
        >
          {t('mode.retrospective')}
        </button>
      </div>

      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-amount`} className={styles.label}>
            {mode === 'forward' ? t('inputs.amountLabel') : t('inputs.amountLabel2010')}
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
          <span className={styles.help}>
            {mode === 'forward' ? t('inputs.amountHelp') : t('inputs.amountHelp2010')}
          </span>
        </div>
        {showYearsInput && (
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
        )}
        <div className={styles.field}>
          <label htmlFor={`${baseId}-country`} className={styles.label}>
            {t('inputs.countryLabel')}
          </label>
          <Select
            id={`${baseId}-country`}
            value={form.country}
            onChange={(e) => handleCountry(e.target.value as SupportedLocale)}
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(`inputs.countryOptions.${opt}`)}
              </option>
            ))}
          </Select>
          <span className={styles.help}>{t('inputs.countryHelp')}</span>
        </div>
      </div>

      {mode === 'forward' && forwardResult && (
        <div className={styles.resultsGrid}>
          <div className={styles.resultCardCash}>
            <p className={styles.resultLabel}>{t('output.ifYouKeepCash')}</p>
            <p className={styles.resultValueMuted}>
              {formatCurrency(forwardResult.cashValueReal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.lostToInflation', {
                amount: formatCurrency(forwardResult.lostToInflation, localeKey, { maximumFractionDigits: 0 }),
              })}
            </p>
          </div>
          <div className={styles.resultCardInvested}>
            <p className={styles.resultLabel}>{t('output.ifYouInvest')}</p>
            <p className={styles.resultValue}>
              {formatCurrency(forwardResult.investedReal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.investedNote', { rate: HISTORICAL_RATE.toString() })}
            </p>
          </div>
        </div>
      )}

      {mode === 'retrospective' && retrospectiveResult && (
        <div className={styles.retrospectiveCard}>
          <p className={styles.resultLabel}>{t('output.retrospectiveLabel')}</p>
          <p className={styles.resultValueMuted}>
            {formatCurrency(retrospectiveResult.todayPurchasingPower, localeKey, { maximumFractionDigits: 0 })}
          </p>
          <p className={styles.resultRate}>
            {t('output.retrospectiveDetail', {
              percent: retrospectiveResult.percentLoss.toFixed(0),
              lost: formatCurrency(retrospectiveResult.lostToInflation, localeKey, { maximumFractionDigits: 0 }),
              cumulative: (retrospectiveResult.cumulative * 100).toFixed(0),
            })}
          </p>
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
