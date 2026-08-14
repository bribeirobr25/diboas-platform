'use client';

import { useEffect, useRef, useState } from 'react';
import type { SignalGroup } from '@/lib/analytics-sdk/types';
import styles from './SignalCard.module.css';

interface SignalCardProps {
  data: SignalGroup;
  /** Accepted for API compatibility with the SDK grid; the editorial rows are
   *  always expandable since the view-voice wave (2026-08-14). */
  expandable?: boolean;
  expandLabel?: string;
  collapseLabel?: string;
  pointsLabel?: string;
  className?: string;
}

/** Editorial signal row (02-editorial-motion), view-voice wave (2026-08-14,
 *  founder feedback): the row is now a native `<details>` — collapsed it shows
 *  ONLY the score + group title (+ the copper bar), expanded it reveals the
 *  group summary AND the per-signal breakdown (previously rendered nowhere).
 *  Native disclosure: server-renderable, keyboard + screen-reader semantics
 *  for free, no JS required to toggle. The copper bar's scroll-in animation
 *  stays and respects prefers-reduced-motion. */
export function SignalCard({ data, className }: SignalCardProps) {
  const pct = data.max_points > 0 ? Math.round((data.points_awarded / data.max_points) * 100) : 0;
  const [width, setWidth] = useState(pct);
  const ref = useRef<HTMLDivElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let outerRaf = 0;
    let innerRaf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || ran.current) return;
        ran.current = true;
        io.disconnect();
        setWidth(0);
        outerRaf = requestAnimationFrame(() => {
          innerRaf = requestAnimationFrame(() => setWidth(pct));
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    // RC: cancel both queued frames on unmount so the deferred setWidth never
    // fires on an unmounted row.
    return () => {
      io.disconnect();
      if (outerRaf) cancelAnimationFrame(outerRaf);
      if (innerRaf) cancelAnimationFrame(innerRaf);
    };
  }, [pct]);

  return (
    <details className={`${styles.row} ${className ?? ''}`} data-status={data.status}>
      <summary className={styles.rowSummary}>
        <div ref={ref} className={styles.rowHead}>
          <span className={styles.value}>
            {data.points_awarded}
            <span className={styles.valueMax}>/{data.max_points}</span>
          </span>
          <div className={styles.body}>
            <div className={styles.name}>{data.title}</div>
            <div className={styles.bar}>
              <span className={styles.barFill} style={{ width: `${width}%` }} />
            </div>
          </div>
          <span className={styles.chevron} aria-hidden="true" />
        </div>
      </summary>
      <div className={styles.detailBody}>
        <p className={styles.desc}>{data.summary}</p>
        {data.signals && data.signals.length > 0 ? (
          <ul className={styles.signalList}>
            {data.signals.map((sig) => (
              <li key={sig.id} className={styles.signalItem} data-state={sig.state}>
                <span className={styles.signalTitle}>{sig.title}</span>
                <p className={styles.signalSummary}>{sig.summary}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </details>
  );
}
