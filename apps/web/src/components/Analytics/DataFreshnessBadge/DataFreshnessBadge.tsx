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
  /**
   * User-friendly display name for the feed (e.g. "Gold price"). Falls back to
   * the raw `source` id when omitted. The raw `source` stays discoverable as the
   * `data-source` attribute.
   *
   * There is deliberately NO message/tooltip (2026-10-21, review gate): the
   * pipeline's per-source messages are internal English notes, written for the
   * status at generation time, so a hover title showed English in every locale
   * and could describe a source as on schedule next to a "Delayed" label after
   * the read-time check downgraded it.
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
  label,
  className,
}: DataFreshnessBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${className ?? ''}`}
      data-status={status.toLowerCase()}
      data-source={source}
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
