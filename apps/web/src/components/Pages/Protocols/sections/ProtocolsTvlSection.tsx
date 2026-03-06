'use client';

/**
 * Protocols TVL Section
 *
 * Displays total TVL statistics
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './ProtocolsTvlSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsTvlSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <SectionErrorBoundary
      sectionId="tvl-section-protocols"
      sectionType="StatsSection"
      enableReporting={true}
      context={{ page: 'protocols' }}
    >
      <SectionContainer
        variant="standard"
        padding="standard"
        backgroundColor="var(--bc-color-section-bg)"
      >
        <div className={styles.container}>
          <h2 className={styles.title}>{t('tvl.h2')}</h2>
          <p className={styles.paragraph}>
            {t('tvl.textBefore')}{' '}
            <span className={styles.amount}>{t('tvl.number')}</span>{' '}
            {t('tvl.textAfter')}
          </p>
          <p className={styles.context}>{t('tvl.context')}</p>
          <p className={styles.source}>{t('tvl.source')}</p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
