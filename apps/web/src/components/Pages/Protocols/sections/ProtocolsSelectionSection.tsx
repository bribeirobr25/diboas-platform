'use client';

/**
 * Protocols Selection Process Section
 *
 * Explains the criteria for selecting protocols
 */

import { useTranslation } from '@diboas/i18n/client';
import { Check } from '@/components/UI/LucideIcon';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './ProtocolsSelectionSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsSelectionSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  const criteria = {
    operation: t('howWeChoose.criteria.1'),
    audits: t('howWeChoose.criteria.2'),
    exploits: t('howWeChoose.criteria.3'),
    transparent: t('howWeChoose.criteria.4'),
    usage: t('howWeChoose.criteria.5'),
  };

  return (
    <SectionErrorBoundary
      sectionId="selection-section-protocols"
      sectionType="ContentSection"
      enableReporting={true}
      context={{ page: 'protocols' }}
    >
      <SectionContainer
        variant="standard"
        padding="standard"
        backgroundColor="var(--section-bg-neutral)"
      >
        <div className={styles.content}>
          <h2 className={styles.title}>
            {t('howWeChoose.h2')}
          </h2>
          <p className={styles.intro}>
            {t('howWeChoose.intro')}
          </p>

          <ul className={styles.criteriaList}>
            <li className={styles.criteriaItem}>
              <span className={styles.checkmark}><Check size={16} strokeWidth={2} /></span>
              <span className={styles.criteriaText}>{criteria.operation}</span>
            </li>
            <li className={styles.criteriaItem}>
              <span className={styles.checkmark}><Check size={16} strokeWidth={2} /></span>
              <span className={styles.criteriaText}>{criteria.audits}</span>
            </li>
            <li className={styles.criteriaItem}>
              <span className={styles.checkmark}><Check size={16} strokeWidth={2} /></span>
              <span className={styles.criteriaText}>{criteria.exploits}</span>
            </li>
            <li className={styles.criteriaItem}>
              <span className={styles.checkmark}><Check size={16} strokeWidth={2} /></span>
              <span className={styles.criteriaText}>{criteria.transparent}</span>
            </li>
            <li className={styles.criteriaItem}>
              <span className={styles.checkmark}><Check size={16} strokeWidth={2} /></span>
              <span className={styles.criteriaText}>{criteria.usage}</span>
            </li>
          </ul>

          <p className={styles.belowCriteria}>
            {t('howWeChoose.belowCriteria')}
          </p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
