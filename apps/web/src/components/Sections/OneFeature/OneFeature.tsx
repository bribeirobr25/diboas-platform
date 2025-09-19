/**
 * One Feature Section Component
 * 
 * Performance & SEO Optimization: Optimized images with proper loading
 * Accessibility: Full keyboard navigation and screen reader support
 * Responsive Design: Mobile-first with tablet and desktop enhancements
 * Service Agnostic Abstraction: Configurable content for different pages
 * Error Handling: Graceful illustration loading fallbacks
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { 
  DEFAULT_ONE_FEATURE_CONFIG,
  type OneFeatureConfig,
  type OneFeatureLink 
} from '@/config/one-feature';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import styles from './OneFeature.module.css';

interface OneFeatureProps {
  /**
   * One feature configuration - can override default content and links
   */
  config?: OneFeatureConfig;
  
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

export function OneFeature({ 
  config = DEFAULT_ONE_FEATURE_CONFIG,
  className = '',
  enableAnalytics = true,
  backgroundColor 
}: OneFeatureProps) {
  const [illustrationError, setIllustrationError] = useState(false);

  const { content, links, assets, seo, settings } = config;

  // Handle link click analytics
  const handleLinkClick = async (link: OneFeatureLink) => {
    if (enableAnalytics && settings.enableAnalytics) {
      try {
        await analyticsService.trackEvent('one_feature_link_click', {
          link_id: link.id,
          link_label: link.label,
          link_href: link.href,
          is_external: link.external || false,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to track one feature link click:', error);
      }
    }
  };

  // Handle CTA click analytics
  const handleCTAClick = async () => {
    if (enableAnalytics && settings.enableAnalytics) {
      try {
        await analyticsService.trackEvent('one_feature_cta_click', {
          cta_text: content.ctaText,
          cta_href: content.ctaHref,
          page: window.location.pathname,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.warn('Failed to track one feature CTA click:', error);
      }
    }
  };

  // Handle illustration loading
  const handleIllustrationError = () => {
    setIllustrationError(true);
  };

  const sectionStyle = backgroundColor ? { backgroundColor } : {};

  // Render link card
  const renderLinkCard = (link: OneFeatureLink) => {
    const linkContent = (
      <>
        <span className={styles.linkLabel}>{link.label}</span>
        <div className={styles.chevronButton}>
          <ChevronRight className={styles.chevronIcon} aria-hidden="true" />
        </div>
      </>
    );

    if (link.external || link.target === '_blank') {
      return (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkCard}
          onClick={() => handleLinkClick(link)}
          aria-label={`${link.label} - Opens in new tab`}
        >
          {linkContent}
        </a>
      );
    }

    return (
      <Link
        key={link.id}
        href={link.href}
        className={styles.linkCard}
        onClick={() => handleLinkClick(link)}
      >
        {linkContent}
      </Link>
    );
  };


  return (
    <section 
      className={`${styles.section} ${className}`}
      style={sectionStyle}
      aria-labelledby="one-feature-heading"
    >
      <div className={styles.container}>
        <div className={styles.panel}>
          
          {/* Top Illustration */}
          <div className={styles.illustrationWrapper}>
            {!illustrationError ? (
              <FeatureImage
                src={assets.illustration}
                alt={seo.illustrationAlt}
                className={styles.illustration}
                onError={handleIllustrationError}
              />
            ) : (
              <div className={styles.illustrationFallback} aria-hidden="true">
                🛡️
              </div>
            )}
          </div>

          {/* Heading */}
          <h2 id="one-feature-heading" className={styles.heading}>
            {content.heading}
          </h2>

          {/* Subheading */}
          <p className={styles.subheading}>
            {content.subheading}
          </p>

          {/* Links Grid */}
          <div className={styles.linksContainer}>
            <nav 
              className={styles.linksGrid}
              aria-label="Feature links"
              role="navigation"
            >
              {links.map(renderLinkCard)}
            </nav>
          </div>

          {/* Primary CTA */}
          <div className={styles.ctaWrapper}>
            {content.ctaTarget === '_blank' ? (
              <a
                href={content.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCTAClick}
                className={styles.ctaLink}
                aria-label={`${content.ctaText} - Opens in new tab`}
              >
                <button className={styles.ctaButton}>
                  {content.ctaText}
                </button>
              </a>
            ) : (
              <Link
                href={content.ctaHref}
                onClick={handleCTAClick}
                className={styles.ctaLink}
              >
                <button className={styles.ctaButton}>
                  {content.ctaText}
                </button>
              </Link>
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
      width={120}
      height={120}
      className={className}
      onError={handleError}
      priority
      sizes="(max-width: 768px) 80px, (max-width: 1024px) 100px, 120px"
    />
  );
}