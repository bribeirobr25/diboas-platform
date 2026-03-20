/**
 * FeatureShowcaseDefault Variant Component
 * 
 * Domain-Driven Design: Isolated default showcase variant
 * Service Agnostic Abstraction: Pure component focused on interactive showcase
 * Code Reusability: Can be composed into other showcase variants
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from '@/components/UI/LucideIcon';
import { useTranslation } from '@diboas/i18n/client';
import { CTAButtonLink, CarouselDots, DEFAULT_CTA_PROPS } from '@/components/UI';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useCarousel } from '@/hooks/useCarousel';
import { useImageLoading } from '@/hooks/useImageLoading';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { analyticsService } from '@/lib/analytics';
import { Logger } from '@/lib/monitoring/Logger';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import type { FeatureShowcaseVariantProps } from '../types';
import styles from './FeatureShowcaseDefault.module.css';
import ctaStyles from '@/styles/shared/cta-button.module.css';

export function FeatureShowcaseDefault({
  config,
  className = '',
  enableAnalytics = true,
  priority = true,
  backgroundColor,
  onNavigate,
  onSlideChange,
  onCTAClick
}: FeatureShowcaseVariantProps) {
  const intl = useTranslation();
  const { recordSectionRenderTime } = usePerformanceMonitoring();

  // Performance monitoring (unique to FeatureShowcase)
  useEffect(() => {
    const renderStart = performance.now();

    const recordRenderTime = () => {
      const renderEnd = performance.now();
      recordSectionRenderTime('feature-showcase-default', renderEnd - renderStart);
    };

    const timeoutId = setTimeout(recordRenderTime, 0);
    return () => clearTimeout(timeoutId);
  }, [recordSectionRenderTime]);

  const slides = config.slides || [];
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageError = useCallback((slideId: string) => {
    setFailedImages(prev => new Set(prev).add(slideId));
  }, []);

  // Detect images that failed before React hydration (SSR timing)
  useEffect(() => {
    if (!containerRef.current) return;

    const markFailed = (slideId: string) => {
      setFailedImages(prev => new Set(prev).add(slideId));
    };

    const checkImages = () => {
      if (!containerRef.current) return;
      const imgs = containerRef.current.querySelectorAll('img[data-slide-id]');
      imgs.forEach((img) => {
        const htmlImg = img as HTMLImageElement;
        const slideId = htmlImg.dataset.slideId;
        if (!slideId) return;

        if (htmlImg.complete && htmlImg.naturalWidth === 0) {
          markFailed(slideId);
        } else if (!htmlImg.complete) {
          htmlImg.addEventListener('error', () => markFailed(slideId), { once: true });
        }
      });
    };

    // Use rAF to ensure images have had time to process 404 responses
    const rafId = requestAnimationFrame(checkImages);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Custom slide change handler with logging
  const handleSlideChange = useCallback((index: number, source: 'auto' | 'user') => {
    onSlideChange?.(index);

    Logger.info('FeatureShowcaseDefault slide changed', {
      section: 'FeatureShowcaseDefault',
      slideIndex: index,
      source,
    });
  }, [onSlideChange]);

  // Shared carousel hook (manual navigation only - no auto-play)
  const {
    currentSlideIndex,
    isTransitioning,
    goToSlide,
    goToNext,
    goToPrev,
    handleKeyDown
  } = useCarousel({
    totalSlides: slides.length,
    autoPlay: false, // Manual navigation only
    transitionDuration: config.settings?.transitionDuration || 500,
    pauseOnHover: false, // Not applicable for manual carousel
    enableKeyboard: true,
    componentName: 'FeatureShowcaseDefault',
    onSlideChange: handleSlideChange,
    onNavigate
  });

  // Shared image loading hook
  const {
    handleImageLoad
  } = useImageLoading({
    totalImages: slides.length
  });

  // Shared swipe gesture hook
  const {
    handleTouchStart,
    handleTouchEnd
  } = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 50,
    velocityThreshold: 0.3,
    enabled: true
  });

  const currentSlide = slides[currentSlideIndex];

  // CTA Click handler
  const handleCTAClick = useCallback(async (slideId: string, ctaHref: string) => {
    if (enableAnalytics && config.analytics?.enabled) {
      try {
        await analyticsService.trackEvent(`${config.analytics.trackingPrefix}_cta_click`, {
          slide_id: slideId,
          slide_index: currentSlideIndex,
          cta_href: ctaHref,
          variant: config.variant,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Analytics tracking failed silently:  showcase CTA click:', error);
      }
    }
    
    onCTAClick?.(slideId, ctaHref);
  }, [enableAnalytics, config.analytics, config.variant, currentSlideIndex, onCTAClick]);

  if (!currentSlide) return null;

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={backgroundColor}
      className={className}
      ariaLabelledBy="showcase-title"
    >
      <div ref={containerRef} className={styles.container}>

        {/* Content Container */}
        <div
          className={styles.content}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          
          {/* LEFT COLUMN: Text Content (Desktop: 1fr) */}
          <div className={styles.textColumn}>
            {currentSlide.content.tagline ? (
              <p className={styles.tagline}>{currentSlide.content.tagline}</p>
            ) : null}
            <h2 id="showcase-title" className={styles.title}>
              {currentSlide.content.title}
            </h2>

            {/* Mobile/Tablet: Visual Content (hidden on desktop) */}
            <div className={styles.mobileVisualContent}>
              <div className={styles.visualPanel}>
                <div className={styles.imageContainer}>
                  {!failedImages.has(currentSlide.id) ? (
                    <Image
                      src={currentSlide.assets.primaryImage}
                      alt={currentSlide.seo.imageAlt}
                      width={400}
                      height={520}
                      data-slide-id={currentSlide.id}
                      priority={priority}
                      className={styles.image}
                      onLoad={() => handleImageLoad(currentSlide.id)}
                      onError={() => handleImageError(currentSlide.id)}
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <p className={styles.description}>
              {currentSlide.content.description}
            </p>
            
            {/* CTA - Using shared CTAButtonLink component */}
            {currentSlide.content.ctaText && currentSlide.content.ctaHref && (
              <div className={styles.ctaWrapper}>
                <CTAButtonLink
                  href={currentSlide.content.ctaHref}
                  target={currentSlide.content.ctaTarget}
                  onClick={() => handleCTAClick(currentSlide.id, currentSlide.content.ctaHref)}
                  variant={DEFAULT_CTA_PROPS.variant}
                  size={DEFAULT_CTA_PROPS.size}
                  trackable={DEFAULT_CTA_PROPS.trackable}
                  className={ctaStyles.ctaButton}
                >
                  {currentSlide.content.ctaText}
                </CTAButtonLink>
              </div>
            )}

            {/* Navigation Controls - Below CTA */}
            {config.settings?.showNavigation && slides.length > 1 && (
              <div className={styles.navigation}>
                <button
                  onClick={goToPrev}
                  className={styles.navButton}
                  aria-label={intl.formatMessage({ id: 'common.accessibility.previousSlide' })}
                  disabled={isTransitioning}
                >
                  <ChevronLeft className={styles.navIcon} />
                </button>

                <button
                  onClick={goToNext}
                  className={styles.navButton}
                  aria-label={intl.formatMessage({ id: 'common.accessibility.nextSlide' })}
                  disabled={isTransitioning}
                >
                  <ChevronRight className={styles.navIcon} />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Visual Content (Desktop: 1.2fr) */}
          <div className={styles.visualColumn}>
            <div className={styles.visualPanel}>
              <div className={styles.imageContainer}>
                {!failedImages.has(currentSlide.id) ? (
                  <Image
                    src={currentSlide.assets.primaryImage}
                    alt={currentSlide.seo.imageAlt}
                    width={400}
                    height={520}
                    data-slide-id={currentSlide.id}
                    priority={priority}
                    className={styles.image}
                    onLoad={() => handleImageLoad(currentSlide.id)}
                    onError={() => handleImageError(currentSlide.id)}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Dots Navigation - Using shared CarouselDots component */}
        {config.settings?.showDots && (
          <CarouselDots
            totalSlides={slides.length}
            currentIndex={currentSlideIndex}
            onDotClick={goToSlide}
            disabled={isTransitioning}
            className={styles.dotsContainer}
          />
        )}
      </div>
    </SectionContainer>
  );
}