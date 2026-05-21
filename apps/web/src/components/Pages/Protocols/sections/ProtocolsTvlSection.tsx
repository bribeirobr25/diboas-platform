'use client';

/**
 * Protocols TVL Section
 *
 * Phase I (2026-05-16): combined TVL number flows from `marketDataService`
 * (`protocolData.tvl.combined`) — CC2 round-1 lock to extend the EXISTING
 * `protocolData.tvl` field. Translation strings hold narrative copy and
 * an `{tvlAmount}` interpolation placeholder; the snapshot supplies the
 * actual value so the iter-5 SDK swap propagates automatically.
 *
 * For partial-ship safety: if `protocolData.tvl.combined` is missing
 * (e.g. an SDK provider that omits TVL), falls back to the legacy
 * `tvl.number` translation string.
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { marketDataService } from '@/lib/market-data';
import styles from './ProtocolsTvlSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsTvlSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  const snapshot = marketDataService.getSync();
  const tvlAmount = snapshot.protocolData.tvl.combined ?? t('tvl.number');

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
            {t('tvl.textBefore')}{' '}
            <span className={styles.amount}>{tvlAmount}</span>{' '}
            {t('tvl.textAfter')}
          </p>
          <p className={styles.context}>{t('tvl.context')}</p>
          <p className={styles.source}>{t('tvl.source')}</p>
        </div>
      </SectionContainer>
    </SectionErrorBoundary>
  );
}
