'use client';

import { useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { LucideIcon } from './LucideIcon';
import styles from './Welcome.module.css';

/**
 * A1 (WS-A) — the welcome step: the FIRST surface after the gate, before the
 * salary anchor. It earns its place by telling the one thing first-run doesn't
 * otherwise say — the SIDE-POCKET story (only your Working money comes here;
 * the rest of your money stays where it is) — plus the honest play-money frame.
 * Warm and true (Q1/Q2/Q3), no fabricated stats, teal+amber, no gold (Brand),
 * R-4 play-money labeling. One primary action.
 */
const POINTS = [
  { icon: 'sprout', id: 'welcome.point1' },
  { icon: 'shield', id: 'welcome.point2' },
  { icon: 'check', id: 'welcome.point3' },
] as const;

export function Welcome({ onStart }: { onStart: () => void }) {
  // Move focus to the heading on mount so a keyboard/screen-reader user lands on
  // the new step, not the top of the document (plan A1 a11y).
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.wrap} aria-labelledby="welcome-title">
      <span className={styles.badge}>
        <FormattedMessage id="common.playBadge" />
      </span>
      <h1 id="welcome-title" ref={headingRef} tabIndex={-1} className={styles.title}>
        <FormattedMessage id="welcome.title" />
      </h1>
      <p className={styles.body}>
        <FormattedMessage id="welcome.body" />
      </p>
      <ul className={styles.points}>
        {POINTS.map((p) => (
          <li key={p.id} className={styles.point}>
            <span className={styles.pointIcon}>
              <LucideIcon name={p.icon} size={16} />
            </span>
            <FormattedMessage id={p.id} />
          </li>
        ))}
      </ul>
      <button type="button" className={styles.cta} onClick={onStart}>
        <FormattedMessage id="welcome.cta" />
      </button>
    </section>
  );
}
