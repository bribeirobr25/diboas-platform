'use client';

/**
 * Protocols "What This Page Is Not" Section
 *
 * Risk framing and disclaimer section — addresses CLO concern
 * that listing protocols could be interpreted as endorsement.
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './ProtocolsNotIsSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsNotIsSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  const text = t('notIs.text');
  const paragraphs = text.split('\n\n');

  return (
    <SectionErrorBoundary
      sectionId="notis-section-protocols"
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
          <h2 className={styles.title}>{t('notIs.h2')}</h2>
          <div className={styles.body}>
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <p className={styles.warmLine}>{t('notIs.warmLine')}</p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
