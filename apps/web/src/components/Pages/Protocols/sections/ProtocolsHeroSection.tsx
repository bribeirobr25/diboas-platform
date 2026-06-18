'use client';

/**
 * Protocols Hero Section
 *
 * Uses shared PageHeroSection for the hero, with trustLine below.
 * Same pattern as StrategiesHeroSection.
 */

import { useTranslation } from '@diboas/i18n/client';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
import { CinematicHeroFactory } from '@/components/Sections';

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
      <CinematicHeroFactory
        scene="particles"
        theme="dark"
        align="center"
        sectionId="hero-protocols"
        headline={t('hero.h1')}
        subheadline={t('hero.subtitle')}
        subheadline2={t('hero.trustLine')}
        priority
      />
    </SectionErrorBoundary>
  );
}
