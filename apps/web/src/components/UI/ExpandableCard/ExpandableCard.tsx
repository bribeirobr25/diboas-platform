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

import { memo, useCallback, useEffect, useRef, type ReactNode, type ComponentType } from 'react';
import styles from './ExpandableCard.module.css';

export interface ExpandableCardProps {
  /** Unique card identifier */
  readonly id: string;
  /** Optional icon component rendered before the title */

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
  const expandableRef = useRef<HTMLDivElement>(null);
  const contentId = `expandable-content-${id}`;

  // Phase 4 W3 (audit/2026-05-08): React 18 doesn't recognise `inert` as
  // a JSX attribute and strips it before render, so we apply it via DOM
  // ref. axe's `aria-hidden-focus` rule (correctly) flags focusable
  // children inside an aria-hidden wrapper because keyboard users can
  // still tab into them; `inert` removes focusability AND AT visibility
  // in one declarative attribute. Drop this effect once the project
  // upgrades to React 19, where `inert` ships as a typed prop.
  useEffect(() => {
    const el = expandableRef.current;
    if (!el) return;
    if (isExpanded) {
      el.removeAttribute('inert');
    } else {
      el.setAttribute('inert', '');
    }
  }, [isExpanded]);

  const handleToggle = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''} ${className}`}
    >
      {/* Header — APG disclosure: a native <button> lives INSIDE the <h3> so
          heading semantics (and `H`-key nav) survive while the button supplies
          the accessible name + Enter/Space + aria-expanded. The button must not
          wrap the <h3> (headings aren't phrasing content → invalid HTML). */}
      <h3 className={styles.cardHeading}>
        <button
          type="button"
          className={styles.cardHeader}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={handleToggle}
        >
          {Icon ? <Icon className={styles.cardIcon} aria-hidden={true} /> : null}
          <span className={styles.cardTitle}>
            {title}
            {titleSummary ? <span className={styles.titleSummary}> {titleSummary}</span> : null}
          </span>
          <span className={styles.expandIndicator} aria-hidden="true">
            {isExpanded ? '\u2212' : '+'}
          </span>
        </button>
      </h3>

      {/* Expandable content. `inert` is applied via the effect above
          (React 18 strips unknown JSX attrs); aria-hidden remains for
          older AT that doesn't yet honour `inert`. */}
      <div
        ref={expandableRef}
        id={contentId}
        className={styles.expandable}
        aria-hidden={!isExpanded}
        role="region"
      >
        <div className={styles.expandableInner}>{children}</div>
      </div>

      {/* Screen-reader-only toggle label */}
      <span className={styles.srOnly}>{isExpanded ? collapseLabel : expandLabel}</span>
    </div>
  );
});

ExpandableCard.displayName = 'ExpandableCard';
