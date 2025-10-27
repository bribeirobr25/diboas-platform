'use client';

/**
 * BgHighlightDefault Variant Component
 *
 * Domain-Driven Design: Background highlight presentation domain
 * Service Agnostic Abstraction: Pure presentation component
 * Performance Optimization: Next.js Image optimization, performance monitoring
 * SEO Optimization: Semantic HTML, proper heading hierarchy
 * Error Handling: Image loading error recovery
 * Accessibility: ARIA attributes, semantic HTML
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { BgHighlightVariantProps } from '../../types';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import styles from './BgHighlightDefault.module.css';

/**
 * BgHighlightDefault Variant
 *
 * Full-width background image section with title and description positioned at bottom-left.
 *
 * Features:
 * - Next.js Image optimization with AVIF format
 * - Performance monitoring with render time tracking
 * - Accessibility with semantic HTML and ARIA attributes
 * - SEO optimization with configurable heading levels
 * - Image loading state management with error recovery
 * - Responsive design with mobile-first approach
 *
 * @param config - Section configuration
 * @param className - Additional CSS class names
 * @param enableAnalytics - Enable analytics tracking
 * @param priority - Priority loading for LCP optimization
 */
export function BgHighlightDefault({
  config,
  className = '',
  enableAnalytics = true,
  priority = false
}: BgHighlightVariantProps) {
  // Performance monitoring
  const { recordSectionRenderTime } = usePerformanceMonitoring();

  // Image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Record render time on mount
  useEffect(() => {
    const sectionId = config.analytics?.sectionId || 'bg-highlight-default';
    recordSectionRenderTime(sectionId);
  }, [config.analytics?.sectionId, recordSectionRenderTime]);

  // Destructure config
  const { backgroundImage, content, seo } = config;
  const HeadingTag = seo.headingLevel || 'h2';

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
    console.error('BgHighlight: Failed to load background image', backgroundImage.src);
  };

  return (
    <section
      className={`${styles.section} ${className}`}
      aria-label={seo.ariaLabel || 'Background highlight section'}
      data-section-id={config.analytics?.sectionId}
      data-analytics-category={config.analytics?.category}
    >
      {/* Background Image Layer */}
      <div className={styles.backgroundLayer}>
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          fill
          priority={priority}
          quality={90}
          className={styles.backgroundImage}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes="100vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        {/* Gradient overlay for text readability */}
        <div className={styles.overlay} />
      </div>

      {/* Content Layer */}
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          {/* Title */}
          <HeadingTag className={styles.title}>
            {content.title}
          </HeadingTag>

          {/* Description */}
          <p className={styles.description}>
            {content.description}
          </p>
        </div>
      </div>

      {/* Loading state indicator (optional, for debugging) */}
      {!imageLoaded && !imageError && (
        <div className={styles.loadingIndicator} aria-hidden="true" />
      )}

      {/* Error state indicator (optional, for debugging) */}
      {imageError && (
        <div className={styles.errorIndicator} aria-hidden="true">
          <span>Image failed to load</span>
        </div>
      )}
    </section>
  );
}
