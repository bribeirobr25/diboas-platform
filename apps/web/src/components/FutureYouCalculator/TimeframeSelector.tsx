'use client';

/**
 * Timeframe Selector Component
 *
 * Button group for selecting investment timeframe
 */

import type { LongTermTimeframe } from '@/lib/calculator';
import styles from './FutureYouCalculator.module.css';

interface TimeframeSelectorProps {
  timeframes: readonly LongTermTimeframe[];
  selectedTimeframe: LongTermTimeframe;
  onTimeframeChange: (timeframe: LongTermTimeframe) => void;
  getLabel: (timeframe: LongTermTimeframe) => string;
}

export function TimeframeSelector({
  timeframes,
  selectedTimeframe,
  onTimeframeChange,
  getLabel,
}: TimeframeSelectorProps) {
  return (
    <div className={styles.timeframeSelector}>
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onTimeframeChange(tf)}
          className={`${styles.timeframeButton} ${selectedTimeframe === tf ? styles.active : ''}`}
        >
          {getLabel(tf)}
        </button>
      ))}
    </div>
  );
}
