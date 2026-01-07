/**
 * AppFeaturesCarouselDefault Variant Component
 * 
 * Domain-Driven Design: Isolated default app features carousel variant
 * Service Agnostic Abstraction: Pure component focused on app feature showcase
 * Code Reusability: Can be composed into other carousel variants
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Play, Pause } from 'lucide-react';
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
  enableAnalytics = true,
  priority = false,
  backgroundColor,
  autoPlay = true,
  onNavigate,
  onSlideChange,
  onCTAClick,
  onPlayPause
}: AppFeaturesCarouselVariantProps) {
  const cards = config.cards || [];
  const autoRotateMs = config.settings?.autoRotateMs || 4000;

  // Custom slide change handler with logging
  const handleSlideChange = useCallback((index: number) => {
    // Call parent callback
    onSlideChange?.(index);

    // Log section event for analytics
    Logger.info('App features carousel card changed', {
      section: 'AppFeaturesCarousel',
      slideIndex: index,
      slideId: cards[index]?.id
    });

    Logger.debug('App features carousel card change', {
      slideIndex: index,
      slideId: cards[index]?.id
    });
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

        {/* Cards Grid with Descriptions */}
        <div
          className={styles.cardsGrid}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
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
                    width={index === currentSlideIndex ? 416 : 195}
                    height={500}
                    priority={priority && index === 0}
                    className={styles.cardImage}
                    onLoad={() => handleImageLoad(card.id)}
                    sizes="(max-width: 767px) 90vw, (max-width: 1023px) 490px, (min-width: 1024px) 416px"
                  />
                </div>
              </div>

              {/* Description below each card - visible only when active */}
              {index === currentSlideIndex && (
                <div className={styles.cardDescription}>
                  <p className={styles.description}>
                    {card.content.description}
                  </p>

                  {card.content.ctaText && card.content.ctaHref && (
                    <div className={styles.ctaWrapper}>
                      {card.content.ctaTarget === '_blank' ? (
                        <a
                          href={card.content.ctaHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.ctaLink}
                          onClick={() => handleCTAClick(card.id, card.content.ctaHref!)}
                        >
                          {card.content.ctaText}
                          <ChevronRight className={styles.ctaIcon} />
                        </a>
                      ) : (
                        <Link
                          href={card.content.ctaHref}
                          className={styles.ctaLink}
                          onClick={() => handleCTAClick(card.id, card.content.ctaHref!)}
                        >
                          {card.content.ctaText}
                          <ChevronRight className={styles.ctaIcon} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
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