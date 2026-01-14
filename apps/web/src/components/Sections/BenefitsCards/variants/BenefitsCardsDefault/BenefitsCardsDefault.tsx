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
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import type { BenefitsCardsVariantProps, BenefitCard } from '../../types';
import styles from './BenefitsCardsDefault.module.css';

interface BenefitCardItemProps {
  card: BenefitCard;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (cardId: string) => void;
}

/**
 * Individual Benefit Card Component
 * Note: Config values are pre-translated by the factory using useConfigTranslation
 */
function BenefitCardItem({
  card,
  priority = false,
  onLoad,
  onError
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
            alt={card.iconAlt || 'Benefit icon'}
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

      {/* Content - values are already translated */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>
          {card.title}
        </h3>
        {card.description && (
          <p className={styles.cardDescription}>
            {card.description}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * BenefitsCardsDefault Variant Component
 * Note: Config values are pre-translated by the factory using useConfigTranslation
 */
export function BenefitsCardsDefault({
  config,
  className = '',
  enableAnalytics = true,
  priority = false
}: BenefitsCardsVariantProps) {
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
        {/* Section Header - values are already translated */}
        {config.section?.title && (
          <header className={styles.header}>
            <HeadingTag id="benefits-title" className={styles.title}>
              {config.section.title}
            </HeadingTag>
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}
