/**
 * Waiting List Constants
 *
 * Configuration values for the waiting list feature
 * Following DRY principles and centralized configuration
 */

import { WaitingListConfiguration } from './domain/WaitingListDomain';
import {
  APP_URL,
  WAITLIST_STORAGE_KEYS,
  REFERRAL_COOKIE_CONFIG,
  KIT_CONFIG as ENV_KIT_CONFIG,
} from '@/config/env';

export const WAITING_LIST_CONFIG: WaitingListConfiguration = {
  consentVersion: '1.0.0',
  privacyPolicyVersion: '2024.1',
  privacyPolicyUrl: '/privacy',
  maxNameLength: 100,
  maxXAccountLength: 50,
  storageKey: WAITLIST_STORAGE_KEYS.main,
};

// Kit.com (ConvertKit) integration configuration
export const KIT_CONFIG = {
  // API configuration - credentials loaded from environment
  apiBaseUrl: ENV_KIT_CONFIG.apiBaseUrl,
  // Form ID for waitlist signups (set via KIT_FORM_ID env var)
  formId: ENV_KIT_CONFIG.formId,
  // Tag IDs for segmentation
  tags: ENV_KIT_CONFIG.tags,
  // Custom field names in Kit.com
  customFields: {
    position: 'waitlist_position',
    referralCode: 'referral_code',
    referredBy: 'referred_by',
    referralCount: 'referral_count',
    locale: 'locale',
    xAccount: 'x_account',
  },
} as const;

// Referral mechanics configuration
export const REFERRAL_CONFIG = {
  // Spots moved up per successful referral
  spotsPerReferral: 10,
  // Base URL for referral links
  referralBaseUrl: APP_URL,
  // Referral code prefix (for identification)
  codePrefix: REFERRAL_COOKIE_CONFIG.codePrefix,
  // Code length (excluding prefix)
  codeLength: 6,
  // Cookie name for tracking referral attribution
  referralCookieName: REFERRAL_COOKIE_CONFIG.name,
  // Cookie expiry in days
  referralCookieExpiry: REFERRAL_COOKIE_CONFIG.expiryDays,
} as const;

// Position storage keys for local fallback
export const POSITION_STORAGE_KEYS = {
  email: WAITLIST_STORAGE_KEYS.email,
  position: WAITLIST_STORAGE_KEYS.position,
  referralCode: WAITLIST_STORAGE_KEYS.referralCode,
  referralCount: WAITLIST_STORAGE_KEYS.referralCount,
} as const;

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
  // Referral events
  REFERRAL_LINK_COPIED: 'waitlist_referral_link_copied',
  REFERRAL_LINK_SHARED: 'waitlist_referral_link_shared',
  REFERRAL_SIGNUP: 'waitlist_referral_signup',
  POSITION_UPDATED: 'waitlist_position_updated',
  // Share events
  SHARE_MODAL_OPENED: 'waitlist_share_modal_opened',
  SHARE_INITIATED: 'waitlist_share_initiated',
  SHARE_COMPLETED: 'waitlist_share_completed',
  SHARE_CANCELLED: 'waitlist_share_cancelled',
  CARD_GENERATED: 'waitlist_card_generated',
  CARD_DOWNLOADED: 'waitlist_card_downloaded',
} as const;

// XSS prevention - allowed HTML tags (none for waiting list)
export const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
} as const;
