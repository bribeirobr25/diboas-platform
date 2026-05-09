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
  isValidEmail,
  generateReferralCode,
  isValidReferralCode,
  generateReferralUrl,
  formatPosition,
  setReferralStorage,
  getReferralFromStorage,
} from './helpers';

// Store
export * from './store';

// Application Service
export {
  WaitlistApplicationService,
  waitlistApplicationService,
  type SubmitSignupInput,
  type SubmitSignupResult,
  type SubmitSignupSuccess,
  type SubmitSignupError,
  type RequestDeletionInput,
  type RequestDeletionResult,
  type ConfirmDeletionInput,
  type ConfirmDeletionResult,
} from './WaitlistApplicationService';
