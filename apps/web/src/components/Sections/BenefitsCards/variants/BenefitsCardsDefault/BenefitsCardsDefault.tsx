/**
 * BenefitsCardsDefault Variant Component
 *
 * Domain-Driven Design: Benefits display domain with minimalist card layout
 * Service Agnostic Abstraction: Pure presentation component for benefit cards
 * Code Reusability: Uses shared design tokens and patterns
 * Performance: Optimized image loading with Next/Image AVIF format
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useTranslation } from '@diboas/i18n/client';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import type { BenefitsCardsVariantProps, BenefitCard } from '../../types';
import styles from './BenefitsCardsDefault.module.css';

interface BenefitCardItemProps {
  card: BenefitCard;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (cardId: string) => void;
  intl: ReturnType<typeof useTranslation>;
}

/**
 * Individual Benefit Card Component
 */
function BenefitCardItem({
  card,
  priority = false,
  onLoad,
  onError,
  intl
}: BenefitCardItemProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
    onError?.(card.id);
  }, [card.id, onError]);

  const handleImageLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  return (
    <article className={styles.card}>
      {/* Icon */}
      <div className={styles.iconWrapper}>
        {!imageError ? (
          <Image
            src={card.icon}
            alt={intl.formatMessage({ id: card.iconAlt })}
            width={64}
            height={64}
            priority={priority}
            className={styles.icon}
            onError={handleImageError}
            onLoad={handleImageLoad}
            sizes="(max-width: 768px) 48px, (max-width: 1024px) 56px, 64px"
          />
        ) : (
          <div className={styles.iconFallback} aria-hidden="true">
            <span>💡</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>
          {intl.formatMessage({ id: card.title })}
        </h3>
        <p className={styles.cardDescription}>
          {intl.formatMessage({ id: card.description })}
        </p>
      </div>
    </article>
  );
}

/**
 * BenefitsCardsDefault Variant Component
 */
export function BenefitsCardsDefault({
  config,
  className = '',
  enableAnalytics = true,
  priority = false
}: BenefitsCardsVariantProps) {
  const intl = useTranslation();
  const { recordSectionRenderTime } = usePerformanceMonitoring();
  const [imageLoadingState, setImageLoadingState] = useState({
    loaded: 0,
    total: config.cards.length,
    errors: new Set<string>()
  });

  // Performance monitoring
  useEffect(() => {
    if (!enableAnalytics) return;

    const renderStart = performance.now();

    const recordRenderTime = () => {
      const renderEnd = performance.now();
      recordSectionRenderTime('benefits-cards-default', renderEnd - renderStart);
    };

    // Record render time after component mounts
    const timeoutId = setTimeout(recordRenderTime, 0);

    return () => clearTimeout(timeoutId);
  }, [recordSectionRenderTime, enableAnalytics]);

  // Image loading handlers
  const handleImageError = useCallback((cardId: string) => {
    setImageLoadingState(prev => ({
      ...prev,
      errors: new Set(prev.errors).add(cardId)
    }));
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoadingState(prev => ({
      ...prev,
      loaded: prev.loaded + 1
    }));
  }, []);

  // Determine heading level
  const HeadingTag = config.seo?.headingLevel || 'h2';

  // Determine section background color
  const backgroundColor = config.section?.backgroundColor || 'light-purple';
  const backgroundClass = `${styles.section} ${styles[`section-${backgroundColor}`] || ''}`;

  return (
    <section
      className={`${backgroundClass} ${className}`}
      aria-labelledby={config.section?.title ? 'benefits-title' : undefined}
      aria-label={config.seo?.ariaLabel || 'Benefits section'}
    >
      <div className={styles.container}>
        {/* Section Header */}
        {config.section?.title && (
          <header className={styles.header}>
            <HeadingTag id="benefits-title" className={styles.title}>
              {intl.formatMessage({ id: config.section.title })}
            </HeadingTag>
            {config.section.description && (
              <p className={styles.description}>
                {intl.formatMessage({ id: config.section.description })}
              </p>
            )}
          </header>
        )}

        {/* Cards Grid */}
        <div className={styles.cardsGrid}>
          {config.cards.map((card, index) => (
            <BenefitCardItem
              key={card.id}
              card={card}
              priority={priority && index < 3} // Prioritize first 3 cards (top row on desktop)
              onLoad={handleImageLoad}
              onError={handleImageError}
              intl={intl}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
