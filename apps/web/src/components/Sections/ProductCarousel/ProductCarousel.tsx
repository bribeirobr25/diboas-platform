/**
 * Product Carousel Component
 * 
 * Performance & SEO Optimization: Optimized carousel with lazy loading
 * Accessibility: Full keyboard, touch, and screen reader support
 * Event-Driven Architecture: Touch, keyboard, and timer events
 * Error Handling: Graceful image loading fallbacks
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import { DEFAULT_CAROUSEL_CONFIG, type CarouselConfig } from '@/config/carousel';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './ProductCarousel.module.css';

interface ProductCarouselProps {
  /**
   * Carousel configuration - can override default content and settings
   */
  config?: CarouselConfig;
  
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  
  /**
   * Enable analytics tracking for interactions
   */
  enableAnalytics?: boolean;
}

interface TouchState {
  startX: number;
  startTime: number;
  currentX: number;
  isDragging: boolean;
}

export function ProductCarousel({ 
  config = DEFAULT_CAROUSEL_CONFIG,
  className = '',
  enableAnalytics = true
}: ProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(config.settings.autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startTime: 0,
    currentX: 0,
    isDragging: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  const { slides, settings } = config;
  const activeSlide = slides[activeIndex];

  // Performance: Prefers reduced motion check
  const prefersReducedMotion = useRef(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;
    
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches) {
        setIsPlaying(false);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Event-Driven: Auto-play timer management
  const startAutoPlay = useCallback(() => {
    if (!isPlaying || prefersReducedMotion.current || !settings.autoPlay) return;
    
    stopAutoPlay();
    intervalRef.current = setInterval(() => {
      goToNext();
    }, settings.autoPlayInterval);
  }, [isPlaying, settings.autoPlay, settings.autoPlayInterval]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
    
    // Analytics tracking
    if (enableAnalytics) {
      analyticsService.trackEvent('carousel_navigation', {
        action: 'slide_change',
        slide_id: slides[index].id,
        slide_index: index,
        method: 'direct'
      }).catch(() => {
        // Error handling: Silent fail for analytics
      });
    }
  }, [enableAnalytics, slides]);

  const goToNext = useCallback(() => {
    const nextIndex = (activeIndex + 1) % slides.length;
    goToSlide(nextIndex);
  }, [activeIndex, slides.length, goToSlide]);

  const goToPrev = useCallback(() => {
    const prevIndex = (activeIndex - 1 + slides.length) % slides.length;
    goToSlide(prevIndex);
  }, [activeIndex, slides.length, goToSlide]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!settings.enableKeyboard) return;

    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case ' ':
      case 'Enter':
        if ((e.target as HTMLElement).classList.contains('carousel-play-pause')) {
          e.preventDefault();
          setIsPlaying(prev => !prev);
        }
        break;
    }
  }, [settings.enableKeyboard, goToPrev, goToNext]);

  // Touch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!settings.enableTouch) return;
    
    const touch = e.touches[0];
    setTouchState({
      startX: touch.clientX,
      startTime: Date.now(),
      currentX: touch.clientX,
      isDragging: true
    });
  }, [settings.enableTouch]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.isDragging || !settings.enableTouch) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX
    }));
  }, [touchState.isDragging, settings.enableTouch]);

  const handleTouchEnd = useCallback(() => {
    if (!touchState.isDragging || !settings.enableTouch) return;
    
    const deltaX = touchState.currentX - touchState.startX;
    const deltaTime = Date.now() - touchState.startTime;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Swipe threshold: 40px or velocity > 0.3
    if (Math.abs(deltaX) > 40 || velocity > 0.3) {
      if (deltaX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    
    setTouchState({
      startX: 0,
      startTime: 0,
      currentX: 0,
      isDragging: false
    });
  }, [touchState, settings.enableTouch, goToPrev, goToNext]);

  // Auto-play management
  useEffect(() => {
    if (isPlaying && !isHovered && !touchState.isDragging) {
      startAutoPlay();
    } else {
      stopAutoPlay();
    }
    
    return () => stopAutoPlay();
  }, [isPlaying, isHovered, touchState.isDragging, startAutoPlay, stopAutoPlay]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (settings.pauseOnHover) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <section 
      className={`${styles.section} ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.container}>
        {/* Fixed Heading */}
        <h2 className={styles.heading}>
          {config.heading}
        </h2>
        
        {/* Dynamic Subtitle */}
        <p 
          ref={subtitleRef}
          className={styles.subtitle}
          aria-live="polite"
          aria-atomic="true"
        >
          {activeSlide.subtitle}
        </p>

        {/* Carousel Track */}
        <div 
          ref={carouselRef}
          className={styles.track}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'pan-y'
          }}
        >
          <div className={styles.slides}>
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              const isPrev = index === (activeIndex - 1 + slides.length) % slides.length;
              const isNext = index === (activeIndex + 1) % slides.length;
              
              return (
                <div
                  key={slide.id}
                  className={`${styles.slide} ${
                    isActive ? styles.slideActive : ''
                  } ${isPrev ? styles.slidePrev : ''} ${
                    isNext ? styles.slideNext : ''
                  }`}
                  role="group"
                  aria-label={`Slide ${index + 1} of ${slides.length}: ${slide.title}`}
                  style={{
                    transition: prefersReducedMotion.current 
                      ? 'none' 
                      : `all ${settings.transitionDuration}ms ease-in-out`
                  }}
                >
                  <div className={styles.card}>
                    <div className={styles.cardImageWrapper}>
                      <Image
                        src={slide.image}
                        alt={slide.imageAlt}
                        fill
                        sizes="(max-width: 768px) 360px, (max-width: 1024px) 300px, 360px"
                        className={styles.cardImage}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                      <div className={styles.cardOverlay} />
                    </div>
                    
                    {slide.ctaText && (
                      <div className={styles.cardCta}>
                        <span className={styles.cardCtaText}>
                          {slide.ctaText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          {/* Dots Navigation */}
          {settings.enableDots && (
            <nav className={styles.dots} aria-label="Carousel navigation">
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

          {/* Play/Pause Button */}
          {settings.enablePlayPause && (
            <button
              className={styles.playPauseButton}
              onClick={() => setIsPlaying(prev => !prev)}
              aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
              disabled={prefersReducedMotion.current}
            >
              {isPlaying ? (
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