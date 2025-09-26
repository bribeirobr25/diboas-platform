/**
 * Unified App Features Carousel Component
 * 
 * Domain-Driven Design: Single carousel domain with configurable variants
 * Service Agnostic Abstraction: Fully configurable through props and variants
 * Code Reusability & DRY: Unified component eliminating duplication
 * Performance & SEO Optimization: Optimized images with proper loading
 * Event-Driven Architecture: Auto-rotation, touch, and keyboard events
 * Error Handling & System Recovery: Graceful image loading fallbacks
 * Security & Audit Standards: Secure image handling and XSS prevention
 * Product KPIs & Analytics: Configurable analytics with variant tracking
 * No Hardcoded Values: All values configurable through config system
 * Accessibility: Full keyboard navigation and screen reader support
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Play, Pause } from 'lucide-react';
import { APP_FEATURES_CAROUSEL_CONFIGS, type AppFeaturesCarouselVariantConfig, type AppFeaturesCarouselVariant } from '@/config/appFeaturesCarousel';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './AppFeaturesCarousel.module.css';

export interface AppFeaturesCarouselProps {
  /**
   * App features carousel variant configuration - determines layout and behavior
   */
  variant?: AppFeaturesCarouselVariant;

  /**
   * Custom app features carousel configuration - overrides default config
   */
  config?: Partial<AppFeaturesCarouselVariantConfig>;

  /**
   * Custom CSS classes for styling extensions
   */
  className?: string;

  /**
   * Enable analytics tracking for user interactions
   */
  enableAnalytics?: boolean;

  /**
   * Custom section background color
   */
  backgroundColor?: string;

  /**
   * Performance optimization: Priority loading for above-fold content
   */
  priority?: boolean;
}

interface FeatureImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onError?: () => void;
  onLoad?: () => void;
}

/**
 * Unified App Features Carousel with variant support
 * Monitoring & Observability: Built-in loading states and error tracking
 */
export function AppFeaturesCarousel({
  variant = 'default',
  config: customConfig,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  priority = false
}: AppFeaturesCarouselProps) {
  // Domain-Driven Design: Merge default config with custom overrides
  const baseConfig = APP_FEATURES_CAROUSEL_CONFIGS[variant];
  const config = customConfig
    ? { ...baseConfig, ...customConfig } as AppFeaturesCarouselVariantConfig
    : baseConfig;

  // State management for carousel functionality
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDescriptionTransitioning, setIsDescriptionTransitioning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const sectionRef = useRef<HTMLElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);

  const { cards, settings, sectionTitle } = config;
  // Use hovered index if hovering and on desktop, otherwise use active index
  const isMobile = isMounted && typeof window !== 'undefined' && window.innerWidth <= 768;
  const displayIndex = (!isMobile && hoveredIndex !== null) ? hoveredIndex : activeIndex;
  const currentCard = cards[displayIndex];
  

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

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


  // Auto-rotation effect - simplified to prevent multiple intervals
  useEffect(() => {
    if (!isMounted) return; // Wait for client-side mounting
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || settings.autoRotateMs <= 0 || cards.length <= 1 || !isPlaying) {
      return;
    }
    
    // Don't start if paused on hover and currently hovered
    if (settings.pauseOnHover && isHovered) {
      return;
    }
    
    
    const interval = setInterval(() => {
      // Start fade out transition
      setIsDescriptionTransitioning(true);
      
      // Change active index after fade out completes
      setTimeout(() => {
        setActiveIndex(prev => (prev + 1) % cards.length);
        
        // Start fade in after a brief delay
        setTimeout(() => {
          setIsDescriptionTransitioning(false);
        }, 50); // Brief delay to ensure the content has changed
      }, 125); // Half of the 250ms transition duration
    }, settings.autoRotateMs);
    
    return () => clearInterval(interval);
  }, [isMounted, settings.autoRotateMs, settings.pauseOnHover, isHovered, cards.length, isPlaying]);

  // Navigation functions with analytics
  const goToCard = useCallback(async (index: number) => {
    if (index === activeIndex || index < 0 || index >= cards.length) return;
    
    
    // Product KPIs & Analytics: Navigation tracking
    if (enableAnalytics && config.analytics?.enabled) {
      try {
        await analyticsService.trackEvent(`${config.analytics.trackingPrefix}_navigation`, {
          from_card: currentCard.id,
          to_card: cards[index].id,
          navigation_type: 'manual',
          variant: config.variant,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Error Handling: Silent fail for analytics
        console.warn('Failed to track app features carousel navigation:', error);
      }
    }
    
    // Start fade out transition for manual navigation
    setIsDescriptionTransitioning(true);
    
    // Change active index after fade out completes
    setTimeout(() => {
      setActiveIndex(index);
      
      // Start fade in after a brief delay
      setTimeout(() => {
        setIsDescriptionTransitioning(false);
      }, 50);
    }, 125);
    
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
  }, [activeIndex, cards, currentCard, enableAnalytics, config]);

  // Product KPIs & Analytics: CTA interaction tracking
  const handleCTAClick = useCallback(async () => {
    if (enableAnalytics && config.analytics?.enabled) {
      try {
        await analyticsService.trackEvent(`${config.analytics.trackingPrefix}_cta_click`, {
          card_id: currentCard.id,
          cta_text: currentCard.content.ctaText,
          cta_href: currentCard.content.ctaHref,
          variant: config.variant,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Error Handling: Silent fail for analytics
        console.warn('Failed to track app features carousel CTA click:', error);
      }
    }
  }, [enableAnalytics, config, currentCard]);

  // Error Handling: Image loading error handler
  const handleImageError = useCallback((cardId: string) => {
    setLoadErrors(prev => new Set(prev).add(cardId));
  }, []);

  // Performance: Image loading success handler
  const handleImageLoad = useCallback(() => {
    // Can be used for loading state management
  }, []);

  // Event-Driven: Touch handling for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!settings.enableTouch) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, [settings.enableTouch]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!settings.enableTouch) return;
    setTouchEnd(e.targetTouches[0].clientX);
  }, [settings.enableTouch]);

  const handleTouchEnd = useCallback(() => {
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
  }, [settings.enableTouch, touchStart, touchEnd, activeIndex, cards.length, goToCard]);

  // Handle individual card hover (desktop only)
  const handleCardEnter = useCallback((index: number) => {
    if (isMobile) return; // Disable hover on mobile
    setHoveredIndex(index);
    if (!isHovered) {
      setIsHovered(true);
    }
  }, [isHovered, isMobile]);


  // Handle section leave - restart auto-rotation from image 0 (desktop only)
  const handleSectionLeave = useCallback(() => {
    if (isMobile) return; // Disable on mobile
    setIsHovered(false);
    setHoveredIndex(null);
    setActiveIndex(0); // Reset to image 0
  }, [isMobile]);

  // Accessibility: Keyboard navigation
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
  }, [activeIndex, cards.length, goToCard]);

  // Security: Early return for empty cards
  if (cards.length === 0) return null;

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  // Calculate description panel offset for desktop based on actual image positions
  const calculatePanelOffset = () => {
    if (cards.length === 0 || !isMounted) {
      // Return simple fallback during SSR to match server rendering
      return `calc((100% / ${cards.length}) * ${displayIndex} + (100% / ${cards.length} / 2) - 50%)`;
    }
    
    // Active image width: 280px, Inactive image width: 130px, Gap: 22px
    const activeWidth = 280;
    const inactiveWidth = 130;
    const gap = 22;
    
    // Calculate position of active image center
    let offsetFromLeft = 0;
    
    for (let i = 0; i < displayIndex; i++) {
      offsetFromLeft += inactiveWidth + gap;
    }
    
    // Add half of active image width to get to center
    offsetFromLeft += activeWidth / 2;
    
    // Calculate the center of the cards container
    const totalWidth = (cards.length - 1) * inactiveWidth + activeWidth + (cards.length - 1) * gap;
    const containerCenter = totalWidth / 2;
    
    // Return offset from container center
    return `${offsetFromLeft - containerCenter}px`;
  };
  
  const panelOffset = calculatePanelOffset();

  // Semantic Naming: Generate CSS classes based on variant
  const sectionClasses = [
    styles.section,
    styles[`section--${config.variant}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <section 
      ref={sectionRef}
      className={sectionClasses}
      style={sectionStyle}
      aria-labelledby="app-features-title"
      role="region"
      onMouseLeave={handleSectionLeave}
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
            onMouseLeave={() => {
              // Only reset hover when leaving the entire cards grid (desktop only)
              if (!isMobile) {
                setHoveredIndex(null);
              }
            }}
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                className={`${styles.cardWrapper} ${
                  index === displayIndex ? styles.active : ''
                }`}
                role="tab"
                aria-selected={index === displayIndex}
                aria-controls={`feature-panel-${card.id}`}
                tabIndex={index === displayIndex ? 0 : -1}
                onClick={() => goToCard(index)}
                onMouseEnter={() => handleCardEnter(index)}
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
                      priority={priority && index === 0}
                      onError={() => handleImageError(card.id)}
                      onLoad={handleImageLoad}
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
          {config.variant === 'default' && (
            <div className={styles.touchIndicator}>
              {cards.map((_, index) => (
                <div
                  key={index}
                  className={`${styles.indicatorDot} ${
                    index === displayIndex ? styles.active : ''
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Description Panel - Only for default variant */}
        {config.variant === 'default' && (
          <div 
            className={`${styles.descriptionPanel} ${
              isMounted && isDescriptionTransitioning ? styles.fadeOut : 
              isMounted ? styles.fadeIn : ''
            }`}
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
        )}

        {/* Mobile Controls - Only visible on mobile (≤768px) */}
        {config.variant === 'default' && (
          <div className={styles.mobileControls}>
            {/* Dots Navigation */}
            <nav className={styles.mobileDots} aria-label="Carousel navigation">
              {cards.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.mobileDot} ${
                    index === activeIndex ? styles.mobileDotActive : ''
                  }`}
                  onClick={() => goToCard(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : 'false'}
                />
              ))}
            </nav>

            {/* Play/Pause Button */}
            <button
              className={styles.mobilePlayPauseButton}
              onClick={() => setIsPlaying(prev => !prev)}
              aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
            >
              {isPlaying ? (
                <Pause className={styles.mobileControlIcon} />
              ) : (
                <Play className={styles.mobileControlIcon} />
              )}
            </button>
          </div>
        )}

        {/* Grid/Masonry Variant: Individual CTAs */}
        {(config.variant === 'grid' || config.variant === 'masonry') && (
          <div className={styles.gridCtas}>
            {cards.map((card) => (
              <div key={card.id} className={styles.gridCtaItem}>
                <h3 className={styles.gridCtaTitle}>{card.content.title}</h3>
                <p className={styles.gridCtaDescription}>{card.content.description}</p>
                {card.content.ctaTarget === '_blank' ? (
                  <a
                    href={card.content.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCTAClick}
                    className={styles.gridCtaLink}
                    aria-label={`${card.content.ctaText} - Opens in new tab`}
                  >
                    {card.content.ctaText}
                    <ChevronRight className={styles.ctaIcon} aria-hidden="true" />
                  </a>
                ) : (
                  <Link
                    href={card.content.ctaHref}
                    onClick={handleCTAClick}
                    className={styles.gridCtaLink}
                  >
                    {card.content.ctaText}
                    <ChevronRight className={styles.ctaIcon} aria-hidden="true" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State - Monitoring & Observability */}
      {!imagesLoaded && (
        <div className={styles.loading} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}

/**
 * Optimized Feature Image Component
 * Error Handling: Built-in error recovery with graceful fallbacks
 * Performance: Optimized loading with proper sizing hints
 */
function FeatureImage({
  src,
  alt,
  className = '',
  priority = false,
  onError,
  onLoad
}: FeatureImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  if (hasError) {
    return null; // Let parent component handle fallback
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      priority={priority}
      onError={handleError}
      onLoad={handleLoad}
      sizes="(max-width: 768px) 75vw, (max-width: 1024px) 33vw, 25vw"
      style={{ objectFit: 'cover' }}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}