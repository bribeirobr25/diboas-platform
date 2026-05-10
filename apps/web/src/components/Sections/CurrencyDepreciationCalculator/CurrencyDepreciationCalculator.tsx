'use client';

/**
 * Currency Depreciation Calculator (Tier-2 tool, 6D.3).
 *
 * Compares 3 outcomes for a today-amount held in a non-USD currency:
 *   - Cash idle (full hit from local-currency depreciation)
 *   - Local bank rate (partial hedge — yield offsets some depreciation)
 *   - USDC at 7% historical-yield (full hedge via `calculateWithCurrencyHedge`)
 *
 * Math: `calculateWithCurrencyHedge` and `calculateLumpSum` from market-data
 * formulas. Depreciation rate per locale-currency comes from
 * `marketDataService.getSync().exchangeRates.rates[CURRENCY].annualDepreciation`.
 *
 * For en (USD) where there's no foreign-currency depreciation to model, the
 * tool still works — depreciation defaults to 0 and the comparison reduces
 * to bank yield vs USDC 7%.
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
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
  const currency = form.currency;

  const snapshot = marketDataService.getSync();
  const bankSourceLocale = CURRENCY_TO_LOCALE[currency] ?? localeKey;
  const bankRate = snapshot.rates.bankRates[bankSourceLocale]?.savings ?? 0;
  const depreciation =
    currency === 'USD' ? 0 : (snapshot.exchangeRates.rates[currency]?.annualDepreciation ?? 0);

  const result = useMemo(() => {
    if (form.amount <= 0 || form.years <= 0) return null;
    // 1. Cash idle — eaten by local depreciation against USD.
    const cashUsdEquivalent = form.amount / Math.pow(1 + depreciation, form.years);
    // 2. Bank yield in local currency (no FX hedge).
    const bankLocal = calculateLumpSum(
      form.amount,
      bankRate / 100,
      0,
      form.years,
    ).nominalFV;
    // 3. USDC at 7% via currency hedge — yield AND depreciation kicker.
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
  }, [form, bankRate, depreciation]);

  const handleNumber = (field: 'amount' | 'years', value: number) =>
    setForm((prev) => ({ ...prev, [field]: clamp(value, 0, 1_000_000_000) }));
  const handleCurrency = (newCurrency: string) =>
    setForm((prev) => ({ ...prev, currency: newCurrency }));

  const isUsd = currency === 'USD';

  return (
    <div className={styles.calculator}>
      {isUsd && (
        <p className={styles.usdNote}>{t('output.usdLocaleNote')}</p>
      )}

      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-currency`} className={styles.label}>
            {t('inputs.currencyLabel')}
          </label>
          <select
            id={`${baseId}-currency`}
            value={currency}
            onChange={(e) => handleCurrency(e.target.value)}
            className={styles.select}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-amount`} className={styles.label}>
            {t('inputs.amountLabel', { currency })}
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
      </div>

      {result && (
        <div className={styles.resultsGrid}>
          {!isUsd && (
            <div className={styles.resultCardCash}>
              <p className={styles.resultLabel}>{t('output.cashLabel')}</p>
              <p className={styles.resultValueMuted}>
                {formatCurrency(result.cashUsdEquivalent, localeKey, { maximumFractionDigits: 0 })}
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
              {formatCurrency(result.bankLocal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.bankRateNote', { rate: bankRate.toFixed(2) })}
            </p>
          </div>
          <div className={styles.resultCardDiboas}>
            <p className={styles.resultLabel}>{t('output.diboasLabel')}</p>
            <p className={styles.resultValue}>
              {formatCurrency(result.usdcLocal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.diboasNote', { rate: HISTORICAL_RATE.toString() })}
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
