/**
 * HeroFullBackground Variant Component
 *
 * Domain-Driven Design: Full-screen background hero with overlay
 * Service Agnostic Abstraction: Background-focused presentation variant
 * Code Reusability: Shared design tokens and patterns
 * Performance: Optimized background image loading via next/image
 */

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@diboas/ui';
import { useTranslation } from '@diboas/i18n/client';
import { ChevronDown } from '@/components/UI/LucideIcon';
import { useImpressionTracking } from '@/hooks/useImpressionTracking';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import type { HeroVariantProps } from '../types';
import styles from './HeroFullBackground.module.css';

export function HeroFullBackground({
  config,
  className = '',
  backgroundColor,
  onCTAClick,
}: HeroVariantProps) {
  const intl = useTranslation();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const handleCTAClick = useCallback(() => {
    onCTAClick?.();
  }, [onCTAClick]);

  const handleImageLoad = useCallback(() => {
    setBackgroundLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setBackgroundLoaded(true); // Dismiss spinner on error to avoid infinite loading state
  }, []);

  const hasBackgroundAssets = config.backgroundAssets?.backgroundImage;
  const backgroundImage = backgroundColor || config.backgroundAssets?.backgroundImage;
  const backgroundImageMobile = config.backgroundAssets?.backgroundImageMobile || backgroundImage;
  const hasSeparateMobileImage = backgroundImageMobile && backgroundImageMobile !== backgroundImage;
  const overlayOpacity = config.backgroundAssets?.overlayOpacity || 0.3;

  // Phase 3 L11 (audit/2026-05-08): see HeroDefault for context.
  const impressionRef = useImpressionTracking<HTMLElement>({
    eventName: 'hero_impression',
    parameters: { variant: 'fullBackground' },
  });

  return (
    <section
      ref={impressionRef}
      className={`${styles.section} ${className}`}
      aria-labelledby="hero-title"
    >
      {/* Background Layer — uses next/image for optimization */}
      {hasBackgroundAssets && backgroundImage && (
        <div className={styles.backgroundLayer} aria-hidden="true">
          {/* Desktop image (hidden on mobile when separate mobile image exists) */}
          <Image
            src={backgroundImage}
            alt=""
            fill
            priority
            quality={80}
            sizes={hasSeparateMobileImage ? '(min-width: 1024px) 100vw, 0px' : '100vw'}
            className={hasSeparateMobileImage ? styles.bgImageDesktop : styles.bgImage}
            style={{ objectFit: 'cover' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {/* Mobile image (only rendered when different from desktop) */}
          {hasSeparateMobileImage && (
            <Image
              src={backgroundImageMobile}
              alt=""
              fill
              priority
              quality={75}
              sizes="(max-width: 1023px) 100vw, 0px"
              className={styles.bgImageMobile}
              style={{ objectFit: 'cover' }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
          <div className={styles.backgroundOverlay} style={{ opacity: overlayOpacity }} />
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 id="hero-title" className={styles.title}>
            {config.content.title}
          </h1>

          {config.content.description && (
            <p className={styles.description}>{config.content.description}</p>
          )}

          <div className={styles.ctaWrapper}>
            {config.content.ctaText ? (
              <Button
                variant={DEFAULT_CTA_PROPS.variant}
                size={DEFAULT_CTA_PROPS.size}
                trackable={DEFAULT_CTA_PROPS.trackable}
                className={styles.ctaButton}
                onClick={handleCTAClick}
              >
                {config.content.ctaText}
              </Button>
            ) : config.content.ctaHref ? (
              <a
                href={config.content.ctaHref}
                className={styles.scrollIndicator}
                aria-label={intl.formatMessage({ id: 'common.accessibility.scrollDown' })}
              >
                <ChevronDown size={24} strokeWidth={2} />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className={styles.bottomGradient} aria-hidden="true" />

      {/* Loading State */}
      {!backgroundLoaded && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}
