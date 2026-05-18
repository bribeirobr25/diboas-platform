'use client';

/**
 * Asset History Calculator — retrospective tool (Phase E, 2026-05-16).
 *
 * 8 assets × 2 start years × 2 modes = 32 combos. Renders confidence-stratified
 * output per audit M6:
 *   - HIGH:   single terminal number ±5%
 *   - MEDIUM: single number with explicit ± uncertainty note
 *   - LOW:    RANGE display, NOT a single number — calm-framing
 *
 * Math: `calculateAssetHistory()` from `lib/asset-history/`, which reads the
 * Phase C anchor table via `marketDataService.getHistoricalAnchors()`. No
 * direct imports from `historical.ts` outside `lib/market-data/` (§6.10).
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import { useLocale } from '@/components/Providers';
import {
  calculateAssetHistory,
  AssetHistoryDataError,
  type AssetHistoryArgs,
} from '@/lib/asset-history';
import {
  ASSET_HISTORY_DEFAULTS,
  type AssetHistoryAssetKey,
  type AssetHistoryMode,
  type AssetHistoryStartYear,
} from '@/lib/tools';
import { formatCurrency } from '@/lib/compound-interest';
import type { SupportedLocale } from '@diboas/i18n/config';
import styles from '../../AssetHistoryCalculator.module.css';

const ASSET_OPTIONS: ReadonlyArray<AssetHistoryAssetKey> = [
  'BTC',
  'SP500',
  'QQQ',
  'MSCI_WORLD',
  'GOLD',
  'TLT',
  'IBOVESPA',
  'DAX',
];
const START_YEAR_OPTIONS: ReadonlyArray<AssetHistoryStartYear> = [2010, 2016];
const MODE_OPTIONS: ReadonlyArray<AssetHistoryMode> = ['lumpSum', 'monthlyDca'];

function localizedMonthName(monthIndicative: number, locale: string): string {
  // monthIndicative is 1-based; Date months are 0-based.
  const date = new Date(Date.UTC(2000, monthIndicative - 1, 1));
  return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(date);
}

interface FormState {
  asset: AssetHistoryAssetKey;
  startYear: AssetHistoryStartYear;
  mode: AssetHistoryMode;
  amount: number;
}

export function AssetHistoryCalculatorDefault() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-asset-history.${key}` }, values);

  const initial = useMemo<FormState>(
    () => ({
      asset: ASSET_HISTORY_DEFAULTS.asset[localeKey],
      startYear: ASSET_HISTORY_DEFAULTS.startYear,
      mode: ASSET_HISTORY_DEFAULTS.mode,
      amount: ASSET_HISTORY_DEFAULTS.contribution[localeKey],
    }),
    [localeKey],
  );
  const [form, setForm] = useState<FormState>(initial);

  const result = useMemo(() => {
    if (form.amount <= 0) return null;
    try {
      const args: AssetHistoryArgs = {
        asset: form.asset,
        startYear: form.startYear,
        mode: form.mode,
        amount: form.amount,
      };
      return calculateAssetHistory(args);
    } catch (err) {
      if (err instanceof AssetHistoryDataError) return null;
      throw err;
    }
  }, [form]);

  const handleAmount = (value: number) =>
    setForm((prev) => ({ ...prev, amount: clamp(value, 0, 1_000_000) }));
  const handleAsset = (asset: AssetHistoryAssetKey) =>
    setForm((prev) => ({ ...prev, asset }));
  const handleStartYear = (startYear: AssetHistoryStartYear) =>
    setForm((prev) => ({ ...prev, startYear }));
  const handleMode = (mode: AssetHistoryMode) => setForm((prev) => ({ ...prev, mode }));

  const startMonth = result?.startAnchor.monthIndicative ?? 7;
  const startMonthName = localizedMonthName(startMonth, localeKey);

  const currencyLocale: SupportedLocale = useMemo(() => {
    if (!result) return localeKey;
    if (result.endAnchor.currency === 'BRL') return 'pt-BR';
    if (result.endAnchor.currency === 'EUR') return 'de';
    return 'en';
  }, [result, localeKey]);

  const summary = result
    ? form.mode === 'lumpSum'
      ? t('output.summaryLumpSum', {
          amount: formatCurrency(form.amount, currencyLocale, { maximumFractionDigits: 0 }),
          startMonth: startMonthName,
          startYear: form.startYear,
        })
      : t('output.summaryDca', {
          amount: formatCurrency(form.amount, currencyLocale, { maximumFractionDigits: 0 }),
          startMonth: startMonthName,
          startYear: form.startYear,
        })
    : '';

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-asset`} className={styles.label}>
            {t('inputs.assetLabel')}
          </label>
          <Select
            id={`${baseId}-asset`}
            value={form.asset}
            onChange={(e) => handleAsset(e.target.value as AssetHistoryAssetKey)}
          >
            {ASSET_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {t(`inputs.assetOptions.${opt}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-startYear`} className={styles.label}>
            {t('inputs.startYearLabel')}
          </label>
          <Select
            id={`${baseId}-startYear`}
            value={form.startYear}
            onChange={(e) => handleStartYear(Number(e.target.value) as AssetHistoryStartYear)}
          >
            {START_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-mode`} className={styles.label}>
            {t('inputs.modeLabel')}
          </label>
          <Select
            id={`${baseId}-mode`}
            value={form.mode}
            onChange={(e) => handleMode(e.target.value as AssetHistoryMode)}
          >
            {MODE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t(`inputs.modeOptions.${m}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-amount`} className={styles.label}>
            {t('inputs.contributionLabel', { mode: form.mode })}
          </label>
          <input
            id={`${baseId}-amount`}
            type="number"
            inputMode="decimal"
            min={0}
            step={form.mode === 'lumpSum' ? 100 : 10}
            value={form.amount}
            onChange={(e) => handleAmount(Number(e.target.value))}
            className={styles.numberInput}
          />
        </div>
      </div>

      {result && (
        <>
          <p className={styles.summary}>{summary}</p>
          <div className={styles.terminalCard}>
            {result.confidence === 'LOW' && result.rangeLow !== undefined && result.rangeHigh !== undefined ? (
              <>
                <p className={styles.terminalRange}>
                  {t('output.terminalRange', {
                    low: formatCurrency(result.rangeLow, currencyLocale, { maximumFractionDigits: 0 }),
                    high: formatCurrency(result.rangeHigh, currencyLocale, { maximumFractionDigits: 0 }),
                  })}
                </p>
                <p className={styles.uncertaintyNote}>{t('output.uncertaintyLow')}</p>
              </>
            ) : result.terminalValue !== null ? (
              <p className={styles.terminalValue}>
                {formatCurrency(result.terminalValue, currencyLocale, { maximumFractionDigits: 0 })}
              </p>
            ) : null}
            <p className={styles.totalContributed}>
              {form.mode === 'monthlyDca'
                ? t('output.contributedOverMonths', {
                    total: formatCurrency(result.totalContributed, currencyLocale, { maximumFractionDigits: 0 }),
                    months: result.months,
                  })
                : t('output.startingPrincipal', {
                    total: formatCurrency(result.totalContributed, currencyLocale, { maximumFractionDigits: 0 }),
                  })}
            </p>
            <span className={`${styles.confidenceBadge} ${confidenceClass(result.confidence)}`}>
              {t(`output.confidence${capitalize(result.confidence)}`)}
            </span>
            {result.confidence === 'MEDIUM' && (
              <p className={styles.uncertaintyNote}>
                {t('output.uncertaintyMedium', {
                  asset: t(`inputs.assetOptions.${result.startAnchor.asset}`),
                  year: result.startAnchor.year,
                  used: formatCurrency(result.startAnchor.price, currencyLocale, {
                    maximumFractionDigits: result.startAnchor.price < 10 ? 2 : 0,
                  }),
                })}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function confidenceClass(c: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  if (c === 'HIGH') return styles.confidenceHigh ?? '';
  if (c === 'MEDIUM') return styles.confidenceMedium ?? '';
  return styles.confidenceLow ?? '';
}

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default AssetHistoryCalculatorDefault;
