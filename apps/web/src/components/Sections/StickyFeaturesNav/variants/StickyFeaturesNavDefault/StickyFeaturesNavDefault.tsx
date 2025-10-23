/**
 * StickyFeaturesNavDefault Component
 *
 * Domain-Driven Design: Card-based feature showcase layout
 * Design System Compliance: Uses only design tokens
 * Performance Optimization: Optimized image loading
 * Accessibility: ARIA attributes, semantic HTML
 * Scroll Behavior: Cards stack on scroll with z-index layering
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './StickyFeaturesNavDefault.module.css';
import type { StickyFeaturesNavVariantProps } from '../types';

export function StickyFeaturesNavDefault({
  config,
  className = '',
  enableAnalytics = true,
  backgroundColor,
  onCTAClick,
}: StickyFeaturesNavVariantProps) {
  const { mainTitle, categories, analytics } = config;

  // Flatten all items from categories - memoized to prevent infinite re-renders
  const allItems = useMemo(
    () => categories.flatMap((category) =>
      category.items.map((item) => ({ ...item, categoryId: category.id }))
    ),
    [categories]
  );

  // Handle CTA click
  const handleCTAClick = useCallback(
    (categoryId: string, itemId: string, href: string) => () => {
      onCTAClick?.(categoryId, itemId, href);

      // Analytics
      if (enableAnalytics && analytics?.enabled) {
        console.log(`[Analytics] CTA clicked: ${categoryId}/${itemId}`);
      }
    },
    [onCTAClick, enableAnalytics, analytics]
  );

  return (
    <section
      className={`${styles.section} ${className}`}
      style={backgroundColor ? { backgroundColor } : undefined}
      aria-label="Feature categories"
    >
      <div className={styles.container}>
        {/* Title Container - Row 1 */}
        <div className={styles.titleContainer}>
          <h2 className={styles.mainTitle}>{mainTitle}</h2>
        </div>

        {/* Content Container - Row 2 */}
        <div className={styles.contentContainer}>
          {/* Map through all items */}
          {allItems.map((item, index) => {
            return (
              <article
                key={item.id}
                className={styles.card}
                style={{
                  // @ts-ignore - CSS custom properties
                  '--card-index': index,
                  '--card-z-index': index,
                }}
              >
                {/* Card Heading - Row 1 */}
                <h3 className={styles.cardHeading}>{item.heading}</h3>

                {/* Card Content - Row 2 (2 columns: image left, text right) */}
                <div className={styles.cardContent}>
                  {/* Left Column: Image */}
                  <div className={styles.imageCardContent}>
                    <div className={styles.imageContainer}>
                      <Image
                        src={item.image}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className={styles.image}
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Right Column: Text Content */}
                  <div className={styles.textCardContent}>
                    <p className={styles.cardDescription}>{item.description}</p>
                    <Link
                      href={item.ctaLink}
                      target={item.ctaTarget}
                      onClick={handleCTAClick(item.categoryId, item.id, item.ctaLink)}
                      className={styles.ctaLink}
                      aria-label={`${item.ctaText} about ${item.heading}`}
                    >
                      {item.ctaText} &gt;
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
