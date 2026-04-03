/**
 * ExpandableCard Component
 *
 * Shared expandable card pattern used across goal cards, strategy cards,
 * and protocol cards. Supports both single-expand (parent-managed) and
 * multi-expand (self-managed) modes via the isExpanded/onToggle props.
 *
 * Accessibility: aria-expanded, aria-controls, keyboard support, prefers-reduced-motion
 * Performance: memo'd, CSS transition (no JS animation)
 */

'use client';

import { memo, useCallback, useRef } from 'react';
import type { ReactNode, ComponentType } from 'react';
import styles from './ExpandableCard.module.css';

export interface ExpandableCardProps {
  /** Unique card identifier */
  readonly id: string;
  /** Optional icon component rendered before the title */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly icon?: ComponentType<any>;
  /** Card title (always visible) */
  readonly title: string;
  /** Teal accent text next to title (always visible) */
  readonly titleSummary?: string;
  /** Label for expand button (i18n) */
  readonly expandLabel: string;
  /** Label for collapse button (i18n) */
  readonly collapseLabel: string;
  /** Whether the card is expanded */
  readonly isExpanded: boolean;
  /** Toggle callback */
  readonly onToggle: (id: string) => void;
  /** Expanded content */
  readonly children: ReactNode;
  /** Additional CSS class */
  readonly className?: string;
}

export const ExpandableCard = memo(function ExpandableCard({
  id,
  icon: Icon,
  title,
  titleSummary,
  expandLabel,
  collapseLabel,
  isExpanded,
  onToggle,
  children,
  className = '',
}: ExpandableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentId = `expandable-content-${id}`;

  const handleToggle = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''} ${className}`}
    >
      {/* Header — always visible, clickable to toggle */}
      <div
        className={styles.cardHeader}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {Icon ? <Icon className={styles.cardIcon} aria-hidden={true} /> : null}
        <h3 className={styles.cardTitle}>
          {title}
          {titleSummary ? (
            <span className={styles.titleSummary}> {titleSummary}</span>
          ) : null}
        </h3>
        <span className={styles.expandIndicator} aria-hidden="true">
          {isExpanded ? '\u2212' : '+'}
        </span>
      </div>

      {/* Expandable content */}
      <div
        id={contentId}
        className={styles.expandable}
        aria-hidden={!isExpanded}
        role="region"
      >
        <div className={styles.expandableInner}>
          {children}
        </div>
      </div>

      {/* Screen-reader-only toggle label */}
      <span className={styles.srOnly}>
        {isExpanded ? collapseLabel : expandLabel}
      </span>
    </div>
  );
});

ExpandableCard.displayName = 'ExpandableCard';
