'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
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
  isFree?: boolean;
  isHighlight?: boolean;
}

export const FeeTable = memo(function FeeTable({
  config,
  enableAnalytics = true,
  className = '',
}: FeeTableProps) {
  const translated = useConfigTranslation(config);

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      ariaLabel={translated.seo.ariaLabel}
      className={className}
    >
      <div className={styles.container}>
        <h2 className={styles.title}>{translated.content.title}</h2>
        <p className={styles.subtitle}>{translated.content.subtitle}</p>

        {/* Desktop: 4-column HTML table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table} role="table">
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th scope="col" className={styles.th}>{translated.content.headers.action}</th>
                <th scope="col" className={styles.th}>{translated.content.headers.diboas}</th>
                <th scope="col" className={styles.th}>{translated.content.headers.competitors}</th>
                <th scope="col" className={styles.th}>{translated.content.headers.difference}</th>
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
              <div className={`${styles.mobileDifference} ${row.isHighlight ? styles.highlightDifference : ''}`}>
                {row.difference}
              </div>
            </div>
          ))}
        </div>

        <p className={styles.disclaimer}>{translated.content.disclaimer}</p>
        <p className={styles.example}>{translated.content.example}</p>
      </div>
    </SectionContainer>
  );
});

FeeTable.displayName = 'FeeTable';
