/**
 * useSmoothScroll Hook
 *
 * Domain-Driven Design: Smooth scrolling behavior abstraction
 * Accessibility: Respects prefers-reduced-motion
 * Reusability: Generic hook for smooth scroll to elements
 */

import { useCallback, useRef } from 'react';

export interface UseSmoothScrollOptions {
  /**
   * Offset from top in pixels (useful for sticky headers)
   * @default 0
   */
  offset?: number;

  /**
   * Scroll behavior ('smooth' | 'instant' | 'auto')
   * @default 'smooth'
   */
  behavior?: ScrollBehavior;

  /**
   * Duration of scroll animation in milliseconds (for custom implementation)
   * @default 800
   */
  duration?: number;

  /**
   * Easing function for custom scroll implementation
   * @default 'easeInOutCubic'
   */
  easing?: 'linear' | 'easeInOutCubic' | 'easeInOutQuad';

  /**
   * Callback when scroll completes
   */
  onComplete?: () => void;

  /**
   * Whether to use native smooth scroll or custom implementation
   * @default true (native)
   */
  useNative?: boolean;
}

export interface SmoothScrollResult {
  /**
   * Scroll to an element by ID
   */
  scrollToElement: (elementId: string) => void;

  /**
   * Scroll to a specific position
   */
  scrollToPosition: (position: number) => void;

  /**
   * Scroll to top of page
   */
  scrollToTop: () => void;

  /**
   * Whether a scroll is currently in progress
   */
  isScrolling: boolean;
}

/**
 * Easing functions for smooth scroll
 */
const easingFunctions = {
  linear: (t: number) => t,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

/**
 * Custom hook for smooth scrolling to elements or positions
 *
 * @param options Configuration options for smooth scroll
 * @returns Smooth scroll methods and state
 *
 * @example
 * ```tsx
 * const { scrollToElement, isScrolling } = useSmoothScroll({
 *   offset: 100, // Account for sticky header
 *   behavior: 'smooth',
 *   onComplete: () => console.log('Scroll complete')
 * });
 *
 * return (
 *   <button onClick={() => scrollToElement('section-1')}>
 *     Go to Section 1
 *   </button>
 * );
 * ```
 */
export function useSmoothScroll(
  options: UseSmoothScrollOptions = {}
): SmoothScrollResult {
  const {
    offset = 0,
    behavior = 'smooth',
    duration = 800,
    easing = 'easeInOutCubic',
    onComplete,
    useNative = true,
  } = options;

  const isScrollingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Check if user prefers reduced motion
   */
  const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /**
   * Native smooth scroll implementation
   */
  const nativeScrollTo = useCallback(
    (targetPosition: number) => {
      const scrollBehavior = prefersReducedMotion() ? 'auto' : behavior;

      window.scrollTo({
        top: targetPosition,
        behavior: scrollBehavior,
      });

      // Mark scroll as complete after a delay
      setTimeout(() => {
        isScrollingRef.current = false;
        onComplete?.();
      }, prefersReducedMotion() ? 0 : duration);
    },
    [behavior, duration, onComplete]
  );

  /**
   * Custom smooth scroll implementation
   */
  const customScrollTo = useCallback(
    (targetPosition: number) => {
      if (typeof window === 'undefined') return;

      const startPosition = window.pageYOffset || window.scrollY;
      const distance = targetPosition - startPosition;
      const startTime = performance.now();
      const easingFn = easingFunctions[easing];

      // If reduced motion is preferred, skip animation
      if (prefersReducedMotion()) {
        window.scrollTo(0, targetPosition);
        isScrollingRef.current = false;
        onComplete?.();
        return;
      }

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easingFn(progress);
        const currentPosition = startPosition + distance * easeProgress;

        window.scrollTo(0, currentPosition);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateScroll);
        } else {
          isScrollingRef.current = false;
          animationFrameRef.current = null;
          onComplete?.();
        }
      };

      // Cancel any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      isScrollingRef.current = true;
      animationFrameRef.current = requestAnimationFrame(animateScroll);
    },
    [duration, easing, onComplete]
  );

  /**
   * Scroll to element by ID
   */
  const scrollToElement = useCallback(
    (elementId: string) => {
      if (typeof window === 'undefined') return;

      const element = document.getElementById(elementId);
      if (!element) {
        // Dev: Element with ID "${elementId}" not found`);
        return;
      }

      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      if (useNative) {
        nativeScrollTo(offsetPosition);
      } else {
        customScrollTo(offsetPosition);
      }
    },
    [offset, useNative, nativeScrollTo, customScrollTo]
  );

  /**
   * Scroll to specific position
   */
  const scrollToPosition = useCallback(
    (position: number) => {
      if (typeof window === 'undefined') return;

      const targetPosition = Math.max(0, position - offset);

      if (useNative) {
        nativeScrollTo(targetPosition);
      } else {
        customScrollTo(targetPosition);
      }
    },
    [offset, useNative, nativeScrollTo, customScrollTo]
  );

  /**
   * Scroll to top of page
   */
  const scrollToTop = useCallback(() => {
    scrollToPosition(0);
  }, [scrollToPosition]);

  return {
    scrollToElement,
    scrollToPosition,
    scrollToTop,
    isScrolling: isScrollingRef.current,
  };
}

/**
 * Helper hook for scroll to element on mount
 *
 * @example
 * ```tsx
 * // Scroll to element on component mount
 * useScrollToElementOnMount('section-1', { offset: 100 });
 * ```
 */
export function useScrollToElementOnMount(
  elementId: string | null,
  options: UseSmoothScrollOptions = {}
): void {
  const { scrollToElement } = useSmoothScroll(options);

  useCallback(() => {
    if (elementId) {
      // Delay scroll to ensure DOM is ready
      setTimeout(() => scrollToElement(elementId), 100);
    }
  }, [elementId, scrollToElement]);
}
