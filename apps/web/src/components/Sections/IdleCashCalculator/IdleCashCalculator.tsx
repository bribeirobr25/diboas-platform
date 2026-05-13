'use client';

/**
 * Idle Cash Yield Calculator (Tier-3 B2B tool, 6E.2).
 *
 * Per plan §6E.2: inputs are idle business cash + current bank yield (input,
 * defaulting to the locale's bank-savings rate) + years. Output is the
 * narrative comparison "Your $X earns ~$Y/year in your bank vs ~$Z/year at
 * diBoaS conservative-yield. Over N years: difference of $W."
 *
 * Math uses `calculateLumpSum` from market-data formulas — same engine as
 * the compound-interest calculator, just with bespoke B2B framing per plan
 * "Engine reuse: compound-interest calculator with B2B framing."
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import {
  calculateLumpSum,
  calculateWithCurrencyHedge,
  marketDataService,
  type SupportedLocale,
} from '@/lib/market-data';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import { formatCurrency } from '@/lib/compound-interest';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import { IDLE_CASH_DEFAULTS } from '@/lib/tools';
import styles from './IdleCashCalculator.module.css';

const CONSERVATIVE_RATE = SCENARIO_RATES.conservative; // 7

interface FormState {
  idleCash: number;
  years: number;
  /** Stored as percent number (e.g., 0.32 for 0.32%) — converted to decimal at math time. */
  bankYieldPct: number;
}

export function IdleCashCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-idle-cash.${key}` }, values);

  const snapshot = marketDataService.getSync();
  const defaultBankYieldPct = snapshot.rates.bankRates[localeKey]?.savings ?? 0.32;
  // Phase-7 NF1 — currency-hedge math for non-USD locales (precedent:
  // ComparisonTable.tsx:36-58). en stays nominal; pt-BR/de/es use
  // calculateWithCurrencyHedge with locale depreciation.
  const localeCurrency = LOCALE_CURRENCY[localeKey];
  const depreciation =
    localeCurrency && localeCurrency !== 'USD'
      ? snapshot.exchangeRates.rates[localeCurrency]?.annualDepreciation ?? 0
      : 0;

  const initial = useMemo<FormState>(
    () => ({
      idleCash: IDLE_CASH_DEFAULTS.idleCash[localeKey],
      years: IDLE_CASH_DEFAULTS.years,
      // Round to 2dp to avoid float-precision artifacts in the input field.
      bankYieldPct: Math.round(defaultBankYieldPct * 100) / 100,
    }),
    [localeKey, defaultBankYieldPct],
  );
  const [form, setForm] = useState<FormState>(initial);

  const result = useMemo(() => {
    if (form.idleCash <= 0 || form.years <= 0) return null;
    // Bank stays nominal in local currency (no hedge — bank pays in BRL/EUR/USD).
    const bankFV = calculateLumpSum(
      form.idleCash,
      form.bankYieldPct / 100,
      0,
      form.years,
    ).nominalFV;
    // diBoaS uses canonical effective-rate hedge for non-USD locales.
    const diboasFV =
      depreciation > 0
        ? calculateWithCurrencyHedge(
            form.idleCash,
            CONSERVATIVE_RATE / 100,
            depreciation,
            0,
            form.years,
          ).nominalFV
        : calculateLumpSum(
            form.idleCash,
            CONSERVATIVE_RATE / 100,
            0,
            form.years,
          ).nominalFV;
    return {
      bankFV,
      bankGain: bankFV - form.idleCash,
      diboasFV,
      diboasGain: diboasFV - form.idleCash,
      difference: diboasFV - bankFV,
    };
  }, [form, depreciation]);

  const handleChange = (field: keyof FormState, value: number) =>
    setForm((prev) => ({ ...prev, [field]: clamp(value, 0, 1_000_000_000) }));

  const currency = formatCurrency(form.idleCash, localeKey, { maximumFractionDigits: 0 });

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-cash`} className={styles.label}>
            {t('inputs.idleCashLabel')}
          </label>
          <input
            id={`${baseId}-cash`}
            type="number"
            inputMode="decimal"
            min={0}
            step={10000}
            value={form.idleCash}
            onChange={(e) => handleChange('idleCash', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.idleCashHelp')}</span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-yield`} className={styles.label}>
            {t('inputs.bankYieldLabel')}
          </label>
          <input
            id={`${baseId}-yield`}
            type="number"
            inputMode="decimal"
            min={0}
            max={50}
            step={0.1}
            value={form.bankYieldPct}
            onChange={(e) => handleChange('bankYieldPct', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>
            {t('inputs.bankYieldHelp', { rate: defaultBankYieldPct.toFixed(2) })}
          </span>
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
            onChange={(e) => handleChange('years', Math.round(Number(e.target.value)))}
            className={styles.numberInput}
          />
        </div>
      </div>

      {result && (
        <>
          <div className={styles.resultsGrid}>
            <div className={styles.resultCardBank}>
              <p className={styles.resultLabel}>{t('output.bankLabel')}</p>
              <p className={styles.resultValueMuted}>
                +{formatCurrency(result.bankGain, localeKey, { maximumFractionDigits: 0 })}
              </p>
              <p className={styles.resultRate}>
                {t('output.bankNote', { rate: form.bankYieldPct.toFixed(2), years: form.years })}
              </p>
            </div>
            <div className={styles.resultCardDiboas}>
              <p className={styles.resultLabel}>{t('output.diboasLabel')}</p>
              <p className={styles.resultValue}>
                +{formatCurrency(result.diboasGain, localeKey, { maximumFractionDigits: 0 })}
              </p>
              <p className={styles.resultRate}>
                {t('output.diboasNote', { rate: CONSERVATIVE_RATE, years: form.years })}
              </p>
            </div>
          </div>
          <p className={styles.differenceHighlight}>
            {t('output.differenceHighlight', {
              cash: currency,
              years: form.years,
              difference: formatCurrency(result.difference, localeKey, {
                maximumFractionDigits: 0,
              }),
            })}
          </p>
        </>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default IdleCashCalculator;
