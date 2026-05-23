'use client';

/**
 * Asset History Calculator — retrospective tool.
 *
 * Phase E original (2026-05-16): 8 assets × 2 start years × 2 modes = 32 combos.
 * Phase E v2 (TOOLS_IMPROVEMENT.md, 2026-05-23): expanded to 17 start years
 * (2010–2026) via monthly OHLC replay (`calculateAssetHistoryDcaReplay`).
 * Adds PT2 toggle "Returns basis: with dividends / price only" for the 4
 * TR-affected assets (SP500/QQQ/MSCI_WORLD/TLT). Preserves audit M6 calm-framing
 * confidence stratification (BTC 2010–2012 LOW, BTC 2013+ MEDIUM, others HIGH).
 *
 * Math: `calculateAssetHistoryDcaReplay()` / `calculateAssetHistoryLumpSum()`
 * from `lib/asset-history/`, which reads `marketDataService.getMonthlySeries()`.
 * No direct imports from data/*.json outside `lib/market-data/` (§6.10).
 */

import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import { useLocale } from '@/components/Providers';
import {
  calculateAssetHistoryDcaReplay,
  calculateAssetHistoryLumpSum,
  AssetHistoryDataError,
  type ReturnsBasis,
} from '@/lib/asset-history';
import { marketDataService } from '@/lib/market-data';
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

// Phase E v2 (TOOLS_IMPROVEMENT.md): 17-year start-year picker (2010–2026).
// 2010 floors at July (data start) — labeled "2010 (from July)" in UI per Decision BF1.
const START_YEAR_OPTIONS: ReadonlyArray<AssetHistoryStartYear> = [
  2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
  2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
];
const MODE_OPTIONS: ReadonlyArray<AssetHistoryMode> = ['lumpSum', 'monthlyDca'];

// Phase E v2 PT2: only these 4 assets have a meaningful TR / price-only divergence.
// BTC/GOLD have no dividends; IBOVESPA/DAX are native total-return by construction.
const TR_TOGGLE_ASSETS: ReadonlySet<AssetHistoryAssetKey> = new Set(['SP500', 'QQQ', 'MSCI_WORLD', 'TLT']);

interface FormState {
  asset: AssetHistoryAssetKey;
  startYear: AssetHistoryStartYear;
  mode: AssetHistoryMode;
  amount: number;
  returnsBasis: ReturnsBasis;
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
      returnsBasis: 'total_return',
    }),
    [localeKey],
  );
  const [form, setForm] = useState<FormState>(initial);

  // Phase E v2: monthlySeries lazy-loads via the async path. Trigger the load
  // on mount so subsequent sync getSync() inside the calculator has data.
  const [seriesLoaded, setSeriesLoaded] = useState(false);
  useEffect(() => {
    let mounted = true;
    marketDataService.get().then(() => {
      if (mounted) setSeriesLoaded(true);
    }).catch(() => {
      // FallbackProvider can't actually fail; this is defensive only.
      if (mounted) setSeriesLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // The user's display currency (BRL for pt-BR, EUR for es/de, USD for en).
  // Drives both the calculator's FX-path conversion AND the output formatting
  // below. Replaces the prior asset-driven `currencyLocale` heuristic, which
  // mislabeled cross-currency cases (e.g. pt-BR user viewing SP500 in USD).
  const displayCurrency: 'USD' | 'BRL' | 'EUR' = useMemo(() => {
    if (localeKey === 'pt-BR') return 'BRL';
    if (localeKey === 'es' || localeKey === 'de') return 'EUR';
    return 'USD';
  }, [localeKey]);

  const result = useMemo(() => {
    if (!seriesLoaded || form.amount <= 0) return null;
    try {
      const args = {
        asset: form.asset,
        startYear: form.startYear,
        amount: form.amount,
        returnsBasis: form.returnsBasis,
        displayCurrency,
      };
      return form.mode === 'lumpSum'
        ? calculateAssetHistoryLumpSum(args)
        : calculateAssetHistoryDcaReplay(args);
    } catch (err) {
      if (err instanceof AssetHistoryDataError) return null;
      throw err;
    }
  }, [form, seriesLoaded, displayCurrency]);

  const handleAmount = (value: number) =>
    setForm((prev) => ({ ...prev, amount: clamp(value, 0, 1_000_000) }));
  const handleAsset = (asset: AssetHistoryAssetKey) =>
    setForm((prev) => ({ ...prev, asset }));
  const handleStartYear = (startYear: AssetHistoryStartYear) =>
    setForm((prev) => ({ ...prev, startYear }));
  const handleMode = (mode: AssetHistoryMode) => setForm((prev) => ({ ...prev, mode }));
  const handleReturnsBasis = (returnsBasis: ReturnsBasis) =>
    setForm((prev) => ({ ...prev, returnsBasis }));

  // Currency locale: now driven by the user's display currency (which is in
  // turn driven by the user's locale). For en → 'en' (USD), pt-BR → 'pt-BR' (BRL),
  // es/de → 'de' (EUR). The cross-currency math happens inside the calculator
  // via `displayCurrency` and the historical FX path; the UI just formats the
  // pre-converted result in the user's currency.
  const currencyLocale: SupportedLocale = useMemo(() => {
    if (displayCurrency === 'BRL') return 'pt-BR';
    if (displayCurrency === 'EUR') return 'de';
    return 'en';
  }, [displayCurrency]);

  const showBasisToggle = TR_TOGGLE_ASSETS.has(form.asset);

  const isDcaResult = result && 'rangeLow' in result && result.rangeLow !== undefined;

  const summary = result
    ? form.mode === 'lumpSum'
      ? t('output.summaryLumpSum', {
          amount: formatCurrency(form.amount, currencyLocale, { maximumFractionDigits: 0 }),
          startMonth: t(`output.startMonth.${form.startYear === 2010 ? 'jul' : 'jan'}`),
          startYear: form.startYear,
        })
      : t('output.summaryDca', {
          amount: formatCurrency(form.amount, currencyLocale, { maximumFractionDigits: 0 }),
          startMonth: t(`output.startMonth.${form.startYear === 2010 ? 'jul' : 'jan'}`),
          startYear: form.startYear,
        })
    : '';

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-asset`} className={styles.label}>
            {t('inputs.assetLabel')}
            <span
              className={styles.tooltip}
              title={t(`inputs.assetDescriptions.${form.asset}`)}
              aria-label={t(`inputs.assetDescriptions.${form.asset}`)}
              role="note"
              tabIndex={0}
            >
              {' '}
              <sup>?</sup>
            </span>
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
                {y === 2010 ? t('inputs.startYear2010Label') : String(y)}
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
        {showBasisToggle && (
          <div className={styles.field}>
            <label htmlFor={`${baseId}-basis`} className={styles.label}>
              {t('inputs.returnsBasisLabel')}
            </label>
            <Select
              id={`${baseId}-basis`}
              value={form.returnsBasis}
              onChange={(e) => handleReturnsBasis(e.target.value as ReturnsBasis)}
            >
              <option value="total_return">{t('inputs.returnsBasisOptions.totalReturn')}</option>
              <option value="price_only">{t('inputs.returnsBasisOptions.priceOnly')}</option>
            </Select>
          </div>
        )}
      </div>

      {result && (
        <>
          <p className={styles.summary}>{summary}</p>
          <div className={styles.terminalCard}>
            {result.confidence === 'LOW' && isDcaResult ? (
              <>
                <p className={styles.terminalRange}>
                  {t('output.terminalRange', {
                    low: formatCurrency(result.rangeLow!, currencyLocale, { maximumFractionDigits: 0 }),
                    high: formatCurrency(result.rangeHigh!, currencyLocale, { maximumFractionDigits: 0 }),
                  })}
                </p>
                <p className={styles.uncertaintyNote}>{t('output.uncertaintyLow')}</p>
              </>
            ) : (
              <>
                <p className={styles.terminalValue}>
                  {formatCurrency(result.terminalValue, currencyLocale, { maximumFractionDigits: 0 })}
                  {(() => {
                    const contributed = result.totalContributed;
                    if (!contributed || contributed <= 0) return null;
                    const gainPct = (result.terminalValue / contributed - 1) * 100;
                    const isGain = gainPct >= 0;
                    const sign = isGain ? '+' : '';
                    return (
                      <span
                        className={styles.gainBadge}
                        data-direction={isGain ? 'gain' : 'loss'}
                        title={t('inputs.gainBadgeTooltip')}
                        aria-label={t('inputs.gainBadgeTooltip')}
                      >
                        {' '}
                        {sign}{gainPct.toFixed(1)}%
                      </span>
                    );
                  })()}
                </p>
                {isDcaResult && result.confidence !== 'LOW' && (
                  <p className={styles.rangeSubtle}>
                    {t('output.terminalRangeSubtle', {
                      low: formatCurrency(result.rangeLow!, currencyLocale, { maximumFractionDigits: 0 }),
                      high: formatCurrency(result.rangeHigh!, currencyLocale, { maximumFractionDigits: 0 }),
                    })}
                  </p>
                )}
              </>
            )}
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
                {t('output.uncertaintyMedium')}
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
