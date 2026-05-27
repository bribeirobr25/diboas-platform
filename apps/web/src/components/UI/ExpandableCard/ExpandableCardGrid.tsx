/**
 * ExpandableCardGrid Component
 *
 * Grid container for ExpandableCards. Manages expand state in two modes:
 * - multiExpand={false} (default): Only one card expanded at a time (goal cards)
 * - multiExpand={true}: Each card independently expandable (strategy/protocol cards)
 *
 * When multiExpand is false, the grid manages a single expandedId state.
 * When multiExpand is true, each ExpandableCard manages its own state via
 * an internal expandedIds Set.
 */

'use client';

import { useState, useCallback, type ReactNode } from 'react';
import styles from './ExpandableCard.module.css';

export interface ExpandableCardGridProps {
  /** Grid children (ExpandableCard instances) */
  readonly children: (props: {
    isExpanded: (id: string) => boolean;
    onToggle: (id: string) => void;
  }) => ReactNode;
  /** Allow multiple cards expanded simultaneously */
  readonly multiExpand?: boolean;
  /** Additional CSS class */
  readonly className?: string;
}

export function ExpandableCardGrid({
  children,
  multiExpand = false,
  className = '',
}: ExpandableCardGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isExpanded = useCallback(
    (id: string) => {
      return multiExpand ? expandedIds.has(id) : expandedId === id;
    },
    [multiExpand, expandedId, expandedIds]
  );

  const onToggle = useCallback(
    (id: string) => {
      if (multiExpand) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      } else {
        setExpandedId((prev) => (prev === id ? null : id));
      }
    },
    [multiExpand]
  );

  return <div className={`${styles.grid} ${className}`}>{children({ isExpanded, onToggle })}</div>;
}
