/**
 * Hero Section Full Background Component
 * 
 * Performance & SEO Optimization: Optimized background image with proper loading
 * Accessibility: Full keyboard navigation and screen reader support
 * Responsive Design: Mobile-first with desktop enhancements
 * Service Agnostic Abstraction: Configurable content and background
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { DEFAULT_HERO_CONFIG, type HeroConfig } from '@/config/hero';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './HeroSectionFullBg.module.css';

export interface HeroSectionFullBgProps {
  /**
   * Hero configuration - can override default content
   */
  config?: HeroConfig;
  
  /**
   * Custom background image path
   */
  backgroundImage?: string;
  
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  
  /**
   * Enable analytics tracking for CTA interactions
   */
  enableAnalytics?: boolean;
}

export function HeroSectionFullBg({ 
  config = DEFAULT_HERO_CONFIG, 
  backgroundImage = '/assets/socials/drawing/bg-diboas-abstract.avif',
  className = '',
  enableAnalytics = true
}: HeroSectionFullBgProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const handleCTAClick = async () => {
    if (enableAnalytics) {
      try {
        await analyticsService.trackEvent('hero_fullbg_cta_click', {
          page: window.location.pathname,
          cta_text: config.content.ctaText,
          cta_href: config.content.ctaHref,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Error Handling: Don't let analytics failures break user experience
        console.warn('Failed to track hero CTA click:', error);
      }
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setHasImageError(true);
    setImageLoaded(true); // Stop showing loading state
  };

  return (
    <section 
      className={`${styles.section} ${className}`}
      aria-labelledby="hero-title"
    >
      {/* Background Image */}
      <div className={styles.backgroundImageWrapper}>
        {!hasImageError ? (
          <Image
            src={backgroundImage}
            alt="Hero background"
            fill
            priority
            quality={85}
            sizes="100vw"
            className={styles.backgroundImage}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className={styles.backgroundFallback} aria-hidden="true" />
        )}
        
        {/* Background Overlay for better text readability */}
        <div className={styles.backgroundOverlay} aria-hidden="true" />
      </div>

      <div className={styles.container}>
        {/* Text Content - Centered on mobile, Left on desktop */}
        <div className={styles.textContent}>
          <h1 id="hero-title" className={styles.title}>
            {config.content.title}
          </h1>
          
          {config.content.description && (
            <p className={styles.description}>
              {config.content.description}
            </p>
          )}

          <div className={styles.ctaWrapper}>
            {config.content.ctaTarget === '_blank' ? (
              <a
                href={config.content.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCTAClick}
                className={styles.ctaLink}
                aria-label={`${config.content.ctaText} - Opens in new tab`}
              >
                <Button
                  variant="gradient"
                  size="lg"
                  className={styles.ctaButton}
                >
                  {config.content.ctaText}
                </Button>
              </a>
            ) : (
              <Link
                href={config.content.ctaHref}
                onClick={handleCTAClick}
                className={styles.ctaLink}
              >
                <Button
                  variant="gradient"
                  size="lg"
                  className={styles.ctaButton}
                >
                  {config.content.ctaText}
                </Button>
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* Loading State */}
      {!imageLoaded && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}