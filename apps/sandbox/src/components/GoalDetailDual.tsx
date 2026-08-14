'use client';

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from './Button';
import { Card } from './Card';
import { LucideIcon } from './LucideIcon';
import { ModeChip } from './ModeChip';
import { SegmentedToggle } from './SegmentedToggle';
import { Sparkline } from './Sparkline';
import styles from './GoalDetailDual.module.css';

type View = 'simple' | 'detailed';

/**
 * GoalDetailDual — the goal-page dual-view (Phase B; the goal parallel of
 * StrategyDetail). Simple leads the goal ①→②→③: ① am I on track? (progress +
 * HONEST pace, "a pace not a promise") → ② what my money's doing (friendly
 * now-vs-past; earnings may be slightly negative, shown plainly not alarm-red)
 * → ③ what I can do next (Add · Pause plan [the W-17d "Plan paused · money still
 * working" duality] · More). Detailed = the traditional breakdown with
 * source-separation (contributions vs market change — UX-63).
 *
 * SEAM: props are the goal example here; real data = the ledger projection.
 * Handlers (onAdd/onPause) fire the goal-action seams (D-e).
 */
export function GoalDetailDual({
  current,
  target,
  monthsToGo,
  strategyName,
  series,
  contributions,
  marketChange,
  onAdd,
  onPause,
}: {
  current: string;
  target: string;
  monthsToGo: number;
  strategyName: string;
  series: number[];
  contributions: string;
  marketChange: string;
  onAdd?: () => void;
  onPause?: () => void;
}) {
  const [view, setView] = useState<View>('simple');

  return (
    <section className={styles.wrap} aria-labelledby="goal-title">
      <header className={styles.head}>
        <ModeChip />
        <SegmentedToggle<View>
          ariaLabel="View"
          value={view}
          onChange={setView}
          segments={[
            { id: 'simple', label: <FormattedMessage id="goalDual.simple" /> },
            { id: 'detailed', label: <FormattedMessage id="goalDual.detailed" /> },
          ]}
        />
      </header>

      <div className={styles.hero}>
        <h1 id="goal-title" className={styles.heroTitle}>
          <FormattedMessage id="goalExample.name" />
        </h1>
        <p className={styles.heroAmount}>
          <FormattedMessage id="goalDual.currentOfTarget" values={{ current, target }} />
        </p>
      </div>

      {view === 'simple' ? (
        <div className={styles.simple}>
          {/* ① am I on track */}
          <Card className={styles.trackCard}>
            <p className={styles.rowLabel}>
              <FormattedMessage id="goalDual.onTrackLabel" />
            </p>
            <p className={styles.trackStatus}>
              <LucideIcon name="check" size={18} />
              <FormattedMessage id="goalDual.onTrack" />
            </p>
            <p className={styles.rowBody}>
              <FormattedMessage id="goalDual.pace" values={{ months: monthsToGo }} />
            </p>
            <p className={styles.paceNote}>
              <FormattedMessage id="goalDual.paceNote" />
            </p>
          </Card>

          {/* ② what my money's doing */}
          <Card className={styles.behaveCard}>
            <p className={styles.rowLabel}>
              <FormattedMessage id="goalDual.howLabel" />
            </p>
            <p className={styles.behaveLead}>
              <FormattedMessage id="goalDual.howLead" values={{ strategy: strategyName }} />
            </p>
            <Sparkline series={series} />
          </Card>

          {/* ③ what I can do next */}
          <div className={styles.actions}>
            <p className={styles.rowLabel}>
              <FormattedMessage id="goalDual.nextLabel" />
            </p>
            <div className={styles.actionRow}>
              <Button variant="secondary" onClick={() => onAdd?.()}>
                <LucideIcon name="plus" size={16} />
                <FormattedMessage id="goalDual.add" />
              </Button>
              <Button variant="secondary" onClick={() => onPause?.()}>
                <FormattedMessage id="goalDual.pausePlan" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.detailed}>
          <Sparkline series={series} />
          {/* Source-separation (UX-63): contributions vs market change, distinct */}
          <div className={styles.breakRow}>
            <span>
              <FormattedMessage id="goalDual.contributions" />
            </span>
            <span className={styles.breakVal}>{contributions}</span>
          </div>
          <div className={styles.breakRow}>
            <span>
              <FormattedMessage id="goalDual.marketChange" />
            </span>
            <span className={styles.breakVal}>{marketChange}</span>
          </div>
          <div className={styles.breakRow}>
            <span>
              <FormattedMessage id="goalDual.inStrategy" />
            </span>
            <span className={styles.breakVal}>{strategyName}</span>
          </div>
        </div>
      )}

      {view === 'simple' ? (
        <button type="button" className={styles.seeDetail} onClick={() => setView('detailed')}>
          <FormattedMessage id="goalDual.seeDetail" />
          <LucideIcon name="chevron-right" size={16} />
        </button>
      ) : null}
    </section>
  );
}
