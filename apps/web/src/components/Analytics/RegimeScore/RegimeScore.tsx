'use client';

import { useEffect, useRef, useState } from 'react';
import type { RegimeData } from '@/lib/analytics-sdk/types';
import styles from './RegimeScore.module.css';

interface RegimeScoreProps {
  data: Pick<RegimeData, 'score' | 'max_score' | 'regime_code'>;
  ariaLabel: string;
  className?: string;
}

/** Editorial 180° gauge (replicates 02-editorial-motion). Arc is a
 *  semicircle of radius 160 → length = π·160. The pointer is a short stroke at
 *  the arc's inner edge, not a needle from the centre (a needle crossed the
 *  score readout; visual pass 2026-11-11). The score text + arc + pointer are
 *  SSR'd at the final value; on first scroll-in we re-animate 0 → value (skipped
 *  under reduced motion / no-JS, which simply show the final reading). */
const ARC_LEN = Math.PI * 160;

export function RegimeScore({ data, ariaLabel, className }: RegimeScoreProps) {
  const { score, max_score } = data;
  const frac = max_score > 0 ? Math.max(0, Math.min(1, score / max_score)) : 0;

  const [shown, setShown] = useState(frac);
  const [num, setNum] = useState(score);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // R-9 (2026-10-18 compliance pass): without IntersectionObserver the
    // constructor throws and the section's error boundary would replace the
    // whole block. The final value is already rendered, so just skip the
    // animation, exactly as reduced motion does.
    if (reduce || typeof IntersectionObserver === 'undefined') return;
    let rafId = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || ran.current) return;
        ran.current = true;
        io.disconnect();
        const start = performance.now();
        const DUR = 1400;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DUR);
          const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
          setShown(frac * e);
          setNum(Math.round(score * e));
          if (t < 1) rafId = requestAnimationFrame(tick);
        };
        setShown(0);
        setNum(0);
        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    // RC: cancel the in-flight count-up rAF on unmount / dep change, not just
    // the observer — otherwise the chain keeps calling setState post-unmount.
    return () => {
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [frac, score]);

  const needleDeg = -90 + shown * 180;
  const dashOffset = ARC_LEN * (1 - shown);

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrapper} ${className ?? ''}`}
      role="img"
      // `role="img"` hides the visible readout from assistive tech, so the
      // label carries the reading itself (2026-10-18 compliance pass: it was
      // the caption alone, with no number). The FINAL score, never the
      // count-up value, and the same `N/M` form the page shows.
      aria-label={`${ariaLabel}: ${score}/${max_score}`}
    >
      <svg className={styles.gauge} viewBox="0 0 400 230" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="market-gauge-track" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className={styles.stop0} />
            <stop offset="0.5" className={styles.stop1} />
            <stop offset="1" className={styles.stop2} />
          </linearGradient>
        </defs>
        <path
          className={styles.track}
          d="M40 200 A160 160 0 0 1 360 200"
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          className={styles.value}
          d="M40 200 A160 160 0 0 1 360 200"
          fill="none"
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={dashOffset}
        />
        <text x="34" y="222" className={styles.tick}>
          0
        </text>
        <text x="366" y="222" textAnchor="end" className={styles.tick}>
          {max_score}
        </text>
        {/* A pointer near the arc, not a needle from the centre: a full needle
            crossed the score readout for every mid-range score (the readout
            sits in the bowl). Visual pass 2026-11-11. */}
        <g transform={`rotate(${needleDeg} 200 200)`}>
          <line
            className={styles.needle}
            x1="200"
            y1="92"
            x2="200"
            y2="52"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className={styles.readout}>
        <span className={styles.score}>{num}</span>
        <span className={styles.max}>/&nbsp;{max_score}</span>
      </div>
    </div>
  );
}
