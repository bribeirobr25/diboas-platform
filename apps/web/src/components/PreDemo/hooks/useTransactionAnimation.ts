/**
 * useTransactionAnimation Hook
 *
 * Processing -> success screen timing (setTimeout-based state machine)
 */

import { useCallback, useRef } from 'react';
import { PROCESSING_TIMING, type PreDemoScreen } from '@/lib/pre-demo';

interface UseTransactionAnimationProps {
  setScreen: (screen: PreDemoScreen) => void;
}

export function useTransactionAnimation({ setScreen }: UseTransactionAnimationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  }, []);

  const startProcessing = useCallback(
    (processingScreen: PreDemoScreen, successScreen: PreDemoScreen, onComplete?: () => void) => {
      clearTimers();

      setScreen(processingScreen);

      const t1 = setTimeout(() => {
        setScreen(successScreen);
      }, PROCESSING_TIMING.processingDelay);
      timerRef.current.push(t1);

      if (onComplete) {
        const t2 = setTimeout(() => {
          onComplete();
        }, PROCESSING_TIMING.processingDelay + PROCESSING_TIMING.completeDelay);
        timerRef.current.push(t2);
      }
    },
    [setScreen, clearTimers],
  );

  return { startProcessing, clearTimers };
}
