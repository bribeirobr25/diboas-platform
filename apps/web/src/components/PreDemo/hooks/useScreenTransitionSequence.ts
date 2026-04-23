'use client';

/**
 * useScreenTransitionSequence
 *
 * Manages timed screen transition sequences for the PreDemo flow.
 * Lives at PreDemoContent level (persists across screen changes)
 * so timers survive child component unmounts.
 *
 * Solves the timer-then-unmount pattern where a component sets
 * timers and then changes state that unmounts itself.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { PreDemoScreen } from '@/lib/pre-demo';

export interface TransitionStep {
  screen: PreDemoScreen;
  delayMs: number;
  /** Optional callback fired when this step is reached (e.g., dispatch, analytics, events) */
  onReach?: () => void;
}

export function useScreenTransitionSequence(
  setScreen: (screen: PreDemoScreen) => void
) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up all timers on unmount (PreDemoContent closes)
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const runSequence = useCallback(
    (steps: TransitionStep[]) => {
      // Clear any previous sequence
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      steps.forEach(({ screen, delayMs, onReach }) => {
        if (delayMs === 0) {
          // Execute immediately (synchronous) — no timer to track
          setScreen(screen);
          onReach?.();
        } else {
          const id = setTimeout(() => {
            setScreen(screen);
            onReach?.();
          }, delayMs);
          timersRef.current.push(id);
        }
      });
    },
    [setScreen]
  );

  return { runSequence };
}
