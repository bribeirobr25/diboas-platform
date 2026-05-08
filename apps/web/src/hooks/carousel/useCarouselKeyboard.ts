/**
 * Keyboard navigation handler for `useCarousel` — split out from the main
 * hook to keep that file focused on navigation state.
 *
 * Phase 3.2.c (audit/2026-05-08): one of three sub-modules of the
 * formerly-365-LoC `useCarousel` hook.
 */

'use client';

import { useCallback } from 'react';

interface UseCarouselKeyboardArgs {
  enableKeyboard: boolean;
  isTransitioning: boolean;
  totalSlides: number;
  goToPrev: () => void;
  goToNext: () => void;
  goToSlide: (index: number) => void;
  togglePlayPause: () => void;
}

export function useCarouselKeyboard({
  enableKeyboard,
  isTransitioning,
  totalSlides,
  goToPrev,
  goToNext,
  goToSlide,
  togglePlayPause,
}: UseCarouselKeyboardArgs): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
} {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    [enableKeyboard, isTransitioning, totalSlides, goToPrev, goToNext, goToSlide, togglePlayPause],
  );

  return { handleKeyDown };
}
