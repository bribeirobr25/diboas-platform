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
import { useResultShare } from '@/hooks/useResultShare';
import { marketDataService, type SupportedLocale } from '@/lib/market-data';
import { formatCurrency, getCurrencyCode } from '@/lib/compound-interest';
import { calculateIdleCashYield } from '@/lib/idle-cash';
import { IDLE_CASH_BANK_YIELD_PCT_BOUNDS, IDLE_CASH_DEFAULTS, clampInput } from '@/lib/tools';
import { UsdEquivalentBadge } from '@/components/UI';
import { ResultMoment, type ResultMomentSupportingPoint } from '@/components/Sections/ResultMoment';
import type { DivergenceSeries } from '@/components/UI/DivergenceChart';
import styles from './IdleCashCalculator.module.css';

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
  const tShared = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-shared.${key}` }, values);

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

  // Result-moment share (Phase 3). Idle cash has no currency picker — figures
  // are in the locale currency. Hero = the diBoaS future value. Hook is called
  // unconditionally (rules-of-hooks); the control only renders with a result.
  const fmtMoney = (n: number) => formatCurrency(n, localeKey, { maximumFractionDigits: 0 });
  const diboasFvValue = result?.diboasFV ?? 0;
  // When the bank out-earns diBoaS (C37, e.g. Brazilian CDI) the diBoaS figure
  // is real but not a "win" — render it neutral, not celebratory teal.
  const idleTone: 'positive' | 'neutral' = result && result.difference < 0 ? 'neutral' : 'positive';
  const resultShare = useResultShare({
    toolKey: 'idle-cash',
    value: diboasFvValue,
    currency: getCurrencyCode(localeKey),
    years: form.years,
    locale: localeKey,
    tone: idleTone,
    shareText: t('resultMoment.shareText', { value: fmtMoney(diboasFvValue), years: form.years }),
    shareTitle: tShared('resultMoment.shareTitle'),
  });

  const handleChange = (field: keyof FormState, value: number) =>
    setForm((prev) => {
      if (field === 'bankYieldPct') {
        // C36 close: 0-50% real clamp matches UI <input max>.
        return { ...prev, bankYieldPct: clampInput(value, IDLE_CASH_BANK_YIELD_PCT_BOUNDS) };
      }
      return { ...prev, [field]: clamp(value, 0, 1_000_000_000) };
    });

  const formattedCash = formatCurrency(form.idleCash, localeKey, { maximumFractionDigits: 0 });

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

      {result &&
        (() => {
          // C37 honesty preserved: the disclaimer branches on sign(difference).
          // Positive → diBoaS earns more; zero → matches; negative → the bank
          // actually out-earns diBoaS' conservative scenario (e.g. Brazilian CDI
          // beats 7%). The math returns the signed value; the copy reflects it.
          const formattedDiff = fmtMoney(Math.abs(result.difference));
          const differenceText =
            result.difference > 0
              ? t('output.differencePositive', {
                  cash: formattedCash,
                  years: form.years,
                  difference: formattedDiff,
                })
              : result.difference === 0
                ? t('output.differenceZero', { years: form.years })
                : t('output.differenceNegative', {
                    bankRate: form.bankYieldPct.toFixed(2),
                    years: form.years,
                  });

          const series: DivergenceSeries[] = [
            {
              id: 'bank',
              label: tShared('resultMoment.chartBank'),
              values: [form.idleCash, result.bankFV],
              variant: 'muted',
            },
            {
              id: 'diboas',
              label: tShared('resultMoment.chartDiboas'),
              values: [form.idleCash, result.diboasFV],
              variant: 'primary',
            },
          ];
          const points: ResultMomentSupportingPoint[] = [
            {
              id: 'bank',
              label: t('output.bankLabel'),
              value: fmtMoney(result.bankFV),
              note: t('output.bankNote', { rate: form.bankYieldPct.toFixed(2), years: form.years }),
              variant: 'muted',
            },
          ];

          return (
            <ResultMoment
              eyebrow={t('resultMoment.eyebrow')}
              headlineValue={result.diboasFV}
              headlineFormatter={fmtMoney}
              headlineTone={idleTone}
              headlineCaption={t('output.diboasLabel')}
              chart={{
                series,
                xCaptions: [
                  tShared('resultMoment.chartStart'),
                  tShared('resultMoment.chartEnd', { years: form.years }),
                ],
                formatValue: fmtMoney,
                ariaLabel: t('resultMoment.chartAria', { years: form.years }),
              }}
              supportingPoints={points}
              disclaimer={differenceText}
              cta={{
                headline: tShared('resultMoment.ctaHeadline'),
                body: tShared('resultMoment.ctaBody'),
                label: tShared('resultMoment.ctaLabel'),
                href: '/business?source=tool_idle-cash',
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

export default IdleCashCalculator;
