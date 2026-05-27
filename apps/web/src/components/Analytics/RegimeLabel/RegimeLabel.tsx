import type { RegimeCode, RegimeData } from '@/lib/analytics-sdk/types';
import regimePalette from '../regime.module.css';
import styles from './RegimeLabel.module.css';

interface RegimeLabelProps {
  data: Pick<RegimeData, 'regime_code' | 'regime_label'>;
  /**
   * Optional locale-translated labels keyed by regime_code. When omitted, falls
   * back to the SDK's `data.regime_label` (English). Host pages should always
   * supply this so /market reflects the user's locale.
   */
  labels?: Record<RegimeCode, string>;
  className?: string;
}

export function RegimeLabel({ data, labels, className }: RegimeLabelProps) {
  const fillClass = regimePalette[`regimeFill${data.regime_code}`] ?? '';
  const colorClass = regimePalette[`regimeColor${data.regime_code}`] ?? '';
  const text = labels?.[data.regime_code] ?? data.regime_label;
  return (
    <span className={`${styles.pill} ${fillClass} ${colorClass} ${className ?? ''}`}>{text}</span>
  );
}
