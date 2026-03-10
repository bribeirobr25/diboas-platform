/**
 * ProductCarouselPersona Variant Component
 *
 * Domain-Driven Design: Text-only persona carousel for B2C landing page
 * Service Agnostic Abstraction: Pure component, config-driven content
 * Code Reusability: Shared useCarousel, useSwipeGesture, CarouselDots
 * Accessibility: Full keyboard, screen reader, and reduced motion support
 * No Hardcoded Values: Uses design tokens and configuration via i18n
 */

'use client';

import { useCallback } from 'react';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { CarouselDots } from '@/components/UI';
import { useCarousel } from '@/hooks/useCarousel';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useConfigTranslation } from '@/lib/i18n/config-translator';
import type { ProductCarouselVariantProps } from '../types';
import styles from './ProductCarouselPersona.module.css';

export function ProductCarouselPersona({
  config,
  className = '',
  onSlideChange,
  onCTAClick,
}: ProductCarouselVariantProps) {
  const translated = useConfigTranslation(config);
  const slides = translated.content.slides || [];

  const handleSlideChange = useCallback(
    (index: number) => {
      onSlideChange?.(index);
    },
    [onSlideChange]
  );

  const {
    currentSlideIndex,
    isTransitioning,
    goToSlide,
    goToNext,
    goToPrev,
    handleKeyDown,
    handleMouseEnter,
    handleMouseLeave,
  } = useCarousel({
    totalSlides: slides.length,
    autoPlay: config.settings?.autoPlay ?? true,
    autoPlayInterval: config.settings?.autoPlayInterval ?? 5000,
    transitionDuration: config.settings?.transitionDuration ?? 500,
    pauseOnHover: config.settings?.pauseOnHover ?? true,
    enableKeyboard: config.settings?.enableKeyboard ?? true,
    componentName: 'PersonaCarousel',
    onSlideChange: handleSlideChange,
  });

  const { handleTouchStart, handleTouchEnd } = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    threshold: 40,
    velocityThreshold: 0.3,
    enabled: config.settings?.enableTouch ?? true,
  });

  const currentSlide = slides[currentSlideIndex];
  if (!currentSlide) return null;

  const handleCtaClick = useCallback(() => {
    const el = document.getElementById('demo');
    if (el) {
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      el.scrollIntoView({
        behavior: prefersReduced ? 'instant' : 'smooth',
      });
    }
    onCTAClick?.(currentSlide.id, '#demo');
  }, [currentSlide, onCTAClick]);

  return (
    <SectionContainer
      variant="narrow"
      padding="standard"
      ariaLabel={translated.seo?.ariaLabel || 'Persona carousel'}
      className={className}
    >
      <div
        className={styles.wrapper}
        aria-roledescription="carousel"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        style={{ touchAction: 'pan-y' }}
      >
        <h2 className={styles.heading}>{translated.content.heading}</h2>

        <div className={styles.slideContainer}>
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`${styles.slide} ${index === currentSlideIndex ? styles.slideActive : ''}`}
              role="group"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
              aria-hidden={index !== currentSlideIndex}
            >
              <p className={styles.headline}>{slide.title}</p>
              <p className={styles.subtext}>{slide.subtitle}</p>
              {slide.ctaText ? (
                <button
                  type="button"
                  className={styles.cta}
                  onClick={handleCtaClick}
                  tabIndex={index === currentSlideIndex ? 0 : -1}
                >
                  {slide.ctaText}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {config.settings?.enableDots !== false ? (
          <CarouselDots
            totalSlides={slides.length}
            currentIndex={currentSlideIndex}
            onDotClick={goToSlide}
            disabled={isTransitioning}
            ariaLabelPattern="Go to slide {index} of {total}"
            className={styles.dots}
          />
        ) : null}
      </div>
    </SectionContainer>
  );
}
