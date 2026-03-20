/**
 * WaitingList Module - Public API
 */

// Types
export * from './types';

// Constants
export {
  WAITING_LIST_CONFIG,
  REFERRAL_CONFIG,
  POSITION_STORAGE_KEYS,
  VALIDATION_PATTERNS,
  ERROR_CODES,
  WAITING_LIST_EVENTS,
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
  generateReferralCode,
  isValidReferralCode,
  extractReferralFromUrl,
  generateReferralUrl,
  formatPosition,
  setReferralStorage,
  getReferralFromStorage,
  clearReferralStorage,
} from './helpers';

// Store
export * from './store';

// Application Service
export {
  WaitlistApplicationService,
  waitlistApplicationService,
  type SignupInput,
  type SignupResult,
  type SignupError,
} from './WaitlistApplicationService';
