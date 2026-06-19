'use client';

/**
 * GoalRing — the signature "goal" device: an SVG progress ring that fills on
 * scroll-in (via `useInView`) toward `progress` (0..1), with an optional
 * centered label slot. Reduced-motion renders the filled state immediately.
 *
 * Decorative-but-meaningful: the wrapper carries role="img" + `ariaLabel`
 * (so the caller voices the number/goal); the inner SVG + label are aria-hidden
 * to avoid a double read.
 */

import { type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import styles from './GoalRing.module.css';

interface GoalRingProps {
  /** 0..1 (clamped). */
  progress: number;
  /** Pixel diameter (default 160). */
  size?: number;
  /** Centered content (e.g. a tabular-mono figure). */
  label?: ReactNode;
  /** `action` = teal; `warm` = copper. */
  variant?: 'action' | 'warm';
  /** Required: voices the ring for screen readers, e.g. "Goal 62% funded". */
  ariaLabel: string;
  className?: string;
}

export function GoalRing({
  progress,
  size = 160,
  label,
  variant = 'action',
  ariaLabel,
  className = '',
}: GoalRingProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.45 });
  const p = Math.max(0, Math.min(1, progress));
  // pathLength=1 → dashoffset is just (1 - fraction filled), length-independent.
  const dashoffset = inView ? 1 - p : 1;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className={`${styles.wrapper} ${variant === 'warm' ? styles.warm : styles.action} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className={styles.svg} aria-hidden="true">
        <circle cx="50" cy="50" r="44" className={styles.track} pathLength={1} fill="none" />
        <circle
          cx="50"
          cy="50"
          r="44"
          className={styles.progress}
          pathLength={1}
          fill="none"
          style={{ strokeDashoffset: dashoffset }}
        />
      </svg>
      {label != null ? (
        <div className={styles.center} aria-hidden="true">
          {label}
        </div>
      ) : null}
    </div>
  );
}
