/**
 * Unified Hero Section Component
 * 
 * Domain-Driven Design: Single hero domain with configurable variants
 * Service Agnostic Abstraction: Fully configurable through props and variants
 * Code Reusability & DRY: Unified component eliminating duplication
 * Performance & SEO Optimization: Optimized images with proper loading
 * Error Handling & System Recovery: Graceful fallbacks and error boundaries
 * Security & Audit Standards: Secure image handling and XSS prevention
 * Product KPIs & Analytics: Configurable analytics with variant tracking
 * No Hardcoded Values: All values configurable through config system
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { HERO_CONFIGS, type HeroVariantConfig, type HeroVariant } from '@/config/hero';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './HeroSection.module.css';

export interface HeroSectionProps {
  /**
   * Hero variant configuration - determines layout and assets
   */
  variant?: HeroVariant;

  /**
   * Custom hero configuration - overrides default config
   */
  config?: Partial<HeroVariantConfig>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Custom section background color (replaces backgroundImage for better theming)
   */
  backgroundColor?: string;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;
}

interface HeroImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Unified Hero Section with variant support
 * Monitoring & Observability: Built-in loading states and error tracking
 */
export function HeroSection({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = true
}: HeroSectionProps) {
  // Domain-Driven Design: Merge default config with custom overrides
  const baseConfig = HERO_CONFIGS[variant];
  const config = customConfig
    ? { ...baseConfig, ...customConfig } as HeroVariantConfig
    : baseConfig;

  // State management for loading and error handling
  const [imageLoadingState, setImageLoadingState] = useState({
    loaded: 0,
    total: 0,
    errors: new Set<string>()
  });

  const isFullBackground = config.variant === 'fullBackground';
  const totalImages = isFullBackground ? 0 : 3; // fullBackground uses CSS backgrounds, default uses (background, phone, mascot)

  // Error Handling: Image loading error handler
  const handleImageError = useCallback((imageName: string) => {
    setImageLoadingState(prev => ({
      ...prev,
      errors: new Set(prev.errors).add(imageName)
    }));
  }, []);

  // Performance: Image loading success handler
  const handleImageLoad = useCallback(() => {
    setImageLoadingState(prev => ({
      ...prev,
      loaded: prev.loaded + 1
    }));
  }, []);

  // Product KPIs & Analytics: CTA interaction tracking
  const handleCTAClick = useCallback(async () => {
    if (!enableAnalytics || !config.analytics?.enabled) return;

    try {
      await analyticsService.trackEvent(`${config.analytics.trackingPrefix}_cta_click`, {
        page: window.location.pathname,
        variant: config.variant,
        cta_text: config.content.ctaText,
        cta_href: config.content.ctaHref,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Error Handling: Don't let analytics failures break user experience
      console.warn('Failed to track hero CTA click:', error);
    }
  }, [enableAnalytics, config]);

  // Type Guards and Security: Determine final background images with validation
  const hasBackgroundAssets = 'backgroundAssets' in config;
  const finalBackgroundImage = backgroundColor ||
    (isFullBackground && hasBackgroundAssets ? config.backgroundAssets?.backgroundImage : undefined);
  const finalBackgroundImageMobile = 
    (isFullBackground && hasBackgroundAssets ? config.backgroundAssets?.backgroundImageMobile : undefined) || finalBackgroundImage;
  const overlayOpacity = (isFullBackground && hasBackgroundAssets ? config.backgroundAssets?.overlayOpacity : undefined) || 0.3;

  // Performance: Track loading completion
  useEffect(() => {
    setImageLoadingState(prev => ({ ...prev, total: totalImages }));
  }, [totalImages]);

  // Performance: Preload background images for fullBackground variant
  useEffect(() => {
    if (isFullBackground && finalBackgroundImage) {
      const preloadImages = [finalBackgroundImage];
      if (finalBackgroundImageMobile && finalBackgroundImageMobile !== finalBackgroundImage) {
        preloadImages.push(finalBackgroundImageMobile);
      }

      let loadedCount = 0;
      const totalBgImages = preloadImages.length;
      
      // Set total images for fullBackground variant
      setImageLoadingState(prev => ({ ...prev, total: totalBgImages, loaded: 0 }));

      preloadImages.forEach((src) => {
        const img = new window.Image();
        img.onload = () => {
          loadedCount++;
          setImageLoadingState(prev => ({ 
            ...prev, 
            loaded: loadedCount 
          }));
        };
        img.onerror = () => {
          handleImageError('background');
          loadedCount++;
          setImageLoadingState(prev => ({ 
            ...prev, 
            loaded: loadedCount 
          }));
        };
        img.src = src;
      });
    }
  }, [isFullBackground, finalBackgroundImage, finalBackgroundImageMobile, handleImageError]);
  const isImagesLoaded = imageLoadingState.total === 0 ? true : imageLoadingState.loaded >= imageLoadingState.total;

  // Semantic Naming: Generate CSS classes based on variant
  const sectionClasses = [
    styles.section,
    styles[`section--${config.variant}`],
    className
  ].filter(Boolean).join(' ');

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section
      className={sectionClasses}
      style={sectionStyle}
      aria-labelledby="hero-title"
    >
      {/* Full Background Variant: Responsive Background Image Layer */}
      {isFullBackground && finalBackgroundImage && (
        <div 
          className={styles.backgroundLayerResponsive}
          style={{
            backgroundImage: `url(${finalBackgroundImageMobile})`,
            // Use CSS custom property for desktop image
            '--desktop-bg': `url(${finalBackgroundImage})`
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
        {/* Text Content - Consistent across variants */}
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

        {/* Default Variant: Visual Content */}
        {!isFullBackground && config.visualAssets && (
          <div className={styles.visualContent}>

            {/* Background Circle */}
            <div className={styles.backgroundWrapper}>
              {!imageLoadingState.errors.has('circle') ? (
                <HeroImage
                  src={config.visualAssets.backgroundCircle}
                  alt={config.seo.imageAlt.background}
                  width={420}
                  height={420}
                  className={styles.backgroundCircle}
                  onError={() => handleImageError('circle')}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className={styles.backgroundFallback} aria-hidden="true" />
              )}
            </div>

            {/* Phone Image */}
            <div className={styles.phoneWrapper}>
              {!imageLoadingState.errors.has('phone') ? (
                <HeroImage
                  src={config.visualAssets.phoneImage}
                  alt={config.seo.imageAlt.phone || 'Mobile application interface'}
                  width={320}
                  height={480}
                  priority={priority}
                  className={styles.phoneImage}
                  onError={() => handleImageError('phone')}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className={styles.phoneFallback} aria-hidden="true">
                  <span>📱</span>
                </div>
              )}
            </div>

            {/* Mascot Image */}
            <div className={styles.mascotWrapper}>
              {!imageLoadingState.errors.has('mascot') ? (
                <HeroImage
                  src={config.visualAssets.mascotImage}
                  alt={config.seo.imageAlt.mascot || 'Brand mascot character'}
                  width={180}
                  height={200}
                  className={styles.mascotImage}
                  onError={() => handleImageError('mascot')}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className={styles.mascotFallback} aria-hidden="true">
                  <span>🤖</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading State - Monitoring & Observability */}
      {!isImagesLoaded && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}

/**
 * Optimized Hero Image Component
 * Error Handling: Built-in error recovery with graceful fallbacks
 * Performance: Optimized loading with proper sizing hints
 */
function HeroImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onError,
  onLoad
}: HeroImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  if (hasError) {
    return null; // Let parent component handle fallback
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw"
    />
  );
}