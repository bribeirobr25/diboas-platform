'use client';

import { useId, useState } from 'react';
import type { SignalGroup } from '@/lib/analytics-sdk/types';
import { LucideIcon, ChevronUp, ChevronDown } from '@/components/UI/LucideIcon';
import regimePalette from '../regime.module.css';
import styles from './SignalCard.module.css';

interface SignalCardProps {
  data: SignalGroup;
  expandable?: boolean;
  expandLabel: string;
  collapseLabel: string;
  pointsLabel: string;
  onExpand?: (groupId: string) => void;
  onCollapse?: (groupId: string) => void;
  className?: string;
}

const STATUS_TONE: Record<SignalGroup['status'], 'CONSTRUCTIVE' | 'NEUTRAL_MIXED' | 'HOSTILE'> = {
  CONSTRUCTIVE: 'CONSTRUCTIVE',
  MIXED: 'NEUTRAL_MIXED',
  WEAK: 'HOSTILE',
};

export function SignalCard({
  data,
  expandable = false,
  expandLabel,
  collapseLabel,
  pointsLabel,
  onExpand,
  onCollapse,
  className,
}: SignalCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const toneCode = STATUS_TONE[data.status];
  const colorClass = regimePalette[`regimeColor${toneCode}`] ?? '';

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onExpand?.(data.id);
    else onCollapse?.(data.id);
  };

  return (
    <article className={`${styles.card} ${className ?? ''}`} data-status={data.status}>
      <header className={styles.header}>
        <h3 className={styles.title}>{data.title}</h3>
        <span className={`${styles.points} ${colorClass}`}>
          <span className={styles.pointsValue}>{data.points_awarded}</span>
          <span className={styles.pointsMax}>/ {data.max_points}</span>
          <span className={styles.pointsLabel}>{pointsLabel}</span>
        </span>
      </header>
      <p className={styles.summary}>{data.summary}</p>
      {expandable && data.signals && data.signals.length > 0 && (
        <>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={handleToggle}
          >
            <span>{open ? collapseLabel : expandLabel}</span>
            <LucideIcon icon={open ? ChevronUp : ChevronDown} size="sm" aria-hidden="true" />
          </button>
          {open && (
            <ul id={detailsId} className={styles.signals}>
              {data.signals.map((s) => (
                <li key={s.id} className={styles.signal}>
                  <span className={styles.signalTitle}>{s.title}</span>
                  <span className={styles.signalSummary}>{s.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  );
}
