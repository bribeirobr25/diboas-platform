'use client';

/**
 * Animated Counter Hook
 *
 * Animates a number from current value to target value
 * Uses ease-out cubic for smooth deceleration
 */

import { useState, useEffect, useRef } from 'react';

interface UseAnimatedCounterOptions {
  duration?: number;
  threshold?: number;
}

export function useAnimatedCounter(
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
) {
  const { duration = 1000, threshold = 1 } = options;

  const [displayValue, setDisplayValue] = useState(0);
  const previousTarget = useRef(targetValue);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Only animate if target changed significantly
    if (Math.abs(targetValue - previousTarget.current) < threshold) {
      setDisplayValue(targetValue);
      return;
    }

    const startValue = displayValue;
    const startTime = performance.now();
    const difference = targetValue - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + difference * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousTarget.current = targetValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, threshold]);

  return Math.round(displayValue);
}
