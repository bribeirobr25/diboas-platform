/**
 * ProductCarouselDefault Variant Component
 * 
 * Domain-Driven Design: 3-card center-focused carousel with dynamic subtitle
 * Service Agnostic Abstraction: Pure component focused on product showcase
 * Code Reusability: Can be composed into other carousel variants
 * Performance & SEO Optimization: Optimized animations and image loading
 * Error Handling & System Recovery: Comprehensive error boundary support
 * Accessibility: Full keyboard, screen reader, and reduced motion support
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause } from 'lucide-react';
import { SectionContainer } from '@/components/Sections/SectionContainer';
import { useCarousel } from '@/hooks/useCarousel';
import { useImageLoading } from '@/hooks/useImageLoading';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Logger } from '@/lib/monitoring/Logger';
import { sectionEventBus, SectionEventType } from '@/lib/events/SectionEventBus';
import type { ProductCarouselVariantProps } from '../types';
import styles from './ProductCarouselDefault.module.css';
import carouselControls from '@/styles/shared/carousel-controls.module.css';

export function ProductCarouselDefault({ 
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
}: ProductCarouselVariantProps) {
  const [subtitleKey, setSubtitleKey] = useState(0); // For cross-fade animation
  const carouselRef = useRef<HTMLDivElement>(null);

  const slides = config.content.slides || [];
  
  // Helper function to get CSS custom property values
  const getCSSValue = useCallback((property: string, fallback: string = '0') => {
    if (typeof window === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim() || fallback;
  }, []);
  
  const autoRotateMs = parseInt(getCSSValue('--pc-rotation-interval-ms', '5000'));
  const swipeThreshold = parseInt(getCSSValue('--pc-swipe-threshold', '40').replace('px', ''));
  const velocityThreshold = parseFloat(getCSSValue('--pc-swipe-velocity-threshold', '0.3'));

  // Image sizes for responsive loading (using design tokens values)
  const imageSizes = "(max-width: 768px) 280px, (max-width: 1024px) 306px, 360px";

  // Constants for image loading strategy
  const PRIORITY_IMAGES_COUNT = 2; // Number of images to load with priority

  // Custom slide change handler with subtitle animation and event bus
  const handleSlideChange = useCallback((index: number) => {
    // Trigger subtitle cross-fade animation
    setSubtitleKey(prev => prev + 1);

    // Call parent callback
    onSlideChange?.(index);

    // Log section event for analytics
    Logger.info('Product carousel slide changed', {
      section: 'ProductCarousel',
      slideIndex: index,
      slideId: slides[index]?.id,
      subtitle: slides[index]?.subtitle
    });

    // Event-Driven Architecture: Emit section event
    sectionEventBus.emit(SectionEventType.CAROUSEL_SLIDE_CHANGED, {
      sectionId: 'product-carousel',
      sectionType: 'ProductCarousel',
      slideIndex: index,
      totalSlides: slides.length,
      timestamp: Date.now(),
      metadata: {
        slideId: slides[index]?.id,
        subtitle: slides[index]?.subtitle,
        action: 'slide_change'
      }
    });

    Logger.debug('Product carousel slide change', {
      slideIndex: index,
      slideId: slides[index]?.id
    });
  }, [slides, onSlideChange]);

  // Shared carousel hook
  const {
    currentSlideIndex,
    isTransitioning,
    isAutoPlaying,
    goToSlide,
    goToNext,
    goToPrev,
    handleKeyDown,
    handleMouseEnter,
    handleMouseLeave,
    togglePlayPause
  } = useCarousel({
    totalSlides: slides.length,
    autoPlay,
    autoPlayInterval: autoRotateMs,
    transitionDuration: config.settings?.transitionDuration || 800,
    pauseOnHover: config.settings?.pauseOnHover ?? true,
    enableKeyboard: config.settings?.enableKeyboard ?? true,
    componentName: 'ProductCarousel',
    onSlideChange: handleSlideChange,
    onNavigate,
    onPlayPause
  });

  // Shared image loading hook
  const {
    handleImageLoad,
    handleImageError,
    isLoaded
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
    threshold: swipeThreshold,
    velocityThreshold: velocityThreshold,
    enabled: config.settings?.enableTouch ?? true
  });

  const currentSlide = slides[currentSlideIndex];

  if (!currentSlide) return null;

  return (
    <SectionContainer
      variant="standard"
      padding="standard"
      backgroundColor={backgroundColor}
      className={className}
      role="region"
      ariaLabel="Product carousel"
    >
      <div
        className={styles.carouselWrapper}
        aria-roledescription="carousel"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className={styles.container}>
        
        {/* Header with Fixed Title and Dynamic Subtitle */}
        <div className={styles.header}>
          <h2 id="product-carousel-title" className={styles.title}>
            {config.content?.heading || 'OneFi - One App for Everything'}
          </h2>
          
          {/* Dynamic Subtitle with Cross-fade Animation */}
          <div 
            key={subtitleKey}
            className={styles.subtitle}
            aria-live="polite"
            aria-atomic="true"
          >
            {currentSlide?.subtitle || ''}
          </div>
        </div>

        {/* 3-Card Carousel Track */}
        <div 
          ref={carouselRef}
          className={styles.carouselTrack}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'pan-y' }}
        >
          <div className={styles.carouselContainer}>
            {slides.map((slide, index) => {
              const isActive = index === currentSlideIndex;
              const isLeftSide = index === (currentSlideIndex - 1 + slides.length) % slides.length;
              const isRightSide = index === (currentSlideIndex + 1) % slides.length;
              const isVisible = isActive || isLeftSide || isRightSide;

              return (
                <div
                  key={slide.id}
                  className={`${styles.card} ${isActive ? styles.cardActive : ''} ${isLeftSide ? styles.cardLeft : ''} ${isRightSide ? styles.cardRight : ''}`}
                  style={{
                    visibility: isVisible ? 'visible' : 'hidden'
                  }}
                  role="group"
                  aria-label={`Slide ${index + 1} of ${slides.length}: ${slide.title}`}
                  aria-hidden={!isActive}
                  inert={!isActive ? true : undefined}
                  onClick={() => !isActive && goToSlide(index)}
                >
                  <div className={styles.cardContent}>
                    
                    {/* Card Image */}
                    <div className={styles.imageWrapper}>
                      <Image
                        src={slide.image}
                        alt={slide.imageAlt}
                        fill
                        priority={priority && index <= PRIORITY_IMAGES_COUNT}
                        className={styles.cardImage}
                        onLoad={() => handleImageLoad(slide.id)}
                        sizes={imageSizes}
                        decoding="async"
                        loading={index <= PRIORITY_IMAGES_COUNT ? 'eager' : 'lazy'}
                      />
                      
                      {/* Bottom Gradient Overlay for Legibility */}
                      <div className={styles.cardOverlay}>
                        <div className={styles.cardInfo}>
                          <h3 className={styles.cardTitle}>
                            {slide.title}
                          </h3>
                          
                          {/* Functional CTA Link */}
                          {slide.ctaText && slide.ctaHref && (
                            <Link
                              href={slide.ctaHref}
                              className={styles.cardCTA}
                              target={slide.ctaHref.startsWith('http') ? '_blank' : '_self'}
                              rel={slide.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                              tabIndex={isActive ? 0 : -1}
                              onClick={(e) => {
                                e.stopPropagation();
                                onCTAClick?.(slide.id, slide.ctaHref!);
                                Logger.info('Product carousel CTA clicked', {
                                  slideId: slide.id,
                                  ctaHref: slide.ctaHref
                                });
                              }}
                            >
                              {slide.ctaText}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls - Using shared carousel controls styles */}
        <div className={carouselControls.controls}>

          {/* Dots Navigation */}
          {config.settings?.enableDots && (
            <div className={carouselControls.dots}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`${carouselControls.dot} ${index === currentSlideIndex ? carouselControls.dotActive : ''}`}
                  aria-label={`Go to slide ${index + 1} of ${slides.length}`}
                  disabled={isTransitioning}
                />
              ))}
            </div>
          )}

          {/* Play/Pause Button */}
          {slides.length > 1 && config.settings?.enablePlayPause && (
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
      </div>
    </SectionContainer>
  );
}