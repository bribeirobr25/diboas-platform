'use client';

/**
 * Focus Trap Hook
 *
 * WCAG 2.4.3 compliant focus management for modals and dialogs.
 * Traps focus within a container, cycling through focusable elements.
 *
 * Usage:
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(modalRef, isOpen);
 *
 * return <div ref={modalRef}>...</div>;
 * ```
 */

import { useEffect, useRef, RefObject } from 'react';

/** Selector for all focusable elements */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface UseFocusTrapOptions {
  /** Auto-focus first focusable element when trap activates */
  autoFocus?: boolean;
  /** Return focus to previously focused element when trap deactivates */
  returnFocus?: boolean;
  /** Initial element to focus (selector or element) */
  initialFocus?: string | HTMLElement;
}

/**
 * Hook to trap focus within a container element
 *
 * @param containerRef - Ref to the container element
 * @param isActive - Whether the focus trap is active
 * @param options - Focus trap options
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean,
  options: UseFocusTrapOptions = {}
): void {
  const { autoFocus = true, returnFocus = true, initialFocus } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the previously focused element
    if (returnFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
      );
    };

    // Focus initial element or first focusable
    if (autoFocus) {
      requestAnimationFrame(() => {
        const focusableElements = getFocusableElements();

        if (initialFocus) {
          const initialElement =
            typeof initialFocus === 'string'
              ? container.querySelector<HTMLElement>(initialFocus)
              : initialFocus;

          if (initialElement && focusableElements.includes(initialElement)) {
            initialElement.focus();
            return;
          }
        }

        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      });
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab on first element -> focus last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab on last element -> focus first
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, containerRef, autoFocus, returnFocus, initialFocus]);
}

export default useFocusTrap;
