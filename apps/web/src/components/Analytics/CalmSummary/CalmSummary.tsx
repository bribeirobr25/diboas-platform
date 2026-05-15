import type { RegimeSummary } from '@/lib/analytics-sdk/types';
import styles from './CalmSummary.module.css';

interface CalmSummaryProps {
  data: RegimeSummary;
  length?: 'short' | 'detailed';
  className?: string;
}

export function CalmSummary({ data, length = 'detailed', className }: CalmSummaryProps) {
  return (
    <p className={`${styles.summary} ${styles[length]} ${className ?? ''}`}>
      {length === 'short' ? data.short : data.detailed}
    </p>
  );
}
