/**
 * Shared Section React Hooks
 * 
 * Reusable React hooks extracted from FeatureShowcase component
 * Provides consistent behavior patterns across all sections
 * 
 * Concurrency & Race Condition Prevention: Safe state management hooks
 * Performance & SEO Optimization: Optimized hook implementations
 * Error Handling & System Recovery: Error-resilient hook patterns
 * Monitoring & Observability: Built-in logging and tracking
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import type {
  SectionLoadingState,
  SectionAnalyticsService,
  SectionAnalyticsConfig,
  SectionPerformanceConfig,
  SectionErrorHandler,
  BaseSectionContentItem
} from './SectionPattern';

// ================================
// LOADING STATE HOOKS
// ================================

/**
 * Hook for managing section loading states
 * Based on FeatureShowcase image loading implementation
 */
export function useSectionLoading(
  items: string[] = [],
  options: {
    timeout?: number;
    onError?: (itemId: string, error: Error) => void;
    onSuccess?: (itemId: string) => void;
  } = {}
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
  }, [timeout]);
  
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

// ================================
// ANALYTICS HOOKS
// ================================

/**
 * Hook for section analytics integration
 * Based on FeatureShowcase analytics implementation
 */
export function useSectionAnalytics(
  analyticsService: SectionAnalyticsService,
  config: SectionAnalyticsConfig,
  enabled: boolean = true
) {
  const lastTrackTime = useRef<Map<string, number>>(new Map());
  
  /**
   * Track an analytics event with throttling
   */
  const trackEvent = useCallback(async (
    eventType: keyof SectionAnalyticsConfig['events'] | string,
    properties: Record<string, unknown> = {},
    throttleMs: number = 100
  ) => {
    if (!enabled || !config.enabled) return;
    
    const eventName = typeof eventType === 'string' && eventType in config.events
      ? config.events[eventType as keyof SectionAnalyticsConfig['events']]
      : eventType;
    
    const fullEventName = `${config.trackingPrefix}_${eventName}`;
    
    // Throttle rapid events
    const now = Date.now();
    const lastTrack = lastTrackTime.current.get(fullEventName) || 0;
    
    if (now - lastTrack < throttleMs) {
      Logger.debug(`Analytics event throttled: ${fullEventName}`);
      return;
    }
    
    lastTrackTime.current.set(fullEventName, now);
    
    try {
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        section: config.trackingPrefix,
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      await analyticsService.trackEvent(fullEventName, enrichedProperties);
      
      Logger.debug(`Analytics event tracked: ${fullEventName}`, enrichedProperties);
      
    } catch (error) {
      Logger.warn(`Failed to track analytics event: ${fullEventName}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        properties 
      });
    }
  }, [enabled, config, analyticsService]);
  
  /**
   * Track section view event
   */
  const trackSectionView = useCallback(async (
    sectionId: string,
    additionalProperties: Record<string, unknown> = {}
  ) => {
    try {
      await analyticsService.trackSectionView(sectionId, {
        ...additionalProperties,
        trackingPrefix: config.trackingPrefix
      });
      
      Logger.debug(`Section view tracked: ${sectionId}`);
      
    } catch (error) {
      Logger.warn(`Failed to track section view: ${sectionId}`, { error });
    }
  }, [analyticsService, config.trackingPrefix]);
  
  /**
   * Track interaction event with context
   */
  const trackInteraction = useCallback(async (
    interactionType: string,
    target: string,
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('interaction', {
      interactionType,
      target,
      ...properties
    });
  }, [trackEvent]);
  
  /**
   * Track CTA click with attribution
   */
  const trackCTAClick = useCallback(async (
    ctaId: string,
    ctaText: string,
    ctaHref: string,
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('cta_click', {
      ctaId,
      ctaText,
      ctaHref,
      ...properties
    });
  }, [trackEvent]);
  
  /**
   * Track navigation event
   */
  const trackNavigation = useCallback(async (
    fromIndex: number,
    toIndex: number,
    method: 'manual' | 'auto' | 'keyboard' | 'touch',
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('navigation', {
      fromIndex,
      toIndex,
      method,
      ...properties
    });
  }, [trackEvent]);
  
  /**
   * Track error event
   */
  const trackError = useCallback(async (
    errorType: string,
    errorMessage: string,
    context: string,
    properties: Record<string, unknown> = {}
  ) => {
    await trackEvent('error', {
      errorType,
      errorMessage,
      context,
      ...properties
    });
  }, [trackEvent]);
  
  return {
    trackEvent,
    trackSectionView,
    trackInteraction,
    trackCTAClick,
    trackNavigation,
    trackError,
    getHealthStatus: () => analyticsService.getHealthStatus()
  };
}

// ================================
// NAVIGATION HOOKS
// ================================

/**
 * Hook for section navigation with race condition prevention
 * Based on FeatureShowcase navigation implementation
 */
export function useSectionNavigation<T extends BaseSectionContentItem>(
  items: T[],
  options: {
    enableLoop?: boolean;
    throttleMs?: number;
    onNavigate?: (fromIndex: number, toIndex: number, method: string) => void;
  } = {}
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
    method: 'manual' | 'auto' | 'keyboard' | 'touch' = 'manual'
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
  const navigateNext = useCallback((method: string = 'manual') => {
    navigateToIndex(activeIndex + 1, method as any);
  }, [activeIndex, navigateToIndex]);
  
  /**
   * Navigate to previous item
   */
  const navigatePrevious = useCallback((method: string = 'manual') => {
    navigateToIndex(activeIndex - 1, method as any);
  }, [activeIndex, navigateToIndex]);
  
  /**
   * Navigate to first item
   */
  const navigateFirst = useCallback((method: string = 'manual') => {
    navigateToIndex(0, method as any);
  }, [navigateToIndex]);
  
  /**
   * Navigate to last item
   */
  const navigateLast = useCallback((method: string = 'manual') => {
    navigateToIndex(items.length - 1, method as any);
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

// ================================
// KEYBOARD NAVIGATION HOOKS
// ================================

/**
 * Hook for keyboard navigation support
 * Based on FeatureShowcase accessibility implementation
 */
export function useKeyboardNavigation(
  onNavigate: (direction: 'previous' | 'next' | 'first' | 'last') => void,
  enabled: boolean = true,
  customKeyMap: Record<string, string> = {}
) {
  const defaultKeyMap = {
    ArrowLeft: 'previous',
    ArrowRight: 'next',
    Home: 'first',
    End: 'last',
    ...customKeyMap
  };
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    const action = defaultKeyMap[event.key as keyof typeof defaultKeyMap];
    if (action) {
      event.preventDefault();
      onNavigate(action as any);
      
      Logger.debug('Keyboard navigation', { 
        key: event.key, 
        action 
      });
    }
  }, [enabled, defaultKeyMap, onNavigate]);
  
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
  
  return {
    handleKeyDown
  };
}

// ================================
// TOUCH NAVIGATION HOOKS
// ================================

/**
 * Hook for touch/swipe navigation support
 * Based on FeatureShowcase touch implementation
 */
export function useTouchNavigation(
  onNavigate: (direction: 'previous' | 'next') => void,
  enabled: boolean = true,
  options: {
    threshold?: number;
    maxTime?: number;
    minVelocity?: number;
  } = {}
) {
  const { 
    threshold = 40, 
    maxTime = 500, 
    minVelocity = 0.3 
  } = options;
  
  const touchState = useRef({
    startX: 0,
    startTime: 0,
    currentX: 0,
    isDragging: false
  });
  
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enabled || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startTime: Date.now(),
      currentX: touch.clientX,
      isDragging: true
    };
  }, [enabled]);
  
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!enabled || !touchState.current.isDragging || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    touchState.current.currentX = touch.clientX;
  }, [enabled]);
  
  const handleTouchEnd = useCallback(() => {
    if (!enabled || !touchState.current.isDragging) return;
    
    const { startX, startTime, currentX } = touchState.current;
    const deltaX = currentX - startX;
    const deltaTime = Date.now() - startTime;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    touchState.current.isDragging = false;
    
    // Check if swipe meets criteria
    if (deltaTime > maxTime) return;
    if (Math.abs(deltaX) < threshold && velocity < minVelocity) return;
    
    const direction = deltaX > 0 ? 'previous' : 'next';
    onNavigate(direction);
    
    Logger.debug('Touch navigation', {
      direction,
      deltaX,
      deltaTime,
      velocity
    });
  }, [enabled, threshold, maxTime, minVelocity, onNavigate]);
  
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Get or create session ID for analytics
 */
function getSessionId(): string {
  const sessionKey = 'diboas_session_id';
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
}