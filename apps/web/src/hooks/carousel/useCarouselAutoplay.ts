/**
 * Auto-play side effects + hover handlers for `useCarousel`. The
 * `isAutoPlaying` and `wasAutoPlayingBeforeHover` state lives in the main
 * hook (so `goToSlide` can include `isAutoPlaying` in its dependency
 * array, preserving the original closure-snapshot semantics); this hook
 * is **controlled** — it receives state + setter from its parent.
 *
 * Phase 3.2.c (audit/2026-05-08): one of three sub-modules of the
 * formerly-365-LoC `useCarousel` hook.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  SafeInterval,
  CleanupManager,
  MutexLock,
  StateMachine,
} from '@/lib/utils/RaceConditionPrevention';

/** Carousel state-machine literal — shared with the main hook. */
export type CarouselState = 'idle' | 'playing' | 'paused' | 'transitioning';

interface UseCarouselAutoplayArgs {
  totalSlides: number;
  autoPlayInterval: number;
  pauseOnHover: boolean;
  componentName: string;
  /** Controlled auto-play state — owned by the parent hook. */
  isAutoPlaying: boolean;
  setIsAutoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  /** Controlled "was auto-playing before hover" flag — also owned by parent. */
  wasAutoPlayingBeforeHover: boolean;
  setWasAutoPlayingBeforeHover: React.Dispatch<React.SetStateAction<boolean>>;
  /** State machine shared with the main hook so transitions stay coherent. */
  carouselStateRef: React.MutableRefObject<StateMachine<CarouselState>>;
  mutexRef: React.MutableRefObject<MutexLock>;
  cleanupManagerRef: React.MutableRefObject<CleanupManager>;
  /** Callback to advance one slide; invoked by the auto-play interval. */
  goToSlideAuto: () => void;
  onPlayPause?: (isPlaying: boolean) => void;
}

export interface UseCarouselAutoplayReturn {
  togglePlayPause: () => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

export function useCarouselAutoplay({
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
}: UseCarouselAutoplayArgs): UseCarouselAutoplayReturn {
  const intervalRef = useRef<SafeInterval | null>(null);

  // Auto-rotation effect — guarded by the mutex so it doesn't race with
  // user-initiated transitions. The `cancelled` flag is a strict
  // improvement over the pre-split version: it prevents the interval
  // from being scheduled if the effect cleanup ran before the async
  // mutex acquire resolved (small race that could leak a SafeInterval).
  useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return;

    let cancelled = false;
    const startAutoRotation = async () => {
      const acquired = await mutexRef.current.acquire();
      if (!acquired || cancelled) return;

      try {
        intervalRef.current = new SafeInterval(componentName);
        intervalRef.current.set(() => {
          if (carouselStateRef.current.canTransitionTo('transitioning')) {
            goToSlideAuto();
          }
        }, autoPlayInterval);

        cleanupManagerRef.current.add(() => {
          intervalRef.current?.clear();
        });

        carouselStateRef.current.transitionTo('playing');
      } finally {
        mutexRef.current.release();
      }
    };

    startAutoRotation();

    return () => {
      cancelled = true;
      intervalRef.current?.clear();
    };
  }, [
    isAutoPlaying,
    totalSlides,
    autoPlayInterval,
    componentName,
    goToSlideAuto,
    carouselStateRef,
    mutexRef,
    cleanupManagerRef,
  ]);

  const togglePlayPause = useCallback(() => {
    setIsAutoPlaying((prev) => {
      const next = !prev;
      onPlayPause?.(next);
      carouselStateRef.current.transitionTo(next ? 'playing' : 'paused');
      return next;
    });
  }, [onPlayPause, carouselStateRef, setIsAutoPlaying]);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover && isAutoPlaying) {
      setWasAutoPlayingBeforeHover(true);
      setIsAutoPlaying(false);
      carouselStateRef.current.transitionTo('paused');
    }
  }, [pauseOnHover, isAutoPlaying, carouselStateRef, setIsAutoPlaying, setWasAutoPlayingBeforeHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover && wasAutoPlayingBeforeHover) {
      setIsAutoPlaying(true);
      setWasAutoPlayingBeforeHover(false);
      carouselStateRef.current.transitionTo('playing');
    }
  }, [pauseOnHover, wasAutoPlayingBeforeHover, carouselStateRef, setIsAutoPlaying, setWasAutoPlayingBeforeHover]);

  return {
    togglePlayPause,
    handleMouseEnter,
    handleMouseLeave,
  };
}
