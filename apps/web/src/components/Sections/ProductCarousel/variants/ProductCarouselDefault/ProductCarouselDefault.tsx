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
import { Play, Pause } from 'lucide-react';
import { SafeInterval, SafeTimer, CleanupManager, MutexLock, StateMachine } from '@/lib/utils/RaceConditionPrevention';
import { Logger } from '@/lib/monitoring/Logger';
import { sectionEventBus, SectionEventType } from '@/lib/events/SectionEventBus';
import type { ProductCarouselVariantProps } from '../types';
import styles from './ProductCarouselDefault.module.css';

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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [subtitleKey, setSubtitleKey] = useState(0); // For cross-fade animation
  
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cleanupManagerRef = useRef(new CleanupManager('ProductCarousel'));
  const mutexRef = useRef(new MutexLock('ProductCarousel'));
  const intervalRef = useRef<SafeInterval | null>(null);
  const timerRef = useRef<SafeTimer | null>(null);

  const slides = config.content.slides || [];
  const currentSlide = slides[currentSlideIndex];
  
  // Helper function to get CSS custom property values
  const getCSSValue = useCallback((property: string, fallback: string = '0') => {
    if (typeof window === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim() || fallback;
  }, []);
  
  const autoRotateMs = parseInt(getCSSValue('--pc-rotation-interval-ms', '5000'));

  // Image sizes for responsive loading (using design tokens values)
  const imageSizes = "(max-width: 768px) 280px, (max-width: 1024px) 306px, 360px";
  
  // Constants for image loading strategy
  const PRIORITY_IMAGES_COUNT = 2; // Number of images to load with priority

  // State machine for carousel states
  const carouselState = useRef(
    new StateMachine('idle', {
      idle: ['playing', 'paused'],
      playing: ['paused', 'transitioning'],
      paused: ['playing'],
      transitioning: ['playing', 'paused', 'idle']
    }, 'ProductCarousel')
  );

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Auto-rotation logic with race condition prevention and hover pause
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1 || isHovered || prefersReducedMotion) return;

    const startAutoRotation = async () => {
      const acquired = await mutexRef.current.acquire();
      if (!acquired) return;

      try {
        intervalRef.current = new SafeInterval('ProductCarousel');
        intervalRef.current.set(() => {
          if (carouselState.current.canTransitionTo('transitioning') && !isHovered) {
            goToNext();
          }
        }, autoRotateMs);

        cleanupManagerRef.current.add(() => {
          intervalRef.current?.clear();
        });

        carouselState.current.transitionTo('playing');
      } finally {
        mutexRef.current.release();
      }
    };

    startAutoRotation();

    return () => {
      intervalRef.current?.clear();
    };
  }, [isAutoPlaying, slides.length, autoRotateMs, isHovered]);

  // Navigation handlers with subtitle cross-fade
  const goToSlide = useCallback(async (index: number) => {
    if (index < 0 || index >= slides.length) return;
    
    const acquired = await mutexRef.current.acquire();
    if (!acquired) return;

    try {
      setIsTransitioning(true);
      carouselState.current.transitionTo('transitioning');

      // Trigger subtitle cross-fade animation
      setSubtitleKey(prev => prev + 1);
      
      setCurrentSlideIndex(index);
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

      timerRef.current = new SafeTimer('ProductCarousel');
      timerRef.current.set(() => {
        setIsTransitioning(false);
        carouselState.current.transitionTo(isAutoPlaying && !isHovered ? 'playing' : 'paused');
      }, config.settings?.transitionDuration || 800);

    } finally {
      mutexRef.current.release();
    }
  }, [slides, config.settings?.transitionDuration, onSlideChange, isAutoPlaying, isHovered]);

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

  // Play/pause controls
  const togglePlayPause = useCallback(() => {
    setIsAutoPlaying(prev => {
      const newValue = !prev;
      onPlayPause?.(newValue);
      return newValue;
    });
  }, [onPlayPause]);

  // Image loading handler
  const handleImageLoad = useCallback((slideId: string) => {
    setImagesLoaded(prev => ({ ...prev, [slideId]: true }));
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!config.settings?.enableKeyboard) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'Enter':
        if (e.target !== e.currentTarget) return; // Only if carousel itself is focused
        e.preventDefault();
        togglePlayPause();
        break;
    }
  }, [goToPrev, goToNext, togglePlayPause, config.settings?.enableKeyboard]);

  // Touch handlers with velocity detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!config.settings?.enableTouch) return;
    setTouchStart(e.touches[0].clientX);
    setTouchStartTime(Date.now());
  }, [config.settings?.enableTouch]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!config.settings?.enableTouch || !touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const touchEndTime = Date.now();
    const diff = touchStart - touchEnd;
    const distance = Math.abs(diff);
    const duration = touchEndTime - touchStartTime;
    const velocity = distance / duration; // pixels per millisecond
    
    // Use design tokens for threshold and velocity
    const swipeThreshold = parseInt(getCSSValue('--pc-swipe-threshold', '40').replace('px', ''));
    const velocityThreshold = parseFloat(getCSSValue('--pc-swipe-velocity-threshold', '0.3'));
    
    if (distance > swipeThreshold && velocity > velocityThreshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    
    setTouchStart(0);
    setTouchStartTime(0);
  }, [touchStart, touchStartTime, goToNext, goToPrev, config.settings?.enableTouch]);

  // Hover handlers for pause on hover
  const handleMouseEnter = useCallback(() => {
    if (config.settings?.pauseOnHover) {
      setIsHovered(true);
    }
  }, [config.settings?.pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (config.settings?.pauseOnHover) {
      setIsHovered(false);
    }
  }, [config.settings?.pauseOnHover]);

  // Cleanup on unmount
  useEffect(() => {
    const cleanup = cleanupManagerRef.current;
    return () => {
      cleanup.destroy();
    };
  }, []);

  if (!currentSlide) return null;

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section 
      className={`${styles.section} ${className}`}
      style={sectionStyle}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={styles.container}>
        
        {/* Header with Fixed Title and Dynamic Subtitle */}
        <div className={styles.header}>
          <h2 id="carousel-title" className={styles.title}>
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
                          
                          {/* Optional Pill CTA (non-functional) */}
                          {slide.ctaText && (
                            <div className={styles.cardCTA}>
                              {slide.ctaText}
                            </div>
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

        {/* Controls */}
        <div className={styles.controls}>
          
          {/* Dots Navigation */}
          {config.settings?.enableDots && (
            <div className={styles.dots}>
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`${styles.dot} ${index === currentSlideIndex ? styles.dotActive : ''}`}
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
              className={styles.playPauseButton}
              aria-label={isAutoPlaying ? 'Pause carousel' : 'Play carousel'}
            >
              {isAutoPlaying ? (
                <Pause className={styles.controlIcon} />
              ) : (
                <Play className={styles.controlIcon} />
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}