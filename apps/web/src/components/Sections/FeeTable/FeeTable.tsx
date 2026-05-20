'use client';

import { memo, useMemo } from 'react';
import { Check } from '@/components/UI/LucideIcon';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useLocale } from '@/components/Providers';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import { marketDataService } from '@/lib/market-data';
import { buildAllFeeValues } from '@/lib/market-data/feeComparisonValues';
import type { FeeTableConfig } from '@/config/feeTable';
import styles from './FeeTable.module.css';

interface FeeTableProps {
  config: FeeTableConfig;
  enableAnalytics?: boolean;
  className?: string;
}

interface TranslatedRow {
  id: string;
  action: string;
  diboas: string;
  competitors: string;
  difference: string;
  example?: string;
  isFree?: boolean;
  isHighlight?: boolean;
}

export const FeeTable = memo(function FeeTable({
  config,
  enableAnalytics: _enableAnalytics = true,
  className = '',
}: FeeTableProps) {
  const { locale } = useLocale();
  const valuesByKey = useMemo(
    () => buildAllFeeValues(marketDataService.getSync().platformFees, locale),
    [locale],
  );
  const translated = useConfigTranslation(config, undefined, valuesByKey);

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      <div className={styles.container}>
        {translated.content.transitionHook ? (
          <p className={styles.transitionHook}>{translated.content.transitionHook}</p>
        ) : null}
        <h2 className={styles.title}>{translated.content.title}</h2>
        {translated.content.subtitle ? (
          <p className={styles.subtitle}>{translated.content.subtitle}</p>
        ) : null}
        {translated.content.painIntro ? (
          <p className={styles.painIntro}>{translated.content.painIntro}</p>
        ) : null}

        {/* Desktop: comparison table (4 or 5 columns) */}
        <div className={styles.tableWrapper}>
          <table className={styles.table} role="table">
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th scope="col" className={styles.th}>{translated.content.headers.action}</th>
                <th scope="col" className={styles.th}>{translated.content.headers.diboas}</th>
                <th scope="col" className={styles.th}>{translated.content.headers.competitors}</th>
                <th scope="col" className={styles.th}>{translated.content.headers.difference}</th>
                {translated.content.headers.example ? (
                  <th scope="col" className={styles.th}>{translated.content.headers.example}</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {translated.content.rows.map((row: TranslatedRow) => (
                <tr key={row.id} className={styles.tableRow}>
                  <td className={styles.td}>{row.action}</td>
                  <td className={`${styles.td} ${row.isFree ? styles.freeText : ''}`}>
                    {row.isFree ? (
                      <span className={styles.freeLabel}>
                        <Check className={styles.checkIcon} aria-hidden="true" />
                        {row.diboas}
                      </span>
                    ) : (
                      row.diboas
                    )}
                  </td>
                  <td className={`${styles.td} ${styles.tdCompetitors}`}>{row.competitors}</td>
                  <td className={`${styles.td} ${row.isHighlight ? styles.highlightDifference : ''}`}>
                    {row.difference}
                  </td>
                  {translated.content.headers.example ? (
                    <td className={styles.td}>{row.example ?? ''}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Comparison cards */}
        <div className={styles.mobileCards}>
          {translated.content.rows.map((row: TranslatedRow) => (
            <div key={row.id} className={styles.mobileCard}>
              <div className={styles.mobileCardAction}>{row.action}</div>
              <div className={styles.mobileCompareGrid}>
                <div>
                  <div className={styles.mobileCompareLabel}>{translated.content.headers.diboas}</div>
                  <div className={`${styles.mobileCompareValue} ${row.isFree ? styles.freeText : ''}`}>
                    {row.isFree ? (
                      <span className={styles.freeLabel}>
                        <Check className={styles.checkIcon} aria-hidden="true" />
                        {row.diboas}
                      </span>
                    ) : (
                      row.diboas
                    )}
                  </div>
                </div>
                <div>
                  <div className={styles.mobileCompareLabel}>{translated.content.headers.competitors}</div>
                  <div className={styles.mobileCompareValue}>{row.competitors}</div>
                </div>
              </div>
              {row.example ? (
                <div className={styles.mobileExample}>{row.example}</div>
              ) : null}
              <div className={`${styles.mobileDifference} ${row.isHighlight ? styles.highlightDifference : ''}`}>
                {row.difference}
              </div>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>{translated.content.disclaimer}</p>
        {translated.content.example ? (
          <p className={styles.example}>{translated.content.example}</p>
        ) : null}
        {translated.content.footerLine ? (
          <p className={styles.footerLine}>{translated.content.footerLine}</p>
        ) : null}
      </div>
    </SectionContainer>
  );
});

FeeTable.displayName = 'FeeTable';
