import type { ConfidenceLevel } from '@/lib/analytics-sdk/types';
import styles from './ConfidenceBadge.module.css';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  labels: Record<ConfidenceLevel, string>;
  className?: string;
}

export function ConfidenceBadge({ level, labels, className }: ConfidenceBadgeProps) {
  const tone = level.toLowerCase();
  return (
    <span className={`${styles.badge} ${className ?? ''}`} data-confidence={tone}>
      {labels[level]}
    </span>
  );
}
