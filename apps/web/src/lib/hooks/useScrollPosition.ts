/**
 * useScrollPosition Hook
 *
 * Domain-Driven Design: Scroll position tracking abstraction
 * Performance Optimization: Throttled scroll event handling
 * Reusability: Generic hook for any scroll tracking needs
 */

import { useEffect, useState, useCallback } from 'react';

export interface UseScrollPositionOptions {
  /**
   * Throttle delay in milliseconds (default: 100ms)
   */
  throttleMs?: number;

  /**
   * Element to track scroll position (default: window)
   */
  element?: HTMLElement | Window | null;
}

export interface ScrollPosition {
  /**
   * Current scroll Y position
   */
  scrollY: number;

  /**
   * Current scroll X position
   */
  scrollX: number;

  /**
   * Whether user is scrolling down
   */
  isScrollingDown: boolean;

  /**
   * Previous scroll Y position
   */
  previousScrollY: number;
}

/**
 * Custom hook to track scroll position with throttling
 *
 * @param options Configuration options for scroll tracking
 * @returns Current scroll position and direction
 *
 * @example
 * ```tsx
 * const { scrollY, isScrollingDown } = useScrollPosition({ throttleMs: 100 });
 *
 * if (scrollY > 200 && isScrollingDown) {
 *   // Condense navigation
 * }
 * ```
 */
export function useScrollPosition(
  options: UseScrollPositionOptions = {}
): ScrollPosition {
  const { throttleMs = 100, element = typeof window !== 'undefined' ? window : null } = options;

  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    scrollY: 0,
    scrollX: 0,
    isScrollingDown: false,
    previousScrollY: 0,
  });

  const updateScrollPosition = useCallback(() => {
    if (!element) return;

    const currentScrollY = element instanceof Window
      ? window.scrollY || window.pageYOffset
      : element.scrollTop;

    const currentScrollX = element instanceof Window
      ? window.scrollX || window.pageXOffset
      : element.scrollLeft;

    setScrollPosition((prev) => ({
      scrollY: currentScrollY,
      scrollX: currentScrollX,
      isScrollingDown: currentScrollY > prev.scrollY,
      previousScrollY: prev.scrollY,
    }));
  }, [element]);

  useEffect(() => {
    if (!element) return;

    // Performance: Throttle scroll events
    let timeoutId: NodeJS.Timeout | null = null;
    let lastRan = 0;

    const handleScroll = () => {
      const now = Date.now();

      if (now - lastRan >= throttleMs) {
        updateScrollPosition();
        lastRan = now;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateScrollPosition();
          lastRan = Date.now();
        }, throttleMs - (now - lastRan));
      }
    };

    // Initialize scroll position
    updateScrollPosition();

    // Attach scroll listener
    element.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [element, throttleMs, updateScrollPosition]);

  return scrollPosition;
}
