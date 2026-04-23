'use client';

/**
 * StrategiesMatrixSection
 *
 * Renders the strategy selection matrix table with 6 rows.
 * Supports null cells for strategies that don't exist in a given row.
 */

import { useTranslation } from '@diboas/i18n/client';
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'strategies';

const MATRIX_ROWS = [
  { id: 'emergency', stableStrategy: 'safeHarbor', growthStrategy: null },
  { id: 'beatInflation', stableStrategy: null, growthStrategy: 'stableGrowth' },
  { id: 'shortTerm', stableStrategy: 'goalKeeper', growthStrategy: 'steadyProgress' },
  { id: 'mediumTerm', stableStrategy: 'patientBuilder', growthStrategy: 'balancedBuilder' },
  { id: 'longTerm', stableStrategy: 'steadyCompounder', growthStrategy: 'wealthAccelerator' },
  { id: 'wealthBuilding', stableStrategy: 'yieldMaximizer', growthStrategy: 'fullThrottle' },
] as const;

export function StrategiesMatrixSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });
  return (
    <>
      <h2 className={styles.sectionTitle}>
        {t('matrix.header')}
      </h2>
      <p className={styles.sectionSubtitle}>
        {t('matrix.instructions')}
      </p>

      <div className={styles.tableWrapper}>
        <table className={styles.strategyTable}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th className={styles.tableHeaderGoal}>
                {t('matrix.columns.goal')}
              </th>
              <th className={styles.tableHeaderStable}>
                {t('matrix.columns.stable')}
              </th>
              <th className={styles.tableHeaderGrowth}>
                {t('matrix.columns.growth')}
              </th>
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row, index) => (
              <tr
                key={row.id}
                className={index < MATRIX_ROWS.length - 1 ? styles.tableRow : styles.tableRowLast}
              >
                <td className={styles.tableCellGoal}>
                  {t(`matrix.rows.${row.id}.goal`)}
                </td>
                <td className={styles.tableCellStable}>
                  {row.stableStrategy
                    ? t(`matrix.rows.${row.id}.stable`)
                    : <span className={styles.emptyCell}>{'\u2014'}</span>}
                </td>
                <td className={styles.tableCellGrowth}>
                  {row.growthStrategy
                    ? t(`matrix.rows.${row.id}.growth`)
                    : <span className={styles.emptyCell}>{'\u2014'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.tableNote}>
        {t('matrix.note')}
      </p>
    </>
  );
}
