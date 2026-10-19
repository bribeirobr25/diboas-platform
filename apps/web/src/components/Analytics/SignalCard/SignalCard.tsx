'use client';

import { useEffect, useRef, useState } from 'react';
import type { SignalGroup } from '@/lib/analytics-sdk/types';
import { isSignalGroupUnavailable } from '@/lib/market/presentationState';
import styles from './SignalCard.module.css';

interface SignalCardProps {
  data: SignalGroup;
  /** Accepted for API compatibility with the SDK grid; the editorial rows are
   *  always expandable since the view-voice wave (2026-08-14). */
  expandable?: boolean;
  expandLabel?: string;
  collapseLabel?: string;
  pointsLabel?: string;
  /** The approved "Unavailable" word in the page locale (catalogue
   *  `dashboard.freshness.UNAVAILABLE`), shown on a group with nothing evaluated. */
  unavailableLabel: string;
  className?: string;
}

/** Editorial signal row (02-editorial-motion), view-voice wave (2026-08-14,
 *  founder feedback): the row is now a native `<details>` — collapsed it shows
 *  ONLY the score + group title (+ the copper bar), expanded it reveals the
 *  group summary AND the per-signal breakdown (previously rendered nowhere).
 *  Native disclosure: server-renderable, keyboard + screen-reader semantics
 *  for free, no JS required to toggle. The copper bar's scroll-in animation
 *  stays and respects prefers-reduced-motion.
 *
 *  Unavailable group (2026-10-19): when nothing in the group was evaluated the
 *  row keeps its "0/2" but shows the "Unavailable" word where the bar was, in a
 *  neutral colour, so it never reads as a weak score. Its accessible name
 *  carries the group sentence, which the generator words per cause (suspension,
 *  warm-up, missing week), so a closed row already says why. */
export function SignalCard({ data, unavailableLabel, className }: SignalCardProps) {
  const unavailable = isSignalGroupUnavailable(data);
  const pct = data.max_points > 0 ? Math.round((data.points_awarded / data.max_points) * 100) : 0;
  const [width, setWidth] = useState(pct);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // An unavailable row has no bar to animate.
    if (reduce || unavailable) return;
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
  }, [pct, unavailable]);

  return (
    <details
      className={`${styles.row} ${className ?? ''}`}
      data-status={unavailable ? 'UNAVAILABLE' : data.status}
    >
      {/* Spec note: <summary> permits phrasing content only — every child is
          a <span> (display set in CSS), never a <div>, so AT sees conforming
          markup. */}
      <summary className={styles.rowSummary}>
        <span ref={ref} className={styles.rowHead}>
          {/* Unavailable: the visible "0/2" is hidden from assistive tech,
              because the group sentence below says "0 of 2 points" with its
              reason; read alone, "0/2" would sound like a measured zero. */}
          <span className={styles.value} aria-hidden={unavailable ? true : undefined}>
            {data.points_awarded}
            <span className={styles.valueMax}>/{data.max_points}</span>
          </span>
          <span className={styles.body}>
            <span className={styles.name}>{data.title}</span>
            {unavailable ? (
              <>
                <span className={styles.unavailable}>{unavailableLabel}</span>
                <span className="sr-only">{data.summary}</span>
              </>
            ) : (
              <span className={styles.bar}>
                <span className={styles.barFill} style={{ width: `${width}%` }} />
              </span>
            )}
          </span>
          <span className={styles.chevron} aria-hidden="true" />
        </span>
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
