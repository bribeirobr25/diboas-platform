/**
 * Waiting List Constants
 *
 * Configuration values for the waiting list feature
 * Following DRY principles and centralized configuration
 */

import { WaitingListConfiguration } from './domain/WaitingListDomain';

export const WAITING_LIST_CONFIG: WaitingListConfiguration = {
  consentVersion: '1.0.0',
  privacyPolicyVersion: '2024.1',
  privacyPolicyUrl: '/privacy',
  maxNameLength: 100,
  maxXAccountLength: 50,
  storageKey: 'diboas_waiting_list',
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  xAccount: /^@?[a-zA-Z0-9_]{1,15}$/,
  name: /^[\p{L}\p{M}\s'-]{1,100}$/u,
} as const;

// Error codes mapping to i18n keys
export const ERROR_CODES = {
  INVALID_EMAIL: 'common.waitingList.errors.invalidEmail',
  INVALID_NAME: 'common.waitingList.errors.invalidName',
  INVALID_X_ACCOUNT: 'common.waitingList.errors.invalidXAccount',
  CONSENT_REQUIRED: 'common.waitingList.errors.consentRequired',
  EMAIL_REQUIRED: 'common.waitingList.errors.emailRequired',
  DUPLICATE_EMAIL: 'common.waitingList.errors.duplicateEmail',
  SUBMISSION_FAILED: 'common.waitingList.errors.submissionFailed',
  STORAGE_ERROR: 'common.waitingList.errors.storageError',
} as const;

// Event types for analytics
export const WAITING_LIST_EVENTS = {
  MODAL_OPENED: 'waiting_list_modal_opened',
  MODAL_CLOSED: 'waiting_list_modal_closed',
  FORM_SUBMITTED: 'waiting_list_form_submitted',
  FORM_VALIDATION_ERROR: 'waiting_list_form_validation_error',
  SUBMISSION_SUCCESS: 'waiting_list_submission_success',
  SUBMISSION_FAILURE: 'waiting_list_submission_failure',
} as const;

// XSS prevention - allowed HTML tags (none for waiting list)
export const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
} as const;
