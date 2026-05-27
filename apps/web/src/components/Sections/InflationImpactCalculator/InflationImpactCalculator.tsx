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
import { marketDataService, type SupportedLocale } from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import {
  calculateInflationImpactForward,
  calculateInflationImpactRetrospective,
  INFLATION_IMPACT_SCENARIO_USD_PERCENT,
} from '@/lib/inflation-impact';
import { INFLATION_IMPACT_DEFAULTS, INFLATION_IMPACT_YEARS_BOUNDS, clampInput } from '@/lib/tools';
import styles from './InflationImpactCalculator.module.css';

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
  const tShared = (key: string) => intl.formatMessage({ id: `tools-shared.${key}` });

  const initial = useMemo<FormState>(
    () => ({
      amount: INFLATION_IMPACT_DEFAULTS.amount[localeKey],
      years: INFLATION_IMPACT_DEFAULTS.years,
      country: localeKey,
    }),
    [localeKey]
  );
  const [form, setForm] = useState<FormState>(initial);
  const [mode, setMode] = useState<Mode>('forward');

  const snapshot = marketDataService.getSync();

  const forwardResult = useMemo(
    () =>
      mode === 'forward'
        ? calculateInflationImpactForward(
            { amount: form.amount, years: form.years, country: form.country },
            snapshot
          )
        : null,
    [mode, form, snapshot]
  );
  const inflationRate = forwardResult?.inflationRate ?? 0;

  const retrospectiveResult = useMemo(
    () =>
      mode === 'retrospective'
        ? calculateInflationImpactRetrospective(
            { amount: form.amount, country: form.country },
            snapshot
          )
        : null,
    [mode, form.amount, form.country, snapshot]
  );

  const handleNumber = (field: 'amount' | 'years', value: number) =>
    setForm((prev) => {
      if (field === 'years') {
        // C27 close: years <input min/max> now matches the actual clamp.
        return { ...prev, years: clampInput(value, INFLATION_IMPACT_YEARS_BOUNDS) };
      }
      return { ...prev, amount: clamp(value, 0, 1_000_000) };
    });
  const handleCountry = (country: SupportedLocale) => setForm((prev) => ({ ...prev, country }));

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
              min={INFLATION_IMPACT_YEARS_BOUNDS.min}
              max={INFLATION_IMPACT_YEARS_BOUNDS.max}
              step={1}
              value={form.years}
              onChange={(e) => handleNumber('years', Math.round(Number(e.target.value)))}
              className={styles.numberInput}
            />
            <span className={styles.help}>
              {t('inputs.yearsHelp', { rate: (inflationRate * 100).toFixed(1) })}{' '}
              {/* C24 close (TOOLS_41_DEFECTS_FIX_PLAN.md §5.3, 2026-05-26):
                  surface the invisible 24-month boundary where the rate
                  switches from current YoY to 5-year average. */}
              <span
                className={styles.tooltip}
                title={t('inputs.yearsTooltip')}
                aria-label={t('inputs.yearsTooltip')}
                role="note"
                tabIndex={0}
              >
                <sup>?</sup>
              </span>
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
              {formatCurrency(forwardResult.cashValueReal, form.country, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className={styles.resultRate}>
              {t('output.lostToInflation', {
                amount: formatCurrency(forwardResult.lostToInflation, form.country, {
                  maximumFractionDigits: 0,
                }),
              })}
            </p>
          </div>
          <div className={styles.resultCardInvested}>
            <p className={styles.resultLabel}>{t('output.ifYouInvest')}</p>
            <p className={styles.resultValue}>
              {formatCurrency(forwardResult.investedReal, form.country, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className={styles.resultRate}>
              {t('output.investedNote', { rate: INFLATION_IMPACT_SCENARIO_USD_PERCENT.toString() })}
            </p>
          </div>
        </div>
      )}

      {mode === 'retrospective' &&
        retrospectiveResult &&
        (() => {
          // Phase I.1 (2026-05-23): confidence stratification on retrospective.
          // HIGH = stable inflation regime; MEDIUM = pt-BR (variable IPCA over
          // window). LOW reserved for future ARS / hyperinflation locale —
          // `uncertaintyLow` translation key exists in all 4 locales; wire up
          // when ARS is added to SupportedLocale.
          const confidence: 'HIGH' | 'MEDIUM' = form.country === 'pt-BR' ? 'MEDIUM' : 'HIGH';
          return (
            <div className={styles.retrospectiveCard}>
              <p className={styles.resultLabel}>{t('output.retrospectiveLabel')}</p>
              <p className={styles.resultValueMuted}>
                {formatCurrency(retrospectiveResult.todayPurchasingPower, form.country, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className={styles.resultRate}>
                {t('output.retrospectiveDetail', {
                  percent: retrospectiveResult.percentLoss.toFixed(0),
                  lost: formatCurrency(retrospectiveResult.lostToInflation, form.country, {
                    maximumFractionDigits: 0,
                  }),
                  cumulative: (retrospectiveResult.cumulative * 100).toFixed(0),
                })}
              </p>
              <span
                className={`${styles.confidenceBadge} ${
                  confidence === 'HIGH' ? styles.confidenceHigh : styles.confidenceMedium
                }`}
              >
                {tShared(`confidence.${confidence.toLowerCase()}`)}
              </span>
              {confidence === 'MEDIUM' && (
                <p className={styles.uncertaintyNote}>{t('output.uncertaintyMedium')}</p>
              )}
            </div>
          );
        })()}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default InflationImpactCalculator;
