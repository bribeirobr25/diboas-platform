'use client';

import { useEffect, useRef, useState } from 'react';
import type { SignalGroup } from '@/lib/analytics-sdk/types';
import styles from './SignalCard.module.css';

interface SignalCardProps {
  data: SignalGroup;
  /** Accepted for API compatibility with the SDK grid; unused in the editorial
   *  table layout (rows are flat, not expandable). */
  expandable?: boolean;
  expandLabel?: string;
  collapseLabel?: string;
  pointsLabel?: string;
  className?: string;
}

/** Editorial signal row (02-editorial-motion): mono value · serif name · desc ·
 *  copper bar filling to the awarded fraction on first scroll-in. */
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
    <div ref={ref} className={`${styles.row} ${className ?? ''}`} data-status={data.status}>
      <span className={styles.value}>
        {data.points_awarded}
        <span className={styles.valueMax}>/{data.max_points}</span>
      </span>
      <div className={styles.body}>
        <div className={styles.name}>{data.title}</div>
        <p className={styles.desc}>{data.summary}</p>
        <div className={styles.bar}>
          <span className={styles.barFill} style={{ width: `${width}%` }} />
        </div>
      </div>
    </div>
  );
}
