'use client';

/**
 * Protocols Hero Section
 *
 * Hero section for the protocols page
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import styles from './ProtocolsHeroSection.module.css';

const I18N_PREFIX = 'protocols';

export function ProtocolsHeroSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <SectionErrorBoundary
      sectionId="hero-section-protocols"
      sectionType="HeroSection"
      enableReporting={true}
      context={{ page: 'protocols', variant: 'centered' }}
    >
      <section className={styles.section}>
        <div className={styles.container}>
          <h1 className={styles.title}>
            {t('hero.h1')}
          </h1>
          <p className={styles.subtitle}>
            {t('hero.subtitle')}
          </p>
          <p className={styles.trustLine}>
            {t('hero.trustLine')}
          </p>
        </div>
      </section>
    </SectionErrorBoundary>
  );
}
