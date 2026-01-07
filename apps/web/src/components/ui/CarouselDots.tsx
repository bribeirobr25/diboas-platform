'use client';

/**
 * CarouselDots - Reusable Carousel Dot Navigation
 *
 * DRY Principle: Consolidates the repeated pattern of dot-based
 * carousel navigation across ProductCarousel, FeatureShowcase,
 * and AppFeaturesCarousel components.
 */

import React from 'react';
import styles from './CarouselDots.module.css';

export interface CarouselDotsProps {
  /** Total number of slides */
  totalSlides: number;
  /** Currently active slide index */
  currentIndex: number;
  /** Callback when a dot is clicked */
  onDotClick: (index: number) => void;
  /** Whether navigation is temporarily disabled (e.g., during transitions) */
  disabled?: boolean;
  /** Aria label pattern for accessibility (use {index} and {total} placeholders) */
  ariaLabelPattern?: string;
  /** Additional CSS class */
  className?: string;
  /** Dot size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Dot navigation for carousels. Provides accessible keyboard navigation
 * and visual feedback for current slide position.
 */
export function CarouselDots({
  totalSlides,
  currentIndex,
  onDotClick,
  disabled = false,
  ariaLabelPattern = 'Go to slide {index} of {total}',
  className = '',
  size = 'md',
}: CarouselDotsProps) {
  // Don't render if there's only one slide
  if (totalSlides <= 1) {
    return null;
  }

  const getAriaLabel = (index: number) => {
    return ariaLabelPattern
      .replace('{index}', String(index + 1))
      .replace('{total}', String(totalSlides));
  };

  return (
    <div
      className={`${styles.dotsContainer} ${styles[size]} ${className}`}
      role="tablist"
      aria-label="Carousel navigation"
    >
      {Array.from({ length: totalSlides }, (_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
          aria-label={getAriaLabel(index)}
          aria-selected={index === currentIndex}
          role="tab"
          disabled={disabled}
          tabIndex={index === currentIndex ? 0 : -1}
        />
      ))}
    </div>
  );
}
