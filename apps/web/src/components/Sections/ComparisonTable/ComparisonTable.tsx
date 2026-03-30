'use client';

import { memo, useEffect, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { analyticsService } from '@/lib/analytics';
import styles from './ComparisonTable.module.css';

interface ComparisonTableProps {
  enableAnalytics?: boolean;
  className?: string;
}

const COLUMN_KEYS = ['bank', 'neobanks', 'treasuries', 'diboas'] as const;

export const ComparisonTable = memo(function ComparisonTable({
  enableAnalytics = true,
  className = '',
}: ComparisonTableProps) {
  const intl = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasFiredRef = useRef(false);

  const t = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.comparison.${key}` });

  const tSection = (key: string) =>
    intl.formatMessage({ id: `landing-b2c.sections.comparison.${key}` });

  const diboasSubtextRaw = t('diboasSubtext');
  // react-intl returns the key itself for empty-string translations — treat as absent
  const diboasSubtext = diboasSubtextRaw.includes('.') ? '' : diboasSubtextRaw;
  const hasExtraDiboasInfo = diboasSubtext.length > 0;

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

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor="var(--section-bg-neutral)"
      ariaLabel={tSection('ariaLabel')}
      className={className}
    >
      <div ref={sectionRef} className={styles.container}>
        <h2 className={styles.heading}>{t('heading')}</h2>

        {/* Desktop: HTML table */}
        <div className={styles.tableWrapper} role="region" aria-label={tSection('ariaLabel')}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col" className={styles.th}>&nbsp;</th>
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
                <td className={styles.tdLabel}>APY</td>
                {COLUMN_KEYS.map((col) => (
                  <td
                    key={col}
                    className={`${styles.td} ${styles.mono} ${col === 'diboas' ? styles.tdHighlight : ''}`}
                  >
                    {t(`rates.${col}`)}
                    {col === 'diboas' && hasExtraDiboasInfo ? (
                      <div className={styles.diboasSubtext}>{diboasSubtext}</div>
                    ) : null}
                  </td>
                ))}
              </tr>
              <tr className={styles.row}>
                <td className={styles.tdLabel}>1-Year Return</td>
                {COLUMN_KEYS.map((col) => (
                  <td
                    key={col}
                    className={`${styles.td} ${styles.mono} ${col === 'diboas' ? styles.tdHighlight : ''}`}
                  >
                    {t(`returns.${col}`)}
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
                {t(`rates.${col}`)}
                {col === 'diboas' && hasExtraDiboasInfo ? (
                  <span className={styles.mobileRowSubtext}>{diboasSubtext}</span>
                ) : null}
              </span>
              <span className={`${styles.mobileRowReturn} ${styles.mono}`}>{t(`returns.${col}`)}</span>
            </div>
          ))}
        </div>

        <p className={styles.footnote}>{t('footnote')}</p>
      </div>
    </SectionContainer>
  );
});

ComparisonTable.displayName = 'ComparisonTable';
