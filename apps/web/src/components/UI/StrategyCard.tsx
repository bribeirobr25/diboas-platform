/**
 * StrategyCard Component
 *
 * Specialized card for displaying investment strategy information
 * Includes growth exposure badge, stats grid, and accent border styling
 *
 * Domain-Driven Design: Strategy-specific presentation logic
 * Code Reusability: Single source of truth for strategy card styling
 * No Hardcoded Values: Uses design tokens
 */

import { memo } from 'react';
import { cn } from '@diboas/ui';
import styles from './StrategyCard.module.css';

export interface StrategyStatItem {
  label: string;
  value: string;
}

export interface StrategyCardProps {
  /** Strategy name */
  name: string;
  /** Strategy badge/category */
  badge: string;
  /** Strategy tagline */
  tagline: string;
  /** Growth exposure percentage (0 = stable, >0 = growth) */
  growthExposure: number;
  /** Growth badge label (e.g., "growth") */
  growthBadgeLabel?: string;
  /** Stats to display */
  stats: StrategyStatItem[];
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
  badge,
  tagline,
  growthExposure,
  growthBadgeLabel = 'growth',
  stats,
  className = '',
  'data-testid': testId
}: StrategyCardProps) {
  const isStable = growthExposure === 0;
  const borderClass = isStable ? styles.borderStable : styles.borderGrowth;

  return (
    <div
      className={cn(styles.card, borderClass, className)}
      data-testid={testId}
    >
      {/* Header with name and growth badge */}
      <div className={styles.header}>
        <h3 className={styles.name}>
          {name}
        </h3>
        {growthExposure > 0 && (
          <span className={styles.growthBadge}>
            {growthExposure}% {growthBadgeLabel}
          </span>
        )}
      </div>

      {/* Badge and tagline */}
      <p className={styles.badge}>
        {badge}
      </p>
      <p className={styles.tagline}>
        {tagline}
      </p>

      {/* Stats grid */}
      <div className={styles.stats}>
        {stats.map((stat, index) => {
          // Last stat uses risk level coloring
          const isRiskLevel = index === stats.length - 1;
          return (
            <div key={stat.label} className={styles.statRow}>
              <span className={styles.statLabel}>
                {stat.label}:
              </span>
              <span className={cn(
                styles.statValue,
                isRiskLevel && getRiskLevelClass(growthExposure)
              )}>
                {stat.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

StrategyCard.displayName = 'StrategyCard';
