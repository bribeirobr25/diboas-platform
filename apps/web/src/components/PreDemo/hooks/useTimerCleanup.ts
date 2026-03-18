'use client';

/**
 * useTimerCleanup
 *
 * Simple utility hook for components that use setTimeout in event handlers.
 * Stores the timer ID in a ref and clears it on unmount or before scheduling a new one.
 *
 * Usage:
 *   const schedule = useTimerCleanup();
 *   schedule(() => setCopied(false), 2000);
 */

import { useCallback, useEffect, useRef } from 'react';

export function useTimerCleanup() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);

  return schedule;
}
