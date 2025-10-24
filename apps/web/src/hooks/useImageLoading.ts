/**
 * useImageLoading Hook
 *
 * Domain-Driven Design: Reusable image loading state management
 * Code Reusability & DRY: Eliminates duplicated image loading logic across 6 components
 * Error Handling: Tracks both successful loads and errors
 *
 * Used by: ProductCarousel, AppFeaturesCarousel, FeatureShowcase, OneFeature, HeroSection
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export interface UseImageLoadingOptions {
  /**
   * Total number of images to track (optional)
   * If provided, enables allLoaded calculation
   */
  totalImages?: number;

  /**
   * Callback when all images have loaded (optional)
   */
  onAllLoaded?: () => void;
}

export interface UseImageLoadingReturn {
  /**
   * Mark an image as loaded
   * @param imageId - Unique identifier for the image
   */
  handleImageLoad: (imageId: string) => void;

  /**
   * Mark an image as failed to load
   * @param imageId - Unique identifier for the image
   */
  handleImageError: (imageId: string) => void;

  /**
   * Check if an image has an error
   * @param imageId - Unique identifier for the image
   * @returns true if image failed to load
   */
  hasError: (imageId: string) => boolean;

  /**
   * Check if an image has loaded successfully
   * @param imageId - Unique identifier for the image
   * @returns true if image loaded successfully
   */
  isLoaded: (imageId: string) => boolean;

  /**
   * Number of images that have loaded (successfully or with error)
   */
  loadedCount: number;

  /**
   * All images have loaded (only meaningful if totalImages is provided)
   */
  allLoaded: boolean;

  /**
   * Reset all loading state
   */
  reset: () => void;
}

export function useImageLoading({
  totalImages,
  onAllLoaded
}: UseImageLoadingOptions = {}): UseImageLoadingReturn {
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [loadedCount, setLoadedCount] = useState(0);

  /**
   * Mark an image as successfully loaded
   */
  const handleImageLoad = useCallback((imageId: string) => {
    setImagesLoaded(prev => {
      // Prevent duplicate updates
      if (prev[imageId]) return prev;

      const next = { ...prev, [imageId]: true };
      setLoadedCount(Object.keys(next).length);
      return next;
    });
  }, []);

  /**
   * Mark an image as failed to load
   * Also counts as "loaded" to prevent blocking
   */
  const handleImageError = useCallback((imageId: string) => {
    setImageErrors(prev => new Set(prev).add(imageId));
    // Count as loaded to prevent blocking
    handleImageLoad(imageId);
  }, [handleImageLoad]);

  /**
   * Check if an image has an error
   */
  const hasError = useCallback((imageId: string) => {
    return imageErrors.has(imageId);
  }, [imageErrors]);

  /**
   * Check if an image has loaded
   */
  const isLoaded = useCallback((imageId: string) => {
    return imagesLoaded[imageId] || false;
  }, [imagesLoaded]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setImagesLoaded({});
    setImageErrors(new Set());
    setLoadedCount(0);
  }, []);

  /**
   * Calculate if all images are loaded
   */
  const allLoaded = totalImages ? loadedCount >= totalImages : false;

  /**
   * Call onAllLoaded callback when all images finish loading
   */
  useEffect(() => {
    if (allLoaded && onAllLoaded) {
      onAllLoaded();
    }
  }, [allLoaded, onAllLoaded]);

  return {
    handleImageLoad,
    handleImageError,
    hasError,
    isLoaded,
    loadedCount,
    allLoaded,
    reset
  };
}
