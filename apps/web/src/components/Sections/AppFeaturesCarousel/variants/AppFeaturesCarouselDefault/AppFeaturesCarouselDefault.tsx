/**
 * AppFeaturesCarouselDefault Variant Component
 * 
 * Domain-Driven Design: Isolated default app features carousel variant
 * Service Agnostic Abstraction: Pure component focused on app feature showcase
 * Code Reusability: Can be composed into other carousel variants
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Play, Pause } from '@/components/UI/LucideIcon';
import { CarouselDots } from '@/components/UI';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useCarousel } from '@/hooks/useCarousel';
import { useImageLoading } from '@/hooks/useImageLoading';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Logger } from '@/lib/monitoring/Logger';
import type { AppFeaturesCarouselVariantProps } from '../types';
import styles from './AppFeaturesCarouselDefault.module.css';
import carouselControls from '@/styles/shared/carousel-controls.module.css';

export function AppFeaturesCarouselDefault({ 
  config, 
  className = '', 
  enableAnalytics: _enableAnalytics = true,
  priority = false,
  backgroundColor,
  autoPlay = true,
  onNavigate,
  onSlideChange,
  onCTAClick,
  onPlayPause
}: AppFeaturesCarouselVariantProps) {
  const cards = useMemo(() => config.cards || [], [config.cards]);
  const autoRotateMs = config.settings?.autoRotateMs || 4000;

  // Custom slide change handler with logging
  const handleSlideChange = useCallback((index: number, source: 'auto' | 'user') => {
    // Call parent callback
    onSlideChange?.(index);

    // Log at appropriate level: user interactions are INFO, auto-play is DEBUG
    if (source === 'auto') {
      Logger.debug('App features carousel auto-rotated', {
        section: 'AppFeaturesCarousel',
        slideIndex: index,
        slideId: cards[index]?.id
      });
    } else {
      Logger.info('App features carousel card changed', {
        section: 'AppFeaturesCarousel',
        slideIndex: index,
        slideId: cards[index]?.id
      });
    }
  }, [cards, onSlideChange]);

  // Shared carousel hook
  const {
    currentSlideIndex,
    isTransitioning,
    isAutoPlaying,
    goToSlide,
    goToNext,
    goToPrev,
    handleMouseEnter,
    handleMouseLeave,
    togglePlayPause
  } = useCarousel({
    totalSlides: cards.length,
    autoPlay,
    autoPlayInterval: autoRotateMs,
    transitionDuration: 500,
    pauseOnHover: config.settings?.pauseOnHover ?? true,
    enableKeyboard: false, // AppFeaturesCarousel doesn't use keyboard nav
    componentName: 'AppFeaturesCarousel',
    onSlideChange: handleSlideChange,
    onNavigate,
    onPlayPause
  });

  // Shared image loading hook
  const {
    handleImageLoad
  } = useImageLoading({
    totalImages: cards.length
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

  const currentCard = cards[currentSlideIndex];

  // CTA click handler
  const handleCTAClick = useCallback((slideId: string, ctaHref: string) => {
    onCTAClick?.(slideId, ctaHref);
  }, [onCTAClick]);

  // Track the active card's left-edge position so the description
  // aligns below it on desktop. Width uses the fixed design token
  // to avoid layout shifts from measurement timing during transitions.
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [descOffset, setDescOffset] = useState<number>(0);

  useEffect(() => {
    const measure = () => {
      const grid = gridRef.current;
      const activeCard = cardRefs.current[currentSlideIndex];
      if (!grid || !activeCard) return;

      const gridRect = grid.getBoundingClientRect();
      const cardRect = activeCard.getBoundingClientRect();
      setDescOffset(cardRect.left - gridRect.left);
    };

    // Measure after the card width CSS transition completes (300ms token)
    const activeCard = cardRefs.current[currentSlideIndex];
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'width') measure();
    };

    if (activeCard) {
      activeCard.addEventListener('transitionend', onTransitionEnd);
    }

    // Fallback for initial render and prefers-reduced-motion
    const fallbackTimer = setTimeout(measure, 350);

    window.addEventListener('resize', measure);
    return () => {
      activeCard?.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallbackTimer);
      window.removeEventListener('resize', measure);
    };
  }, [currentSlideIndex]);

  if (!currentCard) return null;

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={backgroundColor}
      className={className}
      ariaLabelledBy="app-features-carousel-title"
    >
      <div className={styles.container}>

        {/* Section Title */}
        <h2 id="app-features-carousel-title" className={styles.title}>
          {config.sectionTitle || 'App Features'}
        </h2>

        {/* Cards area: relative wrapper so arrows can be absolutely positioned inside */}
        <div className={styles.cardsContainer}>
          {/* Mobile prev arrow — absolutely positioned at left edge of image area */}
          {cards.length > 1 ? (
            <button
              type="button"
              className={`${styles.mobileArrow} ${styles.mobileArrowPrev}`}
              onClick={goToPrev}
              aria-label="Previous card"
            >
              <ChevronLeft className={styles.mobileArrowIcon} />
            </button>
          ) : null}

          {/* Cards Grid with descriptions inside each card wrapper */}
          <div
            ref={gridRef}
            className={styles.cardsGrid}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                ref={(el) => { cardRefs.current[index] = el; }}
                className={`${styles.cardWrapper} ${index === currentSlideIndex ? styles.active : ''}`}
              >
                <div
                  onClick={() => goToSlide(index)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${card.content.title} feature`}
                  className={styles.cardClickArea}
                >
                  <div className={styles.card}>
                    <Image
                      src={card.assets.image}
                      alt={card.seo.imageAlt}
                      width={416}
                      height={500}
                      priority={priority && index === 0}
                      className={styles.cardImage}
                      onLoad={() => handleImageLoad(card.id)}
                      sizes="(max-width: 767px) 90vw, (max-width: 1023px) 490px, (min-width: 1024px) 416px"
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Mobile next arrow — absolutely positioned at right edge of image area */}
          {cards.length > 1 ? (
            <button
              type="button"
              className={`${styles.mobileArrow} ${styles.mobileArrowNext}`}
              onClick={goToNext}
              aria-label="Next card"
            >
              <ChevronRight className={styles.mobileArrowIcon} />
            </button>
          ) : null}
        </div>

        {/* Descriptions — CSS grid overlay: all descriptions occupy the same cell,
            tallest one sets the height. Only active is visible. Zero layout shift.
            On desktop, slides horizontally to stay below the active card. */}
        <div
          className={styles.descriptionsGrid}
          style={{ '--desc-offset': `${descOffset}px` } as React.CSSProperties}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`${styles.cardDescription} ${index === currentSlideIndex ? styles.descriptionActive : ''}`}
              aria-hidden={index !== currentSlideIndex}
            >
              <h3 className={styles.cardTitle}>
                {card.content.title}
              </h3>
              <p className={styles.description}>
                {card.content.description}
              </p>

              {card.content.ctaText && card.content.ctaHref ? (
                <div className={styles.ctaWrapper}>
                  {card.content.ctaTarget === '_blank' ? (
                    <a
                      href={card.content.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.ctaLink}
                      onClick={() => handleCTAClick(card.id, card.content.ctaHref!)}
                      tabIndex={index === currentSlideIndex ? 0 : -1}
                    >
                      {card.content.ctaText}
                      <ChevronRight className={styles.ctaIcon} />
                    </a>
                  ) : (
                    <Link
                      href={card.content.ctaHref}
                      className={styles.ctaLink}
                      onClick={() => handleCTAClick(card.id, card.content.ctaHref!)}
                      tabIndex={index === currentSlideIndex ? 0 : -1}
                    >
                      {card.content.ctaText}
                      <ChevronRight className={styles.ctaIcon} />
                    </Link>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Controls - Using shared carousel controls styles */}
        <div className={carouselControls.controls}>
          {/* Dots Navigation - Using shared CarouselDots component */}
          <CarouselDots
            totalSlides={cards.length}
            currentIndex={currentSlideIndex}
            onDotClick={goToSlide}
            disabled={isTransitioning}
            className={carouselControls.dots}
          />

          {cards.length > 1 && (
            <button
              onClick={togglePlayPause}
              className={carouselControls.playPauseButton}
              aria-label={isAutoPlaying ? 'Pause carousel' : 'Play carousel'}
            >
              {isAutoPlaying ? (
                <Pause className={carouselControls.controlIcon} />
              ) : (
                <Play className={carouselControls.controlIcon} />
              )}
            </button>
          )}
        </div>
      </div>
    </SectionContainer>
  );
}