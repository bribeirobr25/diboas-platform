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
import { useCalculatorAnalytics } from '@/hooks/useCalculatorAnalytics';
import { useResultShare } from '@/hooks/useResultShare';
import { projectCardFeeSavings } from '@/lib/card-fees';
import { type SupportedLocale } from '@/lib/market-data';
import { formatCurrency, getCurrencyCode } from '@/lib/compound-interest';
import {
  CARD_FEES_DEFAULTS,
  CARD_FEES_PROCESSOR_FEE_PCT_BOUNDS,
  clampInput,
  exceedsSoftMaxWarning,
} from '@/lib/tools';
import { ResultMoment, type ResultMomentSupportingPoint } from '@/components/Sections/ResultMoment';
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
  const tShared = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-shared.${key}` }, values);

  const initial = useMemo<FormState>(
    () => ({
      monthlyVolume: CARD_FEES_DEFAULTS.monthlyVolume[localeKey],
      // `* 100` produces 2.9000000000000004 due to float precision; round to 2dp.
      processorFeePct: Math.round(CARD_FEES_DEFAULTS.processorFeeRate[localeKey] * 10000) / 100,
      avgTransactionAmount: CARD_FEES_DEFAULTS.avgTransactionAmount[localeKey],
    }),
    [localeKey]
  );
  const [form, setForm] = useState<FormState>(initial);

  const result = useMemo(() => {
    if (form.monthlyVolume <= 0 || form.processorFeePct <= 0) return null;
    return projectCardFeeSavings(
      form.monthlyVolume,
      form.processorFeePct / 100,
      form.avgTransactionAmount > 0 ? form.avgTransactionAmount : undefined
    );
  }, [form]);

  // A16/O-1: open + compute analytics, uniform with the CalculatorDefault tools.
  useCalculatorAnalytics('card-fees', localeKey, result ? JSON.stringify(form) : null);

  // Result-moment share (Phase 3). B2B savings snapshot (no time axis → no
  // chart, no years). Hero = the annual savings. Hook is unconditional.
  const fmtMoney = (n: number) => formatCurrency(n, localeKey, { maximumFractionDigits: 0 });
  const savingsForShare = result?.annualSavingsWithDiboas ?? 0;
  const resultShare = useResultShare({
    toolKey: 'card-fees',
    value: savingsForShare,
    currency: getCurrencyCode(localeKey),
    locale: localeKey,
    shareText: t('resultMoment.shareText', { value: fmtMoney(savingsForShare) }),
    shareTitle: tShared('resultMoment.shareTitle'),
  });

  const handleChange = (field: keyof FormState, value: number) =>
    setForm((prev) => {
      if (field === 'processorFeePct') {
        // C34 close: cap at 20% matches UI <input max>. C35 soft warning
        // surfaces below the field for values > 5% (catches `29` for `2.9`).
        return { ...prev, processorFeePct: clampInput(value, CARD_FEES_PROCESSOR_FEE_PCT_BOUNDS) };
      }
      return { ...prev, [field]: clamp(value, 0, 1_000_000_000) };
    });

  const showFeeWarning = exceedsSoftMaxWarning(
    form.processorFeePct,
    CARD_FEES_PROCESSOR_FEE_PCT_BOUNDS
  );

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
            min={CARD_FEES_PROCESSOR_FEE_PCT_BOUNDS.min}
            max={CARD_FEES_PROCESSOR_FEE_PCT_BOUNDS.max}
            step={0.1}
            value={form.processorFeePct}
            onChange={(e) => handleChange('processorFeePct', Number(e.target.value))}
            aria-describedby={showFeeWarning ? `${baseId}-fee-warning` : undefined}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.processorFeeHelp')}</span>
          {showFeeWarning && (
            <span
              id={`${baseId}-fee-warning`}
              className={styles.warning}
              role="status"
              aria-live="polite"
            >
              {t('warnings.feeTooHigh')}
            </span>
          )}
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

      {result &&
        (() => {
          // The annual fee equals the savings hero in the 100%-adoption model
          // (savings = the full processor fee), so it's omitted here to avoid
          // showing the same figure twice. The monthly fee + per-transaction
          // fee give the relatable fee context without duplicating the hero.
          const points: ResultMomentSupportingPoint[] = [
            {
              id: 'monthly-fee',
              label: t('output.monthlyFee'),
              value: fmtMoney(result.monthlyFeePaid),
              variant: 'muted',
            },
          ];
          if (result.perTransactionFee != null) {
            points.push({
              id: 'per-tx',
              label: t('output.perTxLabel'),
              value: formatCurrency(result.perTransactionFee, localeKey, {
                maximumFractionDigits: 2,
              }),
              variant: 'muted',
            });
          }

          return (
            <ResultMoment
              eyebrow={t('resultMoment.eyebrow')}
              headlineValue={result.annualSavingsWithDiboas}
              headlineFormatter={fmtMoney}
              headlineCaption={t('output.annualSavings')}
              supportingPoints={points}
              disclaimer={t('output.caveat')}
              cta={{
                headline: tShared('resultMoment.ctaHeadline'),
                body: tShared('resultMoment.ctaBody'),
                label: tShared('resultMoment.ctaLabel'),
                href: '/business?source=tool_card-fees',
              }}
              share={{
                onShare: resultShare.share,
                label: tShared('resultMoment.shareButton'),
                copiedLabel: tShared('resultMoment.shareCopied'),
                copied: resultShare.copied,
              }}
            />
          );
        })()}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default CardFeesCalculator;
