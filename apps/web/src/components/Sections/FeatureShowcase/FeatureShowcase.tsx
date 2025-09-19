/**
 * Feature Showcase Component
 * 
 * Performance & SEO Optimization: Optimized images with proper loading
 * Accessibility: Full keyboard navigation and screen reader support
 * Responsive Design: Mobile-first with desktop enhancements
 * Service Agnostic Abstraction: Configurable content and manual-only navigation
 * Error Handling: Graceful image loading fallbacks
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  DEFAULT_FEATURE_SHOWCASE_CONFIG,
  type FeatureShowcaseConfig,
  type FeatureShowcaseSlide 
} from '@/config/feature-showcase';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './FeatureShowcase.module.css';

interface FeatureShowcaseProps {
  /**
   * Feature showcase configuration - can override default content and slides
   */
  config?: FeatureShowcaseConfig;
  
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
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  onError?: () => void;
}

export function FeatureShowcase({ 
  config = DEFAULT_FEATURE_SHOWCASE_CONFIG,
  className = '',
  enableAnalytics = true,
  backgroundColor 
}: FeatureShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const { slides, settings } = config;
  const currentSlide = slides[activeIndex];

  // Performance: Track image loading completion
  useEffect(() => {
    if (slides.length === 0) return;
    
    let loadedCount = 0;
    const totalImages = slides.length * 2; // 2 images per slide
    
    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount >= Math.min(totalImages, 4)) { // Load first 2 slides
        setImagesLoaded(true);
      }
    };

    // Set a timeout for loading state
    const timeout = setTimeout(() => {
      setImagesLoaded(true);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [slides.length]);

  // Navigation functions - Manual only (no auto-rotation)
  const goToSlide = async (index: number) => {
    if (index === activeIndex || isTransitioning || slides.length <= 1) return;
    
    setIsTransitioning(true);
    
    // Analytics tracking
    if (enableAnalytics && settings.enableAnalytics) {
      try {
        await analyticsService.trackEvent('feature_showcase_navigation', {
          from_slide: currentSlide.id,
          to_slide: slides[index].id,
          navigation_type: 'manual',
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to track feature showcase navigation:', error);
      }
    }
    
    setActiveIndex(index);
    
    // Reset transition state
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  const goToPrevious = () => {
    const newIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
    goToSlide(newIndex);
  };

  // Handle CTA click analytics
  const handleCTAClick = async () => {
    if (enableAnalytics && settings.enableAnalytics) {
      try {
        await analyticsService.trackEvent('feature_showcase_cta_click', {
          slide_id: currentSlide.id,
          cta_text: currentSlide.content.ctaText,
          cta_href: currentSlide.content.ctaHref,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to track feature showcase CTA click:', error);
      }
    }
  };

  // Handle image loading errors
  const handleImageError = (imageName: string) => {
    setLoadErrors(prev => new Set(prev).add(imageName));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sectionRef.current?.contains(document.activeElement)) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, slides.length]);

  if (slides.length === 0) return null;

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section 
      ref={sectionRef}
      className={`${styles.section} ${className}`}
      style={sectionStyle}
      aria-labelledby="feature-showcase-title"
      role="region"
    >
      <div className={styles.container}>
        
        {/* Text Content Column */}
        <div className={styles.textContent}>
          <h2 
            id="feature-showcase-title"
            className={`${styles.title} ${
              isTransitioning ? styles.contentExiting : styles.contentEntered
            }`}
          >
            {currentSlide.content.title}
          </h2>
          
          <p 
            className={`${styles.description} ${
              isTransitioning ? styles.contentExiting : styles.contentEntered
            }`}
          >
            {currentSlide.content.description}
          </p>

          <div className={styles.ctaSection}>
            {/* CTA Button */}
            <div 
              className={`${styles.ctaLink} ${
                isTransitioning ? styles.contentExiting : styles.contentEntered
              }`}
            >
              {currentSlide.content.ctaTarget === '_blank' ? (
                <a
                  href={currentSlide.content.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCTAClick}
                  aria-label={`${currentSlide.content.ctaText} - Opens in new tab`}
                >
                  <button className={styles.ctaButton}>
                    {currentSlide.content.ctaText}
                  </button>
                </a>
              ) : (
                <Link
                  href={currentSlide.content.ctaHref}
                  onClick={handleCTAClick}
                >
                  <button className={styles.ctaButton}>
                    {currentSlide.content.ctaText}
                  </button>
                </Link>
              )}
            </div>

            {/* Navigation Controls */}
            {settings.showNavigation && slides.length > 1 && (
              <div className={styles.navigationControls} role="group" aria-label="Feature showcase navigation">
                <button
                  onClick={goToPrevious}
                  className={styles.navButton}
                  aria-label="Previous feature"
                  type="button"
                >
                  <ChevronLeft className={styles.navIcon} aria-hidden="true" />
                </button>
                
                <button
                  onClick={goToNext}
                  className={styles.navButton}
                  aria-label="Next feature"
                  type="button"
                >
                  <ChevronRight className={styles.navIcon} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visual Content Column */}
        <div className={styles.visualContent}>
          <div className={styles.lightPanel}>
            
            {/* Images Container */}
            <div 
              className={`${styles.imagesContainer} ${
                isTransitioning ? styles.imagesExiting : styles.imagesEntered
              }`}
            >
              
              {/* Secondary Image (Background) */}
              <div className={styles.secondaryImageWrapper}>
                {!loadErrors.has(`${currentSlide.id}-secondary`) ? (
                  <FeatureImage
                    src={currentSlide.assets.secondaryImage}
                    alt={currentSlide.seo.imageAlt.secondary}
                    width={280}
                    height={360}
                    className={styles.secondaryImage}
                    onError={() => handleImageError(`${currentSlide.id}-secondary`)}
                  />
                ) : (
                  <div className={styles.imageFallback} aria-hidden="true">
                    <span>📱</span>
                  </div>
                )}
              </div>

              {/* Primary Image (Foreground) */}
              <div className={styles.primaryImageWrapper}>
                {!loadErrors.has(`${currentSlide.id}-primary`) ? (
                  <FeatureImage
                    src={currentSlide.assets.primaryImage}
                    alt={currentSlide.seo.imageAlt.primary}
                    width={280}
                    height={360}
                    priority={activeIndex === 0}
                    className={styles.primaryImage}
                    onError={() => handleImageError(`${currentSlide.id}-primary`)}
                  />
                ) : (
                  <div className={styles.imageFallback} aria-hidden="true">
                    <span>📱</span>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State */}
            {!imagesLoaded && (
              <div className={styles.loadingOverlay} aria-hidden="true">
                <div className={styles.loadingSpinner} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// Error Handling: Feature Image Component with error boundaries
function FeatureImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false, 
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
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={handleError}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
    />
  );
}