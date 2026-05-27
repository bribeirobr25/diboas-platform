import type { FreshnessStatus } from '@/lib/analytics-sdk/types';
import {
  LucideIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  type LucideIconType,
} from '@/components/UI/LucideIcon';
import styles from './DataFreshnessBadge.module.css';

interface DataFreshnessBadgeProps {
  status: FreshnessStatus;
  source: string;
  labels: Record<FreshnessStatus, string>;
  message?: string | null;
  className?: string;
}

const ICON_BY_STATUS: Record<FreshnessStatus, LucideIconType> = {
  FRESH: CheckCircle2,
  DELAYED: Clock,
  STALE: AlertTriangle,
  UNAVAILABLE: AlertCircle,
};

export function DataFreshnessBadge({
  status,
  source,
  labels,
  message,
  className,
}: DataFreshnessBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${className ?? ''}`}
      data-status={status.toLowerCase()}
      title={message ?? undefined}
    >
      <LucideIcon icon={ICON_BY_STATUS[status]} size="xs" aria-hidden="true" />
      <span className={styles.source}>{source}</span>
      <span className={styles.divider} aria-hidden="true">
        ·
      </span>
      <span className={styles.statusLabel}>{labels[status]}</span>
    </span>
  );
}
