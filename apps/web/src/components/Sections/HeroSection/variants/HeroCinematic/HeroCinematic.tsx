'use client';

/**
 * HeroCinematic — factory variant adapter for the cinematic (GSAP + Three.js) hero.
 *
 * Bridges the existing `HeroVariantConfig` (resolved i18n strings via
 * useConfigTranslation in the factory) to the reusable `CinematicHeroFactory`.
 * CTAs stay real `<a>` links (the factory's navigating onCTAClick is NOT used,
 * to avoid double-navigation) — onClick fires fire-and-forget analytics only.
 */

import { useCallback } from 'react';
import { CinematicHeroFactory } from '@/components/Sections/CinematicHero';
import { analyticsService } from '@/lib/analytics';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import type { HeroVariantProps } from '../types';

export function HeroCinematic({ config, className, priority }: HeroVariantProps) {
  const cinematic = config.cinematic;
  const prefix = config.analytics?.trackingPrefix ?? 'hero_cinematic';
  const scene = cinematic?.scene ?? 'fluid';

  const impressionRef = useImpressionTracking<HTMLElement>({
    eventName: 'hero_impression',
    parameters: { variant: 'cinematic', scene },
  });

  // Track-only (the <a href> performs navigation natively).
  const trackCta = useCallback(
    (kind: 'primary' | 'secondary', href?: string) => {
      if (config.analytics?.enabled === false) return;
      void analyticsService
        .trackEvent(`${prefix}_cta_click`, {
          variant: 'cinematic',
          scene,
          cta_kind: kind,
          cta_href: href,
          timestamp: new Date().toISOString(),
        })
        .catch(() => {});
    },
    [config.analytics?.enabled, prefix, scene]
  );

  const primaryCta = config.content.ctaText
    ? {
        label: config.content.ctaText,
        href: config.content.ctaHref,
        target: config.content.ctaTarget,
        onClick: () => trackCta('primary', config.content.ctaHref),
      }
    : undefined;

  const secondaryCta = config.content.secondaryCtaText
    ? {
        label: config.content.secondaryCtaText,
        href: config.content.secondaryCtaHref ?? '#',
        target: config.content.secondaryCtaTarget,
        onClick: () => trackCta('secondary', config.content.secondaryCtaHref),
      }
    : undefined;

  return (
    <CinematicHeroFactory
      rootRef={impressionRef}
      className={className}
      sectionId={cinematic?.sectionId ?? 'hero'}
      eyebrow={config.content.eyebrow}
      headline={config.content.title}
      subheadline={config.content.description}
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
      scene={scene}
      theme={cinematic?.theme ?? 'dark'}
      align={cinematic?.align ?? 'left'}
      accentHeadline={cinematic?.accentHeadline}
      posterImage={cinematic?.posterImage}
      posterAlt={cinematic?.posterAlt}
      posterDuotone={cinematic?.posterDuotone}
      priority={priority}
    />
  );
}

export default HeroCinematic;
