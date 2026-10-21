'use client';

/**
 * Protocols TVL Section
 *
 * The combined figure is the localized `tvl.number` (2026-10-21). It used to
 * come from an English-only constant that overrode the translation, so the
 * German, Portuguese and Spanish pages read "$25 billion". The string is
 * rendered from `protocolData.tvl.combinedFloorUsd` by the quarterly refresh
 * (`scripts/protocols-tvl/refresh.mjs`) and checked against it, so the words
 * and the data cannot drift apart.
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import styles from './ProtocolsTvlSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsTvlSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  const tvlAmount = t('tvl.number');

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
        backgroundColor="var(--section-bg-dark)"
      >
        <div className={styles.container}>
          <h2 className={styles.title}>{t('tvl.h2')}</h2>
          <p className={styles.paragraph}>
            {t('tvl.textBefore')} <span className={styles.amount}>{tvlAmount}</span>{' '}
            {t('tvl.textAfter')}
          </p>
          <p className={styles.context}>{t('tvl.context')}</p>
          <p className={styles.source}>{t('tvl.source')}</p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
