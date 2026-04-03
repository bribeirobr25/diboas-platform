'use client';

/**
 * Strategies Page — Client Section Components
 *
 * Self-contained client components for sections that require useTranslation()
 * but aren't large enough to warrant their own files.
 *
 * Phase 3D/3E migration: extracts inline sections from StrategiesPageContent orchestrator.
 */

import { useTranslation } from '@diboas/i18n/client';
import { PageHeroSection } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
// StrategyDisclaimers import removed — wrapper was dead code
import styles from './StrategiesPageContent.module.css';

const I18N_PREFIX = 'marketing.pages.strategies';

// ─── Hero Section ────────────────────────────────────────────

export function StrategiesHeroSection() {
  const intl = useTranslation();
  const t = (key: string) => intl.formatMessage({ id: `${I18N_PREFIX}.${key}` });

  return (
    <SectionErrorBoundary
      sectionId="hero-section-strategies"
      sectionType="HeroSection"
      enableReporting
      context={{ page: 'strategies', variant: 'centered' }}
    >
      <PageHeroSection
        headline={t('hero.headline')}
        subheadline={t('hero.subheadline')}
        align="center"
      />
      <p className={styles.trustLine}>{t('hero.trustLine')}</p>
      <p className={styles.microText}>{t('hero.honestLimitation')}</p>
    </SectionErrorBoundary>
  );
}

// ─── Transition Hook ─────────────────────────────────────────

export function StrategiesTransitionHook({ hookKey }: { hookKey: string }) {
  const intl = useTranslation();
  const text = intl.formatMessage({ id: `${I18N_PREFIX}.${hookKey}` });

  return <p className={styles.transitionHook}>{text}</p>;
}

// NOTE: StrategiesDisclaimersWrapper removed (dead code — never imported by any page)
