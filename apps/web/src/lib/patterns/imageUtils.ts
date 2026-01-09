/**
 * Section Image Utilities
 *
 * Image preloading and optimization
 */

import { Logger } from '@/lib/monitoring/Logger';
import type { SectionBreakpoints } from './SectionPattern';

/**
 * Preload images for performance optimization
 */
export function preloadImages(imagePaths: string[]): Promise<void[]> {
  const promises = imagePaths.map(path => preloadImage(path));
  return Promise.allSettled(promises).then(results => {
    const successful = results.filter(result => result.status === 'fulfilled');
    const failed = results.filter(result => result.status === 'rejected');

    Logger.debug('Image preloading completed', {
      total: imagePaths.length,
      successful: successful.length,
      failed: failed.length
    });

    return successful.map(() => undefined);
  });
}

/**
 * Preload a single image
 */
export function preloadImage(imagePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!imagePath) {
      reject(new Error('Image path is required'));
      return;
    }

    const img = new Image();

    img.onload = () => {
      Logger.debug('Image preloaded successfully', { imagePath });
      resolve();
    };

    img.onerror = () => {
      const error = new Error(`Failed to preload image: ${imagePath}`);
      Logger.warn('Image preload failed', { imagePath, error: error.message });
      reject(error);
    };

    img.src = imagePath;
  });
}

/**
 * Generate responsive image sizes string
 */
export function generateImageSizes(
  breakpoints: SectionBreakpoints,
  sizeMap: {
    mobile: number;
    tablet: number;
    desktop: number;
  }
): string {
  return [
    `(max-width: ${breakpoints.mobile}px) ${sizeMap.mobile}px`,
    `(max-width: ${breakpoints.tablet}px) ${sizeMap.tablet}px`,
    `${sizeMap.desktop}px`
  ].join(', ');
}

/**
 * Get optimized image dimensions based on device capabilities
 */
export function getOptimizedImageDimensions(
  baseWidth: number,
  baseHeight: number,
  devicePixelRatio: number = typeof window !== 'undefined' ? window.devicePixelRatio : 1
): { width: number; height: number } {
  // Cap at 3x for performance while maintaining quality
  const effectiveRatio = Math.min(devicePixelRatio, 3);

  return {
    width: Math.round(baseWidth * effectiveRatio),
    height: Math.round(baseHeight * effectiveRatio)
  };
}
