'use client';

/**
 * useCountUp — animate a number from `start` to `end` when it scrolls into view.
 *
 * Generalized from `components/Analytics/RegimeScore/RegimeScore.tsx`. The
 * initial state is the FINAL value, so SSR / no-JS / reduced-motion render the
 * real figure with no flash; the count-up runs once on first scroll-in only
 * when motion is allowed. Pass a `formatter` (e.g. `(n) => formatGain(n, locale)`)
 * so the animated figure ends on the exact live value.
 *
 * @example
 * const { ref, display } = useCountUp<HTMLSpanElement>({ end: gain, formatter: (n) => formatGain(n, locale) });
 * return <span ref={ref}>{display}</span>;
 */

import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseCountUpOptions {
  /** Target value (also the SSR / reduced-motion value). */
  end: number;
  /** Start of the animation (default 0). */
  start?: number;
  /** Animation duration in ms (default 1400). */
  duration?: number;
  /** Format the (possibly fractional) animated value for display. */
  formatter?: (value: number) => string | number;
  /** IntersectionObserver visibility threshold (default 0.4). */
  threshold?: number;
  /** Disable the animation entirely (always shows `end`). */
  enabled?: boolean;
}

interface UseCountUpResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  value: number;
  display: string | number;
}

export function useCountUp<T extends HTMLElement = HTMLSpanElement>({
  end,
  start = 0,
  duration = 1400,
  formatter,
  threshold = 0.4,
  enabled = true,
}: UseCountUpOptions): UseCountUpResult<T> {
  const ref = useRef<T>(null);
  // Initialize to the final value — SSR / no-JS / reduced-motion show it as-is.
  const [value, setValue] = useState(end);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to the final value when animation is skipped / `end` changes after mount
      setValue(end);
      return;
    }
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(end);
      return;
    }
    // Already animated once (e.g. `end` changed after a market-data refresh):
    // don't replay — snap to the latest target so the figure never goes stale.
    if (ran.current) {
      setValue(end);
      return;
    }

    let rafId = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || ran.current) return;
        ran.current = true;
        io.disconnect();
        const t0 = performance.now();
        setValue(start);
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
          setValue(start + (end - start) * eased);
          if (t < 1) rafId = requestAnimationFrame(tick);
          else setValue(end); // land exactly on the target
        };
        rafId = requestAnimationFrame(tick);
      },
      { threshold }
    );
    io.observe(el);
    // Store + cancel the rAF in cleanup (race-condition standard: timers/loops
    // must be torn down on unmount or dep change to avoid setState-after-unmount).
    return () => {
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [end, start, duration, threshold, enabled]);

  return { ref, value, display: formatter ? formatter(value) : value };
}
