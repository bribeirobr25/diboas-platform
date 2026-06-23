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
import { CinematicHeroFactory } from '@/components/Sections';
import { SectionErrorBoundary } from '@/lib/errors/SectionErrorBoundary';
// StrategyDisclaimers import removed — wrapper was dead code
// styles import removed 2026-05-08 (lint cleanup) — was unused after the
// StrategyDisclaimers wrapper deletion.

const I18N_PREFIX = 'strategies';

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
      <CinematicHeroFactory
        scene="wireframe-terrain"
        theme="dark"
        align="center"
        sectionId="hero-strategies"
        headline={t('hero.headline')}
        subheadline={t('hero.subheadline')}
        priority
      />
    </SectionErrorBoundary>
  );
}

// NOTE: StrategiesDisclaimersWrapper removed (dead code — never imported by any page)
// NOTE: StrategiesTransitionHook removed — transition hooks deleted in cleanup
