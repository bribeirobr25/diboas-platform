/**
 * ContentCard Component
 *
 * Reusable content card for info sections
 * Replaces inline Tailwind patterns like: bg-white rounded-xl p-6 shadow-sm
 *
 * Domain-Driven Design: Centralized card presentation
 * Code Reusability: Single source of truth for card styling
 * No Hardcoded Values: Uses design tokens
 */

import { memo } from 'react';
import { cn } from '@diboas/ui';
import styles from './ContentCard.module.css';

export interface ContentCardProps {
  /** Card title */
  title?: string;
  /** Card content/description */
  children: React.ReactNode;
  /** Card variant */
  variant?: 'default' | 'muted' | 'highlight' | 'accent';
  /** Additional CSS class */
  className?: string;
  /** Data test ID for testing */
  'data-testid'?: string;
}

export const ContentCard = memo(function ContentCard({
  title,
  children,
  variant = 'default',
  className = '',
  'data-testid': testId
}: ContentCardProps) {
  const variantClass = {
    default: styles.variantDefault,
    muted: styles.variantMuted,
    highlight: styles.variantHighlight,
    accent: styles.variantAccent
  }[variant];

  return (
    <div
      className={cn(styles.card, variantClass, className)}
      data-testid={testId}
    >
      {title && (
        <h3 className={styles.title}>
          {title}
        </h3>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
});

ContentCard.displayName = 'ContentCard';
