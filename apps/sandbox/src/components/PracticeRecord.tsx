'use client';

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import { Toggle } from './Toggle';
import styles from './PracticeRecord.module.css';

interface Milestone {
  id: string;
  icon: string;
  title: string;
  date: string;
}

/** Hoisted so the default prop is a stable reference across renders. */
const NO_MILESTONES: Milestone[] = [];

/**
 * Practice record (R3; mockup 31; W-11). A factual, non-gamified milestone
 * timeline (never counts/ranks) plus the "show milestones on your public page"
 * toggle. Milestones are projected from product events (ISocialProjectionService
 * + the D-e/D-r/D-s events) — deferred — so the source is empty for now (no
 * fabricated milestones); the public-visibility toggle persists with the account
 * model (D-2). Both wire in later; the timeline markup is ready.
 */
export function PracticeRecord({ milestones = NO_MILESTONES }: { milestones?: Milestone[] }) {
  const [showPublic, setShowPublic] = useState(false);

  return (
    <section className={styles.wrap} aria-labelledby="pr-title">
      <h1 id="pr-title" className={styles.title}>
        <FormattedMessage id="practice.title" />
      </h1>

      <div className={styles.toggleRow}>
        <span id="pr-toggle-label" className={styles.toggleLabel}>
          <FormattedMessage id="practice.showPublic" />
        </span>
        <Toggle checked={showPublic} onChange={setShowPublic} labelledBy="pr-toggle-label" />
      </div>

      {milestones.length === 0 ? (
        <p className={styles.empty}>
          <FormattedMessage id="practice.empty" />
        </p>
      ) : (
        <ol className={styles.timeline}>
          {milestones.map((m, i) => (
            <li key={m.id} className={styles.item} data-last={i === milestones.length - 1}>
              <span className={styles.icon}>
                <LucideIcon name={m.icon} size={22} />
              </span>
              <span className={styles.body}>
                <span className={styles.mTitle}>{m.title}</span>
                <span className={styles.mDate}>{m.date}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
