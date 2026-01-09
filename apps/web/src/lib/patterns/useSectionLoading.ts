/**
 * Section Loading State Hook
 *
 * Manages loading states for section content
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import type { SectionLoadingState } from './SectionPattern';

interface UseSectionLoadingOptions {
  timeout?: number;
  onError?: (itemId: string, error: Error) => void;
  onSuccess?: (itemId: string) => void;
}

/**
 * Hook for managing section loading states
 */
export function useSectionLoading(
  items: string[] = [],
  options: UseSectionLoadingOptions = {}
) {
  const { timeout = 2000, onError, onSuccess } = options;

  const [loadingState, setLoadingState] = useState<SectionLoadingState>({
    isLoading: false,
    progress: 0,
    errors: new Set(),
    loaded: new Set(),
    loading: new Set()
  });

  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Handle loading error
   */
  const handleError = useCallback((itemId: string, error: Error) => {
    // Clear timeout
    const timeoutId = timeoutRefs.current.get(itemId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(itemId);
    }

    setLoadingState(prev => {
      const newLoading = new Set(prev.loading);
      const newErrors = new Set(prev.errors);

      newLoading.delete(itemId);
      newErrors.add(itemId);

      const totalProcessed = prev.loaded.size + newErrors.size;
      const progress = (totalProcessed / items.length) * 100;
      const isLoading = newLoading.size > 0;

      return {
        ...prev,
        isLoading,
        progress,
        loading: newLoading,
        errors: newErrors
      };
    });

    onError?.(itemId, error);

    Logger.warn(`Section item failed to load`, { itemId, error: error.message });
  }, [items.length, onError]);

  /**
   * Start loading an item
   */
  const startLoading = useCallback((itemId: string) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      loading: new Set(prev.loading).add(itemId)
    }));

    // Set timeout for loading
    if (timeout > 0) {
      const timeoutId = setTimeout(() => {
        const error = new Error(`Loading timeout for ${itemId}`);
        handleError(itemId, error);
      }, timeout);

      timeoutRefs.current.set(itemId, timeoutId);
    }
  }, [timeout, handleError]);

  /**
   * Mark item as successfully loaded
   */
  const markLoaded = useCallback((itemId: string) => {
    // Clear timeout
    const timeoutId = timeoutRefs.current.get(itemId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(itemId);
    }

    setLoadingState(prev => {
      const newLoading = new Set(prev.loading);
      const newLoaded = new Set(prev.loaded);

      newLoading.delete(itemId);
      newLoaded.add(itemId);

      const progress = (newLoaded.size / items.length) * 100;
      const isLoading = newLoading.size > 0;

      return {
        ...prev,
        isLoading,
        progress,
        loading: newLoading,
        loaded: newLoaded
      };
    });

    onSuccess?.(itemId);

    Logger.debug(`Section item loaded successfully`, { itemId });
  }, [items.length, onSuccess]);

  /**
   * Retry loading a failed item
   */
  const retryLoading = useCallback((itemId: string) => {
    setLoadingState(prev => {
      const newErrors = new Set(prev.errors);
      newErrors.delete(itemId);

      return {
        ...prev,
        errors: newErrors
      };
    });

    startLoading(itemId);
  }, [startLoading]);

  /**
   * Reset all loading states
   */
  const resetLoading = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();

    setLoadingState({
      isLoading: false,
      progress: 0,
      errors: new Set(),
      loaded: new Set(),
      loading: new Set()
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  return {
    ...loadingState,
    startLoading,
    markLoaded,
    handleError,
    retryLoading,
    resetLoading
  };
}
