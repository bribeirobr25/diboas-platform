/**
 * Shared Section Utility Functions
 *
 * Reusable utilities extracted from FeatureShowcase component
 * Provides common functionality across all sections
 *
 * Performance & SEO Optimization: Optimized utility functions
 * Error Handling & System Recovery: Error-resilient implementations
 * No Hard-coded Values: Configuration-driven utilities
 * Service Agnostic Abstraction: Provider-agnostic implementations
 */

// ================================
// RE-EXPORTS FOR BACKWARDS COMPATIBILITY
// ================================

// Re-export sanitizeText from original location
export { sanitizeText } from '@/lib/utils/sanitize';

// Configuration utilities
export { mergeSectionConfig, validateSectionConfig } from './configUtils';

// Image utilities
export {
  preloadImages,
  preloadImage,
  generateImageSizes,
  getOptimizedImageDimensions
} from './imageUtils';

// Function utilities
export {
  throttle,
  debounce,
  createPerformanceMonitor
} from './functionUtils';

// Error handling utilities
export {
  createSectionErrorBoundary,
  retryWithBackoff
} from './errorUtils';

// Design token utilities
export {
  generateTokenName,
  validateCSSDesignTokens,
  generateMediaQueries
} from './tokenUtils';

// Accessibility utilities
export {
  generateAriaAttributes,
  announceToScreenReader,
  validateUrl,
  generateId
} from './accessibilityUtils';
