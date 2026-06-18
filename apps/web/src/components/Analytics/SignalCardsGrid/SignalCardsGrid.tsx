import type { SignalGroup } from '@/lib/analytics-sdk/types';
import { SignalCard } from '../SignalCard';
import styles from './SignalCardsGrid.module.css';

interface SignalCardsGridProps {
  groups: SignalGroup[];
  expandLabel: string;
  collapseLabel: string;
  pointsLabel: string;
  /** Accepted for SDK API compatibility; the editorial layout is always a
   *  single-column table. */
  columns?: 1 | 2 | 4;
  expandable?: boolean;
  className?: string;
}

export function SignalCardsGrid({ groups, className }: SignalCardsGridProps) {
  return (
    <div className={`${styles.table} ${className ?? ''}`}>
      {groups.map((g) => (
        <SignalCard key={g.id} data={g} />
      ))}
    </div>
  );
}
