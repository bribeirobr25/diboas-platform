'use client';

/**
 * StrategyFeeTable
 *
 * Simple 2-row fee table: invest=FREE, sell=0.39%.
 * FREE row rendered in bold green for visual consistency.
 */

import { useTranslation } from '@diboas/i18n/client';
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'marketing.pages.strategies';

export function StrategyFeeTable() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  return (
    <>
      <h2 className={styles.sectionTitle}>
        {t('fees.header')}
      </h2>
      <p className={styles.sectionSubtitle}>
        {t('fees.intro')}
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.feeTable}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th className={styles.feeTableCell}>{t('fees.columnHeaders.action')}</th>
              <th className={styles.feeTableCell}>{t('fees.columnHeaders.fee')}</th>
              <th className={styles.feeTableCell}>{t('fees.columnHeaders.example')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.tableRow}>
              <td className={styles.feeTableCell}>{t('fees.table.invest.action')}</td>
              <td className={`${styles.feeTableCell} ${styles.feeRowFree}`}>{t('fees.table.invest.fee')}</td>
              <td className={styles.feeTableCell}>{t('fees.table.invest.example')}</td>
            </tr>
            <tr className={styles.tableRowLast}>
              <td className={styles.feeTableCell}>{t('fees.table.sell.action')}</td>
              <td className={styles.feeTableCell}>{t('fees.table.sell.fee')}</td>
              <td className={styles.feeTableCell}>{t('fees.table.sell.example')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={styles.belowTable}>
        {t('fees.belowTable')}
      </p>

      <p className={styles.microText}>
        {t('fees.microText')}
      </p>
    </>
  );
}
