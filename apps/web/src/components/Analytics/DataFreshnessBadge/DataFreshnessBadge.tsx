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
  /**
   * User-friendly display name for the feed (e.g. "Gold price"). Falls back to
   * the raw `source` id when omitted. The raw `source` still rides on the hover
   * title (via `message ?? source`) so upstream provenance stays discoverable.
   */
  label?: string;
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
  label,
  className,
}: DataFreshnessBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${className ?? ''}`}
      data-status={status.toLowerCase()}
      title={message ?? source}
    >
      <LucideIcon icon={ICON_BY_STATUS[status]} size="xs" aria-hidden="true" />
      <span className={styles.source}>{label ?? source}</span>
      <span className={styles.divider} aria-hidden="true">
        ·
      </span>
      <span className={styles.statusLabel}>{labels[status]}</span>
    </span>
  );
}
