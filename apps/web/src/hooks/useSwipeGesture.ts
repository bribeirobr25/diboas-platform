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

import { useState, useCallback } from 'react';

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
   * Current touch position (for debugging/advanced use)
   */
  touchStart: number;

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
  enabled = true
}: UseSwipeGestureOptions = {}): UseSwipeGestureReturn {
  const [touchStart, setTouchStart] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);

  /**
   * Handle touch start event
   * Records initial touch position and timestamp
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    if (!touch) return;

    setTouchStart(touch.clientX);
    setTouchStartTime(Date.now());
  }, [enabled]);

  /**
   * Handle touch end event
   * Calculates swipe distance, velocity, and direction
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStart) return;

    const touch = e.changedTouches[0];
    if (!touch) {
      setTouchStart(0);
      setTouchStartTime(0);
      return;
    }

    const touchEnd = touch.clientX;
    const touchEndTime = Date.now();

    // Calculate swipe metrics
    const diff = touchStart - touchEnd;
    const distance = Math.abs(diff);
    const duration = touchEndTime - touchStartTime;
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

    // Reset state
    setTouchStart(0);
    setTouchStartTime(0);
  }, [
    enabled,
    touchStart,
    touchStartTime,
    threshold,
    velocityThreshold,
    onSwipeLeft,
    onSwipeRight
  ]);

  /**
   * Reset touch state manually
   */
  const reset = useCallback(() => {
    setTouchStart(0);
    setTouchStartTime(0);
  }, []);

  return {
    handleTouchStart,
    handleTouchEnd,
    touchStart,
    reset
  };
}
