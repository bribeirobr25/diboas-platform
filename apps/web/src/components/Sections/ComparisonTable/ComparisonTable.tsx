'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { CountUp } from '@/components/UI/CountUp';
import { DivergenceChart, type DivergenceSeries } from '@/components/UI/DivergenceChart';
import { analyticsService } from '@/lib/analytics';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import { useMarketData } from '@/hooks/useMarketData';
import {
  calculateLumpSum,
  calculateWithCurrencyHedge,
  buildMonthlyValuePath,
  buildHedgedMonthlyValuePath,
  formatRate,
  formatApproxRate,
  formatGain,
  formatCurrency,
  type SupportedLocale,
} from '@/lib/market-data';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import { COMPARISON_TABLE_INPUTS } from '@/config/comparisonTable';
import styles from './ComparisonTable.module.css';

interface ComparisonTableProps {
  enableAnalytics?: boolean;
  className?: string;
  /** When true, render WITHOUT the outer SectionContainer (no nested <section>,
   *  padding, or aria-label) — for embedding inside another section, e.g. the
   *  FeeTable expand. Standalone consumers (/business) keep the default. */
  embedded?: boolean;
}

const COLUMN_KEYS = ['bank', 'neobanks', 'treasuries', 'diboas'] as const;

/** Compute rates and returns from market data at render time */
function useComparisonData(locale: SupportedLocale) {
  const { data: marketData } = useMarketData();

  return useMemo(() => {
    const bankRates = marketData.rates.bankRates[locale];
    const inputs = COMPARISON_TABLE_INPUTS[locale];
    const principal = inputs.principal;
    const currency = LOCALE_CURRENCY[locale];
    const depreciation =
      currency && currency !== 'USD'
        ? (marketData.exchangeRates.rates[currency]?.annualDepreciation ?? 0)
        : 0;
    const diboasApy = marketData.rates.strategyApys.safety;

    // Rates for display
    const rates = {
      bank: formatRate(bankRates.savings, locale),
      neobanks: formatRate(bankRates.neobank, locale),
      treasuries: formatRate(bankRates.treasury, locale),
      diboas: formatApproxRate(diboasApy, locale),
    };

    // 1-year returns computed from rates
    const bankReturn = calculateLumpSum(principal, bankRates.savings / 100, 0, 1).nominalGain;
    const neobankReturn = calculateLumpSum(principal, bankRates.neobank / 100, 0, 1).nominalGain;
    const treasuryReturn = calculateLumpSum(principal, bankRates.treasury / 100, 0, 1).nominalGain;

    let diboasReturn: number;
    if (depreciation > 0) {
      diboasReturn = calculateWithCurrencyHedge(
        principal,
        diboasApy / 100,
        depreciation,
        0,
        1
      ).nominalGain;
    } else {
      diboasReturn = calculateLumpSum(principal, diboasApy / 100, 0, 1).nominalGain;
    }

    // Raw return amounts — the cells animate to these via <CountUp> and format
    // each frame with formatGain(), so no pre-formatted `returns` map is needed.
    const returnsRaw = {
      bank: bankReturn,
      neobanks: neobankReturn,
      treasuries: treasuryReturn,
      diboas: diboasReturn,
    };

    // Monthly value PATHS of `principal` over 12 months, for the DivergenceChart
    // hero (redesign Phase 2 \u2014 "data as hero"). Two clearest lines: bank vs
    // diBoaS. The diBoaS path routes through the SAME clamped effective-rate
    // hedge as the table figure (lib/market-data), so the chart and the cells
    // can never diverge (Principle 1 / DRY \u2014 no inline math here).
    const chartPaths = {
      bank: buildMonthlyValuePath(principal, bankRates.savings / 100, 12),
      diboas:
        depreciation > 0
          ? buildHedgedMonthlyValuePath(
              principal,
              diboasApy / 100,
              depreciation,
              12,
              'comparisonTable.chart'
            )
          : buildMonthlyValuePath(principal, diboasApy / 100, 12),
    };

    // diBoaS subtext \u2014 show "em d\u00F3lares" for PT-BR, empty for others
    const diboasSubtext = locale === 'pt-BR' ? 'em d\u00F3lares' : '';

    return { rates, returnsRaw, diboasSubtext, chartPaths };
  }, [marketData, locale]);
}

export const ComparisonTable = memo(function ComparisonTable({
  enableAnalytics = true,
  className = '',
  embedded = false,
}: ComparisonTableProps) {
  const intl = useTranslation();
  const { locale: rawLocale } = useLocale();
  const locale = (rawLocale || 'en') as SupportedLocale;
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasFiredRef = useRef(false);

  const t = (key: string) => intl.formatMessage({ id: `landing-b2c.comparison.${key}` });

  const tSection = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.sections.comparison.${key}` });

  const { rates, returnsRaw, diboasSubtext, chartPaths } = useComparisonData(locale);

  // Two clearest lines for the "data as hero" divergence chart (bank vs diBoaS).
  const chartSeries: DivergenceSeries[] = [
    { id: 'bank', label: t('columns.bank'), values: chartPaths.bank, variant: 'muted' },
    { id: 'diboas', label: t('columns.diboas'), values: chartPaths.diboas, variant: 'primary' },
  ];
  const hasExtraDiboasInfo = diboasSubtext.length > 0;

  // Redesign funnel (§4): `hero_proof_viewed` — fires when the "data as hero"
  // divergence proof itself (not just the section) is ≥50% in view. Distinct
  // from the section-level `comparison_visible` impression below: this is the
  // sharper "the user actually saw the live proof viz" funnel signal.
  const proofRef = useImpressionTracking<HTMLDivElement>({
    eventName: 'hero_proof_viewed',
    parameters: { market: locale },
    threshold: 0.5,
    enabled: enableAnalytics,
  });

  // Analytics: fire once when section enters viewport
  useEffect(() => {
    if (!enableAnalytics) return;
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasFiredRef.current) {
          hasFiredRef.current = true;
          analyticsService.track({
            name: 'comparison_visible',
            parameters: { locale: intl.locale },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enableAnalytics, intl.locale]);

  const body = (
    <div ref={sectionRef} className={styles.container}>
        <p className={`u-eyebrow ${styles.eyebrow}`}>
          {intl.formatMessage({ id: 'landing-b2c.eyebrows.math' })}
        </p>
        <h2 className={`u-section-heading ${styles.heading}`}>{t('heading')}</h2>

        {/* "Data as hero" — the $1,000 divergence drawn from the same live rates
            as the table below (redesign Phase 2). */}
        <div ref={proofRef} className={styles.chartWrap}>
          <DivergenceChart
            series={chartSeries}
            formatValue={(n) => formatCurrency(n, locale)}
            ariaLabel={`${t('columns.bank')}: ${formatCurrency(chartPaths.bank[12] ?? 0, locale)}. diBoaS: ${formatCurrency(chartPaths.diboas[12] ?? 0, locale)}.`}
          />
        </div>

        {/* Desktop: HTML table */}
        <div className={styles.tableWrapper} role="region" aria-label={tSection('ariaLabel')}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.th}>
                  &nbsp;
                </th>
                {COLUMN_KEYS.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className={`${styles.th} ${col === 'diboas' ? styles.thHighlight : ''}`}
                  >
                    {t(`columns.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className={styles.row}>
                <td className={styles.tdLabel}>{t('rows.apy')}</td>
                {COLUMN_KEYS.map((col) => (
                  <td
                    key={col}
                    className={`${styles.td} ${styles.mono} ${col === 'diboas' ? styles.tdHighlight : ''}`}
                  >
                    {rates[col]}
                    {col === 'diboas' && hasExtraDiboasInfo ? (
                      <div className={styles.diboasSubtext}>{diboasSubtext}</div>
                    ) : null}
                  </td>
                ))}
              </tr>
              <tr className={styles.row}>
                <td className={styles.tdLabel}>{t('rows.return')}</td>
                {COLUMN_KEYS.map((col) => (
                  <td
                    key={col}
                    className={`${styles.td} ${styles.mono} ${col === 'diboas' ? styles.tdHighlight : ''}`}
                  >
                    <CountUp end={returnsRaw[col]} formatter={(n) => formatGain(n, locale)} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked rows */}
        <div className={styles.mobileStack}>
          {COLUMN_KEYS.map((col) => (
            <div
              key={col}
              className={`${styles.mobileRow} ${col === 'diboas' ? styles.mobileRowHighlight : ''}`}
            >
              <span className={styles.mobileRowName}>{t(`columns.${col}`)}</span>
              <span className={`${styles.mobileRowRate} ${styles.mono}`}>
                {rates[col]}
                {col === 'diboas' && hasExtraDiboasInfo ? (
                  <span className={styles.mobileRowSubtext}>{diboasSubtext}</span>
                ) : null}
              </span>
              <span className={`${styles.mobileRowReturn} ${styles.mono}`}>
                <CountUp end={returnsRaw[col]} formatter={(n) => formatGain(n, locale)} />
              </span>
            </div>
          ))}
        </div>

        <p className={styles.footnote}>{t('footnote')}</p>
      </div>
  );

  return embedded ? (
    body
  ) : (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-neutral)"
      ariaLabel={tSection('ariaLabel')}
      className={className}
    >
      {body}
    </SectionContainer>
  );
});

ComparisonTable.displayName = 'ComparisonTable';
