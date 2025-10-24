/**
 * FeatureShowcaseBenefits Variant Component
 * 
 * Domain-Driven Design: Benefits-specific showcase variant with styled images
 * Service Agnostic Abstraction: Pure component focused on benefits presentation
 * Code Reusability: Based on default variant with benefits-specific styling
 * No Hardcoded Values: Uses design tokens for rounded borders and 80% image sizing
 */

'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCarousel } from '@/hooks/useCarousel';
import { useImageLoading } from '@/hooks/useImageLoading';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import type { FeatureShowcaseVariantProps } from '../types';
import styles from './FeatureShowcaseBenefits.module.css';

export function FeatureShowcaseBenefits({ 
  config, 
  className = '', 
  enableAnalytics = true,
  priority = true,
  backgroundColor,
  onNavigate,
  onSlideChange,
  onCTAClick
}: FeatureShowcaseVariantProps) {
  const slides = config.slides || [];

  // Shared carousel hook (manual navigation only - no auto-play)
  const {
    currentSlideIndex,
    isTransitioning,
    goToSlide,
    goToNext,
    goToPrev
  } = useCarousel({
    totalSlides: slides.length,
    autoPlay: false, // Manual navigation only
    transitionDuration: config.settings?.transitionDuration || 500,
    pauseOnHover: false, // Not applicable for manual carousel
    enableKeyboard: true,
    componentName: 'FeatureShowcaseBenefits',
    onSlideChange,
    onNavigate
  });

  // Shared image loading hook
  const {
    handleImageLoad: handleImageLoadBase
  } = useImageLoading({
    totalImages: slides.length
  });

  // Wrapper for handleImageLoad to support imageType parameter (kept for backward compatibility)
  const handleImageLoad = useCallback((slideId: string, imageType: 'primary') => {
    handleImageLoadBase(`${slideId}-${imageType}`);
  }, [handleImageLoadBase]);

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
        console.warn('Failed to track showcase CTA click:', error);
      }
    }
    
    onCTAClick?.(slideId, ctaHref);
  }, [enableAnalytics, config.analytics, config.variant, currentSlideIndex, onCTAClick]);

  if (!currentSlide) return null;

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section 
      className={`${styles.section} ${className}`}
      style={sectionStyle}
      aria-labelledby="showcase-title"
    >
      <div className={styles.container}>

        {/* Content Container */}
        <div
          className={styles.content}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          
          {/* Mobile: Title */}
          <div className={styles.mobileTitle}>
            <h2 id="showcase-title" className={styles.title}>
              {currentSlide.content.title}
            </h2>
          </div>

          {/* Visual Content - Benefits Style: Single Image, Rounded, 80% Size */}
          <div className={styles.visualContent}>
            <div className={styles.imageContainer}>
              <div className={styles.primaryImageWrapper}>
                <Image
                  src={currentSlide.assets.primaryImage}
                  alt={currentSlide.seo.imageAlt}
                  width={400}
                  height={300}
                  priority={priority}
                  className={styles.primaryImage}
                  onLoad={() => handleImageLoad(currentSlide.id, 'primary')}
                  sizes="(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 320px"
                />
              </div>
            </div>
          </div>
          
          {/* Text Content */}
          <div className={styles.textContent}>
            {/* Desktop: Title (hidden on mobile) */}
            <h2 className={styles.titleDesktop}>
              {currentSlide.content.title}
            </h2>
            
            <p className={styles.description}>
              {currentSlide.content.description}
            </p>
            
            {currentSlide.content.ctaText && currentSlide.content.ctaHref && (
              <div className={styles.ctaWrapper}>
                {currentSlide.content.ctaTarget === '_blank' ? (
                  <a
                    href={currentSlide.content.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ctaButton}
                    onClick={() => handleCTAClick(currentSlide.id, currentSlide.content.ctaHref)}
                  >
                    {currentSlide.content.ctaText}
                  </a>
                ) : (
                  <Link
                    href={currentSlide.content.ctaHref}
                    className={styles.ctaButton}
                    onClick={() => handleCTAClick(currentSlide.id, currentSlide.content.ctaHref)}
                  >
                    {currentSlide.content.ctaText}
                  </Link>
                )}
              </div>
            )}

            {/* Navigation Controls - Below CTA */}
            {config.settings?.showNavigation && slides.length > 1 && (
              <div className={styles.navigation}>
                <button
                  onClick={goToPrev}
                  className={styles.navButton}
                  aria-label="Previous slide"
                  disabled={isTransitioning}
                >
                  <ChevronLeft className={styles.navIcon} />
                </button>
                
                <button
                  onClick={goToNext}
                  className={styles.navButton}
                  aria-label="Next slide"
                  disabled={isTransitioning}
                >
                  <ChevronRight className={styles.navIcon} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dots Navigation */}
        {config.settings?.showDots && slides.length > 1 && (
          <div className={styles.dotsContainer}>
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`${styles.dot} ${index === currentSlideIndex ? styles.dotActive : ''}`}
                aria-label={`Go to slide ${index + 1}`}
                disabled={isTransitioning}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}