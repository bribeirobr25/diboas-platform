'use client';

/**
 * Card Fee Savings Calculator (Tier-3 B2B tool, 6E.1).
 *
 * Math: `projectCardFeeSavings` from lib/business/cardFees.
 * v1 caveat surfaced verbatim per plan §6E.1: "Real savings depend on your
 * customer mix; this is an upper-bound estimate."
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { projectCardFeeSavings } from '@/lib/business';
import { type SupportedLocale } from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import { CARD_FEES_DEFAULTS } from '@/lib/tools';
import styles from './CardFeesCalculator.module.css';

interface FormState {
  monthlyVolume: number;
  /** Stored as percent number (e.g., 2.9 for 2.9%) — converted to decimal at math time. */
  processorFeePct: number;
  avgTransactionAmount: number;
}

export function CardFeesCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-card-fees.${key}` }, values);

  const initial = useMemo<FormState>(
    () => ({
      monthlyVolume: CARD_FEES_DEFAULTS.monthlyVolume[localeKey],
      // `* 100` produces 2.9000000000000004 due to float precision; round to 2dp.
      processorFeePct:
        Math.round(CARD_FEES_DEFAULTS.processorFeeRate[localeKey] * 10000) / 100,
      avgTransactionAmount: CARD_FEES_DEFAULTS.avgTransactionAmount[localeKey],
    }),
    [localeKey],
  );
  const [form, setForm] = useState<FormState>(initial);

  const result = useMemo(() => {
    if (form.monthlyVolume <= 0 || form.processorFeePct <= 0) return null;
    return projectCardFeeSavings(
      form.monthlyVolume,
      form.processorFeePct / 100,
      form.avgTransactionAmount > 0 ? form.avgTransactionAmount : undefined,
    );
  }, [form]);

  const handleChange = (field: keyof FormState, value: number) =>
    setForm((prev) => ({ ...prev, [field]: clamp(value, 0, 1_000_000_000) }));

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-volume`} className={styles.label}>
            {t('inputs.monthlyVolumeLabel')}
          </label>
          <input
            id={`${baseId}-volume`}
            type="number"
            inputMode="decimal"
            min={0}
            step={1000}
            value={form.monthlyVolume}
            onChange={(e) => handleChange('monthlyVolume', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.monthlyVolumeHelp')}</span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-fee`} className={styles.label}>
            {t('inputs.processorFeeLabel')}
          </label>
          <input
            id={`${baseId}-fee`}
            type="number"
            inputMode="decimal"
            min={0}
            max={20}
            step={0.1}
            value={form.processorFeePct}
            onChange={(e) => handleChange('processorFeePct', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.processorFeeHelp')}</span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-avg`} className={styles.label}>
            {t('inputs.avgTxLabel')}
          </label>
          <input
            id={`${baseId}-avg`}
            type="number"
            inputMode="decimal"
            min={0}
            step={5}
            value={form.avgTransactionAmount}
            onChange={(e) => handleChange('avgTransactionAmount', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.avgTxHelp')}</span>
        </div>
      </div>

      {result && (
        <>
          <div className={styles.resultsGrid}>
            <div className={styles.resultCardBank}>
              <p className={styles.resultLabel}>{t('output.monthlyFee')}</p>
              <p className={styles.resultValueMuted}>
                {formatCurrency(result.monthlyFeePaid, localeKey, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className={styles.resultCardBank}>
              <p className={styles.resultLabel}>{t('output.annualFee')}</p>
              <p className={styles.resultValueMuted}>
                {formatCurrency(result.annualFeePaid, localeKey, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className={styles.resultCardDiboas}>
              <p className={styles.resultLabel}>{t('output.annualSavings')}</p>
              <p className={styles.resultValue}>
                {formatCurrency(result.annualSavingsWithDiboas, localeKey, {
                  maximumFractionDigits: 0,
                })}
              </p>
              {result.perTransactionFee != null && (
                <p className={styles.resultRate}>
                  {t('output.perTxLabel')}:{' '}
                  {formatCurrency(result.perTransactionFee, localeKey, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          </div>
          <p className={styles.caveat}>{t('output.caveat')}</p>
        </>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default CardFeesCalculator;
