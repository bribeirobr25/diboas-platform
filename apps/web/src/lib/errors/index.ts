/**
 * Errors Module - Public API
 */

// Error types and enums
export * from './errorTypes';

// Error configuration
export { DEFAULT_ERROR_CONFIG, SENSITIVE_KEYS } from './errorConfig';

// Error utilities
export {
  generateErrorId,
  determineSeverity,
  shouldAttemptRecovery,
  calculateRetryDelay,
} from './errorUtils';

// Error inference utilities
export {
  mapSeverity,
  inferSeverity,
  inferCategory,
  inferRecoverability,
  generateFingerprint,
  sanitizeContext,
  buildTags,
  generateSessionId,
} from './errorInference';

// Breadcrumb manager
export { BreadcrumbManager } from './breadcrumbManager';

// Occurrence tracker
export { OccurrenceTracker } from './occurrenceTracker';

// Error reporter interface
export type { IErrorReporter } from './errorReporterInterface';

// Error reporting service
export {
  ErrorReportingService,
  errorReportingService,
} from './ErrorReportingService';

// Section error boundary types
export type {
  SectionErrorTranslations,
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState,
  SectionErrorFallbackProps,
} from './types';

// Section error boundary constants
export { MAX_RETRY_COUNT, RETRY_DELAY_BASE, DEFAULT_SECTION_TRANSLATIONS } from './constants';
