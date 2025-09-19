/**
 * Hero Section Component
 * 
 * Performance & SEO Optimization: Optimized images with proper loading
 * Accessibility: Full keyboard navigation and screen reader support
 * Responsive Design: Mobile-first with desktop enhancements
 * Service Agnostic Abstraction: Configurable content and assets
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@diboas/ui';
import { DEFAULT_HERO_CONFIG, type HeroConfig } from '@/config/hero';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './HeroSection.module.css';

interface HeroSectionProps {
  /**
   * Hero configuration - can override default content and assets
   */
  config?: HeroConfig;
  
  /**
   * Custom CSS classes for styling
   */
  className?: string;
  
  /**
   * Enable analytics tracking for CTA interactions
   */
  enableAnalytics?: boolean;
  
  /**
   * Custom background color override
   */
  backgroundColor?: string;
}

interface HeroImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function HeroSection({ 
  config = DEFAULT_HERO_CONFIG, 
  className = '',
  enableAnalytics = true,
  backgroundColor 
}: HeroSectionProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set());

  // Performance: Track image loading completion
  useEffect(() => {
    const imageCount = 3; // background, phone, mascot
    let loadedCount = 0;
    
    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount === imageCount) {
        setImagesLoaded(true);
      }
    };

    // Set a timeout for loading state
    const timeout = setTimeout(() => {
      if (!imagesLoaded) {
        setImagesLoaded(true); // Force show content after timeout
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [imagesLoaded]);

  const handleCTAClick = async () => {
    if (enableAnalytics) {
      try {
        await analyticsService.trackEvent('hero_cta_click', {
          page: window.location.pathname,
          cta_text: config.content.ctaText,
          cta_href: config.content.ctaHref,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Error Handling: Don't let analytics failures break user experience
        console.warn('Failed to track hero CTA click:', error);
      }
    }
  };

  const handleImageError = (imageName: string) => {
    setLoadErrors(prev => new Set(prev).add(imageName));
  };

  const heroStyle = backgroundColor ? { backgroundColor } : {};

  return (
    <section 
      className={`${styles.section} ${className}`}
      style={heroStyle}
      aria-labelledby="hero-title"
    >
      <div className={styles.container}>
        
        {/* Text Content - Mobile Bottom, Desktop Left */}
        <div className={styles.textContent}>
          <h1 id="hero-title" className={styles.title}>
            {config.content.title}
          </h1>
          
          {config.content.description && (
            <p className={styles.description}>
              {config.content.description}
            </p>
          )}

          <div className={styles.ctaWrapper}>
            {config.content.ctaTarget === '_blank' ? (
              <a
                href={config.content.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCTAClick}
                className={styles.ctaLink}
                aria-label={`${config.content.ctaText} - Opens in new tab`}
              >
                <Button
                  variant="gradient"
                  size="lg"
                  className={styles.ctaButton}
                >
                  {config.content.ctaText}
                </Button>
              </a>
            ) : (
              <Link
                href={config.content.ctaHref}
                onClick={handleCTAClick}
                className={styles.ctaLink}
              >
                <Button
                  variant="gradient"
                  size="lg"
                  className={styles.ctaButton}
                >
                  {config.content.ctaText}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Visual Content - Mobile Top, Desktop Right */}
        <div className={styles.visualContent}>
          
          {/* Background Circle */}
          <div className={styles.backgroundWrapper}>
            {!loadErrors.has('background') ? (
              <HeroImage
                src={config.assets.backgroundCircle}
                alt={config.seo.imageAlt.background}
                width={420}
                height={420}
                className={styles.backgroundCircle}
                onError={() => handleImageError('background')}
              />
            ) : (
              <div className={styles.backgroundFallback} aria-hidden="true" />
            )}
          </div>

          {/* Phone Image */}
          <div className={styles.phoneWrapper}>
            {!loadErrors.has('phone') ? (
              <HeroImage
                src={config.assets.phoneImage}
                alt={config.seo.imageAlt.phone}
                width={320}
                height={480}
                priority
                className={styles.phoneImage}
                onError={() => handleImageError('phone')}
              />
            ) : (
              <div className={styles.phoneFallback} aria-hidden="true">
                <span>📱</span>
              </div>
            )}
          </div>

          {/* Mascot Image */}
          <div className={styles.mascotWrapper}>
            {!loadErrors.has('mascot') ? (
              <HeroImage
                src={config.assets.mascotImage}
                alt={config.seo.imageAlt.mascot}
                width={180}
                height={200}
                className={styles.mascotImage}
                onError={() => handleImageError('mascot')}
              />
            ) : (
              <div className={styles.mascotFallback} aria-hidden="true">
                <span>🤖</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {!imagesLoaded && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}

// Error Handling: Hero Image Component with error boundaries
function HeroImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false, 
  className = '', 
  style = {},
  onError
}: HeroImageProps & { onError?: () => void }) {
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
      style={style}
      onError={handleError}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw"
    />
  );
}