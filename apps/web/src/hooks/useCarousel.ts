/**
 * useCarousel Hook
 *
 * Domain-Driven Design: Reusable carousel state and navigation management
 * Code Reusability & DRY: Eliminates duplicated carousel logic across 4 components
 * Concurrency Prevention: Uses StateMachine, MutexLock, and SafeInterval
 *
 * Used by: ProductCarousel, AppFeaturesCarousel, FeatureShowcase (2 variants)
 *
 * Phase 3.2.c (audit/2026-05-08): Split from a 365-LoC monolith into three
 * focused sub-modules. This file owns navigation state (`currentSlideIndex`,
 * `isTransitioning`) and the goToSlide/goToNext/goToPrev primitives; auto-
 * play and keyboard handling live in `./carousel/useCarouselAutoplay.ts`
 * and `./carousel/useCarouselKeyboard.ts` respectively. The public hook
 * surface is unchanged.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  SafeTimer,
  CleanupManager,
  MutexLock,
  StateMachine,
} from '@/lib/utils/RaceConditionPrevention';
import { useCarouselAutoplay, type CarouselState } from './carousel/useCarouselAutoplay';
import { useCarouselKeyboard } from './carousel/useCarouselKeyboard';

export interface UseCarouselOptions {
  /** Total number of slides in the carousel */
  totalSlides: number;
  /** Enable automatic slide rotation (default: true) */
  autoPlay?: boolean;
  /** Auto-play interval in milliseconds (default: 4000) */
  autoPlayInterval?: number;
  /** Slide transition duration in milliseconds (default: 500) */
  transitionDuration?: number;
  /** Pause auto-play on hover (default: true) */
  pauseOnHover?: boolean;
  /** Enable keyboard navigation (arrow keys) (default: true) */
  enableKeyboard?: boolean;
  /** Component name for logging and debugging */
  componentName: string;
  /** Callback when slide changes (with source: 'auto' or 'user') */
  onSlideChange?: (index: number, source: 'auto' | 'user') => void;
  /** Callback when user navigates (next/prev) */
  onNavigate?: (direction: 'next' | 'prev') => void;
  /** Callback when play/pause state changes */
  onPlayPause?: (isPlaying: boolean) => void;
  /** Initial slide index (default: 0) */
  initialSlide?: number;
}

export interface UseCarouselReturn {
  currentSlideIndex: number;
  isTransitioning: boolean;
  isAutoPlaying: boolean;
  goToSlide: (index: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
  /** Attach to onKeyDown */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Attach to onMouseEnter (pause on hover) */
  handleMouseEnter: () => void;
  /** Attach to onMouseLeave (resume on hover exit) */
  handleMouseLeave: () => void;
  togglePlayPause: () => void;
  reset: () => void;
}

export function useCarousel({
  totalSlides,
  autoPlay = true,
  autoPlayInterval = 4000,
  transitionDuration = 500,
  pauseOnHover = true,
  enableKeyboard = true,
  componentName,
  onSlideChange,
  onNavigate,
  onPlayPause,
  initialSlide = 0,
}: UseCarouselOptions): UseCarouselReturn {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlide);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Auto-play state lives in the parent so `goToSlide` can include it in
  // its dependency array — this preserves the original closure-snapshot
  // semantics where the in-flight transition timer reads the autoplay
  // value captured at click time, not the latest value.
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [wasAutoPlayingBeforeHover, setWasAutoPlayingBeforeHover] = useState(false);

  const cleanupManagerRef = useRef(new CleanupManager(componentName));
  const mutexRef = useRef(new MutexLock(componentName));
  const timerRef = useRef<SafeTimer | null>(null);

  const carouselStateRef = useRef(
    new StateMachine<CarouselState>(
      'idle',
      {
        idle: ['playing', 'paused'],
        playing: ['paused', 'transitioning'],
        paused: ['playing'],
        transitioning: ['playing', 'paused', 'idle'],
      },
      componentName
    )
  );

  /**
   * Navigate to a specific slide with race-condition prevention.
   * Returns void; rejects negative / out-of-range / current-index calls.
   */
  const goToSlide = useCallback(
    async (index: number, source: 'auto' | 'user' = 'user') => {
      if (index < 0 || index >= totalSlides || index === currentSlideIndex) return;

      const acquired = await mutexRef.current.acquire();
      if (!acquired) return;

      try {
        setIsTransitioning(true);
        carouselStateRef.current.transitionTo('transitioning');

        setCurrentSlideIndex(index);
        onSlideChange?.(index, source);

        timerRef.current = new SafeTimer(componentName);
        timerRef.current.set(() => {
          setIsTransitioning(false);
          carouselStateRef.current.transitionTo(isAutoPlaying ? 'playing' : 'paused');
        }, transitionDuration);
      } finally {
        mutexRef.current.release();
      }
    },
    [
      totalSlides,
      currentSlideIndex,
      componentName,
      onSlideChange,
      transitionDuration,
      isAutoPlaying,
    ]
  );

  const goToNext = useCallback(() => {
    const nextIndex = (currentSlideIndex + 1) % totalSlides;
    goToSlide(nextIndex, 'user');
    onNavigate?.('next');
  }, [currentSlideIndex, totalSlides, goToSlide, onNavigate]);

  const goToPrev = useCallback(() => {
    const prevIndex = currentSlideIndex === 0 ? totalSlides - 1 : currentSlideIndex - 1;
    goToSlide(prevIndex, 'user');
    onNavigate?.('prev');
  }, [currentSlideIndex, totalSlides, goToSlide, onNavigate]);

  // Internal auto-advance — fed to the auto-play sub-hook. Skips
  // `onNavigate` and tags the slide change as 'auto'.
  const goToSlideAuto = useCallback(() => {
    const nextIndex = (currentSlideIndex + 1) % totalSlides;
    goToSlide(nextIndex, 'auto');
  }, [currentSlideIndex, totalSlides, goToSlide]);

  const { togglePlayPause, handleMouseEnter, handleMouseLeave } = useCarouselAutoplay({
    totalSlides,
    autoPlayInterval,
    pauseOnHover,
    componentName,
    isAutoPlaying,
    setIsAutoPlaying,
    wasAutoPlayingBeforeHover,
    setWasAutoPlayingBeforeHover,
    carouselStateRef,
    mutexRef,
    cleanupManagerRef,
    goToSlideAuto,
    onPlayPause,
  });

  const { handleKeyDown } = useCarouselKeyboard({
    enableKeyboard,
    isTransitioning,
    totalSlides,
    goToPrev,
    goToNext,
    goToSlide,
    togglePlayPause,
  });

  const reset = useCallback(() => {
    setCurrentSlideIndex(initialSlide);
    setIsAutoPlaying(autoPlay);
    setIsTransitioning(false);
    setWasAutoPlayingBeforeHover(false);
    carouselStateRef.current.transitionTo('idle');
  }, [initialSlide, autoPlay]);

  // Cleanup on unmount.
  useEffect(() => {
    const cleanup = cleanupManagerRef.current;
    return () => {
      cleanup.destroy();
    };
  }, []);

  return {
    currentSlideIndex,
    isTransitioning,
    isAutoPlaying,
    goToSlide,
    goToNext,
    goToPrev,
    handleKeyDown,
    handleMouseEnter,
    handleMouseLeave,
    togglePlayPause,
    reset,
  };
}
