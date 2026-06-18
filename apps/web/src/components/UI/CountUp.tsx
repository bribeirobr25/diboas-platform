'use client';

/**
 * CountUp — render a number that animates up to its live value on scroll-in.
 *
 * Thin presentational wrapper around `useCountUp` so multiple figures (e.g. each
 * table cell) can animate without calling hooks in a loop. SSR / no-JS /
 * reduced-motion render the final value with no flash.
 */

import { type ElementType } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface CountUpProps {
  /** Target (and SSR / reduced-motion) value. */
  end: number;
  start?: number;
  duration?: number;
  /** Format the animated value (e.g. `(n) => formatGain(n, locale)`). */
  formatter?: (value: number) => string | number;
  threshold?: number;
  enabled?: boolean;
  className?: string;
  as?: ElementType;
}

export function CountUp({
  end,
  start,
  duration,
  formatter,
  threshold,
  enabled,
  className,
  as: Tag = 'span',
}: CountUpProps) {
  const { ref, display } = useCountUp<HTMLElement>({
    end,
    start,
    duration,
    formatter,
    threshold,
    enabled,
  });
  return (
    <Tag ref={ref} className={className}>
      {display}
    </Tag>
  );
}
