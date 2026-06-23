'use client';

/**
 * useInView — fire once when an element scrolls into view (draw-on trigger).
 *
 * Reduced-motion-safe: when the user prefers reduced motion (or JS/IO is
 * unavailable) `inView` starts `true`, so draw-on visuals render their FINAL
 * state immediately with no animation. Otherwise it flips to `true` once, on
 * first intersection, then disconnects.
 *
 * Mirrors the IntersectionObserver + `ran`-guard + cleanup pattern used by
 * `ScrollReveal` / `useCountUp` (Principle 11: observers cleared on unmount).
 *
 * @example
 * const { ref, inView } = useInView<SVGSVGElement>({ threshold: 0.4 });
 * return <svg ref={ref} className={inView ? 'is-drawn' : ''} />;
 */

import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseInViewOptions {
  /** Visibility ratio that counts as "in view" (default 0.4). */
  threshold?: number;
  /** IntersectionObserver rootMargin (default reveals slightly before fully in). */
  rootMargin?: string;
  /** Disable the observer entirely (always reports in-view). */
  enabled?: boolean;
}

interface UseInViewResult<T extends Element> {
  ref: RefObject<T>;
  inView: boolean;
}

export function useInView<T extends Element = HTMLElement>({
  threshold = 0.4,
  rootMargin = '0px 0px -10% 0px',
  enabled = true,
}: UseInViewOptions = {}): UseInViewResult<T> {
  const ref = useRef<T>(null);
  // SSR / no-JS / reduced-motion render the final (in-view) state with no flash.
  const [inView, setInView] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to final state when disabled
      setInView(true);
      return;
    }
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver !== 'function') {
      setInView(true);
      return;
    }
    if (ran.current) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || ran.current) return;
        ran.current = true;
        io.disconnect();
        setInView(true);
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, enabled]);

  return { ref, inView };
}
