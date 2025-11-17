/**
 * Waiting List - Public API
 *
 * Exports domain types, services, and utilities
 * Following clean architecture principles
 */

// Domain Layer
export * from './domain/WaitingListDomain';

// Service Layer
export { WaitingListService, waitingListService } from './services/WaitingListService';

// Types (including presentation types)
export * from './types';

// Constants
export {
  WAITING_LIST_CONFIG,
  VALIDATION_PATTERNS,
  ERROR_CODES,
  WAITING_LIST_EVENTS,
  SANITIZATION_CONFIG,
} from './constants';

// Helpers
export {
  generateSubmissionId,
  isValidEmail,
  isValidXAccount,
  isValidName,
  normalizeXAccount,
  createConsentTimestamp,
  formatSubmissionDate,
  isStorageAvailable,
  truncateString,
} from './helpers';
