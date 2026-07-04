'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './investor.module.css';

/**
 * Thin fixed reading-progress bar for long investor-room documents — pure
 * orientation. Decorative (`aria-hidden`): AT users navigate by headings and the
 * "On this page" ToC, so a scroll bar would only add noise. The width tracks
 * scroll position directly (no CSS transition, so nothing to gate on reduced
 * motion). rAF-throttled passive listeners, removed in cleanup (no setState
 * thrash, no leaked listeners). Hidden in print.
 */
export function InvestorReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      rafRef.current = null;
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      const pct = scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));
    };
    const onScroll = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={styles.readingProgress} aria-hidden="true">
      <div className={styles.readingProgressBar} style={{ width: `${progress}%` }} />
    </div>
  );
}
