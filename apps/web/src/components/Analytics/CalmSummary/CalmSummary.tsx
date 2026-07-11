import type { RegimeSummary } from '@/lib/analytics-sdk/types';
import styles from './CalmSummary.module.css';

interface CalmSummaryProps {
  data: RegimeSummary;
  length?: 'short' | 'detailed' | 'plain';
  className?: string;
}

export function CalmSummary({ data, length = 'detailed', className }: CalmSummaryProps) {
  // Plain (grandmother) layer is optional/back-compat — render nothing if a
  // cycle predates it (P3, 2026-07-11).
  if (length === 'plain') {
    if (!data.plain) return null;
    return <p className={`${styles.summary} ${styles.plain} ${className ?? ''}`}>{data.plain}</p>;
  }
  return (
    <p className={`${styles.summary} ${styles[length]} ${className ?? ''}`}>
      {length === 'short' ? data.short : data.detailed}
    </p>
  );
}
