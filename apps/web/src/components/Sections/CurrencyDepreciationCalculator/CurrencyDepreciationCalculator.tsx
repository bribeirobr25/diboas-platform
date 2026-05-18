'use client';

/**
 * Currency Depreciation Calculator (Tier-2 tool, 6D.3).
 *
 * Two modes:
 *   - Forward: compares 3 outcomes for a today-amount held in a non-USD
 *     currency: cash idle, local bank rate, digital dollar at Historical rate.
 *   - Retrospective (Phase D.1/D.2, 2026-05-16): shows what an amount in
 *     local currency from Jan 2010 was worth in USD then vs now, using
 *     `historicalRateStart` / `historicalRateEnd` from Phase A.
 *
 * Math: `calculateWithCurrencyHedge` and `calculateLumpSum` from market-data
 * formulas. Forward depreciation rate per locale-currency comes from
 * `marketDataService.getSync().exchangeRates.rates[CURRENCY].annualDepreciation`.
 * Retrospective USD-equivalent uses the locked anchor pair from Phase A.
 *
 * For en (USD) where there's no foreign-currency depreciation to model, the
 * tool still works — forward depreciation defaults to 0; retrospective mode
 * surfaces a graceful "pick a non-USD currency" note.
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import { useLocale } from '@/components/Providers';
import {
  LOCALE_CURRENCY,
  calculateLumpSum,
  calculateWithCurrencyHedge,
  marketDataService,
  type SupportedLocale,
} from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import { CURRENCY_DEPRECIATION_DEFAULTS } from '@/lib/tools';
import styles from './CurrencyDepreciationCalculator.module.css';

const HISTORICAL_RATE = SCENARIO_RATES.historical;

type Mode = 'forward' | 'retrospective';

interface FormState {
  amount: number;
  years: number;
  /** Currency override — defaults to user locale's currency; can be changed to compare. */
  currency: string;
}

/** Currencies with depreciation data + sensible bank-rate proxies. */
const CURRENCY_OPTIONS: ReadonlyArray<string> = ['USD', 'BRL', 'EUR'];

/** Pick a representative bank rate when user picks a currency outside their locale. */
const CURRENCY_TO_LOCALE: Record<string, SupportedLocale> = {
  USD: 'en',
  BRL: 'pt-BR',
  EUR: 'de',
};

export function CurrencyDepreciationCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;
  const initialCurrency = LOCALE_CURRENCY[localeKey] ?? 'USD';

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-currency-depreciation.${key}` }, values);

  const initial = useMemo<FormState>(
    () => ({
      amount: CURRENCY_DEPRECIATION_DEFAULTS.amount[localeKey],
      years: CURRENCY_DEPRECIATION_DEFAULTS.years,
      currency: initialCurrency,
    }),
    [localeKey, initialCurrency],
  );
  const [form, setForm] = useState<FormState>(initial);
  const [mode, setMode] = useState<Mode>('forward');
  const currency = form.currency;

  const snapshot = marketDataService.getSync();
  const bankSourceLocale = CURRENCY_TO_LOCALE[currency] ?? localeKey;
  const bankRate = snapshot.rates.bankRates[bankSourceLocale]?.savings ?? 0;
  const currencyRate = currency === 'USD' ? undefined : snapshot.exchangeRates.rates[currency];
  const depreciation = currencyRate?.annualDepreciation ?? 0;

  const forwardResult = useMemo(() => {
    if (mode !== 'forward' || form.amount <= 0 || form.years <= 0) return null;
    // 1. Cash idle — eaten by local depreciation against USD.
    const cashUsdEquivalent = form.amount / Math.pow(1 + depreciation, form.years);
    // 2. Bank yield in local currency (no FX hedge).
    const bankLocal = calculateLumpSum(
      form.amount,
      bankRate / 100,
      0,
      form.years,
    ).nominalFV;
    // 3. Digital dollar at Historical rate via currency hedge.
    const usdcResult = calculateWithCurrencyHedge(
      form.amount,
      HISTORICAL_RATE / 100,
      depreciation,
      0,
      form.years,
    );
    return {
      cashUsdEquivalent,
      bankLocal,
      usdcLocal: usdcResult.nominalFV,
      diboasGain: usdcResult.nominalFV - form.amount,
    };
  }, [mode, form, bankRate, depreciation]);

  // Retrospective (Phase D.2): "your amount in local currency from Jan 2010
  // → USD equivalent then vs now". Uses Phase A's historicalRateStart and
  // historicalRateEnd directly (not the CAGR, since the anchor pair is the
  // primary data point — CAGR is derived from it).
  const retrospectiveResult = useMemo(() => {
    if (mode !== 'retrospective' || form.amount <= 0) return null;
    if (currency === 'USD' || !currencyRate?.historicalRateStart || !currencyRate?.historicalRateEnd) {
      return null;
    }
    const usdValueThen = form.amount / currencyRate.historicalRateStart;
    const usdValueNow = form.amount / currencyRate.historicalRateEnd;
    const percentLossInUsdTerms = (1 - usdValueNow / usdValueThen) * 100;
    return {
      usdValueThen,
      usdValueNow,
      percentLossInUsdTerms,
      historicalCagr: currencyRate.historicalCagr ?? 0,
      rateStart: currencyRate.historicalRateStart,
      rateEnd: currencyRate.historicalRateEnd,
    };
  }, [mode, form.amount, currency, currencyRate]);

  const handleNumber = (field: 'amount' | 'years', value: number) =>
    setForm((prev) => ({ ...prev, [field]: clamp(value, 0, 1_000_000_000) }));
  const handleCurrency = (newCurrency: string) =>
    setForm((prev) => ({ ...prev, currency: newCurrency }));

  const isUsd = currency === 'USD';
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

      {mode === 'forward' && isUsd && (
        <p className={styles.usdNote}>{t('output.usdLocaleNote')}</p>
      )}
      {mode === 'retrospective' && isUsd && (
        <p className={styles.usdNote}>{t('output.usdRetrospectiveNote')}</p>
      )}

      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-currency`} className={styles.label}>
            {t('inputs.currencyLabel')}
          </label>
          <Select
            id={`${baseId}-currency`}
            value={currency}
            onChange={(e) => handleCurrency(e.target.value)}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-amount`} className={styles.label}>
            {mode === 'forward'
              ? t('inputs.amountLabel', { currency })
              : t('inputs.amountLabel2010', { currency })}
          </label>
          <input
            id={`${baseId}-amount`}
            type="number"
            inputMode="decimal"
            min={0}
            step={1000}
            value={form.amount}
            onChange={(e) => handleNumber('amount', Number(e.target.value))}
            className={styles.numberInput}
          />
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
            {!isUsd && (
              <span className={styles.help}>
                {t('inputs.depreciationHelp', {
                  rate: (depreciation * 100).toFixed(1),
                  currency,
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {mode === 'forward' && forwardResult && (
        <div className={styles.resultsGrid}>
          {!isUsd && (
            <div className={styles.resultCardCash}>
              <p className={styles.resultLabel}>{t('output.cashLabel')}</p>
              <p className={styles.resultValueMuted}>
                {formatCurrency(forwardResult.cashUsdEquivalent, localeKey, { maximumFractionDigits: 0 })}
              </p>
              <p className={styles.resultRate}>
                {t('output.cashUsdEquivalent', {
                  rate: (depreciation * 100).toFixed(1),
                })}
              </p>
            </div>
          )}
          <div className={styles.resultCardBank}>
            <p className={styles.resultLabel}>{t('output.bankLabel')}</p>
            <p className={styles.resultValueMuted}>
              {formatCurrency(forwardResult.bankLocal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.bankRateNote', { rate: bankRate.toFixed(2) })}
            </p>
          </div>
          <div className={styles.resultCardDiboas}>
            <p className={styles.resultLabel}>{t('output.diboasLabel')}</p>
            <p className={styles.resultValue}>
              {formatCurrency(forwardResult.usdcLocal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.diboasNote', { rate: HISTORICAL_RATE.toString() })}
            </p>
          </div>
        </div>
      )}

      {mode === 'retrospective' && retrospectiveResult && (
        <div className={styles.resultsGrid}>
          <div className={styles.resultCardCash}>
            <p className={styles.resultLabel}>{t('output.retrospectiveThenLabel')}</p>
            <p className={styles.resultValueMuted}>
              {formatCurrency(retrospectiveResult.usdValueThen, 'en', { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.retrospectiveThenNote', {
                currency,
                rate: retrospectiveResult.rateStart.toFixed(2),
              })}
            </p>
          </div>
          <div className={styles.resultCardBank}>
            <p className={styles.resultLabel}>{t('output.retrospectiveNowLabel')}</p>
            <p className={styles.resultValueMuted}>
              {formatCurrency(retrospectiveResult.usdValueNow, 'en', { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.retrospectiveNowNote', {
                currency,
                rate: retrospectiveResult.rateEnd.toFixed(2),
              })}
            </p>
          </div>
          <div className={styles.resultCardDiboas}>
            <p className={styles.resultLabel}>{t('output.retrospectiveLossLabel')}</p>
            <p className={styles.resultValue}>
              −{retrospectiveResult.percentLossInUsdTerms.toFixed(0)}%
            </p>
            <p className={styles.resultRate}>
              {t('output.retrospectiveLossNote', {
                currency,
                cagr: (retrospectiveResult.historicalCagr * 100).toFixed(2),
              })}
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

export default CurrencyDepreciationCalculator;
