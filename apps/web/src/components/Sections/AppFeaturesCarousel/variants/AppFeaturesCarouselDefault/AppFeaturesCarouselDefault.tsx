/**
 * AppFeaturesCarouselDefault Variant Component
 * 
 * Domain-Driven Design: Isolated default app features carousel variant
 * Service Agnostic Abstraction: Pure component focused on app feature showcase
 * Code Reusability: Can be composed into other carousel variants
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Play, Pause } from 'lucide-react';
import { SafeInterval, SafeTimer, CleanupManager, MutexLock, StateMachine } from '@/lib/utils/RaceConditionPrevention';
import { Logger } from '@/lib/monitoring/Logger';
import type { AppFeaturesCarouselVariantProps } from '../types';
import styles from './AppFeaturesCarouselDefault.module.css';

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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [touchStart, setTouchStart] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupManagerRef = useRef(new CleanupManager('AppFeaturesCarousel'));
  const mutexRef = useRef(new MutexLock('AppFeaturesCarousel'));
  const intervalRef = useRef<SafeInterval | null>(null);
  const timerRef = useRef<SafeTimer | null>(null);

  const cards = config.cards || [];
  const currentCard = cards[currentSlideIndex];
  const autoRotateMs = config.settings?.autoRotateMs || 4000;

  // State machine for carousel states
  const carouselState = useRef(
    new StateMachine('idle', {
      idle: ['playing', 'paused'],
      playing: ['paused', 'transitionToing'],
      paused: ['playing'],
      transitionToing: ['playing', 'paused', 'idle']
    }, 'AppFeaturesCarousel')
  );

  // Auto-rotation logic with race condition prevention
  useEffect(() => {
    if (!isAutoPlaying || cards.length <= 1) return;

    const startAutoRotation = async () => {
      const acquired = await mutexRef.current.acquire();
      if (!acquired) return;

      try {
        intervalRef.current = new SafeInterval('AppFeaturesCarousel');
        intervalRef.current.set(() => {
          if (carouselState.current.canTransitionTo('transitionToing')) {
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
  }, [isAutoPlaying, cards.length, autoRotateMs, carouselState]);

  // Navigation handlers
  const goToSlide = useCallback(async (index: number) => {
    if (index < 0 || index >= cards.length) return;
    
    const acquired = await mutexRef.current.acquire();
    if (!acquired) return;

    try {
      setIsTransitioning(true);
      carouselState.current.transitionTo('transitionToing');

      setCurrentSlideIndex(index);
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

      timerRef.current = new SafeTimer('AppFeaturesCarousel');
      timerRef.current.set(() => {
        setIsTransitioning(false);
        carouselState.current.transitionTo(isAutoPlaying ? 'playing' : 'paused');
      }, 500);

    } finally {
      mutexRef.current.release();
    }
  }, [cards, onSlideChange, isAutoPlaying]);

  const goToNext = useCallback(() => {
    const nextIndex = (currentSlideIndex + 1) % cards.length;
    goToSlide(nextIndex);
    onNavigate?.('next');
  }, [currentSlideIndex, cards.length, goToSlide, onNavigate]);

  const goToPrev = useCallback(() => {
    const prevIndex = currentSlideIndex === 0 ? cards.length - 1 : currentSlideIndex - 1;
    goToSlide(prevIndex);
    onNavigate?.('prev');
  }, [currentSlideIndex, cards.length, goToSlide, onNavigate]);

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

  // Hover pause functionality - Documentation requirement
  const [wasAutoPlayingBeforeHover, setWasAutoPlayingBeforeHover] = useState(false);
  const pauseOnHover = config.settings?.pauseOnHover ?? true;
  
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover && isAutoPlaying) {
      setWasAutoPlayingBeforeHover(true);
      setIsAutoPlaying(false);
    }
  }, [pauseOnHover, isAutoPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover && wasAutoPlayingBeforeHover) {
      setIsAutoPlaying(true);
      setWasAutoPlayingBeforeHover(false);
    }
  }, [pauseOnHover, wasAutoPlayingBeforeHover]);

  // Dynamic description panel alignment calculation
  const [panelOffset, setPanelOffset] = useState(0);
  
  const calculatePanelOffset = useCallback(() => {
    // Only apply dynamic positioning on desktop (≥1024px)
    if (typeof window === 'undefined' || window.innerWidth < 1024) {
      setPanelOffset(0);
      return;
    }
    
    // Calculate offset based on active card position in 4-column grid
    const containerWidth = 1200; // Max container width
    const cardWidth = containerWidth / 4; // Each card takes 1/4 of container
    const gap = 32; // Desktop gap between cards
    
    // Calculate position of active card center
    const cardCenterOffset = (currentSlideIndex * (cardWidth + gap)) + (cardWidth / 2);
    
    // Center the description panel under the active card
    const containerCenter = containerWidth / 2;
    const offset = cardCenterOffset - containerCenter;
    
    setPanelOffset(offset);
  }, [currentSlideIndex]);
  
  // Update panel position when active slide changes
  useEffect(() => {
    calculatePanelOffset();
    
    // Recalculate on window resize
    const handleResize = () => calculatePanelOffset();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [calculatePanelOffset]);

  // CTA click handler
  const handleCTAClick = useCallback((slideId: string, ctaHref: string) => {
    onCTAClick?.(slideId, ctaHref);
  }, [onCTAClick]);

  // Cleanup on unmount
  useEffect(() => {
    const cleanup = cleanupManagerRef.current;
    return () => {
      cleanup.destroy();
    };
  }, []);

  if (!currentCard) return null;

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section 
      className={`${styles.section} ${className}`}
      style={sectionStyle}
      aria-labelledby="carousel-title"
    >
      <div className={styles.container}>
        
        {/* Section Title */}
        <h2 id="carousel-title" className={styles.title}>
          {config.sectionTitle || 'App Features'}
        </h2>

        {/* Cards Grid */}
        <div 
          className={styles.cardsGrid}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`${styles.cardWrapper} ${index === currentSlideIndex ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              tabIndex={0}
              role="button"
              aria-label={`View ${card.content.title} feature`}
            >
              <div className={styles.card}>
                <Image
                  src={card.assets.image}
                  alt={card.seo.imageAlt}
                  width={280}
                  height={500}
                  priority={priority && index === 0}
                  className={styles.cardImage}
                  onLoad={() => handleImageLoad(card.id)}
                  sizes="(max-width: 768px) 80vw, (max-width: 1024px) 45vw, 280px"
                />
                
                <div className={styles.cardOverlay} />
                
                <div className={styles.chipBadge}>
                  {card.content.title}
                </div>
                
                <div className={styles.gradientOverlay} />
              </div>
            </div>
          ))}
        </div>

        {/* Description Panel */}
        <div 
          className={styles.descriptionPanel}
          style={{ transform: `translateX(${panelOffset}px)` }}
        >
          <h3 className={styles.description}>
            {currentCard.content.description}
          </h3>
          
          {currentCard.content.ctaText && currentCard.content.ctaHref && (
            <div className={styles.ctaWrapper}>
              {currentCard.content.ctaTarget === '_blank' ? (
                <a
                  href={currentCard.content.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ctaLink}
                  onClick={() => handleCTAClick(currentCard.id, currentCard.content.ctaHref)}
                >
                  {currentCard.content.ctaText}
                  <ChevronRight className={styles.ctaIcon} />
                </a>
              ) : (
                <Link
                  href={currentCard.content.ctaHref}
                  className={styles.ctaLink}
                  onClick={() => handleCTAClick(currentCard.id, currentCard.content.ctaHref)}
                >
                  {currentCard.content.ctaText}
                  <ChevronRight className={styles.ctaIcon} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className={styles.mobileControls}>
          <div className={styles.mobileDots}>
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`${styles.mobileDot} ${index === currentSlideIndex ? styles.mobileDotActive : ''}`}
                aria-label={`Go to card ${index + 1}`}
                disabled={isTransitioning}
              />
            ))}
          </div>

          {cards.length > 1 && (
            <button
              onClick={togglePlayPause}
              className={styles.mobilePlayPauseButton}
              aria-label={isAutoPlaying ? 'Pause carousel' : 'Play carousel'}
            >
              {isAutoPlaying ? (
                <Pause className={styles.mobileControlIcon} />
              ) : (
                <Play className={styles.mobileControlIcon} />
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}