/**
 * FeatureShowcaseBenefits Variant Component
 * 
 * Domain-Driven Design: Benefits-specific showcase variant with styled images
 * Service Agnostic Abstraction: Pure component focused on benefits presentation
 * Code Reusability: Based on default variant with benefits-specific styling
 * No Hardcoded Values: Uses design tokens for rounded borders and 80% image sizing
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const slides = config.slides || [];
  const currentSlide = slides[currentSlideIndex];

  // Navigation handlers
  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= slides.length || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentSlideIndex(index);
    onSlideChange?.(index);
    
    setTimeout(() => setIsTransitioning(false), config.settings?.transitionDuration || 500);
  }, [slides.length, isTransitioning, config.settings?.transitionDuration, onSlideChange]);

  const goToNext = useCallback(() => {
    const nextIndex = (currentSlideIndex + 1) % slides.length;
    goToSlide(nextIndex);
    onNavigate?.('next');
  }, [currentSlideIndex, slides.length, goToSlide, onNavigate]);

  const goToPrev = useCallback(() => {
    const prevIndex = currentSlideIndex === 0 ? slides.length - 1 : currentSlideIndex - 1;
    goToSlide(prevIndex);
    onNavigate?.('prev');
  }, [currentSlideIndex, slides.length, goToSlide, onNavigate]);

  // Image loading handler
  const handleImageLoad = useCallback((slideId: string, imageType: 'primary') => {
    setImagesLoaded(prev => ({ ...prev, [`${slideId}-${imageType}`]: true }));
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    setTouchStart(0);
  }, [touchStart, goToNext, goToPrev]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

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
          ref={containerRef}
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