/**
 * Error Handling - Public API
 *
 * Exports for section error boundary and utilities
 */

// Main error boundary
export { SectionErrorBoundary } from './SectionErrorBoundary';
export type { SectionErrorTranslations, SectionErrorFallbackProps } from './SectionErrorBoundary';

// HOC wrapper
export { withSectionErrorBoundary } from './withSectionErrorBoundary';

// Default fallback component (for customization)
export { DefaultSectionErrorFallback } from './DefaultSectionErrorFallback';

// Types
export type {
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState,
  ErrorSeverity,
} from './types';

// Constants
export { MAX_RETRY_COUNT, RETRY_DELAY_BASE, DEFAULT_SECTION_TRANSLATIONS } from './constants';

// Utilities
export {
  generateErrorId,
  determineSeverity,
  shouldAttemptRecovery,
  calculateRetryDelay,
} from './errorUtils';
