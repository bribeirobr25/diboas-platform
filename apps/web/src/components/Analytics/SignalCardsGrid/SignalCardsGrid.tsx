import type { SignalGroup } from '@/lib/analytics-sdk/types';
import { SignalCard } from '../SignalCard';
import styles from './SignalCardsGrid.module.css';

interface SignalCardsGridProps {
  groups: SignalGroup[];
  expandLabel: string;
  collapseLabel: string;
  pointsLabel: string;
  columns?: 1 | 2 | 4;
  expandable?: boolean;
  className?: string;
}

export function SignalCardsGrid({
  groups,
  expandLabel,
  collapseLabel,
  pointsLabel,
  columns = 2,
  expandable = true,
  className,
}: SignalCardsGridProps) {
  return (
    <div
      className={`${styles.grid} ${className ?? ''}`}
      data-columns={columns}
    >
      {groups.map((g) => (
        <SignalCard
          key={g.id}
          data={g}
          expandable={expandable}
          expandLabel={expandLabel}
          collapseLabel={collapseLabel}
          pointsLabel={pointsLabel}
        />
      ))}
    </div>
  );
}
