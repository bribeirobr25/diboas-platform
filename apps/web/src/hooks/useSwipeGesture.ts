/**
 * useSwipeGesture Hook
 *
 * Domain-Driven Design: Reusable touch gesture handling
 * Code Reusability & DRY: Eliminates duplicated swipe logic across 4 carousel components
 * Error Handling: Gracefully handles edge cases (no touch support, incomplete gestures)
 *
 * Used by: ProductCarousel, AppFeaturesCarousel, FeatureShowcase (2 variants)
 */

'use client';

import { useRef, useCallback } from 'react';

export interface UseSwipeGestureOptions {
  /**
   * Callback when user swipes left
   */
  onSwipeLeft?: () => void;

  /**
   * Callback when user swipes right
   */
  onSwipeRight?: () => void;

  /**
   * Minimum swipe distance in pixels to trigger action
   * @default 50
   */
  threshold?: number;

  /**
   * Minimum swipe velocity (pixels per millisecond) to trigger action
   * @default 0.3
   */
  velocityThreshold?: number;

  /**
   * Enable/disable swipe gesture detection
   * @default true
   */
  enabled?: boolean;
}

export interface UseSwipeGestureReturn {
  /**
   * Touch start handler
   * Attach to onTouchStart prop
   */
  handleTouchStart: (e: React.TouchEvent) => void;

  /**
   * Touch end handler
   * Attach to onTouchEnd prop
   */
  handleTouchEnd: (e: React.TouchEvent) => void;

  /**
   * Current touch position ref (for debugging/advanced use)
   */
  touchStartRef: React.RefObject<number>;

  /**
   * Reset touch state
   */
  reset: () => void;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocityThreshold = 0.3,
  enabled = true,
}: UseSwipeGestureOptions = {}): UseSwipeGestureReturn {
  const touchStartRef = useRef(0);
  const touchStartTimeRef = useRef(0);

  /**
   * Handle touch start event
   * Records initial touch position and timestamp
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;

      const touch = e.touches[0];
      if (!touch) return;

      touchStartRef.current = touch.clientX;
      touchStartTimeRef.current = Date.now();
    },
    [enabled]
  );

  /**
   * Handle touch end event
   * Calculates swipe distance, velocity, and direction
   */
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartRef.current = 0;
        touchStartTimeRef.current = 0;
        return;
      }

      const touchEnd = touch.clientX;
      const touchEndTime = Date.now();

      // Calculate swipe metrics
      const diff = touchStartRef.current - touchEnd;
      const distance = Math.abs(diff);
      const duration = touchEndTime - touchStartTimeRef.current;
      const velocity = duration > 0 ? distance / duration : 0;

      // Determine if swipe meets threshold requirements
      const meetsDistanceThreshold = distance > threshold;
      const meetsVelocityThreshold = velocity > velocityThreshold;

      if (meetsDistanceThreshold && meetsVelocityThreshold) {
        if (diff > 0) {
          // Swiped left (next)
          onSwipeLeft?.();
        } else {
          // Swiped right (previous)
          onSwipeRight?.();
        }
      }

      // Reset refs
      touchStartRef.current = 0;
      touchStartTimeRef.current = 0;
    },
    [enabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight]
  );

  /**
   * Reset touch state manually
   */
  const reset = useCallback(() => {
    touchStartRef.current = 0;
    touchStartTimeRef.current = 0;
  }, []);

  return {
    handleTouchStart,
    handleTouchEnd,
    touchStartRef,
    reset,
  };
}
