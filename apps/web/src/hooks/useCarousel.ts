/**
 * useCarousel Hook
 *
 * Domain-Driven Design: Reusable carousel state and navigation management
 * Code Reusability & DRY: Eliminates duplicated carousel logic across 4 components
 * Error Handling: Gracefully handles edge cases (single slide, invalid indices)
 * Concurrency Prevention: Uses StateMachine, MutexLock, and SafeInterval
 *
 * Used by: ProductCarousel, AppFeaturesCarousel, FeatureShowcase (2 variants)
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SafeInterval, SafeTimer, CleanupManager, MutexLock, StateMachine } from '@/lib/utils/RaceConditionPrevention';
import { Logger } from '@/lib/monitoring/Logger';

export interface UseCarouselOptions {
  /**
   * Total number of slides in the carousel
   */
  totalSlides: number;

  /**
   * Enable automatic slide rotation
   * @default true
   */
  autoPlay?: boolean;

  /**
   * Auto-play interval in milliseconds
   * @default 4000
   */
  autoPlayInterval?: number;

  /**
   * Slide transition duration in milliseconds
   * @default 500
   */
  transitionDuration?: number;

  /**
   * Pause auto-play on hover
   * @default true
   */
  pauseOnHover?: boolean;

  /**
   * Enable keyboard navigation (arrow keys)
   * @default true
   */
  enableKeyboard?: boolean;

  /**
   * Component name for logging and debugging
   */
  componentName: string;

  /**
   * Callback when slide changes
   */
  onSlideChange?: (index: number) => void;

  /**
   * Callback when user navigates (next/prev)
   */
  onNavigate?: (direction: 'next' | 'prev') => void;

  /**
   * Callback when play/pause state changes
   */
  onPlayPause?: (isPlaying: boolean) => void;

  /**
   * Initial slide index
   * @default 0
   */
  initialSlide?: number;
}

export interface UseCarouselReturn {
  /**
   * Current active slide index
   */
  currentSlideIndex: number;

  /**
   * Whether carousel is currently transitioning
   */
  isTransitioning: boolean;

  /**
   * Whether carousel is auto-playing
   */
  isAutoPlaying: boolean;

  /**
   * Navigate to specific slide
   */
  goToSlide: (index: number) => void;

  /**
   * Navigate to next slide
   */
  goToNext: () => void;

  /**
   * Navigate to previous slide
   */
  goToPrev: () => void;

  /**
   * Keyboard event handler
   * Attach to onKeyDown prop
   */
  handleKeyDown: (e: React.KeyboardEvent) => void;

  /**
   * Mouse enter handler for pause on hover
   * Attach to onMouseEnter prop
   */
  handleMouseEnter: () => void;

  /**
   * Mouse leave handler for pause on hover
   * Attach to onMouseLeave prop
   */
  handleMouseLeave: () => void;

  /**
   * Toggle play/pause state
   */
  togglePlayPause: () => void;

  /**
   * Reset carousel to initial state
   */
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
  initialSlide = 0
}: UseCarouselOptions): UseCarouselReturn {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlide);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [wasAutoPlayingBeforeHover, setWasAutoPlayingBeforeHover] = useState(false);

  const cleanupManagerRef = useRef(new CleanupManager(componentName));
  const mutexRef = useRef(new MutexLock(componentName));
  const intervalRef = useRef<SafeInterval | null>(null);
  const timerRef = useRef<SafeTimer | null>(null);

  // State machine for carousel states
  const carouselStateRef = useRef(
    new StateMachine('idle', {
      idle: ['playing', 'paused'],
      playing: ['paused', 'transitioning'],
      paused: ['playing'],
      transitioning: ['playing', 'paused', 'idle']
    }, componentName)
  );

  /**
   * Navigate to specific slide with race condition prevention
   */
  const goToSlide = useCallback(async (index: number) => {
    if (index < 0 || index >= totalSlides || index === currentSlideIndex) return;

    const acquired = await mutexRef.current.acquire();
    if (!acquired) return;

    try {
      setIsTransitioning(true);
      carouselStateRef.current.transitionTo('transitioning');

      setCurrentSlideIndex(index);
      onSlideChange?.(index);

      Logger.info(`${componentName} slide changed`, {
        section: componentName,
        slideIndex: index
      });

      Logger.debug(`${componentName} slide change`, {
        slideIndex: index
      });

      // Schedule transition end
      timerRef.current = new SafeTimer(componentName);
      timerRef.current.set(() => {
        setIsTransitioning(false);
        carouselStateRef.current.transitionTo(isAutoPlaying ? 'playing' : 'paused');
      }, transitionDuration);

    } finally {
      mutexRef.current.release();
    }
  }, [totalSlides, currentSlideIndex, componentName, onSlideChange, transitionDuration, isAutoPlaying]);

  /**
   * Navigate to next slide
   */
  const goToNext = useCallback(() => {
    const nextIndex = (currentSlideIndex + 1) % totalSlides;
    goToSlide(nextIndex);
    onNavigate?.('next');
  }, [currentSlideIndex, totalSlides, goToSlide, onNavigate]);

  /**
   * Navigate to previous slide
   */
  const goToPrev = useCallback(() => {
    const prevIndex = currentSlideIndex === 0 ? totalSlides - 1 : currentSlideIndex - 1;
    goToSlide(prevIndex);
    onNavigate?.('prev');
  }, [currentSlideIndex, totalSlides, goToSlide, onNavigate]);

  /**
   * Auto-rotation logic with race condition prevention
   */
  useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return;

    const startAutoRotation = async () => {
      const acquired = await mutexRef.current.acquire();
      if (!acquired) return;

      try {
        intervalRef.current = new SafeInterval(componentName);
        intervalRef.current.set(() => {
          if (carouselStateRef.current.canTransitionTo('transitioning')) {
            goToNext();
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
      intervalRef.current?.clear();
    };
  }, [isAutoPlaying, totalSlides, autoPlayInterval, componentName, goToNext]);

  /**
   * Toggle play/pause state
   */
  const togglePlayPause = useCallback(() => {
    setIsAutoPlaying(prev => {
      const newValue = !prev;
      onPlayPause?.(newValue);
      carouselStateRef.current.transitionTo(newValue ? 'playing' : 'paused');
      return newValue;
    });
  }, [onPlayPause]);

  /**
   * Keyboard navigation handler
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboard || isTransitioning) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        goToPrev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;
      default:
        break;
    }
  }, [enableKeyboard, isTransitioning, goToPrev, goToNext, togglePlayPause, goToSlide, totalSlides]);

  /**
   * Mouse enter handler for pause on hover
   */
  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover && isAutoPlaying) {
      setWasAutoPlayingBeforeHover(true);
      setIsAutoPlaying(false);
      carouselStateRef.current.transitionTo('paused');
    }
  }, [pauseOnHover, isAutoPlaying]);

  /**
   * Mouse leave handler for resume on hover exit
   */
  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover && wasAutoPlayingBeforeHover) {
      setIsAutoPlaying(true);
      setWasAutoPlayingBeforeHover(false);
      carouselStateRef.current.transitionTo('playing');
    }
  }, [pauseOnHover, wasAutoPlayingBeforeHover]);

  /**
   * Reset carousel to initial state
   */
  const reset = useCallback(() => {
    setCurrentSlideIndex(initialSlide);
    setIsAutoPlaying(autoPlay);
    setIsTransitioning(false);
    setWasAutoPlayingBeforeHover(false);
    carouselStateRef.current.transitionTo('idle');
  }, [initialSlide, autoPlay]);

  /**
   * Cleanup on unmount
   */
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
    reset
  };
}
