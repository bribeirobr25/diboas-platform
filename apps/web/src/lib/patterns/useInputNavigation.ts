/**
 * Input Navigation Hooks
 *
 * Keyboard and touch navigation support
 */

import { useEffect, useRef, useCallback } from 'react';
import { Logger } from '@/lib/monitoring/Logger';

export type NavigationDirection = 'previous' | 'next' | 'first' | 'last';
export type SwipeDirection = 'previous' | 'next';

/**
 * Hook for keyboard navigation support
 */
export function useKeyboardNavigation(
  onNavigate: (direction: NavigationDirection) => void,
  enabled: boolean = true,
  customKeyMap: Record<string, string> = {}
) {
  const defaultKeyMap: Record<string, string> = {
    ArrowLeft: 'previous',
    ArrowRight: 'next',
    Home: 'first',
    End: 'last',
    ...customKeyMap
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const action = defaultKeyMap[event.key];
    if (action && ['previous', 'next', 'first', 'last'].includes(action)) {
      event.preventDefault();
      onNavigate(action as NavigationDirection);

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

interface UseTouchNavigationOptions {
  threshold?: number;
  maxTime?: number;
  minVelocity?: number;
}

/**
 * Hook for touch/swipe navigation support
 */
export function useTouchNavigation(
  onNavigate: (direction: SwipeDirection) => void,
  enabled: boolean = true,
  options: UseTouchNavigationOptions = {}
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

    const direction: SwipeDirection = deltaX > 0 ? 'previous' : 'next';
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
