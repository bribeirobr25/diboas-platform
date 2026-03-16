/**
 * BenefitsCardsDefault Variant Component
 *
 * Domain-Driven Design: Benefits display domain with minimalist card layout
 * Service Agnostic Abstraction: Pure presentation component for benefit cards
 * Code Reusability: Uses shared design tokens and patterns
 * Performance: Optimized with Lucide SVG icons
 */

'use client';

import { useCallback, useEffect } from 'react';
import {
  TrendingUp,
  Send,
  LineChart,
  Target,
  CheckCircle2,
  XCircle,
  type LucideIconType as LucideIcon
} from '@/components/UI/LucideIcon';
import { usePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import type { BenefitsCardsVariantProps, BenefitCard } from '../../types';
import styles from './BenefitsCardsDefault.module.css';

/**
 * Icon mapping for feature cards
 * Maps icon identifiers to Lucide icon components
 */
const ICON_MAP: Record<string, LucideIcon> = {
  'trending-up': TrendingUp,
  'send': Send,
  'line-chart': LineChart,
  'target': Target,
  'check-circle': CheckCircle2,
  'x-circle': XCircle,
  // Fallbacks for legacy icon paths
  'chart-growing': TrendingUp,
  'rewards-medal': Target,
  'rewards-trophy': CheckCircle2,
  'safe-money': XCircle,
};

interface BenefitCardItemProps {
  card: BenefitCard;
}

/**
 * Get icon component from icon identifier or path
 */
function getIconComponent(iconPath: string): LucideIcon {
  // Check if it's a direct icon name
  if (ICON_MAP[iconPath]) {
    return ICON_MAP[iconPath];
  }

  // Extract icon name from path (e.g., '/assets/icons/chart-growing.avif' -> 'chart-growing')
  const fileName = iconPath.split('/').pop()?.replace(/\.(avif|png|svg)$/, '') || '';
  return ICON_MAP[fileName] || TrendingUp; // Default fallback
}

/**
 * Individual Benefit Card Component
 * Note: Config values are pre-translated by the factory using useConfigTranslation
 */
function BenefitCardItem({ card }: BenefitCardItemProps) {
  const IconComponent = getIconComponent(card.icon);

  return (
    <article className={styles.card}>
      {/* Icon */}
      <div className={styles.iconWrapper}>
        <IconComponent className={styles.icon} aria-hidden="true" />
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
  enableAnalytics = true
}: BenefitsCardsVariantProps) {
  const { recordSectionRenderTime } = usePerformanceMonitoring();

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
          {config.cards.map((card) => (
            <BenefitCardItem
              key={card.id}
              card={card}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
