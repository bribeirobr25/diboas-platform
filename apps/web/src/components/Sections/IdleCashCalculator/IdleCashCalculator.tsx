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
import { useCalculatorAnalytics } from '@/hooks/useCalculatorAnalytics';
import { marketDataService, type SupportedLocale } from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import { calculateIdleCashYield, IDLE_CASH_SCENARIO_USD_PERCENT } from '@/lib/idle-cash';
import { IDLE_CASH_BANK_YIELD_PCT_BOUNDS, IDLE_CASH_DEFAULTS, clampInput } from '@/lib/tools';
import { UsdEquivalentBadge } from '@/components/UI';
import styles from './IdleCashCalculator.module.css';

const CONSERVATIVE_RATE = IDLE_CASH_SCENARIO_USD_PERCENT;

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

  const initial = useMemo<FormState>(
    () => ({
      idleCash: IDLE_CASH_DEFAULTS.idleCash[localeKey],
      years: IDLE_CASH_DEFAULTS.years,
      // Round to 2dp to avoid float-precision artifacts in the input field.
      bankYieldPct: Math.round(defaultBankYieldPct * 100) / 100,
    }),
    [localeKey, defaultBankYieldPct]
  );
  const [form, setForm] = useState<FormState>(initial);

  const result = useMemo(
    () =>
      calculateIdleCashYield(
        {
          idleCash: form.idleCash,
          years: form.years,
          bankYieldPct: form.bankYieldPct,
          locale: localeKey,
        },
        snapshot
      ),
    [form, localeKey, snapshot]
  );

  // A16/O-1: open + compute analytics, uniform with the CalculatorDefault tools.
  useCalculatorAnalytics('idle-cash', localeKey, result ? JSON.stringify(form) : null);

  const handleChange = (field: keyof FormState, value: number) =>
    setForm((prev) => {
      if (field === 'bankYieldPct') {
        // C36 close: 0-50% real clamp matches UI <input max>.
        return { ...prev, bankYieldPct: clampInput(value, IDLE_CASH_BANK_YIELD_PCT_BOUNDS) };
      }
      return { ...prev, [field]: clamp(value, 0, 1_000_000_000) };
    });

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
          <span className={styles.help}>
            {t('inputs.idleCashHelp')}
            <UsdEquivalentBadge
              amount={form.idleCash}
              locale={localeKey}
              className={styles.usdEquivalent}
            />
          </span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-yield`} className={styles.label}>
            {t('inputs.bankYieldLabel')}
          </label>
          <input
            id={`${baseId}-yield`}
            type="number"
            inputMode="decimal"
            min={IDLE_CASH_BANK_YIELD_PCT_BOUNDS.min}
            max={IDLE_CASH_BANK_YIELD_PCT_BOUNDS.max}
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
          {/* C37 close (TOOLS_41_DEFECTS_FIX_PLAN.md §6, 2026-05-26): branch
              the headline copy on `sign(difference)`. Positive: diBoaS wins.
              Zero: bank matches diBoaS. Negative: bank wins on yield (e.g.
              Brazilian CDI ~14% beats diBoaS conservative 7% + EUR hedge).
              The math returns the actual signed value (no Math.abs); the
              copy now reflects what the math says instead of always assuming
              positive framing. */}
          <p className={styles.differenceHighlight}>
            {(() => {
              const abs = Math.abs(result.difference);
              const formattedDiff = formatCurrency(abs, localeKey, { maximumFractionDigits: 0 });
              if (result.difference > 0) {
                return t('output.differencePositive', {
                  cash: currency,
                  years: form.years,
                  difference: formattedDiff,
                });
              }
              if (result.difference === 0) {
                return t('output.differenceZero', { years: form.years });
              }
              return t('output.differenceNegative', {
                bankRate: form.bankYieldPct.toFixed(2),
                years: form.years,
              });
            })()}
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
