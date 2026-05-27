'use client';

/**
 * StrategyCard Component
 *
 * Specialized card for displaying investment strategy information
 * Includes growth exposure badge, stats grid, allocation, and accent border styling
 * Collapsed by default — expand toggle reveals full details
 *
 * Domain-Driven Design: Strategy-specific presentation logic
 * Code Reusability: Single source of truth for strategy card styling
 * No Hardcoded Values: Uses design tokens
 */

import { memo, useState } from 'react';
import { cn } from '@diboas/ui';
import styles from './StrategyCard.module.css';

export interface StrategyStatItem {
  label: string;
  value: string;
}

export interface StrategyCardProps {
  /** Strategy name */
  name: string;
  /** Stable key for ARIA IDs (e.g., "wealthAccelerator") */
  strategyId: string;
  /** Strategy badge/category */
  badge: string;
  /** Strategy tagline */
  tagline: string;
  /** Growth exposure percentage (0 = stable, >0 = growth) */
  growthExposure: number;
  /** Growth badge label (e.g., "growth") */
  growthBadgeLabel?: string;
  /** Main card description paragraph 1 */
  description: string;
  /** Optional second description paragraph */
  description2?: string;
  /** Allocation string (e.g., "50% Sky SSR + 30% Aave V3 + 20% Compound V3") */
  allocation: string;
  /** Micro-text below allocation */
  allocationNote: string;
  /** Common use case text */
  commonUseCase: string;
  /** Stats to display */
  stats: StrategyStatItem[];
  /** Optional note (micro-text) */
  note?: string;
  /** Optional warning callout */
  warning?: string;
  /** Optional access requirements callout */
  accessRequirements?: string;
  /** i18n label for expand toggle */
  showMoreLabel: string;
  /** i18n label for collapse toggle */
  showLessLabel: string;
  /** Additional CSS class */
  className?: string;
  /** Data test ID for testing */
  'data-testid'?: string;
}

/**
 * Get risk level text color based on growth exposure
 */
function getRiskLevelClass(growthExposure: number): string {
  if (growthExposure === 0) return styles.riskTeal;
  if (growthExposure < 40) return styles.riskLight;
  if (growthExposure < 70) return styles.riskMedium;
  return styles.riskHigh;
}

export const StrategyCard = memo(function StrategyCard({
  name,
  strategyId,
  badge,
  tagline,
  growthExposure,
  growthBadgeLabel = 'growth',
  description,
  description2,
  allocation,
  allocationNote,
  commonUseCase,
  stats,
  note,
  warning,
  accessRequirements,
  showMoreLabel,
  showLessLabel,
  className = '',
  'data-testid': testId,
}: StrategyCardProps) {
  const isStable = growthExposure === 0;
  const borderClass = isStable ? styles.borderStable : styles.borderGrowth;
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = `strategy-details-${strategyId}`;

  return (
    <div className={cn(styles.card, borderClass, className)} data-testid={testId}>
      {/* ALWAYS VISIBLE */}
      {/* Header with name and growth badge */}
      <div className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        {growthExposure > 0 ? (
          <span className={styles.growthBadge}>
            {growthExposure}% {growthBadgeLabel}
          </span>
        ) : null}
      </div>

      {/* Badge and tagline */}
      <p className={styles.badge}>{badge}</p>
      <p className={styles.tagline}>{tagline}</p>

      {/* Stats grid */}
      <div className={styles.stats}>
        {stats.map((stat, index) => {
          const isRiskLevel = index === stats.length - 1;
          return (
            <div key={stat.label} className={styles.statRow}>
              <span className={styles.statLabel}>{stat.label}:</span>
              <span
                className={cn(styles.statValue, isRiskLevel && getRiskLevelClass(growthExposure))}
              >
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* EXPAND TOGGLE */}
      <button
        type="button"
        className={styles.expandToggle}
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
      >
        {isExpanded ? showLessLabel : showMoreLabel}
      </button>

      {/* EXPANDABLE CONTENT */}
      <div
        id={detailsId}
        className={cn(styles.expandableContent, isExpanded && styles.expandableContentOpen)}
        role="region"
      >
        {/* Description paragraphs */}
        <p className={styles.description}>{description}</p>
        {description2 ? <p className={styles.description}>{description2}</p> : null}

        {/* Allocation */}
        <div className={styles.allocationSection}>
          <p className={styles.allocation}>{allocation}</p>
          <p className={styles.allocationNote}>{allocationNote}</p>
        </div>

        {/* Common use case */}
        <div className={styles.commonUseCase}>
          <p className={styles.commonUseCaseText}>{commonUseCase}</p>
        </div>

        {/* Optional note */}
        {note ? <p className={styles.note}>{note}</p> : null}

        {/* Optional warning callout */}
        {warning ? (
          <div className={styles.warningCallout} role="alert">
            <p>{warning}</p>
          </div>
        ) : null}

        {/* Optional access requirements callout */}
        {accessRequirements ? (
          <div className={styles.accessCallout}>
            <p>{accessRequirements}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
});

StrategyCard.displayName = 'StrategyCard';
