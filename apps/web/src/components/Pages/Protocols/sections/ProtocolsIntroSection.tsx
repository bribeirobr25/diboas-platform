'use client';

/**
 * Protocols Intro Section
 *
 * Introduction explaining why this page exists
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './ProtocolsIntroSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsIntroSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <SectionErrorBoundary
      sectionId="intro-section-protocols"
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
          <h2 className={styles.title}>{t('why.h2')}</h2>
          <div className={styles.body}>
            <p>{t('why.text1')}</p>
            <p>{t('why.text2')}</p>
            <p>{t('why.text3')}</p>
            <p className={styles.scope}>{t('why.scope')}</p>
            <div className={styles.disclaimer}>
              <p className={styles.disclaimerText}>{t('why.warningBox')}</p>
            </div>
          </div>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
