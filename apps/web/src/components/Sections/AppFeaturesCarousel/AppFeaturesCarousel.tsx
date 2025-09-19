/**
 * App Features Carousel Component
 * 
 * Performance & SEO Optimization: Optimized images with proper loading
 * Accessibility: Full keyboard navigation and screen reader support
 * Responsive Design: Mobile-first with tablet and desktop enhancements
 * Service Agnostic Abstraction: Configurable content with auto-rotation
 * Error Handling: Graceful image loading fallbacks
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { 
  DEFAULT_APP_FEATURES_CAROUSEL_CONFIG,
  type AppFeaturesCarouselConfig,
  type AppFeatureCard 
} from '@/config/app-features-carousel';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './AppFeaturesCarousel.module.css';

interface AppFeaturesCarouselProps {
  /**
   * App features carousel configuration - can override default content and cards
   */
  config?: AppFeaturesCarouselConfig;
  
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  
  /**
   * Enable analytics tracking for interactions
   */
  enableAnalytics?: boolean;
  
  /**
   * Custom section background color
   */
  backgroundColor?: string;
}

interface FeatureImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

export function AppFeaturesCarousel({ 
  config = DEFAULT_APP_FEATURES_CAROUSEL_CONFIG,
  className = '',
  enableAnalytics = true,
  backgroundColor 
}: AppFeaturesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const sectionRef = useRef<HTMLElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);

  const { cards, settings, sectionTitle } = config;
  const currentCard = cards[activeIndex];

  // Performance: Track image loading completion
  useEffect(() => {
    if (cards.length === 0) return;
    
    let loadedCount = 0;
    const totalImages = cards.length;
    
    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        setImagesLoaded(true);
      }
    };

    // Set a timeout for loading state
    const timeout = setTimeout(() => {
      setImagesLoaded(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [cards.length]);

  // Auto-rotation logic
  const startAutoRotate = useCallback(() => {
    if (settings.autoRotateMs > 0 && cards.length > 1) {
      autoRotateRef.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % cards.length);
      }, settings.autoRotateMs);
    }
  }, [settings.autoRotateMs, cards.length]);

  const stopAutoRotate = useCallback(() => {
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
      autoRotateRef.current = null;
    }
  }, []);

  // Initialize auto-rotation
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      startAutoRotate();
    }

    return stopAutoRotate;
  }, [startAutoRotate, stopAutoRotate]);

  // Handle hover pause/resume
  useEffect(() => {
    if (settings.pauseOnHover) {
      if (isHovered) {
        stopAutoRotate();
      } else {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          startAutoRotate();
        }
      }
    }
  }, [isHovered, settings.pauseOnHover, startAutoRotate, stopAutoRotate]);

  // Navigation functions
  const goToCard = async (index: number) => {
    if (index === activeIndex || index < 0 || index >= cards.length) return;
    
    // Analytics tracking
    if (enableAnalytics && settings.enableAnalytics) {
      try {
        await analyticsService.trackEvent('app_features_carousel_navigation', {
          from_card: currentCard.id,
          to_card: cards[index].id,
          navigation_type: 'manual',
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to track app features carousel navigation:', error);
      }
    }
    
    setActiveIndex(index);
    
    // Scroll mobile carousel into view
    if (window.innerWidth < 768 && cardsGridRef.current) {
      const cardElements = cardsGridRef.current.children;
      const targetCard = cardElements[index] as HTMLElement;
      if (targetCard) {
        targetCard.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  };

  // Handle CTA click analytics
  const handleCTAClick = async () => {
    if (enableAnalytics && settings.enableAnalytics) {
      try {
        await analyticsService.trackEvent('app_features_carousel_cta_click', {
          card_id: currentCard.id,
          cta_text: currentCard.content.ctaText,
          cta_href: currentCard.content.ctaHref,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to track app features carousel CTA click:', error);
      }
    }
  };

  // Handle image loading errors
  const handleImageError = (cardId: string) => {
    setLoadErrors(prev => new Set(prev).add(cardId));
  };

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!settings.enableTouch) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!settings.enableTouch) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!settings.enableTouch || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe && activeIndex < cards.length - 1) {
      goToCard(activeIndex + 1);
    }
    if (isRightSwipe && activeIndex > 0) {
      goToCard(activeIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sectionRef.current?.contains(document.activeElement)) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (activeIndex > 0) goToCard(activeIndex - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (activeIndex < cards.length - 1) goToCard(activeIndex + 1);
          break;
        case 'Home':
          event.preventDefault();
          goToCard(0);
          break;
        case 'End':
          event.preventDefault();
          goToCard(cards.length - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, cards.length]);

  // Calculate description panel offset for desktop
  const panelOffset = `calc((100% / ${cards.length}) * ${activeIndex} + (100% / ${cards.length} / 2) - 50%)`;

  if (cards.length === 0) return null;

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section 
      ref={sectionRef}
      className={`${styles.section} ${className}`}
      style={sectionStyle}
      aria-labelledby="app-features-title"
      role="region"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.container}>
        
        {/* Section Title */}
        <h2 id="app-features-title" className={styles.title}>
          {sectionTitle}
        </h2>

        {/* Cards Container */}
        <div className={styles.cardsContainer}>
          
          {/* Cards Grid */}
          <div 
            ref={cardsGridRef}
            className={styles.cardsGrid}
            role="tablist"
            aria-label="App features carousel"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`${styles.cardWrapper} ${
                  index === activeIndex ? styles.active : ''
                }`}
                role="tab"
                aria-selected={index === activeIndex}
                aria-controls={`feature-panel-${card.id}`}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => goToCard(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToCard(index);
                  }
                }}
              >
                <div className={styles.card}>
                  
                  {/* Card Image */}
                  {!loadErrors.has(card.id) ? (
                    <FeatureImage
                      src={card.assets.image}
                      alt={card.seo.imageAlt}
                      className={styles.cardImage}
                      onError={() => handleImageError(card.id)}
                    />
                  ) : (
                    <div className={styles.imageFallback} aria-hidden="true">
                      📱
                    </div>
                  )}

                  {/* Card Overlay */}
                  <div className={styles.cardOverlay} />

                  {/* Gradient Overlay for Chip */}
                  {card.content.chipLabel && (
                    <div className={styles.gradientOverlay} />
                  )}

                  {/* Chip Badge */}
                  {card.content.chipLabel && (
                    <div className={styles.chipBadge}>
                      {card.content.chipLabel}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Touch Indicators for Mobile */}
          <div className={styles.touchIndicator}>
            {cards.map((_, index) => (
              <div
                key={index}
                className={`${styles.indicatorDot} ${
                  index === activeIndex ? styles.active : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Description Panel */}
        <div 
          className={styles.descriptionPanel}
          style={{ '--panel-offset': panelOffset } as React.CSSProperties}
          id={`feature-panel-${currentCard.id}`}
          role="tabpanel"
          aria-labelledby={`feature-card-${currentCard.id}`}
        >
          <p className={styles.description}>
            {currentCard.content.description}
          </p>

          {/* CTA Link */}
          {currentCard.content.ctaTarget === '_blank' ? (
            <a
              href={currentCard.content.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCTAClick}
              className={styles.ctaLink}
              aria-label={`${currentCard.content.ctaText} - Opens in new tab`}
            >
              {currentCard.content.ctaText}
              <ChevronRight className={styles.ctaIcon} aria-hidden="true" />
            </a>
          ) : (
            <Link
              href={currentCard.content.ctaHref}
              onClick={handleCTAClick}
              className={styles.ctaLink}
            >
              {currentCard.content.ctaText}
              <ChevronRight className={styles.ctaIcon} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {/* Loading State */}
      {!imagesLoaded && (
        <div className={styles.loading} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}

// Error Handling: Feature Image Component with error boundaries
function FeatureImage({ 
  src, 
  alt, 
  className = '', 
  onError
}: FeatureImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return null; // Let parent component handle fallback
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      onError={handleError}
      sizes="(max-width: 768px) 75vw, (max-width: 1024px) 33vw, 25vw"
      style={{ objectFit: 'cover' }}
    />
  );
}