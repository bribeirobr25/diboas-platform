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
import { useCalculatorAnalytics } from '@/hooks/useCalculatorAnalytics';
import {
  calculateAssetHistoryDcaReplay,
  calculateAssetHistoryLumpSum,
  AssetHistoryDataError,
  type ReturnsBasis,
} from '@/lib/asset-history';
import { marketDataService } from '@/lib/market-data';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { errorReportingService } from '@/lib/errors/ErrorReportingService';
import { useResultShare } from '@/hooks/useResultShare';
import {
  ASSET_HISTORY_DEFAULTS,
  type AssetHistoryAssetKey,
  type AssetHistoryMode,
  type AssetHistoryStartYear,
} from '@/lib/tools';
import { formatCurrency } from '@/lib/compound-interest';
import { ResultMoment, type ResultMomentSupportingPoint } from '@/components/Sections/ResultMoment';
import type { DivergenceSeries } from '@/components/UI/DivergenceChart';
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
  2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
  2026,
];
const MODE_OPTIONS: ReadonlyArray<AssetHistoryMode> = ['lumpSum', 'monthlyDca'];

// Phase E v2 PT2: only these 4 assets have a meaningful TR / price-only divergence.
// BTC/GOLD have no dividends; IBOVESPA/DAX are native total-return by construction.
const TR_TOGGLE_ASSETS: ReadonlySet<AssetHistoryAssetKey> = new Set([
  'SP500',
  'QQQ',
  'MSCI_WORLD',
  'TLT',
]);

interface FormState {
  asset: AssetHistoryAssetKey;
  startYear: AssetHistoryStartYear;
  mode: AssetHistoryMode;
  amount: number;
  returnsBasis: ReturnsBasis;
}

/**
 * Lookup table for the C22 close: maps the `result.startYm.slice(5, 7)` 2-digit
 * month string ("01"–"12") to the i18n key used by `tools-asset-history.startMonth.*`.
 * Hoisted to module scope per CLAUDE.md "Extract default non-primitive values"
 * rule + P9 Performance — recreating this 12-entry record per render burns
 * allocations the function component shouldn't pay (architecture audit V2,
 * 2026-05-26).
 */
const MONTH_KEY_BY_NUMBER: Readonly<Record<string, string>> = {
  '01': 'jan',
  '02': 'feb',
  '03': 'mar',
  '04': 'apr',
  '05': 'may',
  '06': 'jun',
  '07': 'jul',
  '08': 'aug',
  '09': 'sep',
  '10': 'oct',
  '11': 'nov',
  '12': 'dec',
};

export function AssetHistoryCalculatorDefault() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-asset-history.${key}` }, values);
  const tShared = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-shared.${key}` }, values);

  const initial = useMemo<FormState>(
    () => ({
      asset: ASSET_HISTORY_DEFAULTS.asset[localeKey],
      startYear: ASSET_HISTORY_DEFAULTS.startYear,
      mode: ASSET_HISTORY_DEFAULTS.mode,
      amount: ASSET_HISTORY_DEFAULTS.contribution[localeKey],
      returnsBasis: 'total_return',
    }),
    [localeKey]
  );
  const [form, setForm] = useState<FormState>(initial);

  // Phase E v2: monthlySeries lazy-loads via the async path. Trigger the load
  // on mount so subsequent sync getSync() inside the calculator has data.
  const [seriesLoaded, setSeriesLoaded] = useState(false);
  useEffect(() => {
    let mounted = true;
    marketDataService
      .get()
      .then(() => {
        if (mounted) setSeriesLoaded(true);
      })
      .catch(() => {
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

  // C21 close (2026-05-25): the engine SHOULD only throw AssetHistoryDataError.
  // Any other throw (NaN/TypeError from unexpected data, missing monthlySeries
  // shape, non-positive finalBar.close) used to propagate out of the useMemo
  // into the render path and crash the component with no error boundary. Now:
  // catch widened to return null; useEffect below emits a structured event
  // when an unexpected error is captured. Keeps the useMemo pure
  // (react-hooks/purity) while still routing to applicationEventBus.
  const computed = useMemo<{
    result:
      | ReturnType<typeof calculateAssetHistoryDcaReplay>
      | ReturnType<typeof calculateAssetHistoryLumpSum>
      | null;
    unexpectedError: Error | null;
  }>(() => {
    if (!seriesLoaded || form.amount <= 0) return { result: null, unexpectedError: null };
    try {
      const args = {
        asset: form.asset,
        startYear: form.startYear,
        amount: form.amount,
        returnsBasis: form.returnsBasis,
        displayCurrency,
      };
      const r =
        form.mode === 'lumpSum'
          ? calculateAssetHistoryLumpSum(args)
          : calculateAssetHistoryDcaReplay(args);
      return { result: r, unexpectedError: null };
    } catch (err) {
      if (err instanceof AssetHistoryDataError) return { result: null, unexpectedError: null };
      return {
        result: null,
        unexpectedError: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }, [form, seriesLoaded, displayCurrency]);

  const result = computed.result;

  // A16/O-1: open + compute analytics, uniform with the CalculatorDefault tools.
  // (Separate from the existing CALCULATOR_UNEXPECTED_ERROR telemetry below.)
  useCalculatorAnalytics('asset-history', localeKey, result ? JSON.stringify(form) : null);

  useEffect(() => {
    if (!computed.unexpectedError) return;
    // C21 close (TOOLS_41_DEFECTS_FIX_PLAN.md §1.2): emit BOTH (a) the
    // structured tool-specific event AND (b) Sentry capture via the
    // errorReportingService abstraction. Two channels: applicationEventBus
    // feeds in-app monitoring + future analytics dashboards; Sentry feeds
    // production observability + alerts. CALCULATOR_UNEXPECTED_ERROR is
    // distinct from APPLICATION_ERROR so the tools-suite slice is
    // separable in dashboards (per ApplicationEventType v1.2 split).
    const context = {
      asset: form.asset,
      startYear: form.startYear,
      mode: form.mode,
      returnsBasis: form.returnsBasis,
      displayCurrency,
    };
    applicationEventBus.emit(ApplicationEventType.CALCULATOR_UNEXPECTED_ERROR, {
      domain: 'tools',
      source: 'asset-history',
      timestamp: Date.now(),
      error: computed.unexpectedError,
      severity: 'high',
      context,
    });
    errorReportingService.captureException(computed.unexpectedError, {
      tags: { tool: 'asset-history', domain: 'tools' },
      extra: context,
      level: 'error',
    });
  }, [
    computed.unexpectedError,
    form.asset,
    form.startYear,
    form.mode,
    form.returnsBasis,
    displayCurrency,
  ]);

  const handleAmount = (value: number) =>
    setForm((prev) => ({ ...prev, amount: clamp(value, 0, 1_000_000) }));
  const handleAsset = (asset: AssetHistoryAssetKey) => setForm((prev) => ({ ...prev, asset }));
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

  // Result-moment share (Phase 3). Hero = the terminal value; no `years` passed
  // so the yield-specific OG subline is suppressed (this is historical asset
  // performance, not a diBoaS projection). Hook is unconditional.
  const fmtMoney = (n: number) => formatCurrency(n, currencyLocale, { maximumFractionDigits: 0 });
  const terminalValueForShare = result?.terminalValue ?? 0;
  const resultShare = useResultShare({
    toolKey: 'asset-history',
    value: terminalValueForShare,
    currency: displayCurrency,
    locale: localeKey,
    shareText: t('resultMoment.shareText', { value: fmtMoney(terminalValueForShare) }),
    shareTitle: tShared('resultMoment.shareTitle'),
  });

  const showBasisToggle = TR_TOGGLE_ASSETS.has(form.asset);

  const isDcaResult = result && 'rangeLow' in result && result.rangeLow !== undefined;

  // C22 close (2026-05-25): derive the start-month label from the engine's
  // actual `result.startYm` instead of a hardcoded `startYear === 2010 ? 'jul'`
  // heuristic. Pre-fix, DAX-2010 showed "Jul" while the engine correctly used
  // June; SP500-2010 showed "Jul" while the data starts in July (correct by
  // luck, not design). `result.startYm` is the source of truth.
  const startMonthIso = result ? result.startYm.slice(5, 7) : '01';
  const startMonthKey = MONTH_KEY_BY_NUMBER[startMonthIso] ?? 'jan';

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

      {result &&
        (() => {
          // Retrospective honesty: a LOW-confidence window is rendered neutral
          // (never the celebratory teal), a loss is rendered in the error tone,
          // and the confidence + uncertainty note + entry-timing range are all
          // surfaced. The hero is the terminal value; gain/loss % rides in the
          // caption with its sign so direction is unmistakable.
          const contributed = result.totalContributed;
          const gainPct = contributed > 0 ? (result.terminalValue / contributed - 1) * 100 : 0;
          const gainStr = `${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}%`;
          const tone: 'positive' | 'negative' | 'neutral' =
            result.confidence === 'LOW' ? 'neutral' : gainPct >= 0 ? 'positive' : 'negative';
          const assetName = t(`inputs.assetOptions.${form.asset}`);
          const startMonthLabel = t(`output.startMonth.${startMonthKey}`);
          const note =
            result.confidence === 'LOW'
              ? t('output.uncertaintyLow')
              : result.confidence === 'MEDIUM'
                ? t('output.uncertaintyMedium')
                : t('resultMoment.pastPerformance');
          const disclaimer = `${tShared(`confidence.${result.confidence.toLowerCase()}`)}. ${note}`;

          const series: DivergenceSeries[] = [
            {
              id: 'invested',
              label: tShared('resultMoment.chartInvested'),
              values: [contributed, contributed],
              variant: 'muted',
            },
            {
              id: 'value',
              label: tShared('resultMoment.chartValue'),
              values: [contributed, result.terminalValue],
              variant: 'primary',
            },
          ];

          const points: ResultMomentSupportingPoint[] = [
            {
              id: 'invested',
              label: t('resultMoment.investedLabel'),
              value: fmtMoney(contributed),
              note:
                form.mode === 'monthlyDca'
                  ? t('resultMoment.contributedMonths', { months: result.months })
                  : undefined,
              variant: 'muted',
            },
          ];
          if (isDcaResult) {
            points.push({
              id: 'range',
              label: t('resultMoment.rangeLabel'),
              value: `${fmtMoney(result.rangeLow!)} – ${fmtMoney(result.rangeHigh!)}`,
              variant: 'muted',
            });
          }

          return (
            <ResultMoment
              eyebrow={t('resultMoment.eyebrow')}
              headlineValue={result.terminalValue}
              headlineFormatter={fmtMoney}
              headlineTone={tone}
              headlineCaption={t('resultMoment.heroCaption', {
                asset: assetName,
                startMonth: startMonthLabel,
                startYear: form.startYear,
                gain: gainStr,
              })}
              chart={{
                series,
                xCaptions: [
                  `${startMonthLabel} ${form.startYear}`,
                  t('resultMoment.chartToday'),
                ],
                formatValue: fmtMoney,
                ariaLabel: t('resultMoment.chartAria', {
                  asset: assetName,
                  startYear: form.startYear,
                }),
              }}
              supportingPoints={points}
              disclaimer={disclaimer}
              cta={{
                headline: tShared('resultMoment.ctaHeadline'),
                body: tShared('resultMoment.ctaBody'),
                label: tShared('resultMoment.ctaLabel'),
                href: '/?source=tool_asset-history',
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

export default AssetHistoryCalculatorDefault;
