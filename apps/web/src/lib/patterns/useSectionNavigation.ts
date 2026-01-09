/**
 * Section Navigation Hook
 *
 * Navigation with race condition prevention
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import type { BaseSectionContentItem } from './SectionPattern';

interface UseSectionNavigationOptions {
  enableLoop?: boolean;
  throttleMs?: number;
  onNavigate?: (fromIndex: number, toIndex: number, method: string) => void;
}

export type NavigationMethod = 'manual' | 'auto' | 'keyboard' | 'touch';

/**
 * Hook for section navigation with race condition prevention
 */
export function useSectionNavigation<T extends BaseSectionContentItem>(
  items: T[],
  options: UseSectionNavigationOptions = {}
) {
  const {
    enableLoop = true,
    throttleMs = 150,
    onNavigate
  } = options;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastNavigationTime = useRef(0);

  /**
   * Navigate to specific index with race condition prevention
   */
  const navigateToIndex = useCallback(async (
    targetIndex: number,
    method: NavigationMethod = 'manual'
  ) => {
    if (items.length === 0) return;

    // Validate target index
    if (targetIndex < 0 || targetIndex >= items.length) {
      if (!enableLoop) return;
      targetIndex = targetIndex < 0
        ? items.length - 1
        : targetIndex % items.length;
    }

    // Prevent rapid navigation (race condition prevention)
    const now = Date.now();
    if (now - lastNavigationTime.current < throttleMs) {
      Logger.debug('Navigation throttled', { targetIndex, method });
      return;
    }

    lastNavigationTime.current = now;

    if (targetIndex === activeIndex) return;

    setIsTransitioning(true);

    try {
      const previousIndex = activeIndex;
      setActiveIndex(targetIndex);

      onNavigate?.(previousIndex, targetIndex, method);

      Logger.debug('Navigation completed', {
        from: previousIndex,
        to: targetIndex,
        method,
        itemId: items[targetIndex]?.id
      });

    } catch (error) {
      Logger.error('Navigation failed', { error, targetIndex, method });
    } finally {
      // Reset transition state after a brief delay
      setTimeout(() => setIsTransitioning(false), 100);
    }
  }, [activeIndex, items, enableLoop, throttleMs, onNavigate]);

  /**
   * Navigate to next item
   */
  const navigateNext = useCallback((method: NavigationMethod = 'manual') => {
    navigateToIndex(activeIndex + 1, method);
  }, [activeIndex, navigateToIndex]);

  /**
   * Navigate to previous item
   */
  const navigatePrevious = useCallback((method: NavigationMethod = 'manual') => {
    navigateToIndex(activeIndex - 1, method);
  }, [activeIndex, navigateToIndex]);

  /**
   * Navigate to first item
   */
  const navigateFirst = useCallback((method: NavigationMethod = 'manual') => {
    navigateToIndex(0, method);
  }, [navigateToIndex]);

  /**
   * Navigate to last item
   */
  const navigateLast = useCallback((method: NavigationMethod = 'manual') => {
    navigateToIndex(items.length - 1, method);
  }, [items.length, navigateToIndex]);

  // Current item access
  const currentItem = useMemo(() => {
    return items[activeIndex] || null;
  }, [items, activeIndex]);

  // Navigation state
  const navigationState = useMemo(() => ({
    canNavigatePrevious: enableLoop || activeIndex > 0,
    canNavigateNext: enableLoop || activeIndex < items.length - 1,
    isFirst: activeIndex === 0,
    isLast: activeIndex === items.length - 1,
    progress: items.length > 0 ? (activeIndex + 1) / items.length : 0
  }), [activeIndex, items.length, enableLoop]);

  return {
    activeIndex,
    currentItem,
    isTransitioning,
    navigationState,
    navigateToIndex,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast
  };
}
