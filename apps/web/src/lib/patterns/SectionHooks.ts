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

// ================================
// RE-EXPORTS FOR BACKWARDS COMPATIBILITY
// ================================

// Loading state hook
export { useSectionLoading } from './useSectionLoading';

// Analytics hook
export { useSectionAnalytics } from './useSectionAnalytics';

// Navigation hook
export { useSectionNavigation, type NavigationMethod } from './useSectionNavigation';

// Input navigation hooks
export {
  useKeyboardNavigation,
  useTouchNavigation,
  type NavigationDirection,
  type SwipeDirection
} from './useInputNavigation';

// Utility functions
export { getSessionId, clearSessionId } from './hookUtils';
