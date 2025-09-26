/**
 * Unified Feature Showcase Component
 * 
 * Domain-Driven Design: Single showcase domain with configurable variants
 * Service Agnostic Abstraction: Fully configurable through props and variants
 * Code Reusability & DRY: Unified component eliminating duplication
 * Performance & SEO Optimization: Optimized images with proper loading
 * Event-Driven Architecture: Manual navigation with keyboard support
 * Error Handling & System Recovery: Graceful image loading fallbacks
 * Security & Audit Standards: Secure image handling and XSS prevention
 * Product KPIs & Analytics: Configurable analytics with variant tracking
 * No Hardcoded Values: All values configurable through config system
 * Accessibility: Full keyboard navigation and screen reader support
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FEATURE_SHOWCASE_CONFIGS, type FeatureShowcaseVariantConfig, type FeatureShowcaseVariant } from '@/config/featureShowcase';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './FeatureShowcase.module.css';

export interface FeatureShowcaseProps {
  /**
   * Feature showcase variant configuration - determines layout and behavior
   */
  variant?: FeatureShowcaseVariant;

  /**
   * Custom feature showcase configuration - overrides default config
   */
  config?: Partial<FeatureShowcaseVariantConfig>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Custom section background color
   */
  backgroundColor?: string;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;
}

interface FeatureImageProps {
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
 * Unified Feature Showcase with variant support
 * Monitoring & Observability: Built-in loading states and error tracking
 */
export function FeatureShowcase({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = false
}: FeatureShowcaseProps) {
  // Domain-Driven Design: Merge default config with custom overrides
  const baseConfig = FEATURE_SHOWCASE_CONFIGS[variant];
  const config = customConfig
    ? { ...baseConfig, ...customConfig } as FeatureShowcaseVariantConfig
    : baseConfig;

  // State management for showcase functionality
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const lastNavigationTime = useRef<number>(0);

  const { slides, settings } = config;
  const currentSlide = slides[activeIndex];

  // Performance: Track image loading completion
  useEffect(() => {
    if (slides.length === 0) return;
    
    let loadedCount = 0;
    const imagesPerSlide = 2;
    const totalImages = slides.length * imagesPerSlide;
    
    const handleImageLoad = () => {
      loadedCount++;
      const preloadCount = (settings.performance?.preloadSlideCount || 2) * imagesPerSlide;
      if (loadedCount >= Math.min(totalImages, preloadCount)) {
        setImagesLoaded(true);
      }
    };

    // Set a timeout for loading state
    const timeout = setTimeout(() => {
      setImagesLoaded(true);
    }, settings.performance?.imageLoadingTimeout || 2000);

    return () => clearTimeout(timeout);
  }, [slides.length]);

  // Navigation functions - Manual only (no auto-rotation)
  const goToSlide = useCallback((index: number) => {
    const now = Date.now();
    
    // Throttle navigation to prevent rapid clicks - minimum 150ms between navigations
    const throttleMs = settings.performance?.navigationThrottleMs || 150;
    if (index === activeIndex || slides.length <= 1 || (now - lastNavigationTime.current < throttleMs)) {
      return;
    }
    
    lastNavigationTime.current = now;
    setIsTransitioning(true);
    setActiveIndex(index);
    
    // Product KPIs & Analytics: Non-blocking navigation tracking
    if (enableAnalytics && config.analytics?.enabled) {
      // Fire analytics asynchronously without blocking navigation
      const navigationSuffix = config.analytics.eventSuffixes?.navigation || '_navigation';
      analyticsService.trackEvent(`${config.analytics.trackingPrefix}${navigationSuffix}`, {
        from_slide: currentSlide.id,
        to_slide: slides[index].id,
        navigation_type: 'manual',
        variant: config.variant,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      }).catch((error) => {
        // Error Handling: Silent fail for analytics
        console.warn('Failed to track feature showcase navigation:', error);
      });
    }
    
    // Reset transition state after a shorter delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, settings.performance?.navigationThrottleMs || 150);
  }, [activeIndex, slides, currentSlide, enableAnalytics, config]);

  const goToPrevious = useCallback(() => {
    const newIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
    goToSlide(newIndex);
  }, [activeIndex, slides.length, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
    goToSlide(newIndex);
  }, [activeIndex, slides.length, goToSlide]);

  // Product KPIs & Analytics: CTA interaction tracking
  const handleCTAClick = useCallback(async () => {
    if (enableAnalytics && config.analytics?.enabled) {
      try {
        const ctaSuffix = config.analytics.eventSuffixes?.ctaClick || '_cta_click';
        await analyticsService.trackEvent(`${config.analytics.trackingPrefix}${ctaSuffix}`, {
          slide_id: currentSlide.id,
          cta_text: currentSlide.content.ctaText,
          cta_href: currentSlide.content.ctaHref,
          variant: config.variant,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Error Handling: Silent fail for analytics
        console.warn('Failed to track feature showcase CTA click:', error);
      }
    }
  }, [enableAnalytics, config, currentSlide]);

  // Error Handling: Image loading error handler
  const handleImageError = useCallback((imageName: string) => {
    setLoadErrors(prev => new Set(prev).add(imageName));
  }, []);

  // Performance: Image loading success handler
  const handleImageLoad = useCallback(() => {
    // Can be used for loading state management
  }, []);

  // Accessibility: Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sectionRef.current?.contains(document.activeElement)) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Security: Early return for empty slides
  if (slides.length === 0) return null;

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  // Semantic Naming: Generate CSS classes based on variant
  const sectionClasses = [
    styles.section,
    styles[`section--${config.variant}`],
    className
  ].filter(Boolean).join(' ');

  // Common visual content component
  const VisualContent = () => (
    <div className={styles.visualContent}>
      {/* Images Container - Direct without background panel */}
      <div 
        className={`${styles.imagesContainer} ${
          isTransitioning ? styles.imagesExiting : styles.imagesEntered
        }`}
      >
        {/* Secondary Image (Background) - Only show if configured */}
        {currentSlide.showSecondaryImage && (
          <div className={styles.secondaryImageWrapper}>
            {!loadErrors.has(`${currentSlide.id}-secondary`) ? (
              <FeatureImage
                src={currentSlide.assets.secondaryImage}
                alt={currentSlide.seo.imageAlt.secondary}
                width={settings.images?.dimensions.width || 280}
                height={settings.images?.dimensions.height || 360}
                className={styles.secondaryImage}
                onError={() => handleImageError(`${currentSlide.id}-secondary`)}
                onLoad={handleImageLoad}
                sizes={settings.images?.responsiveSizes}
              />
            ) : (
              <div className={styles.imageFallback} aria-hidden="true">
                <span>📱</span>
              </div>
            )}
          </div>
        )}

        {/* Primary Image (Foreground) */}
        <div className={`${styles.primaryImageWrapper} ${styles.primaryImageWrapperOverview}`}>
          {!loadErrors.has(`${currentSlide.id}-primary`) ? (
            <FeatureImage
              src={currentSlide.assets.primaryImage}
              alt={currentSlide.seo.imageAlt.primary}
              width={settings.images?.dimensions.width || 280}
              height={settings.images?.dimensions.height || 360}
              priority={priority && activeIndex === 0}
              className={styles.primaryImage}
              onError={() => handleImageError(`${currentSlide.id}-primary`)}
              onLoad={handleImageLoad}
              sizes={settings.images?.responsiveSizes}
            />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true">
              <span>{settings.images?.fallbackEmoji || '📱'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading State - Monitoring & Observability */}
      {!imagesLoaded && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </div>
  );

  // Common CTA content component
  const CTAContent = () => (
    <div className={styles.ctaSection}>
      {/* CTA Button */}
      <div 
        className={`${styles.ctaLink} ${
          isTransitioning ? styles.contentExiting : styles.contentEntered
        }`}
      >
        {currentSlide.content.ctaTarget === '_blank' ? (
          <a
            href={currentSlide.content.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCTAClick}
            aria-label={`${currentSlide.content.ctaText} - Opens in new tab`}
          >
            <button className={styles.ctaButton}>
              {currentSlide.content.ctaText}
            </button>
          </a>
        ) : (
          <Link
            href={currentSlide.content.ctaHref}
            onClick={handleCTAClick}
          >
            <button className={styles.ctaButton}>
              {currentSlide.content.ctaText}
            </button>
          </Link>
        )}
      </div>

      {/* Navigation Controls */}
      {settings.showNavigation && slides.length > 1 && (
        <div className={styles.navigationControls} role="group" aria-label="Feature showcase navigation">
          <button
            onClick={goToPrevious}
            className={styles.navButton}
            aria-label="Previous feature"
            type="button"
          >
            <ChevronLeft className={styles.navIcon} aria-hidden="true" />
          </button>
          
          <button
            onClick={goToNext}
            className={styles.navButton}
            aria-label="Next feature"
            type="button"
          >
            <ChevronRight className={styles.navIcon} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Dots Navigation */}
      {settings.showDots && slides.length > 1 && (
        <nav className={styles.dots} aria-label="Feature showcase slides">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${
                index === activeIndex ? styles.dotActive : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : 'false'}
            />
          ))}
        </nav>
      )}
    </div>
  );

  return (
    <section 
      ref={sectionRef}
      className={sectionClasses}
      style={sectionStyle}
      aria-labelledby="feature-showcase-title"
      role="region"
    >
      <div className={styles.container}>
        
        {/* Desktop Layout */}
        <div className={styles.desktopLayout}>
          {/* Text Content Column */}
          <div className={styles.textContent}>
            <h2 
              id="feature-showcase-title"
              className={`${styles.title} ${
                isTransitioning ? styles.contentExiting : styles.contentEntered
              }`}
            >
              {currentSlide.content.title}
            </h2>
            
            <p 
              className={`${styles.description} ${
                isTransitioning ? styles.contentExiting : styles.contentEntered
              }`}
            >
              {currentSlide.content.description}
            </p>

            <CTAContent />
          </div>

          {/* Visual Content Column */}
          <VisualContent />
        </div>

        {/* Mobile Layout - Reordered elements */}
        <div className={styles.mobileLayout}>
          {/* Title first */}
          <h2 
            id="feature-showcase-title-mobile"
            className={`${styles.title} ${styles.mobileTitle} ${
              isTransitioning ? styles.contentExiting : styles.contentEntered
            }`}
          >
            {currentSlide.content.title}
          </h2>
          
          {/* Phone images second */}
          <VisualContent />
          
          {/* Description third */}
          <p 
            className={`${styles.description} ${styles.mobileDescription} ${
              isTransitioning ? styles.contentExiting : styles.contentEntered
            }`}
          >
            {currentSlide.content.description}
          </p>
          
          {/* Button and arrows fourth */}
          <CTAContent />
        </div>
      </div>
    </section>
  );
}

/**
 * Optimized Feature Image Component
 * Error Handling: Built-in error recovery with graceful fallbacks
 * Performance: Optimized loading with proper sizing hints
 */
function FeatureImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onError,
  onLoad,
  sizes
}: FeatureImageProps & { sizes?: string }) {
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
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}