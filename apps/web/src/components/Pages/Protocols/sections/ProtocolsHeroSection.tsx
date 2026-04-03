'use client';

/**
 * Protocols Hero Section
 *
 * Uses shared PageHeroSection for the hero, with trustLine below.
 * Same pattern as StrategiesHeroSection.
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { PageHeroSection } from '@/components/Sections/PageHeroSection';
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
      <PageHeroSection
        headline={t('hero.h1')}
        subheadline={t('hero.subtitle')}
        align="center"
      />
      <p className={styles.trustLine}>
        {t('hero.trustLine')}
      </p>
    </SectionErrorBoundary>
  );
}
