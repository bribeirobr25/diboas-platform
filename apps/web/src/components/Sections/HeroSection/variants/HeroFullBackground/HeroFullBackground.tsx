/**
 * HeroFullBackground Variant Component
 * 
 * Domain-Driven Design: Full-screen background hero with overlay
 * Service Agnostic Abstraction: Background-focused presentation variant
 * Code Reusability: Shared design tokens and patterns
 * Performance: Optimized background image loading
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@diboas/ui';
import type { HeroVariantProps } from '../types';
import styles from './HeroFullBackground.module.css';

export function HeroFullBackground({
  config,
  className = '',
  backgroundColor,
  onCTAClick
}: HeroVariantProps) {
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const handleCTAClick = useCallback(() => {
    onCTAClick?.();
  }, [onCTAClick]);

  // Responsive: Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Performance: Preload background images
  useEffect(() => {
    if (config.backgroundAssets?.backgroundImage) {
      const preloadImages = [config.backgroundAssets.backgroundImage];
      if (config.backgroundAssets.backgroundImageMobile && 
          config.backgroundAssets.backgroundImageMobile !== config.backgroundAssets.backgroundImage) {
        preloadImages.push(config.backgroundAssets.backgroundImageMobile);
      }

      let loadedCount = 0;
      const totalImages = preloadImages.length;
      
      preloadImages.forEach((src) => {
        const img = new window.Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setBackgroundLoaded(true);
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) {
            setBackgroundLoaded(true);
          }
        };
        img.src = src;
      });
    } else {
      setBackgroundLoaded(true);
    }
  }, [config.backgroundAssets]);

  const hasBackgroundAssets = config.backgroundAssets?.backgroundImage;
  const backgroundImage = backgroundColor || config.backgroundAssets?.backgroundImage;
  const backgroundImageMobile = config.backgroundAssets?.backgroundImageMobile || backgroundImage;
  const overlayOpacity = config.backgroundAssets?.overlayOpacity || 0.3;

  return (
    <section className={`${styles.section} ${className}`} aria-labelledby="hero-title">
      {/* Background Layer */}
      {hasBackgroundAssets && backgroundImage && (
        <div 
          className={styles.backgroundLayer}
          style={{
            backgroundImage: `url(${backgroundImageMobile})`,
            '--desktop-bg': `url(${backgroundImage})`
          } as React.CSSProperties & { '--desktop-bg': string }}
        >
          <div
            className={styles.backgroundOverlay}
            style={{ opacity: overlayOpacity }}
            aria-hidden="true"
          />
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.content}>
          {/* Left Column: Title and CTA */}
          <div className={styles.leftColumn}>
            <h1 id="hero-title" className={styles.title}>
              {config.content.title}
            </h1>

            <div className={styles.ctaWrapper}>
              <Button
                variant="gradient"
                className={styles.ctaButton}
                onClick={handleCTAClick}
                style={isDesktop ? {
                  width: 'var(--dimension-368)',
                  height: 'var(--dimension-56)',
                  padding: '0 var(--padding-button-x)',
                } : {
                  width: 'var(--percent-80)',
                  height: 'auto',
                }}
              >
                {config.content.ctaText}
              </Button>
            </div>
          </div>

          {/* Right Column: Description (Desktop Only) */}
          {config.content.description && (
            <div className={styles.rightColumn}>
              <p className={styles.description}>
                {config.content.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {!backgroundLoaded && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}