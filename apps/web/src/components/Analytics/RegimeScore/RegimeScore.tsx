import type { RegimeData } from '@/lib/analytics-sdk/types';
import regimePalette from '../regime.module.css';
import styles from './RegimeScore.module.css';

interface RegimeScoreProps {
  data: Pick<RegimeData, 'score' | 'max_score' | 'regime_code'>;
  ariaLabel: string;
  className?: string;
}

export function RegimeScore({ data, ariaLabel, className }: RegimeScoreProps) {
  const { score, max_score, regime_code } = data;
  const colorClass = regimePalette[`regimeColor${regime_code}`] ?? '';
  return (
    <div
      className={`${styles.wrapper} ${colorClass} ${className ?? ''}`}
      role="img"
      aria-label={ariaLabel}
    >
      <span className={styles.score}>{score}</span>
      <span className={styles.max}>/&nbsp;{max_score}</span>
    </div>
  );
}
