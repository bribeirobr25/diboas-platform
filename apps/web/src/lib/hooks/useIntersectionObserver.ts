/**
 * useIntersectionObserver Hook
 *
 * Domain-Driven Design: Viewport intersection tracking abstraction
 * Performance Optimization: Efficient element visibility detection
 * Reusability: Generic hook for any intersection observation needs
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export interface UseIntersectionObserverOptions {
  /**
   * Intersection threshold (0-1)
   * @default 0.5
   */
  threshold?: number | number[];

  /**
   * Root margin for intersection calculation
   * @example '-100px 0px 0px 0px' (top, right, bottom, left)
   */
  rootMargin?: string;

  /**
   * Root element for intersection (default: viewport)
   */
  root?: Element | null;

  /**
   * Enable/disable observer
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when intersection changes
   */
  onChange?: (entry: IntersectionObserverEntry) => void;
}

export interface IntersectionResult {
  /**
   * Whether the element is currently intersecting
   */
  isIntersecting: boolean;

  /**
   * The intersection observer entry
   */
  entry: IntersectionObserverEntry | null;

  /**
   * Ref to attach to the observed element
   */
  ref: React.RefObject<HTMLElement>;
}

/**
 * Custom hook to observe element intersection with viewport
 *
 * @param options Configuration options for intersection observer
 * @returns Intersection state and element ref
 *
 * @example
 * ```tsx
 * const { isIntersecting, ref } = useIntersectionObserver({
 *   threshold: 0.5,
 *   rootMargin: '-100px 0px 0px 0px',
 *   onChange: (entry) => console.log('Intersection:', entry.isIntersecting)
 * });
 *
 * return <div ref={ref}>Content</div>;
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): IntersectionResult {
  const {
    threshold = 0.5,
    rootMargin = '0px',
    root = null,
    enabled = true,
    onChange,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [observerEntry] = entries;

      setIsIntersecting(observerEntry.isIntersecting);
      setEntry(observerEntry);

      // Call custom onChange callback
      if (onChange) {
        onChange(observerEntry);
      }
    },
    [onChange]
  );

  useEffect(() => {
    const element = elementRef.current;

    // Bail early if observer is not supported or not enabled
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Create intersection observer
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      root,
    });

    // Observe element
    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, root, handleIntersection]);

  return {
    isIntersecting,
    entry,
    ref: elementRef,
  };
}

/**
 * useMultipleIntersectionObserver Hook
 *
 * Observes multiple elements and returns their intersection states
 *
 * @param options Configuration options for intersection observer
 * @returns Map of element IDs to intersection states
 *
 * @example
 * ```tsx
 * const { registerElement, getIntersectionState } = useMultipleIntersectionObserver({
 *   threshold: 0.5,
 *   onChange: (id, isIntersecting) => console.log(id, isIntersecting)
 * });
 *
 * return (
 *   <>
 *     <div ref={registerElement('section-1')}>Section 1</div>
 *     <div ref={registerElement('section-2')}>Section 2</div>
 *   </>
 * );
 * ```
 */
export interface MultipleIntersectionResult {
  /**
   * Register an element for observation
   */
  registerElement: (id: string) => (element: HTMLElement | null) => void;

  /**
   * Get intersection state for an element ID
   */
  getIntersectionState: (id: string) => boolean;

  /**
   * Map of all element intersection states
   */
  intersectionStates: Map<string, boolean>;
}

export interface UseMultipleIntersectionObserverOptions {
  /**
   * Intersection threshold (0-1)
   * @default 0.5
   */
  threshold?: number | number[];

  /**
   * Root margin for intersection calculation
   * @example '-100px 0px 0px 0px' (top, right, bottom, left)
   */
  rootMargin?: string;

  /**
   * Root element for intersection (default: viewport)
   */
  root?: Element | null;

  /**
   * Enable/disable observer
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when any element's intersection changes
   */
  onChange?: (id: string, isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
}

export function useMultipleIntersectionObserver(
  options: UseMultipleIntersectionObserverOptions = {}
): MultipleIntersectionResult {
  const {
    threshold = 0.5,
    rootMargin = '0px',
    root = null,
    enabled = true,
    onChange,
  } = options;

  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [intersectionStates, setIntersectionStates] = useState<Map<string, boolean>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const id = element.dataset.intersectionId;

        if (!id) return;

        setIntersectionStates((prev) => {
          const next = new Map(prev);
          next.set(id, entry.isIntersecting);
          return next;
        });

        // Call custom onChange callback
        if (onChange) {
          onChange(id, entry.isIntersecting, entry);
        }
      });
    },
    [onChange]
  );

  useEffect(() => {
    // Bail early if observer is not supported or not enabled
    if (!enabled || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
      root,
    });

    // Observe all registered elements
    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [enabled, threshold, rootMargin, root, handleIntersection]);

  const registerElement = useCallback(
    (id: string) => (element: HTMLElement | null) => {
      if (!element) {
        // Unregister element
        const existingElement = elementsRef.current.get(id);
        if (existingElement && observerRef.current) {
          observerRef.current.unobserve(existingElement);
        }
        elementsRef.current.delete(id);
        // Don't update state during ref callback - let IntersectionObserver handle it
        return;
      }

      // Store element ID as data attribute
      element.dataset.intersectionId = id;

      // Register element
      elementsRef.current.set(id, element);

      // Observe element if observer is ready
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    },
    []
  );

  const getIntersectionState = useCallback(
    (id: string): boolean => {
      return intersectionStates.get(id) || false;
    },
    [intersectionStates]
  );

  return {
    registerElement,
    getIntersectionState,
    intersectionStates,
  };
}
