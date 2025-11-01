/**
 * HeroDefault Variant Component
 * 
 * Domain-Driven Design: Isolated variant with specific responsibilities
 * Service Agnostic Abstraction: Pure component focused on default hero layout
 * Code Reusability: Can be composed into other hero variants
 * No Hardcoded Values: Uses design tokens and configuration
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@diboas/ui';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import { DEFAULT_CTA_PROPS } from '@/config/cta';
import type { HeroVariantProps} from '../types';
import styles from './HeroDefault.module.css';

interface HeroImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export function HeroDefault({ 
  config, 
  className = '', 
  enableAnalytics = true,
  priority = true,
  onCTAClick 
}: HeroVariantProps) {
  const { recordSectionRenderTime } = usePerformanceMonitoring();
  const [imageLoadingState, setImageLoadingState] = useState({
    loaded: 0,
    total: 3, // background, phone, mascot
    errors: new Set<string>()
  });

  // Performance monitoring
  useEffect(() => {
    const renderStart = performance.now();
    
    const recordRenderTime = () => {
      const renderEnd = performance.now();
      recordSectionRenderTime('hero-default', renderEnd - renderStart);
    };

    // Record render time after component mounts
    const timeoutId = setTimeout(recordRenderTime, 0);
    
    return () => clearTimeout(timeoutId);
  }, [recordSectionRenderTime]);

  const handleImageError = useCallback((imageName: string) => {
    setImageLoadingState(prev => ({
      ...prev,
      errors: new Set(prev.errors).add(imageName)
    }));
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoadingState(prev => ({
      ...prev,
      loaded: prev.loaded + 1
    }));
  }, []);

  const handleCTAClick = useCallback(() => {
    onCTAClick?.();
  }, [onCTAClick]);

  const isImagesLoaded = imageLoadingState.loaded >= imageLoadingState.total;

  return (
    <section className={`${styles.section} ${className}`} aria-labelledby="hero-title">
      <div className={styles.container}>
        {/* Text Content */}
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
            <Button
              variant={DEFAULT_CTA_PROPS.variant}
              size={DEFAULT_CTA_PROPS.size}
              trackable={DEFAULT_CTA_PROPS.trackable}
              className={styles.ctaButton}
              onClick={handleCTAClick}
            >
              {config.content.ctaText}
            </Button>
          </div>
        </div>

        {/* Visual Content */}
        {config.visualAssets && (
          <div className={styles.visualContent}>
            {/* Background Circle */}
            <div className={styles.backgroundWrapper}>
              {!imageLoadingState.errors.has('circle') ? (
                <HeroImage
                  src={config.visualAssets.backgroundCircle}
                  alt={config.seo.imageAlt.background}
                  width={420}
                  height={420}
                  className={styles.backgroundCircle}
                  onError={() => handleImageError('circle')}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className={styles.backgroundFallback} aria-hidden="true" />
              )}
            </div>

            {/* Phone Image */}
            <div className={styles.phoneWrapper}>
              {!imageLoadingState.errors.has('phone') ? (
                <HeroImage
                  src={config.visualAssets.phoneImage}
                  alt={config.seo.imageAlt.phone || 'Mobile application interface'}
                  width={320}
                  height={480}
                  priority={priority}
                  className={styles.phoneImage}
                  onError={() => handleImageError('phone')}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className={styles.phoneFallback} aria-hidden="true">
                  <span>📱</span>
                </div>
              )}
            </div>

            {/* Mascot Image */}
            <div className={styles.mascotWrapper}>
              {!imageLoadingState.errors.has('mascot') ? (
                <HeroImage
                  src={config.visualAssets.mascotImage}
                  alt={config.seo.imageAlt.mascot || 'Brand mascot character'}
                  width={180}
                  height={200}
                  className={styles.mascotImage}
                  onError={() => handleImageError('mascot')}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className={styles.mascotFallback} aria-hidden="true">
                  <span>🤖</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Loading State */}
      {!isImagesLoaded && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingSpinner} />
        </div>
      )}
    </section>
  );
}

/**
 * Optimized Hero Image Component
 */
function HeroImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onError,
  onLoad
}: HeroImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  if (hasError) {
    return null;
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
      onLoad={handleLoad}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw"
    />
  );
}